// Main entry point for the modularized application
import { DisasterMap } from './disaster-map.js';

// Global app instance
let app;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Disaster Map Application...');

    try {
        app = new DisasterMap();

        // Make app globally available for onclick handlers in HTML
        window.app = app;

        console.log('✅ Disaster Map Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Disaster Map Application:', error);
    }
});