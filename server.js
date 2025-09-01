require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const parser = new xml2js.Parser();

class PopulationEstimator {
    constructor() {
        // Population density data for major regions (people per sq km)
        this.populationDensityData = {
            // High density regions
            'asia-high': 500,    // Bangladesh, India, China urban
            'europe-high': 300,  // Western Europe urban
            'africa-high': 400,  // Nigeria, Egypt urban
            
            // Medium density regions  
            'asia-medium': 150,  // Southeast Asia, rural China
            'europe-medium': 100, // Eastern Europe, rural areas
            'africa-medium': 80,  // Central/East Africa
            'americas-medium': 50, // US/Canada suburban
            
            // Low density regions
            'asia-low': 30,      // Mongolia, Central Asia
            'europe-low': 20,    // Scandinavia, Russia rural
            'africa-low': 15,    // Sahara, rural areas
            'americas-low': 5,   // Alaska, rural Canada/US
            'oceania-low': 3,    // Australia outback
            
            // Urban centers (major cities)
            'urban-mega': 10000,  // City centers
            'urban-major': 5000,  // Major cities
            'urban-medium': 2000, // Medium cities
        };
        
        // Major population centers for more accurate estimates
        this.populationCenters = [
            // Asia
            { name: 'Delhi', lat: 28.7, lon: 77.1, population: 30000000, radius: 50 },
            { name: 'Tokyo', lat: 35.7, lon: 139.7, population: 38000000, radius: 60 },
            { name: 'Shanghai', lat: 31.2, lon: 121.5, population: 27000000, radius: 45 },
            { name: 'Beijing', lat: 39.9, lon: 116.4, population: 21500000, radius: 40 },
            { name: 'Mumbai', lat: 19.1, lon: 72.9, population: 20400000, radius: 35 },
            { name: 'Manila', lat: 14.6, lon: 121.0, population: 13500000, radius: 30 },
            { name: 'Jakarta', lat: -6.2, lon: 106.8, population: 10800000, radius: 25 },
            { name: 'Karachi', lat: 24.9, lon: 67.0, population: 16000000, radius: 30 },
            { name: 'Dhaka', lat: 23.8, lon: 90.4, population: 9000000, radius: 20 },
            
            // Americas
            { name: 'New York', lat: 40.7, lon: -74.0, population: 8400000, radius: 25 },
            { name: 'Los Angeles', lat: 34.1, lon: -118.2, population: 4000000, radius: 30 },
            { name: 'Mexico City', lat: 19.4, lon: -99.1, population: 21800000, radius: 40 },
            { name: 'São Paulo', lat: -23.5, lon: -46.6, population: 12300000, radius: 30 },
            { name: 'Buenos Aires', lat: -34.6, lon: -58.4, population: 3000000, radius: 20 },
            
            // Europe
            { name: 'London', lat: 51.5, lon: -0.1, population: 9000000, radius: 25 },
            { name: 'Paris', lat: 48.9, lon: 2.3, population: 2200000, radius: 15 },
            { name: 'Istanbul', lat: 41.0, lon: 28.9, population: 15500000, radius: 35 },
            { name: 'Moscow', lat: 55.8, lon: 37.6, population: 12500000, radius: 30 },
            
            // Africa
            { name: 'Lagos', lat: 6.5, lon: 3.4, population: 15000000, radius: 30 },
            { name: 'Cairo', lat: 30.0, lon: 31.2, population: 20900000, radius: 35 },
            { name: 'Kinshasa', lat: -4.3, lon: 15.3, population: 14300000, radius: 25 },
        ];
    }

    // Calculate distance between two points in km
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Estimate population for a circular area around coordinates
    estimatePopulationInRadius(lat, lon, radiusKm) {
        let totalPopulation = 0;
        let density = this.getRegionalDensity(lat, lon);
        
        // Check if near major population centers
        const nearbyCenter = this.findNearestPopulationCenter(lat, lon);
        if (nearbyCenter && nearbyCenter.distance < 100) {
            // Adjust density based on proximity to major city
            const proximityFactor = Math.max(0.1, 1 - (nearbyCenter.distance / 100));
            const cityInfluence = nearbyCenter.center.population / (Math.PI * Math.pow(nearbyCenter.center.radius, 2));
            density = Math.max(density, cityInfluence * proximityFactor);
        }
        
        // Calculate population in circular area
        const areaKm2 = Math.PI * Math.pow(radiusKm, 2);
        totalPopulation = Math.round(density * areaKm2);
        
        return {
            estimatedPopulation: totalPopulation,
            density: Math.round(density),
            area: Math.round(areaKm2),
            method: 'regional_density_estimation'
        };
    }

