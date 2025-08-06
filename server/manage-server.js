#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PID_FILE = path.join(__dirname, 'server.pid');
const LOG_FILE = path.join(__dirname, 'server.log');

// Function to kill processes using a specific port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is available`);
        resolve();
        return;
      }
      
      const pids = stdout.trim().split('\n');
      let remaining = pids.length;
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          if (!killError) {
            console.log(`🔥 Killed process ${pid} on port ${port}`);
          }
          remaining--;
          if (remaining === 0) {
            console.log(`✅ All processes on port ${port} terminated`);
            resolve();
          }
        });
      });
    });
  });
}

// Function to read PID file and kill the stored process
function killStoredProcess() {
  return new Promise((resolve) => {
    if (!fs.existsSync(PID_FILE)) {
      console.log('ℹ️  No PID file found');
      resolve();
      return;
    }
    
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    exec(`kill -9 ${pid}`, (error) => {
      if (!error) {
        console.log(`🔥 Killed stored process ${pid}`);
      }
      fs.unlinkSync(PID_FILE);
      resolve();
    });
  });
}

// Function to start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting scraper server...');
    
    const server = spawn('node', ['index.js'], {
      cwd: __dirname,
      stdio: ['inherit', 'pipe', 'pipe'],
      detached: false
    });
    
    // Store PID
    fs.writeFileSync(PID_FILE, server.pid.toString());
    console.log(`📝 Server PID ${server.pid} stored`);
    
    // Setup logging
    const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      logStream.write(`[${new Date().toISOString()}] ${output}`);
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      logStream.write(`[${new Date().toISOString()}] ERROR: ${output}`);
    });
    
    server.on('close', (code) => {
      logStream.end();
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
      
      if (code === 0) {
        console.log('✅ Server exited normally');
        resolve();
      } else {
        console.log(`❌ Server exited with code ${code}`);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
    
    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      logStream.end();
      reject(error);
    });
    
    // Wait a bit to see if server starts successfully
    setTimeout(() => {
      if (!server.killed) {
        console.log('✅ Server appears to be running successfully');
        resolve();
      }
    }, 3000);
  });
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      console.log('🔧 Preparing to start server...');
      await killProcessOnPort(3001);
      await killProcessOnPort(3002);
      await killProcessOnPort(3003);
      await killStoredProcess();
      await startServer();
      break;
      
    case 'stop':
      console.log('🛑 Stopping server...');
      await killProcessOnPort(3001);
      await killProcessOnPort(3002);
      await killProcessOnPort(3003);
      await killStoredProcess();
      console.log('✅ Server stopped');
      break;
      
    case 'restart':
      console.log('🔄 Restarting server...');
      await killProcessOnPort(3001);
      await killProcessOnPort(3002);
      await killProcessOnPort(3003);
      await killStoredProcess();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await startServer();
      break;
      
    case 'status':
      exec('lsof -ti:3001,3002,3003', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('📊 Server Status: NOT RUNNING');
        } else {
          console.log('📊 Server Status: RUNNING');
          console.log('🔍 Processes:', stdout.trim().split('\n'));
        }
        
        if (fs.existsSync(PID_FILE)) {
          const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
          console.log(`📝 Stored PID: ${pid}`);
        }
        
        if (fs.existsSync(LOG_FILE)) {
          console.log(`📄 Log file: ${LOG_FILE}`);
        }
      });
      break;
      
    case 'logs':
      if (fs.existsSync(LOG_FILE)) {
        const logs = fs.readFileSync(LOG_FILE, 'utf8');
        console.log('📄 Recent logs:');
        console.log(logs.split('\n').slice(-50).join('\n'));
      } else {
        console.log('❌ No log file found');
      }
      break;
      
    default:
      console.log(`
🔧 Scraper Server Manager

Usage: node manage-server.js [command]

Commands:
  start     - Kill any existing processes and start the server
  stop      - Stop the server and clean up processes
  restart   - Stop and start the server
  status    - Check if server is running
  logs      - Show recent server logs

Examples:
  node manage-server.js start
  node manage-server.js restart
  node manage-server.js status
      `);
  }
}

main().catch(error => {
  console.error('❌ Script error:', error.message);
  process.exit(1);
}); 