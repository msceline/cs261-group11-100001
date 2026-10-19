const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Forward /api/* to the Spring Boot backend (prefix is kept)
app.use('/api', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, pathRewrite: (p) => '/api' + p }));

// /api is proxied to the backend, so the browser-side API helpers in ./api are served under /client-api
app.use('/client-api', express.static(path.join(__dirname, 'api')));

// Serve static assets (pages, css, js, asset)
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));

// Serve the page (put other static assets in frontend/public/)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Frontend running on port ${PORT}, backend -> ${BACKEND_URL}`));