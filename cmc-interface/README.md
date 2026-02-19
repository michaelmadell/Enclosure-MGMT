# CMC Interface

React-based web interface for CMC Central Manager. Provides a modern UI to manage and control Chassis Management Controllers.

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: DaisyUI + Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks

## Structure

cmc-interface/ 
├── src/ 
│ ├── components/ # React components 
│ ├── hooks/ # Custom React hooks 
│ ├── utils/ # Utility functions 
│ ├── App.jsx # Main application 
│ ├── main.jsx # Entry point 
│ └── index.css # Global styles 
├── public/ # Static assets 
├── index.html # HTML template 
├── package.json # Dependencies 
├── vite.config.js # Vite configuration 
└── .env.example # Environment template

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:
```bash
VITE_API_URL=http://localhost:3001/api
```
For Network access:
```bash
VITE_API_URL=http://YOUR_SERVER_IP:3001/api
```

## Running 

**Development**
```bash
npm run dev
```
Access at: http://localhost:5173

**Production Build**

```bash
npm run build
```

**Preview Production Build**

```bash
npm run preview
```

# Components

## Core Components

- `App.jsx` - Main application container
- `CmcSidebar.jsx` - CMC list sidebar
- `CmcViewer.jsx` - Embedded CMC web interface
- `ApiToolsPanel.jsx` - Quick control panel
- `EventsPanel.jsx` - Event log viewer
- `FirmwarePanel.jsx` - Firmware history

## Modal Components
- `AddCmcModal.jsx` - Add new CMC
- `EditCmcModal.jsx` - Edit existing CMC

## Utility Components
- `EmptyState.jsx` - Empty state message
- `TokenStatus.jsx` - API authentication status
- `ThemeToggle.jsx` - Theme switcher

## Custom Hooks
- `useCmcs.js` - CMC data management
- `useTheme.js` - Theme state management

# Themes

Two themes available:
- **Business (Dark)** - Default professional theme
- **Silk (Light)** - Clean light theme
Toggle with the Theme button in the top-right

# Features
- Responsive design (mobile & desktop)
- Dark/Light theme support
- Embedded iframe with auto-login
- Real-time CMC control
- Event and firmware viewing
- Persistent state management

# Deployment
## Using Deploy Script
```bash
./deploy.sh
```
## Manual Deployment
```bash
npm run build
sudo cp -r dist/* /var/www/cmc-manager/
```
## With Docker
```bash
docker build -t cmc-interface .
docker run -p 80:80 cmc-interface
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (required)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter (if configured)

