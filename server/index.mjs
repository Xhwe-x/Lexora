import { createHash, timingSafeEqual } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  IMPORT_LIMITS,
  importTextFromUrl,
  parseSubtitleDocument,
} from "./import.mjs";
import {
  DEFAULT_SYNC_MAX_BYTES,
  createSyncStore,
  getDefaultSyncDataDir,
  validateSyncPayload,
} from "./store.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8_787;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const MAX_CONFIGURED_BYTES = 10_000_000;
const MAX_CONFIGURED_TIMEOUT_MS = 120_000;
const IMPORT_REQUEST_MAX_BYTES = 16_384;
const REQUEST_OVERHEAD_BYTES = 16_384;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.expose = true;
  }
}

function fail(status, message) {
  throw new HttpError(status, message);
}

function parseConfiguredInteger(env, name, fallback, maximum) {
  const rawValue = env[name];
  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }
  if (!/^\d+$/.test(String(rawValue))) {
    throw new Error("Invalid server configuration.");
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error("Invalid server configuration.");
  }
  return value;
}

function parsePort(env) {
  const rawValue = env.SYNC_PORT;
  if (rawValue === undefined || rawValue === "") {
    return DEFAULT_PORT;
  }
  if (!/^\d+$/.test(String(rawValue))) {
    throw new Error("Invalid server configuration.");
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 0 || value > 65_535) {
    throw new Error("Invalid server configuration.");
  }
  return value;
}

function parseAllowedOrigins(rawValue) {
  if (rawValue === undefined) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  if (rawValue.trim() === "") {
    return [];
  }
  const origins = rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.some((origin) => origin.length > 512 || origin === "*")) {
    throw new Error("Invalid server configuration.");
  }
  return [...new Set(origins)];
}

function normalizeConfig(config) {
  const limits = {
    importMaxBytes: IMPORT_LIMITS.maxBytes,
    importTimeoutMs: IMPORT_LIMITS.timeoutMs,
    subtitleMaxBytes: IMPORT_LIMITS.subtitleMaxBytes,
    syncMaxBytes: DEFAULT_SYNC_MAX_BYTES,
    requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    ...config.limits,
  };
  if (
    !Number.isSafeInteger(limits.importMaxBytes) ||
    limits.importMaxBytes < 1 ||
    limits.importMaxBytes > MAX_CONFIGURED_BYTES ||
    !Number.isSafeInteger(limits.importTimeoutMs) ||
    limits.importTimeoutMs < 1 ||
    limits.importTimeoutMs > MAX_CONFIGURED_TIMEOUT_MS ||
    !Number.isSafeInteger(limits.subtitleMaxBytes) ||
    limits.subtitleMaxBytes < 1 ||
    limits.subtitleMaxBytes > MAX_CONFIGURED_BYTES ||
    !Number.isSafeInteger(limits.syncMaxBytes) ||
    limits.syncMaxBytes < 1 ||
    limits.syncMaxBytes > MAX_CONFIGURED_BYTES ||
    !Number.isSafeInteger(limits.requestTimeoutMs) ||
    limits.requestTimeoutMs < 1 ||
    limits.requestTimeoutMs > MAX_CONFIGURED_TIMEOUT_MS
  ) {
    throw new Error("Invalid server configuration.");
  }

  return {
    ...config,
    limits: {
      ...limits,
      importRequestMaxBytes: IMPORT_REQUEST_MAX_BYTES,
      subtitleRequestMaxBytes: Math.min(
        MAX_CONFIGURED_BYTES,
        limits.subtitleMaxBytes + REQUEST_OVERHEAD_BYTES,
      ),
      syncRequestMaxBytes: Math.min(
        MAX_CONFIGURED_BYTES,
        limits.syncMaxBytes + REQUEST_OVERHEAD_BYTES,
      ),
    },
  };
}

export function loadConfig(env = process.env) {
  const syncToken =
    typeof env.SYNC_TOKEN === "string" &&
    env.SYNC_TOKEN.length > 0 &&
    !/\s/.test(env.SYNC_TOKEN)
      ? env.SYNC_TOKEN
      : null;
  const dataDir =
    typeof env.SYNC_DATA_DIR === "string" && env.SYNC_DATA_DIR.trim().length > 0
      ? env.SYNC_DATA_DIR
      : getDefaultSyncDataDir();
  const host =
    typeof env.SYNC_HOST === "string" && env.SYNC_HOST.trim().length > 0
      ? env.SYNC_HOST.trim()
      : DEFAULT_HOST;

  return normalizeConfig({
    host,
    port: parsePort(env),
    syncToken,
    dataDir,
    allowedOrigins: parseAllowedOrigins(env.SYNC_ALLOWED_ORIGINS),
    limits: {
      importMaxBytes: parseConfiguredInteger(
        env,
        "IMPORT_MAX_BYTES",
        IMPORT_LIMITS.maxBytes,
        MAX_CONFIGURED_BYTES,
      ),
      importTimeoutMs: parseConfiguredInteger(
        env,
        "IMPORT_TIMEOUT_MS",
        IMPORT_LIMITS.timeoutMs,
        MAX_CONFIGURED_TIMEOUT_MS,
      ),
      subtitleMaxBytes: parseConfiguredInteger(
        env,
        "SUBTITLE_MAX_BYTES",
        IMPORT_LIMITS.subtitleMaxBytes,
        MAX_CONFIGURED_BYTES,
      ),
      syncMaxBytes: parseConfiguredInteger(
        env,
        "SYNC_MAX_BYTES",
        DEFAULT_SYNC_MAX_BYTES,
        MAX_CONFIGURED_BYTES,
      ),
      requestTimeoutMs: parseConfiguredInteger(
        env,
        "REQUEST_TIMEOUT_MS",
        DEFAULT_REQUEST_TIMEOUT_MS,
        MAX_CONFIGURED_TIMEOUT_MS,
      ),
    },
  });
}

