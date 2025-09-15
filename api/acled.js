// Vercel serverless function for ACLED API proxy
import axios from 'axios';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { limit = '50', disorder_type } = req.query;

        const acledUrl = 'https://acleddata.com/api/acled/read';
        const params = {
            limit,
            disorder_type: disorder_type || 'Political violence|Battles|Protests|Riots|Explosions/Remote violence|Violence against civilians'
        };

        // Use JWT token for authentication
        const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ijk4NGNlMDY2YjVlMzcxODJhZmU4MjJlZTI1OGFkYjE1NThkYzJjZThhOGY4MGNjNTk0OWY1ZmFjYzUyMzZlY2QwZjE2Nzk2NTEwNWY5Y2YxIn0.eyJhdWQiOiJhY2xlZCIsImp0aSI6Ijk4NGNlMDY2YjVlMzcxODJhZmU4MjJlZTI1OGFkYjE1NThkYzJjZThhOGY4MGNjNTk0OWY1ZmFjYzUyMzZlY2QwZjE2Nzk2NTEwNWY5Y2YxIiwiaWF0IjoxNzU3OTE5NzMwLCJuYmYiOjE3NTc5MTk3MzAsImV4cCI6MTc1ODAwNjEzMC4yMTA5Niwic2NvcGUiOlsiYXV0aGVudGljYXRlZCJdLCJzdWIiOiIxMzIwNTUifQ.e2a6Qb8RnXqMCw_68PqWFwmXyhIyzu49GB_kIWRLhkNa08wFUrhyapttXQxOf1FEe0_03t4VXNiRYG7YgMQs8joEouQFmASfdIJhf4TzWzBagWgcFp9h3J-dY8Fpvyw6f6YNQM3TNO3m9WkGH8AV2WmRz0f8xZxsXYXej4M0Mr4p2zv052KtIyvbM0EmUZ0kRcodL6Q18ZdynSryY2fu9C8LsKZ-bE44MQIxHBJmkzbzFrvy48Pr5TJSEl39H9KN2GBRdeOlg-uGtA60FVeZ9zghWDZaksd29TpeK3WWJmESGmd5HRl4H6Ri0czPb2E9wOMyV79kKDaPtonXwlJp_Q";

        console.log('Proxying ACLED API request with params:', params);

        const response = await axios.get(acledUrl, {
            params,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://acleddata.com/',
                'Origin': 'https://acleddata.com'
            }
        });

        res.status(200).json(response.data);

    } catch (error) {
        console.error('ACLED API Error:', error.message);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });

        res.status(error.response?.status || 500).json({
            success: false,
            error: 'Failed to fetch ACLED data: ' + error.message,
            details: error.response?.data,
            data: []
        });
    }
}