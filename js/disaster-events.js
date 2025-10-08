// Disaster Events Management
import { Utils } from './utils.js';

export class DisasterEvents {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.disasters = [];
        this.disasterMarkers = [];
        this.affectedAreas = [];
        this.showAffectedAreas = true;
        this.selectedDisasterTypes = {
            'Earthquake': true,
            'Flood': true,
            'Cyclone': true,
            'Wildfire': true,
            'Volcanic Activity': true,
            'Other': true
        };
        this.currentlyFocusedEvent = null;
    }

    async loadDisasterData() {
        try {
            document.getElementById('eventList').innerHTML = '<div class="loading">Loading real disaster events from GDACS...</div>';

            const result = await this.fetchGDACSData();

            if (result.success && result.events) {
                this.disasters = result.events;
                console.log(`✅ Loaded ${this.disasters.length} disaster events from backend`);

                if (this.showAffectedAreas) {
                    this.addMarkersToMap(this.disasters);
                    this.addAffectedAreasToMap(this.disasters);
                    this.displayEvents(this.disasters);
                }
            }
        } catch (error) {
            console.error('Error in loadDisasterData:', error);
            document.getElementById('eventList').innerHTML = '<div class="loading">Error loading data from backend. Using sample data...</div>';

            this.disasters = this.getSampleData();
            if (this.showAffectedAreas) {
                this.addMarkersToMap(this.disasters);
                this.addAffectedAreasToMap(this.disasters);
                this.displayEvents(this.disasters);
            }
        }
    }

    async loadDisasterDataWithDates(fromDate, toDate) {
        try {
            document.getElementById('eventList').innerHTML = '<div class="loading">Loading disaster events from GDACS...</div>';

            const result = await this.fetchGDACSDataWithDates(fromDate, toDate);

            if (result.success && result.events) {
                this.disasters = result.events;
                if (this.showAffectedAreas) {
                    this.addMarkersToMap(this.disasters);
                    this.addAffectedAreasToMap(this.disasters);
                    this.displayEvents(this.disasters);
                }
            }
        } catch (error) {
            console.error('Error loading disaster data with dates:', error);
            document.getElementById('eventList').innerHTML = '<div class="error">Error loading events. Please try again.</div>';
        }
    }

    async fetchGDACSData() {
        try {
            console.log('🌍 Fetching disaster events from backend API...');
            const response = await fetch('/api/gdacs-events');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.events) {
                console.log(`📊 Backend returned ${result.events.length} events`);

                const processedEvents = result.events.map(event => ({
                    ...event,
                    affectedRadius: this.calculateAffectedRadius(event)
                }));

                return {
                    success: true,
                    events: processedEvents
                };
            } else {
                throw new Error('Invalid response format from backend');
            }
        } catch (error) {
            console.error('❌ Backend fetch failed:', error.message);
            throw error;
        }
    }

    async fetchGDACSDataWithDates(fromDate, toDate) {
        try {
            console.log('🌍 Fetching disaster events with date range from backend API...');
            const response = await fetch(`/api/gdacs-events?fromDate=${fromDate}&toDate=${toDate}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.events) {
                console.log(`📊 Backend returned ${result.events.length} events for date range`);

                const processedEvents = result.events.map(event => ({
                    ...event,
                    affectedRadius: this.calculateAffectedRadius(event)
                }));

                return {
                    success: true,
                    events: processedEvents
                };
            } else {
                throw new Error('Invalid response format from backend');
            }
        } catch (error) {
            console.error('❌ Backend fetch with dates failed:', error.message);
            throw error;
        }
    }

    calculateAffectedRadius(event) {
        const baseRadiusByType = {
            'Earthquake': 50,
            'Flood': 30,
            'Cyclone': 100,
            'Wildfire': 20,
            'Volcanic Activity': 25,
            'Other': 40
        };

        const alertMultiplier = {
            'Red': 1.5,
            'Orange': 1.2,
            'Green': 1.0
        };

        const baseRadius = baseRadiusByType[event.type] || baseRadiusByType['Other'];
        const multiplier = alertMultiplier[event.alertLevel] || 1.0;

        return baseRadius * multiplier;
    }

    getSampleData() {
        return [
            {
                id: 'EQ001',
                title: 'Magnitude 6.2 Earthquake',
                description: 'Strong earthquake strikes eastern region',
                type: 'Earthquake',
                alertLevel: 'Orange',
                coordinates: [-2.5, 28.8],
                severity: 'high',
                affectedRadius: 60,
                date: '2024-01-15'
            },
            {
                id: 'FL002',
                title: 'Major River Flooding',
                description: 'Severe flooding affecting multiple communities',
                type: 'Flood',
                alertLevel: 'Red',
                coordinates: [-5.2, 23.4],
                severity: 'very-high',
                affectedRadius: 45,
                date: '2024-01-12'
            },
            {
                id: 'CY003',
                title: 'Tropical Cyclone',
                description: 'Category 3 cyclone approaching coastal areas',
                type: 'Cyclone',
                alertLevel: 'Red',
                coordinates: [-3.2, 29.1],
                severity: 'very-high',
                affectedRadius: 120,
                date: '2024-01-10'
            }
        ];
    }

    sortEventsByAlertLevel(events) {
        const alertLevelPriority = {
            'RED': 0, 'Red': 0,
            'ORANGE': 1, 'Orange': 1,
            'GREEN': 2, 'Green': 2
        };
        return events.sort((a, b) => {
            const aPriority = alertLevelPriority[a.alertLevel] !== undefined ? alertLevelPriority[a.alertLevel] : 2;
            const bPriority = alertLevelPriority[b.alertLevel] !== undefined ? alertLevelPriority[b.alertLevel] : 2;
            return aPriority - bPriority;
        });
    }

    displayEvents(events) {
        const eventList = document.getElementById('eventList');
        if (events.length === 0) {
            eventList.innerHTML = '<div class="loading">No disaster events found.</div>';
            return;
        }

        const sortedEvents = this.sortEventsByAlertLevel(events);
        const eventsHtml = sortedEvents.map(event => `
            <div class="event-item ${event.alertLevel.toLowerCase()}" onclick="app.focusOnEvent('${event.id}')">
                <div class="event-title">${event.title}</div>
                <div class="event-details">
                    <div class="event-type">${event.type}</div>
                    <div class="event-date">${event.date}</div>
                </div>
                <div class="event-description">${event.description}</div>
                <span class="alert-badge alert-${event.alertLevel.toLowerCase()}">${event.alertLevel}</span>
            </div>
        `).join('');

        eventList.innerHTML = eventsHtml;
    }

    addMarkersToMap(events) {
        this.clearMarkers();

        events.forEach(event => {
            const alertColor = this.getAlertColor(event.alertLevel);
            const icon = this.createCustomIcon(alertColor, event.type);

            // Build popup content with available information
            let popupContent = `
                <div class="popup-content">
                    <h3>${event.title}</h3>
                    <p><strong>Type:</strong> ${event.type}</p>
                    <p><strong>Alert Level:</strong> <span class="alert-${event.alertLevel.toLowerCase()}">${event.alertLevel}</span></p>
                    <p><strong>Date:</strong> ${Utils.formatDate(event.date)}</p>`;

            // Add country if available
            if (event.country) {
                popupContent += `<p><strong>Country:</strong> ${event.country}</p>`;
            }

            // Add affected population if available
            if (event.affectedPopulation) {
                const population = typeof event.affectedPopulation === 'number'
                    ? event.affectedPopulation.toLocaleString()
                    : event.affectedPopulation;
                popupContent += `<p><strong>Population Affected:</strong> ${population}</p>`;
            }

            // Add severity information if available
            if (event.severityText) {
                popupContent += `<p><strong>Severity:</strong> ${event.severityText}</p>`;
            } else if (event.severityValue && event.severityUnit) {
                popupContent += `<p><strong>Severity:</strong> ${event.severityValue} ${event.severityUnit}</p>`;
            }

            // Add affected radius if available
            if (event.affectedRadius) {
                popupContent += `<p><strong>Affected Radius:</strong> ${event.affectedRadius} km</p>`;
            }

            // Add impact description if available
            if (event.impactDescription) {
                popupContent += `<p><strong>Impact:</strong> ${event.impactDescription}</p>`;
            }

            // Add main description
            if (event.description) {
                popupContent += `<p>${event.description}</p>`;
            }

            popupContent += `</div>`;

            const marker = L.marker(event.coordinates, { icon: icon })
                .addTo(this.map)
                .bindPopup(popupContent);

            marker.eventId = event.id;
            this.disasterMarkers.push(marker);
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
            'Earthquake': '🌍',
            'Flood': '🌊',
            'Cyclone': '🌀',
            'Wildfire': '🔥',
            'Volcanic Activity': '🌋',
            'Other': '⚠️'
        };
        return symbols[type] || symbols['Other'];
    }

    getAlertColor(alertLevel) {
        const colors = {
            'RED': '#dc2626',
            'Red': '#dc2626',
            'ORANGE': '#ea580c',
            'Orange': '#ea580c',
            'GREEN': '#16a34a',
            'Green': '#16a34a'
        };
        return colors[alertLevel] || colors['Green'];
    }

    clearMarkers() {
        this.disasterMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.disasterMarkers = [];
    }

    clearAffectedAreas() {
        this.affectedAreas.forEach(area => {
            this.map.removeLayer(area);
        });
        this.affectedAreas = [];
    }

    addAffectedAreasToMap(events) {
        this.clearAffectedAreas();

        events.forEach(event => {
            if (event.affectedRadius && event.affectedRadius > 0) {
                const alertColor = this.getAlertColor(event.alertLevel);

                const circle = L.circle(event.coordinates, {
                    color: alertColor,
                    fillColor: alertColor,
                    fillOpacity: 0.1,
                    radius: event.affectedRadius * 1000,
                    weight: 2,
                    dashArray: '5, 5'
                }).addTo(this.map);

                circle.eventId = event.id;
                this.affectedAreas.push(circle);
            }
        });
    }

    toggleDisasterEvents() {
        if (this.showAffectedAreas) {
            this.addMarkersToMap(this.disasters);
            this.addAffectedAreasToMap(this.disasters);
            this.displayEvents(this.disasters);
        } else {
            this.clearMarkers();
            this.clearAffectedAreas();
            document.getElementById('eventList').innerHTML = '<div class="loading">Disaster events hidden</div>';
        }
    }

    focusOnEvent(eventId) {
        // If clicking on the same event, zoom back out to global view
        if (this.currentlyFocusedEvent === eventId) {
            this.map.setView([20, 0], 2);
            this.currentlyFocusedEvent = null;

            // Remove all highlights
            document.querySelectorAll('.event-item').forEach(item => {
                item.classList.remove('selected-event');
            });

            // Close any open popups
            this.map.closePopup();
            return;
        }

        const event = this.disasters.find(e => e.id === eventId);
        if (event) {
            this.map.setView(event.coordinates, 10);
            this.currentlyFocusedEvent = eventId;

            const marker = this.disasterMarkers.find(m => m.eventId === eventId);
            if (marker) {
                marker.openPopup();
                this.highlightSelectedEvent(eventId);
            }
        }
    }

    highlightSelectedEvent(eventId) {
        // Remove previous highlights
        document.querySelectorAll('.event-item').forEach(item => {
            item.classList.remove('selected-event');
        });

        // Add highlight to selected event
        document.querySelectorAll('.event-item').forEach(item => {
            if (item.onclick && item.onclick.toString().includes(eventId)) {
                item.classList.add('selected-event');
            }
        });
    }

    searchEvents(query) {
        if (!query.trim()) {
            this.displayEvents(this.disasters);
            return;
        }

        const filteredEvents = this.disasters.filter(event => {
            return (
                event.title.toLowerCase().includes(query.toLowerCase()) ||
                event.description.toLowerCase().includes(query.toLowerCase()) ||
                event.type.toLowerCase().includes(query.toLowerCase()) ||
                event.alertLevel.toLowerCase().includes(query.toLowerCase())
            );
        });

        this.displayEvents(filteredEvents);
        this.displayFilteredMarkers(filteredEvents);
    }

    displayFilteredMarkers(filteredEvents) {
        this.clearMarkers();
        this.clearAffectedAreas();
        this.addMarkersToMap(filteredEvents);
        this.addAffectedAreasToMap(filteredEvents);
    }
}