const axios = require('axios');

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
        console.log('Fetching health facilities from IFRC public local units API');
        
        const { limit = 100, offset = 0, country = '' } = req.query;
        
        // IFRC public local units API endpoint
        let url = `https://goadmin.ifrc.org/api/v2/public/local_units/?limit=${limit}&offset=${offset}`;
        
        // Add country filter if provided
        if (country) {
            url += `&country=${country}`;
        }
        
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'DisasterMapApp/1.0',
                'Accept': 'application/json'
            }
        });
        
        const data = response.data;
        const localUnits = data.results || [];
        
        console.log(`Retrieved ${localUnits.length} local units from IFRC API`);
        
        // Transform IFRC local units to health facilities format
        const facilities = localUnits.map((unit, index) => {
            // Map local unit types to our facility categories
            const facilityType = mapLocalUnitType(unit.type_name || unit.type || 'Other');
            
            // Determine functionality based on available data
            const functionality = determineFunctionality(unit);
            
            return {
                id: `ifrc_${unit.id || index}`,
                name: unit.name || 'Unnamed Local Unit',
                type: facilityType,
                country: unit.country_name || unit.country || 'Unknown',
                district: unit.district_name || unit.district || unit.city || unit.address,
                latitude: parseFloat(unit.latitude) || 0,
                longitude: parseFloat(unit.longitude) || 0,
                functionality: functionality,
                speciality: unit.type_name || unit.type || 'General Services',
                source: 'IFRC Local Units',
                original_type: unit.type_name || unit.type
            };
        }).filter(facility => facility.latitude !== 0 && facility.longitude !== 0); // Only include facilities with valid coordinates
        
        console.log(`Transformed ${facilities.length} facilities with valid coordinates`);
        
        res.status(200).json({
            success: true,
            count: facilities.length,
            total: data.count || facilities.length,
            facilities: facilities
        });
        
    } catch (error) {
        console.error('Error fetching health facilities from IFRC:', error.message);
        
        // Return sample data as fallback
        const sampleFacilities = getSampleFacilities();
        
        res.status(200).json({
            success: true,
            count: sampleFacilities.length,
            facilities: sampleFacilities,
            note: 'Using sample data - IFRC API temporarily unavailable',
            error: error.message
        });
    }
};

// Helper function to map IFRC local unit types to our facility categories
function mapLocalUnitType(type) {
    if (!type) return 'Other';
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('hospital') || typeLower.includes('clinic')) {
        return 'Hospitals';
    } else if (typeLower.includes('ambulance') || typeLower.includes('emergency')) {
        return 'Ambulance Stations';
    } else if (typeLower.includes('blood') || typeLower.includes('transfusion')) {
        return 'Blood Centres';
    } else if (typeLower.includes('pharmacy') || typeLower.includes('medicine')) {
        return 'Pharmacies';
    } else if (typeLower.includes('training') || typeLower.includes('education')) {
        return 'Training Facilities';
    } else if (typeLower.includes('specialized') || typeLower.includes('specialist')) {
        return 'Specialized Services';
    } else if (typeLower.includes('residential') || typeLower.includes('care home')) {
        return 'Residential Facilities';
    } else if (typeLower.includes('health') || typeLower.includes('primary care')) {
        return 'Primary Health Care Centres';
    } else {
        return 'Other';
    }
}

// Helper function to determine functionality status
function determineFunctionality(unit) {
    // Check if there are any status indicators in the data
    if (unit.status) {
        const status = unit.status.toLowerCase();
        if (status.includes('active') || status.includes('operational')) {
            return 'Fully Functional';
        } else if (status.includes('limited') || status.includes('partial')) {
            return 'Partially Functional';
        } else if (status.includes('closed') || status.includes('inactive')) {
            return 'Not Functional';
        }
    }
    
    // Default to functional if no status information
    return 'Fully Functional';
}

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