function isJsonContentType(contentType) {
  return (
    typeof contentType === "string" &&
    contentType.split(";", 1)[0].trim().toLowerCase() === "application/json"
  );
}

function readContentLength(request) {
  const rawValue = request.headers["content-length"];
  if (rawValue === undefined) {
    return null;
  }
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    fail(400, "The request headers are invalid.");
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    fail(413, "The request body is too large.");
  }
  return length;
}

function readRequestBody(request, maxBytes) {
  const declaredLength = readContentLength(request);
  if (declaredLength !== null && declaredLength > maxBytes) {
    fail(413, "The request body is too large.");
  }

  return new Promise((resolveBody, rejectBody) => {
    let totalBytes = 0;
    const chunks = [];
    let settled = false;

    const cleanup = () => {
      request.removeListener("data", onData);
      request.removeListener("end", onEnd);
      request.removeListener("error", onError);
      request.removeListener("aborted", onAborted);
    };
    const settleReject = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      rejectBody(error);
    };
    const onData = (chunk) => {
      if (settled) {
        return;
      }
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.byteLength;
      if (totalBytes > maxBytes) {
        settleReject(new HttpError(413, "The request body is too large."));
        request.resume();
        return;
      }
      chunks.push(buffer);
    };
    const onEnd = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolveBody(Buffer.concat(chunks).toString("utf8"));
    };
    const onError = () => {
      settleReject(new HttpError(400, "The request body could not be read."));
    };
    const onAborted = () => {
      settleReject(new HttpError(400, "The request body could not be read."));
    };

    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
    request.on("aborted", onAborted);
  });
}

async function readJsonBody(request, maxBytes) {
  if (!isJsonContentType(request.headers["content-type"])) {
    fail(415, "Content-Type must be application/json.");
  }
  const rawBody = await readRequestBody(request, maxBytes);
  if (rawBody.trim().length === 0) {
    fail(400, "The request body must be valid JSON.");
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    fail(400, "The request body must be valid JSON.");
  }
}

function writeHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  writeHeaders(response);
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", Buffer.byteLength(body, "utf8"));
  response.end(body);
}

function sendNoContent(response) {
  writeHeaders(response);
  response.statusCode = 204;
  response.end();
}

function sendError(response, error) {
  const isPublicError =
    error?.expose === true &&
    Number.isInteger(error.status) &&
    typeof error.message === "string";
  const safeError = isPublicError
    ? error
    : new HttpError(500, "The server could not complete the request.");
  sendJson(response, safeError.status, { error: safeError.message });
}

function applyCors(request, response, config) {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || origin.length === 0) {
    return true;
  }
  if (!config.allowedOrigins.includes(origin)) {
    return false;
  }
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Lexora-User-ID",
  );
  response.setHeader("Access-Control-Max-Age", "600");
  response.setHeader("Vary", "Origin");
  return true;
}

function sendMethodNotAllowed(response, allowedMethods) {
  response.setHeader("Allow", allowedMethods);
  sendJson(response, 405, { error: "Method not allowed." });
}

function requireObjectBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "The request body must be a JSON object.");
  }
  return body;
}

async function handleTextImport(request, response, config) {
  const body = requireObjectBody(
    await readJsonBody(request, config.limits.importRequestMaxBytes),
  );
  if (typeof body.url !== "string") {
    fail(400, "The request body must include a URL.");
  }
  const imported = await importTextFromUrl(body.url, {
    maxBytes: config.limits.importMaxBytes,
    timeoutMs: config.limits.importTimeoutMs,
    fetchImpl: config.fetchImpl,
  });
  sendJson(response, 200, imported);
}

async function handleSubtitleImport(request, response, config) {
  const body = requireObjectBody(
    await readJsonBody(
      request,
      config.limits.subtitleRequestMaxBytes,
    ),
  );
  if (typeof body.text !== "string") {
    fail(400, "The request body must include subtitle text.");
  }
  const parsed = parseSubtitleDocument(body.text, body.format, {
    maxBytes: config.limits.subtitleMaxBytes,
  });
  sendJson(response, 200, parsed);
}

