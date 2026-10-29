/** Paths served with open CORS headers (see `server/middleware/cors.ts`). */
export function isCorsPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/") || pathname === "/openapi.json" || pathname === "/llms-full.txt";
}
