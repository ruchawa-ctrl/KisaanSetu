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
const cropPatterns: { pattern: RegExp; name: string; advice: { en: string; hi: string; mr: string } }[] = [
  { pattern: /(onion|प्याज|कांदा)/i, name: 'Onion', advice: { en: 'Sort out soft bulbs, keep onions dry and ventilated, and avoid sealed plastic bags.', hi: 'नरम प्याज अलग करें, प्याज को सूखी और हवादार जगह रखें और बंद प्लास्टिक बैग से बचें।', mr: 'नरम कांदे वेगळे करा, कांदे कोरड्या आणि हवेशीर जागी ठेवा आणि बंद प्लास्टिक पिशव्या टाळा.' } },
  { pattern: /(soybean|सोयाबीन|सोयाबीन)/i, name: 'Soybean', advice: { en: 'Dry the beans properly before bagging and ask the buyer for the moisture limit before dispatch.', hi: 'बोरी में भरने से पहले सोयाबीन अच्छी तरह सुखाएं और भेजने से पहले खरीदार से नमी की सीमा पूछें।', mr: 'पोत्यात भरण्यापूर्वी सोयाबीन नीट वाळवा आणि पाठवण्यापूर्वी खरेदीदाराकडून ओलाव्याची मर्यादा विचारा.' } },
  { pattern: /(potato|आलू|बटाटा)/i, name: 'Potato', advice: { en: 'Remove cut or green potatoes, keep the lot shaded, and use ventilated crates to reduce bruising.', hi: 'कटे या हरे आलू अलग करें, लॉट को छाया में रखें और चोट कम करने के लिए हवादार क्रेट इस्तेमाल करें।', mr: 'कापलेले किंवा हिरवे बटाटे वेगळे करा, माल सावलीत ठेवा आणि इजा कमी करण्यासाठी हवेशीर क्रेट वापरा.' } },
  { pattern: /(tomato|टोमॅटो|टमाटर)/i, name: 'Tomato', advice: { en: 'Separate ripe and firm tomatoes, use shallow crates, and dispatch quickly because quality drops during warm storage.', hi: 'पके और कड़े टमाटर अलग रखें, उथली क्रेट इस्तेमाल करें और गर्म जगह में गुणवत्ता जल्दी घटती है इसलिए जल्दी भेजें।', mr: 'पिकलेले आणि कडक टोमॅटो वेगळे ठेवा, उथल्या क्रेट वापरा आणि उष्ण ठिकाणी गुणवत्ता लवकर कमी होत असल्याने लवकर पाठवा.' } },
];

const languageText = (language: AiLanguage, text: { en: string; hi: string; mr: string }) => text[language === 'hi' || language === 'mr' ? language : 'en'];

