const axios = require('axios');

const IFRC_GO_API_TOKEN = process.env.IFRC_GO_API_TOKEN;
const IFRC_GO_API_BASE_URL = process.env.IFRC_GO_API_BASE_URL || 'https://goadmin.ifrc.org/api/v2';

// Country coordinates mapping (using capital cities or country centers)
function getCountryCoordinates(iso3) {
    const coordinates = {
        'CPV': { lat: 16.5388, lng: -24.0132 }, // Cape Verde - Praia
        'BGD': { lat: 23.6850, lng: 90.3563 },  // Bangladesh - Dhaka
        'TUR': { lat: 39.9334, lng: 32.8597 },  // Turkey - Ankara
        'PHL': { lat: 14.5995, lng: 120.9842 }, // Philippines - Manila
        'IND': { lat: 28.6139, lng: 77.2090 },  // India - New Delhi
        'PAK': { lat: 33.6844, lng: 73.0479 },  // Pakistan - Islamabad
        'IDN': { lat: -6.2088, lng: 106.8456 }, // Indonesia - Jakarta
        'NPL': { lat: 27.7172, lng: 85.3240 },  // Nepal - Kathmandu
        'LKA': { lat: 6.9271, lng: 79.8612 },   // Sri Lanka - Colombo
        'MYS': { lat: 3.1390, lng: 101.6869 },  // Malaysia - Kuala Lumpur
        'THA': { lat: 13.7563, lng: 100.5018 }, // Thailand - Bangkok
        'VNM': { lat: 21.0285, lng: 105.8542 }, // Vietnam - Hanoi
        'MMR': { lat: 19.7633, lng: 96.0785 },  // Myanmar - Naypyidaw
        'KHM': { lat: 11.5564, lng: 104.9282 }, // Cambodia - Phnom Penh
        'LAO': { lat: 17.9757, lng: 102.6331 }, // Laos - Vientiane
        'AFG': { lat: 34.5553, lng: 69.2075 },  // Afghanistan - Kabul
        'IRN': { lat: 35.6892, lng: 51.3890 },  // Iran - Tehran
        'IRQ': { lat: 33.3152, lng: 44.3661 },  // Iraq - Baghdad
        'SYR': { lat: 33.5138, lng: 36.2765 },  // Syria - Damascus
        'JOR': { lat: 31.9539, lng: 35.9106 },  // Jordan - Amman
        'LBN': { lat: 33.8547, lng: 35.8623 },  // Lebanon - Beirut
        'YEM': { lat: 15.3729, lng: 44.1910 },  // Yemen - Sanaa
        'SAU': { lat: 24.7136, lng: 46.6753 },  // Saudi Arabia - Riyadh
        'ARE': { lat: 24.2992, lng: 54.6972 },  // UAE - Abu Dhabi
        'KWT': { lat: 29.3759, lng: 47.9774 },  // Kuwait - Kuwait City
        'QAT': { lat: 25.2760, lng: 51.5200 },  // Qatar - Doha
        'BHR': { lat: 26.0667, lng: 50.5577 },  // Bahrain - Manama
        'OMN': { lat: 23.5859, lng: 58.4059 },  // Oman - Muscat
        'EGY': { lat: 30.0444, lng: 31.2357 },  // Egypt - Cairo
        'SDN': { lat: 15.5007, lng: 32.5599 },  // Sudan - Khartoum
        'ETH': { lat: 9.1450, lng: 40.4897 },   // Ethiopia - Addis Ababa
        'KEN': { lat: -1.2921, lng: 36.8219 },  // Kenya - Nairobi
        'TZA': { lat: -6.7924, lng: 39.2083 },  // Tanzania - Dodoma
        'UGA': { lat: 0.3476, lng: 32.5825 },   // Uganda - Kampala
        'MOZ': { lat: -25.9692, lng: 32.5732 }, // Mozambique - Maputo
        'ZWE': { lat: -17.8292, lng: 31.0522 }, // Zimbabwe - Harare
        'ZMB': { lat: -15.3875, lng: 28.3228 }, // Zambia - Lusaka
        'MWI': { lat: -13.2543, lng: 34.3015 }, // Malawi - Lilongwe
        'MDG': { lat: -18.8792, lng: 47.5079 }, // Madagascar - Antananarivo
        'ZAF': { lat: -30.5595, lng: 22.9375 }, // South Africa - Bloemfontein
        'BWA': { lat: -24.6282, lng: 25.9231 }, // Botswana - Gaborone
        'NAM': { lat: -22.9576, lng: 18.4904 }, // Namibia - Windhoek
        'AGO': { lat: -8.8390, lng: 13.2894 },  // Angola - Luanda
        'COD': { lat: -4.4419, lng: 15.2663 },  // DR Congo - Kinshasa
        'CMR': { lat: 7.3697, lng: 12.3547 },   // Cameroon - Yaounde
        'NGA': { lat: 9.0579, lng: 7.4951 },    // Nigeria - Abuja
        'GHA': { lat: 5.6037, lng: -0.1870 },   // Ghana - Accra
        'CIV': { lat: 7.5400, lng: -5.5471 },   // Ivory Coast - Yamoussoukro
        'SEN': { lat: 14.7167, lng: -17.4677 }, // Senegal - Dakar
        'MLI': { lat: 12.6392, lng: -8.0029 },  // Mali - Bamako
        'BFA': { lat: 12.2383, lng: -1.5616 },  // Burkina Faso - Ouagadougou
        'NER': { lat: 13.5116, lng: 2.1254 },   // Niger - Niamey
        'TCD': { lat: 15.4542, lng: 18.7322 },  // Chad - N'Djamena
        'CAF': { lat: 6.6111, lng: 20.9394 },   // Central African Republic - Bangui
        'GAB': { lat: 0.4162, lng: 9.4673 },    // Gabon - Libreville
        'GNQ': { lat: 3.7504, lng: 8.7371 },    // Equatorial Guinea - Malabo
        'STP': { lat: 0.1864, lng: 6.6131 },    // Sao Tome and Principe
        'LBR': { lat: 6.4281, lng: -9.4295 },   // Liberia - Monrovia
        'SLE': { lat: 8.4606, lng: -11.7799 },  // Sierra Leone - Freetown
        'GIN': { lat: 9.6412, lng: -13.5784 },  // Guinea - Conakry
        'GNB': { lat: 11.8037, lng: -15.1804 }, // Guinea-Bissau - Bissau
        'GMB': { lat: 13.4432, lng: -15.3101 }, // Gambia - Banjul
        'MRT': { lat: 18.0735, lng: -15.9582 }, // Mauritania - Nouakchott
        'DZA': { lat: 36.7538, lng: 3.0588 },   // Algeria - Algiers
        'TUN': { lat: 36.8065, lng: 10.1815 },  // Tunisia - Tunis
        'LBY': { lat: 32.8872, lng: 13.1913 },  // Libya - Tripoli
        'MAR': { lat: 34.0209, lng: -6.8416 },  // Morocco - Rabat
        'ESP': { lat: 40.4168, lng: -3.7038 },  // Spain - Madrid
        'PRT': { lat: 39.3999, lng: -8.2245 },  // Portugal - Lisbon
        'FRA': { lat: 46.6034, lng: 1.8883 },   // France - Geographic center
        'ITA': { lat: 41.8719, lng: 12.5674 },  // Italy - Rome
        'DEU': { lat: 51.1657, lng: 10.4515 },  // Germany - Geographic center
        'GBR': { lat: 55.3781, lng: -3.4360 },  // United Kingdom - Geographic center
        'NLD': { lat: 52.1326, lng: 5.2913 },   // Netherlands - Geographic center
        'BEL': { lat: 50.5039, lng: 4.4699 },   // Belgium - Brussels
        'CHE': { lat: 46.8182, lng: 8.2275 },   // Switzerland - Bern
        'AUT': { lat: 47.5162, lng: 14.5501 },  // Austria - Geographic center
        'POL': { lat: 51.9194, lng: 19.1451 },  // Poland - Geographic center
        'CZE': { lat: 49.8175, lng: 15.4730 },  // Czech Republic - Geographic center
        'SVK': { lat: 48.6690, lng: 19.6990 },  // Slovakia - Geographic center
        'HUN': { lat: 47.1625, lng: 19.5033 },  // Hungary - Budapest
        'ROU': { lat: 45.9432, lng: 24.9668 },  // Romania - Geographic center
        'BGR': { lat: 42.7339, lng: 25.4858 },  // Bulgaria - Geographic center
        'GRC': { lat: 39.0742, lng: 21.8243 },  // Greece - Geographic center
        'ALB': { lat: 41.1533, lng: 20.1683 },  // Albania - Tirana
        'MKD': { lat: 41.6086, lng: 21.7453 },  // North Macedonia - Skopje
        'SRB': { lat: 44.0165, lng: 21.0059 },  // Serbia - Belgrade
        'MNE': { lat: 42.7087, lng: 19.3744 },  // Montenegro - Podgorica
        'BIH': { lat: 43.9159, lng: 17.6791 },  // Bosnia and Herzegovina - Sarajevo
        'HRV': { lat: 45.1000, lng: 15.2000 },  // Croatia - Zagreb
        'SVN': { lat: 46.1512, lng: 14.9955 },  // Slovenia - Ljubljana
        'RUS': { lat: 61.5240, lng: 105.3188 }, // Russia - Geographic center
        'UKR': { lat: 48.3794, lng: 31.1656 },  // Ukraine - Geographic center
        'BLR': { lat: 53.7098, lng: 27.9534 },  // Belarus - Minsk
        'LTU': { lat: 55.1694, lng: 23.8813 },  // Lithuania - Vilnius
        'LVA': { lat: 56.8796, lng: 24.6032 },  // Latvia - Riga
        'EST': { lat: 58.5953, lng: 25.0136 },  // Estonia - Tallinn
        'FIN': { lat: 61.9241, lng: 25.7482 },  // Finland - Geographic center
        'SWE': { lat: 60.1282, lng: 18.6435 },  // Sweden - Stockholm
        'NOR': { lat: 60.4720, lng: 8.4689 },   // Norway - Geographic center
        'DNK': { lat: 56.2639, lng: 9.5018 },   // Denmark - Geographic center
        'ISL': { lat: 64.9631, lng: -19.0208 }, // Iceland - Reykjavik
        'USA': { lat: 39.8283, lng: -98.5795 }, // United States - Geographic center
        'CAN': { lat: 56.1304, lng: -106.3468 }, // Canada - Geographic center
        'MEX': { lat: 23.6345, lng: -102.5528 }, // Mexico - Geographic center
        'GTM': { lat: 15.7835, lng: -90.2308 }, // Guatemala - Guatemala City
        'BLZ': { lat: 17.1899, lng: -88.4976 }, // Belize - Belmopan
        'HND': { lat: 15.2000, lng: -86.2419 }, // Honduras - Tegucigalpa
        'SLV': { lat: 13.7942, lng: -88.8965 }, // El Salvador - San Salvador
        'NIC': { lat: 12.2650, lng: -85.2072 }, // Nicaragua - Managua
        'CRI': { lat: 9.7489, lng: -83.7534 },  // Costa Rica - San Jose
        'PAN': { lat: 8.5380, lng: -80.7821 },  // Panama - Panama City
        'CUB': { lat: 21.5218, lng: -77.7812 }, // Cuba - Havana
        'JAM': { lat: 18.1096, lng: -77.2975 }, // Jamaica - Kingston
        'HTI': { lat: 18.9712, lng: -72.2852 }, // Haiti - Port-au-Prince
        'DOM': { lat: 18.7357, lng: -70.1627 }, // Dominican Republic - Santo Domingo
        'PRI': { lat: 18.2208, lng: -66.5901 }, // Puerto Rico - San Juan
        'BRA': { lat: -14.2350, lng: -51.9253 }, // Brazil - Geographic center
        'ARG': { lat: -38.4161, lng: -63.6167 }, // Argentina - Geographic center
        'CHL': { lat: -35.6751, lng: -71.5430 }, // Chile - Geographic center
        'PER': { lat: -9.1900, lng: -75.0152 },  // Peru - Lima
        'BOL': { lat: -16.2902, lng: -63.5887 }, // Bolivia - Geographic center
        'PRY': { lat: -23.4425, lng: -58.4438 }, // Paraguay - Asuncion
        'URY': { lat: -32.5228, lng: -55.7658 }, // Uruguay - Montevideo
        'ECU': { lat: -1.8312, lng: -78.1834 },  // Ecuador - Quito
        'COL': { lat: 4.5709, lng: -74.2973 },   // Colombia - Bogota
        'VEN': { lat: 6.4238, lng: -66.5897 },   // Venezuela - Caracas
        'GUY': { lat: 4.8604, lng: -58.9302 },   // Guyana - Georgetown
        'SUR': { lat: 3.9193, lng: -56.0278 },   // Suriname - Paramaribo
        'GUF': { lat: 3.9339, lng: -53.1258 },   // French Guiana - Cayenne
        'CHN': { lat: 35.8617, lng: 104.1954 },  // China - Geographic center
        'JPN': { lat: 36.2048, lng: 138.2529 },  // Japan - Geographic center
        'KOR': { lat: 35.9078, lng: 127.7669 },  // South Korea - Seoul
        'PRK': { lat: 40.3399, lng: 127.5101 },  // North Korea - Pyongyang
        'MNG': { lat: 46.8625, lng: 103.8467 },  // Mongolia - Ulaanbaatar
        'KAZ': { lat: 48.0196, lng: 66.9237 },   // Kazakhstan - Nur-Sultan
        'UZB': { lat: 41.3775, lng: 64.5853 },   // Uzbekistan - Tashkent
        'TKM': { lat: 38.9697, lng: 59.5563 },   // Turkmenistan - Ashgabat
        'TJK': { lat: 38.8610, lng: 71.2761 },   // Tajikistan - Dushanbe
        'KGZ': { lat: 41.2044, lng: 74.7661 },   // Kyrgyzstan - Bishkek
        'AUS': { lat: -25.2744, lng: 133.7751 }, // Australia - Geographic center
        'NZL': { lat: -40.9006, lng: 174.8860 }, // New Zealand - Wellington
        'PNG': { lat: -6.3150, lng: 143.9555 },  // Papua New Guinea - Port Moresby
        'FJI': { lat: -16.7784, lng: 179.4144 }, // Fiji - Suva
        'NCL': { lat: -20.9043, lng: 165.6180 }, // New Caledonia - Noumea
        'VUT': { lat: -15.3767, lng: 166.9592 }, // Vanuatu - Port Vila
        'SLB': { lat: -9.6457, lng: 160.1562 },  // Solomon Islands - Honiara
        'TON': { lat: -21.1789, lng: -175.1982 }, // Tonga - Nuku'alofa
        'WSM': { lat: -13.7590, lng: -172.1046 }, // Samoa - Apia
        'KIR': { lat: -3.3704, lng: -168.7340 }, // Kiribati - Tarawa
        'NRU': { lat: -0.5228, lng: 166.9315 },  // Nauru - Yaren
        'TUV': { lat: -7.1095, lng: 177.6493 },  // Tuvalu - Funafuti
        'PLW': { lat: 7.5150, lng: 134.5825 },   // Palau - Ngerulmud
        'FSM': { lat: 7.4256, lng: 150.5508 },   // Micronesia - Palikir
        'MHL': { lat: 7.1315, lng: 171.1845 },   // Marshall Islands - Majuro
        'COK': { lat: -21.2367, lng: -159.7777 }, // Cook Islands - Avarua
    };

    return coordinates[iso3] || null;
}

