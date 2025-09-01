// Sample health facilities data for demonstration
const sampleHealthFacilities = [
    {
        id: 'hf_1',
        name: 'Central Hospital Dhaka',
        type: 'Hospitals',
        country: 'Bangladesh',
        district: 'Dhaka',
        latitude: 23.7275,
        longitude: 90.4125,
        functionality: 'Fully Functional',
        speciality: 'Emergency Care'
    },
    {
        id: 'hf_2', 
        name: 'Community Health Center Chittagong',
        type: 'Primary Health Care Centres',
        country: 'Bangladesh',
        district: 'Chittagong',
        latitude: 22.3569,
        longitude: 91.7832,
        functionality: 'Partially Functional',
        speciality: 'Primary Care'
    },
    {
        id: 'hf_3',
        name: 'Emergency Ambulance Station Cox\'s Bazar',
        type: 'Ambulance Stations',
        country: 'Bangladesh', 
        district: 'Cox\'s Bazar',
        latitude: 21.4272,
        longitude: 92.0058,
        functionality: 'Fully Functional',
        speciality: 'Emergency Response'
    },
    {
        id: 'hf_4',
        name: 'Blood Bank Sylhet',
        type: 'Blood Centres',
        country: 'Bangladesh',
        district: 'Sylhet', 
        latitude: 24.8949,
        longitude: 91.8687,
        functionality: 'Not Functional',
        speciality: 'Blood Services'
    },
    {
        id: 'hf_5',
        name: 'Istanbul University Hospital',
        type: 'Hospitals',
        country: 'Turkey',
        district: 'Istanbul',
        latitude: 41.0082,
        longitude: 28.9784,
        functionality: 'Fully Functional',
        speciality: 'Trauma Center'
    },
    {
        id: 'hf_6',
        name: 'Ankara Emergency Response Center',
        type: 'Ambulance Stations', 
        country: 'Turkey',
        district: 'Ankara',
        latitude: 39.9334,
        longitude: 32.8597,
        functionality: 'Partially Functional',
        speciality: 'Emergency Response'
    },
    {
        id: 'hf_7',
        name: 'Manila General Hospital',
        type: 'Hospitals',
        country: 'Philippines',
        district: 'Manila',
        latitude: 14.5995,
        longitude: 120.9842,
        functionality: 'Fully Functional',
        speciality: 'General Medicine'
    },
    {
        id: 'hf_8',
        name: 'Cebu Medical Training Center',
        type: 'Training Facilities',
        country: 'Philippines',
        district: 'Cebu',
        latitude: 10.3157,
        longitude: 123.8854,
        functionality: 'Fully Functional',
        speciality: 'Medical Training'
    },
    {
        id: 'hf_9',
        name: 'Jakarta Emergency Pharmacy',
        type: 'Pharmacies',
        country: 'Indonesia',
        district: 'Jakarta',
        latitude: -6.2088,
        longitude: 106.8456,
        functionality: 'Partially Functional',
        speciality: 'Emergency Medications'
    },
    {
        id: 'hf_10',
        name: 'Surabaya Specialized Clinic',
        type: 'Specialized Services',
        country: 'Indonesia', 
        district: 'Surabaya',
        latitude: -7.2575,
        longitude: 112.7521,
        functionality: 'Not Functional',
        speciality: 'Specialized Care'
    }
];

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
        console.log('Health facilities API called');
        
        res.status(200).json({
            success: true,
            count: sampleHealthFacilities.length,
            facilities: sampleHealthFacilities
        });
        
    } catch (error) {
        console.error('Error in health facilities API:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            facilities: []
        });
    }
};