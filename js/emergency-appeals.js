// Emergency Appeals Management
import { Utils } from './utils.js';

export class EmergencyAppeals {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.activeAppeals = [];
        this.appealMarkers = [];
        this.appealLayers = [];
        this.countryBoundaries = null;
        this.showActiveAppeals = false;
    }

    async loadActiveAppeals() {
        try {
            console.log('Loading active Emergency Appeals...');

            // Load country boundaries and appeals in parallel
            const [appealsResponse, boundariesResponse] = await Promise.all([
                fetch('/api/emergency-appeals', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
            ]);

            const result = await appealsResponse.json();
            this.countryBoundaries = await boundariesResponse.json();

            if (result.success && result.appeals) {
                this.activeAppeals = result.appeals;
                console.log(`✅ Loaded ${this.activeAppeals.length} active Emergency Appeals`);
                console.log(`✅ Loaded country boundaries GeoJSON`);

                // Show source information
                if (result.source) {
                    console.log(`📡 Emergency Appeals data source: ${result.source}`);
                }

                // If appeals checkbox is checked, display them now that data is loaded
                if (this.showActiveAppeals) {
                    console.log('📍 Appeals loaded and checkbox is checked - displaying on map');
                    this.addActiveAppealsToMap();
                }
            } else {
                console.warn('❌ Failed to load Emergency Appeals from API');
                this.activeAppeals = [];
            }

        } catch (error) {
            console.error('Error loading active Emergency Appeals:', error);
            this.activeAppeals = [];
        }
    }

    toggleActiveAppeals() {
        if (this.showActiveAppeals) {
            this.addActiveAppealsToMap();
        } else {
            this.clearAppealMarkers();
        }
    }

    addActiveAppealsToMap() {
        console.log(`Adding ${this.activeAppeals.length} active Emergency Appeals to map`);

        // Clear existing layers
        this.clearAppealMarkers();

        if (!this.countryBoundaries || !this.countryBoundaries.features) {
            console.warn('❌ Country boundaries not loaded yet');
            return;
        }

        // Group appeals by country
        const appealsByCountry = new Map();
        this.activeAppeals.forEach(appeal => {
            if (!appealsByCountry.has(appeal.country)) {
                appealsByCountry.set(appeal.country, []);
            }
            appealsByCountry.get(appeal.country).push(appeal);
        });

        console.log(`📊 Grouped appeals into ${appealsByCountry.size} countries`);

        let addedCount = 0;

        // For each country with appeals, find and display the country polygon
        appealsByCountry.forEach((appeals, countryName) => {
            try {
                // Find the country feature in the GeoJSON
                const countryFeature = this.countryBoundaries.features.find(feature => {
                    const featureName = feature.properties.ADMIN || feature.properties.name || feature.properties.NAME;
                    return featureName === countryName ||
                           featureName.toLowerCase() === countryName.toLowerCase();
                });

                if (!countryFeature) {
                    console.warn(`⚠️ Could not find boundary for country: ${countryName}`);
                    return;
                }

                // Create the polygon layer with red outline and transparent fill
                const layer = L.geoJSON(countryFeature, {
                    style: {
                        color: '#dc2626',        // Red outline
                        weight: 3,               // Thick outline
                        fillColor: '#dc2626',    // Red fill
                        fillOpacity: 0.5         // 50% transparency
                    }
                });

                // Build tooltip content showing all appeals for this country
                let tooltipContent = `<div class="appeal-tooltip"><strong>Emergency Appeal${appeals.length > 1 ? 's' : ''}</strong><br><strong>Country:</strong> ${countryName}<br><br>`;

                appeals.forEach((appeal, index) => {
                    const startDate = Utils.formatDate(appeal.start_date);
                    const endDate = appeal.end_date ? Utils.formatDate(appeal.end_date) : 'Ongoing';

                    if (index > 0) tooltipContent += '<br>';
                    tooltipContent += `<strong>Appeal ${index + 1}:</strong> ${appeal.name}<br>`;
                    tooltipContent += `<strong>Disaster Type:</strong> ${appeal.disaster_type}<br>`;
                    tooltipContent += `<strong>Start Date:</strong> ${startDate}<br>`;
                    tooltipContent += `<strong>End Date:</strong> ${endDate}`;
                    if (index < appeals.length - 1) tooltipContent += '<br>';
                });

                tooltipContent += '</div>';

                // Bind tooltip to the layer
                layer.bindTooltip(tooltipContent, {
                    permanent: false,
                    direction: 'top',
                    sticky: true
                });

                // Add layer to map
                layer.addTo(this.map);
                this.appealLayers.push(layer);
                addedCount++;

            } catch (error) {
                console.error(`Error adding polygon for country ${countryName}:`, error);
            }
        });

        console.log(`✅ Added ${addedCount} country polygons for Emergency Appeals`);
    }

    clearAppealMarkers() {
        console.log(`Clearing ${this.appealMarkers.length} Emergency Appeal markers and ${this.appealLayers.length} polygon layers`);

        // Clear old marker-based appeals (if any)
        this.appealMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.appealMarkers = [];

        // Clear polygon layers
        this.appealLayers.forEach(layer => {
            this.map.removeLayer(layer);
        });
        this.appealLayers = [];
    }
}
