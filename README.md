# Global Disaster Alert Map

A web application that displays real-time disaster events from the Global Disaster Alert and Coordination System (GDACS) on an interactive OpenStreetMap.

## Features

- **Real-time disaster data** from GDACS API via backend proxy
- **Interactive map** with OpenStreetMap and custom markers
- **Alert level filtering** (Green, Orange, Red)
- **Multiple data sources** (DFO, GPM, DFOMERGE, RSS)
- **Responsive design** for desktop and mobile
- **Event details** with location, type, and alert levels

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open your browser and go to: `http://localhost:3003`

## API Endpoints

- `GET /` - Frontend application
- `GET /api/disasters` - Get disaster events (tries GDACS API, falls back to sample data)
  - Query parameters:
    - `source`: Data source (DFO, GPM, DFOMERGE, ALL)
    - `alertLevel`: Filter by alert level (GREEN, ORANGE, RED)
    - `from`: Start date (YYYY-MM-DD)
    - `to`: End date (YYYY-MM-DD)
- `GET /api/disasters/sample` - Get sample disaster events for testing
- `GET /api/health` - Health check

## Data Sources

- **GDACS Flood Data API** - Real-time flood and precipitation data
- **GDACS RSS Feed** - General disaster events (earthquakes, cyclones, etc.)
- **Fallback sample data** - For demonstration when APIs are unavailable

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js
- **Backend**: Node.js, Express.js
- **APIs**: GDACS, OpenStreetMap
- **Data formats**: JSON, XML/RSS

## Usage

1. The map loads with current disaster events automatically
2. Use the alert level dropdown to filter events by severity
3. Click "Refresh Data" to update with latest events
4. Click on markers or sidebar events to focus on specific disasters
5. Each event shows details including type, location, and alert level

## Notes

- The backend serves as a proxy to handle CORS restrictions from GDACS
- Multiple data sources ensure reliability
- Events are color-coded by alert level (Green/Orange/Red)
- Mobile-responsive design adapts to different screen sizes