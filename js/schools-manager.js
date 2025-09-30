// Schools Manager
export class SchoolsManager {
    constructor(map, config) {
        this.map = map;
        this.config = config;
        this.schoolsData = [];
        this.schoolMarkers = [];
        this.showSchools = false;
        this.selectedEducationLevels = {
            'Primary': true,
            'Secondary': true,
            'Unknown': true
        };
    }

    async loadSchoolsData() {
        try {
            console.log('Loading schools data from local JSON file...');

            const response = await fetch('/schools_AFG.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.schoolsData = result.data;
                console.log(`✅ Loaded ${this.schoolsData.length} schools for AFG`);

                if (this.showSchools) {
                    this.displaySchoolsOnMap();
                }
            } else {
                throw new Error('Invalid response format from schools data');
            }
        } catch (error) {
            console.error('Error loading schools data:', error.message);
            // Fallback to empty array
            this.schoolsData = [];
        }
    }

    displaySchoolsOnMap() {
        this.clearSchoolMarkers();

        if (!this.schoolsData || this.schoolsData.length === 0) {
            console.warn('No schools data available to display');
            return;
        }

        let displayedCount = 0;

        this.schoolsData.forEach(school => {
            // Validate coordinates
            if (!school.latitude || !school.longitude ||
                isNaN(school.latitude) || isNaN(school.longitude)) {
                return;
            }

            // Filter by education level
            const educationLevel = school.education_level || 'Unknown';
            if (!this.selectedEducationLevels[educationLevel]) {
                return;
            }

            const coordinates = [school.latitude, school.longitude];
            const icon = this.createSchoolIcon(educationLevel);

            const marker = L.marker(coordinates, { icon: icon })
                .addTo(this.map)
                .bindPopup(`
                    <div class="popup-content">
                        <h3>🏫 ${school.school_name}</h3>
                        <p><strong>Education Level:</strong> ${educationLevel}</p>
                        <p><strong>Country:</strong> ${school.country_iso3_code}</p>
                        <p><strong>Coordinates:</strong> ${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}</p>
                    </div>
                `);

            marker.schoolData = school;
            this.schoolMarkers.push(marker);
            displayedCount++;
        });

        console.log(`📍 Displayed ${displayedCount} school markers on map`);
        this.updateSchoolsLegendCounts();
    }

    createSchoolIcon(educationLevel) {
        let iconColor, iconSymbol;

        switch (educationLevel) {
            case 'Primary':
                iconColor = '#10b981'; // Green
                iconSymbol = '🏫';
                break;
            case 'Secondary':
                iconColor = '#3b82f6'; // Blue
                iconSymbol = '🎓';
                break;
            default:
                iconColor = '#6b7280'; // Gray
                iconSymbol = '📚';
                break;
        }

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div style="
                    background-color: ${iconColor};
                    color: white;
                    width: 25px;
                    height: 25px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 1000;
                    position: relative;
                ">${iconSymbol}</div>
            `,
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5]
        });
    }

    clearSchoolMarkers() {
        this.schoolMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.schoolMarkers = [];
    }

    toggleSchoolsDisplay() {
        this.showSchools = !this.showSchools;

        if (this.showSchools) {
            this.displaySchoolsOnMap();
        } else {
            this.clearSchoolMarkers();
        }

        console.log(`Schools display: ${this.showSchools ? 'ON' : 'OFF'}`);
    }

    toggleEducationLevel(level) {
        this.selectedEducationLevels[level] = !this.selectedEducationLevels[level];

        if (this.showSchools) {
            this.displaySchoolsOnMap();
        }
    }

    updateSchoolsLegendCounts() {
        if (!this.schoolsData) return;

        const counts = {
            'Primary': 0,
            'Secondary': 0,
            'Unknown': 0
        };

        this.schoolsData.forEach(school => {
            const level = school.education_level || 'Unknown';
            counts[level] = (counts[level] || 0) + 1;
        });

        // Update legend labels with counts
        const primaryLabel = document.querySelector('label[for="show-school-primary"]');
        const secondaryLabel = document.querySelector('label[for="show-school-secondary"]');
        const unknownLabel = document.querySelector('label[for="show-school-unknown"]');

        if (primaryLabel) primaryLabel.textContent = `Primary Schools (${counts.Primary})`;
        if (secondaryLabel) secondaryLabel.textContent = `Secondary Schools (${counts.Secondary})`;
        if (unknownLabel) unknownLabel.textContent = `Unknown Level (${counts.Unknown})`;
    }

    getSchoolsStats() {
        if (!this.schoolsData) return { total: 0, byLevel: {} };

        const stats = {
            total: this.schoolsData.length,
            byLevel: {}
        };

        this.schoolsData.forEach(school => {
            const level = school.education_level || 'Unknown';
            stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
        });

        return stats;
    }
}