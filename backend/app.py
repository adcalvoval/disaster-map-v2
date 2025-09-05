import ee
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.oauth2 import service_account
import json
from datetime import datetime, timedelta

app = Flask(__name__)

# Configure CORS for your frontend domain
CORS(app, origins=[
    'https://disaster-map-v2.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
])

def initialize_earth_engine():
    """Initialize Earth Engine with service account credentials"""
    try:
        # For production, use environment variable with service account JSON
        if os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON'):
            credentials_json = json.loads(os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON'))
            credentials = service_account.Credentials.from_service_account_info(
                credentials_json,
                scopes=['https://www.googleapis.com/auth/earthengine']
            )
            ee.Initialize(credentials)
        
        # For local development, use service account file
        elif os.path.exists('service-account-key.json'):
            credentials = service_account.Credentials.from_service_account_file(
                'service-account-key.json',
                scopes=['https://www.googleapis.com/auth/earthengine']
            )
            ee.Initialize(credentials)
        
        # Fallback to default credentials (if running on Google Cloud)
        else:
            ee.Initialize()
            
        print("✅ Earth Engine initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Earth Engine initialization failed: {e}")
        return False

# Initialize Earth Engine on startup
EE_INITIALIZED = initialize_earth_engine()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'earth_engine_initialized': EE_INITIALIZED,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/earth-engine-tiles', methods=['GET'])
def get_earth_engine_tiles():
    """Get Earth Engine satellite imagery tiles"""
    
    if not EE_INITIALIZED:
        return jsonify({
            'success': False,
            'error': 'Earth Engine not initialized'
        }), 500
    
    try:
        # Get query parameters
        bbox = request.args.get('bbox', '-180,-90,180,90')
        start_date = request.args.get('start_date', '2024-01-01')
        end_date = request.args.get('end_date', '2024-12-31')
        cloud_percentage = int(request.args.get('cloud_percentage', 20))
        
        print(f"🛰️ Requesting satellite tiles for bbox: {bbox}")
        
        # Create Earth Engine computation for recent high-quality imagery
        # Using Sentinel-2 for better resolution and more recent data
        collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterDate(start_date, end_date) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_percentage))
        
        # Get the most recent image or median composite
        if request.args.get('composite', 'false').lower() == 'true':
            image = collection.median()
            date_info = f"Sentinel-2 Composite ({start_date} to {end_date})"
        else:
            image = collection.sort('system:time_start', False).first()
            date_info = "Sentinel-2 Latest Available"
        
        # Visualization parameters for true color
        vis_params = {
            'bands': ['B4', 'B3', 'B2'],  # RGB
            'min': 0,
            'max': 3000,
            'gamma': 1.2
        }
        
        # Get map tiles
        map_id_dict = image.getMapId(vis_params)
        
        # Construct tile URL
        tiles_url = f"https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/{map_id_dict['mapid']}/tiles/{{z}}/{{x}}/{{y}}?token={map_id_dict['token']}"
        
        print(f"✅ Generated Earth Engine tiles successfully")
        
        return jsonify({
            'success': True,
            'tiles_url': tiles_url,
            'mapid': map_id_dict['mapid'],
            'token': map_id_dict['token'],
            'date_info': date_info,
            'attribution': 'Google Earth Engine, Copernicus Sentinel-2',
            'parameters': {
                'collection': 'COPERNICUS/S2_SR',
                'date_range': f"{start_date} to {end_date}",
                'max_cloud_percentage': cloud_percentage
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating Earth Engine tiles: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback_suggestion': 'Consider using ArcGIS World Imagery as fallback'
        }), 500

@app.route('/api/earth-engine-image-date', methods=['GET'])
def get_image_date():
    """Get the date of the most recent satellite image for a specific location"""
    
    if not EE_INITIALIZED:
        return jsonify({
            'success': False,
            'error': 'Earth Engine not initialized'
        }), 500
    
    try:
        # Get location parameters
        lat = float(request.args.get('lat', 0))
        lon = float(request.args.get('lon', 0))
        
        # Create a point geometry
        point = ee.Geometry.Point(lon, lat)
        
        # Get the most recent Sentinel-2 image for this location
        image = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(point) \
            .filterDate('2023-01-01', '2024-12-31') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)) \
            .sort('system:time_start', False) \
            .first()
        
        # Get image date
        date_ms = image.get('system:time_start').getInfo()
        date_obj = datetime.fromtimestamp(date_ms / 1000)
        
        return jsonify({
            'success': True,
            'date': date_obj.strftime('%Y-%m-%d'),
            'formatted_date': date_obj.strftime('%B %d, %Y'),
            'timestamp': date_ms
        })
        
    except Exception as e:
        print(f"❌ Error getting image date: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Earth Engine Backend API...")
    print(f"🌍 Earth Engine Status: {'✅ Ready' if EE_INITIALIZED else '❌ Not initialized'}")
    
    # Run in development mode
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=True
    )