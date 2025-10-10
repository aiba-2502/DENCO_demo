# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DENCO is an enterprise-grade voice AI call system integrating Asterisk PBX with AI processing. The system uses a 3-tier architecture:

1. **Asterisk PBX Layer** (Debian + FreePBX) - Handles SIP/VoIP call control
2. **Node.js Backend** (Port 3001) - Asterisk integration via ARI (Asterisk REST Interface)
3. **Python Backend** (Port 8000) - AI processing with Azure Speech, Dify AI, VAD
4. **Next.js Frontend** (Port 3000) - Management UI with real-time monitoring

## Development Commands

### Database Setup & Management

```bash
# Initialize database (Windows PowerShell)
.\initialize-database.ps1

# Force recreate database
.\initialize-database.ps1 -Force

# Check database status
.\check-database.ps1

# Reset database (delete all data)
.\reset-database.ps1 -Confirm

# Manual database access
psql -U voiceai -d voiceai
```

### Python Backend (FastAPI)

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# API documentation
http://localhost:8000/docs
```

### Node.js Backend (Asterisk Integration)

```bash
cd asterisk-backend

# Install dependencies
npm install

# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Health check
curl http://localhost:3001/health
```

### Frontend (Next.js)

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Access
http://localhost:3000
```

### All Services

```bash
# Start all services (PowerShell)
.\start-all-services.ps1

# Stop all services
.\stop-all-services.ps1
```

## Architecture & Data Flow

### Call Processing Flow

1. **Incoming Call** → Asterisk PBX receives SIP call
2. **Stasis Trigger** → Asterisk executes `Stasis(denco_voiceai)` dialplan
3. **Node.js Handler** → ARI client receives StasisStart event
4. **Session Creation** → POST `/api/calls` to Python backend (creates DB record)
5. **WebSocket Connection** → Node.js connects to Python WebSocket `/ws/call/{call_id}`
6. **Audio Processing Loop**:
   - Audio stream → VAD detection → Speech recognition (Azure) → AI response (Dify) → Speech synthesis → Audio output
7. **Call Termination** → POST `/api/calls/{call_id}/end` to Python backend

### Component Communication

- **Asterisk ↔ Node.js**: ARI (HTTP REST + WebSocket on port 8088)
- **Node.js ↔ Python**: REST API + WebSocket (authenticated with BACKEND_AUTH_TOKEN)
- **Node.js ↔ Frontend**: WebSocket for real-time call monitoring
- **Python ↔ Database**: asyncpg connection pool to PostgreSQL

## Key File Locations

### Backend Python (AI Processing Layer)
- `main.py` - FastAPI application with all API endpoints
- `database.py` - Database connection and core queries
- `database_extensions.py` - Extended database methods for customers, knowledge, campaigns
- `models.py` - Pydantic models for API requests/responses
- `vad.py` - Voice Activity Detection using Silero VAD
- `dify_client.py` - Dify AI integration client
- `api/` - Modular API routers (customers, tags, knowledge, campaigns, tenants, settings)

### Backend Node.js (Asterisk Integration Layer)
- `asterisk-backend/server.js` - Main Express server
- `asterisk-backend/ari-client.js` - ARI connection management
- `asterisk-backend/call-handler.js` - Call control logic (answer, hangup, bridge)
- `asterisk-backend/websocket-manager.js` - WebSocket coordination

### Frontend (Next.js)
- `app/` - Next.js 13 App Router pages
- `components/` - Reusable React components (organized by feature)
- Uses shadcn/ui component library with Tailwind CSS

### Database
- `supabase/migrations/` - Supabase migration files
- `migrations/` - Additional custom migrations
- Schema includes: call_sessions, messages, dtmf_events, customers, tags, knowledge_articles, campaigns, tenants

## Environment Variables

All services require environment variables. Templates are provided:

### Python Backend `.env`
```env
POSTGRES_HOST=localhost
POSTGRES_USER=voiceai
POSTGRES_PASSWORD=<password>
POSTGRES_DB=voiceai

AZURE_SPEECH_KEY=<key>
AZURE_SPEECH_REGION=japaneast

DIFY_API_KEY=<key>
DIFY_ENDPOINT=https://api.dify.ai/v1

BACKEND_AUTH_TOKEN=<shared-secret>
```

