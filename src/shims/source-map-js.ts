/**
 * ESM named-export shim for source-map-js.
 * SolidStart's error viewer does `import { SourceMapConsumer } from "source-map-js"`,
 * but the package entry is CJS-only when Vite serves it raw to the browser.
 *
 * Import via subpath so the exact `source-map-js` alias does not recurse into this file.
 */
// Vite interops this CJS module into a default export for the client.
import sourceMap from "source-map-js/source-map.js";

export const SourceMapConsumer = sourceMap.SourceMapConsumer;
export const SourceMapGenerator = sourceMap.SourceMapGenerator;
export const SourceNode = sourceMap.SourceNode;
export default sourceMap;
