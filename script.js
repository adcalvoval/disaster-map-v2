class DisasterMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.affectedAreas = [];
        this.impactZones = [];
        this.impactZoneLayer = null;
        this.disasterEvents = [];
        this.filteredEvents = [];
        this.showAffectedAreas = true;
        this.showImpactZones = false;
        this.healthFacilityMarkers = [];
        this.healthFacilities = [];
        this.showHealthFacilities = false;
        this.csvHealthFacilityMarkers = [];
        this.csvHealthFacilities = [];
        this.shapefileHealthFacilities = [];
        this.showOtherHealthFacilities = false;
        this.selectedHealthCountry = ''; // Health facilities country filter
        this.selectedHealthFunctionality = ''; // Health facilities functionality filter
        this.selectedHealthVisibility = ''; // Health facilities visibility filter
        this.selectedImpactFacilityCountry = ''; // Impact facilities country filter
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
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.loadDisasterData();
        this.loadImpactZones();
        this.loadHealthFacilities();
        this.loadCsvHealthFacilities();
        this.loadShapefileHealthFacilities();
    }

    initMap() {
        this.map = L.map('map').setView([20, 0], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);
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
            this.toggleAffectedAreas();
        });

        document.getElementById('showImpactZones').addEventListener('change', (e) => {
            this.showImpactZones = e.target.checked;
            this.toggleImpactZones();
        });

        document.getElementById('showHealthFacilities').addEventListener('change', (e) => {
            this.showHealthFacilities = e.target.checked;
            this.toggleHealthFacilities();
            
            // Show/hide the health facilities controls
            const controls = document.getElementById('healthFacilitiesControls');
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


        // Health facilities country filter
        document.getElementById('healthCountryFilter').addEventListener('change', (e) => {
            this.selectedHealthCountry = e.target.value;
            this.filterHealthFacilities();
        });

        // Health facilities functionality filter
        document.getElementById('healthFunctionalityFilter').addEventListener('change', (e) => {
            this.selectedHealthFunctionality = e.target.value;
            this.filterHealthFacilities();
        });

        // Health facilities visibility filter
        document.getElementById('healthVisibilityFilter').addEventListener('change', (e) => {
            this.selectedHealthVisibility = e.target.value;
            this.filterHealthFacilities();
        });

        // Impact facilities country filter
        document.getElementById('facilityCountryFilter').addEventListener('change', (e) => {
            this.selectedImpactFacilityCountry = e.target.value;
            this.updateImpactFacilitiesList();
        });

        // Add event listeners for individual facility type checkboxes
        this.initFacilityTypeListeners();
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
            
            const marker = L.marker([event.latitude, event.longitude], { icon })
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

    toggleAffectedAreas() {
        if (this.showAffectedAreas) {
            this.addAffectedAreasToMap(this.disasterEvents);
        } else {
            this.clearAffectedAreas();
        }
    }

    filterByAlertLevel(alertLevel) {
        const filteredEvents = alertLevel ? 
            this.disasterEvents.filter(event => event.alertLevel === alertLevel) : 
            this.disasterEvents;
        
        this.clearMarkers();
        this.clearAffectedAreas();
        this.displayEvents(filteredEvents);
        this.addMarkersToMap(filteredEvents);
        if (this.showAffectedAreas) {
            this.addAffectedAreasToMap(filteredEvents);
        }
    }

    focusOnEvent(eventId) {
        const event = this.disasterEvents.find(e => e.id === eventId);
        const marker = this.markers.find(m => m.eventId === eventId);
        
        if (event && marker) {
            this.map.setView([event.latitude, event.longitude], 8);
            marker.openPopup();
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
            this.displayImpactZones();
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
            console.log('Loading health facilities...');
            
            let allFacilities = [];
            let offset = 0;
            const limit = 1000;
            let hasMore = true;
            
            while (hasMore && allFacilities.length < 5000) { // Cap at 5000 to avoid memory issues
                console.log(`Fetching batch ${Math.floor(offset / limit) + 1} (offset: ${offset})`);
                const response = await fetch(`/api/health-facilities?limit=${limit}&offset=${offset}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success && result.facilities) {
                    allFacilities = allFacilities.concat(result.facilities);
                    console.log(`Batch loaded: ${result.count} facilities. Total: ${allFacilities.length}`);
                    
                    // Check if there are more facilities to fetch
                    hasMore = result.facilities.length === limit && allFacilities.length < result.total;
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
            
            console.log(`Loaded ${allFacilities.length} total health facilities`);
            
            // Add visibility field to each facility based on affiliation
            allFacilities.forEach(facility => {
                facility.visibility = this.determineVisibility(facility);
            });
            
            this.healthFacilities = allFacilities;
            this.populateCountryFilter();
            this.initHealthFacilityCountryFilter(); // Initialize after data is loaded
            this.initImpactFacilitiesCountryFilter(); // Initialize impact facilities filter
            this.updateLegendCounts();
            
        } catch (error) {
            console.error('Error loading health facilities:', error);
            this.healthFacilities = [];
        }
    }

    addHealthFacilitiesToMap() {
        console.log(`Adding health facilities to map. Total facilities: ${this.healthFacilities.length}`);
        console.log('Facility type visibility:', this.facilityTypeVisibility);
        console.log('Selected health country:', this.selectedHealthCountry);
        console.log('Selected health functionality:', this.selectedHealthFunctionality);
        console.log('Selected health visibility:', this.selectedHealthVisibility);
        
        let addedCount = 0;
        let filteredByType = 0;
        let filteredByCountry = 0;
        let filteredByVisibility = 0;
        let filteredByFunctionality = 0;
        
        this.healthFacilities.forEach(facility => {
            console.log(`Processing facility: ${facility.name} (type: ${facility.type}, country: ${facility.country})`);
            
            // Only add facilities that are visible based on type selection
            if (!this.facilityTypeVisibility[facility.type]) {
                console.log(`Filtered by type: ${facility.type} not visible`);
                filteredByType++;
                return;
            }
            
            // Filter by country if a country is selected
            if (this.selectedHealthCountry && facility.country !== this.selectedHealthCountry) {
                filteredByCountry++;
                return;
            }
            
            // Filter by visibility if a visibility level is selected
            if (!this.matchesVisibilityFilter(facility)) {
                filteredByVisibility++;
                return;
            }

            // Filter by functionality if a functionality level is selected
            if (!this.matchesFunctionalityFilter(facility.functionality)) {
                filteredByFunctionality++;
                return;
            }
            
            addedCount++;
            console.log(`Adding facility to map: ${facility.name}`);
            
            const color = this.getHealthFacilityColor(facility.type);
            const icon = this.createHealthFacilityIcon(color, facility.type);
            
            const marker = L.marker([facility.latitude, facility.longitude], { 
                    icon: icon,
                    zIndexOffset: 1000 // Higher z-index to render on top
                })
                .addTo(this.map)
                .bindPopup(`
                    <div>
                        <h4>${facility.name}</h4>
                        <p><strong>Type:</strong> ${facility.type}</p>
                        <p><strong>Functionality:</strong> <span style="color: ${this.getFunctionalityColor(facility.functionality)}; font-weight: bold;">${facility.functionality}</span></p>
                        <p><strong>Visibility:</strong> ${facility.visibility || 'Public'}</p>
                        <p><strong>Country:</strong> ${facility.country}</p>
                        ${facility.district ? `<p><strong>District:</strong> ${facility.district}</p>` : ''}
                        ${facility.speciality ? `<p><strong>Speciality:</strong> ${facility.speciality}</p>` : ''}
                    </div>
                `);

            marker.facilityId = facility.id;
            marker.facilityType = facility.type;
            this.healthFacilityMarkers.push(marker);
        });
        
        console.log(`Health facilities added: ${addedCount}, filtered by type: ${filteredByType}, filtered by country: ${filteredByCountry}, filtered by visibility: ${filteredByVisibility}, filtered by functionality: ${filteredByFunctionality}`);
        if (this.selectedHealthCountry) {
            console.log(`Applied country filter: "${this.selectedHealthCountry}"`);
        }
        if (this.selectedHealthVisibility) {
            console.log(`Applied visibility filter: "${this.selectedHealthVisibility}"`);
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
        // Determine visibility based on affiliation
        const affiliation = facility.affiliation ? facility.affiliation.toLowerCase() : '';
        
        if (affiliation.includes('red cross') || affiliation.includes('red crescent')) {
            return 'RCRC Movement';
        } else if (affiliation.includes('ifrc') || affiliation.includes('international federation')) {
            return 'IFRC Secretariat';
        } else {
            return 'Public'; // Default for non-Red Cross facilities
        }
    }

    matchesVisibilityFilter(facility) {
        if (!this.selectedHealthVisibility) return true; // No filter selected
        
        const facilityVisibility = facility.visibility ? facility.visibility.toLowerCase() : 'public';
        
        switch (this.selectedHealthVisibility) {
            case 'public':
                return facilityVisibility === 'public';
            case 'rcrc':
                return facilityVisibility.includes('rcrc movement') || facilityVisibility.includes('red cross');
            case 'ifrc':
                return facilityVisibility.includes('ifrc secretariat') || facilityVisibility.includes('ifrc');
            default:
                return true;
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

    clearHealthFacilityMarkers() {
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
            this.selectedHealthCountry = e.target.value;
            console.log(`Selected country: "${this.selectedHealthCountry}"`);
            console.log(`Total health facilities: ${this.healthFacilities.length}`);
            
            // Debug: Show some sample countries from the data
            const sampleCountries = this.healthFacilities.slice(0, 10).map(f => f.country);
            console.log(`Sample countries:`, sampleCountries);
            
            this.updateHealthFacilitiesDisplay();
            this.updateLegendCounts(); // Update counts after filtering
            console.log(`Filtering health facilities by country: ${this.selectedHealthCountry || 'All Countries'}`);
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
        console.log(`Filtering health facilities by country: ${this.selectedHealthCountry || 'All Countries'}`);
        this.updateHealthFacilitiesDisplay();
        this.updateLegendCounts(); // Update counts after filtering
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
            const baseUrl = './hotosm_pak_health_facilities_points_shp/hotosm_pak_health_facilities_points_shp';
            
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
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }

    updateImpactFacilitiesList() {
        if (!this.showImpactZones || !this.impactZoneLayer) {
            document.getElementById('impactFacilitiesSection').style.display = 'none';
            return;
        }

        // Show the section
        document.getElementById('impactFacilitiesSection').style.display = 'block';

        // Find facilities within impact zones
        const facilitiesInImpactZones = this.findFacilitiesInImpactZones();
        
        // Filter by selected country
        const filteredFacilities = this.selectedImpactFacilityCountry 
            ? facilitiesInImpactZones.filter(f => f.country === this.selectedImpactFacilityCountry)
            : facilitiesInImpactZones;

        this.displayImpactFacilities(filteredFacilities);
    }

    findFacilitiesInImpactZones() {
        if (!this.impactZoneLayer || !this.healthFacilities.length) {
            return [];
        }

        const facilitiesInImpact = [];

        this.healthFacilities.forEach(facility => {
            // Create a point for the facility
            const facilityLatLng = L.latLng(facility.latitude, facility.longitude);
            
            // Check if facility is within any impact zone polygon
            this.impactZoneLayer.eachLayer((layer) => {
                if (layer.getBounds && layer.getBounds().contains(facilityLatLng)) {
                    // More precise check if the layer has a contains method or is a polygon
                    try {
                        if (layer.contains && layer.contains(facilityLatLng)) {
                            facilitiesInImpact.push(facility);
                        } else if (layer.getLatLngs) {
                            // For polygon layers, use point-in-polygon check
                            const polygon = layer.getLatLngs()[0]; // Get first ring of polygon
                            if (this.isPointInPolygon(facilityLatLng, polygon)) {
                                facilitiesInImpact.push(facility);
                            }
                        }
                    } catch (error) {
                        // Fallback to bounds check if geometric operations fail
                        if (layer.getBounds && layer.getBounds().contains(facilityLatLng)) {
                            facilitiesInImpact.push(facility);
                        }
                    }
                }
            });
        });

        // Remove duplicates
        return facilitiesInImpact.filter((facility, index, self) => 
            index === self.findIndex(f => f.id === facility.id)
        );
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

    displayImpactFacilities(facilities) {
        const facilitiesList = document.getElementById('impactFacilitiesList');
        
        if (!facilities || facilities.length === 0) {
            facilitiesList.innerHTML = '<div class="no-facilities">No RCRC facilities found in impact zones</div>';
            return;
        }

        const facilitiesHtml = facilities.map(facility => `
            <div class="facility-item">
                <div class="facility-name">${facility.name}</div>
                <div class="facility-details">
                    <span class="facility-country">${facility.country}</span>
                    <span class="facility-functionality ${this.getFunctionalityClass(facility.functionality)}">${facility.functionality || 'Unknown'}</span>
                </div>
                <div class="facility-type">${facility.type}</div>
            </div>
        `).join('');

        facilitiesList.innerHTML = facilitiesHtml;
    }

    getFunctionalityClass(functionality) {
        if (!functionality) return 'functionality-unknown';
        
        switch (functionality.toLowerCase()) {
            case 'fully functional':
            case 'fully':
                return 'functionality-full';
            case 'partially functional':
            case 'partially':
                return 'functionality-partial';
            case 'not functional':
            case 'not':
                return 'functionality-none';
            default:
                return 'functionality-unknown';
        }
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DisasterMap();
});