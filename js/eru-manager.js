// Emergency Response Units Management
export class ERUManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.activeERUs = [];
        this.eruMarkers = [];
        this.showActiveERUs = false;
    }

    async loadActiveERUs() {
        try {
            console.log('Loading active Emergency Response Units...');

            const response = await fetch('/api/emergency-response-units', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

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

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                    console.log(`Filtered out ERU ${eru.id}: invalid coordinates`);
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
                    console.log(`📍 Offsetting ERU ${eru.id} by ${offsetDistance.toFixed(4)} degrees at angle ${existingMarkersAtCoord * 60}°`);
                }

                // Create red cross icon (square shape)
                const redCrossIcon = L.divIcon({
                    html: `<div style="
                        background-color: white;
                        color: #dc2626;
                        width: 24px;
                        height: 24px;
                        border-radius: 3px;
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
}