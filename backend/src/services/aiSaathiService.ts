export type AiLanguage = 'en' | 'hi' | 'mr' | 'te' | 'as' | 'mai' | 'hne' | 'kok' | 'gu' | 'bg' | 'sat' | 'kn' | 'ml' | 'mni' | 'kha' | 'lus' | 'ao' | 'or' | 'pa' | 'raj' | 'ne' | 'ta' | 'ur' | 'bn' | 'gar' | 'bho' | 'ks' | 'sd' | 'tcy';

export type AiSaathiRequest = {
  message: string;
  language: AiLanguage;
  farmerContext?: { crop?: string; quantityKg?: number; location?: string };
};

export type AiSaathiResponse = {
  state: 'SUCCESS' | 'ALERT' | 'ERROR';
  message: string;
  recommendation?: {
    crop: string;
    quantityKg: number;
    buyer: string;
    pricePerKg: number;
    estimatedNet: number;
    distanceKm: number;
    pickup: boolean;
    paymentWindow: string;
    verified: boolean;
    note: string;
  };
  action?: { type: 'CREATE_LOT'; label: string; requiresConfirmation: true };
};

const tomatoPattern = /(tomato|टोमॅटो|टमाटर)/i;
const quantityPattern = /(\d+(?:\.\d+)?)\s*(kg|kilo|किलो|किलोग्राम)/i;

function demoRecommendation(language: AiLanguage, crop: string, quantityKg: number): AiSaathiResponse {
  const gross = quantityKg * 31;
  const estimatedNet = Math.round(gross - 750 - gross * 0.04);
  const messages: Record<'mr' | 'hi' | 'en', string> = {
    mr: `तुमच्या ${quantityKg} किलो ${crop} साठी मला एक चांगला पर्याय सापडला आहे. मी फक्त किंमत नाही, तर वाहतूक आणि संभाव्य नुकसान वजा केल्यानंतरचे अंदाजे उत्पन्न पाहिले आहे.`,
    hi: `आपके ${quantityKg} किलो ${crop} के लिए मुझे एक अच्छा विकल्प मिला है। मैंने केवल कीमत नहीं, बल्कि परिवहन और संभावित नुकसान के बाद मिलने वाली अनुमानित राशि देखी है।`,
    en: `I found a good option for your ${quantityKg} kg of ${crop}. I looked beyond the price and estimated what may remain after transport and possible loss.`,
  };
  return {
    state: 'SUCCESS',
    message: messages[language === 'mr' || language === 'hi' || language === 'en' ? language : 'en'],
    recommendation: { crop, quantityKg, buyer: 'ABC Foods', pricePerKg: 31, estimatedNet, distanceKm: 18, pickup: true, paymentWindow: '48 hours', verified: true, note: language === 'mr' ? 'किंमत चांगली आणि वाहतूक खर्च कमी आहे.' : language === 'hi' ? 'कीमत अच्छी है और परिवहन खर्च कम है।' : 'The price is good and transport cost is low.' },
    action: { type: 'CREATE_LOT', label: language === 'mr' ? 'हा लॉट तयार करायचा का?' : language === 'hi' ? 'क्या यह लॉट बनाएं?' : 'Create this lot?', requiresConfirmation: true },
  };
}

export async function askAiSaathi(request: AiSaathiRequest): Promise<AiSaathiResponse> {
  const message = request.message.trim();
  if (!message) return { state: 'ERROR', message: 'Please tell me what you need.' };
  const crop = tomatoPattern.test(message) ? 'Tomato' : request.farmerContext?.crop || 'Tomato';
  const quantity = Number(message.match(quantityPattern)?.[1] || request.farmerContext?.quantityKg || 500);
  return demoRecommendation(request.language, crop, quantity);
}