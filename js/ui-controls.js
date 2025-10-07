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
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
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

        if (drawer) {
            drawer.classList.toggle('open');
        }
    }

    closeSidebar() {
        const drawer = document.getElementById('sidebarDrawer');

        if (drawer) {
            drawer.classList.remove('open');
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
        const disasterControlsBox = document.querySelector('.disaster-controls-box');
        if (disasterControlsBox) {
            const content = disasterControlsBox.querySelector('.controls-content');
            const toggleBtn = disasterControlsBox.querySelector('.collapse-toggle');

            if (content && toggleBtn) {
                content.classList.toggle('collapsed');
                toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
            }
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

    updateImpactFacilitiesList() {
        // This would be implemented if impact facilities functionality is needed
        console.log('Update impact facilities list');
    }
}