// Emergency Response Units Management
import { Utils } from './utils.js';

export class ERUManager {
    constructor(map, config, compositeMarkerManager) {
        this.map = map;
        this.config = config;
        this.compositeMarkerManager = compositeMarkerManager;
        this.activeERUs = [];
        this.eruMarkers = [];
        this.showActiveERUs = false;
    }

    async loadActiveERUs() {
        try {
            console.log('Loading active Emergency Response Units...');

            const response = await fetch('/api/emergency-response-units', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success && result.erus) {
                this.activeERUs = result.erus;
                console.log(`✅ Loaded ${this.activeERUs.length} active ERUs`);

                // Show source information
                if (result.source) {
                    console.log(`📡 ERU data source: ${result.source}`);
                }

                // If ERU checkbox is checked, display them now that data is loaded
                if (this.showActiveERUs) {
                    console.log('📍 ERUs loaded and checkbox is checked - displaying on map');
                    this.addActiveERUsToMap();
                }
            } else {
                console.warn('❌ Failed to load ERUs from API');
                this.activeERUs = [];
            }

        } catch (error) {
            console.error('Error loading active ERUs:', error);
            this.activeERUs = [];
        }
    }

    toggleActiveERUs() {
        if (this.showActiveERUs) {
            this.addActiveERUsToMap();
        } else {
            this.clearERUMarkers();
        }
    }

    addActiveERUsToMap() {
        console.log(`Adding ${this.activeERUs.length} active ERUs to map using composite markers`);

        // Clear existing markers
        this.clearERUMarkers();

        // Add ERU data to composite marker manager
        this.activeERUs.forEach(eru => {
            try {
                const lat = eru.latitude;
                const lng = eru.longitude;

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                    console.log(`Filtered out ERU ${eru.id}: invalid coordinates`);
                    return;
                }

                this.compositeMarkerManager.addLocationData(lat, lng, 'eru', eru);

            } catch (error) {
                console.error('Error processing ERU data:', error, eru);
            }
        });

        // Trigger composite marker rendering (will combine with personnel if both are active)
        this.compositeMarkerManager.renderCompositeMarkers();

        console.log(`✅ Added ${this.activeERUs.length} ERUs to composite marker system`);
    }

    clearERUMarkers() {
        console.log(`Clearing ${this.eruMarkers.length} ERU markers`);
        this.eruMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.eruMarkers = [];
    }
}