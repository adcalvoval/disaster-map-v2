// Map initialization and management
export class MapManager {
    constructor(config) {
        this.map = null;
        this.config = config;
        this.satelliteDateCaption = null;
        this.isSatelliteDateCaptionVisible = false;
        this.isFullscreen = false;
    }

    initMap() {
        // Initialize the map with the center over DRC
        this.map = L.map('map', {
            zoomControl: false
        }).setView([-4.0383, 21.7587], 6);

        // Add custom zoom control to bottom-right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Add OpenStreetMap tile layer
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // Add satellite tile layer
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
            maxZoom: 19
        });

        // Add base layers to map
        osmLayer.addTo(this.map);

        // Layer control
        const baseLayers = {
            "OpenStreetMap": osmLayer,
            "Satellite": satelliteLayer
        };

        L.control.layers(baseLayers).addTo(this.map);

        // Add scale control
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);

        // Custom control for satellite date caption
        this.createSatelliteDateCaption("Satellite imagery may be up to 3 years old");

        return this.map;
    }

    createSatelliteDateCaption(dateText) {
        if (this.satelliteDateCaption && this.isSatelliteDateCaptionVisible) {
            this.map.removeControl(this.satelliteDateCaption);
        }

        this.satelliteDateCaption = L.control({ position: 'bottomleft' });
        this.satelliteDateCaption.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'satellite-date-caption');
            div.innerHTML = `
                <div class="date-caption-content">
                    <span class="date-caption-icon">📅</span>
                    <span class="date-caption-text">${dateText}</span>
                </div>
            `;
            return div;
        };

        this.satelliteDateCaption.onRemove = function(map) {
            // Cleanup when removed
        };

        this.isSatelliteDateCaptionVisible = true;
        this.satelliteDateCaption.addTo(this.map);
    }

    toggleFullscreen() {
        const mapContainer = document.getElementById('map');
        const fullscreenBtn = document.getElementById('fullscreenToggle');

        if (!this.isFullscreen) {
            // Enter fullscreen
            mapContainer.classList.add('fullscreen');
            document.body.style.overflow = 'hidden';
            this.isFullscreen = true;

            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);

            if (fullscreenBtn) {
                fullscreenBtn.querySelector('.fullscreen-icon').textContent = '⛶';
                fullscreenBtn.title = 'Exit Fullscreen';
            }
        } else {
            // Exit fullscreen
            mapContainer.classList.remove('fullscreen');
            document.body.style.overflow = '';
            this.isFullscreen = false;

            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);

            if (fullscreenBtn) {
                fullscreenBtn.querySelector('.fullscreen-icon').textContent = '⛶';
                fullscreenBtn.title = 'Toggle Fullscreen';
            }
        }
    }
}