const fs = require('fs');
const path = require('path');
const net = require('net');
const dns = require('dns');

function loadEnvFiles() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.production'),
  ];

  const env = {};

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eq = line.indexOf('=');
      if (eq === -1) return;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      if (!(key in env)) env[key] = val;
    });
  }
  return env;
}

function parseTurnServers(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).map(raw => {
    // turn:[user:pass@]host[:port][?transport=udp|tcp]
    const m = raw.match(/^turn:\/\/(.*)$/) || raw.match(/^turn:(.*)$/);
    const payload = (m ? m[1] : raw);
    // Try to extract user:pass@host:port?transport=...
    const credsHost = payload.split('@');
    let user = null, pass = null, hostPart = payload;
    if (credsHost.length === 2) {
      const up = credsHost[0];
      hostPart = credsHost[1];
      const idx = up.indexOf(':');
      if (idx !== -1) {
        user = up.slice(0, idx);
        pass = up.slice(idx + 1);
      } else {
        user = up; pass = null;
      }
    }
    // hostPart may contain :port and ?transport
    let host = hostPart;
    let port = null;
    let transport = null;
    const qIdx = hostPart.indexOf('?');
    if (qIdx !== -1) {
      const q = hostPart.slice(qIdx + 1);
      host = hostPart.slice(0, qIdx);
      const params = new URLSearchParams(q);
      if (params.has('transport')) transport = params.get('transport');
    }
    const hp = host.split(':');
    if (hp.length >= 2 && /\d+$/.test(hp[hp.length-1])) {
      port = parseInt(hp.pop(), 10);
      host = hp.join(':');
    }
    if (!port) port = 3478;
    return { raw, user, pass, host, port, transport };
  });
}

function parseStunServers(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).map(raw => {
    // stun:host[:port]
    const m = raw.match(/^stun:(.*)$/);
    const payload = m ? m[1] : raw;
    const parts = payload.split(':');
    let host = parts[0];
    let port = parts[1] ? parseInt(parts[1], 10) : 19302;
    return { raw, host, port };
  });
}

function checkTcp(host, port, timeout = 3000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      done = true;
      socket.destroy();
      resolve({ ok: true });
    });
    socket.on('timeout', () => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok: false, reason: 'timeout' });
    });
    socket.on('error', (err) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ ok: false, reason: err.message });
    });
    socket.connect(port, host);
  });
}

function dnsResolve(host) {
  return new Promise(resolve => {
    dns.lookup(host, (err, address) => {
      if (err) return resolve({ ok: false, error: err.message });
      return resolve({ ok: true, address });
    });
  });
}

(async function main() {
  console.log('== Env & TURN Connectivity Check ==');
  const env = loadEnvFiles();

  // Basic validations
  const required = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
  let missing = [];
  required.forEach(k => { if (!env[k]) missing.push(k); });

  if (missing.length) {
    console.warn('Missing required env variables:', missing.join(', '));
  } else {
    console.log('Required env variables present.');
  }

  if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length < 32) {
    console.warn('NEXTAUTH_SECRET is shorter than 32 characters - consider regenerating a stronger secret.');
  }

  // Validate polling interval
  if (env.NEXT_PUBLIC_CALL_POLLING_INTERVAL) {
    const n = parseInt(env.NEXT_PUBLIC_CALL_POLLING_INTERVAL, 10);
    if (isNaN(n) || n < 500) {
      console.warn('NEXT_PUBLIC_CALL_POLLING_INTERVAL looks suspicious:', env.NEXT_PUBLIC_CALL_POLLING_INTERVAL);
    } else {
      console.log('Polling interval:', n, 'ms');
    }
  }

  // Parse STUN
  if (env.NEXT_PUBLIC_STUN_SERVERS) {
    const stuns = parseStunServers(env.NEXT_PUBLIC_STUN_SERVERS || '');
    if (stuns.length === 0) console.warn('STUN servers configured but none parsed');
    else console.log('STUN servers:', stuns.map(s => s.raw).join(', '));

    // DNS resolve STUN hosts
    for (const s of stuns) {
      const res = await dnsResolve(s.host);
      if (res.ok) console.log(`STUN ${s.raw} resolves to ${res.address}`);
      else console.warn(`STUN ${s.raw} DNS lookup failed: ${res.error}`);
    }
  } else {
    console.log('STUN servers not configured (calls disabled)');
  }

  // Parse TURN
  const turns = parseTurnServers(env.NEXT_PUBLIC_TURN_SERVERS || '');
  if (turns.length === 0) {
    console.log('No TURN servers configured in NEXT_PUBLIC_TURN_SERVERS (calls disabled)');
  } else {
    console.log('Parsed TURN servers:');
    for (const t of turns) console.log('-', t.raw);

    // For each TURN, DNS resolve and attempt TCP connect
    for (const t of turns) {
      const dnsRes = await dnsResolve(t.host);
      if (!dnsRes.ok) {
        console.warn(`TURN ${t.raw} DNS lookup failed: ${dnsRes.error}`);
        continue;
      }
      console.log(`TURN ${t.raw} resolves to ${dnsRes.address}`);
      const conn = await checkTcp(dnsRes.address, t.port, 3000);
      if (conn.ok) console.log(`TCP connect to ${t.host}:${t.port} successful (port open)`);
      else console.warn(`TCP connect to ${t.host}:${t.port} failed: ${conn.reason}`);
    }
  }

  console.log('\n== Summary ==');
  if (missing.length) console.log('- Status: WARN - missing vars');
  else if (turns.length === 0) console.log('- Status: WARN - no TURN servers configured');
  else console.log('- Status: OK - env and TURN connectivity checks completed');

  process.exit(0);
})();
