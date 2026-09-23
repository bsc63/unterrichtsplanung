import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Health check endpoint for Cloud Run / Container Deployment
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from dist folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA fallback: send index.html for all frontend routes
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!doctype html><html><body><h1>App wird geladen...</h1></body></html>');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} in use, attempting fallback to 3000...`);
    app.listen(3000, '0.0.0.0', () => {
      console.log('Server listening on fallback port 3000');
    });
  } else {
    console.error('Server error:', err);
  }
});
