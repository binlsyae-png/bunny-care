const fs = require('fs');
const path = require('path');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

function handler(req, res) {
    const rawUrl = req.url || '/';
    const cleanUrl = rawUrl === '/' ? '/index.html' : rawUrl.split('?')[0];
    const safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('404 Not Found');
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', MIME[ext] || 'text/plain');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.end(content);
        }
    });
}

// Local server execution
if (require.main === module) {
    const http = require('http');
    const PORT = process.env.PORT || 3000;
    http.createServer(handler).listen(PORT, () => {
        console.log(`Bunny Care Server running at http://localhost:${PORT}`);
    });
}

module.exports = handler;
