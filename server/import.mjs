import { promises as dnsPromises } from "node:dns";

const DEFAULT_IMPORT_MAX_BYTES = 2_000_000;
const DEFAULT_IMPORT_TIMEOUT_MS = 8_000;
const DEFAULT_SUBTITLE_MAX_BYTES = 1_000_000;
const MAX_URL_LENGTH = 2_048;
const MAX_TITLE_LENGTH = 300;
const MAX_CUE_COUNT = 10_000;
const MAX_CUE_TEXT_LENGTH = 20_000;

const HTML_MEDIA_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
]);

const TEXT_MEDIA_TYPES = new Set([
  "text/plain",
  "text/markdown",
]);

const HTML_BLOCK_TAGS = [
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "td",
  "th",
  "tr",
  "ul",
];

const HTML_ELEMENTS_TO_REMOVE = [
  "script",
  "style",
  "nav",
  "noscript",
  "template",
  "head",
  "header",
  "footer",
  "aside",
  "form",
  "svg",
  "canvas",
  "iframe",
  "object",
  "embed",
  "video",
  "audio",
];

const NAMED_ENTITIES = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["hellip", "…"],
  ["ldquo", "“"],
  ["lsquo", "‘"],
  ["nbsp", " "],
  ["mdash", "—"],
  ["middot", "·"],
  ["ndash", "–"],
  ["quot", '"'],
  ["rdquo", "”"],
  ["rsquo", "’"],
  ["trade", "™"],
]);

export class ImportError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ImportError";
    this.status = status;
    this.expose = true;
  }
}

function fail(status, message) {
  throw new ImportError(status, message);
}

function normalizeText(value) {
  return value
    .replace(/\uFEFF/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeInlineText(value) {
  return decodeHtmlEntities(value)
    .replace(/\uFEFF/g, "")
    .replace(/[\r\n\t ]+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
}

export function decodeHtmlEntities(value) {
  return value.replace(
    /&(#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi,
    (entity, body) => {
      const normalizedBody = body.toLowerCase();
      if (NAMED_ENTITIES.has(normalizedBody)) {
        return NAMED_ENTITIES.get(normalizedBody);
      }

      if (normalizedBody.startsWith("#x")) {
        const codePoint = Number.parseInt(normalizedBody.slice(2), 16);
        return safeCodePoint(codePoint, entity);
      }

      if (normalizedBody.startsWith("#")) {
        const codePoint = Number.parseInt(normalizedBody.slice(1), 10);
        return safeCodePoint(codePoint, entity);
      }

      return entity;
    },
  );
}

function safeCodePoint(codePoint, fallback) {
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10FFFF ||
    (codePoint >= 0xD800 && codePoint <= 0xDFFF)
  ) {
    return fallback;
  }

  return String.fromCodePoint(codePoint);
}

function removeHtmlElements(html) {
  let sanitized = html;
  for (const tag of HTML_ELEMENTS_TO_REMOVE) {
    const completeElement = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/\\s*${tag}\\s*>`,
      "gi",
    );
    const unclosedElement = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*$`, "gi");
    sanitized = sanitized.replace(completeElement, "");
    sanitized = sanitized.replace(unclosedElement, "");
  }
  return sanitized;
}

function addHtmlBoundaries(html) {
  let withBoundaries = html;
  const boundaryTags = HTML_BLOCK_TAGS.join("|");
  withBoundaries = withBoundaries.replace(
    new RegExp(`<\\/?(?:${boundaryTags})\\b[^>]*>`, "gi"),
    (tag) => (tag.startsWith("</") ? `${tag}\n` : `\n${tag}`),
  );
  return withBoundaries;
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, " ");
}

export function htmlToText(html) {
  if (typeof html !== "string") {
    fail(400, "Imported content is invalid.");
  }

  const withoutRemovedElements = removeHtmlElements(html);
  const withBoundaries = addHtmlBoundaries(withoutRemovedElements);
  const withoutComments = withBoundaries.replace(/<!--[\s\S]*?-->/g, "");
  return normalizeText(decodeHtmlEntities(stripHtmlTags(withoutComments)));
}

export function extractHtmlTitle(html, fallback = "") {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/\s*title\s*>/i);
  if (titleMatch) {
    const title = normalizeInlineText(stripHtmlTags(titleMatch[1]));
    if (title) {
      return title;
    }
  }

  const headingMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/\s*h1\s*>/i);
  if (headingMatch) {
    const heading = normalizeInlineText(stripHtmlTags(headingMatch[1]));
    if (heading) {
      return heading;
    }
  }

  return normalizeInlineText(fallback);
}

