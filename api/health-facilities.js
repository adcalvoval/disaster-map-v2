const fs = require('fs');
const path = require('path');
const axios = require('axios');

const IFRC_GO_API_TOKEN = process.env.IFRC_GO_API_TOKEN;
const IFRC_GO_API_BASE_URL = process.env.IFRC_GO_API_BASE_URL || 'https://goadmin.ifrc.org/api/v2';

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
        const { limit = 1000, offset = 0, country = '', functionality = '' } = req.query;

        // Try to fetch from IFRC API first
        if (IFRC_GO_API_TOKEN) {
            console.log('Attempting to fetch health facilities from IFRC API...');

            try {
                const headers = {
                    'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
                    'Content-Type': 'application/json'
                };

                // Fetch from IFRC local units API
                const url = `${IFRC_GO_API_BASE_URL}/local-units/?limit=${limit}&offset=${offset}`;
                console.log(`Fetching from IFRC API: ${url}`);

                const response = await axios.get(url, { headers, timeout: 15000 });
                const apiData = response.data;

                if (apiData && apiData.results) {
                    console.log(`Retrieved ${apiData.results.length} facilities from IFRC API`);

                    // Transform API data to match frontend expectations
                    const transformedFacilities = apiData.results
                        .filter(facility => {
                            // Include facilities with "Health Care" type_details
                            return facility.type_details &&
                                   facility.type_details.name === 'Health Care' &&
                                   facility.location_geojson &&
                                   facility.location_geojson.coordinates &&
                                   facility.location_geojson.coordinates.length === 2;
                        })
                        .map(facility => {
                            const coords = facility.location_geojson.coordinates;
                            const healthType = facility.health_details?.health_facility_type_details?.name || 'Other';

                            return {
                                id: facility.id,
                                name: facility.local_branch_name || facility.english_branch_name || 'Unnamed Facility',
                                type: mapHealthFacilityType(healthType),
                                latitude: coords[1], // GeoJSON is [lng, lat]
                                longitude: coords[0],
                                country: facility.country_details?.name || 'Unknown',
                                country_iso3: facility.country_details?.iso3,
                                district: facility.address_loc || facility.address_en || '',
                                functionality: 'Fully Functional', // Default as API doesn't provide this
                                affiliation: 'Red Cross Red Crescent Facility',
                                email: facility.email || '',
                                phone: facility.phone || '',
                                focal_person: facility.focal_person_loc || facility.focal_person_en || '',
                                modified_at: facility.modified_at,
                                health_facility_type: healthType,
                                api_source: true
                            };
                        });

                    // Apply filters
                    let filteredFacilities = transformedFacilities;

                    if (country) {
                        filteredFacilities = filteredFacilities.filter(facility =>
                            facility.country && facility.country.toLowerCase().includes(country.toLowerCase())
                        );
                    }

                    if (functionality) {
                        filteredFacilities = filteredFacilities.filter(facility =>
                            facility.functionality && facility.functionality.toLowerCase().includes(functionality.toLowerCase())
                        );
                    }

                    console.log(`Returning ${filteredFacilities.length} facilities from IFRC API (filtered from ${transformedFacilities.length})`);

                    return res.status(200).json({
                        success: true,
                        count: filteredFacilities.length,
                        total: apiData.count || filteredFacilities.length,
                        facilities: filteredFacilities,
                        source: 'IFRC API',
                        pagination: {
                            has_next: !!apiData.next,
                            has_previous: !!apiData.previous
                        }
                    });
                }
            } catch (apiError) {
                console.warn('IFRC API failed, falling back to JSON file:', apiError.message);
            }
        }

        // Fallback to JSON file
        console.log('Loading health facilities from local JSON file');

        const dataPath = path.join(process.cwd(), 'health-facilities-data.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        const allFacilities = JSON.parse(jsonData);

        console.log(`Loaded ${allFacilities.length} health facilities from JSON file`);

        // Apply filters
        let filteredFacilities = allFacilities;

        if (country) {
            filteredFacilities = filteredFacilities.filter(facility =>
                facility.country && facility.country.toLowerCase().includes(country.toLowerCase())
            );
        }

        if (functionality) {
            filteredFacilities = filteredFacilities.filter(facility =>
                facility.functionality && facility.functionality.toLowerCase().includes(functionality.toLowerCase())
            );
        }

        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || 1000;
        const paginatedFacilities = filteredFacilities.slice(startIndex, startIndex + limitNum);

        console.log(`Returning ${paginatedFacilities.length} facilities from JSON (filtered: ${filteredFacilities.length}, total: ${allFacilities.length})`);

        res.status(200).json({
            success: true,
            count: paginatedFacilities.length,
            total: filteredFacilities.length,
            totalUnfiltered: allFacilities.length,
            facilities: paginatedFacilities,
            source: 'Health Facilities JSON File'
        });

    } catch (error) {
        console.error('Error loading health facilities:', error.message);

        // Return sample data as fallback
        const sampleFacilities = getSampleFacilities();

        res.status(200).json({
            success: true,
            count: sampleFacilities.length,
            total: sampleFacilities.length,
            facilities: sampleFacilities,
            note: 'Using sample data - both API and JSON file unavailable',
            error: error.message
        });
    }
};

// Map health facility types from API to frontend categories
function mapHealthFacilityType(apiType) {
    const mapping = {
        'Primary Health Care': 'Primary Health Care Centres',
        'Hospital': 'Hospitals',
        'Ambulance Station': 'Ambulance Stations',
        'Blood Centre': 'Blood Centres',
        'Pharmacy': 'Pharmacies',
        'Training Facility': 'Training Facilities',
        'Specialized Service': 'Specialized Services',
        'Residential Facility': 'Residential Facilities',
        'Other': 'Other'
    };

    return mapping[apiType] || 'Other';
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