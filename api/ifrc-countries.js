import axios from 'axios';

const IFRC_GO_API_TOKEN = process.env.IFRC_GO_API_TOKEN;
const IFRC_GO_API_BASE_URL = process.env.IFRC_GO_API_BASE_URL || 'https://goadmin.ifrc.org/api/v2';

export default async function handler(req, res) {
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
        console.log('Fetching IFRC countries');
        
        if (!IFRC_GO_API_TOKEN) {
            throw new Error('IFRC API token not configured');
        }
        
        const url = `${IFRC_GO_API_BASE_URL}/country/`;
        
        const headers = {
            'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url, { 
            headers,
            timeout: 10000 
        });
        
        const countries = response.data?.results || [];
        console.log(`Retrieved ${countries.length} countries from IFRC API`);
        
        // Transform to simpler format
        const transformedCountries = countries.map(country => ({
            iso: country.iso,
            iso3: country.iso3, 
            name: country.name,
            society_name: country.society_name
        })).sort((a, b) => a.name.localeCompare(b.name));
        
        res.status(200).json({
            success: true,
            count: transformedCountries.length,
            countries: transformedCountries
        });
        
    } catch (error) {
        console.error('Error fetching IFRC countries:', error.message);
        
        res.status(500).json({
            success: false,
            error: `Failed to load countries: ${error.message}`,
            countries: []
        });
    }
}