const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

// Population estimator class (simplified version)
class PopulationEstimator {
    constructor() {
        this.populationDensityData = {
            'asia-high': 500,
            'europe-high': 300,
            'africa-high': 400,
            'asia-medium': 150,
            'europe-medium': 100,
            'africa-medium': 80,
            'americas-medium': 50,
            'asia-low': 30,
            'europe-low': 20,
            'africa-low': 15,
            'americas-low': 5,
            'oceania-low': 3,
        };
    }

    estimatePopulation(latitude, longitude, radius = 10) {
        // Simplified population estimation
        let density = 30; // Default
        
        if (Math.abs(latitude) < 30) {
            if (longitude > 60 && longitude < 150) density = 150; // Asia
            else if (longitude > -10 && longitude < 50) density = 80; // Africa
            else density = 50; // Americas
        } else {
            if (longitude > -30 && longitude < 60) density = 100; // Europe
            else if (longitude > 60) density = 30; // North Asia
            else density = 5; // North America
        }

        const area = Math.PI * Math.pow(radius, 2);
        const population = Math.round(area * density);
        
        return {
            estimatedPopulation: population,
            density: density,
            area: area,
            method: 'regional_density_estimation'
        };
    }
}

async function fetchGDACSRSSData() {
    try {
        console.log('Fetching RSS data from: https://www.gdacs.org/xml/rss.xml');
        const response = await axios.get('https://www.gdacs.org/xml/rss.xml', {
            timeout: 15000,
            headers: {
                'User-Agent': 'DisasterMapApp/1.0'
            }
        });

        const result = await parser.parseStringPromise(response.data);
        const items = result.rss?.channel?.[0]?.item || [];
        
        console.log(`Processing ${items.length} RSS items`);
        
        const events = [];
        const populationEstimator = new PopulationEstimator();
        
        items.forEach((item, index) => {
            try {
                const title = item.title?.[0] || 'Unknown Event';
                const description = item.description?.[0] || '';
                const link = item.link?.[0] || '';
                const pubDate = item.pubDate?.[0] || '';
                
                // Extract coordinates from georss:point
                const geoPoint = item['georss:point']?.[0];
                if (!geoPoint) return;
                
                const [latStr, lonStr] = geoPoint.split(' ');
                const latitude = parseFloat(latStr);
                const longitude = parseFloat(lonStr);
                
                if (isNaN(latitude) || isNaN(longitude)) return;
                
                // Determine alert level and type from title and description
                let alertLevel = 'GREEN';
                let type = 'Other';
                
                const titleLower = title.toLowerCase();
                const descriptionLower = description.toLowerCase();
                const fullText = (titleLower + ' ' + descriptionLower);
                
                // More comprehensive alert level detection - prioritize explicit alert levels
                if (fullText.includes('red alert') || fullText.includes('red earthquake alert') || 
                    titleLower.includes('red ') || fullText.includes('severity: red') || 
                    fullText.includes('alert level: red')) {
                    alertLevel = 'RED';
                } else if (fullText.includes('orange alert') || fullText.includes('orange earthquake alert') || 
                          titleLower.includes('orange ') || fullText.includes('severity: orange') || 
                          fullText.includes('alert level: orange')) {
                    alertLevel = 'ORANGE';
                } else if (fullText.includes('green alert') || fullText.includes('green earthquake alert') || 
                          titleLower.includes('green ') || fullText.includes('severity: green') || 
                          fullText.includes('alert level: green')) {
                    alertLevel = 'GREEN';
                } else {
                    // Only use magnitude-based classification if no explicit alert level is mentioned
                    if (fullText.includes('magnitude 6') || fullText.includes('magnitude 7') || 
                        fullText.includes('magnitude 8') || fullText.includes('magnitude 9')) {
                        alertLevel = 'RED';
                    } else if (fullText.includes('magnitude 5.') || fullText.includes('magnitude 5,')) {
                        alertLevel = 'ORANGE';
                    }
                }
                
                if (titleLower.includes('earthquake')) type = 'Earthquake';
                else if (titleLower.includes('flood')) type = 'Flood';
                else if (titleLower.includes('cyclone') || titleLower.includes('hurricane') || titleLower.includes('typhoon')) type = 'Cyclone';
                else if (titleLower.includes('fire')) type = 'Wildfire';
                else if (titleLower.includes('volcano')) type = 'Volcanic Activity';
                
                // Extract magnitude for earthquakes
                let magnitude = null;
                if (type === 'Earthquake') {
                    const magnitudeMatch = fullText.match(/magnitude\s*(\d+\.?\d*)/i);
                    if (magnitudeMatch) {
                        magnitude = parseFloat(magnitudeMatch[1]);
                    }
                }
                
                // Estimate population
                const radiusKm = type === 'Earthquake' ? 10 : (type === 'Cyclone' ? 75 : 20);
                const populationData = populationEstimator.estimatePopulation(latitude, longitude, radiusKm);
                
                const event = {
                    id: `gdacs_${index}`,
                    title: title,
                    type: type,
                    alertLevel: alertLevel,
                    latitude: latitude,
                    longitude: longitude,
                    magnitude: magnitude,
                    date: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    description: description,
                    source: 'GDACS-RSS',
                    link: link,
                    affectedRadius: radiusKm,
                    affectedPopulation: populationData.estimatedPopulation,
                    impactDescription: `${Math.round(populationData.estimatedPopulation / 1000)}K people affected`,
                    estimatedRadius: radiusKm,
                    populationData: populationData
                };
                
                events.push(event);
                console.log(`Parsed event: ${alertLevel} ${type} - ${title} at ${latitude}, ${longitude}`);
                
            } catch (error) {
                console.error(`Error parsing RSS item ${index}:`, error.message);
            }
        });
        
        // Log alert level distribution
        const alertStats = events.reduce((stats, event) => {
            stats[event.alertLevel] = (stats[event.alertLevel] || 0) + 1;
            return stats;
        }, {});
        
        console.log(`Alert level distribution: RED: ${alertStats.RED || 0}, ORANGE: ${alertStats.ORANGE || 0}, GREEN: ${alertStats.GREEN || 0}`);
        
        return events;
    } catch (error) {
        console.error('Error fetching GDACS RSS data:', error.message);
        throw error;
    }
}

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
        const { source = 'ALL', alertLevel = '', from = '', to = '' } = req.query;
        
        console.log('Fetching disasters with params:', { source, alertLevel, from, to });
        
        // Fetch events from RSS (since we removed the problematic APIs)
        const events = await fetchGDACSRSSData();
        
        // Filter by alert level if specified
        let filteredEvents = events;
        if (alertLevel) {
            filteredEvents = events.filter(event => 
                event.alertLevel.toUpperCase() === alertLevel.toUpperCase()
            );
        }
        
        // Filter by date range if specified
        if (from || to) {
            filteredEvents = filteredEvents.filter(event => {
                const eventDate = new Date(event.date);
                const fromDate = from ? new Date(from) : new Date('2000-01-01');
                const toDate = to ? new Date(to) : new Date('2099-12-31');
                return eventDate >= fromDate && eventDate <= toDate;
            });
        }
        
        res.status(200).json({
            success: true,
            count: filteredEvents.length,
            events: filteredEvents,
            source: 'GDACS-RSS'
        });
        
    } catch (error) {
        console.error('Error in disasters API:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            events: []
        });
    }
};