# Port Configuration Guide

## Quick Fix

If you're getting connection refused errors:

1. **Run the port sync script:**
   ```bash
   npm run sync-ports
   ```

2. **Restart both servers:**
   ```bash
   npm run dev:all
   ```

## Configuration

The default server port is **3002**. To change it:

1. **Set the environment variable:**
   ```bash
   export SERVER_PORT=3003  # or whatever port you want
   ```

2. **Run the sync script:**
   ```bash
   npm run sync-ports
   ```

3. **Restart servers**

## How It Works

- The `sync-ports` script automatically updates:
  - `.env` file with correct `VITE_API_BASE_URL`
  - Frontend API calls to use the correct port
  
- Always run `npm run dev` or `npm run dev:all` instead of running servers directly
- These commands will automatically sync ports before starting

## Common Issues

### "Connection Refused" Error
- The frontend is trying to connect to the wrong port
- Solution: Run `npm run sync-ports` and restart

### Server Running on Different Port
- Check which port the server is actually using
- Update `SERVER_PORT` environment variable
- Run `npm run sync-ports`

### Multiple Server Instances
- Kill all node processes: `pkill -f "node.*index.js"`
- Start fresh with `npm run dev:all`