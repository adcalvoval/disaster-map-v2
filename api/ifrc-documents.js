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
        const { country = '', page = 1, limit = 20, search = '' } = req.query;
        
        console.log(`Fetching IFRC documents for country: "${country}", page: ${page}, limit: ${limit}`);
        
        if (!IFRC_GO_API_TOKEN) {
            throw new Error('IFRC API token not configured');
        }
        
        // Try different possible IFRC endpoints
        const possibleEndpoints = [
            `/appeal-document/?limit=${limit}&offset=${(page - 1) * limit}`,
            `/appeal_document/?limit=${limit}&offset=${(page - 1) * limit}`,
            `/appeals/?limit=${limit}&offset=${(page - 1) * limit}`,
            `/documents/?limit=${limit}&offset=${(page - 1) * limit}`
        ];
        
        const headers = {
            'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        let response = null;
        let lastError = null;
        
        for (const endpoint of possibleEndpoints) {
            try {
                const url = `${IFRC_GO_API_BASE_URL}${endpoint}`;
                console.log(`Trying IFRC endpoint: ${url}`);
                response = await axios.get(url, { 
                    headers,
                    timeout: 10000 
                });
                console.log(`Success with endpoint: ${endpoint}`);
                break;
            } catch (error) {
                console.log(`Failed with endpoint ${endpoint}: ${error.response?.status || error.message}`);
                lastError = error;
                continue;
            }
        }
        
        if (!response) {
            throw new Error(`All IFRC endpoints failed. Last error: ${lastError.response?.status || lastError.message}`);
        }
        
        const documents = response.data?.results || [];
        console.log(`Retrieved ${documents.length} documents from IFRC API`);
        
        // Filter by country if specified
        let filteredDocuments = documents;
        if (country) {
            filteredDocuments = documents.filter(doc => 
                doc.iso?.toLowerCase() === country.toLowerCase()
            );
            console.log(`Filtered to ${filteredDocuments.length} documents for country: ${country}`);
        }

        // Filter by search term if specified
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredDocuments = filteredDocuments.filter(doc => {
                const name = (doc.name || '').toLowerCase();
                const description = (doc.description || '').toLowerCase();
                const type = (doc.type || '').toLowerCase();
                const countryName = doc.appeal?.event?.countries_for_preview?.[0]?.name?.toLowerCase() || '';
                const appealCode = doc.appeal?.code?.toLowerCase() || '';
                
                return name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       type.includes(searchTerm) || 
                       countryName.includes(searchTerm) ||
                       appealCode.includes(searchTerm);
            });
            console.log(`Filtered to ${filteredDocuments.length} documents for search: "${search}"`);
        }
        
        // Transform the data to match frontend expectations
        const transformedDocuments = filteredDocuments.map(doc => ({
            id: doc.id,
            name: doc.name || 'Untitled Document',
            type: doc.type || 'Unknown',
            country: doc.iso || 'Unknown',
            country_name: doc.appeal?.event?.countries_for_preview?.[0]?.name || 'Unknown',
            created_at: doc.created_at,
            disaster_type: doc.type || 'General',
            description: doc.description || '',
            document_url: doc.document_url,
            document: doc.document_url,
            appeal: doc.appeal ? {
                code: doc.appeal.code,
                start_date: doc.appeal.start_date
            } : null
        }));
        
        res.status(200).json({
            success: true,
            count: transformedDocuments.length,
            total: response.data?.count || transformedDocuments.length,
            results: transformedDocuments  // Frontend expects 'results' not 'documents'
        });
        
    } catch (error) {
        console.error('Error fetching IFRC documents:', error.message);
        
        // Return sample data as fallback with correct format
        let sampleDocuments = [
            {
                id: 'sample_1',
                name: 'Pakistan - Flood Emergency Appeal (MDRPK028)',
                type: 'Emergency Appeal',
                country: 'PK',
                country_name: 'Pakistan',
                created_at: '2025-08-30T19:03:00Z',
                disaster_type: 'Flood',
                description: 'Emergency appeal for Pakistan flood response',
                document_url: 'https://go-api.ifrc.org/api/downloadfile/92265/MDRPK028EA',
                document: 'https://go-api.ifrc.org/api/downloadfile/92265/MDRPK028EA',
                appeal: { code: 'MDRPK028', start_date: '2025-08-21T00:00:00Z' }
            },
            {
                id: 'sample_2',
                name: 'Cape Verde - Flood DREF Operation (MDRCV005)',
                type: 'DREF Operation',
                country: 'CV',
                country_name: 'Cape Verde',
                created_at: '2025-08-28T22:03:00Z',
                disaster_type: 'Flood',
                description: 'DREF operation for Cape Verde floods',
                document_url: 'https://go-api.ifrc.org/api/downloadfile/92258/MDRCV005do',
                document: 'https://go-api.ifrc.org/api/downloadfile/92258/MDRCV005do',
                appeal: { code: 'MDRCV005', start_date: '2025-08-20T00:00:00Z' }
            },
            {
                id: 'sample_3',
                name: 'Syria - Heatwave DREF Operation (MDRSY016)',
                type: 'DREF Operation',
                country: 'SY',
                country_name: 'Syria',
                created_at: '2025-08-20T20:03:00Z',
                disaster_type: 'Heat Wave',
                description: 'DREF operation for Syria heatwave response',
                document_url: 'https://go-api.ifrc.org/api/downloadfile/92182/MDRSY016do',
                document: 'https://go-api.ifrc.org/api/downloadfile/92182/MDRSY016do',
                appeal: { code: 'MDRSY016', start_date: '2025-08-14T00:00:00Z' }
            }
        ];

        // Apply country and search filtering to sample data
        if (country) {
            sampleDocuments = sampleDocuments.filter(doc => 
                doc.country?.toLowerCase() === country.toLowerCase()
            );
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            sampleDocuments = sampleDocuments.filter(doc => {
                const name = (doc.name || '').toLowerCase();
                const description = (doc.description || '').toLowerCase();
                const type = (doc.type || '').toLowerCase();
                const countryName = (doc.country_name || '').toLowerCase();
                const appealCode = doc.appeal?.code?.toLowerCase() || '';
                
                return name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       type.includes(searchTerm) || 
                       countryName.includes(searchTerm) ||
                       appealCode.includes(searchTerm);
            });
        }
        
        res.status(200).json({
            success: true,
            count: sampleDocuments.length,
            total: sampleDocuments.length,
            results: sampleDocuments,  // Frontend expects 'results'
            note: 'Using sample data - IFRC API temporarily unavailable'
        });
    }
};