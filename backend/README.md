# Earth Engine Backend API

This backend provides secure server-side access to Google Earth Engine for the disaster map application.

## Setup Instructions

### 1. Create Google Earth Engine Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Earth Engine API
4. Go to IAM & Admin > Service Accounts
5. Create a new service account:
   - Name: `earth-engine-backend`
   - Description: `Service account for Earth Engine backend API`
6. Grant the service account these roles:
   - `Earth Engine Resource Viewer`
   - `Earth Engine Resource Writer` (if needed)
7. Create a JSON key file and download it
8. Rename the downloaded file to `service-account-key.json`
9. Place it in this `/backend` directory

### 2. Local Development Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
python app.py
```

The backend will be available at `http://localhost:5000`

### 3. Production Deployment Options

#### Option A: Railway (Recommended)
1. Create account at [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Deploy the `/backend` folder
4. Set environment variable:
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Copy the entire contents of your service account JSON file

#### Option B: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-disaster-map-backend`
4. Set environment variables:
   ```bash
   heroku config:set GOOGLE_APPLICATION_CREDENTIALS_JSON="$(cat service-account-key.json)"
   ```
5. Deploy: `git push heroku main`

#### Option C: Google Cloud Run
1. Build container: `docker build -t disaster-map-backend .`
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Service account will be automatically available

## API Endpoints

### GET /health
Health check endpoint
```json
{
  "status": "healthy",
  "earth_engine_initialized": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

### GET /api/earth-engine-tiles
Get satellite imagery tiles
- **Parameters:**
  - `bbox`: Bounding box (optional, default: "-180,-90,180,90")
  - `start_date`: Start date (optional, default: "2024-01-01")
  - `end_date`: End date (optional, default: "2024-12-31")
  - `cloud_percentage`: Max cloud percentage (optional, default: 20)
  - `composite`: Use median composite instead of latest image (optional, default: false)

```json
{
  "success": true,
  "tiles_url": "https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/.../tiles/{z}/{x}/{y}?token=...",
  "date_info": "Sentinel-2 Latest Available",
  "attribution": "Google Earth Engine, Copernicus Sentinel-2"
}
```

### GET /api/earth-engine-image-date
Get the date of the most recent image for a location
- **Parameters:**
  - `lat`: Latitude (required)
  - `lon`: Longitude (required)

```json
{
  "success": true,
  "date": "2024-01-15",
  "formatted_date": "January 15, 2024"
}
```

## Security Notes

- Service account credentials are stored securely as environment variables in production
- CORS is configured to only allow requests from your frontend domains
- No sensitive credentials are exposed to the client-side
- All Earth Engine computations happen server-side

## Troubleshooting

1. **"Earth Engine not initialized"**
   - Check that your service account JSON is valid
   - Ensure Earth Engine API is enabled in Google Cloud Console
   - Verify service account has proper permissions

2. **CORS errors**
   - Add your frontend domain to the CORS origins list in `app.py`
   - Make sure the backend URL is correct in your frontend

3. **"No images found"**
   - Try increasing the cloud percentage parameter
   - Expand the date range
   - Check if the location has satellite coverage