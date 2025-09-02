module.exports = (req, res) => {
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
        res.status(200).json({
            success: true,
            message: 'API is working!',
            method: req.method,
            url: req.url,
            timestamp: new Date().toISOString(),
            env_check: {
                has_ifrc_token: !!process.env.IFRC_GO_API_TOKEN,
                ifrc_base_url: process.env.IFRC_GO_API_BASE_URL
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};