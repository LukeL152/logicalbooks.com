/* Lightweight static file server for local development (no deps).
   Usage: node dev-server.js [port]
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const port = Number(process.argv[2]) || 8080;

const types = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=UTF-8',
  '.xml': 'application/xml; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = types[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        send(res, 404, 'Not Found');
      } else {
        send(res, 500, 'Internal Server Error');
      }
      return;
    }
    send(res, 200, data, { 'Content-Type': type });
  });
}

// Live reload SSE clients
const clients = new Set();
let lastSnapshot = 0;

function snapshotDir(dir) {
  let sum = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === '.DS_Store') continue;
    const p = path.join(dir, e.name);
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        sum += snapshotDir(p);
      } else {
        sum += st.mtimeMs;
      }
    } catch (_) { /* ignore */ }
  }
  return sum;
}

function broadcastReload() {
  for (const res of clients) {
    try { res.write(`data: reload\n\n`); } catch (_) {}
  }
}

function startPolling() {
  // Initial snapshot
  try { lastSnapshot = snapshotDir(root); } catch (_) { lastSnapshot = Date.now(); }
  setInterval(() => {
    try {
      const now = snapshotDir(root);
      if (now !== lastSnapshot) {
        lastSnapshot = now;
        broadcastReload();
      }
    } catch (_) {}
  }, 800);
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    // Live reload SSE endpoint
    if (urlPath === '/__livereload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    // Prevent path traversal
    const safePath = path.normalize(urlPath).replace(/^\/+/, '');
    const filePath = path.join(root, safePath);

    // If the path is a directory, serve index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      return serveFile(path.join(filePath, 'index.html'), res);
    }
    // Fallback to index.html for missing top-level routes (SPA)
    if (!fs.existsSync(filePath)) {
      return serveFile(path.join(root, 'index.html'), res);
    }
    return serveFile(filePath, res);
  } catch (e) {
    send(res, 500, 'Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
  startPolling();
});