function demoRecommendation(language: AiLanguage, crop: string, quantityKg: number): AiSaathiResponse {
  const gross = quantityKg * 31;
  const estimatedNet = Math.round(gross - 750 - gross * 0.04);
  const cropAdvice = cropPatterns.find((entry) => entry.name.toLowerCase() === crop.toLowerCase())?.advice;
  const advice = cropAdvice ? languageText(language, cropAdvice) : languageText(language, {
    en: 'Keep the produce clean, dry and graded. Separate damaged pieces before weighing.',
    hi: 'उपज को साफ, सूखा और ग्रेड के अनुसार रखें। तौलने से पहले खराब टुकड़े अलग करें।',
    mr: 'माल स्वच्छ, कोरडा आणि ग्रेडनुसार ठेवा. वजन करण्यापूर्वी खराब माल वेगळा करा.',
  });
  const messages: Record<'mr' | 'hi' | 'en', string> = {
    mr: `तुमच्या ${quantityKg} किलो ${crop} साठी माझा सल्ला:\n\n1. ${advice}\n2. आजच्या स्थानिक मंडी दराशी ABC Foods च्या ₹31/kg ऑफरची तुलना करा. वाहतूक वजा केल्यानंतर अंदाजे निव्वळ रक्कम ₹${estimatedNet.toLocaleString('en-IN')} राहू शकते.\n3. माल पाठवण्यापूर्वी वजन, दर्जा, पिकअपची वेळ आणि 48 तासांच्या पेमेंटची लिखित पुष्टी घ्या.\n\nपुढचे पाऊल: मालाचे तीन ग्रेड करा, फोटो काढा आणि ऑफर स्वीकारण्यापूर्वी वाहतूक खर्च विचारा.`,
    hi: `आपके ${quantityKg} किलो ${crop} के लिए मेरी सलाह:\n\n1. ${advice}\n2. आज की स्थानीय मंडी कीमत से ABC Foods की ₹31/kg पेशकश की तुलना करें। परिवहन घटाने के बाद अनुमानित शुद्ध राशि ₹${estimatedNet.toLocaleString('en-IN')} हो सकती है।\n3. भेजने से पहले वजन, गुणवत्ता, पिकअप समय और 48 घंटे के भुगतान की लिखित पुष्टि लें।\n\nअगला कदम: उपज को तीन ग्रेड में बांटें, फोटो लें और ऑफर स्वीकार करने से पहले परिवहन खर्च पूछें।`,
    en: `My recommendation for your ${quantityKg} kg of ${crop}:\n\n1. ${advice}\n2. Compare ABC Foods' ₹31/kg offer with today's local mandi rate. After estimated transport and handling, your net may be about ₹${estimatedNet.toLocaleString('en-IN')}.\n3. Before dispatch, confirm the weight, quality grade, pickup time, and 48-hour payment terms in writing.\n\nNext step: grade the produce into three lots, take clear photos, and ask for the transport charge before accepting the offer.`,
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
  const lowerMessage = message.toLowerCase();
  const matchedCrop = cropPatterns.find((entry) => entry.pattern.test(message));
  const crop = matchedCrop?.name || (tomatoPattern.test(message) ? 'Tomato' : request.farmerContext?.crop || 'Tomato');
  const wantsPrice = /(price|rate|mandi|भाव|कीमत|दाम|दर|किंमत|बाजार)/i.test(message);
  const wantsCropCare = /(water|irrigat|pest|disease|fertil|रोग|कीट|पानी|सिंच|खत|फवार)/i.test(message);
  const wantsSaleAdvice = /(sell|sale|buyer|offer|बेच|विक्री|खरीदार|ऑफर|should i (sell|accept|wait))/i.test(message);
  const isGreeting = /^(hi|hello|hey|namaste|नमस्ते|नमस्कार|हाय)[!. ]*$/i.test(lowerMessage);

  if (isGreeting) {
    return { state: 'SUCCESS', message: languageText(request.language, {
      en: 'Namaskar! Ask me about today\'s mandi rate, whether to sell your crop, irrigation, pests, or post-harvest storage.',
      hi: 'नमस्कार! आप आज की मंडी कीमत, फसल बेचने का सही समय, सिंचाई, कीट या भंडारण के बारे में पूछ सकते हैं।',
      mr: 'नमस्कार! आजचा मंडी दर, पीक विकण्याची योग्य वेळ, सिंचन, कीड किंवा साठवणुकीबद्दल विचारा.',
    }) };
  }

  if (wantsPrice && !wantsSaleAdvice) {
    return { state: 'SUCCESS', message: languageText(request.language, {
      en: `For ${crop}, compare today\'s local mandi modal price with the buyer offer before selling. The demo market reference is ₹${crop === 'Onion' ? '2,450' : '2,180'}/quintal; confirm the current rate, grade, arrivals, and commission at your nearest mandi because prices change during the day.`,
      hi: `${crop} के लिए बेचने से पहले आज की स्थानीय मंडी की औसत कीमत और खरीदार की पेशकश की तुलना करें। डेमो बाजार संदर्भ ₹${crop === 'Onion' ? '2,450' : '2,180'} प्रति क्विंटल है; मंडी में वर्तमान दर, गुणवत्ता, आवक और कमीशन की पुष्टि करें क्योंकि कीमत दिन में बदल सकती है।`,
      mr: `${crop} विकण्यापूर्वी आजच्या स्थानिक मंडीतील सरासरी दराची खरेदीदाराच्या ऑफरशी तुलना करा. डेमो बाजार संदर्भ ₹${crop === 'Onion' ? '2,450' : '2,180'} प्रति क्विंटल आहे; दर, दर्जा, आवक आणि कमिशन मंडीत तपासा कारण किंमत दिवसभर बदलू शकते.`,
    }) };
  }

  if (wantsCropCare && !wantsSaleAdvice) {
    const irrigationAdvice = /(irrigat|water|सिंच|पानी)/i.test(message) ? {
      en: `For ${crop}, check the top 5 cm of soil before watering. Irrigate when it starts to dry, keep the soil moist but never waterlogged, and reduce watering as harvest approaches. For onion, avoid standing water because it increases bulb rot risk.`,
      hi: `${crop} में पानी देने से पहले ऊपर की 5 सेमी मिट्टी जांचें। मिट्टी सूखने लगे तभी सिंचाई करें, खेत में पानी जमा न होने दें और कटाई नजदीक आने पर पानी कम करें। प्याज में पानी जमा होने से सड़न बढ़ सकती है।`,
      mr: `${crop} साठी पाणी देण्यापूर्वी वरची 5 सेमी माती तपासा. माती कोरडी होऊ लागल्यावरच सिंचन करा, पाणी साचू देऊ नका आणि कापणी जवळ आल्यावर पाणी कमी करा. कांद्यात पाणी साचल्यास कंद सडण्याचा धोका वाढतो.`,
    } : null;
    const advice = irrigationAdvice || cropPatterns.find((entry) => entry.name === crop)?.advice || {
      en: 'Check soil moisture before watering, inspect a few plants for symptoms, and use only crop-labelled treatments after confirming the pest or disease.',
      hi: 'पानी देने से पहले मिट्टी की नमी जांचें, कुछ पौधों में लक्षण देखें और कीट या रोग की पुष्टि के बाद ही फसल के लिए स्वीकृत उपचार करें।',
      mr: 'पाणी देण्यापूर्वी मातीतील ओलावा तपासा, काही झाडांची लक्षणे पाहा आणि कीड किंवा रोगाची खात्री झाल्यावरच पिकासाठी मंजूर उपचार वापरा.',
    };
    return { state: 'SUCCESS', message: languageText(request.language, advice) };
  }

  if (!wantsSaleAdvice && !wantsPrice) {
    return { state: 'ALERT', message: languageText(request.language, {
      en: 'I want to give you a useful answer. Tell me the crop and one goal, for example: “onion price today”, “should I sell 500 kg tomato?”, or “how often should I irrigate onion?”.',
      hi: 'मैं आपको सही सलाह देना चाहता हूँ। फसल और अपना सवाल बताएं, जैसे: “आज प्याज का भाव”, “क्या 500 किलो टमाटर बेचूं?”, या “प्याज में कितनी सिंचाई करें?”',
      mr: 'मला तुम्हाला योग्य सल्ला द्यायचा आहे. पीक आणि प्रश्न सांगा, उदा.: “आज कांद्याचा दर”, “500 किलो टोमॅटो विकू का?”, किंवा “कांद्याला किती सिंचन द्यावे?”',
    }) };
  }

  const quantity = Number(message.match(quantityPattern)?.[1] || request.farmerContext?.quantityKg || 500);
  return demoRecommendation(request.language, crop, quantity);
}