    // Get regional population density based on coordinates
    getRegionalDensity(lat, lon) {
        // Asia
        if (lon > 60 && lon < 150 && lat > 10 && lat < 55) {
            if (lon > 70 && lon < 140 && lat > 20 && lat < 40) return this.populationDensityData['asia-high']; // China/India belt
            return this.populationDensityData['asia-medium'];
        }
        
        // Europe
        if (lon > -10 && lon < 40 && lat > 35 && lat < 70) {
            if (lon > 0 && lon < 25 && lat > 45 && lat < 60) return this.populationDensityData['europe-high']; // Western Europe
            return this.populationDensityData['europe-medium'];
        }
        
        // Africa
        if (lon > -20 && lon < 55 && lat > -35 && lat < 35) {
            if (lon > 30 && lon < 45 && lat > 25 && lat < 35) return this.populationDensityData['africa-high']; // Nile Valley
            if (lon > -5 && lon < 15 && lat > 5 && lat < 15) return this.populationDensityData['africa-high']; // West Africa coastal
            return this.populationDensityData['africa-medium'];
        }
        
        // North America
        if (lon > -170 && lon < -50 && lat > 15 && lat < 70) {
            if (lon > -125 && lon < -70 && lat > 25 && lat < 50) return this.populationDensityData['americas-medium']; // US/Canada populated
            return this.populationDensityData['americas-low'];
        }
        
        // South America
        if (lon > -85 && lon < -30 && lat > -55 && lat < 15) {
            return this.populationDensityData['americas-medium'];
        }
        
        // Australia/Oceania
        if (lon > 110 && lon < 180 && lat > -50 && lat < -10) {
            return this.populationDensityData['oceania-low'];
        }
        
        // Default low density for remote areas
        return this.populationDensityData['asia-low'];
    }

    // Find nearest major population center
    findNearestPopulationCenter(lat, lon) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const center of this.populationCenters) {
            const distance = this.calculateDistance(lat, lon, center.lat, center.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { center, distance };
            }
        }
        
        return nearest;
    }

    // Get country-level population estimate using REST Countries API
    async getCountryPopulation(lat, lon) {
        try {
            // This is a simplified approach - in production you'd use a reverse geocoding service
            const country = this.getCountryFromCoordinates(lat, lon);
            if (country) {
                const response = await axios.get(`https://restcountries.com/v3.1/name/${country}`, {
                    timeout: 5000
                });
                
                if (response.data && response.data[0] && response.data[0].population) {
                    return {
                        country: country,
                        population: response.data[0].population,
                        method: 'country_api'
                    };
                }
            }
        } catch (error) {
            console.warn('Country population lookup failed:', error.message);
        }
        
        return null;
    }

    // Simple country detection from coordinates (basic implementation)
    getCountryFromCoordinates(lat, lon) {
        const countries = [
            { name: 'China', bounds: { minLat: 15, maxLat: 54, minLon: 73, maxLon: 135 } },
            { name: 'India', bounds: { minLat: 8, maxLat: 37, minLon: 68, maxLon: 97 } },
            { name: 'United States', bounds: { minLat: 25, maxLat: 49, minLon: -125, maxLon: -66 } },
            { name: 'Indonesia', bounds: { minLat: -11, maxLat: 6, minLon: 95, maxLon: 141 } },
            { name: 'Brazil', bounds: { minLat: -34, maxLat: 5, minLon: -74, maxLon: -35 } },
            { name: 'Pakistan', bounds: { minLat: 24, maxLat: 37, minLon: 61, maxLon: 77 } },
            { name: 'Bangladesh', bounds: { minLat: 20, maxLat: 27, minLon: 88, maxLon: 93 } },
            { name: 'Nigeria', bounds: { minLat: 4, maxLat: 14, minLon: 2, maxLon: 15 } },
            { name: 'Russia', bounds: { minLat: 41, maxLat: 82, minLon: 19, maxLon: 169 } },
            { name: 'Japan', bounds: { minLat: 30, maxLat: 46, minLon: 129, maxLon: 146 } },
        ];

        for (const country of countries) {
            const bounds = country.bounds;
            if (lat >= bounds.minLat && lat <= bounds.maxLat && 
                lon >= bounds.minLon && lon <= bounds.maxLon) {
                return country.name;
            }
        }
        
        return null;
    }
}

class GDACSProxy {
    constructor() {
        this.baseUrl = 'https://www.gdacs.org';
        this.rssUrl = 'https://www.gdacs.org/xml/rss.xml';
        this.populationEstimator = new PopulationEstimator();
    }

