// Bundled Static Indian Cities Dataset & Nearest City Matcher
// Eliminates external Geocoding API costs and dependencies.

export interface CityData {
  nameHindi: string;
  nameEnglish: string;
  lat: number;
  lng: number;
  state: string;
}

export const INDIAN_CITIES: CityData[] = [
  // Maharashtra
  { nameHindi: 'पिंपरी-चिंचवड', nameEnglish: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997, state: 'Maharashtra' },
  { nameHindi: 'पुणे', nameEnglish: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { nameHindi: 'मुंबई', nameEnglish: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { nameHindi: 'ठाणे', nameEnglish: 'Thane', lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  { nameHindi: 'नवी मुंबई', nameEnglish: 'Navi Mumbai', lat: 19.0330, lng: 73.0297, state: 'Maharashtra' },
  { nameHindi: 'कल्याण-डोंबिवली', nameEnglish: 'Kalyan-Dombivli', lat: 19.2403, lng: 73.1305, state: 'Maharashtra' },
  { nameHindi: 'वसई-विरार', nameEnglish: 'Vasai-Virar', lat: 19.3919, lng: 72.8397, state: 'Maharashtra' },
  { nameHindi: 'नासिक', nameEnglish: 'Nashik', lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  { nameHindi: 'नागपुर', nameEnglish: 'Nagpur', lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  { nameHindi: 'छत्रपति संभाजीनगर', nameEnglish: 'Chhatrapati Sambhajinagar', lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  { nameHindi: 'सोलापूर', nameEnglish: 'Solapur', lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  { nameHindi: 'कोल्हापूर', nameEnglish: 'Kolhapur', lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  { nameHindi: 'अमरावती', nameEnglish: 'Amravati', lat: 20.9320, lng: 77.7523, state: 'Maharashtra' },
  { nameHindi: 'नांदेड', nameEnglish: 'Nanded', lat: 19.1383, lng: 77.3210, state: 'Maharashtra' },
  { nameHindi: 'जलगांव', nameEnglish: 'Jalgaon', lat: 21.0077, lng: 75.5626, state: 'Maharashtra' },
  { nameHindi: 'धुले', nameEnglish: 'Dhule', lat: 20.9042, lng: 74.7749, state: 'Maharashtra' },

  // Delhi NCR & North
  { nameHindi: 'दिल्ली NCR', nameEnglish: 'Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { nameHindi: 'नोएडा', nameEnglish: 'Noida', lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  { nameHindi: 'ग्रेटर नोएडा', nameEnglish: 'Greater Noida', lat: 28.4744, lng: 77.5040, state: 'Uttar Pradesh' },
  { nameHindi: 'गुरुग्राम', nameEnglish: 'Gurugram', lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  { nameHindi: 'गाजियाबाद', nameEnglish: 'Ghaziabad', lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
  { nameHindi: 'फरीदाबाद', nameEnglish: 'Faridabad', lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  { nameHindi: 'चंडीगढ़', nameEnglish: 'Chandigarh', lat: 30.7333, lng: 76.7794, state: 'Punjab/Haryana' },
  { nameHindi: 'लुधियाना', nameEnglish: 'Ludhiana', lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  { nameHindi: 'अमृतसर', nameEnglish: 'Amritsar', lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  { nameHindi: 'जालंधर', nameEnglish: 'Jalandhar', lat: 31.3260, lng: 75.5762, state: 'Punjab' },
  { nameHindi: 'देहरादून', nameEnglish: 'Dehradun', lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  { nameHindi: 'हरिद्वार', nameEnglish: 'Haridwar', lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  { nameHindi: 'जम्मू', nameEnglish: 'Jammu', lat: 32.7266, lng: 74.8570, state: 'Jammu & Kashmir' },
  { nameHindi: 'श्रीनगर', nameEnglish: 'Srinagar', lat: 34.0837, lng: 74.7973, state: 'Jammu & Kashmir' },

  // Uttar Pradesh & Bihar
  { nameHindi: 'लखनऊ', nameEnglish: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  { nameHindi: 'कानपुर', nameEnglish: 'Kanpur', lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  { nameHindi: 'वाराणसी', nameEnglish: 'Varanasi', lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  { nameHindi: 'प्रयागराज', nameEnglish: 'Prayagraj', lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  { nameHindi: 'आगरा', nameEnglish: 'Agra', lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  { nameHindi: 'मेरठ', nameEnglish: 'Meerut', lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  { nameHindi: 'बरेली', nameEnglish: 'Bareilly', lat: 28.3670, lng: 79.4304, state: 'Uttar Pradesh' },
  { nameHindi: 'अलीगढ़', nameEnglish: 'Aligarh', lat: 27.8974, lng: 78.0880, state: 'Uttar Pradesh' },
  { nameHindi: 'गोरखपुर', nameEnglish: 'Gorakhpur', lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh' },
  { nameHindi: 'पटना', nameEnglish: 'Patna', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  { nameHindi: 'गया', nameEnglish: 'Gaya', lat: 24.7914, lng: 85.0002, state: 'Bihar' },
  { nameHindi: 'मुजफ्फरपुर', nameEnglish: 'Muzaffarpur', lat: 26.1209, lng: 85.3647, state: 'Bihar' },

  // Karnataka, Telangana, Andhra Pradesh, Tamil Nadu, Kerala
  { nameHindi: 'बेंगलुरु', nameEnglish: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { nameHindi: 'मैसूर', nameEnglish: 'Mysuru', lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  { nameHindi: 'हुबली-धारवाड़', nameEnglish: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  { nameHindi: 'मंगलोर', nameEnglish: 'Mangaluru', lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  { nameHindi: 'हैदराबाद', nameEnglish: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { nameHindi: 'वारंगल', nameEnglish: 'Warangal', lat: 17.9689, lng: 79.5941, state: 'Telangana' },
  { nameHindi: 'विशाखापट्टनम', nameEnglish: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  { nameHindi: 'विजयवाड़ा', nameEnglish: 'Vijayawada', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  { nameHindi: 'गुंटूर', nameEnglish: 'Guntur', lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' },
  { nameHindi: 'चेन्नई', nameEnglish: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { nameHindi: 'कोयंबटूर', nameEnglish: 'Coimbatore', lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  { nameHindi: 'मदुरै', nameEnglish: 'Madurai', lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  { nameHindi: 'तिरुचिरापल्ली', nameEnglish: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  { nameHindi: 'कोच्चि', nameEnglish: 'Kochi', lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  { nameHindi: 'तिरुवनंतपुरम', nameEnglish: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  { nameHindi: 'कोझिकोड', nameEnglish: 'Kozhikode', lat: 11.2588, lng: 75.7804, state: 'Kerala' },

  // Gujarat & Rajasthan
  { nameHindi: 'अहमदाबाद', nameEnglish: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  { nameHindi: 'सूरत', nameEnglish: 'Surat', lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  { nameHindi: 'वडोदरा', nameEnglish: 'Vadodara', lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  { nameHindi: 'राजकोट', nameEnglish: 'Rajkot', lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  { nameHindi: 'गांधीनगर', nameEnglish: 'Gandhinagar', lat: 23.2156, lng: 72.6369, state: 'Gujarat' },
  { nameHindi: 'जयपुर', nameEnglish: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  { nameHindi: 'जोधपुर', nameEnglish: 'Jodhpur', lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  { nameHindi: 'उदयपुर', nameEnglish: 'Udaipur', lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  { nameHindi: 'कोटा', nameEnglish: 'Kota', lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  { nameHindi: 'बीकानेर', nameEnglish: 'Bikaner', lat: 28.0229, lng: 73.3119, state: 'Rajasthan' },

  // MP, Chhattisgarh, West Bengal, Odisha, Assam, Jharkhand
  { nameHindi: 'इंदौर', nameEnglish: 'Indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  { nameHindi: 'भोपाल', nameEnglish: 'Bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  { nameHindi: 'ग्वालियर', nameEnglish: 'Gwalior', lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  { nameHindi: 'जबलपुर', nameEnglish: 'Jabalpur', lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  { nameHindi: 'उज्जैन', nameEnglish: 'Ujjain', lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  { nameHindi: 'रायपुर', nameEnglish: 'Raipur', lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  { nameHindi: 'बिलासपुर', nameEnglish: 'Bilaspur', lat: 22.0797, lng: 82.1391, state: 'Chhattisgarh' },
  { nameHindi: 'कोलकाता', nameEnglish: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { nameHindi: 'हावड़ा', nameEnglish: 'Howrah', lat: 22.5958, lng: 88.2636, state: 'West Bengal' },
  { nameHindi: 'सिलीगुड़ी', nameEnglish: 'Siliguri', lat: 26.7271, lng: 88.3953, state: 'West Bengal' },
  { nameHindi: 'भुवनेश्वर', nameEnglish: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  { nameHindi: 'कटक', nameEnglish: 'Cuttack', lat: 20.4625, lng: 85.8828, state: 'Odisha' },
  { nameHindi: 'रांची', nameEnglish: 'Ranchi', lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  { nameHindi: 'जमशेदपुर', nameEnglish: 'Jamshedpur', lat: 22.8046, lng: 86.2029, state: 'Jharkhand' },
  { nameHindi: 'धनबाद', nameEnglish: 'Dhanbad', lat: 23.7957, lng: 86.4304, state: 'Jharkhand' },
  { nameHindi: 'गुवाहाटी', nameEnglish: 'Guwahati', lat: 26.1445, lng: 91.7362, state: 'Assam' }
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Indian city for given GPS coordinates.
 */
export function getNearestIndianCity(lat: number, lng: number): CityData {
  let nearestCity = INDIAN_CITIES[0];
  let minDistance = Infinity;

  for (const city of INDIAN_CITIES) {
    const dist = haversineDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  return nearestCity;
}
