import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  CircleHelp,
  HandCoins,
  Leaf,
  LogOut,
  Menu,
  MessageSquareText,
  Mic,
  Moon,
  ScanLine,
  Send,
  ShieldCheck,
  Sprout,
  Sun,
  Truck,
  X,
} from "lucide-react";
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
});
const storedToken = localStorage.getItem("kisaan_setu_token");
if (storedToken) api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
type Role = "farmer" | "buyer";
type DashboardTab = "marketplace" | "prices" | "activity";
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
};
const getCropVisual = (crop: string) => {
  const name = crop.toLowerCase();
  if (name.includes("onion")) return "🧅";
  if (name.includes("soybean")) return "🫘";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("potato")) return "🥔";
  if (name.includes("chilli")) return "🌶️";
  if (name.includes("maize") || name.includes("corn")) return "🌽";
  return "🌾";
};
const getGreeting = (fallback: SupportedLanguage) => {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()));
  if (fallback === "hi") return hour < 12 ? "सुप्रभात" : hour < 17 ? "शुभ दोपहर" : "शुभ संध्या";
  if (fallback === "mr") return hour < 12 ? "शुभ सकाळ" : hour < 17 ? "शुभ दुपार" : "शुभ संध्याकाळ";
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};
const getInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KS";
type PriceRecord = { mandiName: string; cropName: string; modalPrice: number; minPrice: number; maxPrice: number; arrivalVolumeTonnes: number; recordedDate: string };
type ActivityData = { lots: { id: string; cropName: string; variety: string; weightKg: number; qualityGrade: string; status: string; basePrice: number; createdAt: string }[]; demands: { id: string; cropName: string; requiredQuantityKg: number; maxPrice: number; status: string; createdAt: string }[]; transactions: { id: string; totalAmount: number; escrowStatus: string; createdAt: string; lot: { cropName: string; weightKg: number } }[]; offers: { id: string; status: string; message?: string; demand: { id: string; cropName: string; requiredQuantityKg: number; maxPrice: number; status: string; destinationPincode: string }; farmer?: { name: string; phone: string; verificationStatus: string; rating: number }; lot: { id: string; cropName: string; variety: string; weightKg: number; basePrice: number; qualityGrade: string; status: string } }[]; openDemands: { id: string; cropName: string; targetGrade: string; requiredQuantityKg: number; maxPrice: number; destinationPincode: string; createdAt: string; buyer: { name: string; verificationStatus: string } }[] };
type SupportedLanguage = "en" | "hi" | "mr";
type AssistantMessage = { id: number; sender: "user" | "bot"; text: string; language: SupportedLanguage };
type Language = SupportedLanguage | "te" | "as" | "mai" | "hne" | "kok" | "gu" | "bg" | "sat" | "kn" | "ml" | "mni" | "kha" | "lus" | "ao" | "or" | "pa" | "raj" | "ne" | "ta" | "ur" | "bn" | "gar" | "bho" | "ks" | "sd" | "tcy";
const assistantLanguageOptions: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
];
const detectAssistantLanguage = (text: string): SupportedLanguage => {
  const cleaned = text.trim();
  if (!cleaned) return "en";
  if (/[\u0900-\u097F]/.test(cleaned)) {
    const lower = cleaned.toLowerCase();
    const marathiKeywords = ["शेतकरी", "शेती", "किंमत", "कापणी", "बाजार", "ताजे", "पिक", "आवश्यक", "माल", "उत्पादन", "लेबर", "बारमाही", "सिंचन", "खत", "उत्पादन"]; 
    if (marathiKeywords.some((keyword) => lower.includes(keyword.toLowerCase()))) {
      return "mr";
    }
    return "hi";
  }
  return "en";
};
const buildAssistantReply = (message: string, language: SupportedLanguage): string => {
  const lower = message.toLowerCase().trim();
  const priceHints: Record<string, string> = {
    en: "For most crops, check the mandi price in the Prices tab before selling. If you are growing onion or soybean, it is best to compare today’s rate with your local mandi before you decide.",
    hi: "अधिकांश फसलों के लिए बेचने से पहले कीमतों वाली टैब से मंडी की कीमत की तुलना करें। अगर आप प्याज या सोयाबीन बेच रहे हैं, तो आज की कीमत अपने स्थानीय मंडी से तुलना करना सबसे सही रहेगा।",
    mr: "बहुतेक पिकांची किंमत विकण्यापूर्वी किंमत टॅबमधून मंडयांच्या दराशी तुलना करा. प्याज किंवा सोयाबीन विकत असाल, तर आजचा दर तुमच्या स्थानिक मंडीत असल्याची पडताळणी करणे योग्य ठरेल.",
  };
  if (!lower || /(hi|hello|namaste|नमस्कार|नमस्ते|good morning|शुभ|नमस्कार)/.test(lower)) {
    if (language === "hi") return "नमस्कार! मैं आपकी खेती, मंडी दर, और फसल सहायता में मदद कर सकता हूँ। आप मुझे कुछ भी पूछ सकते हैं, जैसे फसल का दाम, सिंचाई, कीट नियंत्रण, या बिक्री का सही समय।";
    if (language === "mr") return "नमस्कार! मी शेतकरी मदत म्हणून तुमच्या पिकांच्या किंमती, सिंचन, कीटक नियंत्रण आणि विक्री वेळेवर मदत करू शकतो. काहीही विचारा.";
    return "Hello! I can help with mandi prices, crop care, irrigation, pest control, and the best time to sell your produce.";
  }
  if (/(price|rate|mandi|qtl|cost|sell|market|कीमत|मूल्य|मंडी|बाजार|किंमत|विक्री)/.test(lower)) {
    return priceHints[language] || priceHints.en;
  }
  if (/(water|irrigation|rain|dry|sowing|field|सिंचाई|पानी|खेत|सींच|रोग|कीट|दवा|of|कीटाणु)/.test(lower)) {
    if (language === "hi") return "सिंचाई के लिए मिट्टी की नमी देखें, और अगर जमीन सूखी है तो उचित समय पर पानी दें। कीटों की समस्या होने पर फसल की अवस्था देखकर सुरक्षित कीटनाशक का उपयोग करें और अपने एग्री एक्सपर्ट से सलाह लें।";
    if (language === "mr") return "सिंचनासाठी मातीतील ओलताकडे पाहा. जमीन कोरडी असल्यास योग्यवेळी पाणी द्या. कीटकांची समस्या असल्यास पिकाची अवस्था तपासा आणि सुरक्षित कीटकनाशक वापरा, गरज पडल्यास अॅग्री तज्ज्ञांची सल्ला घ्या.";
    return "Check the soil moisture before irrigation. If the field is dry, water at the appropriate time. For pests, identify the issue first and use a safe treatment recommended for the crop.";
  }
  if (/(quality|grade|sample|crop|fresh|good|grace|गुणवत्ता|ग्रेड|नमूना|ताजे|उपज|श्रेणी)/.test(lower)) {
    if (language === "hi") return "सामान्यतः अच्छी गुणवत्ता के लिए फसल को सही समय पर कटाई करें, साफ रखें और छाया में न रखें। अगर आप ग्रेडिंग करना चाहते हैं, तो 'AI QUALITY DESK' सेक्शन में नमूना अपलोड करें।";
    if (language === "mr") return "चांगल्या गुणवत्तेसाठी पिकाची योग्यवेळी कापणी करा, स्वच्छ ठेवणं, आणि थंड जागी ठेवणं गरजेचं आहे. ग्रेडिंगसाठी AI QUALITY DESK मधील नमुना अपलोड करा.";
    return "For better quality, harvest at the right time, keep the produce clean, and avoid storing it in direct sun. Use the AI QUALITY DESK to grade your crop sample.";
  }
  if (/(loan|money|scheme|subsidy|support|कर्ज|सहायता|योजना|अनुदान|लाभ)/.test(lower)) {
    if (language === "hi") return "कृषि सहायता या अनुदान के लिए अपने क्षेत्र की कृषि कार्यालय, सहकारी बैंक, और FPO से संपर्क करें। अक्सर सिंचाई, बीज, और फसल बीमा योजनाओं पर सब्सिडी मिलती है।";
    if (language === "mr") return "शेतीसाठी कर्ज किंवा अनुदान मिळवण्यासाठी आपल्या जिल्हा कृषी कार्यालय, सहकारी बँक किंवा FPO शी संपर्क करा. बारमाही, बियाणे आणि पीक विम्यांवर सवलत उपलब्ध असते.";
    return "For crop loans, subsidies, or support schemes, contact your local agriculture office, cooperative bank, or nearby FPO. Many schemes support irrigation, seed, and crop insurance.";
  }
  if (/(weather|rain|forecast|season|monsoon|मौसम|बारिश|मौसमी|मानसून)/.test(lower)) {
    if (language === "hi") return "मौसम के आधार पर सिंचाई और कटाई का समय तय करें। अगर बारिश का अनुमान है, तो तुरंत कटाई की योजना बनाएं ताकि फसल की गुणवत्ता खराब न हो।";
    if (language === "mr") return "हवामानानुसार सिंचन आणि कापणीची वेळ ठरवा. पावसाचा अंदाज असल्यास पिकाची गुणवत्ता जपण्यासाठी लवकर कापणी किंवा संरक्षण करा.";
    return "Time irrigation and harvest based on the weather forecast. If rain is expected, prepare early to protect crop quality and avoid losses.";
  }
  if (/(farmer|help|assistant|ask|question|किसान|मदद|सवाल|सल्ला)/.test(lower)) {
    if (language === "hi") return "मैं आपकी फसल, मंडी मूल्य, बीज, सिंचाई, और बिक्री संबंधी सामान्य सवालों में मदद कर सकता हूँ। उदाहरण: 'मेरी फसल का भाव क्या है?', 'पानी कब देना है?', 'कीट नियंत्रण कैसे करें?'";
    if (language === "mr") return "मी तुमच्या पिकांची किंमत, सिंचन, बियाणे, कीटक नियंत्रण आणि विक्रीशी संबंधित सामान्य प्रश्नांमध्ये मदत करू शकतो. उदाहरण: 'माझ्या पिकाची किंमत काय आहे?', 'पाणी कधी द्यायचे?', 'कीटक नियंत्रण कसे करायचे?'";
    return "I can help with common farmer questions about crop price, irrigation, pest control, seed selection, and the best time to sell.";
  }
  if (language === "hi") return "मुझे आपके सवाल के बारे में अधिक स्पष्टता चाहिए. आप फसल, मंडी दर, सिंचाई, कीट नियंत्रण या बिक्री का समय पूछ सकते हैं.";
  if (language === "mr") return "तुमच्या प्रश्नाबद्दल अधिक स्पष्टता हवी आहे. पिक, मंडी किंमत, सिंचन, कीटक नियंत्रण किंवा विक्रीची वेळ याबद्दल विचारा.";
  return "I can help with that. Try asking about mandi prices, crop care, pest control, irrigation, or the best selling window for your produce.";
};
const languageOptions: { code: Language; label: string; state: string; fallback: SupportedLanguage }[] = [
  { code: "te", label: "తెలుగు", state: "Andhra Pradesh / Telangana", fallback: "en" },
  { code: "as", label: "অসমীয়া", state: "Assam", fallback: "en" },
  { code: "mai", label: "मैथिली", state: "Bihar", fallback: "hi" },
  { code: "hne", label: "छत्तीसगढ़ी", state: "Chhattisgarh", fallback: "hi" },
  { code: "kok", label: "कोंकणी", state: "Goa", fallback: "mr" },
  { code: "gu", label: "ગુજરાતી", state: "Gujarat", fallback: "hi" },
  { code: "bg", label: "बागड़ी", state: "Haryana / Rajasthan", fallback: "hi" },
  { code: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ", state: "Jharkhand", fallback: "hi" },
  { code: "kn", label: "ಕನ್ನಡ", state: "Karnataka", fallback: "en" },
  { code: "ml", label: "മലയാളം", state: "Kerala", fallback: "en" },
  { code: "mni", label: "মৈতৈলোন্", state: "Manipur", fallback: "en" },
  { code: "kha", label: "Khasi", state: "Meghalaya", fallback: "en" },
  { code: "lus", label: "Mizo", state: "Mizoram", fallback: "en" },
  { code: "ao", label: "Ao", state: "Nagaland", fallback: "en" },
  { code: "or", label: "ଓଡ଼ିଆ", state: "Odisha", fallback: "en" },
  { code: "pa", label: "ਪੰਜਾਬੀ", state: "Punjab", fallback: "hi" },
  { code: "raj", label: "राजस्थानी", state: "Rajasthan", fallback: "hi" },
  { code: "ne", label: "नेपाली", state: "Sikkim", fallback: "hi" },
  { code: "ta", label: "தமிழ்", state: "Tamil Nadu", fallback: "en" },
  { code: "ur", label: "اردو", state: "Jammu and Kashmir", fallback: "hi" },
  { code: "bn", label: "বাংলা", state: "Tripura / West Bengal", fallback: "hi" },
  { code: "gar", label: "गढ़वाली", state: "Uttarakhand", fallback: "hi" },
  { code: "bho", label: "भोजपुरी", state: "Uttar Pradesh / Bihar", fallback: "hi" },
  { code: "ks", label: "कॉशुर", state: "Jammu and Kashmir", fallback: "hi" },
  { code: "sd", label: "सिन्धी", state: "Gujarat / Rajasthan", fallback: "hi" },
  { code: "tcy", label: "ತುಳು", state: "Karnataka", fallback: "en" },
  { code: "en", label: "English", state: "All states", fallback: "en" },
  { code: "hi", label: "हिंदी", state: "Hindi belt", fallback: "hi" },
  { code: "mr", label: "मराठी", state: "Maharashtra", fallback: "mr" },
];
const copy = {
  en: {
    language: "Language",
    marketplace: "Marketplace", prices: "Price intelligence", activity: "My activity", help: "Help",
    viewingAs: "Viewing as", farmer: "Farmer", buyer: "Buyer", goodMorning: "Good morning", farmerIntro: "Your harvest is moving with the market.", buyerIntro: "Source better produce, directly from the people who grow it.",
    portfolio: "Portfolio value", thisWeek: "this week", activeLots: "Active lots", awaitingGrading: "2 awaiting grading", trustScore: "Trust score", verifiedProfile: "Verified profile", onTime: "On-time delivery", acrossOrders: "Across 12 orders",
    decisionSupport: "DECISION SUPPORT", marketPulse: "Market pulse", viewPrices: "View all prices", holdWindow: "Hold for a stronger window", sellWindow: "Recommended sell window", expected: "expected", qualityDesk: "AI QUALITY DESK", gradeNext: "Grade your next lot", gradeIntro: "Upload a crop sample and receive an instant trade grade before you list.", startGrading: "Start grading", ready: "Ready for grading",
    inventory: "YOUR INVENTORY", harvestLots: "Harvest lots", addLot: "Add lot", listed: "Listed 2 days ago", procurement: "DIRECT PROCUREMENT", availableHarvest: "Available harvest", createRfq: "Create RFQ", reviewLot: "Review lot", fulfilment: "FULFILMENT", activeOrders: "Active orders", escrowProtected: "Escrow protected", inTransit: "IN TRANSIT", verifyDelivery: "Verify delivery",
    scan: "Scan crop sample",
    choose: "Choose a JPG or PNG from your device",
    upload: "Upload sample",
    fileLimit: "JPG or PNG · up to 10 MB", chooseFile: "Choose file", cropDesk: "AI QUALITY DESK", publishRequirement: "Publish a requirement", crop: "Crop", quantity: "Quantity (kg)", maximumPrice: "Maximum price / qtl", publishRfq: "Publish RFQ", today: "Today", qrReady: "QR verification ready for delivery", authTitle: "Kisaan Setu access", login: "Sign in", register: "Create farmer account", name: "Full name", phone: "Phone number", password: "Password", confirmPassword: "Confirm password", signIn: "Sign in securely", createAccount: "Create account", noAccount: "New to Kisaan Setu?", hasAccount: "Already registered?", switchRegister: "Register here", switchLogin: "Sign in here", authNote: "Your password is encrypted and stored securely.", demoAccess: "Continue in demo mode", demoNote: "Use the dashboard without a database connection.", readingImage: "Reading image...", gradingUnavailable: "Image could not be graded. Check that the ML service is running on port 8000.", languagePreference: "Preferred language",
  },
  hi: {
    language: "भाषा",
    marketplace: "बाज़ार", prices: "मूल्य जानकारी", activity: "मेरी गतिविधि", help: "सहायता",
    viewingAs: "इस रूप में देखें", farmer: "किसान", buyer: "खरीदार", goodMorning: "सुप्रभात", farmerIntro: "आपकी फसल बाज़ार के साथ आगे बढ़ रही है।", buyerIntro: "उत्पादकों से सीधे बेहतर उपज प्राप्त करें।",
    portfolio: "पोर्टफोलियो मूल्य", thisWeek: "इस सप्ताह", activeLots: "सक्रिय लॉट", awaitingGrading: "2 ग्रेडिंग की प्रतीक्षा में", trustScore: "विश्वास स्कोर", verifiedProfile: "सत्यापित प्रोफ़ाइल", onTime: "समय पर डिलीवरी", acrossOrders: "12 ऑर्डर में",
    decisionSupport: "निर्णय सहायता", marketPulse: "बाज़ार स्थिति", viewPrices: "सभी कीमतें देखें", holdWindow: "बेहतर समय के लिए रोकें", sellWindow: "अनुशंसित बिक्री समय", expected: "अनुमानित", qualityDesk: "एआई गुणवत्ता केंद्र", gradeNext: "अपनी अगली फसल ग्रेड करें", gradeIntro: "लिस्ट करने से पहले नमूना अपलोड करें और तुरंत व्यापार ग्रेड पाएं।", startGrading: "ग्रेडिंग शुरू करें", ready: "ग्रेडिंग के लिए तैयार",
    inventory: "आपका स्टॉक", harvestLots: "फसल लॉट", addLot: "लॉट जोड़ें", listed: "2 दिन पहले सूचीबद्ध", procurement: "सीधी खरीद", availableHarvest: "उपलब्ध फसल", createRfq: "आरएफक्यू बनाएं", reviewLot: "लॉट देखें", fulfilment: "पूर्ति", activeOrders: "सक्रिय ऑर्डर", escrowProtected: "एस्क्रो सुरक्षित", inTransit: "रास्ते में", verifyDelivery: "डिलीवरी सत्यापित करें",
    scan: "फसल का नमूना स्कैन करें",
    choose: "अपने डिवाइस से JPG या PNG चुनें",
    upload: "नमूना अपलोड करें",
    fileLimit: "JPG या PNG · अधिकतम 10 MB", chooseFile: "फ़ाइल चुनें", cropDesk: "एआई गुणवत्ता केंद्र", publishRequirement: "आवश्यकता प्रकाशित करें", crop: "फसल", quantity: "मात्रा (किग्रा)", maximumPrice: "अधिकतम कीमत / क्विंटल", publishRfq: "आरएफक्यू प्रकाशित करें", today: "आज", qrReady: "डिलीवरी के लिए क्यूआर सत्यापन तैयार है", authTitle: "किसान सेतु प्रवेश", login: "लॉग इन", register: "किसान खाता बनाएं", name: "पूरा नाम", phone: "फ़ोन नंबर", password: "पासवर्ड", confirmPassword: "पासवर्ड की पुष्टि करें", signIn: "सुरक्षित लॉग इन", createAccount: "खाता बनाएं", noAccount: "किसान सेतु पर नए हैं?", hasAccount: "पहले से पंजीकृत हैं?", switchRegister: "यहां पंजीकरण करें", switchLogin: "यहां लॉग इन करें", authNote: "आपका पासवर्ड एन्क्रिप्ट करके सुरक्षित रखा जाता है।", demoAccess: "डेमो मोड में जारी रखें", demoNote: "डेटाबेस कनेक्शन के बिना डैशबोर्ड का उपयोग करें।", readingImage: "छवि पढ़ी जा रही है...", gradingUnavailable: "छवि ग्रेड नहीं हो सकी। जांचें कि ML सेवा पोर्ट 8000 पर चल रही है।", languagePreference: "पसंदीदा भाषा",
  },
  mr: {
    language: "भाषा",
    marketplace: "बाजार", prices: "किंमत माहिती", activity: "माझी गतिविधी", help: "मदत",
    viewingAs: "म्हणून पाहत आहात", farmer: "शेतकरी", buyer: "खरेदीदार", goodMorning: "शुभ सकाळ", farmerIntro: "तुमची कापणी बाजारासोबत पुढे जात आहे.", buyerIntro: "पिकवणाऱ्या शेतकऱ्यांकडून थेट चांगला माल मिळवा.",
    portfolio: "पोर्टफोलिओ मूल्य", thisWeek: "या आठवड्यात", activeLots: "सक्रिय लॉट", awaitingGrading: "2 ग्रेडिंगच्या प्रतीक्षेत", trustScore: "विश्वास गुण", verifiedProfile: "सत्यापित प्रोफाइल", onTime: "वेळेवर वितरण", acrossOrders: "12 ऑर्डरमध्ये",
    decisionSupport: "निर्णय सहाय्य", marketPulse: "बाजार स्थिती", viewPrices: "सर्व किंमती पहा", holdWindow: "चांगल्या वेळेसाठी थांबा", sellWindow: "शिफारस केलेली विक्री वेळ", expected: "अपेक्षित", qualityDesk: "एआय गुणवत्ता केंद्र", gradeNext: "तुमच्या पुढील मालाचे ग्रेडिंग करा", gradeIntro: "यादी करण्यापूर्वी नमुना अपलोड करा आणि त्वरित व्यापार श्रेणी मिळवा.", startGrading: "ग्रेडिंग सुरू करा", ready: "ग्रेडिंगसाठी तयार",
    inventory: "तुमचा साठा", harvestLots: "कापणीचे लॉट", addLot: "लॉट जोडा", listed: "2 दिवसांपूर्वी सूचीबद्ध", procurement: "थेट खरेदी", availableHarvest: "उपलब्ध कापणी", createRfq: "आरएफक्यू तयार करा", reviewLot: "लॉट पहा", fulfilment: "पूर्तता", activeOrders: "सक्रिय ऑर्डर", escrowProtected: "एस्क्रो सुरक्षित", inTransit: "मार्गावर", verifyDelivery: "वितरण सत्यापित करा",
    scan: "पिकाचा नमुना स्कॅन करा",
    choose: "तुमच्या डिव्हाइसवरून JPG किंवा PNG निवडा",
    upload: "नमुना अपलोड करा",
    fileLimit: "JPG किंवा PNG · कमाल 10 MB", chooseFile: "फाइल निवडा", cropDesk: "एआय गुणवत्ता केंद्र", publishRequirement: "गरज प्रकाशित करा", crop: "पीक", quantity: "प्रमाण (किलो)", maximumPrice: "कमाल किंमत / क्विंटल", publishRfq: "आरएफक्यू प्रकाशित करा", today: "आज", qrReady: "वितरणासाठी क्यूआर सत्यापन तयार आहे", authTitle: "किसान सेतु प्रवेश", login: "लॉग इन", register: "शेतकरी खाते तयार करा", name: "पूर्ण नाव", phone: "फोन नंबर", password: "पासवर्ड", confirmPassword: "पासवर्डची पुष्टी करा", signIn: "सुरक्षित लॉग इन", createAccount: "खाते तयार करा", noAccount: "किसान सेतु वर नवीन आहात?", hasAccount: "आधीच नोंदणी केली आहे?", switchRegister: "येथे नोंदणी करा", switchLogin: "येथे लॉग इन करा", authNote: "तुमचा पासवर्ड एन्क्रिप्ट करून सुरक्षित ठेवला जातो.", demoAccess: "डेमो मोडमध्ये सुरू ठेवा", demoNote: "डेटाबेस कनेक्शनशिवाय डॅशबोर्ड वापरा.", readingImage: "प्रतिमा वाचली जात आहे...", gradingUnavailable: "प्रतिमेचे ग्रेडिंग होऊ शकले नाही. ML सेवा पोर्ट 8000 वर चालू आहे का ते तपासा.", languagePreference: "पसंतीची भाषा",
  },
} as const;
const defaultLots = [
  { id: "lot-1", crop: "Nashik Red Onion", location: "Nashik", state: "Maharashtra", grade: "GRADE A", weight: "820 kg", price: "₹2,450", farmer: "Suresh Patil", verified: true },
  { id: "lot-2", crop: "Latur Soybean", location: "Latur", state: "Maharashtra", grade: "GRADE B", weight: "1,240 kg", price: "₹4,720", farmer: "Mahalaxmi FPO", verified: true },
  { id: "lot-3", crop: "Pune Onion", location: "Pune", state: "Maharashtra", grade: "GRADE A", weight: "560 kg", price: "₹2,310", farmer: "Green Valley FPO", verified: true },
  { id: "lot-4", crop: "Azadpur Tomato", location: "Azadpur", state: "Delhi", grade: "GRADE A", weight: "940 kg", price: "₹2,180", farmer: "North Star FPO", verified: true },
  { id: "lot-5", crop: "Indore Wheat", location: "Indore", state: "Madhya Pradesh", grade: "GRADE A", weight: "2,400 kg", price: "₹2,680", farmer: "Malwa Growers", verified: true },
  { id: "lot-6", crop: "Bengaluru Maize", location: "Bengaluru", state: "Karnataka", grade: "GRADE B", weight: "1,680 kg", price: "₹2,240", farmer: "Deccan Harvest FPO", verified: true },
  { id: "lot-7", crop: "Guntur Chilli", location: "Guntur", state: "Andhra Pradesh", grade: "GRADE A", weight: "430 kg", price: "₹8,950", farmer: "Krishna Valley FPO", verified: true },
  { id: "lot-8", crop: "Kolkata Rice", location: "Kolkata", state: "West Bengal", grade: "GRADE A", weight: "3,200 kg", price: "₹3,420", farmer: "Delta Grain Collective", verified: true },
  { id: "lot-9", crop: "Jaipur Mustard", location: "Jaipur", state: "Rajasthan", grade: "GRADE B", weight: "1,100 kg", price: "₹5,680", farmer: "Aravali Farmers FPO", verified: true },
  { id: "lot-10", crop: "Lucknow Potato", location: "Lucknow", state: "Uttar Pradesh", grade: "GRADE A", weight: "1,920 kg", price: "₹1,860", farmer: "Awadh Fresh Collective", verified: true },
];
const fallbackPrices: PriceRecord[] = [
  { mandiName: "Nashik, Maharashtra", cropName: "Onion", modalPrice: 2450, minPrice: 2200, maxPrice: 2630, arrivalVolumeTonnes: 124, recordedDate: "2026-09-22" },
  { mandiName: "Pune, Maharashtra", cropName: "Onion", modalPrice: 2310, minPrice: 2080, maxPrice: 2490, arrivalVolumeTonnes: 98, recordedDate: "2026-09-22" },
  { mandiName: "Latur, Maharashtra", cropName: "Soybean", modalPrice: 4720, minPrice: 4490, maxPrice: 4910, arrivalVolumeTonnes: 156, recordedDate: "2026-09-22" },
  { mandiName: "Azadpur, Delhi", cropName: "Tomato", modalPrice: 2180, minPrice: 1900, maxPrice: 2360, arrivalVolumeTonnes: 210, recordedDate: "2026-09-22" },
  { mandiName: "Indore, Madhya Pradesh", cropName: "Wheat", modalPrice: 2680, minPrice: 2540, maxPrice: 2810, arrivalVolumeTonnes: 342, recordedDate: "2026-09-22" },
  { mandiName: "Bengaluru, Karnataka", cropName: "Maize", modalPrice: 2240, minPrice: 2100, maxPrice: 2390, arrivalVolumeTonnes: 188, recordedDate: "2026-09-22" },
  { mandiName: "Guntur, Andhra Pradesh", cropName: "Chilli", modalPrice: 8950, minPrice: 8120, maxPrice: 9640, arrivalVolumeTonnes: 74, recordedDate: "2026-09-22" },
  { mandiName: "Kolkata, West Bengal", cropName: "Rice", modalPrice: 3420, minPrice: 3190, maxPrice: 3680, arrivalVolumeTonnes: 276, recordedDate: "2026-09-22" },
  { mandiName: "Jaipur, Rajasthan", cropName: "Mustard", modalPrice: 5680, minPrice: 5420, maxPrice: 5910, arrivalVolumeTonnes: 164, recordedDate: "2026-09-22" },
  { mandiName: "Lucknow, Uttar Pradesh", cropName: "Potato", modalPrice: 1860, minPrice: 1640, maxPrice: 2040, arrivalVolumeTonnes: 232, recordedDate: "2026-09-22" },
];
const fallbackActivity: ActivityData = { lots: defaultLots.map((lot) => ({ id: lot.id, cropName: lot.crop, variety: "Demo lot", weightKg: Number(lot.weight.replace(/[^0-9.]/g, "").replace(",", "")), qualityGrade: lot.grade.replace(" ", "_"), status: "LISTED", basePrice: Number(lot.price.replace(/[^0-9]/g, "")), createdAt: "2026-09-22" })), demands: [], transactions: [], offers: [], openDemands: [] };
function Badge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "orange" | "dark";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function App() {
  const [role, setRole] = useState<Role>(() => localStorage.getItem("kisaan_setu_role") === "buyer" ? "buyer" : "farmer");
  const [userName, setUserName] = useState(() => localStorage.getItem("kisaan_setu_user_name") || (localStorage.getItem("kisaan_setu_role") === "buyer" ? "FreshCart" : "Suresh"));
  const [activeTab, setActiveTab] = useState<DashboardTab>("marketplace");
  const [lots, setLots] = useState(defaultLots);
  const [prices, setPrices] = useState<PriceRecord[]>(fallbackPrices);
  const [priceSource, setPriceSource] = useState<"live" | "demo">("demo");
  const [activity, setActivity] = useState<ActivityData>(fallbackActivity);
  const [language, setLanguage] = useState<Language>("en");
  const [scan, setScan] = useState(false);
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("kisaan_setu_dark_mode") === "true");
  const [selected, setSelected] = useState<string[]>(["lot-1"]);
  const [notice, setNotice] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantLanguage, setAssistantLanguage] = useState<SupportedLanguage>("en");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hello! I can help with mandi prices, crop care, irrigation, and selling advice for farmers.",
      language: "en",
    },
  ]);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [rfq, setRfq] = useState(false);
  const [manualLot, setManualLot] = useState(false);
  const [manualCrop, setManualCrop] = useState("Onion");
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem("kisaan_setu_token") || localStorage.getItem("kisaan_setu_demo")));
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<{ grade: string; confidence: number; score: number; conclusion: string; summary: string; recommendation: string; metrics: { color_score: number; surface_uniformity: number; blemish_free_score: number } } | null>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const selectedLanguage = languageOptions.find((option) => option.code === language);
  const labels = copy[selectedLanguage?.fallback || "en"];
  const greeting = getGreeting(selectedLanguage?.fallback || "en");
  const currentDate = new Date();
  const displayDate = Number.isNaN(currentDate.getTime()) ? new Date("2026-09-22") : currentDate;
  const dateLabel = displayDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("kisaan_setu_dark_mode", String(darkMode));
  }, [darkMode]);
  useEffect(() => {
    if (!authenticated || localStorage.getItem("kisaan_setu_user_name")) return;
    api.get("/auth/me").then((response) => {
      const name = String(response.data.user?.name || "");
      if (!name) return;
      const authenticatedRole: Role = response.data.user?.role === "BUYER" ? "buyer" : "farmer";
      localStorage.setItem("kisaan_setu_user_name", name);
      localStorage.setItem("kisaan_setu_role", authenticatedRole);
      setUserName(name);
      setRole(authenticatedRole);
    }).catch((error) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) return;
      localStorage.removeItem("kisaan_setu_token");
      localStorage.removeItem("kisaan_setu_demo");
      localStorage.removeItem("kisaan_setu_role");
      delete api.defaults.headers.common.Authorization;
      setAuthenticated(false);
    });
  }, [authenticated]);
  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === "prices") api.get("/dashboard/prices").then((response) => { if (response.data.length) setPrices(response.data); setPriceSource(response.headers["x-price-source"] === "data.gov.in" ? "live" : "demo"); }).catch(() => setPriceSource("demo"));
    if (activeTab === "activity") api.get("/dashboard/activity").then((response) => setActivity(response.data)).catch(() => undefined);
  }, [activeTab, authenticated]);
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);
  useEffect(() => {
    if (language === "hi" || language === "mr") {
      setAssistantLanguage(language);
    }
  }, [language]);
  const sendAssistantMessage = async (messageOverride?: string) => {
    const enteredText = (messageOverride ?? assistantInput).trim();
    if (!enteredText) return;
    const resolvedLanguage = detectAssistantLanguage(enteredText);
    setAssistantLanguage(resolvedLanguage);
    setAssistantInput("");
    setAssistantThinking(true);
    setAssistantMessages((current) => [
      ...current,
      { id: Date.now(), sender: "user", text: enteredText, language: resolvedLanguage },
      { id: Date.now() + 1, sender: "bot", text: "...", language: resolvedLanguage },
    ]);

    try {
      const response = await api.post('/assistant', {
        message: enteredText,
        language: resolvedLanguage,
        context: `User role: ${role}. User language: ${resolvedLanguage}.`,
      });
      const reply = response.data?.reply || buildAssistantReply(enteredText, resolvedLanguage);
      setAssistantMessages((current) => {
        const filtered = current.filter((msg) => !((msg.sender === 'bot' && msg.text === '...') && msg.id === current[current.length - 1]?.id));
        return [...filtered, { id: Date.now() + 2, sender: 'bot', text: reply, language: resolvedLanguage }];
      });
    } catch {
      setAssistantMessages((current) => {
        const filtered = current.filter((msg) => !(msg.sender === 'bot' && msg.text === '...'));
        return [...filtered, { id: Date.now() + 3, sender: 'bot', text: buildAssistantReply(enteredText, resolvedLanguage), language: resolvedLanguage }];
      });
    } finally {
      setAssistantThinking(false);
    }
  };
  const startVoiceAssistant = () => {
    if (!voiceSupported) {
      setNotice(language === "hi" ? "आपके ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।" : language === "mr" ? "तुमच्या ब्राउझरमध्ये व्हॉइस इनपुट उपलब्ध नाही." : "Voice input is not available in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = assistantLanguage === "hi" ? "hi-IN" : assistantLanguage === "mr" ? "mr-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) {
        sendAssistantMessage(transcript);
      }
    };
    recognition.onerror = () => {
      setNotice(language === "hi" ? "वॉइस पहचान में समस्या हुई। कृपया टेक्स्ट लिखें।" : language === "mr" ? "व्हॉइस ओळखीत समस्या आली. कृपया मजकूर टाइप करा." : "Voice recognition did not work. Please type your question instead.");
      setVoiceListening(false);
    };
    recognition.onend = () => setVoiceListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceListening(true);
  };
  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const phone = normalizePhone(String(form.get("phone") || ""));
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setAuthError("Enter a valid Indian phone number with 10 digits, optionally prefixed with +91.");
      return;
    }
    if (authMode === "register" && password !== String(form.get("confirmPassword") || "")) {
      setAuthError(language === "hi" ? "पासवर्ड मेल नहीं खाते" : language === "mr" ? "पासवर्ड जुळत नाहीत" : "Passwords do not match");
      return;
    }
    try {
      const response = await api.post(`/auth/${authMode}`, authMode === "register" ? { name: form.get("name"), phone, password, role: role === "farmer" ? "FARMER" : "BUYER", language: language === "mr" ? "MARATHI" : language === "hi" ? "HINDI" : "ENGLISH" } : { phone, password, role: role === "farmer" ? "FARMER" : "BUYER" });
      localStorage.setItem("kisaan_setu_token", response.data.token);
      const authenticatedRole: Role = response.data.user?.role === "BUYER" ? "buyer" : "farmer";
      const authenticatedName = String(response.data.user?.name || (authenticatedRole === "buyer" ? "FreshCart" : "Suresh"));
      localStorage.setItem("kisaan_setu_role", authenticatedRole);
      localStorage.setItem("kisaan_setu_user_name", authenticatedName);
      api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
      setRole(authenticatedRole);
      setUserName(authenticatedName);
      setAuthenticated(true);
    } catch (error) {
      setAuthError(axios.isAxiosError(error) ? error.response?.data?.error || "Authentication failed" : "Authentication failed");
    }
  };
  const enterDemoMode = () => {
    const demoName = role === "buyer" ? "FreshCart" : "Suresh";
    localStorage.setItem("kisaan_setu_demo", "true");
    localStorage.setItem("kisaan_setu_role", role);
    localStorage.setItem("kisaan_setu_user_name", demoName);
    setUserName(demoName);
    setAuthenticated(true);
  };
  const logout = () => {
    localStorage.removeItem("kisaan_setu_token");
    localStorage.removeItem("kisaan_setu_demo");
    localStorage.removeItem("kisaan_setu_role");
    localStorage.removeItem("kisaan_setu_user_name");
    delete api.defaults.headers.common.Authorization;
    setAuthenticated(false);
    setProfileOpen(false);
    setAuthMode("login");
    setRole("farmer");
  };
  const openScan = () => {
    setGradeResult(null);
    setNotice("");
    setSampleFile(null);
    setSampleName("");
    setSampleImage(null);
    setScan(true);
  };
  const createManualLot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cropName = String(form.get("cropName") || "").trim();
    const variety = String(form.get("variety") || "").trim();
    const weightKg = Number(form.get("weightKg"));
    const basePrice = Number(form.get("basePrice"));
    const harvestDate = String(form.get("harvestDate") || "");
    const latitude = Number(form.get("latitude")) || undefined;
    const longitude = Number(form.get("longitude")) || undefined;
    if (!cropName || !variety || weightKg <= 0 || basePrice <= 0 || !harvestDate) {
      setNotice("Enter crop, variety, weight, price, and harvest date.");
      return;
    }
    const newLot = { id: `local-${Date.now()}`, crop: `${cropName} · ${variety}`, location: "Your farm", state: "Maharashtra", grade: "PENDING", weight: `${weightKg} kg`, price: `₹${basePrice.toLocaleString("en-IN")}`, farmer: "You", verified: false };
    setLots((current) => [newLot, ...current]);
    try {
      await api.post("/lots/create", { cropName, variety, weightKg, basePrice, harvestDate, latitude, longitude, sampleImageUrls: [] });
      setNotice("Lot saved successfully.");
    } catch {
      setNotice("Lot added to this dashboard. Connect PostgreSQL to sync it to the server.");
    }
    setManualLot(false);
  };
  const selectedCropPrices = prices.filter((price) => price.cropName.toLowerCase() === manualCrop.toLowerCase());
  const suggestedRate = selectedCropPrices.length ? Math.round(selectedCropPrices.reduce((sum, price) => sum + Number(price.modalPrice), 0) / selectedCropPrices.length) : 0;
  const refreshActivity = async () => { try { const response = await api.get("/dashboard/activity"); setActivity(response.data); } catch { setNotice("Connect the database to refresh activity."); } };
  const offerLotToDemand = async (demandId: string, lotId: string) => { try { await api.post(`/demands/${demandId}/offers`, { lotId }); setNotice("Your lot was offered to the buyer."); await refreshActivity(); } catch (error) { setNotice(axios.isAxiosError(error) ? error.response?.data?.error || "This lot cannot meet the request." : "This lot cannot meet the request."); } };
  const acceptFarmerOffer = async (offerId: string) => { try { await api.post(`/demands/offers/${offerId}/accept`); setNotice("Farmer and lot details shared with you. The order is now matched."); await refreshActivity(); } catch (error) { setNotice(axios.isAxiosError(error) ? error.response?.data?.error || "Offer could not be accepted." : "Offer could not be accepted."); } };
  const toggleLot = (id: string) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const handleSample = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isSupportedImage = ["image/jpeg", "image/png"].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    if (!isSupportedImage) {
      setNotice(labels.choose);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice(language === "hi" ? "छवि 10 MB से छोटी होनी चाहिए" : language === "mr" ? "प्रतिमा 10 MB पेक्षा लहान असावी" : "Image must be smaller than 10 MB");
      return;
    }
    setSampleFile(file);
    setSampleName(file.name);
    setSampleImage(URL.createObjectURL(file));
  };
  const gradeSample = async () => {
    if (!sampleFile) return;
    setGrading(true);
    setGradeResult(null);
    setNotice("Analyzing crop image...");
    const formData = new FormData();
    formData.append("image", sampleFile, sampleFile.name);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_ML_URL || "http://localhost:8000"}/grade-image`,
        formData,
      );
      const result = response.data;
      if (!result?.predicted_grade) throw new Error("No grade returned by the analysis service");
      const metrics = result.metrics || {};
      const report = result.report || {};
      setGradeResult({
        grade: result.predicted_grade,
        confidence: Number(result.confidence || 0),
        score: Number(result.quality_score || 0),
        conclusion: result.conclusion || "Analysis completed successfully.",
        summary: report.summary || `${result.predicted_grade} analysis completed from the uploaded crop image.`,
        recommendation: report.recommendation || "Review the image in good daylight before listing.",
        metrics: { color_score: Number(metrics.color_score || 0), surface_uniformity: Number(metrics.surface_uniformity || 0), blemish_free_score: Number(metrics.blemish_free_score || 0) },
      });
      setNotice(
        `${labels.ready}: ${response.data.predicted_grade} · ${Math.round(response.data.confidence * 100)}% confidence`,
      );
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : "";
      setNotice(detail || (error instanceof Error ? error.message : labels.gradingUnavailable));
    }
    setGrading(false);
  };
  const createRfq = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cropName = String(form.get("cropName") || "").trim();
    const targetGrade = String(form.get("targetGrade") || "GRADE_A");
    const requiredQuantityKg = Number(form.get("requiredQuantityKg"));
    const maxPrice = Number(form.get("maxPrice"));
    const destinationPincode = String(form.get("destinationPincode") || "").trim();
    if (!cropName || !["GRADE_A", "GRADE_B", "GRADE_C"].includes(targetGrade) || requiredQuantityKg <= 0 || maxPrice <= 0 || !/^\d{6}$/.test(destinationPincode)) { setNotice("Enter a crop, valid quantity, price, and 6-digit destination pincode."); return; }
    try {
      await api.post("/demands/create", { cropName, targetGrade, requiredQuantityKg, maxPrice, destinationPincode });
      setNotice(language === "hi" ? "आरएफक्यू सत्यापित किसान नेटवर्क पर प्रकाशित हुआ" : language === "mr" ? "आरएफक्यू सत्यापित शेतकरी नेटवर्कवर प्रकाशित झाले" : "RFQ published to verified farmer networks");
    } catch {
      setActivity((current) => ({ ...current, demands: [{ id: `local-demand-${Date.now()}`, cropName, requiredQuantityKg, maxPrice, status: "OPEN", createdAt: new Date().toISOString() }, ...current.demands] }));
      setNotice("RFQ saved locally for this demo. Connect PostgreSQL to share it with farmers.");
    }
    setRfq(false);
    await refreshActivity();
  };
  if (!authenticated) {
    return <div className="auth-shell"><div className="auth-card"><div className="brand"><span className="brand-mark"><Sprout size={19} /></span><span>Kisaan <b>Setu</b></span></div><p className="eyebrow">{labels.authTitle}</p><h1>{authMode === "login" ? labels.login : labels.register}</h1><div className="auth-role-picker" aria-label="Choose account type"><button type="button" className={role === "farmer" ? "selected" : ""} onClick={() => { setRole("farmer"); setAuthError(""); }}><Sprout size={17} />{labels.farmer}<small>Sell and manage harvest</small></button><button type="button" className={role === "buyer" ? "selected" : ""} onClick={() => { setRole("buyer"); setAuthError(""); }}><HandCoins size={17} />{labels.buyer}<small>Source verified produce</small></button></div><form onSubmit={handleAuth}>{authMode === "register" && <label>{labels.name}<input name="name" required minLength={2} /></label>}<label>{labels.phone}<input name="phone" type="tel" inputMode="tel" pattern="(?:\\+91|91)?[6-9][0-9]{9}" maxLength={14} placeholder="10 digits or +91 10 digits" required /></label><label>{labels.password}<input name="password" type="password" minLength={8} required /></label>{authMode === "register" && <label>{labels.confirmPassword}<input name="confirmPassword" type="password" minLength={8} required /></label>}{authError && <div className="auth-error">{authError}</div>}<button className="primary-btn full" type="submit">{authMode === "login" ? labels.signIn : labels.createAccount}</button></form><p className="auth-note">{labels.authNote}</p><button className="demo-btn" onClick={enterDemoMode}>{labels.demoAccess}</button><p className="demo-note">{labels.demoNote}</p><p className="auth-switch">{authMode === "login" ? labels.noAccount : labels.hasAccount} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? labels.switchRegister : labels.switchLogin}</button></p></div></div>;
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Sprout size={19} />
          </span>
          <span>
            Kisaan <b>Setu</b>
          </span>
        </div>
        <nav>
          <button className={activeTab === "marketplace" ? "nav-active" : ""} onClick={() => setActiveTab("marketplace")}>{labels.marketplace}</button>
          <button className={activeTab === "prices" ? "nav-active" : ""} onClick={() => setActiveTab("prices")}>{labels.prices}</button>
          <button className={activeTab === "activity" ? "nav-active" : ""} onClick={() => setActiveTab("activity")}>{labels.activity}</button>
        </nav>
        <div className="header-actions">
          <label className="language-picker">
            <span>{labels.language}</span>
            <select
              value={language}
              size={Math.min(languageOptions.length, 18)}
              onChange={(event) => setLanguage(event.target.value as Language)}
              aria-label={labels.language}
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} · {option.state}
                </option>
              ))}
            </select>
          </label>
          <button className="icon-btn" title={labels.help} onClick={() => setAssistantOpen((open) => !open)}>
            <CircleHelp size={20} />
          </button>
          <div className="profile-menu-wrap">
            <button className="profile" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{getInitials(userName)}</button>
            {profileOpen && <div className="profile-menu">
              <button onClick={() => setDarkMode((enabled) => !enabled)}><span>{darkMode ? <Sun size={16} /> : <Moon size={16} />} Dark mode</span><span className={`toggle ${darkMode ? "on" : ""}`}><i /></span></button>
              <button onClick={logout}><span><LogOut size={16} /> Log out</span></button>
            </div>}
          </div>
          <button
            className="mobile-menu icon-btn"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      {menu && (
        <div className="mobile-nav">
          <button onClick={() => { setActiveTab("marketplace"); setMenu(false); }}>{labels.marketplace}</button>
          <button onClick={() => { setActiveTab("prices"); setMenu(false); }}>{labels.prices}</button>
          <button onClick={() => { setActiveTab("activity"); setMenu(false); }}>{labels.activity}</button>
        </div>
      )}
      <main>
        <section className="welcome-row">
          <div>
            <p className="eyebrow">MAHARASHTRA · {dateLabel}</p>
            <h1>
              {greeting},{" "}
              <em>{userName}</em>
            </h1>
            <p className="muted">
              {role === "farmer"
                ? labels.farmerIntro
                : labels.buyerIntro}
            </p>
          </div>
          <div className="role-switch"><span>{labels.viewingAs}</span><strong>{role === "farmer" ? labels.farmer : labels.buyer}</strong></div>
        </section>
        {notice && (
          <div className="notice">
            <CheckCircle2 size={18} />
            {notice}
            <button onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}
        <section className="stats">
          <div>
            <span>{labels.portfolio}</span>
            <strong>₹4,18,640</strong>
            <small className="positive">
              <ArrowUpRight size={14} /> 8.4% {labels.thisWeek}
            </small>
          </div>
          <div>
            <span>{labels.activeLots}</span>
            <strong>06</strong>
            <small>{labels.awaitingGrading}</small>
          </div>
          <div>
            <span>{labels.trustScore}</span>
            <strong>
              4.8 <small>/ 5</small>
            </strong>
            <small className="positive">
              <ShieldCheck size={14} /> {labels.verifiedProfile}
            </small>
          </div>
          <div>
            <span>{labels.onTime}</span>
            <strong>96%</strong>
            <small>{labels.acrossOrders}</small>
          </div>
        </section>
        {activeTab === "marketplace" && (role === "farmer" ? (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{labels.decisionSupport}</p>
                <h2>{labels.marketPulse}</h2>
              </div>
              <button className="text-btn">
                {labels.viewPrices} <ArrowUpRight size={15} />
              </button>
            </div>
            <section className="grid-two">
              <div className="panel price-panel">
                <div className="panel-head">
                  <div>
                    <Badge>ONION · NASHIK</Badge>
                    <h3>{labels.holdWindow}</h3>
                  </div>
                  <BarChart3 size={23} className="panel-icon" />
                </div>
                <div className="price-row">
                    <strong>
                      ₹{Number(prices.find((price) => price.mandiName === "Nashik" && price.cropName === "Onion")?.modalPrice || 2450).toLocaleString("en-IN")}<span>/qtl</span>
                    </strong>
                  <div className="delta">
                    <ArrowUpRight size={15} /> +6.8%
                  </div>
                </div>
                <div className="chart">
                  <i style={{ height: "34%" }} />
                  <i style={{ height: "48%" }} />
                  <i style={{ height: "42%" }} />
                  <i style={{ height: "58%" }} />
                  <i style={{ height: "52%" }} />
                  <i style={{ height: "74%" }} />
                  <i style={{ height: "68%" }} />
                  <i style={{ height: "88%" }} />
                  <i style={{ height: "80%" }} />
                </div>
                <div className="chart-labels">
                  <span>10 Sep</span>
                  <span>{labels.today}</span>
                  <span>24 Sep</span>
                </div>
                <div className="recommendation">
                  <span className="dot" />
                  <div>
                    <b>{labels.sellWindow}</b>
                    <p>22–25 September · {labels.expected} ₹{Number(prices.find((price) => price.mandiName === "Nashik" && price.cropName === "Onion")?.maxPrice || 2650).toLocaleString("en-IN")}/qtl</p>
                  </div>
                  <ArrowUpRight size={17} />
                </div>
              </div>
              <div className="panel scanner-panel">
                <div className="scanner-copy">
                  <Badge tone="orange">{labels.qualityDesk}</Badge>
                  <h3>{labels.gradeNext}</h3>
                  <p>
                    {labels.gradeIntro}
                  </p>
                  <button className="primary-btn" onClick={openScan}>
                    <Camera size={17} /> {labels.startGrading}
                  </button>
                </div>
                <div className="scanner-art">
                  <ScanLine size={31} />
                  <span>{labels.ready}</span>
                </div>
              </div>
            </section>
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{labels.inventory}</p>
                <h2>{labels.harvestLots}</h2>
              </div>
              <button
                className="primary-btn small"
                onClick={() => { setManualCrop("Onion"); setManualLot(true); }}
              >
                <Leaf size={16} /> {labels.addLot}
              </button>
            </div>
            <section className="lot-list">
              {lots.map((lot) => (
                <div className="lot-row" key={lot.id}>
                  <div className="crop-icon">
                    <span className="crop-visual" role="img" aria-label={lot.crop}>{getCropVisual(lot.crop)}</span>
                  </div>
                  <div className="lot-info">
                    <b>{lot.crop}</b>
                    <span>{lot.location}, {lot.state} · {lot.weight} · {labels.listed}</span>
                  </div>
                  <Badge tone={lot.grade === "GRADE A" ? "green" : "orange"}>
                    {lot.grade}
                  </Badge>
                  <strong className="lot-price">
                    {lot.price}
                    <small>/qtl</small>
                  </strong>
                  <button className="icon-btn">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))}
            </section>
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{labels.procurement}</p>
                <h2>{labels.availableHarvest}</h2>
              </div>
              <button className="primary-btn" onClick={() => setRfq(true)}>
                <HandCoins size={16} /> {labels.createRfq}
              </button>
            </div>
            <section className="market-grid">
              {lots.map((lot) => (
                <div className="market-card" key={lot.id}>
                  <div className="market-image">
                    <span className="crop-visual large" role="img" aria-label={lot.crop}>{getCropVisual(lot.crop)}</span>
                    <Badge>{lot.grade}</Badge>
                  </div>
                  <div className="market-body">
                    <div className="crop-line">
                      <h3>{lot.crop}</h3>
                      <span>{lot.location}, {lot.state} · {lot.weight}</span>
                    </div>
                    <p className="farmer-line">
                      {lot.farmer} {lot.verified && <ShieldCheck size={15} />}
                    </p>
                    <div className="card-foot">
                      <strong>
                        {lot.price}
                        <small>/qtl</small>
                      </strong>
                      <button
                        className="outline-btn"
                        onClick={() =>
                          setNotice(`Interest registered for ${lot.crop}`)
                        }
                      >
                        {labels.reviewLot} <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">{labels.fulfilment}</p>
                <h2>{labels.activeOrders}</h2>
              </div>
            </div>
            <section className="order-row">
              <div className="order-icon">
                <Truck size={20} />
              </div>
              <div>
                <b>Onion · Nashik Valley FPO</b>
                <span>820 kg · {labels.escrowProtected}</span>
              </div>
              <Badge tone="dark">{labels.inTransit}</Badge>
              <div className="progress">
                <i />
              </div>
              <button
                className="outline-btn"
                onClick={() => setNotice(labels.qrReady)}
              >
                {labels.verifyDelivery} <ScanLine size={15} />
              </button>
            </section>
          </>
        ))}
        {activeTab === "prices" && <section className="tab-view"><div className="section-heading"><div><p className="eyebrow">{priceSource === "live" ? "LIVE GOVERNMENT MARKET DATA" : "DEMO MARKET DATA"}</p><h2>{labels.prices}</h2></div><Badge>{prices.length} records</Badge></div><div className="price-table">{prices.map((price) => <div className="price-table-row" key={`${price.mandiName}-${price.cropName}-${price.recordedDate}`}><div><b>{price.cropName}</b><span>{price.mandiName} Mandi · {new Date(price.recordedDate).toLocaleDateString("en-IN")}</span></div><strong>₹{Number(price.modalPrice).toLocaleString("en-IN")}<small>/qtl modal</small></strong><span>₹{Number(price.minPrice).toLocaleString("en-IN")} – ₹{Number(price.maxPrice).toLocaleString("en-IN")}<small> range · {price.arrivalVolumeTonnes} t arrivals</small></span></div>)}</div></section>}
        {activeTab === "activity" && <section className="tab-view"><div className="section-heading"><div><p className="eyebrow">{role === "farmer" ? "FARMER WORKSPACE" : "BUYER WORKSPACE"}</p><h2>{labels.activity}</h2></div><Badge>{activity.lots.length + activity.demands.length + activity.transactions.length + activity.offers.length} events</Badge></div>{role === "farmer" ? <div className="activity-grid"><div className="panel"><h3>Open buyer requests</h3>{activity.openDemands.length ? activity.openDemands.map((demand) => { const compatible = activity.lots.find((lot) => lot.cropName.toLowerCase().includes(demand.cropName.toLowerCase()) && lot.qualityGrade === demand.targetGrade && lot.basePrice <= demand.maxPrice && lot.weightKg >= demand.requiredQuantityKg); return <div className="activity-row" key={demand.id}><div><b>{demand.cropName} · {demand.requiredQuantityKg} kg</b><span>Buyer: {demand.buyer.name} · up to ₹{demand.maxPrice}/qtl · {demand.destinationPincode}</span></div><button className="outline-btn" disabled={!compatible} onClick={() => compatible && offerLotToDemand(demand.id, compatible.id)}>{compatible ? "Offer matching lot" : "No matching lot"}</button></div>; }) : <p className="muted">No open buyer requests match yet.</p>}</div><div className="panel"><h3>Your offers</h3>{activity.offers.length ? activity.offers.map((offer) => <div className="activity-row" key={offer.id}><div><b>{offer.demand.cropName} · {offer.lot.variety}</b><span>{offer.lot.weightKg} kg · ₹{offer.lot.basePrice}/qtl</span></div><Badge tone={offer.status === "ACCEPTED" ? "green" : "orange"}>{offer.status}</Badge></div>) : <p className="muted">You have not offered a lot yet.</p>}</div></div> : <div className="activity-grid"><div className="panel"><h3>Your requests</h3>{activity.demands.length ? activity.demands.map((demand) => <div className="activity-row" key={demand.id}><div><b>{demand.cropName} · {demand.requiredQuantityKg} kg</b><span>Up to ₹{demand.maxPrice}/qtl</span></div><Badge>{demand.status}</Badge></div>) : <p className="muted">Publish an RFQ to receive farmer offers.</p>}</div><div className="panel"><h3>Farmer offers</h3>{activity.offers.length ? activity.offers.map((offer) => <div className="activity-row" key={offer.id}><div><b>{offer.farmer?.name} · {offer.lot.cropName}</b><span>{offer.lot.weightKg} kg · ₹{offer.lot.basePrice}/qtl · {offer.farmer?.phone}</span></div>{offer.status === "PENDING" ? <button className="outline-btn" onClick={() => acceptFarmerOffer(offer.id)}>Accept offer</button> : <Badge tone="green">{offer.status}</Badge>}</div>) : <p className="muted">Farmer offers will appear here.</p>}</div></div>}</section>}
      </main>
      <button className="assistant-fab" onClick={() => setAssistantOpen(true)} aria-label="Open farmer assistant">
        <MessageSquareText size={18} />
        <span>Farmer help</span>
      </button>
      {assistantOpen && (
        <div className="assistant-backdrop" onClick={() => setAssistantOpen(false)}>
          <div className="assistant-panel" onClick={(event) => event.stopPropagation()}>
            <div className="assistant-header">
              <div className="assistant-title-wrap">
                <span className="assistant-icon"><Bot size={22} /></span>
                <div>
                  <small>{language === "hi" ? "किसान सहायक" : language === "mr" ? "शेतकरी मदत" : "Farmer assistant"}</small>
                  <h3>{language === "hi" ? "सवाल पूछें" : language === "mr" ? "प्रश्न विचारा" : "Ask anything"}</h3>
                </div>
              </div>
              <div className="assistant-tools">
                <select value={assistantLanguage} onChange={(event) => {
                  const nextLanguage = event.target.value as SupportedLanguage;
                  setAssistantLanguage(nextLanguage);
                  setAssistantMessages((current) => [
                    ...current,
                    { id: Date.now(), sender: 'bot', text: nextLanguage === 'hi' ? 'अब हिंदी में सहायता उपलब्ध है।' : nextLanguage === 'mr' ? 'आता मराठीत मदत उपलब्ध आहे.' : 'English is now active for your assistant.', language: nextLanguage },
                  ]);
                }}>
                  {assistantLanguageOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.label}</option>
                  ))}
                </select>
                <button className="icon-btn" onClick={() => setAssistantOpen(false)} aria-label="Close assistant">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="assistant-message-list">
              {assistantMessages.map((message) => (
                <div key={message.id} className={`assistant-message ${message.sender}`}>
                  <div className={`assistant-bubble ${message.sender === 'bot' ? 'bot-bubble' : 'user-bubble'} ${message.text === '...' ? 'typing' : ''}`}>
                    {message.text === '...' ? (
                      <span className="typing-dots"><i /><i /><i /></span>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              {assistantThinking && (
                <div className="assistant-message bot">
                  <div className="assistant-bubble bot-bubble typing">
                    <span className="typing-dots"><i /><i /><i /></span>
                  </div>
                </div>
              )}
            </div>
            <form
              className="assistant-form"
              onSubmit={(event) => {
                event.preventDefault();
                void sendAssistantMessage();
              }}
            >
              <input
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                placeholder={language === "hi" ? "अपना सवाल लिखें..." : language === "mr" ? "तुमचा प्रश्न टाइप करा..." : "Type your question..."}
                aria-label="Ask the farmer assistant"
              />
              <button type="button" className={`voice-btn ${voiceListening ? "active" : ""}`} onClick={startVoiceAssistant} aria-label="Use voice assistant">
                <Mic size={17} />
              </button>
              <button type="submit" className="send-btn" aria-label="Send message">
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      )}
      {scan && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setScan(false)}>
              <X size={18} />
            </button>
            {gradeResult && <div className="grade-result"><div><span className="eyebrow">FINAL QUALITY REPORT</span><strong>{gradeResult.grade}</strong><b className="quality-score">{gradeResult.score}/100</b></div><Badge>{Math.round(gradeResult.confidence * 100)}% confidence</Badge><p><b>{gradeResult.conclusion}</b></p><p>{gradeResult.summary}</p><div className="report-metrics"><span>Color <b>{gradeResult.metrics.color_score}%</b></span><span>Surface <b>{gradeResult.metrics.surface_uniformity}%</b></span><span>Blemish-free <b>{gradeResult.metrics.blemish_free_score}%</b></span></div><div className="report-recommendation"><b>Recommendation</b><span>{gradeResult.recommendation}</span></div></div>}
            <p className="eyebrow">{labels.cropDesk}</p>
            <h2>{labels.scan}</h2>
            <label className="upload-box" htmlFor="crop-sample">
              {sampleImage ? (
                <img className="sample-preview" src={sampleImage} alt={sampleName} />
              ) : (
                <Camera size={26} />
              )}
              <b>{sampleName || labels.choose}</b>
              <span>{labels.fileLimit}</span>
              <span className="file-picker-button">{labels.chooseFile}</span>
              <input
                ref={sampleInputRef}
                id="crop-sample"
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleSample}
              />
            </label>
            <button
              className="primary-btn full"
              disabled={grading}
              onClick={() => sampleFile ? gradeSample() : sampleInputRef.current?.click()}
            >
              {grading ? labels.readingImage : sampleFile ? labels.upload : labels.chooseFile}
            </button>
          </div>
        </div>
      )}
      {rfq && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createRfq}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setRfq(false)}
            >
              <X size={18} />
            </button>
            <p className="eyebrow">{labels.buyer}</p>
            <h2>{labels.publishRequirement}</h2>
            <label>{labels.crop}<select name="cropName" defaultValue="Onion"><option>Onion</option><option>Soybean</option><option>Wheat</option><option>Tomato</option><option>Cotton</option></select></label>
            <label>Target grade<select name="targetGrade" defaultValue="GRADE_A"><option value="GRADE_A">GRADE A</option><option value="GRADE_B">GRADE B</option><option value="GRADE_C">GRADE C</option></select></label>
            <label>{labels.quantity}<input name="requiredQuantityKg" type="number" min="1" step="0.1" defaultValue="500" required /></label>
            <label>{labels.maximumPrice}<input name="maxPrice" type="number" min="1" step="1" defaultValue="2600" required /></label>
            <label>Destination pincode<input name="destinationPincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="411001" required /></label>
            <button className="primary-btn full" type="submit">
              {labels.publishRfq} <ArrowUpRight size={15} />
            </button>
          </form>
        </div>
      )}
      {manualLot && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createManualLot}>
            <button type="button" className="modal-close" onClick={() => setManualLot(false)}><X size={18} /></button>
            <p className="eyebrow">YOUR INVENTORY</p>
            <h2>Add lot manually</h2>
            <label>Crop name<select name="cropName" value={manualCrop} onChange={(event) => setManualCrop(event.target.value)} required><option>Onion</option><option>Soybean</option><option>Wheat</option><option>Tomato</option><option>Cotton</option></select></label>
            <label>Variety<input name="variety" placeholder="Nashik Red" required /></label>
            {suggestedRate > 0 && <div className="rate-hint"><b>Latest market guidance</b><span>{manualCrop} modal average: ₹{suggestedRate.toLocaleString("en-IN")}/qtl</span><small>Use this rate as a starting point. Final price remains your choice.</small></div>}
            <div className="form-grid"><label>Weight (kg)<input name="weightKg" type="number" min="1" step="0.1" required /></label><label>Base price / qtl<input name="basePrice" type="number" min="1" step="1" defaultValue={suggestedRate || undefined} required /></label></div>
            <label>Harvest date<input name="harvestDate" type="date" required /></label>
            <div className="form-grid"><label>Latitude (optional)<input name="latitude" type="number" step="any" /></label><label>Longitude (optional)<input name="longitude" type="number" step="any" /></label></div>
            <button className="primary-btn full" type="submit">Save lot <ArrowUpRight size={15} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
export default App;
