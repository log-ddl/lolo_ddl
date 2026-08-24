"use strict";
const GROK_PROTOCOL_VERSION = 6;
const GROK_DEFAULT_PORT = 9223;
function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
}
function assertString(value, label, max = 1e5) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label} is invalid`);
}
function isAllowedGrokMediaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "assets.grok.com" || url.hostname.endsWith(".grok.com"));
  } catch {
    return false;
  }
}
exports.GROK_DEFAULT_PORT = GROK_DEFAULT_PORT;
exports.GROK_PROTOCOL_VERSION = GROK_PROTOCOL_VERSION;
exports.assertRecord = assertRecord;
exports.assertString = assertString;
exports.isAllowedGrokMediaUrl = isAllowedGrokMediaUrl;