### Node.js Backend `asterisk-backend/.env`
```env
ASTERISK_HOST=<asterisk-ip>
ASTERISK_ARI_PORT=8088
ASTERISK_ARI_USERNAME=ariuser
ASTERISK_ARI_PASSWORD=<password>
ASTERISK_APP_NAME=denco_voiceai

PYTHON_BACKEND_URL=http://localhost:8000
PYTHON_BACKEND_WS_URL=ws://localhost:8000
BACKEND_AUTH_TOKEN=<same-as-python>

NODE_SERVER_PORT=3001
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Testing & Debugging

### Test Call Flow
1. From a SIP phone registered to Asterisk, dial `*88`
2. System should answer with AI greeting
3. Monitor logs:
   - Asterisk CLI: `asterisk -rvvvvv`
   - Node.js: Check terminal output or `logs/node-backend.log`
   - Python: Check terminal output or `logs/python-backend.log`
   - Frontend: Visit http://localhost:3000 → Calls → Monitor

### API Testing
```bash
# Health checks
curl http://localhost:8000/health
curl http://localhost:3001/health

# Active calls (requires auth token)
curl -H "Authorization: Bearer <tenant-id>" http://localhost:8000/api/calls/active

# Asterisk connection status
curl http://localhost:3001/api/asterisk/status
```

### Common Issues

**Database Connection Failed**
- Ensure PostgreSQL service is running: `Get-Service postgresql*`
- Verify database exists: `psql -U postgres -l`
- Run initialization: `.\initialize-database.ps1`

**ARI Connection Refused (Node.js ↔ Asterisk)**
- Check Asterisk is running and ARI is enabled: `asterisk -rx "ari show status"`
- Verify network connectivity to Asterisk server on port 8088
- Confirm credentials in `asterisk-backend/.env` match `/etc/asterisk/ari.conf`

**WebSocket Connection Failed (Node.js ↔ Python)**
- Ensure Python backend is running: `curl http://localhost:8000/health`
- Verify BACKEND_AUTH_TOKEN matches in both `.env` files
- Check Python WebSocket endpoint is accessible: `curl http://localhost:8000/ws/call/test`

**No Audio / Call Silent**
- Check RTP ports are open on Asterisk server (10000-20000 UDP)
- Verify NAT settings in Asterisk `/etc/asterisk/pjsip.conf`
- Ensure Azure Speech keys are valid in Python `.env`

## Code Patterns & Conventions

### Python Backend
- **Async/await**: All database operations and external API calls use async
- **Dependency injection**: Authentication uses FastAPI Depends pattern
- **Error handling**: HTTPException for API errors with appropriate status codes
- **Modular routers**: Feature-based API organization in `api/` directory

### Node.js Backend
- **ES Modules**: Uses `"type": "module"` in package.json
- **Event-driven**: ARI events trigger async handlers
- **WebSocket coordination**: Manages multiple WebSocket connections (Asterisk, Python, Frontend)
- **Logging**: Structured logging with timestamp and context

### Frontend
- **App Router**: Next.js 13+ App Router (not Pages Router)
- **TypeScript**: Strict type checking enabled
- **Component library**: shadcn/ui with Tailwind CSS
- **Real-time updates**: WebSocket integration for live call monitoring

## Key Integration Points

### Asterisk Configuration
The system requires specific Asterisk configuration on a separate server:
- ARI enabled in `/etc/asterisk/ari.conf` with user credentials
- Stasis dialplan in `/etc/asterisk/extensions_custom.conf`
- Application name must match `ASTERISK_APP_NAME` environment variable

### Authentication Flow
- Frontend → Python: Bearer token with tenant ID
- Node.js → Python: Shared BACKEND_AUTH_TOKEN header
- Multi-tenant isolation via tenant_id in database queries

### Real-time Communication
- **Call Events**: Asterisk → Node.js (ARI) → Frontend (WebSocket)
- **Audio Stream**: Asterisk → Node.js → Python (WebSocket) → AI Processing → Response
- **Call State**: Stored in PostgreSQL, synchronized across all layers

## Important Notes

- **Database migrations** are in multiple locations (supabase/migrations and migrations/)
- **ARI application name** (`denco_voiceai`) must match across Asterisk config and Node.js env
- **Audio format** is 16kHz PCM for Azure Speech compatibility
- **Multi-tenant** system requires tenant_id in most database operations
- **WebSocket URLs** use different ports: Python (8000), Node.js (3001)
- **Windows deployment** uses PowerShell scripts; Linux uses bash scripts

## Documentation References

- [SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md) - Complete system architecture
- [ASTERISK_SETUP.md](ASTERISK_SETUP.md) - Asterisk PBX configuration
- [PYTHON_BACKEND_API.md](PYTHON_BACKEND_API.md) - Complete API specification
- [asterisk-backend/README.md](asterisk-backend/README.md) - Node.js backend details
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration procedures
