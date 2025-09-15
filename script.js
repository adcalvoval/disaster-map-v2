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
        // Removed clustering - markers added directly to map
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
        this.facilityTypeVisibility = {
            'Primary Health Care Centres': true,
            'Ambulance Stations': true,
            'Blood Centres': true,
            'Hospitals': true,
            'Pharmacies': true,
            'Training Facilities': true,
            'Specialized Services': true,
            'Residential Facilities': true,
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
        this.conflictEvents = [];
        this.conflictMarkers = [];
        this.showConflictEvents = false;
        this.conflictTypeVisibility = {
            'Political violence': true,
            'Battles': true,
            'Protests': true,
            'Riots': true,
            'Explosions/Remote violence': true,
            'Violence against civilians': true
        };
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.loadDisasterData();
        this.loadConflictData();
        this.loadImpactZones();
        this.loadHealthFacilities();
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

        // Conflict type visibility toggles
        const conflictTypeMapping = {
            'show-political-violence': 'Political violence',
            'show-battles': 'Battles',
            'show-protests': 'Protests',
            'show-riots': 'Riots',
            'show-explosions': 'Explosions/Remote violence',
            'show-violence-civilians': 'Violence against civilians'
        };

        Object.entries(conflictTypeMapping).forEach(([checkboxId, conflictType]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.conflictTypeVisibility[conflictType] = e.target.checked;
                    this.updateConflictEventsDisplay();
                });
            }
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

        document.getElementById('showConflictEvents').addEventListener('change', (e) => {
            this.showConflictEvents = e.target.checked;
            this.toggleConflictEvents();

            // Show/hide the conflict events controls
            const controls = document.getElementById('conflictEventsControls');
            controls.style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('showOtherHealthFacilities').addEventListener('change', (e) => {
            this.showOtherHealthFacilities = e.target.checked;
            this.toggleOtherHealthFacilities();
        });

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

        // Conflict controls collapse/expand toggle
        const conflictToggle = document.getElementById('toggleConflictControls');
        if (conflictToggle) {
            conflictToggle.addEventListener('click', (e) => {
                this.toggleConflictControlsCollapse();
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
            
            // Default to last 2 months of data
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setMonth(fromDate.getMonth() - 2);
            
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
        
        // Update facilities list
        this.updateImpactFacilitiesList();
    }

    // Conflict Events Methods
    async loadConflictData() {
        try {
            console.log('Loading conflict events from ACLED API via proxy...');

            const params = new URLSearchParams({
                limit: '50',
                disorder_type: 'Political violence|Battles|Protests|Riots|Explosions/Remote violence|Violence against civilians'
            });

            const response = await fetch(`/api/acled?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success !== false && result.data) {
                this.conflictEvents = result.data.map(event => ({
                    id: event.data_date + '_' + event.event_id_cnty,
                    title: event.event_type + ' in ' + event.location,
                    type: event.disorder_type,
                    subType: event.event_type,
                    date: event.event_date,
                    latitude: parseFloat(event.latitude),
                    longitude: parseFloat(event.longitude),
                    location: event.location,
                    country: event.country,
                    region: event.region,
                    fatalities: parseInt(event.fatalities) || 0,
                    source: 'ACLED',
                    description: event.notes || '',
                    actors: {
                        actor1: event.actor1,
                        actor2: event.actor2
                    }
                }));

                console.log(`✅ Loaded ${this.conflictEvents.length} conflict events from ACLED`);
                this.addConflictMarkersToMap();
                this.displayConflictEvents();
            } else {
                throw new Error('No conflict events received from ACLED API');
            }
        } catch (error) {
            console.error('❌ Error loading conflict events:', error);
        }
    }

    addConflictMarkersToMap() {
        if (!this.showConflictEvents) return;

        this.clearConflictMarkers();

        this.conflictEvents.forEach(event => {
            if (!this.conflictTypeVisibility[event.type]) return;

            const icon = this.getConflictEventIcon(event.type);
            const marker = L.marker([event.latitude, event.longitude], { icon })
                .bindPopup(this.createConflictEventPopup(event));

            this.conflictMarkers.push(marker);
            marker.addTo(this.map);
        });
    }

    clearConflictMarkers() {
        this.conflictMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.conflictMarkers = [];
    }

    getConflictEventIcon(eventType) {
        const iconMapping = {
            'Political violence': { color: '#dc2626', symbol: '⚔️' },
            'Battles': { color: '#b91c1c', symbol: '💥' },
            'Protests': { color: '#f59e0b', symbol: '✊' },
            'Riots': { color: '#ef4444', symbol: '🔥' },
            'Explosions/Remote violence': { color: '#7c2d12', symbol: '💣' },
            'Violence against civilians': { color: '#991b1b', symbol: '🚨' }
        };

        const config = iconMapping[eventType] || { color: '#6b7280', symbol: '❗' };

        return L.divIcon({
            html: `
                <div style="
                    background: ${config.color};
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${config.symbol}</div>
            `,
            className: 'conflict-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    createConflictEventPopup(event) {
        return `
            <div class="popup-content" style="min-width: 280px;">
                <h4 style="color: #dc2626; margin-bottom: 8px;">${event.title}</h4>
                <div><strong>Type:</strong> ${event.subType}</div>
                <div><strong>Date:</strong> ${event.date}</div>
                <div><strong>Location:</strong> ${event.location}, ${event.country}</div>
                <div><strong>Fatalities:</strong> ${event.fatalities}</div>
                ${event.actors.actor1 ? `<div><strong>Actor 1:</strong> ${event.actors.actor1}</div>` : ''}
                ${event.actors.actor2 ? `<div><strong>Actor 2:</strong> ${event.actors.actor2}</div>` : ''}
                ${event.description ? `<div style="margin-top: 8px;"><strong>Notes:</strong> ${event.description}</div>` : ''}
                <div style="margin-top: 8px; font-size: 0.8em; color: #666;">Source: ACLED</div>
            </div>
        `;
    }

    displayConflictEvents() {
        const conflictList = document.getElementById('conflictList');
        if (!conflictList || this.conflictEvents.length === 0) return;

        const sortedEvents = this.conflictEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

        const eventsHTML = sortedEvents.map(event => `
            <div class="event-item conflict-event" onclick="app.focusOnConflictEvent('${event.id}')">
                <div class="event-title">${event.title}</div>
                <div class="event-details">
                    Type: ${event.subType}<br>
                    Date: ${event.date}<br>
                    Location: ${event.location}, ${event.country}<br>
                    Fatalities: ${event.fatalities}
                </div>
                <span class="conflict-badge">${event.type}</span>
            </div>
        `).join('');

        conflictList.innerHTML = eventsHTML;
    }

    focusOnConflictEvent(eventId) {
        const event = this.conflictEvents.find(e => e.id === eventId);
        if (event) {
            this.map.setView([event.latitude, event.longitude], 10);

            // Find and open the marker popup
            const marker = this.conflictMarkers.find(m => {
                const latlng = m.getLatLng();
                return Math.abs(latlng.lat - event.latitude) < 0.001 &&
                       Math.abs(latlng.lng - event.longitude) < 0.001;
            });

            if (marker) {
                marker.openPopup();
            }
        }
    }

    toggleConflictEvents() {
        if (this.showConflictEvents) {
            this.addConflictMarkersToMap();
        } else {
            this.clearConflictMarkers();
        }
    }

    updateConflictEventsDisplay() {
        // Filter events based on conflict type visibility
        const filteredEvents = this.conflictEvents.filter(event => {
            return this.conflictTypeVisibility[event.type] !== false;
        });

        // Update markers on map
        this.clearConflictMarkers();
        if (this.showConflictEvents) {
            filteredEvents.forEach(event => {
                if (this.conflictTypeVisibility[event.type]) {
                    const icon = this.getConflictEventIcon(event.type);
                    const marker = L.marker([event.latitude, event.longitude], { icon })
                        .bindPopup(this.createConflictEventPopup(event));

                    this.conflictMarkers.push(marker);
                    marker.addTo(this.map);
                }
            });
        }

        // Update sidebar list if it exists
        const conflictList = document.getElementById('conflictList');
        if (conflictList) {
            const sortedEvents = filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

            const eventsHTML = sortedEvents.map(event => `
                <div class="event-item conflict-event" onclick="app.focusOnConflictEvent('${event.id}')">
                    <div class="event-title">${event.title}</div>
                    <div class="event-details">
                        Type: ${event.subType}<br>
                        Date: ${event.date}<br>
                        Location: ${event.location}, ${event.country}<br>
                        Fatalities: ${event.fatalities}
                    </div>
                    <span class="conflict-badge">${event.type}</span>
                </div>
            `).join('');

            conflictList.innerHTML = eventsHTML || '<div class="no-events">No conflict events match current filters.</div>';
        }
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
        if (!this.showImpactZones) return;
        
        // Remove existing impact zone layer
        if (this.impactZoneLayer) {
            this.map.removeLayer(this.impactZoneLayer);
        }
        
        // Create a layer group for impact zones
        this.impactZoneLayer = L.layerGroup();
        
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
        if (this.showImpactZones) {
            // If a disaster is selected, show only impact zones for that disaster
            if (this.selectedEventId) {
                this.filterImpactZonesForEvent(this.selectedEventId);
            } else {
                // Show all impact zones
                this.displayImpactZones();
            }
        } else {
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

            // Add marker directly to map
            this.map.addLayer(marker);
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
        // Remove all individual markers
        this.healthFacilityMarkers.forEach(marker => {
            this.map.removeLayer(marker);
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
            
            // Debug: Show some sample countries from the data
            const sampleCountries = this.healthFacilities.slice(0, 10).map(f => f.country);
            console.log(`Sample countries:`, sampleCountries);
            
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
            marker.addTo(this.map);
        });
    }

    clearCsvHealthFacilityMarkers() {
        this.csvHealthFacilityMarkers.forEach(marker => {
            this.map.removeLayer(marker);
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
            marker.addTo(this.map);
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

    toggleConflictControlsCollapse() {
        const content = document.getElementById('conflictControlsContent');
        const toggleBtn = document.getElementById('toggleConflictControls');

        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse Conflict Events';
        } else {
            // Collapse
            content.classList.add('collapsed');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand Conflict Events';
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
        // Set all facility types to hidden first
        Object.keys(this.facilityTypeVisibility).forEach(type => {
            this.facilityTypeVisibility[type] = false;
        });

        // Enable only the selected facility type
        this.facilityTypeVisibility[facilityType] = true;

        // Set the country filter to only the selected country
        this.selectedHealthCountries = [country];

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

        // Update the display
        this.updateHealthFacilitiesDisplay();
        this.updateLegendCounts();

        console.log(`Filtered to show only ${facilityType} in ${country}`);
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