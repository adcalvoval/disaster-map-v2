class DisasterMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.affectedAreas = [];
        this.disasterEvents = [];
        this.filteredEvents = [];
        this.showAffectedAreas = true;
        this.healthFacilityMarkers = [];
        this.healthFacilities = [];
        this.showHealthFacilities = false;
        this.selectedCountry = ''; // Add country filter state
        this.ifrcSearchTerm = ''; // Add IFRC document search term
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
        this.initializeDateInputs();
        this.loadDisasterData();
        this.loadHealthFacilities();
        this.initIfrcDocuments();
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

        document.getElementById('searchByDate').addEventListener('click', () => {
            this.searchEventsByDate();
        });

        document.getElementById('alertLevel').addEventListener('change', (e) => {
            this.filterByAlertLevel(e.target.value);
        });

        document.getElementById('showAffectedAreas').addEventListener('change', (e) => {
            this.showAffectedAreas = e.target.checked;
            this.toggleAffectedAreas();
        });

        document.getElementById('showHealthFacilities').addEventListener('change', (e) => {
            this.showHealthFacilities = e.target.checked;
            this.toggleHealthFacilities();
            
            // Show/hide the health facilities controls
            const controls = document.getElementById('healthFacilitiesControls');
            controls.style.display = e.target.checked ? 'block' : 'none';
        });

        // Event search functionality
        document.getElementById('eventSearch').addEventListener('input', (e) => {
            this.searchEvents(e.target.value);
        });

        document.getElementById('clearEventSearch').addEventListener('click', () => {
            this.clearEventSearch();
        });

        // IFRC Documents event listeners
        document.getElementById('refreshIfrcDocs').addEventListener('click', () => {
            this.loadIfrcDocuments();
        });

        document.getElementById('countryFilter').addEventListener('change', (e) => {
            this.selectedCountry = e.target.value;
            this.loadIfrcDocuments();
        });

        // IFRC Document search functionality
        document.getElementById('ifrcDocumentSearch').addEventListener('input', (e) => {
            this.searchIfrcDocuments(e.target.value);
        });

        document.getElementById('clearIfrcDocumentSearch').addEventListener('click', () => {
            this.clearIfrcDocumentSearch();
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

        // Add event listeners for individual facility type checkboxes
        this.initFacilityTypeListeners();
        // Note: initHealthFacilityCountryFilter() is called after health facilities are loaded
    }

    initializeDateInputs() {
        // Set default date range to last 2 months
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 2);

        document.getElementById('dateFrom').value = fromDate.toISOString().split('T')[0];
        document.getElementById('dateTo').value = toDate.toISOString().split('T')[0];
        
        console.log(`Initialized date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
    }

    async searchEventsByDate() {
        const fromDateValue = document.getElementById('dateFrom').value;
        const toDateValue = document.getElementById('dateTo').value;
        
        if (!fromDateValue || !toDateValue) {
            alert('Please select both start and end dates for your search.');
            return;
        }

        if (new Date(fromDateValue) > new Date(toDateValue)) {
            alert('Start date must be before end date.');
            return;
        }

        console.log(`Searching events from ${fromDateValue} to ${toDateValue}`);
        
        // Show loading state
        document.getElementById('eventList').innerHTML = '<div class="loading">Searching disaster events...</div>';
        
        try {
            await this.loadDisasterDataWithDates(fromDateValue, toDateValue);
        } catch (error) {
            console.error('Error searching events:', error);
            document.getElementById('eventList').innerHTML = '<div class="error">Error loading events. Please try again.</div>';
        }
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
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
            this.healthFacilities = allFacilities;
            this.populateCountryFilter();
            this.initHealthFacilityCountryFilter(); // Initialize after data is loaded
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
        
        let addedCount = 0;
        let filteredByType = 0;
        let filteredByCountry = 0;
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
            
            // Filter by functionality if a functionality level is selected
            if (!this.matchesFunctionalityFilter(facility.functionality)) {
                filteredByFunctionality++;
                return;
            }
            
            addedCount++;
            console.log(`Adding facility to map: ${facility.name}`);
            
            const color = this.getHealthFacilityColor(facility.type);
            const icon = this.createHealthFacilityIcon(color, facility.type);
            
            const marker = L.marker([facility.latitude, facility.longitude], { icon })
                .addTo(this.map)
                .bindPopup(`
                    <div>
                        <h4>${facility.name}</h4>
                        <p><strong>Type:</strong> ${facility.type}</p>
                        <p><strong>Functionality:</strong> <span style="color: ${this.getFunctionalityColor(facility.functionality)}; font-weight: bold;">${facility.functionality}</span></p>
                        <p><strong>Country:</strong> ${facility.country}</p>
                        ${facility.district ? `<p><strong>District:</strong> ${facility.district}</p>` : ''}
                        ${facility.speciality ? `<p><strong>Speciality:</strong> ${facility.speciality}</p>` : ''}
                    </div>
                `);

            marker.facilityId = facility.id;
            marker.facilityType = facility.type;
            this.healthFacilityMarkers.push(marker);
        });
        
        console.log(`Health facilities added: ${addedCount}, filtered by type: ${filteredByType}, filtered by country: ${filteredByCountry}, filtered by functionality: ${filteredByFunctionality}`);
        if (this.selectedHealthCountry) {
            console.log(`Applied country filter: "${this.selectedHealthCountry}"`);
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

    createHealthFacilityIcon(color, type) {
        const iconSymbol = this.getHealthFacilitySymbol(type);
        
        return L.divIcon({
            className: 'health-facility-icon',
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
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${iconSymbol}</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
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

    // IFRC Documents functionality
    async initIfrcDocuments() {
        this.selectedCountry = '';
        await this.loadCountries();
        await this.loadIfrcDocuments();
    }

    async loadCountries() {
        try {
            const response = await fetch('/api/ifrc-countries');
            const data = await response.json();
            
            const countrySelect = document.getElementById('countryFilter');
            countrySelect.innerHTML = '<option value="">All Countries</option>';
            
            if (data.results) {
                data.results.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.id;
                    option.textContent = country.name;
                    countrySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    }

    async loadIfrcDocuments() {
        try {
            const documentsList = document.getElementById('ifrcDocumentsList');
            documentsList.innerHTML = '<div class="loading-ifrc">Loading IFRC documents...</div>';
            
            const params = new URLSearchParams({
                limit: '10'
            });
            
            if (this.selectedCountry) {
                params.append('country', this.selectedCountry);
            }

            if (this.ifrcSearchTerm) {
                params.append('search', this.ifrcSearchTerm);
            }
            
            const response = await fetch(`/api/ifrc-documents?${params}`);
            const data = await response.json();
            
            if (response.ok) {
                this.displayIfrcDocuments(data.results || []);
            } else {
                throw new Error(data.message || 'Failed to fetch documents');
            }
            
        } catch (error) {
            console.error('Error loading IFRC documents:', error);
            const documentsList = document.getElementById('ifrcDocumentsList');
            documentsList.innerHTML = `<div class="error-ifrc">Error loading documents: ${error.message}</div>`;
        }
    }

    displayIfrcDocuments(documents) {
        const documentsList = document.getElementById('ifrcDocumentsList');
        
        if (documents.length === 0) {
            documentsList.innerHTML = '<div class="loading-ifrc">No documents found</div>';
            return;
        }
        
        const documentsHTML = documents.map(doc => {
            const date = new Date(doc.created_at).toLocaleDateString();
            const countryName = doc.country_name || 'Unknown';
            const disasterType = doc.disaster_type || 'General';
            
            // Check if document has a valid URL
            const documentUrl = doc.document_url || doc.document || doc.file || doc.url;
            const hasValidUrl = documentUrl && documentUrl !== 'null' && documentUrl.startsWith('http');
            
            return `
                <div class="document-item ${hasValidUrl ? '' : 'no-url'}" ${hasValidUrl ? `onclick="window.open('${documentUrl}', '_blank')"` : ''}>
                    <div class="document-title">${doc.name || 'Unnamed Document'}</div>
                    <div class="document-meta">
                        <span class="document-country">${countryName}</span>
                        <span class="document-date">${date}</span>
                    </div>
                    <div class="document-meta">
                        <span class="document-type">${disasterType}</span>
                        <span class="document-date">${doc.appeal_code || ''}</span>
                    </div>
                    ${!hasValidUrl ? '<div class="no-url-indicator">⚠️ Document URL not available</div>' : ''}
                </div>
            `;
        }).join('');
        
        documentsList.innerHTML = documentsHTML;
    }

    // IFRC Document search functionality
    searchIfrcDocuments(query) {
        const searchInput = document.getElementById('ifrcDocumentSearch');
        const clearBtn = document.getElementById('clearIfrcDocumentSearch');
        
        // Show/hide clear button
        clearBtn.style.display = query.trim() ? 'block' : 'none';
        
        // Update search term and reload documents
        this.ifrcSearchTerm = query.trim();
        this.loadIfrcDocuments();
    }

    clearIfrcDocumentSearch() {
        const searchInput = document.getElementById('ifrcDocumentSearch');
        const clearBtn = document.getElementById('clearIfrcDocumentSearch');
        
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this.ifrcSearchTerm = '';
        this.loadIfrcDocuments();
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
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DisasterMap();
});