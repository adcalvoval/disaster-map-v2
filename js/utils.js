// Utility functions and helpers
export class Utils {
    // Format date to DD/MM/YYYY
    static formatDate(dateString) {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString; // Return original if error
        }
    }

    static getRegionForCountry(country) {
        const regions = {
            'Africa': ['Democratic Republic of the Congo', 'Chad', 'Central African Republic', 'Niger', 'Mali', 'South Sudan',
                      'Burkina Faso', 'Guinea', 'Sierra Leone', 'Liberia', 'Somalia', 'Ethiopia', 'Sudan', 'Nigeria',
                      'Cameroon', 'Zimbabwe', 'Mozambique', 'Madagascar', 'Malawi', 'Uganda', 'Tanzania', 'Kenya',
                      'Ghana', 'Senegal', 'Rwanda', 'Burundi', 'Togo', 'Benin', 'Ivory Coast', 'Angola',
                      'Zambia', 'Botswana', 'Namibia', 'South Africa', 'Lesotho', 'Swaziland', 'Morocco',
                      'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Mauritania', 'Western Sahara', 'Gambia',
                      'Guinea-Bissau', 'Cape Verde', 'Sao Tome and Principe', 'Equatorial Guinea', 'Gabon',
                      'Republic of the Congo', 'Comoros', 'Mauritius', 'Seychelles', 'Djibouti', 'Eritrea'],
            'Asia': ['Afghanistan', 'Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Pakistan', 'Sri Lanka',
                    'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore',
                    'Thailand', 'Timor-Leste', 'Vietnam', 'China', 'Japan', 'Mongolia', 'North Korea', 'South Korea',
                    'Taiwan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan', 'Armenia',
                    'Azerbaijan', 'Bahrain', 'Cyprus', 'Georgia', 'Iraq', 'Iran', 'Israel', 'Jordan', 'Kuwait',
                    'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'],
            'Europe': ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
                      'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
                      'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
                      'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland',
                      'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
                      'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'],
            'Americas': ['Antigua and Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belize', 'Bolivia', 'Brazil',
                        'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic', 'Ecuador',
                        'El Salvador', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Mexico',
                        'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Saint Kitts and Nevis', 'Saint Lucia',
                        'Saint Vincent and the Grenadines', 'Suriname', 'Trinidad and Tobago', 'United States', 'Uruguay', 'Venezuela'],
            'Oceania': ['Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand',
                       'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu']
        };

        for (const region in regions) {
            if (regions[region].includes(country)) {
                return region;
            }
        }
        return 'Unknown';
    }

    static getCountryCoordinates(country) {
        const coordinates = {
            'Afghanistan': { lat: 33.9391, lng: 67.7100 },
            'Albania': { lat: 41.1533, lng: 19.6178 },
            'Algeria': { lat: 28.0339, lng: 1.6596 },
            'Angola': { lat: -11.2027, lng: 17.8739 },
            'Argentina': { lat: -38.4161, lng: -63.6167 },
            'Armenia': { lat: 40.0691, lng: 45.0382 },
            'Australia': { lat: -25.2744, lng: 133.7751 },
            'Austria': { lat: 47.5162, lng: 14.5501 },
            'Azerbaijan': { lat: 40.1431, lng: 47.5769 },
            'Bahrain': { lat: 26.0667, lng: 50.5577 },
            'Bangladesh': { lat: 23.6850, lng: 90.3563 },
            'Belarus': { lat: 53.7098, lng: 27.9534 },
            'Belgium': { lat: 50.5039, lng: 4.4699 },
            'Benin': { lat: 9.3077, lng: 2.3158 },
            'Bhutan': { lat: 27.5142, lng: 90.4336 },
            'Bolivia': { lat: -16.2902, lng: -63.5887 },
            'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791 },
            'Botswana': { lat: -22.3285, lng: 24.6849 },
            'Brazil': { lat: -14.2350, lng: -51.9253 },
            'Brunei': { lat: 4.5353, lng: 114.7277 },
            'Bulgaria': { lat: 42.7339, lng: 25.4858 },
            'Burkina Faso': { lat: 12.2383, lng: -1.5616 },
            'Burundi': { lat: -3.3731, lng: 29.9189 },
            'Cambodia': { lat: 12.5657, lng: 104.9910 },
            'Cameroon': { lat: 7.3697, lng: 12.3547 },
            'Canada': { lat: 56.1304, lng: -106.3468 },
            'Central African Republic': { lat: 6.6111, lng: 20.9394 },
            'Chad': { lat: 15.4542, lng: 18.7322 },
            'Chile': { lat: -35.6751, lng: -71.5430 },
            'China': { lat: 35.8617, lng: 104.1954 },
            'Colombia': { lat: 4.5709, lng: -74.2973 },
            'Democratic Republic of the Congo': { lat: -4.0383, lng: 21.7587 },
            'Republic of the Congo': { lat: -0.2280, lng: 15.8277 },
            'Costa Rica': { lat: 9.7489, lng: -83.7534 },
            'Croatia': { lat: 45.1000, lng: 15.2000 },
            'Cuba': { lat: 21.5218, lng: -77.7812 },
            'Cyprus': { lat: 35.1264, lng: 33.4299 },
            'Czech Republic': { lat: 49.8175, lng: 15.4730 },
            'Denmark': { lat: 56.2639, lng: 9.5018 },
            'Dominican Republic': { lat: 18.7357, lng: -70.1627 },
            'Ecuador': { lat: -1.8312, lng: -78.1834 },
            'Egypt': { lat: 26.0975, lng: 31.2357 },
            'El Salvador': { lat: 13.7942, lng: -88.8965 },
            'Estonia': { lat: 58.5953, lng: 25.0136 },
            'Ethiopia': { lat: 9.1450, lng: 40.4897 },
            'Finland': { lat: 61.9241, lng: 25.7482 },
            'France': { lat: 46.6034, lng: 1.8883 },
            'Gabon': { lat: -0.8037, lng: 11.6094 },
            'Gambia': { lat: 13.4432, lng: -15.3101 },
            'Georgia': { lat: 42.3154, lng: 43.3569 },
            'Germany': { lat: 51.1657, lng: 10.4515 },
            'Ghana': { lat: 7.9465, lng: -1.0232 },
            'Greece': { lat: 39.0742, lng: 21.8243 },
            'Guatemala': { lat: 15.7835, lng: -90.2308 },
            'Guinea': { lat: 9.9456, lng: -9.6966 },
            'Guinea-Bissau': { lat: 11.8037, lng: -15.1804 },
            'Guyana': { lat: 4.8604, lng: -58.9302 },
            'Haiti': { lat: 18.9712, lng: -72.2852 },
            'Honduras': { lat: 15.2000, lng: -86.2419 },
            'Hungary': { lat: 47.1625, lng: 19.5033 },
            'Iceland': { lat: 64.9631, lng: -19.0208 },
            'India': { lat: 20.5937, lng: 78.9629 },
            'Indonesia': { lat: -0.7893, lng: 113.9213 },
            'Iran': { lat: 32.4279, lng: 53.6880 },
            'Iraq': { lat: 33.2232, lng: 43.6793 },
            'Ireland': { lat: 53.4129, lng: -8.2439 },
            'Israel': { lat: 31.0461, lng: 34.8516 },
            'Italy': { lat: 41.8719, lng: 12.5674 },
            'Ivory Coast': { lat: 7.5400, lng: -5.5471 },
            'Jamaica': { lat: 18.1096, lng: -77.2975 },
            'Japan': { lat: 36.2048, lng: 138.2529 },
            'Jordan': { lat: 30.5852, lng: 36.2384 },
            'Kazakhstan': { lat: 48.0196, lng: 66.9237 },
            'Kenya': { lat: -0.0236, lng: 37.9062 },
            'Kuwait': { lat: 29.3117, lng: 47.4818 },
            'Kyrgyzstan': { lat: 41.2044, lng: 74.7661 },
            'Laos': { lat: 19.8563, lng: 102.4955 },
            'Latvia': { lat: 56.8796, lng: 24.6032 },
            'Lebanon': { lat: 33.8547, lng: 35.8623 },
            'Lesotho': { lat: -29.6100, lng: 28.2336 },
            'Liberia': { lat: 6.4281, lng: -9.4295 },
            'Libya': { lat: 26.3351, lng: 17.2283 },
            'Lithuania': { lat: 55.1694, lng: 23.8813 },
            'Luxembourg': { lat: 49.8153, lng: 6.1296 },
            'Madagascar': { lat: -18.7669, lng: 46.8691 },
            'Malawi': { lat: -13.2543, lng: 34.3015 },
            'Malaysia': { lat: 4.2105, lng: 101.9758 },
            'Mali': { lat: 17.5707, lng: -3.9962 },
            'Mauritania': { lat: 21.0079, lng: -10.9408 },
            'Mexico': { lat: 23.6345, lng: -102.5528 },
            'Moldova': { lat: 47.4116, lng: 28.3699 },
            'Mongolia': { lat: 46.8625, lng: 103.8467 },
            'Montenegro': { lat: 42.7087, lng: 19.3744 },
            'Morocco': { lat: 31.7917, lng: -7.0926 },
            'Mozambique': { lat: -18.6657, lng: 35.5296 },
            'Myanmar': { lat: 21.9162, lng: 95.9560 },
            'Namibia': { lat: -22.9576, lng: 18.4904 },
            'Nepal': { lat: 28.3949, lng: 84.1240 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'New Zealand': { lat: -40.9006, lng: 174.8860 },
            'Nicaragua': { lat: 12.8654, lng: -85.2072 },
            'Niger': { lat: 17.6078, lng: 8.0817 },
            'Nigeria': { lat: 9.0820, lng: 8.6753 },
            'North Korea': { lat: 40.3399, lng: 127.5101 },
            'Norway': { lat: 60.4720, lng: 8.4689 },
            'Oman': { lat: 21.5126, lng: 55.9233 },
            'Pakistan': { lat: 30.3753, lng: 69.3451 },
            'Panama': { lat: 8.5380, lng: -80.7821 },
            'Papua New Guinea': { lat: -6.3150, lng: 143.9555 },
            'Paraguay': { lat: -23.4425, lng: -58.4438 },
            'Peru': { lat: -9.1900, lng: -75.0152 },
            'Philippines': { lat: 12.8797, lng: 121.7740 },
            'Poland': { lat: 51.9194, lng: 19.1451 },
            'Portugal': { lat: 39.3999, lng: -8.2245 },
            'Qatar': { lat: 25.3548, lng: 51.1839 },
            'Romania': { lat: 45.9432, lng: 24.9668 },
            'Russia': { lat: 61.5240, lng: 105.3188 },
            'Rwanda': { lat: -1.9403, lng: 29.8739 },
            'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
            'Senegal': { lat: 14.4974, lng: -14.4524 },
            'Serbia': { lat: 44.0165, lng: 21.0059 },
            'Sierra Leone': { lat: 8.4606, lng: -11.7799 },
            'Singapore': { lat: 1.3521, lng: 103.8198 },
            'Slovakia': { lat: 48.6690, lng: 19.6990 },
            'Slovenia': { lat: 46.1512, lng: 14.9955 },
            'Somalia': { lat: 5.1521, lng: 46.1996 },
            'South Africa': { lat: -30.5595, lng: 22.9375 },
            'South Korea': { lat: 35.9078, lng: 127.7669 },
            'South Sudan': { lat: 6.8770, lng: 31.3070 },
            'Spain': { lat: 40.4637, lng: -3.7492 },
            'Sri Lanka': { lat: 7.8731, lng: 80.7718 },
            'Sudan': { lat: 12.8628, lng: 30.2176 },
            'Suriname': { lat: 3.9193, lng: -56.0278 },
            'Sweden': { lat: 60.1282, lng: 18.6435 },
            'Switzerland': { lat: 46.8182, lng: 8.2275 },
            'Syria': { lat: 34.8021, lng: 38.9968 },
            'Tajikistan': { lat: 38.8610, lng: 71.2761 },
            'Tanzania': { lat: -6.3690, lng: 34.8888 },
            'Thailand': { lat: 15.8700, lng: 100.9925 },
            'Togo': { lat: 8.6195, lng: 0.8248 },
            'Tunisia': { lat: 33.8869, lng: 9.5375 },
            'Turkey': { lat: 38.9637, lng: 35.2433 },
            'Turkmenistan': { lat: 38.9697, lng: 59.5563 },
            'Uganda': { lat: 1.3733, lng: 32.2903 },
            'Ukraine': { lat: 48.3794, lng: 31.1656 },
            'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
            'United Kingdom': { lat: 55.3781, lng: -3.4360 },
            'United States': { lat: 39.8283, lng: -98.5795 },
            'Uruguay': { lat: -32.5228, lng: -55.7658 },
            'Uzbekistan': { lat: 41.3775, lng: 64.5853 },
            'Venezuela': { lat: 6.4238, lng: -66.5897 },
            'Vietnam': { lat: 14.0583, lng: 108.2772 },
            'Yemen': { lat: 15.5527, lng: 48.5164 },
            'Zambia': { lat: -13.1339, lng: 27.8493 },
            'Zimbabwe': { lat: -19.0154, lng: 29.1549 }
        };
        return coordinates[country] || null;
    }

    static darkenColor(hex, factor = 0.8) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * factor * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    static parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    static isPointInPolygon(point, polygon) {
        const x = point[0], y = point[1];
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }
}