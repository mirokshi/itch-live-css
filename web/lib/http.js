// Small helpers for the API handlers (web-standard Request/Response, as Vercel Functions use).

export class BadRequest extends Error {}

const MAX_BODY = 8192; // bytes; a full config is well under 2 KB

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function readJson(request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY) throw new BadRequest('config too large');
  try {
    return JSON.parse(body);
  } catch {
    throw new BadRequest('body must be JSON');
  }
}

// Runs a handler; a BadRequest becomes a 400 with its message, anything else stays a 500.
export async function handle(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    throw err;
  }
}
