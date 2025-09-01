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

3. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env and add your IFRC GO API token if you want to use IFRC features
   ```

4. **Access the application:**
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
- `GET /api/health-facilities` - Health facilities data
- `GET /api/ifrc-documents` - IFRC humanitarian documents (requires API token)
- `GET /api/ifrc-countries` - IFRC countries list (requires API token)

## IFRC GO API Integration (Optional)

This application can integrate with the IFRC GO API to provide humanitarian response documents and country information.

### Setup IFRC Integration:

1. **Get an API token:**
   - Visit [https://goadmin.ifrc.org/](https://goadmin.ifrc.org/)
   - Create an account and obtain an API token

2. **Configure the token:**
   - Copy `.env` file in the project root
   - Set `IFRC_GO_API_TOKEN=your_actual_token_here`

3. **Features enabled with IFRC API:**
   - Access to humanitarian response documents
   - Country-specific disaster appeals
   - Enhanced disaster response information

**Note:** The application works fully without IFRC integration. IFRC features are optional enhancements.

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