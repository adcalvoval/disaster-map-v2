/**
 * Earth Engine Client - Frontend integration with backend API
 */
class EarthEngineClient {
    constructor(map, backendUrl = null) {
        this.map = map;
        this.currentLayer = null;
        this.dateCaption = null;
        this.isCaptionVisible = false;
        
        // Auto-detect backend URL based on environment
        this.backendUrl = backendUrl || this.detectBackendUrl();
        
        console.log(`🛰️ Earth Engine Client initialized with backend: ${this.backendUrl}`);
    }
    
    detectBackendUrl() {
        // For production, use your deployed backend URL
        if (window.location.hostname === 'disaster-map-v2.vercel.app') {
            return 'https://your-backend-url.railway.app'; // Replace with your actual backend URL
        }
        
        // For local development
        return 'http://localhost:5000';
    }
    
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            const data = await response.json();
            
            console.log('🔍 Backend health check:', data);
            
            return {
                healthy: data.status === 'healthy',
                earthEngineReady: data.earth_engine_initialized,
                message: data.earth_engine_initialized ? 
                    'Earth Engine backend is ready' : 
                    'Earth Engine not initialized on backend'
            };
        } catch (error) {
            console.error('❌ Backend health check failed:', error);
            return {
                healthy: false,
                earthEngineReady: false,
                message: 'Backend is not available'
            };
        }
    }
    
    async toggleSatelliteLayer(options = {}) {
        if (this.currentLayer) {
            // Remove current layer
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
            this.hideDateCaption();
            return { success: true, action: 'removed' };
        }
        
        try {
            console.log('🛰️ Loading Earth Engine satellite tiles...');
            
            // Check backend health first
            const healthCheck = await this.checkBackendHealth();
            if (!healthCheck.healthy || !healthCheck.earthEngineReady) {
                throw new Error(healthCheck.message);
            }
            
            // Build query parameters
            const params = new URLSearchParams({
                cloud_percentage: options.cloudPercentage || 20,
                start_date: options.startDate || '2024-01-01',
                end_date: options.endDate || '2024-12-31',
                composite: options.composite || 'false'
            });
            
            if (options.bbox) {
                params.set('bbox', options.bbox);
            }
            
            // Request tiles from backend
            const response = await fetch(`${this.backendUrl}/api/earth-engine-tiles?${params}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load satellite data');
            }
            
            // Create Leaflet tile layer
            this.currentLayer = L.tileLayer(data.tiles_url, {
                attribution: data.attribution || 'Google Earth Engine',
                opacity: options.opacity || 0.8,
                maxZoom: 18
            });
            
            // Add layer to map
            this.currentLayer.addTo(this.map);
            
            // Show date caption
            this.showDateCaption(data.date_info || 'Satellite Imagery');
            
            console.log('✅ Earth Engine layer added successfully');
            
            return {
                success: true,
                action: 'added',
                info: data.date_info,
                parameters: data.parameters
            };
            
        } catch (error) {
            console.error('❌ Failed to load Earth Engine data:', error);
            
            // Return error info for fallback handling
            return {
                success: false,
                error: error.message,
                fallbackSuggested: true
            };
        }
    }
    
    async getImageDateForLocation(lat, lon) {
        try {
            const response = await fetch(
                `${this.backendUrl}/api/earth-engine-image-date?lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    date: data.date,
                    formattedDate: data.formatted_date
                };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ Failed to get image date:', error);
            return { success: false, error: error.message };
        }
    }
    
    showDateCaption(dateText) {
        // Remove existing caption
        this.hideDateCaption();
        
        // Create new caption control
        const DateCaption = L.Control.extend({
            onAdd: function(map) {
                const div = L.DomUtil.create('div', 'satellite-date-caption');
                div.innerHTML = `
                    <div style="
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 1px 5px rgba(0,0,0,0.4);
                        margin-bottom: 70px;
                        margin-right: 10px;
                        pointer-events: none;
                    ">
                        📡 ${dateText}
                    </div>
                `;
                return div;
            },
            onRemove: function(map) {
                // Cleanup if needed
            }
        });
        
        this.dateCaption = new DateCaption({ position: 'bottomright' });
        this.dateCaption.addTo(this.map);
        this.isCaptionVisible = true;
    }
    
    hideDateCaption() {
        if (this.dateCaption && this.isCaptionVisible) {
            this.map.removeControl(this.dateCaption);
            this.isCaptionVisible = false;
            this.dateCaption = null;
        }
    }
    
    isActive() {
        return this.currentLayer !== null;
    }
    
    // Utility method for getting map bounds as bbox string
    getMapBounds() {
        const bounds = this.map.getBounds();
        return `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    }
}