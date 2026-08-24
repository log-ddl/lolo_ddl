"use strict";
const GOOGLE_FLOW_PROTOCOL_VERSION = 1;
const GOOGLE_FLOW_DEFAULT_PORT = 9222;
const GOOGLE_FLOW_API_ROOT = "https://aisandbox-pa.googleapis.com";
const GOOGLE_FLOW_TRPC_ROOT = "https://labs.google/fx/api/trpc";
const GOOGLE_FLOW_BROWSER_API_KEY = "AIzaSyBtrm0o5ab1c-Ec8ZuLcGt3oJAA5VWt3pY";
function isAllowedFlowUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "aisandbox-pa.googleapis.com" || url.hostname === "labs.google" && url.pathname.startsWith("/fx/api/trpc/"));
  } catch {
    return false;
  }
}
function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
}
function assertString(value, label, max = 1e5) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label} is invalid`);
}
function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
exports.GOOGLE_FLOW_API_ROOT = GOOGLE_FLOW_API_ROOT;
exports.GOOGLE_FLOW_BROWSER_API_KEY = GOOGLE_FLOW_BROWSER_API_KEY;
exports.GOOGLE_FLOW_DEFAULT_PORT = GOOGLE_FLOW_DEFAULT_PORT;
exports.GOOGLE_FLOW_PROTOCOL_VERSION = GOOGLE_FLOW_PROTOCOL_VERSION;
exports.GOOGLE_FLOW_TRPC_ROOT = GOOGLE_FLOW_TRPC_ROOT;
exports.assertRecord = assertRecord;
exports.assertString = assertString;
exports.isAllowedFlowUrl = isAllowedFlowUrl;
exports.isUuid = isUuid;
