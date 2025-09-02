const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

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
        console.log('Fetching GDACS CAP XML data from: https://www.gdacs.org/xml/gdacs_cap.xml');
        
        const response = await axios.get('https://www.gdacs.org/xml/gdacs_cap.xml', {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const result = await parser.parseStringPromise(response.data);
        const items = result.rss?.channel?.[0]?.item || [];
        
        console.log(`Processing ${items.length} CAP items`);
        
        const impactZones = [];
        
        items.forEach((item, index) => {
            try {
                const title = item.title?.[0] || 'Unknown Event';
                const id = item.guid?.[0]?._ || item.guid?.[0] || `gdacs_cap_${index}`;
                const updated = item.pubDate?.[0] || '';
                const summary = item.description?.[0] || '';
                
                // Extract CAP alert data
                const capAlert = item['cap:alert']?.[0];
                if (!capAlert) return;
                
                const capInfo = capAlert['cap:info']?.[0];
                if (!capInfo) return;
                
                const capArea = capInfo['cap:area']?.[0];
                if (!capArea) return;
                
                // Extract event details
                const eventType = capInfo['cap:event']?.[0] || 'Unknown';
                const severity = capInfo['cap:severity']?.[0] || 'Unknown';
                const urgency = capInfo['cap:urgency']?.[0] || 'Unknown';
                const certainty = capInfo['cap:certainty']?.[0] || 'Unknown';
                
                // Extract geographic data
                const areaDesc = capArea['cap:areaDesc']?.[0] || 'Unknown Area';
                const polygon = capArea['cap:polygon']?.[0];
                const circle = capArea['cap:circle']?.[0];
                
                // Also try to get coordinates from geo:Point if CAP area doesn't have geometry
                const geoPoint = item['geo:Point']?.[0];
                const geoLat = geoPoint ? parseFloat(geoPoint['geo:lat']?.[0]) : null;
                const geoLon = geoPoint ? parseFloat(geoPoint['geo:long']?.[0]) : null;
                
                // Extract coordinates from polygon or circle
                let impactGeometry = null;
                let centerPoint = null;
                let radius = null;
                
                if (polygon) {
                    // Parse polygon coordinates (lat,lon lat,lon format)
                    const coordPairs = polygon.trim().split(' ');
                    const coordinates = coordPairs.map(pair => {
                        const [lat, lon] = pair.split(',').map(Number);
                        return [lon, lat]; // GeoJSON format [longitude, latitude]
                    }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
                    
                    if (coordinates.length > 0) {
                        impactGeometry = {
                            type: 'Polygon',
                            coordinates: [coordinates]
                        };
                        
                        // Calculate center point
                        const avgLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
                        const avgLon = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
                        centerPoint = [avgLon, avgLat];
                    }
                } else if (circle) {
                    // Parse circle coordinates (lat,lon radius_in_km)
                    const parts = circle.trim().split(' ');
                    if (parts.length >= 2) {
                        const [lat, lon] = parts[0].split(',').map(Number);
                        radius = parseFloat(parts[1]);
                        
                        if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius)) {
                            centerPoint = [lon, lat];
                            impactGeometry = {
                                type: 'Circle',
                                center: [lon, lat],
                                radius: radius * 1000 // Convert km to meters
                            };
                        }
                    }
                }
                
                // If no CAP geometry but we have geo:Point, create a default circle
                if (!impactGeometry && geoLat !== null && geoLon !== null) {
                    centerPoint = [geoLon, geoLat];
                    const defaultRadius = 50; // Default 50km radius
                    impactGeometry = {
                        type: 'Circle',
                        center: [geoLon, geoLat],
                        radius: defaultRadius * 1000 // Convert km to meters
                    };
                    radius = defaultRadius;
                }
                
                // Extract population and damage estimates from summary
                let populationAffected = null;
                let populationDescription = '';
                
                const summaryText = summary.toLowerCase();
                if (summaryText.includes('million')) {
                    const millionMatch = summaryText.match(/([\d.]+)\s*million/);
                    if (millionMatch) {
                        populationAffected = parseFloat(millionMatch[1]) * 1000000;
                    }
                } else if (summaryText.includes('thousand')) {
                    const thousandMatch = summaryText.match(/([\d.]+)\s*thousand/);
                    if (thousandMatch) {
                        populationAffected = parseFloat(thousandMatch[1]) * 1000;
                    }
                }
                
                // Extract magnitude for earthquakes
                let magnitude = null;
                const magMatch = summary.match(/magnitude[\s:]*(\d+\.?\d*)/i);
                if (magMatch) {
                    magnitude = parseFloat(magMatch[1]);
                }
                
                // Extract depth for earthquakes
                let depth = null;
                const depthMatch = summary.match(/depth[\s:]*(\d+\.?\d*)\s*km/i);
                if (depthMatch) {
                    depth = parseFloat(depthMatch[1]);
                }
                
                console.log(`Processing item ${index}: ${title}`);
                console.log(`  Has CAP alert: ${!!capAlert}`);
                console.log(`  Has CAP area: ${!!capArea}`);
                console.log(`  Polygon: ${!!polygon}`);
                console.log(`  Circle: ${!!circle}`);
                console.log(`  Geo Point: lat=${geoLat}, lon=${geoLon}`);
                console.log(`  Impact Geometry: ${!!impactGeometry}`);
                
                if (impactGeometry && centerPoint) {
                    impactZones.push({
                        id: id,
                        title: title,
                        eventType: eventType,
                        severity: severity,
                        urgency: urgency,
                        certainty: certainty,
                        areaDescription: areaDesc,
                        geometry: impactGeometry,
                        centerPoint: centerPoint,
                        radius: radius,
                        populationAffected: populationAffected,
                        populationDescription: populationDescription,
                        magnitude: magnitude,
                        depth: depth,
                        summary: summary,
                        updated: updated,
                        source: 'GDACS-CAP'
                    });
                }
                
            } catch (error) {
                console.error(`Error parsing CAP entry ${index}:`, error.message);
            }
        });
        
        console.log(`Successfully processed ${impactZones.length} impact zones`);
        
        res.status(200).json({
            success: true,
            count: impactZones.length,
            impactZones: impactZones,
            source: 'GDACS CAP XML'
        });
        
    } catch (error) {
        console.error('Error fetching GDACS CAP data:', error.message);
        
        // Return sample impact zones as fallback
        const sampleImpactZones = [
            {
                id: 'sample_impact_1',
                title: 'Green earthquake alert (Magnitude 5.2M, Depth:10km) in Japan',
                eventType: 'Earthquake',
                severity: 'Minor',
                urgency: 'Past',
                certainty: 'Observed',
                areaDescription: 'Honshu, Japan',
                geometry: {
                    type: 'Circle',
                    center: [140.5, 38.5],
                    radius: 50000
                },
                centerPoint: [140.5, 38.5],
                radius: 50,
                populationAffected: 250000,
                populationDescription: '250 thousand people in 100km',
                magnitude: 5.2,
                depth: 10,
                summary: 'Green earthquake alert (Magnitude 5.2M, Depth:10km) in Japan. 250 thousand people affected in 100km radius.',
                updated: new Date().toISOString(),
                source: 'GDACS-CAP'
            },
            {
                id: 'sample_impact_2',
                title: 'Orange earthquake alert (Magnitude 6.1M, Depth:25km) in Philippines',
                eventType: 'Earthquake',
                severity: 'Moderate',
                urgency: 'Expected',
                certainty: 'Observed',
                areaDescription: 'Luzon, Philippines',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [120.5, 14.0],
                        [121.5, 14.0],
                        [121.5, 15.0],
                        [120.5, 15.0],
                        [120.5, 14.0]
                    ]]
                },
                centerPoint: [121.0, 14.5],
                radius: null,
                populationAffected: 2500000,
                populationDescription: '2.5 million people in 100km',
                magnitude: 6.1,
                depth: 25,
                summary: 'Orange earthquake alert (Magnitude 6.1M, Depth:25km) in Philippines. 2.5 million people affected in 100km radius.',
                updated: new Date().toISOString(),
                source: 'GDACS-CAP'
            },
            {
                id: 'sample_impact_3',
                title: 'Green tropical cyclone alert in Pacific Ocean',
                eventType: 'Tropical Cyclone',
                severity: 'Minor',
                urgency: 'Future',
                certainty: 'Possible',
                areaDescription: 'Western Pacific Ocean',
                geometry: {
                    type: 'Circle',
                    center: [145.0, 20.0],
                    radius: 100000
                },
                centerPoint: [145.0, 20.0],
                radius: 100,
                populationAffected: 50000,
                populationDescription: '50 thousand people at risk',
                magnitude: null,
                depth: null,
                summary: 'Green tropical cyclone alert in Pacific Ocean. 50 thousand people at risk in coastal areas.',
                updated: new Date().toISOString(),
                source: 'GDACS-CAP'
            }
        ];
        
        res.status(200).json({
            success: true,
            count: sampleImpactZones.length,
            impactZones: sampleImpactZones,
            note: 'Using sample data - GDACS CAP XML temporarily unavailable',
            error: error.message
        });
    }
};