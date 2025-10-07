// Health Facilities Management
import { Utils } from './utils.js';

export class HealthFacilities {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.healthFacilities = [];
        this.healthFacilityMarkers = [];
        this.healthFacilitiesCluster = null;
        this.showHealthFacilities = true;
        this.selectedHealthCountries = [];
        this.selectedHealthFunctionalities = [];
        this.selectedHealthFacilityTypes = {
            'Hospital': true,
            'Clinic': true,
            'Health Center': true,
            'Dispensary': true,
            'Mobile Unit': true,
            'Other': true
        };
        this.clusteringEnabled = true;
        this.disableClusteringOnCountryFilter = true;
    }

    async loadHealthFacilities() {
        try {
            console.log('Loading RCRC health facilities...');

            const response = await fetch('/api/health-facilities');
            const result = await response.json();

            if (result.success && result.facilities) {
                this.healthFacilities = result.facilities;
                console.log(`✅ Loaded ${this.healthFacilities.length} health facilities from IFRC API`);

                if (this.showHealthFacilities) {
                    this.addHealthFacilitiesToMap();
                    this.updateLegendCounts();
                }
            } else {
                console.warn('❌ Failed to load health facilities from API');
                this.healthFacilities = [];
            }

        } catch (error) {
            console.error('Error loading health facilities:', error);
            this.healthFacilities = [];
        }
    }

    initializeClusterGroup() {
        if (this.healthFacilitiesCluster) {
            this.map.removeLayer(this.healthFacilitiesCluster);
        }

        this.healthFacilitiesCluster = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let className = 'marker-cluster-small';
                if (count > 100) className = 'marker-cluster-large';
                else if (count > 10) className = 'marker-cluster-medium';

                return new L.DivIcon({
                    html: '<div><span>' + count + '</span></div>',
                    className: 'marker-cluster ' + className,
                    iconSize: new L.Point(40, 40)
                });
            },
            disableClusteringAtZoom: this.shouldDisableClustering() ? 1 : null,
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });

        this.map.addLayer(this.healthFacilitiesCluster);
    }

    shouldDisableClustering() {
        if (!this.clusteringEnabled) {
            return true;
        }

        if (this.disableClusteringOnCountryFilter && this.selectedHealthCountries.length > 0) {
            return true;
        }

        const currentZoom = this.map.getZoom();
        if (currentZoom >= 8) {
            return true;
        }

        return false;
    }

    addHealthFacilitiesToMap() {
        this.clearHealthFacilityMarkers();

        if (!this.healthFacilitiesCluster) {
            this.initializeClusterGroup();
        }

        let addedCount = 0;

        this.healthFacilities.forEach(facility => {
            try {
                if (!this.determineVisibility(facility)) {
                    return;
                }

                const lat = parseFloat(facility.latitude);
                const lng = parseFloat(facility.longitude);

                if (isNaN(lat) || isNaN(lng)) {
                    return;
                }

                const functionality = facility.functionality || 'Unknown';
                const color = this.getFunctionalityColor(functionality);
                const icon = this.createHealthFacilityIcon(color, functionality);

                const tooltipContent = `
                    <div class="health-facility-tooltip">
                        <strong>${facility.name || 'Unnamed Facility'}</strong><br>
                        <strong>Country:</strong> ${facility.country || 'Unknown'}<br>
                        <strong>Functionality:</strong> ${functionality}<br>
                        ${facility.type ? `<strong>Type:</strong> ${facility.type}<br>` : ''}
                        ${facility.zone ? `<strong>Zone:</strong> ${facility.zone}<br>` : ''}
                        ${facility.province ? `<strong>Province:</strong> ${facility.province}` : ''}
                    </div>
                `;

                const marker = L.marker([lat, lng], { icon: icon })
                    .bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10]
                    });

                marker.facilityData = facility;
                this.healthFacilityMarkers.push(marker);

                if (this.clusteringEnabled && !this.shouldDisableClustering()) {
                    this.healthFacilitiesCluster.addLayer(marker);
                } else {
                    marker.addTo(this.map);
                }

                addedCount++;

            } catch (error) {
                console.error('Error adding health facility marker:', error, facility);
            }
        });

        console.log(`✅ Added ${addedCount} health facility markers to map`);
    }

    getFunctionalityColor(functionality) {
        const colors = {
            'Fully functional': '#22c55e',
            'Partially functional': '#f59e0b',
            'Non functional': '#ef4444',
            'Unknown': '#6b7280'
        };

        return colors[functionality] || colors['Unknown'];
    }

    matchesFunctionalityFilter(functionality) {
        if (this.selectedHealthFunctionalities.length === 0) {
            return true;
        }
        return this.selectedHealthFunctionalities.includes(functionality);
    }

    determineVisibility(facility) {
        const countryMatch = this.selectedHealthCountries.length === 0 ||
                            this.selectedHealthCountries.includes(facility.country);
        const functionalityMatch = this.matchesFunctionalityFilter(facility.functionality);

        // Debug first few facilities
        if (this.healthFacilities.indexOf(facility) < 3) {
            console.log(`Facility visibility check:`, {
                name: facility.name,
                country: facility.country,
                functionality: facility.functionality,
                countryMatch,
                functionalityMatch,
                selectedCountries: this.selectedHealthCountries,
                selectedFunctionalities: this.selectedHealthFunctionalities
            });
        }

        return countryMatch && functionalityMatch;
    }

    createHealthFacilityIcon(color, type) {
        const iconSymbol = this.getHealthFacilitySymbol(type);

        return L.divIcon({
            className: 'health-facility-icon',
            html: `
                <div style="
                    background-color: ${color};
                    color: white;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    border: 2px solid #8B0000;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">${iconSymbol}</div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    }

    getHealthFacilitySymbol(type) {
        const symbols = {
            'Hospital': '🏥',
            'Clinic': '⚕️',
            'Health Center': '🩺',
            'Dispensary': '💊',
            'Mobile Unit': '🚑',
            'Fully functional': '✅',
            'Partially functional': '⚠️',
            'Non functional': '❌',
            'Unknown': '❓'
        };
        return symbols[type] || symbols['Unknown'];
    }

    clearHealthFacilityMarkers() {
        console.log(`Clearing ${this.healthFacilityMarkers.length} health facility markers`);

        if (this.healthFacilitiesCluster) {
            this.healthFacilitiesCluster.clearLayers();
        }

        this.healthFacilityMarkers.forEach(marker => {
            if (this.map.hasLayer(marker)) {
                this.map.removeLayer(marker);
            }
        });

        this.healthFacilityMarkers = [];
    }

    toggleHealthFacilities() {
        if (this.showHealthFacilities) {
            this.addHealthFacilitiesToMap();
        } else {
            this.clearHealthFacilityMarkers();
        }
    }

    populateCountryFilter() {
        const countrySet = new Set();
        this.healthFacilities.forEach(facility => {
            if (facility.country) {
                countrySet.add(facility.country);
            }
        });

        const countryFilter = document.getElementById('healthCountryFilter');
        if (countryFilter) {
            const sortedCountries = Array.from(countrySet).sort();
            countryFilter.innerHTML = '<option value="">All Countries</option>' +
                sortedCountries.map(country =>
                    `<option value="${country}">${country}</option>`
                ).join('');
        }
    }

    updateHealthFacilitiesDisplay() {
        this.addHealthFacilitiesToMap();
        this.updateLegendCounts();
    }

    filterHealthFacilities() {
        const countryFilter = document.getElementById('healthCountryFilter');
        const functionalityFilter = document.getElementById('healthFunctionalityFilter');

        this.selectedHealthCountries = countryFilter && countryFilter.value ? [countryFilter.value] : [];
        this.selectedHealthFunctionalities = functionalityFilter && functionalityFilter.value ? [functionalityFilter.value] : [];

        this.updateHealthFacilitiesDisplay();
    }

    getFacilityTypeCounts() {
        const counts = {};
        const functionalityMapping = {
            'Fully functional': 'fully-functional',
            'Partially functional': 'partially-functional',
            'Non functional': 'non-functional',
            'Unknown': 'unknown'
        };

        this.healthFacilities.forEach(facility => {
            if (this.determineVisibility(facility)) {
                const functionality = facility.functionality || 'Unknown';
                const key = functionalityMapping[functionality] || 'unknown';
                counts[key] = (counts[key] || 0) + 1;
            }
        });

        return counts;
    }

    updateLegendCounts() {
        const counts = this.getFacilityTypeCounts();

        Object.keys(counts).forEach(type => {
            const countElement = document.querySelector(`.legend-count[data-type="${type}"]`);
            if (countElement) {
                countElement.textContent = counts[type] || 0;
            }
        });

        const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const totalElement = document.querySelector('.health-total-count');
        if (totalElement) {
            totalElement.textContent = totalCount;
        }
    }

    toggleClustering() {
        this.clusteringEnabled = !this.clusteringEnabled;

        const clusterBtn = document.querySelector('.cluster-toggle-btn');
        if (clusterBtn) {
            clusterBtn.textContent = this.clusteringEnabled ? 'Disable Clustering' : 'Enable Clustering';
            clusterBtn.classList.toggle('disabled', !this.clusteringEnabled);
        }

        this.addHealthFacilitiesToMap();
    }
}