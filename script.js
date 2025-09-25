// Legacy compatibility file - now using modularized code
// The original 31k+ line script has been broken into modules in the js/ directory

console.warn('⚠️ script.js is deprecated. The application now uses ES6 modules in the js/ directory.');
console.log('📁 Module structure:');
console.log('  - js/main.js (entry point)');
console.log('  - js/disaster-map.js (main coordinator)');
console.log('  - js/map-manager.js (map initialization)');
console.log('  - js/disaster-events.js (GDACS disaster data)');
console.log('  - js/health-facilities.js (RCRC health facilities)');
console.log('  - js/eru-manager.js (Emergency Response Units)');
console.log('  - js/ui-controls.js (UI event handlers)');
console.log('  - js/utils.js (helper functions)');

// If you need the original script.js, it has been backed up as script.js.backup