function mediaTypeOf(contentType) {
  return typeof contentType === "string"
    ? contentType.split(";", 1)[0].trim().toLowerCase()
    : "";
}

function assertPositiveLimit(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (!Number.isInteger(value) || value < 1) {
    fail(500, "Import service configuration is invalid.");
  }
  return value;
}

function validateHttpUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    fail(400, "A URL is required.");
  }
  if (rawUrl.length > MAX_URL_LENGTH) {
    fail(400, "The URL is too long.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    fail(400, "The URL is invalid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    fail(400, "Only http and https URLs are allowed.");
  }
  if (!parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
    fail(400, "The URL is invalid.");
  }

  return parsedUrl;
}

function normalizedHostname(url) {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
}

function parseIpv4Address(address) {
  if (typeof address !== "string" || !/^\d+(?:\.\d+){3}$/.test(address)) {
    return null;
  }
  const octets = address.split(".").map(Number);
  if (
    octets.some(
      (octet) => !Number.isInteger(octet) || octet < 0 || octet > 255,
    )
  ) {
    return null;
  }
  return octets;
}

function parseIpv6Address(address) {
  if (typeof address !== "string" || address.includes("%")) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();
  const compressionParts = normalizedAddress.split("::");
  if (compressionParts.length > 2) {
    return null;
  }

  const parsePart = (part) => {
    if (!part) {
      return [];
    }
    const pieces = part.split(":");
    const lastPiece = pieces.at(-1);
    if (lastPiece?.includes(".")) {
      const ipv4 = parseIpv4Address(lastPiece);
      if (!ipv4) {
        return null;
      }
      pieces.splice(
        pieces.length - 1,
        1,
        ((ipv4[0] << 8) | ipv4[1]).toString(16),
        ((ipv4[2] << 8) | ipv4[3]).toString(16),
      );
    }
    if (pieces.some((piece) => !/^[0-9a-f]{1,4}$/.test(piece))) {
      return null;
    }
    return pieces.map((piece) => Number.parseInt(piece, 16));
  };

  const left = parsePart(compressionParts[0]);
  const right = compressionParts.length === 2 ? parsePart(compressionParts[1]) : [];
  if (!left || !right) {
    return null;
  }

  if (compressionParts.length === 1) {
    return left.length === 8 ? left : null;
  }

  const zeroCount = 8 - left.length - right.length;
  if (zeroCount < 1) {
    return null;
  }
  return [...left, ...Array.from({ length: zeroCount }, () => 0), ...right];
}

function ipv6Value(words) {
  return words.reduce((value, word) => (value << 16n) + BigInt(word), 0n);
}

function ipv4FromInteger(value) {
  return [
    Number((value >> 24n) & 0xffn),
    Number((value >> 16n) & 0xffn),
    Number((value >> 8n) & 0xffn),
    Number(value & 0xffn),
  ];
}

function isBlockedIpv4(octets) {
  const [first, second, third, fourth] = octets;
  const isMetadata =
    first === 169 && second === 254 && third === 169 && fourth === 254;
  const isPrivate =
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
  const isLoopbackOrUnspecified = first === 0 || first === 127;
  const isLinkLocal = first === 169 && second === 254;
  const isCarrierGradeNat = first === 100 && second >= 64 && second <= 127;
  const isReserved =
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && second >= 18 && second <= 19) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224;
  const isCloudMetadataAlias =
    first === 100 && second === 100 && third === 100 && fourth === 200;
  return (
    isMetadata ||
    isPrivate ||
    isLoopbackOrUnspecified ||
    isLinkLocal ||
    isCarrierGradeNat ||
    isReserved ||
    isCloudMetadataAlias
  );
}

