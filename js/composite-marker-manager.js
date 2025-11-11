// Composite Marker Manager - Handles overlapping markers from different categories
export class CompositeMarkerManager {
    constructor(map) {
        this.map = map;
        this.compositeMarkers = [];
        this.locationData = new Map(); // Key: "lat,lng", Value: { eru: [], personnel: [], ... }
    }

    /**
     * Clear all composite markers and location data
     */
    clear() {
        this.compositeMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.compositeMarkers = [];
        this.locationData.clear();
    }

    /**
     * Add data for a category at a specific location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} category - Category name (e.g., 'eru', 'personnel')
     * @param {object} data - The data object for this item
     */
    addLocationData(lat, lng, category, data) {
        const key = this.getLocationKey(lat, lng);

        if (!this.locationData.has(key)) {
            this.locationData.set(key, {
                lat,
                lng,
                categories: {}
            });
        }

        const location = this.locationData.get(key);
        if (!location.categories[category]) {
            location.categories[category] = [];
        }

        location.categories[category].push(data);
    }

    /**
     * Generate a location key with precision to group nearby markers
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {string} Location key
     */
    getLocationKey(lat, lng) {
        // Use 3 decimal places (~111m precision) to group very close markers
        return `${lat.toFixed(3)},${lng.toFixed(3)}`;
    }

    /**
     * Create and display all composite markers based on collected data
     */
    renderCompositeMarkers() {
        // Clear only the markers, not the location data
        this.compositeMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.compositeMarkers = [];

        console.log(`📊 Location data has ${this.locationData.size} locations`);

        this.locationData.forEach((location, key) => {
            const categories = Object.keys(location.categories);
            console.log(`📍 Location ${key} has categories:`, categories);

            if (categories.length === 0) return;

            // Create composite marker (it adds itself to the map)
            const marker = this.createCompositeMarker(location);
            if (marker) {
                this.compositeMarkers.push(marker);
            }
        });

        console.log(`✅ Created ${this.compositeMarkers.length} composite markers`);
    }

