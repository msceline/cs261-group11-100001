const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Forward /api/* to the Spring Boot backend (prefix is kept)
// Browser-side helpers in ./api are served as files first; every other /api request goes to the backend
app.use('/api', express.static(path.join(__dirname, 'api')));
app.use('/api', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, pathRewrite: (p) => '/api' + p }));

// Prevent caching/bfcache of HTML pages so Back after sign-out never shows stale account data.
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Serve static assets (pages, css, js, asset)
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));

app.listen(PORT, () => console.log(`Frontend running on port ${PORT}, backend -> ${BACKEND_URL}`));