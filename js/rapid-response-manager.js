// Rapid Response Personnel Management
export class RapidResponseManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.activePersonnel = [];
        this.personnelMarkers = [];
        this.showRapidResponse = false;
    }

    async loadRapidResponsePersonnel() {
        try {
            console.log('Loading Rapid Response Personnel...');

            const response = await fetch('/api/rapid-response-personnel', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success && result.personnel) {
                this.activePersonnel = result.personnel;
                console.log(`✅ Loaded ${this.activePersonnel.length} rapid response personnel`);

                // Show source information
                if (result.source) {
                    console.log(`📡 Rapid Response data source: ${result.source}`);
                }

                // If checkbox is checked, display them now that data is loaded
                if (this.showRapidResponse) {
                    console.log('📍 Personnel loaded and checkbox is checked - displaying on map');
                    this.addPersonnelToMap();
                }
            } else {
                console.warn('❌ Failed to load rapid response personnel from API');
                this.activePersonnel = [];
            }

        } catch (error) {
            console.error('Error loading rapid response personnel:', error);
            this.activePersonnel = [];
        }
    }

    toggleRapidResponse() {
        if (this.showRapidResponse) {
            this.addPersonnelToMap();
        } else {
            this.clearPersonnelMarkers();
        }
    }

    addPersonnelToMap() {
        console.log(`Adding ${this.activePersonnel.length} rapid response personnel to map`);

        // Clear existing markers
        this.clearPersonnelMarkers();

        let addedCount = 0;
        const existingCoordinates = new Map();

        this.activePersonnel.forEach(person => {
            try {
                let lat = person.latitude;
                let lng = person.longitude;

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                    console.log(`Filtered out personnel ${person.id}: invalid coordinates`);
                    return;
                }

                // Handle overlapping coordinates by offsetting markers in a circular pattern
                const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
                const existingMarkersAtCoord = existingCoordinates.get(coordKey) || 0;
                existingCoordinates.set(coordKey, existingMarkersAtCoord + 1);

                if (existingMarkersAtCoord > 0) {
                    // Create circular pattern with increasing distance for better visibility
                    const baseDistance = 0.003;
                    const offsetDistance = baseDistance * (1 + existingMarkersAtCoord * 0.3);
                    const angle = (existingMarkersAtCoord * 72) * (Math.PI / 180); // 72° = 360°/5 for better spacing
                    lat += Math.sin(angle) * offsetDistance;
                    lng += Math.cos(angle) * offsetDistance;
                    console.log(`📍 Offsetting personnel ${person.id} by ${offsetDistance.toFixed(4)} degrees at angle ${existingMarkersAtCoord * 72}°`);
                }

                // Create person icon with red jacket
                const personIcon = L.divIcon({
                    html: `<div style="
                        background-color: white;
                        width: 26px;
                        height: 26px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid #dc2626;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        position: relative;
                    ">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                            <path d="M12 14c-3.5 0-6 1.5-6 3v4h12v-4c0-1.5-2.5-3-6-3z" fill="#dc2626"/>
                            <circle cx="12" cy="8" r="4" fill="#f9d8b4"/>
                            <path d="M8 14.5c1-0.5 2.5-0.5 4-0.5s3 0 4 0.5" stroke="#991b1b" stroke-width="0.5" fill="none"/>
                        </svg>
                    </div>`,
                    className: 'personnel-marker',
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });

                // Create tooltip content
                const startDate = person.startDate ? new Date(person.startDate).toLocaleDateString() : 'Unknown';
                const endDate = person.endDate ? new Date(person.endDate).toLocaleDateString() : 'Ongoing';

                const tooltipContent = `
                    <div class="personnel-tooltip">
                        <strong>Rapid Response Personnel</strong><br>
                        <strong>Role:</strong> ${person.jobTitle}<br>
                        <strong>Crisis:</strong> ${person.crisis}<br>
                        <strong>Deploying Society:</strong> ${person.deployingNationalSociety}<br>
                        <strong>Deployed To:</strong> ${person.deployedToCountry}<br>
                        <strong>Start Date:</strong> ${startDate}<br>
                        <strong>End Date:</strong> ${endDate}
                    </div>
                `;

                const marker = L.marker([lat, lng], { icon: personIcon })
                    .bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10],
                        className: 'personnel-tooltip-wrapper'
                    })
                    .addTo(this.map);

                this.personnelMarkers.push(marker);
                addedCount++;

            } catch (error) {
                console.error('Error adding personnel marker:', error, person);
            }
        });

        console.log(`✅ Added ${addedCount} rapid response personnel markers to map`);
    }

    clearPersonnelMarkers() {
        console.log(`Clearing ${this.personnelMarkers.length} personnel markers`);
        this.personnelMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.personnelMarkers = [];
    }
}