function isBlockedIpv6(words) {
  const value = ipv6Value(words);
  const isLoopbackOrUnspecified = value === 0n || value === 1n;
  const isUniqueLocal = (value >> 121n) === 0x7en;
  const isLinkLocal = (value >> 118n) === 0x3fan;
  const isMulticast = (value >> 120n) === 0xffn;
  const isIpv4Mapped = (value >> 32n) === 0xffffn;
  const isIpv4Compatible = (value >> 32n) === 0n;
  if (isIpv4Mapped) {
    return isBlockedIpv4(ipv4FromInteger(value & 0xffff_ffffn));
  }
  return (
    isLoopbackOrUnspecified ||
    isUniqueLocal ||
    isLinkLocal ||
    isMulticast ||
    isIpv4Compatible
  );
}

function isBlockedIpAddress(address) {
  const ipv4 = parseIpv4Address(address);
  if (ipv4) {
    return isBlockedIpv4(ipv4);
  }
  const ipv6 = parseIpv6Address(address);
  return ipv6 ? isBlockedIpv6(ipv6) : false;
}

function isBlockedHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname === "instance-data.ec2.internal"
  );
}

async function assertSafeRemoteTarget(url, dnsLookup, timeoutSignal) {
  const hostname = normalizedHostname(url);
  if (isBlockedHostname(hostname) || isBlockedIpAddress(hostname)) {
    fail(400, "The remote target is not allowed.");
  }

  if (typeof dnsLookup !== "function") {
    fail(500, "Import service is unavailable.");
  }

  let abortHandler;
  const abortPromise = new Promise((_, reject) => {
    abortHandler = () => reject(new ImportError(504, "The remote request timed out."));
    if (timeoutSignal.aborted) {
      abortHandler();
    } else {
      timeoutSignal.addEventListener("abort", abortHandler, { once: true });
    }
  });

  try {
    const records = await Promise.race([
      Promise.resolve().then(() =>
        dnsLookup(hostname, { all: true, verbatim: true }),
      ),
      abortPromise,
    ]);
    const addresses = Array.isArray(records) ? records : [records];
    if (
      addresses.some((record) => {
        const address = typeof record === "string" ? record : record?.address;
        return isBlockedIpAddress(address);
      })
    ) {
      fail(400, "The remote target is not allowed.");
    }
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    // A transient DNS failure is allowed to flow to fetch, which reports the
    // eventual network failure without exposing resolver details.
  } finally {
    if (abortHandler) {
      timeoutSignal.removeEventListener("abort", abortHandler);
    }
  }
}

