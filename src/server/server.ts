import express from 'express';
import { createServer } from 'http';
import { RedisAPI } from './redis-api';

const app = express();
const server = createServer(app); // HTTP server for WebSockets

const PORT = process.env.EXPRESS_PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Redis API with existing Express app & server
new RedisAPI(app, server);

// Start server
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});
