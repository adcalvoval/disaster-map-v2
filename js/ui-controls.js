// UI Controls and Event Listeners Management
export class UIControls {
    constructor(disasterMap) {
        this.disasterMap = disasterMap;
        this.isFullscreen = false;
    }

    initEventListeners() {
        // Fullscreen toggle
        const fullscreenToggle = document.getElementById('fullscreenToggle');
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('click', () => {
                this.disasterMap.mapManager.toggleFullscreen();
            });
        }

        // Satellite layer toggle
        const satelliteToggle = document.getElementById('satelliteToggle');
        if (satelliteToggle) {
            satelliteToggle.addEventListener('click', () => {
                this.toggleSatelliteLayer();
            });
        }

        // Disaster controls collapse
        const disasterControlsBox = document.querySelector('.disaster-controls-box');
        if (disasterControlsBox) {
            const toggleBtn = disasterControlsBox.querySelector('.collapse-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.toggleDisasterControlsCollapse();
                });
            }
        }

        // Health facilities controls collapse
        const toggleHealthControlsBtn = document.getElementById('toggleHealthControls');
        if (toggleHealthControlsBtn) {
            toggleHealthControlsBtn.addEventListener('click', () => {
                this.toggleHealthControlsCollapse();
            });
        }

        // Map controls collapse
        const toggleMapControlsBtn = document.getElementById('toggleMapControls');
        if (toggleMapControlsBtn) {
            toggleMapControlsBtn.addEventListener('click', () => {
                this.toggleMapControlsCollapse();
            });
        }

        // Disaster controls collapse
        const toggleDisasterControlsBtn = document.getElementById('toggleDisasterControls');
        if (toggleDisasterControlsBtn) {
            toggleDisasterControlsBtn.addEventListener('click', () => {
                this.toggleDisasterControlsCollapse();
            });
        }

        // Clustering toggle
        const clusteringBtn = document.getElementById('toggle-clustering-btn');
        if (clusteringBtn) {
            clusteringBtn.addEventListener('click', () => {
                this.disasterMap.healthFacilities.toggleClustering();
            });
        }

        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.disasterMap.mapManager.toggleFullscreen();
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('toggleSidebar');
        if (sidebarToggle) {
            console.log('✅ Sidebar toggle button found, attaching event listener');
            sidebarToggle.addEventListener('click', () => {
                console.log('🖱️ Sidebar toggle clicked');
                this.toggleSidebar();
            });
        } else {
            console.warn('❌ Sidebar toggle button not found');
        }

        // Drawer close button
        const drawerCloseBtn = document.querySelector('.drawer-close');
        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Health facilities toggle
        const healthToggle = document.getElementById('showHealthFacilities');
        if (healthToggle) {
            healthToggle.addEventListener('change', (e) => {
                this.disasterMap.healthFacilities.showHealthFacilities = e.target.checked;
                this.disasterMap.healthFacilities.toggleHealthFacilities();
            });
        }

        // Disaster events toggle
        const disasterToggle = document.getElementById('showAffectedAreas');
        if (disasterToggle) {
            disasterToggle.addEventListener('change', (e) => {
                this.disasterMap.disasterEvents.showAffectedAreas = e.target.checked;
                this.disasterMap.disasterEvents.toggleDisasterEvents();
            });
        }

        // Map controls toggle
        const mapControlsToggle = document.getElementById('mapControlsToggle');
        if (mapControlsToggle) {
            mapControlsToggle.addEventListener('click', () => {
                this.toggleMapControls();
            });
        }

        // Country filter
        const healthCountryFilter = document.getElementById('healthCountryFilter');
        if (healthCountryFilter) {
            healthCountryFilter.addEventListener('change', () => {
                this.disasterMap.healthFacilities.filterHealthFacilities();
            });
        }

        // Functionality filter
        const healthFunctionalityFilter = document.getElementById('healthFunctionalityFilter');
        if (healthFunctionalityFilter) {
            healthFunctionalityFilter.addEventListener('change', () => {
                this.disasterMap.healthFacilities.filterHealthFacilities();
            });
        }

        // Facility country filter
        const facilityCountryFilter = document.getElementById('facilityCountryFilter');
        if (facilityCountryFilter) {
            facilityCountryFilter.addEventListener('change', () => {
                this.updateImpactFacilitiesList();
            });
        }

        // Event search
        const eventSearch = document.getElementById('eventSearch');
        if (eventSearch) {
            eventSearch.addEventListener('input', (e) => {
                this.disasterMap.disasterEvents.searchEvents(e.target.value);
            });
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearEventSearch();
            });
        }

        // ERU toggle
        const eruToggle = document.getElementById('showActiveERUs');
        if (eruToggle) {
            eruToggle.addEventListener('change', (e) => {
                this.disasterMap.eruManager.showActiveERUs = e.target.checked;
                this.disasterMap.eruManager.toggleActiveERUs();
            });
        }

        // Emergency Appeals toggle
        const appealsToggle = document.getElementById('showEmergencyAppeals');
        if (appealsToggle) {
            appealsToggle.addEventListener('change', (e) => {
                this.disasterMap.emergencyAppeals.showActiveAppeals = e.target.checked;
                this.disasterMap.emergencyAppeals.toggleActiveAppeals();
            });
        }

        // Rapid Response Personnel toggle
        const rapidResponseToggle = document.getElementById('showRapidResponse');
        if (rapidResponseToggle) {
            rapidResponseToggle.addEventListener('change', (e) => {
                this.disasterMap.rapidResponseManager.showRapidResponse = e.target.checked;
                this.disasterMap.rapidResponseManager.toggleRapidResponse();
            });
        }

        // Impact zones toggle
        const impactToggle = document.getElementById('showImpactZones');
        if (impactToggle) {
            impactToggle.addEventListener('change', (e) => {
                this.disasterMap.showImpactZones = e.target.checked;
                this.toggleImpactZones();
            });
        }
    }

    toggleSidebar() {
        const drawer = document.getElementById('sidebarDrawer');
        console.log('toggleSidebar called, drawer found:', !!drawer);

        if (drawer) {
            drawer.classList.toggle('active');
            console.log('Drawer classes after toggle:', drawer.className);
        } else {
            console.error('❌ sidebarDrawer element not found');
        }
    }

    closeSidebar() {
        const drawer = document.getElementById('sidebarDrawer');

        if (drawer) {
            drawer.classList.remove('active');
        }
    }

    toggleMapControls() {
        const controlsPanel = document.getElementById('mapControlsPanel');
        if (controlsPanel) {
            const isHidden = controlsPanel.style.display === 'none';
            controlsPanel.style.display = isHidden ? 'block' : 'none';

            const toggleBtn = document.getElementById('mapControlsToggle');
            if (toggleBtn) {
                toggleBtn.textContent = isHidden ? 'Hide Controls' : 'Show Controls';
            }
        }
    }

    toggleSatelliteLayer() {
        // This would be implemented to switch between satellite and street view
        console.log('Toggle satellite layer');
    }

    clearEventSearch() {
        const eventSearch = document.getElementById('eventSearch');
        const clearBtn = document.getElementById('clearSearch');

        if (eventSearch) {
            eventSearch.value = '';
            this.disasterMap.disasterEvents.showAllEvents();
        }

        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    }

    toggleHealthControlsCollapse() {
        const content = document.getElementById('healthControlsContent');
        const toggleBtn = document.getElementById('toggleHealthControls');

        if (content && toggleBtn) {
            content.classList.toggle('collapsed');
            toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
        }
    }

    toggleDisasterControlsCollapse() {
        const content = document.getElementById('disasterControlsContent');
        const toggleBtn = document.getElementById('toggleDisasterControls');

        if (content && toggleBtn) {
            content.classList.toggle('collapsed');
            toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
        }
    }

    toggleMapControlsCollapse() {
        const content = document.getElementById('mapControlsContent');
        const toggleBtn = document.getElementById('toggleMapControls');

        if (content && toggleBtn) {
            content.classList.toggle('collapsed');
            toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
        }
    }

    toggleImpactZones() {
        if (this.disasterMap.showImpactZones) {
            this.disasterMap.displayImpactZones();
        } else {
            this.disasterMap.clearImpactZones();
        }
    }

    async updateImpactFacilitiesList() {
        // Always show the section
        document.getElementById('impactFacilitiesSection').style.display = 'block';

        // Load health facilities if not already loaded
        if (!this.disasterMap.healthFacilities.dataLoaded) {
            await this.disasterMap.healthFacilities.loadHealthFacilities();
        }

        // Get all RCRC health facilities
        const allFacilities = this.disasterMap.healthFacilities.healthFacilities || [];
        console.log(`📊 Updating impact facilities list - Total facilities: ${allFacilities.length}`);

        // Always find which facilities are in impact zones, regardless of impact zones visibility
        const facilitiesInImpactZones = this.disasterMap.impactZones.length > 0
            ? this.findFacilitiesInImpactZones()
            : [];

        // Filter facilities that are in impact zones
        let facilitiesToShow = facilitiesInImpactZones;

        // Then filter by selected country if specified
        const selectedCountry = document.getElementById('facilityCountryFilter')?.value;
        if (selectedCountry) {
            facilitiesToShow = facilitiesToShow.filter(f => f.country === selectedCountry);
            console.log(`📊 After country filter: ${facilitiesToShow.length} facilities in impact zones`);
        }

        console.log(`📊 Showing ${facilitiesToShow.length} facilities that are within impact zones`);
        this.displayImpactFacilities(facilitiesToShow, facilitiesInImpactZones);
    }

    findFacilitiesInImpactZones() {
        const impactZones = this.disasterMap.impactZones;
        const healthFacilities = this.disasterMap.healthFacilities.healthFacilities;

        if (!impactZones.length || !healthFacilities.length) {
            return [];
        }

        const facilitiesInImpact = [];

        healthFacilities.forEach(facility => {
            const facilityPoint = L.latLng(facility.latitude, facility.longitude);

            for (const zone of impactZones) {
                if (zone.geometry && zone.geometry.coordinates) {
                    if (this.isPointInPolygon(facilityPoint, zone.geometry.coordinates)) {
                        facilitiesInImpact.push(facility);
                        break;
                    }
                }
            }
        });

        console.log(`🏥 Found ${facilitiesInImpact.length} facilities within ${impactZones.length} impact zones`);
        return facilitiesInImpact;
    }

    isPointInPolygon(point, coordinates) {
        // Handle GeoJSON polygon structure
        let polygonCoords = coordinates;

        // If it's a Polygon, coordinates[0] is the outer ring
        if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
            polygonCoords = coordinates[0];
        }

        let inside = false;
        const x = point.lng;
        const y = point.lat;

        for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
            const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
            const xj = polygonCoords[j][0], yj = polygonCoords[j][1];

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    displayImpactFacilities(facilities, facilitiesInImpactZones = []) {
        const facilitiesList = document.getElementById('impactFacilitiesList');

        // Show only facilities that fall within impact zones
        if (!facilities || facilities.length === 0) {
            facilitiesList.innerHTML = '<div class="no-facilities">No RCRC health facilities found within impact zones</div>';
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
                     onclick="app.zoomToFacility(${facility.latitude}, ${facility.longitude}, '${(facility.name || '').replace(/'/g, "\\'")}')">
                    <div class="facility-name">${facility.name || 'Unknown'}</div>
                    <div class="facility-district">${facility.address || facility.district || facility.country || 'Unknown location'}</div>
                    <div class="facility-functionality ${this.getFunctionalityClass(facility.functionality)}">
                        ${facility.functionality || 'Unknown functionality'}
                    </div>
                    ${isInImpactZone ? '<div class="impact-indicator">⚠️ In Impact Zone</div>' : ''}
                </div>
            `;
        }).join('');

        facilitiesList.innerHTML = facilitiesHtml;

        // Initialize country filter if not already done
        this.initImpactFacilitiesCountryFilter();
    }

    initImpactFacilitiesCountryFilter() {
        const countrySelect = document.getElementById('facilityCountryFilter');
        if (!countrySelect) return;

        // Only initialize if it hasn't been populated yet
        if (countrySelect.options.length > 1) return;

        const healthFacilities = this.disasterMap.healthFacilities.healthFacilities || [];

        // Get unique countries from health facilities
        const countries = [...new Set(healthFacilities.map(facility => facility.country))].sort();

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });

        // Add change event listener
        countrySelect.addEventListener('change', () => {
            this.updateImpactFacilitiesList();
        });

        console.log(`🌍 Country filter initialized with ${countries.length} countries`);
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
}