async function readResponseText(response, maxBytes) {
  if (!response.body || typeof response.body.getReader !== "function") {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      fail(413, "The imported response is too large.");
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = Buffer.from(value);
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        fail(413, "The imported response is too large.");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function fetchWithRedirects(
  initialUrl,
  fetchImpl,
  timeoutSignal,
  dnsLookup,
) {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    await assertSafeRemoteTarget(currentUrl, dnsLookup, timeoutSignal);
    let response;
    try {
      response = await fetchImpl(currentUrl, {
        method: "GET",
        headers: {
          Accept: "text/html, text/plain, text/markdown, application/xhtml+xml",
        },
        redirect: "manual",
        signal: timeoutSignal,
      });
    } catch (error) {
      if (timeoutSignal.aborted) {
        fail(504, "The remote request timed out.");
      }
      fail(502, "The remote content could not be fetched.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers?.get?.("location");
      if (!location || redirectCount === 3) {
        fail(502, "The remote content could not be fetched.");
      }
      try {
        currentUrl = validateHttpUrl(new URL(location, currentUrl).toString());
      } catch {
        fail(502, "The remote content could not be fetched.");
      }
      continue;
    }

    return response;
  }

  fail(502, "The remote content could not be fetched.");
}

export async function importTextFromUrl(
  rawUrl,
  {
    fetchImpl = globalThis.fetch,
    maxBytes = DEFAULT_IMPORT_MAX_BYTES,
    timeoutMs = DEFAULT_IMPORT_TIMEOUT_MS,
    dnsLookup = (...args) => dnsPromises.lookup(...args),
  } = {},
) {
  const initialUrl = validateHttpUrl(rawUrl);
  if (typeof fetchImpl !== "function") {
    fail(500, "Import service is unavailable.");
  }

  const byteLimit = assertPositiveLimit(maxBytes, DEFAULT_IMPORT_MAX_BYTES);
  const timeoutLimit = assertPositiveLimit(timeoutMs, DEFAULT_IMPORT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutLimit);

  try {
    const response = await fetchWithRedirects(
      initialUrl,
      fetchImpl,
      controller.signal,
      dnsLookup,
    );

    if (!response || !response.ok) {
      fail(502, "The remote content could not be fetched.");
    }

    const mediaType = mediaTypeOf(response.headers?.get?.("content-type"));
    const format = HTML_MEDIA_TYPES.has(mediaType)
      ? "html"
      : TEXT_MEDIA_TYPES.has(mediaType)
        ? "text"
        : null;
    if (!format) {
      fail(415, "The remote content type is not supported.");
    }

    const contentLength = response.headers?.get?.("content-length");
    if (contentLength !== null && contentLength !== undefined) {
      if (!/^\d+$/.test(contentLength.trim())) {
        fail(502, "The remote content could not be fetched.");
      }
      if (Number(contentLength) > byteLimit) {
        fail(413, "The imported response is too large.");
      }
    }

    let sourceText;
    try {
      sourceText = await readResponseText(response, byteLimit);
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      if (controller.signal.aborted) {
        fail(504, "The remote request timed out.");
      }
      fail(502, "The remote content could not be fetched.");
    }
    const text = format === "html" ? htmlToText(sourceText) : normalizeText(sourceText);
    if (!text) {
      fail(422, "The remote content has no readable text.");
    }

    const title =
      format === "html"
        ? extractHtmlTitle(sourceText, initialUrl.hostname)
        : initialUrl.hostname;
    return { title, text, format };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSubtitleFormat(format, text) {
  if (format !== undefined && format !== null && format !== "") {
    if (typeof format !== "string") {
      fail(400, "Subtitle format must be srt or vtt.");
    }
    const normalizedFormat = format.trim().toLowerCase();
    if (normalizedFormat !== "srt" && normalizedFormat !== "vtt") {
      fail(400, "Subtitle format must be srt or vtt.");
    }
    return normalizedFormat;
  }

  return /^WEBVTT(?:[ \t].*)?$/im.test(text.trimStart().split("\n", 1)[0])
    ? "vtt"
    : "srt";
}

function normalizeSubtitleInput(input, maxBytes) {
  if (typeof input !== "string" || input.trim().length === 0) {
    fail(400, "Subtitle text is required.");
  }
  if (Buffer.byteLength(input, "utf8") > maxBytes) {
    fail(413, "Subtitle text is too large.");
  }
  return input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function timestampToMilliseconds(value, format) {
  const normalizedValue = value.trim();
  let match;
  let hours;
  let minutes;
  let seconds;
  let milliseconds;

  if (format === "srt") {
    match = normalizedValue.match(/^(\d{1,4}):([0-5]\d):([0-5]\d)[,.](\d{3})$/);
    if (!match) {
      fail(422, "Subtitle timestamps are malformed.");
    }
    [, hours, minutes, seconds, milliseconds] = match;
  } else {
    match = normalizedValue.match(/^(?:(\d+):)?([0-5]\d):([0-5]\d)\.(\d{3})$/);
    if (!match) {
      fail(422, "Subtitle timestamps are malformed.");
    }
    [, hours, minutes, seconds, milliseconds] = match;
    hours ??= "0";
  }

  const totalMilliseconds =
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    Number(milliseconds);
  if (!Number.isSafeInteger(totalMilliseconds)) {
    fail(422, "Subtitle timestamps are malformed.");
  }
  return totalMilliseconds;
}

function cleanCueText(value) {
  const withoutSubtitleTags = value
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/<[^>]*>/g, "");
  const cleaned = normalizeText(decodeHtmlEntities(withoutSubtitleTags));
  if (cleaned.length > MAX_CUE_TEXT_LENGTH) {
    fail(422, "A subtitle cue is too long.");
  }
  if (!cleaned) {
    fail(422, "A subtitle cue has no text.");
  }
  return cleaned;
}

function parseCueTiming(line, format) {
  const arrowIndex = line.indexOf("-->");
  if (arrowIndex < 0 || line.indexOf("-->", arrowIndex + 3) >= 0) {
    fail(422, "Subtitle cue timing is malformed.");
  }

  const startValue = line.slice(0, arrowIndex).trim();
  const endAndSettings = line.slice(arrowIndex + 3).trim();
  const [endValue] = endAndSettings.split(/\s+/, 1);
  if (!startValue || !endValue) {
    fail(422, "Subtitle cue timing is malformed.");
  }

  const startMs = timestampToMilliseconds(startValue, format);
  const endMs = timestampToMilliseconds(endValue, format);
  if (endMs <= startMs) {
    fail(422, "Subtitle cue timing is malformed.");
  }
  return { startMs, endMs };
}

function addCue(cues, timingLine, textLines, format) {
  if (cues.length >= MAX_CUE_COUNT) {
    fail(413, "The subtitle file has too many cues.");
  }
  const { startMs, endMs } = parseCueTiming(timingLine, format);
  cues.push({
    startMs,
    endMs,
    text: cleanCueText(textLines.join("\n")),
  });
}

function parseSrt(text) {
  const blocks = text
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length === 0) {
    fail(422, "The subtitle file is malformed.");
  }

  const cues = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3 || !/^\d+$/.test(lines[0].trim())) {
      fail(422, "The SRT file is malformed.");
    }
    addCue(cues, lines[1], lines.slice(2), "srt");
  }
  return cues;
}

function isVttMetadataBlock(firstLine) {
  return /^(?:NOTE|STYLE|REGION)(?:[ \t]|$)/.test(firstLine);
}

function parseVtt(text) {
  const blocks = text
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length < 2) {
    fail(422, "The VTT file is malformed.");
  }

  const headerLines = blocks[0].split("\n");
  if (!/^WEBVTT(?:[ \t].*)?$/.test(headerLines[0].trim())) {
    fail(422, "The VTT file is malformed.");
  }

  const cues = [];
  for (const block of blocks.slice(1)) {
    const lines = block.split("\n");
    if (isVttMetadataBlock(lines[0].trim())) {
      continue;
    }

    const timingLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingLineIndex < 0 || timingLineIndex > 1) {
      fail(422, "The VTT file is malformed.");
    }
    if (timingLineIndex === 0 && lines.length < 2) {
      fail(422, "The VTT file is malformed.");
    }
    addCue(
      cues,
      lines[timingLineIndex],
      lines.slice(timingLineIndex + 1),
      "vtt",
    );
  }

  if (cues.length === 0) {
    fail(422, "The VTT file has no cues.");
  }
  return cues;
}

export function parseSubtitleDocument(
  input,
  requestedFormat,
  { maxBytes = DEFAULT_SUBTITLE_MAX_BYTES } = {},
) {
  const maxInputBytes = assertPositiveLimit(
    maxBytes,
    DEFAULT_SUBTITLE_MAX_BYTES,
  );
  const text = normalizeSubtitleInput(input, maxInputBytes);
  const format = normalizeSubtitleFormat(requestedFormat, text);
  const cues = format === "vtt" ? parseVtt(text) : parseSrt(text);
  return { format, cues };
}

export function parseSubtitles(input, requestedFormat, options) {
  return parseSubtitleDocument(input, requestedFormat, options).cues;
}

export function parseSrtSubtitles(input, options) {
  return parseSubtitleDocument(input, "srt", options).cues;
}

export function parseVttSubtitles(input, options) {
  return parseSubtitleDocument(input, "vtt", options).cues;
}

export const IMPORT_LIMITS = Object.freeze({
  maxBytes: DEFAULT_IMPORT_MAX_BYTES,
  timeoutMs: DEFAULT_IMPORT_TIMEOUT_MS,
  subtitleMaxBytes: DEFAULT_SUBTITLE_MAX_BYTES,
});
