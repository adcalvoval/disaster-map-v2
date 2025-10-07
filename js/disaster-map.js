// Main DisasterMap class - coordinates all modules
import { MapManager } from './map-manager.js';
import { DisasterEvents } from './disaster-events.js';
import { HealthFacilities } from './health-facilities.js';
import { ERUManager } from './eru-manager.js';
import { RapidResponseManager } from './rapid-response-manager.js';
import { UIControls } from './ui-controls.js';
import { Utils } from './utils.js';

export class DisasterMap {
    constructor() {
        // Configuration
        this.config = {
            defaultCenter: [-4.0383, 21.7587],
            defaultZoom: 6
        };

        // Impact zones data
        this.impactZones = [];
        this.showImpactZones = false;

        // Initialize modules
        this.mapManager = new MapManager(this.config);
        this.map = null;

        // Will be initialized after map is created
        this.disasterEvents = null;
        this.healthFacilities = null;
        this.eruManager = null;
        this.rapidResponseManager = null;
        this.uiControls = null;

        this.init();
    }

    init() {
        // Initialize map first
        this.map = this.mapManager.initMap();

        // Initialize other modules with map reference
        this.disasterEvents = new DisasterEvents(this.map, this.config);
        this.healthFacilities = new HealthFacilities(this.map, this.config);
        this.eruManager = new ERUManager(this.map, this.config);
        this.rapidResponseManager = new RapidResponseManager(this.map, this.config);
        this.uiControls = new UIControls(this);

        // Load data and initialize UI
        this.loadData();
        this.initializeUI();
    }

    async loadData() {
        // Load all data sources
        await Promise.all([
            this.disasterEvents.loadDisasterData(),
            this.loadImpactZones(),
            this.healthFacilities.loadHealthFacilities(),
            this.eruManager.loadActiveERUs(),
            this.rapidResponseManager.loadRapidResponsePersonnel()
        ]);
    }

    initializeUI() {
        // Initialize event listeners
        this.uiControls.initEventListeners();

        // Initialize facility type listeners
        this.initFacilityTypeListeners();
        this.initDisasterTypeListeners();

        // Populate country filters
        this.healthFacilities.populateCountryFilter();
    }

    // Impact Zones functionality
    async loadImpactZones() {
        try {
            console.log('Loading impact zones...');

            const response = await fetch('/api/impact-zones');
            const result = await response.json();

            if (result.success && result.zones) {
                this.impactZones = result.zones;
                console.log(`✅ Loaded ${this.impactZones.length} impact zones`);

                if (this.showImpactZones) {
                    this.displayImpactZones();
                }
            } else {
                console.warn('❌ Failed to load impact zones from API');
                this.impactZones = [];
            }

        } catch (error) {
            console.error('Error loading impact zones:', error);
            this.impactZones = [];
        }
    }

    displayImpactZones() {
        this.clearImpactZones();

        this.impactZones.forEach(zone => {
            if (zone.geometry && zone.geometry.coordinates) {
                const color = this.getImpactZoneColor(zone.properties.severity);

                let layer;
                if (zone.geometry.type === 'Polygon') {
                    const coords = zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    layer = L.polygon(coords, {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.3,
                        weight: 2
                    });
                } else if (zone.geometry.type === 'Point') {
                    const coords = [zone.geometry.coordinates[1], zone.geometry.coordinates[0]];
                    layer = L.circle(coords, {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.3,
                        radius: 5000
                    });
                }

                if (layer) {
                    layer.bindPopup(`
                        <div class="impact-zone-popup">
                            <h3>Impact Zone</h3>
                            <p><strong>Severity:</strong> ${zone.properties.severity}</p>
                            <p><strong>Type:</strong> ${zone.properties.type || 'Unknown'}</p>
                            <p>${zone.properties.description || 'No description available'}</p>
                        </div>
                    `);
                    layer.addTo(this.map);
                }
            }
        });
    }

    getImpactZoneColor(severity) {
        const colors = {
            'high': '#dc2626',
            'medium': '#ea580c',
            'low': '#16a34a'
        };
        return colors[severity] || colors['medium'];
    }

    clearImpactZones() {
        // Implementation would clear impact zone layers from map
        console.log('Clearing impact zones');
    }

    // Facility type listeners
    initFacilityTypeListeners() {
        const facilityTypes = ['fully-functional', 'partially-functional', 'non-functional', 'unknown'];

        facilityTypes.forEach(type => {
            const checkbox = document.getElementById(`show-${type}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.healthFacilities.updateHealthFacilitiesDisplay();
                });
            }
        });
    }

    initDisasterTypeListeners() {
        const disasterTypes = ['earthquake', 'flood', 'cyclone', 'wildfire', 'drought', 'volcanic', 'other'];

        disasterTypes.forEach(type => {
            const checkbox = document.getElementById(`show-${type}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.disasterEvents.updateDisasterEventsDisplay();
                });
            }
        });
    }

    // Public methods for external access
    focusOnEvent(eventId) {
        this.disasterEvents.focusOnEvent(eventId);
    }

    zoomToFacility(latitude, longitude, facilityName) {
        this.map.setView([latitude, longitude], 15);

        setTimeout(() => {
            const marker = this.healthFacilities.healthFacilityMarkers.find(m =>
                m.facilityData && m.facilityData.name === facilityName
            );
            if (marker) {
                marker.openTooltip();
            }
        }, 500);
    }

    // Utility method access
    static getRegionForCountry(country) {
        return Utils.getRegionForCountry(country);
    }

    static getCountryCoordinates(country) {
        return Utils.getCountryCoordinates(country);
    }
}