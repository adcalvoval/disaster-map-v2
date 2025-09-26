class DisasterMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.affectedAreas = [];
        this.impactZones = [];
        this.impactZoneLayer = null;
        this.disasterEvents = [];
        this.filteredEvents = [];
        this.selectedEventId = null;
        this.showAffectedAreas = true;
        this.showImpactZones = false;
        this.healthFacilityMarkers = [];
        this.healthFacilities = [];
        this.showHealthFacilities = false;
        this.currentCountryFilter = null; // Track current country filter
        this.currentTypeFilter = null; // Track current facility type filter
        this.healthFacilitiesCluster = null; // Cluster group for health facilities
        this.csvHealthFacilityMarkers = [];
        this.csvHealthFacilities = [];
        this.shapefileHealthFacilities = [];
        this.showOtherHealthFacilities = false;
        this.selectedHealthCountries = []; // Health facilities country filter (multi-select)
        this.selectedHealthFunctionality = ''; // Health facilities functionality filter
        this.selectedImpactFacilityCountry = ''; // Impact facilities country filter
        this.isFullscreen = false; // Fullscreen mode state
        this.baseLayer = null; // OpenStreetMap base layer
        this.satelliteLayer = null; // Satellite imagery layer
        this.showSatelliteLayer = false; // Satellite layer visibility
        this.satelliteDateCaption = null; // Date caption control for satellite imagery
        this.isSatelliteDateCaptionVisible = false; // Track if caption is currently displayed
        this.clusteringEnabled = true; // Control clustering state
        this.disableClusteringOnCountryFilter = true; // Disable clustering when filtering by country
        this.facilityTypeVisibility = {
            'Primary Health Care Centres': true,
            'Primary Health Care Center': true,
            'Ambulance Stations': true,
            'Ambulance Station': true,
            'Blood Centres': true,
            'Blood Center': true,
            'Hospitals': true,
            'Hospital': true,
            'Pharmacies': true,
            'Pharmacy': true,
            'Training Facilities': true,
            'Training Facility': true,
            'Specialized Services': true,
            'Residential Facilities': true,
            'Residential Facility': true,
            'Other': true
        };
        this.disasterTypeVisibility = {
            'Earthquake': true,
            'Flood': true,
            'Cyclone': true,
            'Wildfire': true,
            'Volcanic Activity': true,
            'Other': true
        };
        this.activeERUs = [];
        this.eruMarkers = [];
        this.showActiveERUs = false;
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.loadDisasterData();
        this.loadImpactZones();
        this.loadHealthFacilities();
        this.loadActiveERUs();
        // Removed: CSV and shapefile loading - now using IFRC API only
        // this.loadCsvHealthFacilities();
        // this.loadShapefileHealthFacilities();
        
        
        // Create fallback satellite date caption
        this.createSatelliteDateCaption('ArcGIS World Imagery');
    }

    getRegionForCountry(country) {
        const regionMap = {
            // North America
            'United States': 'North America',
            'Canada': 'North America',
            'Mexico': 'North America',

            // Central America
            'Guatemala': 'Central America',
            'Belize': 'Central America',
            'Honduras': 'Central America',
            'El Salvador': 'Central America',
            'Nicaragua': 'Central America',
            'Costa Rica': 'Central America',
            'Panama': 'Central America',

            // South America
            'Brazil': 'South America',
            'Argentina': 'South America',
            'Chile': 'South America',
            'Peru': 'South America',
            'Colombia': 'South America',
            'Venezuela': 'South America',
            'Ecuador': 'South America',
            'Bolivia': 'South America',
            'Paraguay': 'South America',
            'Uruguay': 'South America',
            'Guyana': 'South America',
            'Suriname': 'South America',
            'French Guiana': 'South America',

            // Africa
            'Nigeria': 'Africa',
            'South Africa': 'Africa',
            'Kenya': 'Africa',
            'Egypt': 'Africa',
            'Morocco': 'Africa',
            'Algeria': 'Africa',
            'Tunisia': 'Africa',
            'Libya': 'Africa',
            'Sudan': 'Africa',
            'South Sudan': 'Africa',
            'Ethiopia': 'Africa',
            'Somalia': 'Africa',
            'Uganda': 'Africa',
            'Tanzania': 'Africa',
            'Rwanda': 'Africa',
            'Burundi': 'Africa',
            'Democratic Republic of the Congo': 'Africa',
            'Republic of the Congo': 'Africa',
            'Central African Republic': 'Africa',
            'Chad': 'Africa',
            'Niger': 'Africa',
            'Mali': 'Africa',
            'Burkina Faso': 'Africa',
            'Ghana': 'Africa',
            'Ivory Coast': 'Africa',
            'Liberia': 'Africa',
            'Sierra Leone': 'Africa',
            'Guinea': 'Africa',
            'Senegal': 'Africa',
            'Mauritania': 'Africa',
            'Gambia': 'Africa',
            'Guinea-Bissau': 'Africa',
            'Cape Verde': 'Africa',
            'Cameroon': 'Africa',
            'Equatorial Guinea': 'Africa',
            'Gabon': 'Africa',
            'São Tomé and Príncipe': 'Africa',
            'Angola': 'Africa',
            'Zambia': 'Africa',
            'Zimbabwe': 'Africa',
            'Botswana': 'Africa',
            'Namibia': 'Africa',
            'Lesotho': 'Africa',
            'Eswatini': 'Africa',
            'Madagascar': 'Africa',
            'Mauritius': 'Africa',
            'Seychelles': 'Africa',
            'Comoros': 'Africa',
            'Djibouti': 'Africa',
            'Eritrea': 'Africa',
            'Mozambique': 'Africa',
            'Malawi': 'Africa',

            // Middle East
            'Saudi Arabia': 'Middle East',
            'Iran': 'Middle East',
            'Iraq': 'Middle East',
            'Israel': 'Middle East',
            'Palestine': 'Middle East',
            'Jordan': 'Middle East',
            'Lebanon': 'Middle East',
            'Syria': 'Middle East',
            'Turkey': 'Middle East',
            'United Arab Emirates': 'Middle East',
            'Kuwait': 'Middle East',
            'Qatar': 'Middle East',
            'Bahrain': 'Middle East',
            'Oman': 'Middle East',
            'Yemen': 'Middle East',
            'Cyprus': 'Middle East',

            // Europe
            'Germany': 'Europe',
            'France': 'Europe',
            'Italy': 'Europe',
            'Spain': 'Europe',
            'Poland': 'Europe',
            'Romania': 'Europe',
            'Netherlands': 'Europe',
            'Belgium': 'Europe',
            'Greece': 'Europe',
            'Portugal': 'Europe',
            'Czech Republic': 'Europe',
            'Hungary': 'Europe',
            'Sweden': 'Europe',
            'Austria': 'Europe',
            'Belarus': 'Europe',
            'Switzerland': 'Europe',
            'Bulgaria': 'Europe',
            'Serbia': 'Europe',
            'Denmark': 'Europe',
            'Finland': 'Europe',
            'Slovakia': 'Europe',
            'Norway': 'Europe',
            'Ireland': 'Europe',
            'Croatia': 'Europe',
            'Bosnia and Herzegovina': 'Europe',
            'Albania': 'Europe',
            'Lithuania': 'Europe',
            'Slovenia': 'Europe',
            'Latvia': 'Europe',
            'Estonia': 'Europe',
            'Moldova': 'Europe',
            'Macedonia': 'Europe',
            'North Macedonia': 'Europe',
            'Luxembourg': 'Europe',
            'Malta': 'Europe',
            'Iceland': 'Europe',
            'Monaco': 'Europe',
            'Liechtenstein': 'Europe',
            'San Marino': 'Europe',
            'Vatican': 'Europe',
            'Montenegro': 'Europe',
            'Kosovo': 'Europe',
            'United Kingdom': 'Europe',
            'Ukraine': 'Europe',
            'Russia': 'Europe',

            // Central Asia
            'Kazakhstan': 'Central Asia',
            'Uzbekistan': 'Central Asia',
            'Turkmenistan': 'Central Asia',
            'Tajikistan': 'Central Asia',
            'Kyrgyzstan': 'Central Asia',
            'Afghanistan': 'Central Asia',
            'Mongolia': 'Central Asia',

            // Asia
            'China': 'Asia',
            'India': 'Asia',
            'Indonesia': 'Asia',
            'Pakistan': 'Asia',
            'Bangladesh': 'Asia',
            'Japan': 'Asia',
            'Philippines': 'Asia',
            'Vietnam': 'Asia',
            'Turkey': 'Asia', // Could be Middle East or Asia - keeping Middle East above
            'Thailand': 'Asia',
            'Myanmar': 'Asia',
            'South Korea': 'Asia',
            'Malaysia': 'Asia',
            'Nepal': 'Asia',
            'Sri Lanka': 'Asia',
            'Cambodia': 'Asia',
            'Jordan': 'Asia', // Could be Middle East - keeping Middle East above
            'Laos': 'Asia',
            'Singapore': 'Asia',
            'Oman': 'Asia', // Could be Middle East - keeping Middle East above
            'Lebanon': 'Asia', // Could be Middle East - keeping Middle East above
            'Bhutan': 'Asia',
            'Brunei': 'Asia',
            'Maldives': 'Asia',
            'North Korea': 'Asia',
            'East Timor': 'Asia',

            // Oceania
            'Australia': 'Oceania',
            'Papua New Guinea': 'Oceania',
            'New Zealand': 'Oceania',
            'Fiji': 'Oceania',
            'Solomon Islands': 'Oceania',
            'Vanuatu': 'Oceania',
            'Samoa': 'Oceania',
            'Micronesia': 'Oceania',
            'Tonga': 'Oceania',
            'Kiribati': 'Oceania',
            'Palau': 'Oceania',
            'Marshall Islands': 'Oceania',
            'Tuvalu': 'Oceania',
            'Nauru': 'Oceania'
        };

        return regionMap[country] || 'Other';
    }

    getCountryCoordinates(country) {
        const countryCoords = {
            // Major countries with approximate center coordinates and zoom levels
            'Afghanistan': { lat: 33.0, lng: 65.0, zoom: 6 },
            'Algeria': { lat: 28.0, lng: 3.0, zoom: 5 },
            'Angola': { lat: -12.5, lng: 18.5, zoom: 6 },
            'Argentina': { lat: -38.4, lng: -63.6, zoom: 5 },
            'Australia': { lat: -25.3, lng: 133.8, zoom: 5 },
            'Austria': { lat: 47.5, lng: 14.6, zoom: 7 },
            'Bangladesh': { lat: 23.7, lng: 90.4, zoom: 7 },
            'Belgium': { lat: 50.5, lng: 4.5, zoom: 8 },
            'Bolivia': { lat: -16.3, lng: -63.6, zoom: 6 },
            'Brazil': { lat: -14.2, lng: -51.9, zoom: 5 },
            'Canada': { lat: 56.1, lng: -106.3, zoom: 4 },
            'Chad': { lat: 15.5, lng: 19.0, zoom: 6 },
            'Chile': { lat: -35.7, lng: -71.5, zoom: 5 },
            'China': { lat: 35.9, lng: 104.2, zoom: 4 },
            'Colombia': { lat: 4.6, lng: -74.1, zoom: 6 },
            'Czech Republic': { lat: 49.8, lng: 15.5, zoom: 7 },
            'Democratic Republic of Congo': { lat: -4.0, lng: 21.8, zoom: 5 },
            'Ecuador': { lat: -1.8, lng: -78.2, zoom: 7 },
            'Egypt': { lat: 26.8, lng: 30.8, zoom: 6 },
            'Ethiopia': { lat: 9.1, lng: 40.5, zoom: 6 },
            'Finland': { lat: 61.9, lng: 25.7, zoom: 6 },
            'France': { lat: 46.6, lng: 2.2, zoom: 6 },
            'Germany': { lat: 51.2, lng: 10.4, zoom: 6 },
            'Ghana': { lat: 7.9, lng: -1.0, zoom: 7 },
            'Greece': { lat: 39.1, lng: 21.8, zoom: 7 },
            'Guatemala': { lat: 15.8, lng: -90.2, zoom: 7 },
            'Haiti': { lat: 18.9, lng: -72.3, zoom: 8 },
            'Honduras': { lat: 15.2, lng: -86.2, zoom: 7 },
            'India': { lat: 20.6, lng: 78.9, zoom: 5 },
            'Indonesia': { lat: -0.8, lng: 113.9, zoom: 5 },
            'Iran, Islamic Republic of': { lat: 32.4, lng: 53.7, zoom: 6 },
            'Iraq': { lat: 33.2, lng: 43.7, zoom: 6 },
            'Italy': { lat: 41.9, lng: 12.6, zoom: 6 },
            'Japan': { lat: 36.2, lng: 138.3, zoom: 6 },
            'Jordan': { lat: 30.6, lng: 36.2, zoom: 7 },
            'Kenya': { lat: -0.0, lng: 37.9, zoom: 6 },
            'Libya': { lat: 26.3, lng: 17.2, zoom: 6 },
            'Madagascar': { lat: -18.8, lng: 47.0, zoom: 6 },
            'Mali': { lat: 17.6, lng: -4.0, zoom: 6 },
            'Mexico': { lat: 23.6, lng: -102.6, zoom: 5 },
            'Morocco': { lat: 31.8, lng: -7.1, zoom: 6 },
            'Myanmar': { lat: 21.9, lng: 95.9, zoom: 6 },
            'Nepal': { lat: 28.4, lng: 84.1, zoom: 7 },
            'Niger': { lat: 17.6, lng: 8.1, zoom: 6 },
            'Nigeria': { lat: 9.1, lng: 8.7, zoom: 6 },
            'Norway': { lat: 60.5, lng: 8.5, zoom: 5 },
            'Pakistan': { lat: 30.4, lng: 69.3, zoom: 6 },
            'Palestine': { lat: 31.9, lng: 35.2, zoom: 8 },
            'Paraguay': { lat: -23.4, lng: -58.4, zoom: 6 },
            'Peru': { lat: -9.2, lng: -75.0, zoom: 6 },
            'Philippines': { lat: 12.9, lng: 121.8, zoom: 6 },
            'Poland': { lat: 51.9, lng: 19.1, zoom: 6 },
            'Portugal': { lat: 39.4, lng: -8.2, zoom: 7 },
            'Romania': { lat: 45.9, lng: 24.9, zoom: 6 },
            'Russian Federation': { lat: 61.5, lng: 105.3, zoom: 3 },
            'Rwanda': { lat: -1.9, lng: 29.9, zoom: 8 },
            'Saudi Arabia': { lat: 23.9, lng: 45.1, zoom: 6 },
            'Somalia': { lat: 5.2, lng: 46.2, zoom: 6 },
            'South Africa': { lat: -30.6, lng: 22.9, zoom: 6 },
            'South Sudan': { lat: 6.9, lng: 31.3, zoom: 6 },
            'Spain': { lat: 40.5, lng: -3.7, zoom: 6 },
            'Sudan': { lat: 12.9, lng: 30.4, zoom: 6 },
            'Sweden': { lat: 60.1, lng: 18.6, zoom: 5 },
            'Turkey': { lat: 38.9, lng: 35.2, zoom: 6 },
            'Uganda': { lat: 1.4, lng: 32.3, zoom: 7 },
            'Ukraine': { lat: 48.4, lng: 31.2, zoom: 6 },
            'United Kingdom': { lat: 55.4, lng: -3.4, zoom: 6 },
            'United States': { lat: 39.8, lng: -98.6, zoom: 4 },
            'Venezuela': { lat: 6.4, lng: -66.6, zoom: 6 },
            'Yemen': { lat: 15.6, lng: 48.5, zoom: 7 },
            'Zimbabwe': { lat: -19.0, lng: 29.2, zoom: 7 }
        };

        return countryCoords[country] || null;
    }

    initMap() {
        this.map = L.map('map').setView([20, 0], 2);
        
        // Create base layer (OpenStreetMap)
        this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        });
        
        // Create satellite layer (ArcGIS World Imagery)
        this.satelliteLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18,
        });
        
        // Add base layer by default
        this.baseLayer.addTo(this.map);

        // Initialize health facilities cluster group with dynamic clustering
        this.initializeClusterGroup();
    }

    initializeClusterGroup() {
        // Create cluster group with dynamic settings based on current state
        const shouldDisableClustering = this.shouldDisableClustering();

        this.healthFacilitiesCluster = L.markerClusterGroup({
            maxClusterRadius: 50, // Reduce clustering distance for better separation
            disableClusteringAtZoom: shouldDisableClustering ? 1 : 8, // Disable at zoom 1 (always) if clustering should be disabled, otherwise at zoom 8
            spiderfyOnMaxZoom: true, // Spread markers when clicking cluster at max zoom
            showCoverageOnHover: false, // Don't show cluster coverage area
            zoomToBoundsOnClick: true, // Zoom to cluster bounds when clicked
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
            }
        });

        // Add zoom event listener for dynamic clustering control
        this.map.on('zoomend', () => {
            this.handleZoomBasedClustering();
        });
    }

    shouldDisableClustering() {
        // Disable clustering if:
        // 1. User has manually disabled clustering
        // 2. User has selected specific countries and the setting is enabled
        // 3. Zoom level is high enough

        if (!this.clusteringEnabled) {
            return true;
        }

        if (this.disableClusteringOnCountryFilter && this.selectedHealthCountries.length > 0) {
            return true;
        }

        // Check zoom level (disable clustering at zoom 8+ for better detail)
        const currentZoom = this.map ? this.map.getZoom() : 0;
        if (currentZoom >= 8) {
            return true;
        }

        return false;
    }

    handleZoomBasedClustering() {
        // Only recreate cluster group if clustering state has changed
        const shouldDisable = this.shouldDisableClustering();
        const currentDisableZoom = this.healthFacilitiesCluster.options.disableClusteringAtZoom;

        // If we need to change clustering behavior, recreate the cluster group
        if ((shouldDisable && currentDisableZoom !== 1) || (!shouldDisable && currentDisableZoom === 1)) {
            this.recreateClusterGroup();
        }
    }

    recreateClusterGroup() {
        // Store current markers
        const currentMarkers = [];
        this.healthFacilitiesCluster.eachLayer(layer => {
            currentMarkers.push(layer);
        });

        // Remove old cluster group from map
        if (this.map.hasLayer(this.healthFacilitiesCluster)) {
            this.map.removeLayer(this.healthFacilitiesCluster);
        }

        // Reinitialize cluster group with new settings
        this.initializeClusterGroup();

        // Re-add all markers to new cluster group
        currentMarkers.forEach(marker => {
            this.healthFacilitiesCluster.addLayer(marker);
        });

        // Add cluster group back to map if health facilities are visible
        if (this.showHealthFacilities) {
            this.map.addLayer(this.healthFacilitiesCluster);
        }

        console.log(`🔄 Recreated cluster group. Clustering ${this.shouldDisableClustering() ? 'DISABLED' : 'ENABLED'}`);
    }

    toggleClustering() {
        this.clusteringEnabled = !this.clusteringEnabled;
        this.recreateClusterGroup();

        // Update UI button if it exists
        const clusterBtn = document.getElementById('toggle-clustering-btn');
        if (clusterBtn) {
            clusterBtn.textContent = this.clusteringEnabled ? '🔗 Disable Clustering' : '🔗 Enable Clustering';
            clusterBtn.title = this.clusteringEnabled ? 'Disable facility clustering' : 'Enable facility clustering';
        }

        console.log(`Clustering ${this.clusteringEnabled ? 'enabled' : 'disabled'} by user`);
    }

    createSatelliteDateCaption(dateText) {
        // Remove existing caption if it exists
        if (this.satelliteDateCaption && this.isSatelliteDateCaptionVisible) {
            this.map.removeControl(this.satelliteDateCaption);
            this.isSatelliteDateCaptionVisible = false;
        }

        // Create a custom Leaflet control for the date caption
        const DateCaption = L.Control.extend({
            onAdd: function(map) {
                const div = L.DomUtil.create('div', 'satellite-date-caption');
                div.innerHTML = dateText;
                div.style.cssText = `
                    background: rgba(255, 255, 255, 0.9);
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    box-shadow: 0 1px 5px rgba(0,0,0,0.4);
                    border: 1px solid #ccc;
                    pointer-events: none;
                    margin-bottom: 70px;
                    margin-right: 10px;
                `;
                return div;
            },
            onRemove: function(map) {
                // Nothing to do here
            }
        });

        this.satelliteDateCaption = new DateCaption({ position: 'bottomright' });
    }


    initEventListeners() {
        document.getElementById('refreshData').addEventListener('click', () => {
            this.loadDisasterData();
        });



        document.getElementById('alertLevel').addEventListener('change', (e) => {
            this.filterByAlertLevel(e.target.value);
        });

        document.getElementById('showAffectedAreas').addEventListener('change', (e) => {
            this.showAffectedAreas = e.target.checked;
            this.toggleDisasterEvents();

            // Hide/show the disaster events control box
            const disasterControlsBox = document.getElementById('disasterEventsControls');
            if (disasterControlsBox) {
                disasterControlsBox.style.display = e.target.checked ? 'block' : 'none';
            }
        });

        document.getElementById('showImpactZones').addEventListener('change', (e) => {
            this.showImpactZones = e.target.checked;
            this.toggleImpactZones();
        });

        document.getElementById('showHealthFacilities').addEventListener('change', (e) => {
            this.showHealthFacilities = e.target.checked;
            this.toggleHealthFacilities();
        });


        document.getElementById('showOtherHealthFacilities').addEventListener('change', (e) => {
            this.showOtherHealthFacilities = e.target.checked;
            this.toggleOtherHealthFacilities();
        });

        // Clustering toggle button
        const clusteringBtn = document.getElementById('toggle-clustering-btn');
        if (clusteringBtn) {
            clusteringBtn.addEventListener('click', () => {
                this.toggleClustering();
            });
        }

        // Event search functionality
        document.getElementById('eventSearch').addEventListener('input', (e) => {
            this.searchEvents(e.target.value);
        });

        document.getElementById('clearEventSearch').addEventListener('click', () => {
            this.clearEventSearch();
        });

        document.getElementById('clearEventSelection').addEventListener('click', () => {
            this.clearEventSelection();
        });

        // Fullscreen toggle
        document.getElementById('fullscreenToggle').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.toggleFullscreen();
            }
        });

        // Satellite layer toggle
        document.getElementById('showSatelliteLayer').addEventListener('change', (e) => {
            this.showSatelliteLayer = e.target.checked;
            this.toggleSatelliteLayer();
        });

        document.getElementById('showActiveERUs').addEventListener('change', (e) => {
            this.showActiveERUs = e.target.checked;
            this.toggleActiveERUs();
        });


        // Sidebar drawer toggle
        const sidebarToggle = document.getElementById('toggleSidebar');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                this.toggleSidebar();
            });
        }

        // Drawer close button
        const drawerCloseBtn = document.getElementById('drawerCloseBtn');
        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        // Health controls collapse/expand toggle
        const healthToggle = document.getElementById('toggleHealthControls');
        if (healthToggle) {
            healthToggle.addEventListener('click', (e) => {
                this.toggleHealthControlsCollapse();
            });
        }

        // Disaster controls collapse/expand toggle
        const disasterToggle = document.getElementById('toggleDisasterControls');
        if (disasterToggle) {
            disasterToggle.addEventListener('click', (e) => {
                this.toggleDisasterControlsCollapse();
            });
        }

        // Map controls collapse/expand toggle
        const mapControlsToggle = document.getElementById('toggleMapControls');
        if (mapControlsToggle) {
            mapControlsToggle.addEventListener('click', (e) => {
                this.toggleMapControlsCollapse();
            });
        }



        // Health facilities country filter (multi-select)
        const healthCountryFilter = document.getElementById('healthCountryFilter');
        if (healthCountryFilter) {
            healthCountryFilter.addEventListener('change', (e) => {
                this.selectedHealthCountries = Array.from(e.target.selectedOptions).map(option => option.value);
                this.filterHealthFacilities();
            });
        }

        // Health facilities functionality filter
        const healthFunctionalityFilter = document.getElementById('healthFunctionalityFilter');
        if (healthFunctionalityFilter) {
            healthFunctionalityFilter.addEventListener('change', (e) => {
                this.selectedHealthFunctionality = e.target.value;
                this.filterHealthFacilities();
            });
        }


        // Impact facilities country filter
        const facilityCountryFilter = document.getElementById('facilityCountryFilter');
        if (facilityCountryFilter) {
            facilityCountryFilter.addEventListener('change', (e) => {
                this.selectedImpactFacilityCountry = e.target.value;
                console.log(`🔍 Impact facility country filter changed to: "${this.selectedImpactFacilityCountry}"`);
                this.updateImpactFacilitiesList();
                this.updateCountryStats(this.selectedImpactFacilityCountry || null);
            });
            console.log('✅ Impact facility country filter event listener added');
        } else {
            console.error('❌ facilityCountryFilter element not found!');
        }

        // Add event listeners for individual facility type checkboxes
        this.initFacilityTypeListeners();
        
        // Add event listeners for disaster type checkboxes
        this.initDisasterTypeListeners();
        // Note: initHealthFacilityCountryFilter() is called after health facilities are loaded
    }


    async loadDisasterData() {
        try {
            document.getElementById('eventList').innerHTML = '<div class="loading">Loading real disaster events from GDACS...</div>';
            this.clearMarkers();
            this.clearAffectedAreas();

            const data = await this.fetchGDACSData();
            
            this.disasterEvents = data;
            this.displayEvents(data);
            this.addMarkersToMap(data);
            if (this.showAffectedAreas) {
                this.addAffectedAreasToMap(data);
            }
            
        } catch (error) {
            console.error('Error loading disaster data:', error);
            document.getElementById('eventList').innerHTML = '<div class="loading">Error loading data from backend. Using sample data...</div>';
            
            const sampleData = this.getSampleData();
            this.disasterEvents = sampleData;
            this.displayEvents(sampleData);
            this.addMarkersToMap(sampleData);
            if (this.showAffectedAreas) {
                this.addAffectedAreasToMap(sampleData);
            }
        }
    }

    async loadDisasterDataWithDates(fromDate, toDate) {
        try {
            document.getElementById('eventList').innerHTML = '<div class="loading">Loading disaster events from GDACS...</div>';
            this.clearMarkers();
            this.clearAffectedAreas();
            
            const events = await this.fetchGDACSDataWithDates(fromDate, toDate);
            this.disasterEvents = events;
            this.filteredEvents = [...events];
            this.addMarkersToMap(events);
            this.displayEvents(this.filteredEvents);
            this.addAffectedAreasToMap(events);
            
            console.log(`Loaded ${events.length} disaster events for date range ${fromDate} to ${toDate}`);
        } catch (error) {
            console.error('Error loading disaster data with dates:', error);
            document.getElementById('eventList').innerHTML = '<div class="error">Error loading events. Please try again.</div>';
        }
    }

    async fetchGDACSData() {
        try {
            // Use backend proxy to fetch GDACS data
            const alertLevel = document.getElementById('alertLevel').value;
            
            // Default to last 6 months of data for better disaster coverage
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setMonth(fromDate.getMonth() - 6);
            
            const params = new URLSearchParams({
                source: 'ALL',
                from: fromDate.toISOString().split('T')[0], // YYYY-MM-DD format
                to: toDate.toISOString().split('T')[0],
                ...(alertLevel && { alertLevel })
            });

            const response = await fetch(`/api/disasters?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.events) {
                console.log(`Loaded ${result.count} disaster events from backend`);
                return result.events;
            } else {
                throw new Error(result.error || 'No events received from backend');
            }
        } catch (error) {
            console.error('Backend proxy fetch failed:', error);
            throw error;
        }
    }

    async fetchGDACSDataWithDates(fromDate, toDate) {
        try {
            // Use backend proxy to fetch GDACS data with custom dates
            const alertLevel = document.getElementById('alertLevel').value;
            
            const params = new URLSearchParams({
                source: 'ALL',
                from: fromDate,
                to: toDate,
                ...(alertLevel && { alertLevel })
            });

            const response = await fetch(`/api/disasters?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.events) {
                console.log(`Loaded ${result.count} disaster events from backend for date range ${fromDate} to ${toDate}`);
                return result.events;
            } else {
                throw new Error(result.error || 'No events received');
            }
        } catch (error) {
            console.error('Error fetching GDACS data with dates:', error);
            throw error;
        }
    }

    getSampleData() {
        return [
            {
                id: 'sample_1',
                title: 'Flood Alert - Bangladesh',
                type: 'Flood',
                alertLevel: 'RED',
                latitude: 23.6850,
                longitude: 90.3563,
                date: '2024-12-01',
                description: 'Severe flooding in central Bangladesh affecting multiple districts.',
                affectedRadius: 75,
                affectedPopulation: 2500000,
                impactDescription: '2.5M people affected'
            },
            {
                id: 'sample_2',
                title: 'Earthquake - Turkey',
                type: 'Earthquake',
                alertLevel: 'ORANGE',
                latitude: 39.9334,
                longitude: 32.8597,
                date: '2024-11-30',
                description: 'Moderate earthquake detected in central Turkey region.',
                magnitude: 5.8,
                affectedRadius: 50,
                affectedPopulation: 850000,
                impactDescription: '850K people affected, Magnitude 5.8'
            },
            {
                id: 'sample_3',
                title: 'Cyclone Watch - Philippines',
                type: 'Cyclone',
                alertLevel: 'ORANGE',
                latitude: 14.5995,
                longitude: 120.9842,
                date: '2024-12-02',
                description: 'Tropical cyclone approaching the Philippines archipelago.',
                affectedRadius: 150,
                affectedPopulation: 3200000,
                impactDescription: '3.2M people affected, Intensity 3'
            },
            {
                id: 'sample_4',
                title: 'Wildfire - California',
                type: 'Wildfire',
                alertLevel: 'RED',
                latitude: 34.0522,
                longitude: -118.2437,
                date: '2024-11-29',
                description: 'Large wildfire burning in Southern California.',
                affectedRadius: 20,
                affectedPopulation: 125000,
                impactDescription: '125K people affected'
            },
            {
                id: 'sample_5',
                title: 'Volcano Alert - Indonesia',
                type: 'Volcano',
                alertLevel: 'GREEN',
                latitude: -7.5360,
                longitude: 110.4978,
                date: '2024-11-28',
                description: 'Volcanic activity monitoring in Java island.',
                affectedRadius: 25,
                affectedPopulation: 45000,
                impactDescription: '45K people affected'
            }
        ];
    }

    sortEventsByAlertLevel(events) {
        const alertPriority = { 'RED': 0, 'ORANGE': 1, 'GREEN': 2 };
        return events.slice().sort((a, b) => {
            const priorityA = alertPriority[a.alertLevel] !== undefined ? alertPriority[a.alertLevel] : 3;
            const priorityB = alertPriority[b.alertLevel] !== undefined ? alertPriority[b.alertLevel] : 3;
            return priorityA - priorityB;
        });
    }

    displayEvents(events) {
        const eventList = document.getElementById('eventList');
        if (events.length === 0) {
            eventList.innerHTML = '<div class="loading">No disaster events found.</div>';
            return;
        }

        // Sort events by alert level: RED first, then ORANGE, then GREEN
        const sortedEvents = this.sortEventsByAlertLevel(events);

        const eventsHTML = sortedEvents.map(event => `
            <div class="event-item ${event.alertLevel.toLowerCase()}" onclick="app.focusOnEvent('${event.id}')">
                <div class="event-title">${event.title}</div>
                <div class="event-details">
                    Type: ${event.type}<br>
                    Date: ${event.date}<br>
                    Location: ${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}<br>
                    ${event.source ? `Source: ${event.source}` : ''}
                    ${event.magnitude ? `<br>Magnitude: ${event.magnitude}` : ''}
                </div>
                <span class="alert-badge alert-${event.alertLevel.toLowerCase()}">${event.alertLevel}</span>
            </div>
        `).join('');

        eventList.innerHTML = eventsHTML;
    }

    addMarkersToMap(events) {
        events.forEach(event => {
            const color = this.getAlertColor(event.alertLevel);
            const icon = this.createCustomIcon(color, event.type);
            
            const marker = L.marker([event.latitude, event.longitude], { 
                icon,
                zIndexOffset: 2000
            })
                .addTo(this.map)
                .bindPopup(`
                    <div>
                        <h4>${event.title}</h4>
                        <p><strong>Type:</strong> ${event.type}</p>
                        <p><strong>Alert Level:</strong> ${event.alertLevel}</p>
                        <p><strong>Date:</strong> ${event.date}</p>
                        <p><strong>Description:</strong> ${event.description}</p>
                    </div>
                `);

            marker.eventId = event.id;
            this.markers.push(marker);
        });
    }

    createCustomIcon(color, type) {
        const iconSymbol = this.getDisasterSymbol(type);
        
        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div style="
                    background-color: ${color};
                    color: white;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    border: 2px solid #006400;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
                    z-index: 2000;
                    position: relative;
                ">${iconSymbol}</div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    getDisasterSymbol(type) {
        const symbols = {
            'Flood': '🌊',
            'Earthquake': '🌍',
            'Cyclone': '🌀',
            'Volcano': '🌋',
            'Wildfire': '🔥',
            'Precipitation': '🌧️'
        };
        return symbols[type] || '⚠️';
    }

    getAlertColor(alertLevel) {
        const colors = {
            'GREEN': '#27ae60',
            'ORANGE': '#f39c12',
            'RED': '#e74c3c'
        };
        return colors[alertLevel] || '#3498db';
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    clearAffectedAreas() {
        this.affectedAreas.forEach(area => {
            this.map.removeLayer(area);
        });
        this.affectedAreas = [];
    }

    addAffectedAreasToMap(events) {
        events.forEach(event => {
            if (event.affectedRadius && event.affectedRadius > 0) {
                const color = this.getAlertColor(event.alertLevel);
                const circle = L.circle([event.latitude, event.longitude], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    radius: event.affectedRadius * 1000, // Convert km to meters
                    weight: 2,
                    opacity: 0.6
                }).addTo(this.map);

                circle.bindPopup(`
                    <div>
                        <h4>Affected Area</h4>
                        <p><strong>Event:</strong> ${event.title}</p>
                        <p><strong>Type:</strong> ${event.type}</p>
                        <p><strong>Radius:</strong> ${event.affectedRadius} km</p>
                        ${event.affectedPopulation ? `<p><strong>Population:</strong> ${this.formatPopulation(event.affectedPopulation)}</p>` : ''}
                        ${event.impactDescription ? `<p><strong>Impact:</strong> ${event.impactDescription}</p>` : ''}
                    </div>
                `);

                circle.eventId = event.id;
                this.affectedAreas.push(circle);
            }
        });
    }

    formatPopulation(population) {
        if (population >= 1000000) {
            return `${(population / 1000000).toFixed(1)}M people`;
        } else if (population >= 1000) {
            return `${(population / 1000).toFixed(0)}K people`;
        } else {
            return `${population} people`;
        }
    }

    toggleDisasterEvents() {
        if (this.showAffectedAreas) {
            // Show both disaster event markers and affected areas
            this.addMarkersToMap(this.disasterEvents);
            this.addAffectedAreasToMap(this.disasterEvents);
            console.log('✅ Disaster events and affected areas shown');
        } else {
            // Hide both disaster event markers and affected areas
            this.clearMarkers();
            this.clearAffectedAreas();
            console.log('❌ Disaster events and affected areas hidden');
        }
    }

    filterByAlertLevel(alertLevel) {
        // Use the comprehensive filter method that considers both alert level and disaster type
        this.updateDisasterEventsDisplay();
    }

    updateDisasterEventsDisplay() {
        // Filter events based on disaster type visibility
        const filteredEvents = this.disasterEvents.filter(event => {
            return this.disasterTypeVisibility[event.type] !== false;
        });

        // Also apply alert level filter if one is active
        const alertLevel = document.getElementById('alertLevel').value;
        const finalFilteredEvents = alertLevel ? 
            filteredEvents.filter(event => event.alertLevel === alertLevel) : 
            filteredEvents;

        // Update the display
        this.clearMarkers();
        this.clearAffectedAreas();
        this.displayEvents(finalFilteredEvents);
        this.addMarkersToMap(finalFilteredEvents);
        if (this.showAffectedAreas) {
            this.addAffectedAreasToMap(finalFilteredEvents);
        }

        console.log(`🔍 Disaster type filter applied. Showing ${finalFilteredEvents.length} of ${this.disasterEvents.length} events`);
    }

    focusOnEvent(eventId) {
        const event = this.disasterEvents.find(e => e.id === eventId);
        
        if (event) {
            // Check if this event is already selected - if so, clear the selection
            if (this.selectedEventId === eventId) {
                this.clearEventSelection();
                return;
            }
            
            // Set the selected event
            this.selectedEventId = eventId;
            
            // Clear existing markers and areas
            this.clearMarkers();
            this.clearAffectedAreas();
            if (this.impactZoneLayer) {
                this.map.removeLayer(this.impactZoneLayer);
            }
            
            // Show only the selected disaster event
            this.addMarkersToMap([event]);
            if (this.showAffectedAreas) {
                this.addAffectedAreasToMap([event]);
            }
            
            // Filter impact zones for this specific disaster if available
            if (this.showImpactZones && this.impactZones.length > 0) {
                this.filterImpactZonesForEvent(eventId);
            }
            
            // Zoom to the event
            this.map.setView([event.latitude, event.longitude], 8);
            
            // Find and open the marker popup
            const marker = this.markers.find(m => m.eventId === eventId);
            if (marker) {
                marker.openPopup();
            }
            
            // Update the facilities list for this specific event
            this.updateImpactFacilitiesList();
            
            // Add visual indicator that an event is selected
            this.highlightSelectedEvent(eventId);
        }
    }

    filterImpactZonesForEvent(eventId) {
        const selectedEvent = this.disasterEvents.find(e => e.id === eventId);
        if (!selectedEvent) return;
        
        if (this.impactZoneLayer) {
            this.map.removeLayer(this.impactZoneLayer);
        }
        
        // Create a layer group for impact zones
        this.impactZoneLayer = L.layerGroup();
        
        const selectedEventLatLng = L.latLng(selectedEvent.latitude, selectedEvent.longitude);
        
        // For each impact zone, find which disaster event it's closest to
        const relevantZones = this.impactZones.filter(zone => {
            if (zone.geometry.type === 'Polygon') {
                // Calculate the centroid of the polygon
                const coordinates = zone.geometry.coordinates[0];
                const centroidLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                const centroidLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                const zoneLatLng = L.latLng(centroidLat, centroidLng);
                
                // Find the closest disaster event to this impact zone
                let closestDistance = Infinity;
                let closestEventId = null;
                
                this.disasterEvents.forEach(event => {
                    const eventLatLng = L.latLng(event.latitude, event.longitude);
                    const distance = zoneLatLng.distanceTo(eventLatLng);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEventId = event.id;
                    }
                });
                
                // Only include this zone if the selected event is the closest one
                // and within a reasonable distance (100km)
                return closestEventId === eventId && closestDistance <= 100000;
            }
            return false;
        });
        
        relevantZones.forEach(zone => {
            let layer;
            
            if (zone.geometry.type === 'Polygon') {
                // Create polygon layer
                const coordinates = zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Convert to [lat, lon]
                layer = L.polygon(coordinates, {
                    color: this.getImpactZoneColor(zone.severity),
                    fillColor: this.getImpactZoneColor(zone.severity),
                    fillOpacity: 0.4,
                    weight: 2
                });
                
                // Add popup with zone information
                layer.bindPopup(`
                    <strong>Impact Zone</strong><br>
                    Severity: ${zone.severity || 'Unknown'}<br>
                    Area: ${zone.area || 'Unknown'}<br>
                    Closest to: ${selectedEvent.title}
                `);
                
                this.impactZoneLayer.addLayer(layer);
            }
        });
        
        // Add layer group to map
        this.impactZoneLayer.addTo(this.map);
        
        console.log(`Filtered impact zones: showing ${relevantZones.length} zones closest to ${selectedEvent.title}`);
    }

    highlightSelectedEvent(eventId) {
        // Remove existing highlighting
        document.querySelectorAll('.event-item').forEach(item => {
            item.classList.remove('selected-event');
        });
        
        // Add highlighting to selected event
        document.querySelectorAll('.event-item').forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick && onclick.includes(`'${eventId}'`)) {
                item.classList.add('selected-event');
            }
        });
        
        // Show clear selection button
        document.getElementById('clearEventSelection').style.display = 'block';
    }

    clearEventSelection() {
        this.selectedEventId = null;
        
        // Hide clear selection button
        document.getElementById('clearEventSelection').style.display = 'none';
        
        // Remove highlighting
        document.querySelectorAll('.event-item').forEach(item => {
            item.classList.remove('selected-event');
        });
        
        // Show all events again
        this.clearMarkers();
        this.clearAffectedAreas();
        if (this.impactZoneLayer) {
            this.map.removeLayer(this.impactZoneLayer);
        }
        
        // Restore all events
        this.addMarkersToMap(this.disasterEvents);
        if (this.showAffectedAreas) {
            this.addAffectedAreasToMap(this.disasterEvents);
        }
        if (this.showImpactZones && this.impactZones.length > 0) {
            this.addImpactZonesToMap();
        }

        // Reset to global view
        this.map.setView([20, 0], 2);

        // Update facilities list
        this.updateImpactFacilitiesList();
    }





    // Impact Zones Methods
    async loadImpactZones() {
        try {
            console.log('Loading impact zones from GDACS CAP XML...');
            const response = await fetch('/api/gdacs-cap');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.impactZones) {
                console.log(`Loaded ${result.count} impact zones`);
                this.impactZones = result.impactZones;
                this.displayImpactZones();
            } else {
                throw new Error(result.error || 'No impact zones received');
            }
        } catch (error) {
            console.error('Error loading impact zones:', error);
            this.impactZones = [];
        }
    }

    displayImpactZones() {
        console.log(`🗺️ displayImpactZones called - showImpactZones: ${this.showImpactZones}, zones: ${this.impactZones.length}`);

        if (!this.showImpactZones) {
            console.log('🚫 Not showing impact zones - returning early');
            return;
        }

        if (this.impactZones.length === 0) {
            console.warn('⚠️ No impact zones to display');
            return;
        }

        // Remove existing impact zone layer
        if (this.impactZoneLayer) {
            this.map.removeLayer(this.impactZoneLayer);
            console.log('🗑️ Removed existing impact zone layer');
        }

        // Create a layer group for impact zones
        this.impactZoneLayer = L.layerGroup();
        console.log(`📍 Creating layer group for ${this.impactZones.length} impact zones`);
        
        this.impactZones.forEach(zone => {
            let layer;
            
            if (zone.geometry.type === 'Polygon') {
                // Create polygon layer
                const coordinates = zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Convert to [lat, lon]
                layer = L.polygon(coordinates, {
                    color: this.getImpactZoneColor(zone.severity),
                    fillColor: this.getImpactZoneColor(zone.severity),
                    fillOpacity: 0.2,
                    weight: 2,
                    opacity: 0.7
                });
            } else if (zone.geometry.type === 'Circle') {
                // Create circle layer
                const [lon, lat] = zone.geometry.center;
                const radiusMeters = zone.geometry.radius || 50000;
                layer = L.circle([lat, lon], {
                    radius: radiusMeters,
                    color: this.getImpactZoneColor(zone.severity),
                    fillColor: this.getImpactZoneColor(zone.severity),
                    fillOpacity: 0.2,
                    weight: 2,
                    opacity: 0.7
                });
            }
            
            if (layer) {
                // Add popup with impact zone information
                const popupContent = `
                    <div>
                        <h4>${zone.title}</h4>
                        <p><strong>Event Type:</strong> ${zone.eventType}</p>
                        <p><strong>Severity:</strong> ${zone.severity}</p>
                        <p><strong>Area:</strong> ${zone.areaDescription}</p>
                        ${zone.magnitude ? `<p><strong>Magnitude:</strong> ${zone.magnitude}</p>` : ''}
                        ${zone.depth ? `<p><strong>Depth:</strong> ${zone.depth} km</p>` : ''}
                        ${zone.populationAffected ? `<p><strong>Population Affected:</strong> ${zone.populationAffected.toLocaleString()}</p>` : ''}
                        <p><strong>Updated:</strong> ${new Date(zone.updated).toLocaleString()}</p>
                    </div>
                `;
                
                layer.bindPopup(popupContent);
                this.impactZoneLayer.addLayer(layer);
            }
        });
        
        // Add layer group to map
        this.impactZoneLayer.addTo(this.map);
        console.log(`Added ${this.impactZones.length} impact zones to map`);
        
        // Update the impact facilities list after adding impact zones
        this.updateImpactFacilitiesList();
    }

    getImpactZoneColor(severity) {
        switch (severity?.toLowerCase()) {
            case 'extreme':
                return '#8B0000'; // Dark red
            case 'severe':
                return '#FF0000'; // Red
            case 'moderate':
                return '#FF4500'; // Orange red
            case 'minor':
                return '#FFA500'; // Orange
            case 'unknown':
            default:
                return '#FFD700'; // Gold
        }
    }

    toggleImpactZones() {
        console.log(`🎯 Toggle impact zones: ${this.showImpactZones ? 'ON' : 'OFF'}`);
        console.log(`📊 Impact zones available: ${this.impactZones.length}`);

        if (this.showImpactZones) {
            if (this.impactZones.length === 0) {
                console.warn('⚠️ No impact zones data available. Trying to reload...');
                this.loadImpactZones();
                return;
            }

            // If a disaster is selected, show only impact zones for that disaster
            if (this.selectedEventId) {
                console.log(`🎯 Filtering impact zones for event: ${this.selectedEventId}`);
                this.filterImpactZonesForEvent(this.selectedEventId);
            } else {
                // Show all impact zones
                console.log(`🌍 Displaying all ${this.impactZones.length} impact zones`);
                this.displayImpactZones();
            }
        } else {
            console.log(`🚫 Hiding impact zones`);
            if (this.impactZoneLayer) {
                this.map.removeLayer(this.impactZoneLayer);
            }
        }
        // Update the impact facilities list when impact zones are toggled
        this.updateImpactFacilitiesList();
    }

    // Health Facilities Methods
    async loadHealthFacilities() {
        try {
            console.log('Loading RCRC health facilities...');
            
            let allFacilities = [];
            let offset = 0;
            const limit = 10000; // Increased to fetch all facilities in fewer requests
            let hasMore = true;

            while (hasMore && allFacilities.length < 15000) { // Cap at 15000 to get all facilities
                console.log(`Fetching batch ${Math.floor(offset / limit) + 1} (offset: ${offset})`);
                const response = await fetch(`/api/health-facilities?limit=${limit}&offset=${offset}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success && result.facilities) {
                    allFacilities = allFacilities.concat(result.facilities);
                    console.log(`Batch loaded: ${result.count} facilities. Total: ${allFacilities.length}`);

                    // Check if there are more facilities to fetch using the new pagination structure
                    hasMore = result.pagination ? result.pagination.has_next : (result.facilities.length === limit && allFacilities.length < result.total);
                    offset += limit;
                } else {
                    console.warn('No facilities in response or error:', result.error);
                    hasMore = false;
                }
                
                // Add a small delay between requests to be respectful to the API
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log(`Loaded ${allFacilities.length} total RCRC health facilities`);
            
            // Add visibility field to each facility based on affiliation
            allFacilities.forEach(facility => {
                facility.visibility = this.determineVisibility(facility);
            });
            
            this.healthFacilities = allFacilities;
            this.populateCountryFilter();
            this.initHealthFacilityCountryFilter(); // Initialize after data is loaded
            this.initImpactFacilitiesCountryFilter(); // Initialize impact facilities filter
            this.updateImpactFacilitiesList(); // Initialize the facilities list
            this.updateLegendCounts();

            // If health facilities checkbox is checked, display them now that data is loaded
            if (this.showHealthFacilities) {
                console.log('📍 Health facilities loaded and checkbox is checked - displaying on map');
                this.addHealthFacilitiesToMap();
            }
            
        } catch (error) {
            console.error('Error loading RCRC health facilities:', error);
            this.healthFacilities = [];
        }
    }

    async loadActiveERUs() {
        try {
            console.log('Loading active Emergency Response Units...');

            const response = await fetch('/api/emergency-response-units?limit=10000');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

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

    addHealthFacilitiesToMap() {
        console.log(`Adding health facilities to map with clustering. Total facilities: ${this.healthFacilities.length}`);
        console.log('Facility type visibility:', this.facilityTypeVisibility);
        console.log('Selected health countries:', this.selectedHealthCountries);
        console.log('Selected health functionality:', this.selectedHealthFunctionality);
        console.log(`🏥 Total health facilities loaded: ${this.healthFacilities.length}`);

        // Debug: Show sample facility structure
        if (this.healthFacilities.length > 0) {
            console.log('📋 Sample facility structure:', this.healthFacilities[0]);
        }

        // Clear existing markers
        this.clearHealthFacilityMarkers();

        let addedCount = 0;
        let filteredByType = 0;
        let filteredByCountry = 0;
        let filteredByFunctionality = 0;

        this.healthFacilities.forEach(facility => {
            console.log(`Processing facility: ${facility.name} (type: ${facility.type}, country: ${facility.country})`);

            // Debug France facilities specifically
            if (facility.country === 'France') {
                console.log(`France facility details:`, {
                    name: facility.name,
                    type: facility.type,
                    lat: facility.latitude,
                    lng: facility.longitude,
                    coordinates: `${facility.latitude},${facility.longitude}`
                });
            }

            // Debug German facilities specifically
            if (facility.country === 'Germany') {
                console.log(`Germany facility details:`, {
                    id: facility.id,
                    name: facility.name,
                    type: facility.type,
                    lat: facility.latitude,
                    lng: facility.longitude,
                    coordinates: `${facility.latitude},${facility.longitude}`,
                    api_source: facility.api_source
                });
            }

            // Only add facilities that are visible based on type selection
            if (!this.facilityTypeVisibility[facility.type]) {
                console.log(`Filtered by type: ${facility.type} not visible`);
                filteredByType++;
                return;
            }

            // Filter by countries if any countries are selected
            if (this.selectedHealthCountries.length > 0 && !this.selectedHealthCountries.includes(facility.country)) {
                filteredByCountry++;
                return;
            }

            // Filter by functionality if a functionality level is selected
            if (!this.matchesFunctionalityFilter(facility.functionality)) {
                filteredByFunctionality++;
                return;
            }

            addedCount++;

            // Create individual marker for each facility
            const color = this.getHealthFacilityColor(facility.type);
            const icon = this.createHealthFacilityIcon(color, facility.type);

            // Check for duplicate coordinates and apply small offset to prevent stacking
            const coordKey = `${facility.latitude},${facility.longitude}`;
            const existingMarkersAtCoord = this.healthFacilityMarkers.filter(m =>
                Math.abs(m.getLatLng().lat - facility.latitude) < 0.0001 &&
                Math.abs(m.getLatLng().lng - facility.longitude) < 0.0001
            ).length;

            // Apply small random offset if coordinates are duplicated
            let lat = facility.latitude;
            let lng = facility.longitude;
            if (existingMarkersAtCoord > 0) {
                const offsetDistance = 0.001; // Small offset in degrees
                const angle = (existingMarkersAtCoord * 60) * (Math.PI / 180); // 60 degrees apart
                lat += Math.sin(angle) * offsetDistance;
                lng += Math.cos(angle) * offsetDistance;
                console.log(`Applied offset to ${facility.name} at ${facility.latitude},${facility.longitude} -> ${lat},${lng}`);
            }

            const marker = L.marker([lat, lng], {
                icon: icon,
                zIndexOffset: 1000
            })
            .bindPopup(`
                <div>
                    <h4>${facility.name}</h4>
                    <p><strong>Type:</strong> ${facility.type}</p>
                    <p><strong>Functionality:</strong> <span style="color: ${this.getFunctionalityColor(facility.functionality)}; font-weight: bold;">${facility.functionality}</span></p>
                    <p><strong>Visibility:</strong> ${facility.visibility || 'Public'}</p>
                    <p><strong>Country:</strong> ${facility.country}</p>
                    ${facility.address ? `<p><strong>Address:</strong> ${facility.address}</p>` : ''}
                    ${facility.district ? `<p><strong>District:</strong> ${facility.district}</p>` : ''}
                    ${facility.speciality ? `<p><strong>Speciality:</strong> ${facility.speciality}</p>` : ''}
                </div>
            `);

            marker.facilityId = facility.id;
            marker.facilityType = facility.type;

            // Add marker to cluster group instead of directly to map
            this.healthFacilitiesCluster.addLayer(marker);
            this.healthFacilityMarkers.push(marker);
        });

        console.log(`Health facilities added: ${addedCount}, filtered by type: ${filteredByType}, filtered by country: ${filteredByCountry}, filtered by functionality: ${filteredByFunctionality}`);

        // Debug: Show facility types that are being filtered out
        if (filteredByType > 0) {
            console.log('🔍 Debugging facility types that are being filtered out:');
            const uniqueTypes = [...new Set(this.healthFacilities.map(f => f.type))];
            console.log('Available facility types in data:', uniqueTypes);
            console.log('Expected facility types (visibility):', Object.keys(this.facilityTypeVisibility));

            // Check for type mismatches
            uniqueTypes.forEach(type => {
                if (!this.facilityTypeVisibility.hasOwnProperty(type)) {
                    console.warn(`⚠️ Type mismatch: "${type}" not found in facilityTypeVisibility`);
                }
            });
        }

        if (this.selectedHealthCountries.length > 0) {
            console.log(`Applied country filter: [${this.selectedHealthCountries.join(', ')}]`);
        }
        if (this.selectedHealthFunctionality) {
            console.log(`Applied functionality filter: "${this.selectedHealthFunctionality}"`);
        }

        // Add the cluster group to the map
        if (addedCount > 0) {
            this.map.addLayer(this.healthFacilitiesCluster);
            console.log(`✅ Added ${addedCount} health facilities to map with clustering`);
        }
    }

    getFunctionalityColor(functionality) {
        if (!functionality) return '#666'; // Default gray for unknown status
        
        const status = functionality.toLowerCase();
        if (status.includes('fully functional') || status.includes('fully functioning') || status === 'functional') {
            return '#27ae60'; // Green
        } else if (status.includes('partially functional') || status.includes('partially functioning') || status.includes('partial')) {
            return '#f39c12'; // Orange
        } else if (status.includes('not functional') || status.includes('non-functional') || status.includes('damaged') || status.includes('closed')) {
            return '#e74c3c'; // Red
        } else {
            return '#666'; // Default gray for unknown status
        }
    }

    matchesFunctionalityFilter(functionality) {
        if (!this.selectedHealthFunctionality) return true; // No filter selected
        if (!functionality) return false; // No functionality data
        
        const status = functionality.toLowerCase();
        
        switch (this.selectedHealthFunctionality) {
            case 'fully':
                return status.includes('fully functional') || status.includes('fully functioning') || status === 'functional';
            case 'partially':
                return status.includes('partially functional') || status.includes('partially functioning') || status.includes('partial');
            case 'not':
                return status.includes('not functional') || status.includes('non-functional') || status.includes('damaged') || status.includes('closed');
            default:
                return true;
        }
    }

    determineVisibility(facility) {
        // Determine visibility based on source or affiliation

        // If facility has an ID from IFRC API, it's a Red Cross/Red Crescent facility
        if (facility.id && facility.country_iso3) {
            return 'RCRC Movement';
        }

        // Legacy check for CSV-based data with affiliation field
        const affiliation = facility.affiliation ? facility.affiliation.toLowerCase() : '';

        if (affiliation.includes('red cross') || affiliation.includes('red crescent')) {
            return 'RCRC Movement';
        } else if (affiliation.includes('ifrc') || affiliation.includes('international federation')) {
            return 'IFRC Secretariat';
        } else {
            return 'Public'; // Default for non-Red Cross facilities
        }
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
            'Primary Health Care Centres': '🏥',
            'Hospitals': '🏨',
            'Blood Centres': '🩸',
            'Ambulance Stations': '🚑',
            'Pharmacies': '💊',
            'Training Facilities': '🎓',
            'Specialized Services': '🔬',
            'Residential Facilities': '🏠',
            'Other': '⚕️'
        };
        return symbols[type] || '⚕️';
    }

    getHealthFacilityColor(type) {
        const colors = {
            'Primary Health Care Centres': '#1e3a8a',    // Dark Blue
            'Hospitals': '#fbbf24',                      // Yellow
            'Ambulance Stations': '#166534',             // Dark Green
            'Blood Centres': '#8b0000',                  // Dark Red
            'Pharmacies': '#84cc16',                     // Light Green
            'Training Facilities': '#ea580c',            // Orange
            'Specialized Services': '#a16207',           // Brown
            'Residential Facilities': '#7dd3fc',         // Light Blue
            'Other': '#374151'                           // Dark Gray
        };
        return colors[type] || '#374151';
    }

    darkenColor(hex, factor) {
        // Remove the # if present
        hex = hex.replace('#', '');

        // Parse r, g, b values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Darken by factor
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    clearHealthFacilityMarkers() {
        // Remove the cluster group from the map and clear all markers
        if (this.healthFacilitiesCluster) {
            this.map.removeLayer(this.healthFacilitiesCluster);
            this.healthFacilitiesCluster.clearLayers();
        }
        this.healthFacilityMarkers = [];
    }

    toggleHealthFacilities() {
        if (this.showHealthFacilities) {
            this.addHealthFacilitiesToMap();
        } else {
            this.clearHealthFacilityMarkers();
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
        console.log(`Adding ${this.activeERUs.length} active ERUs to map`);

        // Clear existing markers
        this.clearERUMarkers();

        let addedCount = 0;
        const existingCoordinates = new Map();

        this.activeERUs.forEach(eru => {
            try {
                let lat = eru.latitude;
                let lng = eru.longitude;

                // Handle coordinate offset for overlapping markers
                const coordKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
                const existingMarkersAtCoord = existingCoordinates.get(coordKey) || 0;
                existingCoordinates.set(coordKey, existingMarkersAtCoord + 1);

                if (existingMarkersAtCoord > 0) {
                    // Create circular pattern with increasing distance for better visibility
                    const baseDistance = 0.003;
                    const offsetDistance = baseDistance * (1 + existingMarkersAtCoord * 0.3); // Increase distance for outer markers
                    const angle = (existingMarkersAtCoord * 72) * (Math.PI / 180); // 72° = 360°/5 for better spacing
                    lat += Math.sin(angle) * offsetDistance;
                    lng += Math.cos(angle) * offsetDistance;
                    console.log(`📍 Offsetting ERU ${eru.id} by ${offsetDistance.toFixed(4)} degrees at angle ${existingMarkersAtCoord * 72}°`);
                }

                // Create red cross icon
                const redCrossIcon = L.divIcon({
                    html: `<div style="
                        background-color: white;
                        color: #dc2626;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        font-weight: bold;
                        border: 2px solid #dc2626;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">✚</div>`,
                    className: 'eru-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Create tooltip content
                const startDate = eru.start_date ? new Date(eru.start_date).toLocaleDateString() : 'Unknown';
                const tooltipContent = `
                    <div class="eru-tooltip">
                        <strong>Emergency Response Unit</strong><br>
                        <strong>Country:</strong> ${eru.country_deployment}<br>
                        <strong>Deploying Society:</strong> ${eru.deploying_society}<br>
                        <strong>ERU Type:</strong> ${eru.eru_types}<br>
                        <strong>Start Date:</strong> ${startDate}<br>
                        <strong>Event:</strong> ${eru.event_name}
                    </div>
                `;

                // Create and add marker
                const marker = L.marker([lat, lng], { icon: redCrossIcon })
                    .bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10]
                    })
                    .addTo(this.map);

                this.eruMarkers.push(marker);
                addedCount++;

            } catch (error) {
                console.error('Error adding ERU marker:', error, eru);
            }
        });

        console.log(`✅ Added ${addedCount} ERU markers to map`);
    }

    clearERUMarkers() {
        console.log(`Clearing ${this.eruMarkers.length} ERU markers`);
        this.eruMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.eruMarkers = [];
    }

    initFacilityTypeListeners() {
        const typeMapping = {
            'show-primary-health': 'Primary Health Care Centres',
            'show-ambulance': 'Ambulance Stations', 
            'show-blood': 'Blood Centres',
            'show-hospitals': 'Hospitals',
            'show-pharmacies': 'Pharmacies',
            'show-training': 'Training Facilities',
            'show-specialized': 'Specialized Services',
            'show-residential': 'Residential Facilities',
            'show-other': 'Other'
        };

        Object.entries(typeMapping).forEach(([checkboxId, facilityType]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.facilityTypeVisibility[facilityType] = e.target.checked;
                    this.updateHealthFacilitiesDisplay();
                });
            }
        });
    }

    initDisasterTypeListeners() {
        const typeMapping = {
            'show-earthquake': 'Earthquake',
            'show-flood': 'Flood',
            'show-cyclone': 'Cyclone',
            'show-wildfire': 'Wildfire',
            'show-volcanic-activity': 'Volcanic Activity',
            'show-other-disaster': 'Other'
        };

        Object.entries(typeMapping).forEach(([checkboxId, disasterType]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.disasterTypeVisibility[disasterType] = e.target.checked;
                    this.updateDisasterEventsDisplay();
                });
            }
        });
    }

    populateCountryFilter() {
        const countrySelect = document.getElementById('healthCountryFilter');
        if (!countrySelect) return;
        
        // Get unique countries from health facilities
        const countries = [...new Set(this.healthFacilities.map(facility => facility.country))]
            .filter(country => country) // Remove empty countries
            .sort();
        
        // Clear existing options except "All Countries"
        countrySelect.innerHTML = '<option value="">All Countries</option>';
        
        // Add country options
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        
        console.log(`Populated country filter with ${countries.length} countries`);
    }

    initHealthFacilityCountryFilter() {
        const countrySelect = document.getElementById('healthCountryFilter');
        if (!countrySelect) return;
        
        // Remove any existing event listeners to prevent duplicates
        countrySelect.onchange = null;
        
        countrySelect.addEventListener('change', (e) => {
            this.selectedHealthCountries = Array.from(e.target.selectedOptions)
                .map(option => option.value)
                .filter(value => value !== ''); // Remove empty values (All Countries)
            console.log(`Selected countries: [${this.selectedHealthCountries.join(', ')}]`);
            console.log(`Total health facilities: ${this.healthFacilities.length}`);

            // Update clustering based on country selection
            if (this.disableClusteringOnCountryFilter) {
                this.recreateClusterGroup();
            }

            // Debug: Show some sample countries from the data
            const sampleCountries = this.healthFacilities.slice(0, 10).map(f => f.country);
            console.log(`Sample countries:`, sampleCountries);
            
            // Zoom to country if a single country is selected
            if (this.selectedHealthCountries.length === 1) {
                const selectedCountry = this.selectedHealthCountries[0];
                const coords = this.getCountryCoordinates(selectedCountry);
                if (coords) {
                    console.log(`🗺️ Zooming to ${selectedCountry} at [${coords.lat}, ${coords.lng}], zoom: ${coords.zoom}`);
                    this.map.setView([coords.lat, coords.lng], coords.zoom);
                } else {
                    console.log(`⚠️ No coordinates found for country: ${selectedCountry}`);
                }
            } else if (this.selectedHealthCountries.length === 0) {
                // Reset to global view when "All Countries" is selected
                console.log('🌍 Resetting to global view');
                this.map.setView([20, 0], 2);
            }

            this.updateHealthFacilitiesDisplay();
            this.updateLegendCounts(); // Update counts after filtering
            const countryDisplay = this.selectedHealthCountries.length > 0 ? `[${this.selectedHealthCountries.join(', ')}]` : 'All Countries';
            console.log(`Filtering health facilities by countries: ${countryDisplay}`);
        });
    }

    updateHealthFacilitiesDisplay() {
        if (this.showHealthFacilities) {
            // Remove all current markers
            this.clearHealthFacilityMarkers();
            // Add back only the visible ones
            this.addHealthFacilitiesToMap();
        }
    }

    filterHealthFacilities() {
        const countryDisplay = this.selectedHealthCountries.length > 0 ? `[${this.selectedHealthCountries.join(', ')}]` : 'All Countries';
        console.log(`Filtering health facilities by countries: ${countryDisplay}`);
        this.updateHealthFacilitiesDisplay();
        this.updateLegendCounts(); // Update counts after filtering

        // Show country stats if exactly one country is selected
        if (this.selectedHealthCountries.length === 1) {
            this.updateCountryStats(this.selectedHealthCountries[0]);
        } else {
            this.updateCountryStats(null); // Hide stats box when multiple or no countries selected
        }
    }

    getFacilityTypeCounts() {
        const counts = {
            'Primary Health Care Centres': 0,
            'Ambulance Stations': 0,
            'Blood Centres': 0,
            'Hospitals': 0,
            'Pharmacies': 0,
            'Training Facilities': 0,
            'Specialized Services': 0,
            'Residential Facilities': 0,
            'Other': 0
        };

        this.healthFacilities.forEach(facility => {
            // Apply country filter when counting
            if (this.selectedCountry && facility.country !== this.selectedCountry) {
                return;
            }
            
            if (counts.hasOwnProperty(facility.type)) {
                counts[facility.type]++;
            }
        });

        return counts;
    }

    updateLegendCounts() {
        const counts = this.getFacilityTypeCounts();
        const labelMapping = {
            'show-primary-health': 'Primary Health Care Centres',
            'show-ambulance': 'Ambulance Stations', 
            'show-blood': 'Blood Centres',
            'show-hospitals': 'Hospitals',
            'show-pharmacies': 'Pharmacies',
            'show-training': 'Training Facilities',
            'show-specialized': 'Specialized Services',
            'show-residential': 'Residential Facilities',
            'show-other': 'Other'
        };

        Object.entries(labelMapping).forEach(([checkboxId, facilityType]) => {
            const label = document.querySelector(`label[for="${checkboxId}"]`);
            if (label && counts[facilityType] !== undefined) {
                const baseName = facilityType === 'Primary Health Care Centres' ? 'Primary Health Care' : 
                                facilityType === 'Ambulance Stations' ? 'Ambulance Stations' :
                                facilityType === 'Blood Centres' ? 'Blood Centres' :
                                facilityType === 'Training Facilities' ? 'Training Facilities' :
                                facilityType === 'Specialized Services' ? 'Specialized Services' :
                                facilityType === 'Residential Facilities' ? 'Residential Facilities' :
                                facilityType;
                
                label.textContent = `${baseName} (${counts[facilityType].toLocaleString()})`;
            }
        });
    }


    // Event search functionality
    searchEvents(query) {
        const searchInput = document.getElementById('eventSearch');
        const clearBtn = document.getElementById('clearEventSearch');
        
        // Show/hide clear button
        clearBtn.style.display = query.trim() ? 'block' : 'none';
        
        if (!query.trim()) {
            // Show all events if search is empty
            this.showAllEvents();
            return;
        }
        
        // Filter events based on search query
        const filteredEvents = this.disasterEvents.filter(event => {
            const searchTerm = query.toLowerCase();
            return (
                event.title.toLowerCase().includes(searchTerm) ||
                event.type.toLowerCase().includes(searchTerm) ||
                event.alertLevel.toLowerCase().includes(searchTerm) ||
                event.source.toLowerCase().includes(searchTerm) ||
                (event.description && event.description.toLowerCase().includes(searchTerm))
            );
        });
        
        // Update display
        this.displayFilteredEvents(filteredEvents);
        
        // Update map markers to show only filtered events
        this.clearMarkers();
        this.addMarkersToMap(filteredEvents);
        
        if (this.showAffectedAreas) {
            this.clearAffectedAreas();
            this.addAffectedAreasToMap(filteredEvents);
        }
    }
    
    clearEventSearch() {
        const searchInput = document.getElementById('eventSearch');
        const clearBtn = document.getElementById('clearEventSearch');
        
        searchInput.value = '';
        clearBtn.style.display = 'none';
        
        // Show all events
        this.showAllEvents();
    }
    
    showAllEvents() {
        // Display all events
        this.displayEvents(this.disasterEvents);
        
        // Update map markers to show all events
        this.clearMarkers();
        this.addMarkersToMap(this.disasterEvents);
        
        if (this.showAffectedAreas) {
            this.clearAffectedAreas();
            this.addAffectedAreasToMap(this.disasterEvents);
        }
    }
    
    displayFilteredEvents(events) {
        const eventList = document.getElementById('eventList');
        
        if (events.length === 0) {
            eventList.innerHTML = '<div class="search-no-results">No events match your search criteria.</div>';
            return;
        }
        
        // Use the existing displayEvents method
        this.displayEvents(events);
    }

    async loadCsvHealthFacilities() {
        try {
            console.log('Loading CSV health facilities...');
            
            const response = await fetch('hotosm_afg_health_facilities_points_csv.csv');
            const csvText = await response.text();
            
            // Parse CSV
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
            
            const facilities = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Simple CSV parsing - handle quoted fields
                const values = this.parseCsvLine(line);
                if (values.length < headers.length) continue;
                
                const facility = {};
                headers.forEach((header, index) => {
                    facility[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
                });
                
                // Only include facilities with valid coordinates
                if (facility.latitude && facility.longitude && !isNaN(facility.latitude) && !isNaN(facility.longitude)) {
                    facilities.push({
                        name: facility.name || 'Unnamed facility',
                        type: facility.healthcare || facility.amenity || 'Unknown',
                        latitude: parseFloat(facility.latitude),
                        longitude: parseFloat(facility.longitude),
                        osm_id: facility.osm_id
                    });
                }
            }
            
            this.csvHealthFacilities = facilities;
            console.log(`Loaded ${facilities.length} CSV health facilities`);
            
        } catch (error) {
            console.error('Error loading CSV health facilities:', error);
        }
    }

    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    toggleOtherHealthFacilities() {
        if (this.showOtherHealthFacilities) {
            this.addCsvHealthFacilitiesToMap();
            this.addShapefileHealthFacilitiesToMap();
            // Ensure cluster group is added to map for other health facilities
            if (this.healthFacilitiesCluster && !this.map.hasLayer(this.healthFacilitiesCluster)) {
                this.map.addLayer(this.healthFacilitiesCluster);
            }
        } else {
            this.clearCsvHealthFacilityMarkers();
        }
    }

    addCsvHealthFacilitiesToMap() {
        this.csvHealthFacilities.forEach(facility => {
            const icon = this.getCsvHealthFacilityIcon(facility.type);
            
            const marker = L.marker([facility.latitude, facility.longitude], { 
                    icon: icon,
                    zIndexOffset: 100 // Lower z-index to render below RCRC facilities
                })
                .bindPopup(`
                    <div class="popup-content">
                        <h4>${facility.name}</h4>
                        <p><strong>Type:</strong> ${facility.type}</p>
                        <p><strong>Source:</strong> OpenStreetMap</p>
                    </div>
                `);
            
            this.csvHealthFacilityMarkers.push(marker);
            // Add to cluster group instead of directly to map
            this.healthFacilitiesCluster.addLayer(marker);
        });
    }

    clearCsvHealthFacilityMarkers() {
        // Remove CSV markers from the cluster group instead of directly from map
        this.csvHealthFacilityMarkers.forEach(marker => {
            if (this.healthFacilitiesCluster) {
                this.healthFacilitiesCluster.removeLayer(marker);
            }
        });
        this.csvHealthFacilityMarkers = [];
    }

    getCsvHealthFacilityIcon(type) {
        // Map common OpenStreetMap types to RCRC facility types for consistent styling
        const typeMapping = {
            'hospital': 'Hospitals',
            'clinic': 'Primary Health Care Centres',
            'dentist': 'Specialized Services',
            'laboratory': 'Specialized Services',
            'pharmacy': 'Pharmacies',
            'ambulance': 'Ambulance Stations',
            'blood_bank': 'Blood Centres',
            'training': 'Training Facilities',
            'residential': 'Residential Facilities'
        };
        
        const mappedType = typeMapping[type.toLowerCase()] || 'Other';
        const color = this.getHealthFacilityColor(mappedType);
        const iconSymbol = this.getHealthFacilitySymbol(mappedType);
        
        return L.divIcon({
            className: 'other-health-facility-icon',
            html: `
                <div style="
                    background-color: ${color};
                    color: white;
                    border-radius: 4px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    border: 2px solid #FF8C00;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${iconSymbol}</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    async loadShapefileHealthFacilities() {
        try {
            console.log('Loading shapefile health facilities...');
            
            // Try loading the entire shapefile directory as a zip-like structure
            const baseUrl = './Geo Files/hotosm_pak_health_facilities_points_shp/hotosm_pak_health_facilities_points_shp';
            
            // Method 1: Try using shpjs with the base filename (it should find .shp and .dbf automatically)
            let geojson;
            try {
                console.log('Attempting to load shapefile with shp library...');
                geojson = await shp(baseUrl);
                console.log('Shapefile loaded successfully, geojson type:', typeof geojson);
                console.log('GeoJSON structure:', geojson);
            } catch (shpError) {
                console.warn('shp() method failed, trying alternative approach:', shpError);
                
                // Method 2: Load files separately and combine
                try {
                    const [shpResponse, dbfResponse] = await Promise.all([
                        fetch(baseUrl + '.shp'),
                        fetch(baseUrl + '.dbf')
                    ]);
                    
                    const [shpBuffer, dbfBuffer] = await Promise.all([
                        shpResponse.arrayBuffer(),
                        dbfResponse.arrayBuffer()
                    ]);
                    
                    console.log('Files loaded, parsing...');
                    geojson = shp.combine([
                        shp.parseShp(shpBuffer),
                        shp.parseDbf(dbfBuffer)
                    ]);
                    console.log('Alternative method successful, geojson:', geojson);
                } catch (altError) {
                    console.error('Alternative method also failed:', altError);
                    throw altError;
                }
            }
            
            const facilities = [];
            if (geojson) {
                // Handle both array format and FeatureCollection format
                const features = geojson.features || geojson;
                console.log(`Processing ${features.length} features...`);
                
                features.forEach((feature, index) => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        const [longitude, latitude] = feature.geometry.coordinates;
                        const props = feature.properties || {};
                        
                        // Debug first few features
                        if (index < 3) {
                            console.log(`Feature ${index}:`, {
                                coords: [longitude, latitude],
                                props: props
                            });
                        }
                        
                        // Only include facilities with valid coordinates
                        if (longitude && latitude && !isNaN(longitude) && !isNaN(latitude)) {
                            facilities.push({
                                name: props.name || props.NAME || props.Name || 'Unnamed facility',
                                type: props.healthcare || props.amenity || props.HEALTHCARE || props.AMENITY || props.Healthcare || props.Amenity || 'Unknown',
                                latitude: latitude,
                                longitude: longitude,
                                source: 'Pakistan OpenStreetMap',
                                properties: props
                            });
                        }
                    }
                });
            }
            
            this.shapefileHealthFacilities = facilities;
            console.log(`Successfully loaded ${facilities.length} shapefile health facilities from Pakistan`);
            
            // Debug: Log first few facilities
            if (facilities.length > 0) {
                console.log('Sample facilities:', facilities.slice(0, 3));
            }
            
        } catch (error) {
            console.error('Error loading shapefile health facilities:', error);
            console.error('Full error details:', error);
            // Set empty array so the rest of the app continues to work
            this.shapefileHealthFacilities = [];
        }
    }

    addShapefileHealthFacilitiesToMap() {
        this.shapefileHealthFacilities.forEach(facility => {
            const icon = this.getCsvHealthFacilityIcon(facility.type); // Use same icon style as CSV
            
            const marker = L.marker([facility.latitude, facility.longitude], { 
                    icon: icon,
                    zIndexOffset: 100 // Lower z-index to render below RCRC facilities
                })
                .bindPopup(`
                    <div class="popup-content">
                        <h4>${facility.name}</h4>
                        <p><strong>Type:</strong> ${facility.type}</p>
                        <p><strong>Source:</strong> ${facility.source}</p>
                    </div>
                `);
            
            this.csvHealthFacilityMarkers.push(marker); // Use same array for consistency
            // Add to cluster group instead of directly to map
            this.healthFacilitiesCluster.addLayer(marker);
        });
    }

    // Impact Facilities functionality
    initImpactFacilitiesCountryFilter() {
        const countrySelect = document.getElementById('facilityCountryFilter');
        countrySelect.innerHTML = '<option value="">All Countries</option>';
        
        // Get unique countries from health facilities
        const countries = [...new Set(this.healthFacilities.map(facility => facility.country))].sort();
        console.log(`🌍 Available countries for impact facilities filter:`, countries);
        console.log(`🌍 Sample facility data:`, this.healthFacilities[0]);
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        
        console.log(`🌍 Country filter initialized with ${countries.length} countries`);
    }

    updateImpactFacilitiesList() {
        // Always show the section
        document.getElementById('impactFacilitiesSection').style.display = 'block';

        // Get all RCRC health facilities
        let allFacilities = this.healthFacilities || [];
        console.log(`📊 Updating impact facilities list - Total facilities: ${allFacilities.length}`);
        console.log(`📊 Selected country filter: "${this.selectedImpactFacilityCountry}"`);
        
        // Always find which facilities are in impact zones, regardless of impact zones visibility
        const facilitiesInImpactZones = this.impactZones.length > 0 
            ? this.findFacilitiesInImpactZones()
            : [];

        // Filter facilities that are in impact zones
        let facilitiesToShow = facilitiesInImpactZones;
        
        // Then filter by selected country if specified
        if (this.selectedImpactFacilityCountry) {
            facilitiesToShow = facilitiesToShow.filter(f => f.country === this.selectedImpactFacilityCountry);
            console.log(`📊 After country filter: ${facilitiesToShow.length} facilities in impact zones`);
        }

        console.log(`📊 Showing ${facilitiesToShow.length} facilities that are within impact zones`);
        this.displayImpactFacilities(facilitiesToShow, facilitiesInImpactZones);
    }

    findFacilitiesInImpactZones() {
        if (!this.impactZones.length || !this.healthFacilities.length) {
            return [];
        }

        const facilitiesInImpact = [];
        
        // If a disaster is selected, filter impact zones to only those relevant to that disaster
        let relevantZones = this.impactZones;
        if (this.selectedEventId) {
            const selectedEvent = this.disasterEvents.find(e => e.id === this.selectedEventId);
            if (selectedEvent) {
                const selectedEventLatLng = L.latLng(selectedEvent.latitude, selectedEvent.longitude);
                
                // Filter zones to only those closest to the selected disaster (within 100km)
                relevantZones = this.impactZones.filter(zone => {
                    if (zone.geometry && zone.geometry.type === 'Polygon') {
                        const coordinates = zone.geometry.coordinates[0];
                        const centroidLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                        const centroidLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                        const zoneLatLng = L.latLng(centroidLat, centroidLng);
                        
                        // Find the closest disaster to this zone
                        let closestDistance = Infinity;
                        let closestEventId = null;
                        
                        this.disasterEvents.forEach(event => {
                            const eventLatLng = L.latLng(event.latitude, event.longitude);
                            const distance = zoneLatLng.distanceTo(eventLatLng);
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                closestEventId = event.id;
                            }
                        });
                        
                        return closestEventId === this.selectedEventId && closestDistance <= 100000;
                    }
                    return false;
                });
            }
        }

        this.healthFacilities.forEach(facility => {
            // Create a point for the facility
            const facilityLatLng = L.latLng(facility.latitude, facility.longitude);
            
            // Check if facility is within any relevant impact zone polygon
            relevantZones.forEach(zone => {
                if (zone.geometry && zone.geometry.type === 'Polygon') {
                    const coordinates = zone.geometry.coordinates[0];
                    // Convert coordinates to Leaflet LatLng format [lat, lng]
                    const polygon = coordinates.map(coord => L.latLng(coord[1], coord[0]));
                    
                    if (this.isPointInPolygon(facilityLatLng, polygon)) {
                        // Check if this facility hasn't already been added (avoid duplicates)
                        if (!facilitiesInImpact.find(f => f.id === facility.id)) {
                            facilitiesInImpact.push(facility);
                        }
                    }
                }
            });
        });
        
        return facilitiesInImpact;
    }

    isPointInPolygon(point, polygon) {
        // Ray casting algorithm for point-in-polygon test
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lat, yi = polygon[i].lng;
            const xj = polygon[j].lat, yj = polygon[j].lng;
            
            if (((yi > point.lng) !== (yj > point.lng)) &&
                (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    displayImpactFacilities(facilities, facilitiesInImpactZones = []) {
        const facilitiesList = document.getElementById('impactFacilitiesList');
        
        // Show only facilities that fall within impact zones
        if (!facilities || facilities.length === 0) {
            facilitiesList.innerHTML = '<div class="no-facilities">No RCRC health facilities found within impact zones for the selected filter</div>';
            return;
        }

        console.log(`🏥 Displaying ${facilities.length} facilities in sidebar`);

        // Sort facilities by country first, then by name
        const sortedFacilities = [...facilities].sort((a, b) => {
            const countryA = a.country || 'Unknown';
            const countryB = b.country || 'Unknown';
            
            if (countryA !== countryB) {
                return countryA.localeCompare(countryB);
            }
            
            return (a.name || '').localeCompare(b.name || '');
        });

        const facilitiesHtml = sortedFacilities.map(facility => {
            // Check if this facility is in impact zones
            const isInImpactZone = facilitiesInImpactZones.some(f => f.id === facility.id);
            const cardClass = isInImpactZone ? 'facility-card in-impact-zone' : 'facility-card';
            
            return `
                <div class="${cardClass}" 
                     onclick="app.zoomToFacility(${facility.latitude}, ${facility.longitude}, '${facility.name.replace(/'/g, "\\'")}')">
                    <div class="facility-name">${facility.name}</div>
                    <div class="facility-district">${facility.address || facility.district || facility.country || 'Unknown location'}</div>
                    <div class="facility-functionality ${this.getFunctionalityClass(facility.functionality)}">
                        ${facility.functionality || 'Unknown functionality'}
                    </div>
                    ${isInImpactZone ? '<div class="impact-indicator">⚠️ In Impact Zone</div>' : ''}
                </div>
            `;
        }).join('');

        facilitiesList.innerHTML = facilitiesHtml;
    }

    zoomToFacility(latitude, longitude, facilityName) {
        // Zoom to the facility location
        this.map.setView([latitude, longitude], 15);
        
        // Find and open the popup for this facility if it exists
        this.healthFacilityMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (Math.abs(markerLatLng.lat - latitude) < 0.0001 && 
                Math.abs(markerLatLng.lng - longitude) < 0.0001) {
                // Add a small delay to ensure the map has finished panning
                setTimeout(() => {
                    marker.openPopup();
                }, 300);
            }
        });
        
        console.log(`Zoomed to facility: ${facilityName} at ${latitude}, ${longitude}`);
    }

    getFunctionalityClass(functionality) {
        if (!functionality) return 'functionality-unknown';
        
        const status = functionality.toLowerCase();
        if (status.includes('fully functional') || status.includes('fully functioning') || status === 'functional') {
            return 'functionality-fully';
        } else if (status.includes('partially functional') || status.includes('partially functioning') || status.includes('partial')) {
            return 'functionality-partially';
        } else if (status.includes('not functional') || status.includes('non-functional') || status.includes('damaged') || status.includes('closed')) {
            return 'functionality-not';
        } else {
            return 'functionality-unknown';
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        
        if (this.isFullscreen) {
            // Enter fullscreen mode
            document.body.classList.add('fullscreen-mode');
            document.getElementById('fullscreenToggle').querySelector('.fullscreen-icon').textContent = '⛉';
            document.getElementById('fullscreenToggle').title = 'Exit Fullscreen';
        } else {
            // Exit fullscreen mode
            document.body.classList.remove('fullscreen-mode');
            document.getElementById('fullscreenToggle').querySelector('.fullscreen-icon').textContent = '⛶';
            document.getElementById('fullscreenToggle').title = 'Enter Fullscreen';
        }
        
        // Invalidate map size after layout change
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
        
        console.log(`Fullscreen mode: ${this.isFullscreen ? 'ON' : 'OFF'}`);
    }

    async toggleSatelliteLayer() {
        if (this.showSatelliteLayer) {
            // Remove base layer
            if (this.map.hasLayer(this.baseLayer)) {
                this.map.removeLayer(this.baseLayer);
            }
            
            // Use ArcGIS satellite imagery
            console.log('🛰️ Loading ArcGIS satellite imagery...');
            
            this.satelliteLayer.addTo(this.map);
            
            // Show ArcGIS caption
            if (this.satelliteDateCaption && !this.isSatelliteDateCaptionVisible) {
                this.satelliteDateCaption.addTo(this.map);
                this.isSatelliteDateCaptionVisible = true;
            }
        } else {
            // Remove ArcGIS satellite layer if active
            if (this.map.hasLayer(this.satelliteLayer)) {
                this.map.removeLayer(this.satelliteLayer);
            }
            
            // Hide date caption
            if (this.satelliteDateCaption && this.isSatelliteDateCaptionVisible) {
                this.map.removeControl(this.satelliteDateCaption);
                this.isSatelliteDateCaptionVisible = false;
            }
            
            // Add base layer back
            this.baseLayer.addTo(this.map);
        }
    }










    toggleHealthControlsCollapse() {
        const content = document.getElementById('healthControlsContent');
        const toggleBtn = document.getElementById('toggleHealthControls');
        
        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse Health Facilities';
        } else {
            // Collapse
            content.classList.add('collapsed');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand Health Facilities';
        }
    }

    toggleDisasterControlsCollapse() {
        const content = document.getElementById('disasterControlsContent');
        const toggleBtn = document.getElementById('toggleDisasterControls');
        
        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse Disaster Events';
        } else {
            // Collapse
            content.classList.add('collapsed');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand Disaster Events';
        }
    }

    toggleMapControlsCollapse() {
        const content = document.getElementById('mapControlsContent');
        const toggleBtn = document.getElementById('toggleMapControls');

        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse Map Controls';
        } else {
            // Collapse
            content.classList.add('collapsed');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand Map Controls';
        }
    }


    toggleSidebar() {
        const drawer = document.getElementById('sidebarDrawer');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (drawer.classList.contains('active')) {
            // Hide drawer
            drawer.classList.remove('active');
            toggleBtn.setAttribute('title', 'Toggle Events & Facilities Panel');
        } else {
            // Show drawer
            drawer.classList.add('active');
            toggleBtn.setAttribute('title', 'Close Events & Facilities Panel');
        }
    }



    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add close functionality
        notification.querySelector('.notification-close').onclick = () => {
            notification.remove();
        };
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    updateCountryStats(selectedCountry) {
        const statsBox = document.getElementById('countryStatsBox');
        const statsCountryName = document.getElementById('statsCountryName');
        const statsTotal = document.getElementById('statsTotal');
        const statsBreakdown = document.getElementById('statsBreakdown');

        if (!selectedCountry) {
            statsBox.style.display = 'none';
            return;
        }

        // Filter facilities by selected country
        const countryFacilities = this.healthFacilities.filter(facility => {
            return facility.country === selectedCountry;
        });

        if (countryFacilities.length === 0) {
            statsBox.style.display = 'none';
            return;
        }

        // Count facilities by type
        const typeCounts = {};
        countryFacilities.forEach(facility => {
            const type = facility.type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        // Update the stats display
        statsCountryName.textContent = `${selectedCountry} Health Facilities`;
        statsTotal.textContent = countryFacilities.length;

        // Clear and populate breakdown
        statsBreakdown.innerHTML = '';
        Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a) // Sort by count descending
            .forEach(([type, count]) => {
                const item = document.createElement('div');
                item.className = 'stats-item clickable';
                item.innerHTML = `
                    <span class="stats-item-type">${type}</span>
                    <span class="stats-item-count">${count}</span>
                `;

                // Add click handler to filter by this facility type and country
                item.addEventListener('click', () => {
                    this.filterByCountryAndType(selectedCountry, type);
                });

                statsBreakdown.appendChild(item);
            });

        // Show the stats box
        statsBox.style.display = 'block';
    }

    filterByCountryAndType(country, facilityType) {
        // Check if we're clicking the same type that's already filtered
        const isToggleOff = (this.currentCountryFilter === country && this.currentTypeFilter === facilityType);

        if (isToggleOff) {
            // Toggle off - show all facility types for this country
            console.log(`🔄 Toggling off ${facilityType} filter - showing all facilities in ${country}`);

            // Enable all facility types
            Object.keys(this.facilityTypeVisibility).forEach(type => {
                this.facilityTypeVisibility[type] = true;
            });

            // Check all facility type checkboxes
            const typeMapping = {
                'Primary Health Care Centres': 'show-primary-health',
                'Ambulance Stations': 'show-ambulance',
                'Blood Centres': 'show-blood',
                'Hospitals': 'show-hospitals',
                'Pharmacies': 'show-pharmacies',
                'Training Facilities': 'show-training',
                'Specialized Services': 'show-specialized',
                'Residential Facilities': 'show-residential',
                'Other': 'show-other'
            };

            Object.values(typeMapping).forEach(checkboxId => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });

            // Clear the type filter but keep the country filter
            this.currentTypeFilter = null;

        } else {
            // Toggle on - show only this facility type
            console.log(`🎯 Filtering to show only ${facilityType} in ${country}`);

            // Set all facility types to hidden first
            Object.keys(this.facilityTypeVisibility).forEach(type => {
                this.facilityTypeVisibility[type] = false;
            });

            // Enable only the selected facility type
            this.facilityTypeVisibility[facilityType] = true;

            // Update the facility type checkboxes to reflect the selection
            const typeMapping = {
                'Primary Health Care Centres': 'show-primary-health',
                'Ambulance Stations': 'show-ambulance',
                'Blood Centres': 'show-blood',
                'Hospitals': 'show-hospitals',
                'Pharmacies': 'show-pharmacies',
                'Training Facilities': 'show-training',
                'Specialized Services': 'show-specialized',
                'Residential Facilities': 'show-residential',
                'Other': 'show-other'
            };

            // Uncheck all facility type checkboxes first
            Object.values(typeMapping).forEach(checkboxId => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = false;
                }
            });

            // Check only the selected facility type
            const selectedCheckboxId = typeMapping[facilityType];
            if (selectedCheckboxId) {
                const checkbox = document.getElementById(selectedCheckboxId);
                if (checkbox) {
                    checkbox.checked = true;
                }
            }

            // Update the filter state
            this.currentTypeFilter = facilityType;
        }

        // Always ensure the country filter is set correctly
        this.selectedHealthCountries = [country];
        this.currentCountryFilter = country;

        // Update the health country filter dropdown to reflect the selection
        const healthCountryFilter = document.getElementById('healthCountryFilter');
        if (healthCountryFilter) {
            // Clear all selections first
            Array.from(healthCountryFilter.options).forEach(option => {
                option.selected = false;
            });
            // Select only the target country
            Array.from(healthCountryFilter.options).forEach(option => {
                if (option.value === country) {
                    option.selected = true;
                }
            });
        }

        // Update the display
        this.updateHealthFacilitiesDisplay();
        this.updateLegendCounts();
    }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 12px;
        padding: 0;
        line-height: 1;
    }
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles);

// Global function to hide country stats (referenced in HTML onclick)
function hideCountryStats() {
    const statsBox = document.getElementById('countryStatsBox');
    if (statsBox) {
        statsBox.style.display = 'none';
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DisasterMap();
});