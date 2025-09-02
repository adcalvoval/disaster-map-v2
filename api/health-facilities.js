const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        console.log('Loading health facilities from local JSON file');
        
        const { limit = 1000, offset = 0, country = '', functionality = '' } = req.query;
        
        // Load the health facilities data from JSON file
        const dataPath = path.join(process.cwd(), 'health-facilities-data.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        const allFacilities = JSON.parse(jsonData);
        
        console.log(`Loaded ${allFacilities.length} health facilities from JSON file`);
        
        // Apply filters
        let filteredFacilities = allFacilities;
        
        // Filter by country if specified
        if (country) {
            filteredFacilities = filteredFacilities.filter(facility => 
                facility.country && facility.country.toLowerCase().includes(country.toLowerCase())
            );
        }
        
        // Filter by functionality if specified
        if (functionality) {
            filteredFacilities = filteredFacilities.filter(facility => 
                facility.functionality && facility.functionality.toLowerCase().includes(functionality.toLowerCase())
            );
        }
        
        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || 1000;
        const paginatedFacilities = filteredFacilities.slice(startIndex, startIndex + limitNum);
        
        console.log(`Returning ${paginatedFacilities.length} facilities (filtered: ${filteredFacilities.length}, total: ${allFacilities.length})`);
        
        res.status(200).json({
            success: true,
            count: paginatedFacilities.length,
            total: filteredFacilities.length,
            totalUnfiltered: allFacilities.length,
            facilities: paginatedFacilities,
            source: 'Health Facilities JSON File'
        });
        
    } catch (error) {
        console.error('Error loading health facilities from JSON file:', error.message);
        
        // Return sample data as fallback
        const sampleFacilities = getSampleFacilities();
        
        res.status(200).json({
            success: true,
            count: sampleFacilities.length,
            total: sampleFacilities.length,
            facilities: sampleFacilities,
            note: 'Using sample data - JSON file not available',
            error: error.message
        });
    }
};


// Fallback sample data
function getSampleFacilities() {
    return [
        {
            id: 'sample_1',
            name: 'Central Hospital Dhaka',
            type: 'Hospitals',
            country: 'Bangladesh',
            district: 'Dhaka',
            latitude: 23.7275,
            longitude: 90.4125,
            functionality: 'Fully Functional',
            speciality: 'Emergency Care'
        },
        {
            id: 'sample_2', 
            name: 'Community Health Center Chittagong',
            type: 'Primary Health Care Centres',
            country: 'Bangladesh',
            district: 'Chittagong',
            latitude: 22.3569,
            longitude: 91.7832,
            functionality: 'Partially Functional',
            speciality: 'Primary Care'
        },
        {
            id: 'sample_3',
            name: 'Emergency Ambulance Station Cox\'s Bazar',
            type: 'Ambulance Stations',
            country: 'Bangladesh', 
            district: 'Cox\'s Bazar',
            latitude: 21.4272,
            longitude: 92.0058,
            functionality: 'Fully Functional',
            speciality: 'Emergency Response'
        },
        {
            id: 'sample_4',
            name: 'Blood Bank Sylhet',
            type: 'Blood Centres',
            country: 'Bangladesh',
            district: 'Sylhet', 
            latitude: 24.8949,
            longitude: 91.8687,
            functionality: 'Not Functional',
            speciality: 'Blood Services'
        },
        {
            id: 'sample_5',
            name: 'Istanbul University Hospital',
            type: 'Hospitals',
            country: 'Turkey',
            district: 'Istanbul',
            latitude: 41.0082,
            longitude: 28.9784,
            functionality: 'Fully Functional',
            speciality: 'Trauma Center'
        }
    ];
}