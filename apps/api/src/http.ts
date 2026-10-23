import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { actions, accounts, scenarios, type QueueCommand, type Command, type Scenario } from '@pick/contracts';
import { DomainError } from './domain.ts';
import { CommandService, SqliteStore } from './store.ts';

import { QueueService } from './queue.ts';

const loopback = (ip = '') => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
const object = (b: unknown): Record<string, unknown> => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new DomainError(400, 'INVALID_BODY', 'Expected a request object.');
  return b as Record<string, unknown>;
};
function keys(b: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(b).some(k => !allowed.includes(k))) throw new DomainError(400, 'INVALID_BODY', 'Unexpected request fields. Identity and role must come from the demo session.');
}
async function body(req: IncomingMessage) {
  let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 8192) throw new DomainError(413, 'BODY_TOO_LARGE', 'Request is too large.'); }
  try { return object(JSON.parse(raw || '{}')); } catch (e) { if (e instanceof DomainError) throw e; throw new DomainError(400, 'INVALID_JSON', 'Request was not valid JSON.'); }
}
export function createApi(store: SqliteStore, options: { lanHost?: string; allowFaults?: boolean } = {}) {
  const service = new CommandService(store),queueService=new QueueService(store);
  const origins = new Set(['http://localhost:8081','http://127.0.0.1:8081','http://localhost:8082','http://127.0.0.1:8082', ...(options.lanHost ? [`http://${options.lanHost}:8081`] : [])]);
  const counters = new Map<string, { n: number; until: number }>();
  const reply = (res: ServerResponse, status: number, data: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
  return createServer(async (req, res) => {
    try {
      const origin = req.headers.origin;
      if (origin && !origins.has(origin)) throw new DomainError(403, 'ORIGIN_DENIED', 'This web origin is not enabled for the local demo.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Demo-Drop-Response');
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const url = new URL(req.url || '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') return reply(res, 200, { name: 'PICK local API', demo: true, storage: 'SQLite', time: new Date().toISOString() });
      if (req.method === 'GET' && url.pathname === '/demo/accounts') return reply(res, 200, { accounts });
      if (req.method === 'POST') {
        const ip = req.socket.remoteAddress || 'unknown'; const time = Date.now();
        // Opportunistic cleanup bounds the local demo rate-limit map.
        for (const [k,v] of counters) if (v.until < time) counters.delete(k);
        const c = counters.get(ip) || { n: 0, until: time + 60000 }; c.n++; counters.set(ip,c);
        if (c.n > 300) throw new DomainError(429, 'RATE_LIMIT', 'Too many demo actions. Wait one minute.');
      }
      if (req.method === 'POST' && url.pathname === '/demo/sessions') {
        const b = await body(req); keys(b, ['accountId']);
        if (typeof b.accountId !== 'string') throw new DomainError(400, 'INVALID_ACCOUNT', 'Choose a demo account.');
        return reply(res, 201, store.createSession(b.accountId));
      }
      if (req.method === 'POST' && url.pathname === '/demo/reset') {
        if (!loopback(req.socket.remoteAddress)) throw new DomainError(403, 'LOCAL_ONLY', 'Reset the shared demo from the computer running PICK.');
        const b = await body(req); keys(b, ['scenario', 'confirm']);
        if (b.confirm !== 'RESET_SHARED_DEMO' || !scenarios.some(s => s.id === b.scenario)) throw new DomainError(400, 'RESET_CONFIRMATION', 'Confirm a listed shared demo reset.');
        return reply(res, 200, store.reset(b.scenario as Scenario));
      }
      if(req.method==='POST'&&url.pathname==='/demo/migrate'){if(!loopback(req.socket.remoteAddress))throw new DomainError(403,'LOCAL_ONLY','Run additive migration on the host computer.');const b=await body(req);keys(b,['confirm']);if(b.confirm!=='ADD_QUEUE_FIXTURES')throw new DomainError(400,'CONFIRM_REQUIRED','Confirm the additive migration.');return reply(res,200,store.migrateQueue());}
      const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) throw new DomainError(401, 'SESSION_REQUIRED', 'Choose a demo account to continue.');
      if (req.method === 'DELETE' && url.pathname === '/demo/session') { store.endSession(token); return reply(res, 200, { ended: true }); }
      const queue=url.pathname.match(/^\/v1\/queues\/([a-z0-9-]+)$/);
      if(req.method==='GET'&&queue)return reply(res,200,queueService.snapshot(token,queue[1]));
      if(req.method==='POST'&&url.pathname==='/v1/queue-commands'){
        const b=await body(req);keys(b,['sessionId','generation','expectedRevision','key','action','visitId','order','reason','zone']);
        if(typeof b.sessionId!=='string'||typeof b.generation!=='string'||typeof b.key!=='string'||!/^[a-zA-Z0-9-]{8,100}$/.test(b.key)||!Number.isSafeInteger(b.expectedRevision)||!['reorder','manual_arrival','exception','restore','zone'].includes(String(b.action)))throw new DomainError(400,'INVALID_COMMAND','Invalid queue command.');
        const result=queueService.execute(token,b as QueueCommand);
        if(options.allowFaults&&req.headers['x-demo-drop-response']==='once'){req.socket.destroy();return;}
        return reply(res,200,result);
      }
      const trip = url.pathname.match(/^\/v1\/trips\/([a-z0-9-]+)$/);
      if (req.method === 'GET' && trip) return reply(res, 200, service.snapshot(token, trip[1]));
      const receipt = url.pathname.match(/^\/v1\/receipts\/([a-zA-Z0-9-]{8,100})$/);
      if (req.method === 'GET' && receipt) return reply(res, 200, service.lookup(token, receipt[1]));
      if (req.method === 'POST' && url.pathname === '/v1/commands') {
        const b = await body(req); keys(b, ['tripId','key','expectedVersion','generation','action','location']);
        if (typeof b.tripId !== 'string' || typeof b.key !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(b.key) || typeof b.generation !== 'string' || !Number.isSafeInteger(b.expectedVersion) || typeof b.action !== 'string' || !actions.includes(b.action as Command['action'])) throw new DomainError(400, 'INVALID_COMMAND', 'The command is incomplete or invalid. Refresh and try the intended action.');
        const result = service.execute(token, b as Command);
        // Explicit local synthetic fault: transaction commits, HTTP acknowledgement is lost.
        if (options.allowFaults && req.headers['x-demo-drop-response'] === 'once') { req.socket.destroy(); return; }
        return reply(res, 200, result);
      }
      throw new DomainError(404, 'NOT_FOUND', 'This endpoint is not available.');
    } catch (e) {
      if (e instanceof DomainError) return reply(res, e.status, { code: e.code, message: e.message });
      console.error('API request failed:', e instanceof Error ? e.message : 'unknown');
      reply(res, 500, { code: 'SERVER_ERROR', message: 'The action could not be confirmed. Check its receipt before repeating a handoff.' });
    }
  });
}
