// Rapid Response Personnel Management
import { Utils } from './utils.js';

export class RapidResponseManager {
    constructor(map, config, compositeMarkerManager) {
        this.map = map;
        this.config = config;
        this.compositeMarkerManager = compositeMarkerManager;
        this.activePersonnel = [];
        this.personnelMarkers = [];
        this.showRapidResponse = false;
    }

    async loadRapidResponsePersonnel() {
        try {
            console.log('Loading Rapid Response Personnel...');

            const response = await fetch('/api/rapid-response-personnel', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success && result.personnel) {
                this.activePersonnel = result.personnel;
                console.log(`✅ Loaded ${this.activePersonnel.length} rapid response personnel`);

                // Show source information
                if (result.source) {
                    console.log(`📡 Rapid Response data source: ${result.source}`);
                }

                // If checkbox is checked, display them now that data is loaded
                if (this.showRapidResponse) {
                    console.log('📍 Personnel loaded and checkbox is checked - displaying on map');
                    this.addPersonnelToMap();
                }
            } else {
                console.warn('❌ Failed to load rapid response personnel from API');
                this.activePersonnel = [];
            }

        } catch (error) {
            console.error('Error loading rapid response personnel:', error);
            this.activePersonnel = [];
        }
    }

    toggleRapidResponse() {
        if (this.showRapidResponse) {
            this.addPersonnelToMap();
        } else {
            this.clearPersonnelMarkers();
        }
    }

    addPersonnelToMap() {
        console.log(`Adding ${this.activePersonnel.length} rapid response personnel to map using composite markers`);

        // Clear existing personnel data from composite system first
        this.activePersonnel.forEach(person => {
            const lat = person.latitude;
            const lng = person.longitude;
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                const key = this.compositeMarkerManager.getLocationKey(lat, lng);
                const location = this.compositeMarkerManager.locationData.get(key);
                if (location && location.categories.personnel) {
                    delete location.categories.personnel;
                    if (Object.keys(location.categories).length === 0) {
                        this.compositeMarkerManager.locationData.delete(key);
                    }
                }
            }
        });

        // Add personnel data to composite marker manager
        this.activePersonnel.forEach(person => {
            try {
                const lat = person.latitude;
                const lng = person.longitude;

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                    console.log(`Filtered out personnel ${person.id}: invalid coordinates`);
                    return;
                }

                this.compositeMarkerManager.addLocationData(lat, lng, 'personnel', person);

            } catch (error) {
                console.error('Error processing personnel data:', error, person);
            }
        });

        // Trigger composite marker rendering (will combine with ERUs if both are active)
        this.compositeMarkerManager.renderCompositeMarkers();

        console.log(`✅ Added ${this.activePersonnel.length} personnel to composite marker system`);
    }

    clearPersonnelMarkers() {
        console.log(`Clearing ${this.personnelMarkers.length} personnel markers`);
        this.personnelMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.personnelMarkers = [];

        // Clear personnel data from composite marker system and re-render
        this.activePersonnel.forEach(person => {
            const lat = person.latitude;
            const lng = person.longitude;
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                const key = this.compositeMarkerManager.getLocationKey(lat, lng);
                const location = this.compositeMarkerManager.locationData.get(key);
                if (location && location.categories.personnel) {
                    delete location.categories.personnel;
                    // If no categories left, remove the location entirely
                    if (Object.keys(location.categories).length === 0) {
                        this.compositeMarkerManager.locationData.delete(key);
                    }
                }
            }
        });
        this.compositeMarkerManager.renderCompositeMarkers();
    }
}
