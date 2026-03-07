const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable gzip compression for all responses
app.use(compression());

// Serve Flutter web build as static files
app.use(express.static(path.join(__dirname, 'FlutterAPP', 'build', 'web'), {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback — serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'FlutterAPP', 'build', 'web', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CBSE Toppers Web running on port ${PORT}`);
});
