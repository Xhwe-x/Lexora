import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const SYNC_SCHEMA_VERSION = 1;
export const DEFAULT_SYNC_MAX_BYTES = 512_000;
export const MAX_USER_ID_LENGTH = 64;
export const SAFE_USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export class SyncPayloadError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "SyncPayloadError";
    this.status = status;
    this.expose = true;
  }
}

class SyncStoreError extends Error {
  constructor() {
    super("Sync storage is unavailable.");
    this.name = "SyncStoreError";
    this.expose = false;
  }
}

function fail(status, message) {
  throw new SyncPayloadError(status, message);
}

export function isSafeUserId(userId) {
  return typeof userId === "string" && SAFE_USER_ID_PATTERN.test(userId);
}

export function assertSafeUserId(userId) {
  if (!isSafeUserId(userId)) {
    fail(400, "The user ID is invalid.");
  }
  return userId;
}

function isJsonValue(value, depth = 0) {
  if (depth > 50) {
    return false;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, depth + 1));
  }
  if (typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  return Object.entries(value).every(([key, item]) => {
    return key.length <= 512 && isJsonValue(item, depth + 1);
  });
}

function serializedByteLength(value) {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? -1 : Buffer.byteLength(serialized, "utf8");
  } catch {
    return -1;
  }
}

function assertPositiveLimit(maxBytes) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new SyncStoreError();
  }
  return maxBytes;
}

export function validateSyncPayload(payload, maxBytes = DEFAULT_SYNC_MAX_BYTES) {
  const byteLimit = assertPositiveLimit(maxBytes);
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.getPrototypeOf(payload) !== Object.prototype
  ) {
    fail(400, "The sync payload must be a JSON object.");
  }
  if (payload.version !== SYNC_SCHEMA_VERSION) {
    fail(400, "The sync payload version is not supported.");
  }

  const hasData = Object.prototype.hasOwnProperty.call(payload, "data");
  const hasState = Object.prototype.hasOwnProperty.call(payload, "state");
  if (hasData === hasState) {
    fail(400, "The sync payload must contain exactly one state field.");
  }

  const state = hasData ? payload.data : payload.state;
  if (!isJsonValue(state) || state === null || Array.isArray(state)) {
    fail(400, "The sync state must be a JSON object.");
  }

  const byteLength = serializedByteLength(payload);
  if (byteLength < 0) {
    fail(400, "The sync payload is not valid JSON data.");
  }
  if (byteLength > byteLimit) {
    fail(413, "The sync payload is too large.");
  }

  return payload;
}

export function getDefaultSyncDataDir() {
  const platformDataDir =
    process.env.LOCALAPPDATA ||
    process.env.XDG_DATA_HOME ||
    path.join(os.homedir(), ".local", "share");
  return path.join(platformDataDir, "Lexora", "sync");
}

function resolveDataDir(dataDir) {
  if (typeof dataDir !== "string" || dataDir.trim().length === 0) {
    throw new SyncStoreError();
  }
  try {
    return path.resolve(dataDir);
  } catch {
    throw new SyncStoreError();
  }
}

function userFilePath(dataDir, userId) {
  assertSafeUserId(userId);
  const filePath = path.resolve(dataDir, `${userId}.json`);
  if (path.dirname(filePath) !== dataDir) {
    throw new SyncStoreError();
  }
  return filePath;
}

async function closeQuietly(fileHandle) {
  if (!fileHandle) {
    return;
  }
  try {
    await fileHandle.close();
  } catch {
    // The original storage error is the only public outcome.
  }
}

async function removeQuietly(filePath) {
  try {
    await unlink(filePath);
  } catch {
    // Temporary-file cleanup is best effort.
  }
}

export function createSyncStore({
  dataDir = getDefaultSyncDataDir(),
  maxBytes = DEFAULT_SYNC_MAX_BYTES,
} = {}) {
  const resolvedDataDir = resolveDataDir(dataDir);
  const byteLimit = assertPositiveLimit(maxBytes);

  return {
    async read(userId) {
      const filePath = userFilePath(resolvedDataDir, userId);
      let raw;
      try {
        raw = await readFile(filePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") {
          return null;
        }
        throw new SyncStoreError();
      }

      if (Buffer.byteLength(raw, "utf8") > byteLimit) {
        throw new SyncStoreError();
      }
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new SyncStoreError();
      }
      try {
        return validateSyncPayload(payload, byteLimit);
      } catch {
        throw new SyncStoreError();
      }
    },

    async write(userId, payload) {
      userFilePath(resolvedDataDir, userId);
      validateSyncPayload(payload, byteLimit);
      const targetPath = userFilePath(resolvedDataDir, userId);
      const serialized = `${JSON.stringify(payload, null, 2)}\n`;
      if (Buffer.byteLength(serialized, "utf8") > byteLimit) {
        fail(413, "The sync payload is too large.");
      }

      let temporaryPath;
      let fileHandle;
      try {
        await mkdir(resolvedDataDir, { recursive: true, mode: 0o700 });
        temporaryPath = path.join(
          resolvedDataDir,
          `.${userId}.${randomBytes(16).toString("hex")}.tmp`,
        );
        fileHandle = await open(temporaryPath, "wx", 0o600);
        await fileHandle.writeFile(serialized, "utf8");
        await fileHandle.sync();
        await fileHandle.close();
        fileHandle = undefined;
        await rename(temporaryPath, targetPath);
        temporaryPath = undefined;
      } catch {
        await closeQuietly(fileHandle);
        if (temporaryPath) {
          await removeQuietly(temporaryPath);
        }
        throw new SyncStoreError();
      }
    },

    async remove(userId) {
      const filePath = userFilePath(resolvedDataDir, userId);
      try {
        await unlink(filePath);
      } catch (error) {
        if (error?.code === "ENOENT") {
          return;
        }
        throw new SyncStoreError();
      }
    },
  };
}
