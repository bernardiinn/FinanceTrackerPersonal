# VM Configuration Guide

This document explains how to run the Finance Tracker application in a VM environment with the configured ports.

## Port Configuration

- **Frontend**: `0.0.0.0:4173` (accessible from VM host)
- **Backend**: `0.0.0.0:3003` (accessible from VM host)

## Quick Start for VM

### Option 1: Use the Startup Scripts

**Windows VM:**
```cmd
start-vm.bat
```

**Linux/Unix VM:**
```bash
./start-vm.sh
```

### Option 2: Manual Start

**Start Backend:**
```cmd
cd backend
npm run dev
```

**Start Frontend (in new terminal):**
```cmd
npm run dev
```

## Configuration Changes Made

### Frontend Configuration (vite.config.ts)
- Host binding: `0.0.0.0:4173`
- Proxy target updated: `http://localhost:3003`
- Origin header updated for CORS

### Backend Configuration
- Port changed: `3003` (from 3001)
- Host binding: `0.0.0.0` (accessible from outside VM)
- CORS origin updated: `http://0.0.0.0:4173`

### Environment Files
- `backend/.env`: PORT=3003
- `package.json`: Updated dev/preview scripts with host and port

## Access URLs

Once both servers are running:

- **Frontend Application**: http://0.0.0.0:4173
- **Backend API Health Check**: http://0.0.0.0:3003/api/health
- **API Base URL**: http://0.0.0.0:3003/api

## Troubleshooting

1. **Port Already in Use**: Make sure no other services are using ports 4173 or 3003
2. **CORS Issues**: Verify the frontend is accessing the correct backend URL
3. **VM Network**: Ensure VM network settings allow external access to these ports
4. **Firewall**: Check if firewall rules allow traffic on ports 4173 and 3003

## Network Configuration

For external access from the host machine, ensure your VM network is configured with:
- **Bridged networking** or **Port forwarding** 
- **Host-only** or **NAT** with port forwarding rules

Example VirtualBox port forwarding:
- Name: Finance-Frontend, Host Port: 4173, Guest Port: 4173
- Name: Finance-Backend, Host Port: 3003, Guest Port: 3003