function hasValidBearerToken(request, configuredToken) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return false;
  }
  const providedToken = authorization.slice("Bearer ".length);
  if (providedToken.length === 0) {
    return false;
  }
  const expected = Buffer.from(configuredToken, "utf8");
  const provided = Buffer.from(providedToken, "utf8");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function getSyncNamespaceId(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function requireSyncAccess(request, config) {
  if (!config.syncToken) {
    fail(503, "Sync is not configured.");
  }
  if (!hasValidBearerToken(request, config.syncToken)) {
    fail(401, "Sync authorization is required.");
  }
  return getSyncNamespaceId(config.syncToken);
}

async function handleSyncState(request, response, config) {
  const namespaceId = requireSyncAccess(request, config);
  if (request.method === "GET") {
    const payload = await config.store.read(namespaceId);
    if (payload === null) {
      fail(404, "Sync state was not found.");
    }
    sendJson(response, 200, payload);
    return;
  }

  if (request.method === "DELETE") {
    await config.store.remove(namespaceId);
    sendNoContent(response);
    return;
  }

  const payload = requireObjectBody(
    await readJsonBody(request, config.limits.syncRequestMaxBytes),
  );
  validateSyncPayload(payload, config.limits.syncMaxBytes);
  await config.store.write(namespaceId, payload);
  sendJson(response, 200, payload);
}

async function dispatchRequest(request, response, config) {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const pathname = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  if (pathname === "/health") {
    if (request.method !== "GET") {
      sendMethodNotAllowed(response, "GET");
      return;
    }
    sendJson(response, 200, { ok: true, status: "ok" });
    return;
  }

  if (pathname === "/api/import/text") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, "POST");
      return;
    }
    await handleTextImport(request, response, config);
    return;
  }

  if (pathname === "/api/import/subtitles") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, "POST");
      return;
    }
    await handleSubtitleImport(request, response, config);
    return;
  }

  if (pathname === "/api/sync/state") {
    if (!["GET", "PUT", "DELETE"].includes(request.method)) {
      sendMethodNotAllowed(response, "GET, PUT, DELETE");
      return;
    }
    await handleSyncState(request, response, config);
    return;
  }

  fail(404, "Route not found.");
}

export function createServer(options = {}) {
  const baseConfig = loadConfig(options.env ?? process.env);
  const suppliedConfig = options.config ?? {};
  const config = normalizeConfig({
    ...baseConfig,
    ...suppliedConfig,
    ...(options.host === undefined ? {} : { host: options.host }),
    ...(options.port === undefined ? {} : { port: options.port }),
    ...(options.syncToken === undefined ? {} : { syncToken: options.syncToken }),
    ...(options.dataDir === undefined ? {} : { dataDir: options.dataDir }),
    ...(options.allowedOrigins === undefined
      ? {}
      : { allowedOrigins: options.allowedOrigins }),
    limits: {
      ...baseConfig.limits,
      ...(suppliedConfig.limits ?? {}),
      ...(options.limits ?? {}),
    },
  });
  config.fetchImpl = options.fetchImpl ?? suppliedConfig.fetchImpl ?? globalThis.fetch;
  config.store =
    options.store ??
    suppliedConfig.store ??
    createSyncStore({
      dataDir: config.dataDir,
      maxBytes: config.limits.syncMaxBytes,
    });

  const server = createHttpServer(async (request, response) => {
    if (!applyCors(request, response, config)) {
      sendError(response, new HttpError(403, "Origin is not allowed."));
      return;
    }

    try {
      await dispatchRequest(request, response, config);
    } catch (error) {
      if (!response.headersSent) {
        sendError(response, error);
      } else {
        response.destroy();
      }
    }
  });
  server.requestTimeout = config.limits.requestTimeoutMs;
  server.headersTimeout = Math.min(
    config.limits.requestTimeoutMs,
    60_000,
  );
  server.keepAliveTimeout = 5_000;
  server.lexoraConfig = config;
  return server;
}

export async function startServer(options = {}) {
  const server = createServer(options);
  const config = server.lexoraConfig;
  await new Promise((resolveServer, rejectServer) => {
    const onError = (error) => {
      server.removeListener("listening", onListening);
      rejectServer(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolveServer();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(config.port, config.host);
  });
  return server;
}

export function stopServer(server) {
  if (!server || !server.listening) {
    return Promise.resolve();
  }
  return new Promise((resolveServer, rejectServer) => {
    server.close((error) => (error ? rejectServer(error) : resolveServer()));
  });
}

function isMainModule() {
  return (
    process.argv[1] !== undefined &&
    fileURLToPath(import.meta.url) === resolve(process.argv[1])
  );
}

if (isMainModule()) {
  let server;
  try {
    server = await startServer();
    const address = server.address();
    const displayAddress =
      typeof address === "object" && address !== null
        ? `${address.address}:${address.port}`
        : "configured address";
    console.log(`Lexora optional service listening on ${displayAddress}`);
  } catch {
    console.error("Lexora optional service could not start.");
    process.exitCode = 1;
  }

  if (server) {
    const shutdown = () => {
      void stopServer(server).finally(() => process.exit(0));
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
}
