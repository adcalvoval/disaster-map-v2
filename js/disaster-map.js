// Main DisasterMap class - coordinates all modules
import { MapManager } from './map-manager.js';
import { DisasterEvents } from './disaster-events.js';
import { HealthFacilities } from './health-facilities.js';
import { ERUManager } from './eru-manager.js';
import { RapidResponseManager } from './rapid-response-manager.js';
import { EmergencyAppeals } from './emergency-appeals.js';
import { UIControls } from './ui-controls.js';
import { Utils } from './utils.js';
import { CompositeMarkerManager } from './composite-marker-manager.js';

export class DisasterMap {
    constructor() {
        // Configuration
        this.config = {
            defaultCenter: [20, 0],  // Center on equator, prime meridian
            defaultZoom: 2  // World view
        };

        // Impact zones data
        this.impactZones = [];
        this.impactZoneLayers = [];
        this.showImpactZones = false;

        // Initialize modules
        this.mapManager = new MapManager(this.config);
        this.map = null;

        // Will be initialized after map is created
        this.disasterEvents = null;
        this.healthFacilities = null;
        this.eruManager = null;
        this.rapidResponseManager = null;
        this.emergencyAppeals = null;
        this.uiControls = null;
        this.compositeMarkerManager = null;

        this.init();
    }

    init() {
        // Initialize map first
        this.map = this.mapManager.initMap();

        // Initialize composite marker manager
        this.compositeMarkerManager = new CompositeMarkerManager(this.map);

        // Initialize other modules with map reference
        this.disasterEvents = new DisasterEvents(this.map, this.config);
        this.healthFacilities = new HealthFacilities(this.map, this.config);
        this.eruManager = new ERUManager(this.map, this.config, this.compositeMarkerManager);
        this.rapidResponseManager = new RapidResponseManager(this.map, this.config, this.compositeMarkerManager);
        this.emergencyAppeals = new EmergencyAppeals(this.map, this.config);
        this.uiControls = new UIControls(this);

        // Set callback for when health facilities finish loading
        this.healthFacilities.onDataLoadedCallback = () => {
            if (this.impactZones.length > 0) {
                this.uiControls.updateImpactFacilitiesList();
            }
        };

        // Load data and initialize UI
        this.loadData();
        this.initializeUI();
    }

    async loadData() {
        // Load all data sources (health facilities loaded on-demand when user enables them)
        await Promise.all([
            this.disasterEvents.loadDisasterData(),
            this.loadImpactZones(),
            this.eruManager.loadActiveERUs(),
            this.rapidResponseManager.loadRapidResponsePersonnel(),
            this.emergencyAppeals.loadActiveAppeals()
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
            console.log('Loading impact zones from GDACS CAP...');

            const response = await fetch('/api/gdacs-cap');
            const result = await response.json();

            if (result.success && result.impactZones) {
                this.impactZones = result.impactZones;
                console.log(`✅ Loaded ${this.impactZones.length} impact zones from GDACS CAP`);

                if (this.showImpactZones) {
                    this.displayImpactZones();
                }

                // Update impact facilities list if health facilities are already loaded
                if (this.healthFacilities.dataLoaded) {
                    this.uiControls.updateImpactFacilitiesList();
                }
            } else {
                console.warn('❌ Failed to load impact zones from GDACS CAP API');
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
            if (zone.geometry) {
                const color = this.getImpactZoneColor(zone.severity);

                let layer;
                if (zone.geometry.type === 'Polygon') {
                    const coords = zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    layer = L.polygon(coords, {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.3,
                        weight: 2
                    });
                } else if (zone.geometry.type === 'Circle') {
                    // Handle circle geometry from GDACS CAP
                    const center = [zone.geometry.center[1], zone.geometry.center[0]];
                    layer = L.circle(center, {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.2,
                        radius: zone.geometry.radius,
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
                    const popupContent = `
                        <div class="impact-zone-popup">
                            <h3>${zone.title || 'Impact Zone'}</h3>
                            <p><strong>Event:</strong> ${zone.eventType || 'Unknown'}</p>
                            <p><strong>Severity:</strong> ${zone.severity || 'Unknown'}</p>
                            ${zone.populationAffected ? `<p><strong>Population Affected:</strong> ${zone.populationAffected.toLocaleString()}</p>` : ''}
                            ${zone.areaDescription ? `<p><strong>Area:</strong> ${zone.areaDescription}</p>` : ''}
                            ${zone.summary ? `<p>${zone.summary}</p>` : ''}
                        </div>
                    `;
                    layer.bindPopup(popupContent);
                    layer.addTo(this.map);
                    this.impactZoneLayers.push(layer);
                }
            }
        });

        console.log(`✅ Displayed ${this.impactZoneLayers.length} impact zones on map`);
    }

    getImpactZoneColor(severity) {
        // Handle both old format (high/medium/low) and GDACS CAP format (Extreme/Severe/Moderate/Minor)
        const colors = {
            'Extreme': '#dc2626',
            'Severe': '#dc2626',
            'Moderate': '#ea580c',
            'Minor': '#16a34a',
            'high': '#dc2626',
            'medium': '#ea580c',
            'low': '#16a34a'
        };
        return colors[severity] || colors['medium'];
    }

    clearImpactZones() {
        console.log(`Clearing ${this.impactZoneLayers.length} impact zones`);

        this.impactZoneLayers.forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        this.impactZoneLayers = [];
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