    /**
     * Create a composite marker for a location with multiple categories
     * @param {object} location - Location object with categories data
     * @returns {L.Marker} Leaflet marker
     */
    createCompositeMarker(location) {
        const { lat, lng, categories } = location;
        const categoryKeys = Object.keys(categories);

        // If only one category with one item, use simple marker
        if (categoryKeys.length === 1 && categories[categoryKeys[0]].length === 1) {
            return this.createSingleMarker(lat, lng, categoryKeys[0], categories[categoryKeys[0]][0]);
        }

        // Create composite marker with clickable badges
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '',
                className: 'composite-marker-icon',
                iconSize: [60, 28],
                iconAnchor: [30, 14]
            })
        });

        // Add the marker to the map first so we can attach click handlers
        marker.addTo(this.map);

        // Create the icon HTML with clickable badges
        const iconHtml = this.createClickableBadges(marker, categories);
        marker.getElement().querySelector('.composite-marker-icon').innerHTML = iconHtml;

        // Attach click handlers to each badge
        this.attachBadgeClickHandlers(marker, categories);

        return marker;
    }

    /**
     * Create a simple single-category marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} category - Category name
     * @param {object} data - Item data
     * @returns {L.Marker} Leaflet marker
     */
    createSingleMarker(lat, lng, category, data) {
        let icon, popupContent;

        if (category === 'eru') {
            icon = this.createERUIcon();
            popupContent = this.createCategoryPopup('eru', [data]);
        } else if (category === 'personnel') {
            icon = this.createPersonnelIcon();
            popupContent = this.createCategoryPopup('personnel', [data]);
        } else {
            return null;
        }

        return L.marker([lat, lng], { icon })
            .bindPopup(popupContent, {
                maxWidth: 500,
                minWidth: 350,
                maxHeight: 450,
                className: 'composite-popup'
            });
    }

    /**
     * Create clickable badges for composite marker
     * @param {L.Marker} marker - The Leaflet marker
     * @param {object} categories - Object with category arrays
     * @returns {string} HTML string for badges
     */
    createClickableBadges(marker, categories) {
        const eruCount = categories.eru ? categories.eru.length : 0;
        const personnelCount = categories.personnel ? categories.personnel.length : 0;

        let badges = '';

        if (eruCount > 0) {
            badges += `<span class="count-badge eru-badge" data-category="eru">✚ ${eruCount}</span>`;
        }

        if (personnelCount > 0) {
            badges += `<span class="count-badge personnel-badge" data-category="personnel">👤 ${personnelCount}</span>`;
        }

        return `<div class="composite-marker-compact">${badges}</div>`;
    }

    /**
     * Attach click handlers to each badge
     * @param {L.Marker} marker - The Leaflet marker
     * @param {object} categories - Object with category arrays
     */
    attachBadgeClickHandlers(marker, categories) {
        const markerElement = marker.getElement();

        // Find all badges
        const badges = markerElement.querySelectorAll('.count-badge');

        badges.forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling

                const category = badge.getAttribute('data-category');
                const popupContent = this.createCategoryPopup(category, categories[category]);

                // Create and open popup
                const popup = L.popup({
                    maxWidth: 500,
                    minWidth: 350,
                    maxHeight: 450,
                    className: 'composite-popup'
                })
                .setLatLng(marker.getLatLng())
                .setContent(popupContent)
                .openOn(this.map);
            });
        });
    }

    /**
     * Create popup content for a specific category
     * @param {string} category - Category name ('eru' or 'personnel')
     * @param {Array} items - Array of items for this category
     * @returns {string} HTML string for popup
     */
    createCategoryPopup(category, items) {
        let content = '<div class="composite-popup-content">';

        if (category === 'eru') {
            content += `<div class="popup-header">Emergency Response Units <span class="popup-total">(${items.length})</span></div>`;
            content += '<div class="popup-scroll-container">';

            items.forEach((eru) => {
                const startDate = this.formatDate(eru.start_date);
                content += `
                    <div class="popup-item eru-item">
                        <div class="popup-item-title">${eru.eru_types}</div>
                        <div class="popup-item-detail"><strong>Country:</strong> ${eru.country_deployment}</div>
                        <div class="popup-item-detail"><strong>Deploying Society:</strong> ${eru.deploying_society}</div>
                        <div class="popup-item-detail"><strong>Start Date:</strong> ${startDate}</div>
                        <div class="popup-item-detail"><strong>Event:</strong> ${eru.event_name}</div>
                    </div>
                `;
            });
        } else if (category === 'personnel') {
            content += `<div class="popup-header">Deployed Personnel <span class="popup-total">(${items.length})</span></div>`;
            content += '<div class="popup-scroll-container">';

            items.forEach((person) => {
                const startDate = this.formatDate(person.startDate);
                const endDate = person.endDate ? this.formatDate(person.endDate) : 'Ongoing';
                content += `
                    <div class="popup-item personnel-item">
                        <div class="popup-item-title">${person.jobTitle}</div>
                        <div class="popup-item-detail"><strong>Crisis:</strong> ${person.crisis}</div>
                        <div class="popup-item-detail"><strong>Deploying Society:</strong> ${person.deployingNationalSociety}</div>
                        <div class="popup-item-detail"><strong>Deployed To:</strong> ${person.deployedToCountry}</div>
                        <div class="popup-item-detail"><strong>Period:</strong> ${startDate} - ${endDate}</div>
                    </div>
                `;
            });
        }

        content += '</div></div>';
        return content;
    }

    /**
     * Create ERU icon (for single ERU markers)
     */
    createERUIcon() {
        return L.divIcon({
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
    }

    /**
     * Create Personnel icon (for single personnel markers)
     */
    createPersonnelIcon() {
        return L.divIcon({
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
    }

    /**
     * Create popup list for composite markers (replaces tooltip)
     */
    createPopupList(categories) {
        const eruCount = categories.eru ? categories.eru.length : 0;
        const personnelCount = categories.personnel ? categories.personnel.length : 0;
        const totalCount = eruCount + personnelCount;

        let content = '<div class="composite-popup-content">';
        content += `<div class="popup-header">Location Details <span class="popup-total">(${totalCount} items)</span></div>`;
        content += '<div class="popup-scroll-container">';

        if (categories.eru && categories.eru.length > 0) {
            content += '<div class="popup-section">';
            content += `<div class="popup-category-header eru-header">
                <span class="category-icon">✚</span> Emergency Response Units (${categories.eru.length})
            </div>`;

            categories.eru.forEach((eru, index) => {
                const startDate = this.formatDate(eru.start_date);
                content += `
                    <div class="popup-item eru-item">
                        <div class="popup-item-title">${eru.eru_types}</div>
                        <div class="popup-item-detail"><strong>Country:</strong> ${eru.country_deployment}</div>
                        <div class="popup-item-detail"><strong>Deploying Society:</strong> ${eru.deploying_society}</div>
                        <div class="popup-item-detail"><strong>Start Date:</strong> ${startDate}</div>
                        <div class="popup-item-detail"><strong>Event:</strong> ${eru.event_name}</div>
                    </div>
                `;
            });
            content += '</div>';
        }

        if (categories.personnel && categories.personnel.length > 0) {
            content += '<div class="popup-section">';
            content += `<div class="popup-category-header personnel-header">
                <span class="category-icon">👤</span> Deployed Personnel (${categories.personnel.length})
            </div>`;

            categories.personnel.forEach((person, index) => {
                const startDate = this.formatDate(person.startDate);
                const endDate = person.endDate ? this.formatDate(person.endDate) : 'Ongoing';
                content += `
                    <div class="popup-item personnel-item">
                        <div class="popup-item-title">${person.jobTitle}</div>
                        <div class="popup-item-detail"><strong>Crisis:</strong> ${person.crisis}</div>
                        <div class="popup-item-detail"><strong>Deploying Society:</strong> ${person.deployingNationalSociety}</div>
                        <div class="popup-item-detail"><strong>Deployed To:</strong> ${person.deployedToCountry}</div>
                        <div class="popup-item-detail"><strong>Period:</strong> ${startDate} - ${endDate}</div>
                    </div>
                `;
            });
            content += '</div>';
        }

        content += '</div>'; // close scroll-container
        content += '</div>'; // close popup-content
        return content;
    }

    /**
     * Create ERU tooltip (single item)
     */
    createERUTooltip(eru) {
        return `<div class="eru-tooltip">${this.createERUTooltipContent(eru)}</div>`;
    }

    /**
     * Create ERU tooltip content (reusable)
     */
    createERUTooltipContent(eru) {
        const startDate = this.formatDate(eru.start_date);
        return `
            <strong>Emergency Response Unit</strong><br>
            <strong>Country:</strong> ${eru.country_deployment}<br>
            <strong>Deploying Society:</strong> ${eru.deploying_society}<br>
            <strong>ERU Type:</strong> ${eru.eru_types}<br>
            <strong>Start Date:</strong> ${startDate}<br>
            <strong>Event:</strong> ${eru.event_name}
        `;
    }

    /**
     * Create Personnel tooltip (single item)
     */
    createPersonnelTooltip(person) {
        return `<div class="personnel-tooltip">${this.createPersonnelTooltipContent(person)}</div>`;
    }

    /**
     * Create Personnel tooltip content (reusable)
     */
    createPersonnelTooltipContent(person) {
        const startDate = this.formatDate(person.startDate);
        const endDate = person.endDate ? this.formatDate(person.endDate) : 'Ongoing';
        return `
            <div class="tooltip-header">${person.jobTitle}</div>
            <div><strong>Crisis:</strong> ${person.crisis}</div>
            <div><strong>Deploying Society:</strong> ${person.deployingNationalSociety}</div>
            <div><strong>Deployed To:</strong> ${person.deployedToCountry}</div>
            <div><strong>Start Date:</strong> ${startDate}</div>
            <div><strong>End Date:</strong> ${endDate}</div>
        `;
    }

    /**
     * Format date string
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
}
