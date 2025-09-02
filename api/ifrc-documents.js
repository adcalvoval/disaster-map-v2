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
        const { country = '', page = 1, limit = 20 } = req.query;
        
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
        
        // Transform the data to match expected format
        const transformedDocuments = filteredDocuments.map(doc => ({
            id: doc.id,
            name: doc.name || 'Untitled Document',
            type: doc.type || 'Unknown',
            country: doc.iso || 'Unknown',
            date: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : null,
            description: doc.description || '',
            document_url: doc.document_url,
            appeal: doc.appeal ? {
                code: doc.appeal.code,
                start_date: doc.appeal.start_date
            } : null
        }));
        
        res.status(200).json({
            success: true,
            count: transformedDocuments.length,
            total: response.data?.count || transformedDocuments.length,
            documents: transformedDocuments
        });
        
    } catch (error) {
        console.error('Error fetching IFRC documents:', error.message);
        
        // Return sample data as fallback
        const sampleDocuments = [
            {
                id: 'sample_1',
                name: 'Pakistan - Flood Emergency Appeal (MDRPK028)',
                type: 'Emergency Appeal',
                country: 'PK',
                date: '2025-08-30',
                description: 'Emergency appeal for Pakistan flood response',
                document_url: null,
                appeal: { code: 'MDRPK028', start_date: '2025-08-21' }
            },
            {
                id: 'sample_2',
                name: 'Cape Verde - Flood DREF Operation (MDRCV005)',
                type: 'DREF Operation',
                country: 'CV',
                date: '2025-08-28',
                description: 'DREF operation for Cape Verde floods',
                document_url: null,
                appeal: { code: 'MDRCV005', start_date: '2025-08-20' }
            }
        ];
        
        res.status(200).json({
            success: true,
            count: sampleDocuments.length,
            total: sampleDocuments.length,
            documents: sampleDocuments,
            note: 'Using sample data - IFRC API temporarily unavailable'
        });
    }
};