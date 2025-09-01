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
        
        let url = `${IFRC_GO_API_BASE_URL}/appeal-document/?limit=${limit}&offset=${(page - 1) * limit}`;
        
        const headers = {
            'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
            'Content-Type': 'application/json'
        };
        
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url, { 
            headers,
            timeout: 10000 
        });
        
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
        
        res.status(500).json({
            success: false,
            error: `Failed to load IFRC documents: ${error.message}`,
            documents: []
        });
    }
};