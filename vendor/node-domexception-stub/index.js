"use strict";

/**
 * Drop-in for deprecated `node-domexception` (used by fetch-blob → node-fetch → gaxios).
 * Node 18+ exposes DOMException globally; matches what the polyfill provided.
 */
const DOMException = globalThis.DOMException;
if (!DOMException) {
  throw new Error(
    "node-domexception-stub: globalThis.DOMException is missing (requires Node 18+)"
  );
}
module.exports = DOMException;
