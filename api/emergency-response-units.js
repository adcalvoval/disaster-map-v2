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
        const { limit = 1000, offset = 0 } = req.query;

        console.log(`Fetching Emergency Response Units from IFRC API...`);
        console.log(`IFRC API Token configured: ${IFRC_GO_API_TOKEN ? 'YES' : 'NO'}`);
        console.log(`IFRC API Base URL: ${IFRC_GO_API_BASE_URL}`);

        if (!IFRC_GO_API_TOKEN) {
            throw new Error('IFRC API token not configured');
        }

        const headers = {
            'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
            'Content-Type': 'application/json'
        };

        const url = `${IFRC_GO_API_BASE_URL}/deployed_eru_by_event/?limit=${limit}&offset=${offset}`;
        console.log(`Fetching ERUs from: ${url}`);

        const response = await axios.get(url, { headers, timeout: 30000 });
        const apiData = response.data;

        if (apiData && apiData.results) {
            console.log(`Retrieved ${apiData.results.length} ERUs from IFRC API`);
            console.log(`Total available in API: ${apiData.count || 'unknown'}`);

            const transformedERUs = apiData.results
                .filter(eru => {
                    // Filter for active ERUs with valid coordinates
                    const hasValidCoords = eru.deployed_to &&
                                         eru.deployed_to.centroid &&
                                         eru.deployed_to.centroid.coordinates &&
                                         eru.deployed_to.centroid.coordinates.length === 2;

                    const isActive = !eru.end_date; // Active if no end date

                    if (!hasValidCoords) {
                        console.log(`Filtered out ERU ${eru.id}: invalid coordinates`);
                    }
                    if (!isActive) {
                        console.log(`Filtered out ERU ${eru.id}: has end date ${eru.end_date}`);
                    }

                    return hasValidCoords && isActive;
                })
                .map(eru => {
                    const coords = eru.deployed_to.centroid.coordinates;

                    return {
                        id: eru.id,
                        country_deployment: eru.deployed_to.name || 'Unknown',
                        country_deployment_iso3: eru.deployed_to.iso3,
                        deploying_society: eru.national_society_country_details?.society_name || 'Unknown',
                        eru_types: eru.type_display || 'Unknown',
                        start_date: eru.start_date,
                        end_date: eru.end_date,
                        latitude: coords[1], // GeoJSON is [lng, lat]
                        longitude: coords[0],
                        event_name: eru.event?.name || 'Unknown Event',
                        event_id: eru.event?.id,
                        api_source: true
                    };
                });

            console.log(`Returning ${transformedERUs.length} active ERUs (filtered from ${apiData.results.length})`);

            return res.status(200).json({
                success: true,
                count: transformedERUs.length,
                total: apiData.count || transformedERUs.length,
                erus: transformedERUs,
                source: 'IFRC API',
                pagination: {
                    has_next: !!apiData.next,
                    has_previous: !!apiData.previous
                }
            });
        }

    } catch (error) {
        console.error('Error loading Emergency Response Units:', error.message);
        console.error('API Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url
        });

        // Return sample data as fallback
        const sampleERUs = getSampleERUs();

        res.status(200).json({
            success: true,
            count: sampleERUs.length,
            total: sampleERUs.length,
            erus: sampleERUs,
            note: 'Using sample data - IFRC API temporarily unavailable',
            error: error.message
        });
    }
};

// Fallback sample ERU data
function getSampleERUs() {
    return [
        {
            id: 'sample_eru_1',
            country_deployment: 'Bangladesh',
            country_deployment_iso3: 'BGD',
            deploying_society: 'German Red Cross',
            eru_types: 'Emergency Health',
            start_date: '2024-08-15T00:00:00Z',
            end_date: null,
            latitude: 23.6850,
            longitude: 90.3563,
            event_name: 'Bangladesh Floods 2024',
            event_id: 'sample_event_1',
            api_source: false
        },
        {
            id: 'sample_eru_2',
            country_deployment: 'Turkey',
            country_deployment_iso3: 'TUR',
            deploying_society: 'Finnish Red Cross',
            eru_types: 'Base Camp',
            start_date: '2024-07-20T00:00:00Z',
            end_date: null,
            latitude: 39.9334,
            longitude: 32.8597,
            event_name: 'Turkey Earthquake Response',
            event_id: 'sample_event_2',
            api_source: false
        },
        {
            id: 'sample_eru_3',
            country_deployment: 'Philippines',
            country_deployment_iso3: 'PHL',
            deploying_society: 'Japanese Red Cross',
            eru_types: 'WASH M15',
            start_date: '2024-09-01T00:00:00Z',
            end_date: null,
            latitude: 14.5995,
            longitude: 120.9842,
            event_name: 'Typhoon Response Philippines',
            event_id: 'sample_event_3',
            api_source: false
        }
    ];
}