    async fetchGDACSData(source = 'ALL', alertLevel = '', fromDate = '', toDate = '') {
        try {
            const sources = source === 'ALL' ? ['DFO', 'GPM', 'DFOMERGE'] : [source];
            const allEvents = [];

            // Try different approaches for GDACS flood data
            for (const src of sources) {
                try {
                    // Try JSON format first
                    const jsonResult = await this.tryFloodDataFormat(src, 'json', alertLevel, fromDate, toDate);
                    if (jsonResult.length > 0) {
                        allEvents.push(...jsonResult);
                        continue;
                    }

                    // Try CSV format as fallback
                    const csvResult = await this.tryFloodDataFormat(src, 'csv', alertLevel, fromDate, toDate);
                    if (csvResult.length > 0) {
                        allEvents.push(...csvResult);
                    }
                } catch (sourceError) {
                    console.warn(`Failed to fetch from source ${src}:`, sourceError.message);
                }
            }

            return allEvents;
        } catch (error) {
            console.error('Error fetching GDACS data:', error.message);
            throw error;
        }
    }

    async tryFloodDataFormat(src, format, alertLevel, fromDate, toDate, retries = 2) {
        const url = `${this.baseUrl}/floodmerge/data_v2.aspx`;
        const params = {
            source: src,
            type: format,
            alertlevel: alertLevel,
            from: fromDate,
            to: toDate
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Trying ${src} in ${format} format (attempt ${attempt}):`, url, params);
                const response = await axios.get(url, { 
                    params, 
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': format === 'json' ? 'application/json' : 'text/csv',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log(`${src} ${format} response status:`, response.status, 'Data length:', response.data ? response.data.length || 0 : 0);
                
                if (format === 'json' && response.data && Array.isArray(response.data)) {
                    const events = this.transformFloodData(response.data, src);
                    console.log(`Successfully parsed ${events.length} events from ${src} JSON`);
                    return events;
                } else if (format === 'csv' && response.data && typeof response.data === 'string') {
                    const events = this.parseCSVFloodData(response.data, src);
                    console.log(`Successfully parsed ${events.length} events from ${src} CSV`);
                    return events;
                }
                
                return [];
            } catch (error) {
                console.warn(`Attempt ${attempt} failed for ${src} ${format}:`, error.message);
                if (attempt === retries) {
                    throw error;
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        
        return [];
    }

    parseCSVFloodData(csvData, source) {
        try {
            const lines = csvData.split('\n').filter(line => line.trim());
            if (lines.length < 2) return [];

            const headers = lines[0].split(';');
            const events = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(';');
                const event = {};
                
                headers.forEach((header, index) => {
                    event[header.trim()] = values[index] ? values[index].trim() : '';
                });

                if (event.lat && event.lon) {
                    events.push({
                        id: event.areaid || `${source}_${i}`,
                        title: `${this.getSourceName(source)} Alert - ${event.sitename || `Area ${event.areaid}`}`,
                        type: this.getDisasterType(source),
                        alertLevel: this.normalizeAlertLevel(event.alertlevel),
                        latitude: parseFloat(event.lat),
                        longitude: parseFloat(event.lon),
                        magnitude: parseFloat(event.signal) || 0,
                        date: event.date || new Date().toISOString().split('T')[0],
                        description: `Signal: ${event.signal || 'N/A'}, Area: ${event.sitename || 'Unknown'}`,
                        source: source,
                        raw: event
                    });
                }
            }

            return events;
        } catch (error) {
            console.error('Error parsing CSV data:', error.message);
            return [];
        }
    }

    async fetchRSSData() {
        try {
            console.log('Fetching RSS data from:', this.rssUrl);
            const response = await axios.get(this.rssUrl, { 
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const result = await parser.parseStringPromise(response.data);
            
            const events = await this.transformRSSData(result);
            console.log(`Successfully parsed ${events.length} events from RSS with population estimates`);
            return events;
        } catch (error) {
            console.error('Error fetching RSS data:', error.message);
            throw error;
        }
    }

    transformFloodData(data, source) {
        return data.map((item, index) => ({
            id: item.areaid || `${source}_${index}`,
            title: `${this.getSourceName(source)} Alert - ${item.sitename || `Area ${item.areaid}`}`,
            type: this.getDisasterType(source),
            alertLevel: this.normalizeAlertLevel(item.alertlevel),
            latitude: parseFloat(item.lat) || 0,
            longitude: parseFloat(item.lon) || 0,
            magnitude: parseFloat(item.signal) || 0,
            date: item.date || new Date().toISOString().split('T')[0],
            description: `Signal: ${item.signal || 'N/A'}, Area: ${item.sitename || 'Unknown'}`,
            source: source,
            raw: item
        })).filter(event => event.latitude !== 0 && event.longitude !== 0);
    }

    async transformRSSData(rssData) {
        if (!rssData || !rssData.rss || !rssData.rss.channel || !rssData.rss.channel[0].item) {
            console.log('No RSS items found');
            return [];
        }

        const items = rssData.rss.channel[0].item;
        console.log(`Processing ${items.length} RSS items`);
        
        const events = [];
        
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const title = item.title && item.title[0] ? item.title[0] : `Event ${index + 1}`;
            const description = item.description && item.description[0] ? item.description[0] : '';
            const pubDate = item.pubDate && item.pubDate[0] ? item.pubDate[0] : '';
            const link = item.link && item.link[0] ? item.link[0] : '';
            
            // Extract GDACS-specific data from georss and gdacs namespaces
            const coordinates = this.extractGDACSCoordinates(item);
            const alertLevel = this.extractGDACSAlertLevel(item, title);
            const disasterType = this.extractGDACSDisasterType(item, title);
            const magnitude = this.extractGDACSMagnitude(item, description);
            
            // Use async population estimation
            const areaInfo = await this.extractAffectedAreaInfo(item, title, description, coordinates);

            const event = {
                id: `gdacs_${index}`,
                title: title,
                type: disasterType,
                alertLevel: alertLevel,
                latitude: coordinates.lat,
                longitude: coordinates.lon,
                magnitude: magnitude,
                date: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                description: description.length > 300 ? description.substring(0, 300) + '...' : description,
                source: 'GDACS-RSS',
                link: link,
                affectedRadius: areaInfo.affectedRadius || areaInfo.estimatedRadius,
                affectedPopulation: areaInfo.estimatedPopulation || areaInfo.affectedPopulation,
                impactDescription: areaInfo.impactDescription,
                estimatedRadius: areaInfo.estimatedRadius,
                populationData: areaInfo.populationData
            };
            
            if (event.latitude !== 0 && event.longitude !== 0) {
                events.push(event);
                console.log(`Parsed event: ${event.title} at ${event.latitude}, ${event.longitude}`);
            }
        }
        
        return events;
    }

    extractGDACSCoordinates(item) {
        let lat = 0, lon = 0;

        // Try georss:point first
        if (item['georss:point'] && item['georss:point'][0]) {
            const coords = item['georss:point'][0].split(' ');
            if (coords.length === 2) {
                lat = parseFloat(coords[0]);
                lon = parseFloat(coords[1]);
            }
        }

        // Try gdacs specific coordinates
        if (lat === 0 && lon === 0) {
            if (item['gdacs:lat'] && item['gdacs:lat'][0]) {
                lat = parseFloat(item['gdacs:lat'][0]);
            }
            if (item['gdacs:lon'] && item['gdacs:lon'][0]) {
                lon = parseFloat(item['gdacs:lon'][0]);
            }
        }

        // Fallback to description parsing
        if (lat === 0 && lon === 0) {
            const description = item.description && item.description[0] ? item.description[0] : '';
            const link = item.link && item.link[0] ? item.link[0] : '';
            const coords = this.extractCoordinatesFromDescription(description, link);
            lat = coords.lat;
            lon = coords.lon;
        }

        return { lat, lon };
    }

    extractGDACSAlertLevel(item, title) {
        // Try GDACS-specific alert level
        if (item['gdacs:alertlevel'] && item['gdacs:alertlevel'][0]) {
            return item['gdacs:alertlevel'][0].toUpperCase();
        }

        // Extract from title
        return this.extractAlertLevelFromTitle(title);
    }

    extractGDACSDisasterType(item, title) {
        // Try GDACS-specific event type
        if (item['gdacs:eventtype'] && item['gdacs:eventtype'][0]) {
            const eventType = item['gdacs:eventtype'][0].toLowerCase();
            const typeMap = {
                'eq': 'Earthquake',
                'tc': 'Cyclone',
                'fl': 'Flood',
                'vo': 'Volcano',
                'wf': 'Wildfire',
                'dr': 'Drought'
            };
            return typeMap[eventType] || eventType;
        }

        // Fallback to title parsing
        return this.extractDisasterTypeFromTitle(title);
    }

    extractGDACSMagnitude(item, description) {
        // Try GDACS-specific magnitude
        if (item['gdacs:severity'] && item['gdacs:severity'][0]) {
            return parseFloat(item['gdacs:severity'][0]);
        }

        // Extract magnitude from description
        const magMatch = description.match(/magnitude[:\s]*([0-9.]+)/i) || 
                        description.match(/m([0-9.]+)/i) ||
                        description.match(/([0-9.]+)m/i);
        
        return magMatch ? parseFloat(magMatch[1]) : 0;
    }

    async extractAffectedAreaInfo(item, title, description, coordinates) {
        const areaInfo = {
            affectedRadius: 0,
            affectedPopulation: 0,
            estimatedPopulation: 0,
            impactDescription: '',
            estimatedRadius: 0,
            populationData: null
        };

        // Extract population affected from GDACS description first
        const popMatches = [
            description.match(/(\d+(?:\.\d+)?)\s*million/i),
            description.match(/(\d+(?:,\d+)*)\s*thousand/i),
            description.match(/affecting\s*(\d+(?:,\d+)*)/i)
        ];

        if (popMatches[0]) {
            areaInfo.affectedPopulation = parseFloat(popMatches[0][1]) * 1000000;
        } else if (popMatches[1]) {
            areaInfo.affectedPopulation = parseFloat(popMatches[1][1].replace(/,/g, '')) * 1000;
        } else if (popMatches[2]) {
            areaInfo.affectedPopulation = parseFloat(popMatches[2][1].replace(/,/g, ''));
        }

        // Extract radius information from GDACS description
        const radiusMatch = description.match(/(\d+)\s*km/i);
        if (radiusMatch) {
            areaInfo.affectedRadius = parseFloat(radiusMatch[1]);
        }

        // Calculate estimated impact radius based on event type and magnitude
        const eventType = this.extractGDACSDisasterType(item, title);
        const magnitude = this.extractGDACSMagnitude(item, description);
        
        areaInfo.estimatedRadius = this.calculateImpactRadius(eventType, magnitude, areaInfo.affectedPopulation);

        // Use population estimator to get more accurate population data
        if (coordinates && coordinates.lat !== 0 && coordinates.lon !== 0) {
            try {
                const populationEstimate = this.populationEstimator.estimatePopulationInRadius(
                    coordinates.lat, 
                    coordinates.lon, 
                    areaInfo.estimatedRadius
                );
                
                areaInfo.populationData = populationEstimate;
                
                // If GDACS didn't provide population data, use our estimate
                if (areaInfo.affectedPopulation === 0) {
                    areaInfo.estimatedPopulation = populationEstimate.estimatedPopulation;
                } else {
                    areaInfo.estimatedPopulation = areaInfo.affectedPopulation;
                }
                
                console.log(`Population estimate for ${title}: ${populationEstimate.estimatedPopulation.toLocaleString()} people in ${areaInfo.estimatedRadius}km radius (density: ${populationEstimate.density}/km²)`);
                
            } catch (error) {
                console.warn('Population estimation failed:', error.message);
                areaInfo.estimatedPopulation = areaInfo.affectedPopulation || 0;
            }
        } else {
            areaInfo.estimatedPopulation = areaInfo.affectedPopulation || 0;
        }

        areaInfo.impactDescription = this.generateImpactDescription(eventType, magnitude, areaInfo.estimatedPopulation);

        return areaInfo;
    }

    calculateImpactRadius(eventType, magnitude, population) {
        switch (eventType.toLowerCase()) {
            case 'earthquake':
                // Earthquake impact radius based on magnitude
                if (magnitude >= 7) return 200; // Major earthquake
                if (magnitude >= 6) return 100; // Strong earthquake  
                if (magnitude >= 5) return 50;  // Moderate earthquake
                if (magnitude >= 4) return 25;  // Light earthquake
                return 10;

            case 'cyclone':
            case 'hurricane':
            case 'typhoon':
                // Cyclone impact radius based on intensity
                if (magnitude >= 4) return 300; // Category 4-5
                if (magnitude >= 3) return 200; // Category 3
                if (magnitude >= 2) return 150; // Category 2
                if (magnitude >= 1) return 100; // Category 1
                return 75; // Tropical storm

            case 'volcano':
                // Volcanic impact radius
                if (magnitude >= 4) return 100; // Major eruption
                if (magnitude >= 3) return 50;  // Moderate eruption
                return 25; // Minor activity

            case 'wildfire':
                // Wildfire impact - varies widely
                return 20;

            case 'flood':
                // Flood impact based on population affected
                if (population > 1000000) return 150;
                if (population > 100000) return 75;
                if (population > 10000) return 40;
                return 20;

            case 'drought':
                // Drought affects large areas
                return 200;

            default:
                // Default radius based on population
                if (population > 1000000) return 100;
                if (population > 100000) return 50;
                if (population > 10000) return 25;
                return 15;
        }
    }

    generateImpactDescription(eventType, magnitude, population) {
        let desc = '';
        
        if (population > 0) {
            if (population >= 1000000) {
                desc += `${(population / 1000000).toFixed(1)}M people affected`;
            } else if (population >= 1000) {
                desc += `${(population / 1000).toFixed(0)}K people affected`;
            } else {
                desc += `${population} people affected`;
            }
        }

        if (magnitude > 0) {
            if (desc) desc += ', ';
            if (eventType.toLowerCase() === 'earthquake') {
                desc += `Magnitude ${magnitude}`;
            } else {
                desc += `Intensity ${magnitude}`;
            }
        }

        return desc;
    }

    extractCoordinatesFromDescription(description, link) {
        let lat = 0, lon = 0;

        const text = (description + ' ' + link).toLowerCase();

        const latRegex = /lat[:\s=]*([+-]?\d+\.?\d*)/i;
        const lonRegex = /lon[:\s=]*([+-]?\d+\.?\d*)/i;

        const latMatch = text.match(latRegex);
        const lonMatch = text.match(lonRegex);

        if (latMatch) lat = parseFloat(latMatch[1]);
        if (lonMatch) lon = parseFloat(lonMatch[1]);

        if (lat === 0 && lon === 0) {
            const coordRegex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
            const coordMatch = text.match(coordRegex);
            if (coordMatch) {
                lat = parseFloat(coordMatch[1]);
                lon = parseFloat(coordMatch[2]);
            }
        }

        if (lat === 0 && lon === 0) {
            const geoRegex = /(\d+\.?\d*)[°\s]*([ns])[,\s]*(\d+\.?\d*)[°\s]*([ew])/i;
            const geoMatch = text.match(geoRegex);
            if (geoMatch) {
                lat = parseFloat(geoMatch[1]) * (geoMatch[2].toLowerCase() === 's' ? -1 : 1);
                lon = parseFloat(geoMatch[3]) * (geoMatch[4].toLowerCase() === 'w' ? -1 : 1);
            }
        }

        return { lat: lat || 0, lon: lon || 0 };
    }

    extractAlertLevelFromTitle(title) {
        const upperTitle = title.toUpperCase();
        if (upperTitle.includes('RED')) return 'RED';
        if (upperTitle.includes('ORANGE')) return 'ORANGE';
        if (upperTitle.includes('GREEN')) return 'GREEN';
        return 'GREEN'; 
    }

    extractDisasterTypeFromTitle(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('flood')) return 'Flood';
        if (lowerTitle.includes('earthquake')) return 'Earthquake';
        if (lowerTitle.includes('cyclone') || lowerTitle.includes('hurricane') || lowerTitle.includes('typhoon')) return 'Cyclone';
        if (lowerTitle.includes('volcano')) return 'Volcano';
        if (lowerTitle.includes('wildfire') || lowerTitle.includes('fire')) return 'Wildfire';
        if (lowerTitle.includes('drought')) return 'Drought';
        if (lowerTitle.includes('tsunami')) return 'Tsunami';
        return 'Disaster Event';
    }

    getSourceName(source) {
        const names = {
            'DFO': 'Dartmouth Flood Observatory',
            'GPM': 'Global Precipitation Measurement',
            'DFOMERGE': 'DFO Merged Analysis'
        };
        return names[source] || source;
    }

    getDisasterType(source) {
        const types = {
            'DFO': 'Flood',
            'GPM': 'Precipitation',
            'DFOMERGE': 'Flood Analysis'
        };
        return types[source] || 'Disaster Event';
    }

    normalizeAlertLevel(level) {
        if (!level) return 'GREEN';
        const upper = level.toString().toUpperCase();
        if (['RED', 'ORANGE', 'GREEN'].includes(upper)) {
            return upper;
        }
        return 'GREEN';
    }

    getSampleData() {
        return [
            {
                id: 'gdacs_sample_1',
                title: 'Flood Alert - Bangladesh (Brahmaputra River)',
                type: 'Flood',
                alertLevel: 'RED',
                latitude: 25.2677,
                longitude: 89.9376,
                date: new Date().toISOString().split('T')[0],
                description: 'Severe flooding along Brahmaputra River affecting multiple districts in northern Bangladesh.',
                source: 'DFO',
                magnitude: 8.5,
                affectedRadius: 150,
                affectedPopulation: 10000000,
                impactDescription: '10.0M people affected, Intensity 8.5'
            },
            {
                id: 'gdacs_sample_2',
                title: 'Earthquake M6.2 - Turkey (Eastern Anatolia)',
                type: 'Earthquake',
                alertLevel: 'ORANGE',
                latitude: 38.7312,
                longitude: 35.4826,
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                description: 'Moderate earthquake in Eastern Anatolia region with potential for aftershocks.',
                source: 'RSS',
                magnitude: 6.2,
                affectedRadius: 100,
                affectedPopulation: 800000,
                impactDescription: '800K people affected, Magnitude 6.2'
            },
            {
                id: 'gdacs_sample_3',
                title: 'Tropical Cyclone SARAH - Philippines',
                type: 'Cyclone',
                alertLevel: 'RED',
                latitude: 14.7563,
                longitude: 121.0583,
                date: new Date().toISOString().split('T')[0],
                description: 'Category 3 tropical cyclone approaching Luzon with winds up to 185 km/h.',
                source: 'RSS',
                magnitude: 3,
                affectedRadius: 200,
                affectedPopulation: 5200000,
                impactDescription: '5.2M people affected, Category 3'
            },
            {
                id: 'gdacs_sample_4',
                title: 'Precipitation Alert - Horn of Africa',
                type: 'Precipitation',
                alertLevel: 'ORANGE',
                latitude: 9.1450,
                longitude: 40.4897,
                date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                description: 'Heavy precipitation events detected across Horn of Africa region.',
                source: 'GPM',
                magnitude: 6.2,
                affectedRadius: 50,
                affectedPopulation: 300000,
                impactDescription: '300K people affected, Intensity 6.2'
            },
            {
                id: 'gdacs_sample_5',
                title: 'Volcanic Activity - Mount Merapi, Indonesia',
                type: 'Volcano',
                alertLevel: 'GREEN',
                latitude: -7.5407,
                longitude: 110.4456,
                date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
                description: 'Increased volcanic activity detected at Mount Merapi with elevated monitoring.',
                source: 'RSS',
                affectedRadius: 25,
                affectedPopulation: 75000,
                impactDescription: '75K people affected'
            },
            {
                id: 'gdacs_sample_6',
                title: 'Wildfire - California Central Valley',
                type: 'Wildfire',
                alertLevel: 'ORANGE',
                latitude: 36.7378,
                longitude: -119.7871,
                date: new Date(Date.now() - 43200000).toISOString().split('T')[0],
                description: 'Large wildfire burning across central California with evacuation warnings.',
                source: 'RSS',
                affectedRadius: 20,
                affectedPopulation: 180000,
                impactDescription: '180K people affected'
            }
        ];
    }
}

const gdacsProxy = new GDACSProxy();

app.get('/api/disasters', async (req, res) => {
    try {
        const { source = 'ALL', alertLevel = '', from = '', to = '' } = req.query;
        
        console.log('Fetching disasters with params:', { source, alertLevel, from, to });
        
        let events = [];
        
        try {
            const gdacsEvents = await gdacsProxy.fetchGDACSData(source, alertLevel, from, to);
            events.push(...gdacsEvents);
            console.log(`Fetched ${gdacsEvents.length} events from GDACS API`);
        } catch (gdacsError) {
            console.warn('GDACS API failed, trying RSS:', gdacsError.message);
        }

        if (events.length === 0) {
            try {
                const rssEvents = await gdacsProxy.fetchRSSData();
                events.push(...rssEvents);
                console.log(`Fetched ${rssEvents.length} events from RSS feed`);
            } catch (rssError) {
                console.warn('RSS feed also failed:', rssError.message);
            }
        }
        
        if (events.length === 0) {
            console.log('All external sources failed, using sample data for demonstration');
            events = gdacsProxy.getSampleData();
        }

        if (alertLevel) {
            events = events.filter(event => event.alertLevel === alertLevel.toUpperCase());
        }

        events.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: events.length,
            events: events
        });

    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            events: []
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/disasters - Get disaster events',
            '/api/disasters/sample - Get sample disaster events',
            '/api/health-facilities - Get health facilities data',
            '/api/health - Health check'
        ]
    });
});

// Health facilities endpoint
app.get('/api/health-facilities', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dataPath = path.join(__dirname, 'health-facilities-data.json');
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Health facilities data not found. Please process the Excel file first.'
            });
        }
        
        const healthFacilities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // Filter by type if specified
        const { type, functionality, region } = req.query;
        let filteredFacilities = healthFacilities;
        
        if (type) {
            filteredFacilities = filteredFacilities.filter(facility => 
                facility.type.toLowerCase() === type.toLowerCase()
            );
        }
        
        if (functionality) {
            filteredFacilities = filteredFacilities.filter(facility => 
                facility.functionality.toLowerCase() === functionality.toLowerCase()
            );
        }
        
        if (region) {
            filteredFacilities = filteredFacilities.filter(facility => 
                facility.region && facility.region.toLowerCase() === region.toLowerCase()
            );
        }
        
        res.json({
            success: true,
            count: filteredFacilities.length,
            total: healthFacilities.length,
            facilities: filteredFacilities
        });
        
    } catch (error) {
        console.error('Error serving health facilities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load health facilities data'
        });
    }
});

app.get('/api/disasters/sample', (req, res) => {
    try {
        const { alertLevel = '' } = req.query;
        let events = gdacsProxy.getSampleData();
        
        if (alertLevel) {
            events = events.filter(event => event.alertLevel === alertLevel.toUpperCase());
        }

        events.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: events.length,
            events: events,
            note: 'This is sample data for demonstration purposes'
        });

    } catch (error) {
        console.error('Sample API Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            events: []
        });
    }
});

// IFRC GO API Configuration
const IFRC_GO_API_TOKEN = process.env.IFRC_GO_API_TOKEN;
const IFRC_GO_API_BASE_URL = process.env.IFRC_GO_API_BASE_URL || 'https://goadmin.ifrc.org/api/v2';

// Rate limiting for IFRC GO API (max 100 requests per hour as per typical rate limits)
const ifrcApiCalls = [];
const IFRC_RATE_LIMIT = 100;
const IFRC_RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function canMakeIfrcApiCall() {
    const now = Date.now();
    // Remove calls older than the rate window
    while (ifrcApiCalls.length > 0 && ifrcApiCalls[0] < now - IFRC_RATE_WINDOW) {
        ifrcApiCalls.shift();
    }
    return ifrcApiCalls.length < IFRC_RATE_LIMIT;
}

function recordIfrcApiCall() {
    ifrcApiCalls.push(Date.now());
}

// IFRC GO API client
async function fetchFromIfrcGo(endpoint, params = {}) {
    if (!canMakeIfrcApiCall()) {
        throw new Error('Rate limit exceeded for IFRC GO API');
    }
    
    if (!IFRC_GO_API_TOKEN || IFRC_GO_API_TOKEN === 'your_token_here') {
        throw new Error('IFRC GO API token not configured');
    }
    
    const url = `${IFRC_GO_API_BASE_URL}${endpoint}`;
    const headers = {
        'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
        'Content-Type': 'application/json'
    };
    
    try {
        recordIfrcApiCall();
        const response = await axios.get(url, { 
            headers, 
            params,
            timeout: 30000 
        });
        return response.data;
    } catch (error) {
        console.error(`IFRC GO API error for ${endpoint}:`, error.message);
        throw error;
    }
}

// Get IFRC documents by country
app.get('/api/ifrc-documents', async (req, res) => {
    try {
        const { country, limit = 10, offset = 0 } = req.query;
        
        // First, get appeals/events for the country
        const appealsParams = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ordering: '-start_date' // Most recent first
        };
        
        if (country) {
            appealsParams.country = country;
        }
        
        const appealsData = await fetchFromIfrcGo('/appeal/', appealsParams);
        
        // Get documents for these appeals
        const documents = [];
        if (appealsData.results) {
            for (const appeal of appealsData.results.slice(0, 5)) { // Limit to 5 appeals to avoid rate limits
                try {
                    const appealDocs = await fetchFromIfrcGo(`/appeal_document/?appeal=${appeal.id}`, {
                        ordering: '-created_at'
                    });
                    if (appealDocs.results) {
                        documents.push(...appealDocs.results.map(doc => ({
                            ...doc,
                            appeal_name: appeal.name,
                            appeal_code: appeal.code,
                            country_name: appeal.country?.name,
                            disaster_type: appeal.dtype?.name,
                            start_date: appeal.start_date
                        })));
                    }
                } catch (docError) {
                    console.error(`Error fetching documents for appeal ${appeal.id}:`, docError.message);
                }
            }
        }
        
        // Sort documents by most recent first
        documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json({
            count: documents.length,
            results: documents.slice(0, parseInt(limit))
        });
        
    } catch (error) {
        console.error('Error fetching IFRC documents:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch IFRC documents',
            message: error.message 
        });
    }
});

// Get IFRC countries list
app.get('/api/ifrc-countries', async (req, res) => {
    try {
        const countriesData = await fetchFromIfrcGo('/country/', {
            limit: 300, // Get all countries
            ordering: 'name'
        });
        
        res.json(countriesData);
    } catch (error) {
        console.error('Error fetching IFRC countries:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch IFRC countries',
            message: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`GDACS Proxy Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/disasters`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});