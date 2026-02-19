# Enclosure MGMT
# Enclosure MGMT

A centralized web-based management interface for Chassis Management Controllers (CMCs). This application provides a unified dashboard to monitor, control, and manage multiple CMC enclosures from a single interface.

![Language Distribution](https://img.shields.io/badge/JavaScript-75.8%25-yellow)
![Language Distribution](https://img.shields.io/badge/HTML-11.6%25-orange)
![Language Distribution](https://img.shields.io/badge/TypeScript-5.5%25-blue)
![Language Distribution](https://img.shields.io/badge/Shell-4.5%25-green)
![Language Distribution](https://img.shields.io/badge/CSS-2.6%25-blueviolet)

## 🎯 Features

### Core Functionality
- **Multi-CMC Management**: Add, view, edit, and delete multiple CMC connections
- **Centralized Dashboard**: Single interface to manage all your enclosures
- **Embedded Web Interface**: View CMC web interfaces directly within the application
- **Auto-Login**: Optional automatic authentication for streamlined access - Non-Functional
- **Dark/Light Themes**: Toggle between professional business and light silk themes

### CMC Control Features
- **LED Control**: Trigger LED blink for physical identification (60-second duration)
- **Access Control**: Toggle SSH and serial console access
- **System Monitoring**: View events and firmware history
- **Token Management**: Automatic API token handling and caching

### Technical Features
- **REST API Backend**: Centralized data storage with SQLite database
- **Real-time Updates**: Automatic state fetching and updates
- **LAN Access**: Access from any device on your local network
- **Migration Tools**: Migrate from localStorage to database
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
Enclosure-MGMT/
├── cmc-backend/          # Node.js Express API server
│   ├── server.js         # Main API server
│   ├── database.js       # SQLite database layer
│   ├── migrate.js        # Migration utility
│   └── cmc-manager.db    # SQLite database (auto-generated)
│
└── cmc-interface/        # React/Vite frontend
    ├── src/
    │   ├── App.jsx              # Main application component
    │   ├── components/          # UI components
    │   │   ├── AddCmcModal.jsx
    │   │   ├── ApiToolsPanel.jsx
    │   │   ├── CmcSidebar.jsx
    │   │   ├── CmcViewer.jsx
    │   │   ├── EventsPanel.jsx
    │   │   └── FirmwarePanel.jsx
    │   ├── hooks/               # React hooks
    │   │   ├── useCmcs.js
    │   │   └── useTheme.js
    │   └── utils/
    │       └── api.js           # CMC API client
    ├── index.html
    ├── package.json
    └── deploy.sh                # Deployment script
```

## 📋 Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **Modern web browser**: Chrome, Firefox, Safari, or Edge

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/michaelmadell/Enclosure-MGMT.git
cd Enclosure-MGMT
```

### 2. Set Up Backend

```bash
cd cmc-backend
npm install
```

**Create a `.env` file** (optional):
```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
```

### 3. Set Up Frontend

```bash
cd cmc-interface
npm install
```

**Create a `.env` file**:
```bash
VITE_API_URL=http://localhost:3001/api
```

For LAN access (Interface in one location, backend in another), replace `localhost` with your server's IP address:
```bash
VITE_API_URL=http://192.168.1.100:3001/api
```

## 🎮 Usage

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd cmc-backend
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd cmc-interface
npm run dev
```

Access the application at: `http://localhost:5173`

### Production Deployment

#### Backend (Persistent Service)

```bash
cd cmc-backend
npm install --production

# Run with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name cmc-backend
pm2 save
pm2 startup  # Follow instructions to enable auto-start

# Or run with node
node server.js
```

#### Frontend (Static Files)

```bash
cd cmc-interface
npm run build

# Serve with any static file server
# Example with nginx:
sudo cp -r dist/* /var/www/cmc-manager/

# Or use the included deploy script:
./deploy.sh
```

## 🔧 Configuration

### Backend Configuration

The backend uses SQLite for data storage. The database file is automatically created at `cmc-backend/cmc-manager.db`.

**Environment Variables:**
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGIN`: Allowed CORS origins (comma-separated, use `*` for development)

### Frontend Configuration

**Environment Variables:**
- `VITE_API_URL`: Backend API URL (required)

### Network Access

To access from other devices on your LAN:

1. Find your server's IP address:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update frontend `.env`:
   ```bash
   VITE_API_URL=http://YOUR_SERVER_IP:3001/api
   ```

3. Access from any device: `http://YOUR_SERVER_IP:5173`

## 🔑 Adding CMCs

1. Click the **"Add CMC"** button in the top-right
2. Fill in the details:
   - **Name**: Friendly identifier (e.g., "Rack 1 Enclosure")
   - **Address**: CMC web interface URL (e.g., `https://192.168.1.50`)
   - **Username**: CMC login username
   - **Password**: CMC login password
   - **Notes**: Optional description
3. Click **"Add CMC"**

## 🛠️ API Endpoints

### CMC Management
- `GET /api/cmcs` - Get all CMCs
- `GET /api/cmcs/:id` - Get single CMC
- `POST /api/cmcs` - Create new CMC
- `PUT /api/cmcs/:id` - Update CMC
- `DELETE /api/cmcs/:id` - Delete CMC

### Health Check
- `GET /health` - Server health status

## 🔄 Migration from localStorage

If you previously used a localStorage-based version:

```bash
cd cmc-backend
npm run migrate
# Follow the on-screen instructions
```

## 🎨 UI Components

### Main Interface
- **CmcSidebar**: List of all configured CMCs
- **CmcViewer**: Embedded CMC web interface with iframe
- **ApiToolsPanel**: Quick access controls (power, LED, fan, SSH)
- **EventsPanel**: System event log viewer
- **FirmwarePanel**: Firmware version history
- **TokenStatus**: API authentication status indicator

### Themes
- **Business (Dark)**: Default professional dark theme
- **Silk (Light)**: Clean light theme

Toggle themes using the theme button in the top-right corner.

## 🔐 Security Considerations

⚠️ **Important Security Notes:**

1. **Credentials Storage**: CMC credentials are stored in the SQLite database. Ensure proper file permissions:
   ```bash
   chmod 600 cmc-backend/cmc-manager.db
   ```

2. **Network Security**: 
   - Use HTTPS in production
   - Restrict access with firewall rules
   - Consider VPN access for remote management

3. **Authentication**: 
   - The application stores API tokens in browser localStorage
   - Tokens are cached for performance but are session-based

4. **CORS**: In production, configure specific allowed origins instead of `*`

## 🐛 Troubleshooting

### Backend Won't Start
- Check if port 3001 is already in use: `lsof -i :3001`
- Verify Node.js version: `node --version`
- Check database permissions: `ls -l cmc-backend/cmc-manager.db`

### Frontend Can't Connect to Backend
- Verify backend is running: `curl http://localhost:3001/health`
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors
- Ensure firewall allows connections on port 3001

### CMC Connection Issues
- Verify CMC is accessible: `curl -k https://CMC_ADDRESS`
- Check CMC credentials are correct
- Ensure CMC allows API access
- Check for SSL certificate issues (self-signed certificates)

### Auto-Login Not Working
- Ensure "Auto-Login" toggle is enabled (lock icon in viewer)
- Check browser console for authentication errors
- Verify CMC credentials are correct
- Try manual login first to verify connectivity

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines
1. Follow existing code style
2. Add comments for complex logic
3. Test on both light and dark themes
4. Ensure responsive design works on mobile

## 📝 License

[Add your license here]

## 👤 Author

**Michael Madell**

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components styled with [DaisyUI](https://daisyui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend powered by [Express](https://expressjs.com/)
- Database: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

**Note**: This application is designed for internal network use. Ensure proper security measures before exposing to the internet.