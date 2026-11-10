#!/usr/bin/env node
/**
 * Glasstra Group — zero-dependency Node server.
 *  - Serves /public with clean URLs (/about/ → public/about/index.html) and a custom 404.
 *  - GET  /api/chat/status → { live: true|false }
 *  - POST /api/chat        → proxies to the Anthropic Messages API when ANTHROPIC_API_KEY is set.
 *    The API key stays on the server; the browser never sees it.
 *
 * Usage:  node server.js                       (demo chatbot)
 *         ANTHROPIC_API_KEY=sk-ant-... node server.js   (live AI chatbot)
 * Env:    PORT (default 3000), ANTHROPIC_MODEL (default claude-haiku-5-5)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const site = require('./src/site.config.js');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

const SYSTEM_PROMPT = `You are the friendly website assistant for ${site.name}, based at ${site.addressLine}, serving ${site.area}.
Facts you may share:
- Phone: ${site.phone}.${site.email ? ` Email: ${site.email}.` : ''}
${site.hours ? `- Hours: ${site.hours.map(([d, h]) => `${d} ${h}`).join('; ')}.` : '- Hours: not published; ask the customer to call.'}
- Services: ${require('./src/services-data.js').map((s) => `${s.title} (${s.intro})`).join('; ')}.
- Glasstra Group LLC (Cataño, Puerto Rico, since 1978) designs, manufactures and installs architectural aluminum and glass systems: curtain walls, storefronts/commercial facades, windows, doors and sliding doors, skylights, railings and interior systems, for commercial, institutional, government and residential buildings. Projects include The Mall of San Juan, PR Convention Center, Popular Center, FBI, Hotel InterContinental. Office hours Mon-Fri 8 AM-5 PM. Registered federal contractor. Never quote prices or claim certifications; direct people to request a proposal.
Rules:
- Keep replies short (2–4 sentences), warm and professional, in American English. Plain text only, no markdown headings.
- Never invent prices, availability, insurance details, staff names or facts not listed above. For prices or bookings, say the team will confirm and suggest the "Get a free quote" button, the contact page (/contact/), phone or WhatsApp.
- Only discuss topics related to the business and its glass and aluminum work. Politely decline anything unrelated.`;

// Simple in-memory rate limit: 20 chat requests / 10 min / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now(); const win = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, max = 20000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > max) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
  });
}

async function handleChat(req, res) {
  if (!API_KEY) return send(res, 503, { error: 'AI chat not configured' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (limited(ip)) return send(res, 429, { error: 'Too many messages, please try again shortly.' });
  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'Bad request' }); }
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return send(res, 400, { error: 'No user message' });
  while (messages.length && messages[0].role !== 'user') messages.shift();
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages }),
    });
    const j = await r.json();
    if (!r.ok) { console.error('Anthropic API error', r.status, j?.error?.message); return send(res, 502, { error: 'AI service error' }); }
    const reply = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return send(res, 200, { reply });
  } catch (e) {
    console.error('Chat proxy failed:', e.message);
    return send(res, 502, { error: 'AI service unreachable' });
  }
}

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.includes('\0')) return send(res, 400, 'Bad request', 'text/plain');
  let file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain');
  // Clean URLs: /about → redirect to /about/ ; /about/ → about/index.html
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      return fs.readFile(path.join(ROOT, '404.html'), (e2, nf) => send(res, 404, nf || 'Not found', 'text/html; charset=utf-8'));
    }
    const ext = path.extname(file);
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=604800';
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/chat/status' && req.method === 'GET') return send(res, 200, { live: Boolean(API_KEY) });
  if (url === '/api/chat' && req.method === 'POST') return handleChat(req, res);
  if (url.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  if (url === '/assets/js/site-config.js' && API_KEY) {
    // Tell the browser the live chat API is available (static hosts never serve this, so they stay in demo mode).
    return fs.readFile(path.join(ROOT, 'assets/js/site-config.js'), 'utf8', (e, js) => send(res, e ? 404 : 200, e ? '' : js + "window.SITE.chatApi = '/api/chat';\n", 'text/javascript; charset=utf-8'));
  }
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Glasstra Group site running at http://localhost:${PORT}  (chatbot: ${API_KEY ? 'LIVE AI – ' + MODEL : 'demo mode'})`);
});
