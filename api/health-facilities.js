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
        console.log(`IFRC API Token configured: ${IFRC_GO_API_TOKEN ? 'YES' : 'NO'}`);
        console.log(`IFRC API Base URL: ${IFRC_GO_API_BASE_URL}`);

        if (IFRC_GO_API_TOKEN) {
            console.log('✅ Attempting to fetch health facilities from IFRC API...');

            try {
                const headers = {
                    'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
                    'Content-Type': 'application/json'
                };

                // Fetch from IFRC local units API with high limit to get all facilities
                const apiLimit = Math.max(limit, 10000); // Use at least 10000 to get all 5607+ facilities
                const url = `${IFRC_GO_API_BASE_URL}/local-units/?limit=${apiLimit}&offset=${offset}`;
                console.log(`Fetching from IFRC API: ${url} (requesting ${apiLimit} facilities)`);

                const response = await axios.get(url, { headers, timeout: 30000 }); // Increased timeout for larger datasets
                const apiData = response.data;

                if (apiData && apiData.results) {
                    console.log(`Retrieved ${apiData.results.length} facilities from IFRC API`);
                    console.log(`Total available in API: ${apiData.count || 'unknown'}`);
                    console.log(`Has more pages: ${!!apiData.next}`);

                    // Transform API data to match frontend expectations
                    console.log(`Processing ${apiData.results.length} facilities from IFRC API...`);

                    const transformedFacilities = apiData.results
                        .filter(facility => {
                            // Debug logging for filtering
                            const hasTypeDetails = facility.type_details && facility.type_details.name === 'Health Care';
                            const hasValidCoords = facility.location_geojson &&
                                                 facility.location_geojson.coordinates &&
                                                 facility.location_geojson.coordinates.length === 2;

                            // Log facilities that don't pass the filter
                            if (!hasTypeDetails) {
                                console.log(`Filtered out facility ${facility.id}: type_details.name = "${facility.type_details?.name}"`);
                            }
                            if (!hasValidCoords) {
                                console.log(`Filtered out facility ${facility.id}: invalid coordinates = ${JSON.stringify(facility.location_geojson?.coordinates)}`);
                            }

                            // Log facilities that pass the filter
                            if (hasTypeDetails && hasValidCoords) {
                                console.log(`Including facility ${facility.id}: ${facility.local_branch_name || facility.english_branch_name}`);
                            }

                            return hasTypeDetails && hasValidCoords;
                        })
                        .map(facility => {
                            const coords = facility.location_geojson.coordinates;
                            const healthType = facility.health_details?.health_facility_type_details?.name || 'Other';

                            // Validate coordinate ranges
                            const lat = coords[1]; // GeoJSON is [lng, lat]
                            const lng = coords[0];

                            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                                console.warn(`Invalid coordinates for facility ${facility.id}: lat=${lat}, lng=${lng}`);
                            }

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
                console.warn('❌ IFRC API failed, falling back to JSON file:', apiError.message);
                console.warn('API Error details:', {
                    status: apiError.response?.status,
                    statusText: apiError.response?.statusText,
                    url: apiError.config?.url
                });
            }
        } else {
            console.log('⚠️ IFRC API token not configured, using JSON file directly');
        }

        // Fallback to JSON file
        console.log('📁 Loading health facilities from local JSON file');

        const dataPath = path.join(process.cwd(), 'health-facilities-data.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        const allFacilities = JSON.parse(jsonData);

        console.log(`Loaded ${allFacilities.length} health facilities from JSON file`);

        // Debug: Check for specific facilities that should be there
        const targetFacilities = [28640, 28448, 28717, 28409]; // IDs from payloads
        targetFacilities.forEach(targetId => {
            const found = allFacilities.find(f => f.id === targetId);
            if (found) {
                console.log(`✅ Found target facility ${targetId}: ${found.name}`);
            } else {
                console.log(`❌ Missing target facility ${targetId} in JSON file`);
            }
        });

        // Debug: Show sample of German facilities in JSON file
        const germanFacilities = allFacilities.filter(f => f.country === 'Germany');
        console.log(`German facilities in JSON file: ${germanFacilities.length}`);
        if (germanFacilities.length > 0) {
            console.log('Sample German facilities:', germanFacilities.slice(0, 3).map(f => ({
                id: f.id,
                name: f.name,
                type: f.type
            })));
        }

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
        'Primary Health Care Center': 'Primary Health Care Centres', // Handle both variants
        'Hospital': 'Hospitals',
        'Ambulance Station': 'Ambulance Stations',
        'Blood Centre': 'Blood Centres',
        'Pharmacy': 'Pharmacies',
        'Training Facility': 'Training Facilities',
        'Specialized Service': 'Specialized Services',
        'Specialized Services': 'Specialized Services', // Handle both variants
        'Residential Facility': 'Residential Facilities',
        'Other': 'Other'
    };

    const mapped = mapping[apiType] || 'Other';
    console.log(`Mapping facility type "${apiType}" → "${mapped}"`);
    return mapped;
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