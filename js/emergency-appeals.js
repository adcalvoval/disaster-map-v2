// Emergency Appeals Management
import { Utils } from './utils.js';

export class EmergencyAppeals {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.activeAppeals = [];
        this.appealMarkers = [];
        this.showActiveAppeals = false;
    }

    async loadActiveAppeals() {
        try {
            console.log('Loading active Emergency Appeals...');

            const response = await fetch('/api/emergency-appeals', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success && result.appeals) {
                this.activeAppeals = result.appeals;
                console.log(`✅ Loaded ${this.activeAppeals.length} active Emergency Appeals`);

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

        // Clear existing markers
        this.clearAppealMarkers();

        let addedCount = 0;
        const existingCoordinates = new Map();

        this.activeAppeals.forEach(appeal => {
            try {
                let lat = appeal.latitude;
                let lng = appeal.longitude;

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                    console.log(`Filtered out Appeal ${appeal.id}: invalid coordinates`);
                    return;
                }

                // Handle overlapping coordinates by offsetting markers in a circular pattern
                const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
                const existingMarkersAtCoord = existingCoordinates.get(coordKey) || 0;
                existingCoordinates.set(coordKey, existingMarkersAtCoord + 1);

                if (existingMarkersAtCoord > 0) {
                    // Create tight circular pattern to keep markers within country borders
                    const baseDistance = 0.05; // Small offset to stay within country borders
                    const offsetDistance = baseDistance * (1 + existingMarkersAtCoord * 0.2);
                    const angle = (existingMarkersAtCoord * 60) * (Math.PI / 180); // 60° = 360°/6 for tighter spacing
                    lat += Math.sin(angle) * offsetDistance;
                    lng += Math.cos(angle) * offsetDistance;
                    console.log(`📍 Offsetting Appeal ${appeal.id} by ${offsetDistance.toFixed(4)} degrees at angle ${existingMarkersAtCoord * 60}°`);
                }

                // Create blue cross icon (same as ERU but blue)
                const blueCrossIcon = L.divIcon({
                    html: `<div style="
                        background-color: white;
                        color: #2563eb;
                        width: 24px;
                        height: 24px;
                        border-radius: 3px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        font-weight: bold;
                        border: 2px solid #2563eb;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">✚</div>`,
                    className: 'appeal-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Create tooltip content
                const startDate = Utils.formatDate(appeal.start_date);
                const endDate = appeal.end_date ? Utils.formatDate(appeal.end_date) : 'Ongoing';

                const tooltipContent = `
                    <div class="appeal-tooltip">
                        <strong>Emergency Appeal</strong><br>
                        <strong>Country:</strong> ${appeal.country}<br>
                        <strong>Appeal:</strong> ${appeal.name}<br>
                        <strong>Disaster Type:</strong> ${appeal.disaster_type}<br>
                        <strong>Start Date:</strong> ${startDate}<br>
                        <strong>End Date:</strong> ${endDate}
                    </div>
                `;

                const marker = L.marker([lat, lng], { icon: blueCrossIcon })
                    .bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10]
                    })
                    .addTo(this.map);

                this.appealMarkers.push(marker);
                addedCount++;

            } catch (error) {
                console.error('Error adding Emergency Appeal marker:', error, appeal);
            }
        });

        console.log(`✅ Added ${addedCount} Emergency Appeal markers to map`);
    }

    clearAppealMarkers() {
        console.log(`Clearing ${this.appealMarkers.length} Emergency Appeal markers`);
        this.appealMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.appealMarkers = [];
    }
}
