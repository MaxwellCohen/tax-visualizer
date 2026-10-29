/** Machine-readable endpoints that must always hit the network, never the SW pages cache. */
export const BYPASS_PATTERNS = [/^\/api\//, /^\/llms(-full)?\.txt$/, /^\/openapi\.json$/, /^\/robots\.txt$/, /^\/mcp$/, /^\/\.well-known\//];

export function shouldBypassServiceWorker(pathname: string): boolean {
  return BYPASS_PATTERNS.some((pattern) => pattern.test(pathname));
}
