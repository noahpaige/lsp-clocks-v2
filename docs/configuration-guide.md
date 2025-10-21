# Configuration Guide

## 📋 Overview

All configuration is centralized in `src/config/constants.ts`. The system supports environment variable overrides for flexible deployment across different environments.

---

## 🔧 Environment Variables

### **Server Configuration**

| Variable           | Default                  | Description                                         |
| ------------------ | ------------------------ | --------------------------------------------------- |
| `EXPRESS_PORT`     | `3000`                   | Express server port                                 |
| `NODE_ENV`         | `development`            | Node environment (development, production, test)    |
| `REDIS_URL`        | `redis://localhost:6379` | Redis connection URL                                |
| `REDIS_PORT`       | `6379`                   | Redis server port (for embedded Redis)              |
| `REDIS_BIND`       | `127.0.0.1`              | Redis server bind address                           |
| `CLIENT_URL`       | `http://localhost:5173`  | Client application URL (for CORS)                   |
| `CORS_ORIGINS`     | `http://localhost:5173`  | Comma-separated list of allowed CORS origins        |
| `CORS_CREDENTIALS` | `true`                   | Enable CORS credentials (set to "false" to disable) |

### **Client Configuration** (Future)

| Variable       | Default                 | Description                         |
| -------------- | ----------------------- | ----------------------------------- |
| `VITE_API_URL` | `http://localhost:3000` | API base URL (not yet implemented)  |
| `VITE_WS_URL`  | `http://localhost:3000` | WebSocket URL (not yet implemented) |

---

## 💻 Development Setup

### **Default (No Configuration Needed)**

The application works out-of-the-box with sensible defaults:

- Server runs on `http://localhost:3000`
- Redis runs on `localhost:6379`
- Client runs on `http://localhost:5173`

Just run:

```bash
npm run dev
```

---

## 🚀 Production Deployment

### **Option 1: Environment Variables**

Set environment variables before starting the server:

**Linux/macOS:**

```bash
export EXPRESS_PORT=8080
export NODE_ENV=production
export REDIS_URL=redis://redis-prod.example.com:6379
export CLIENT_URL=https://app.example.com
export CORS_ORIGINS=https://app.example.com,https://admin.example.com

npm start
```

**Windows:**

```powershell
$env:EXPRESS_PORT=8080
$env:NODE_ENV="production"
$env:REDIS_URL="redis://redis-prod.example.com:6379"
$env:CLIENT_URL="https://app.example.com"
$env:CORS_ORIGINS="https://app.example.com,https://admin.example.com"

npm start
```

### **Option 2: .env File** (Recommended)

Create a `.env` file in the project root:

```bash
# .env
EXPRESS_PORT=8080
NODE_ENV=production
REDIS_URL=redis://redis-prod.example.com:6379
CLIENT_URL=https://app.example.com
CORS_ORIGINS=https://app.example.com,https://admin.example.com
CORS_CREDENTIALS=true
```

Then use a package like `dotenv`:

```bash
npm install dotenv
```

And load it in your server:

```typescript
// At the top of server.ts
import "dotenv/config";
```

---

## 🔒 Security Considerations

### **Production Checklist:**

1. ✅ Set `NODE_ENV=production`
2. ✅ Use specific CORS origins (not `*`)
3. ✅ Use secure Redis connection (TLS if exposed)
4. ✅ Set appropriate port (not default 3000)
5. ✅ Configure firewall rules
6. ✅ Enable CORS credentials only if needed

### **What Gets Masked in Production:**

When `NODE_ENV=production`, sensitive values are masked in logs:

```
Redis URL: [MASKED]  ← Hidden in production
```

---

## 🎯 Configuration Validation

The server validates configuration on startup and will exit with clear error messages if invalid:

```
❌ Configuration error: Server configuration validation failed:
Invalid PORT: 99999. Must be between 1 and 65535.
Invalid REDIS_URL: http://localhost:6379. Must start with "redis://".
```

---

## 📊 Configuration Examples

### **Example 1: Docker Deployment**

```bash
# docker-compose.yml environment section
environment:
  - EXPRESS_PORT=3000
  - NODE_ENV=production
  - REDIS_URL=redis://redis:6379  # Docker service name
  - CLIENT_URL=https://myapp.com
  - CORS_ORIGINS=https://myapp.com
```

### **Example 2: Multiple CORS Origins**

```bash
CORS_ORIGINS=https://app.example.com,https://admin.example.com,https://dashboard.example.com
```

### **Example 3: External Redis**

```bash
REDIS_URL=redis://my-redis-host.cloud.com:12345
# Note: Embedded Redis (REDIS_PORT, REDIS_BIND) won't be used
```

---

## 🔍 How It Works

### **Server-side Detection:**

```typescript
const isServer = typeof process !== "undefined" && process.env !== undefined;
```

- On server: Uses `process.env` for configuration
- On client: Uses fallback defaults (or import.meta.env in future)

### **Configuration Loading:**

```typescript
export const SERVER_CONFIG = isServer
  ? {
      PORT: parseInt(process.env.EXPRESS_PORT || "3000", 10),
      // ... other server config
    }
  : ({} as any); // Empty for client
```

### **Validation:**

```typescript
// In server.ts startup
validateServerConfig(); // Throws if invalid
logServerConfig(); // Logs current config
```

---

## 🛠️ Troubleshooting

### **Issue: Port already in use**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change `EXPRESS_PORT` to a different port

### **Issue: Redis connection failed**

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Check `REDIS_URL` and ensure Redis is running

### **Issue: CORS errors**

```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5174'
has been blocked by CORS policy
```

**Solution:** Add your origin to `CORS_ORIGINS`

---

## 📝 Summary

- ✅ All configuration in one file (`constants.ts`)
- ✅ Environment variable support for all server settings
- ✅ Automatic validation on startup
- ✅ Production-ready with security in mind
- ✅ Clear error messages for misconfiguration
- ✅ Works out-of-the-box for development
