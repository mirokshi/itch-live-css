// fetch-live.mjs <url>... - one polite logged-out GET per page (>= 7 s apart), saved to $LR_RAW for lr.mjs.
import { liveSnapshot } from './lr.mjs';
for (const u of process.argv.slice(2)) { try { console.log(u, '->', await liveSnapshot(u)); } catch (e) { console.log(u, 'FAILED', String(e)); } }