// Parse role string to extract job title, crisis, and national society
function parseRole(roleString) {
    // Role format: "Job Title, Crisis Name, Country"
    // Example: "PMER Officer, Southeastern Earthquake, Afghanistan"
    const parts = roleString.split(',').map(p => p.trim());

    if (parts.length >= 3) {
        return {
            jobTitle: parts[0],
            crisis: parts.slice(1, -1).join(', '), // Handle multi-comma crisis names
            deployedTo: parts[parts.length - 1]
        };
    } else if (parts.length === 2) {
        return {
            jobTitle: parts[0],
            crisis: parts[1],
            deployedTo: ''
        };
    } else {
        return {
            jobTitle: roleString,
            crisis: '',
            deployedTo: ''
        };
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
        console.log(`Fetching Rapid Response Personnel from IFRC API...`);
        console.log(`IFRC API Token configured: ${IFRC_GO_API_TOKEN ? 'YES' : 'NO'}`);
        console.log(`IFRC API Base URL: ${IFRC_GO_API_BASE_URL}`);

        if (!IFRC_GO_API_TOKEN) {
            throw new Error('IFRC API token not configured');
        }

        const headers = {
            'Authorization': `Token ${IFRC_GO_API_TOKEN}`,
            'Content-Type': 'application/json'
        };

        const url = `${IFRC_GO_API_BASE_URL}/aggregated-eru-and-rapid-response/`;
        console.log(`Fetching Rapid Response data from: ${url}`);

        const response = await axios.get(url, { headers, timeout: 30000 });
        const apiData = response.data;

        if (apiData && apiData.results) {
            console.log(`Retrieved ${apiData.results.length} events with rapid response data from IFRC API`);

            // Process the events and extract personnel
            let allPersonnel = [];

            apiData.results.forEach(event => {
                if (event.deployments && event.deployments.length > 0) {
                    console.log(`Processing event "${event.name}" with ${event.deployments.length} deployments`);

                    event.deployments.forEach(deployment => {
                        const deployedToCountry = deployment.country_deployed_to;
                        const coords = getCountryCoordinates(deployedToCountry.iso3);

                        if (!coords) {
                            console.log(`No coordinates for country ${deployedToCountry.iso3}`);
                            return;
                        }

                        if (deployment.personnel && deployment.personnel.length > 0) {
                            deployment.personnel.forEach(person => {
                                // Check if deployment is still active
                                const now = new Date();
                                const endDate = person.end_date ? new Date(person.end_date) : null;
                                const isActive = !endDate || endDate > now;

                                if (!isActive) {
                                    console.log(`Filtered out personnel ${person.id}: ended on ${person.end_date}`);
                                    return;
                                }

                                // Parse role to extract components
                                const roleInfo = parseRole(person.role);

                                allPersonnel.push({
                                    id: person.id,
                                    jobTitle: roleInfo.jobTitle,
                                    crisis: roleInfo.crisis,
                                    deployedToCountry: deployedToCountry.name,
                                    deployedToCountryIso3: deployedToCountry.iso3,
                                    deployingNationalSociety: person.country_from?.society_name || 'Unknown',
                                    deployingCountry: person.country_from?.name || 'Unknown',
                                    startDate: person.start_date,
                                    endDate: person.end_date,
                                    latitude: coords.lat,
                                    longitude: coords.lng,
                                    eventName: event.name,
                                    eventId: event.id,
                                    api_source: true
                                });

                                console.log(`✅ Added personnel: ${roleInfo.jobTitle} in ${deployedToCountry.name}`);
                            });
                        }
                    });
                } else {
                    console.log(`Event "${event.name}" has no deployments`);
                }
            });

            console.log(`Returning ${allPersonnel.length} rapid response personnel`);

            return res.status(200).json({
                success: true,
                count: allPersonnel.length,
                total: allPersonnel.length,
                personnel: allPersonnel,
                source: 'IFRC API',
                pagination: {
                    has_next: !!apiData.next,
                    has_previous: !!apiData.previous
                }
            });
        }

    } catch (error) {
        console.error('Error loading Rapid Response Personnel:', error.message);
        console.error('API Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url
        });

        // Return empty array on error
        res.status(200).json({
            success: false,
            count: 0,
            total: 0,
            personnel: [],
            note: 'IFRC API temporarily unavailable',
            error: error.message
        });
    }
};
