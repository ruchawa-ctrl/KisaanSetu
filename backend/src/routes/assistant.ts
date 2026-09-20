import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const assistantInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  context: z.string().optional(),
});

const fallbackAssistantReply = (message: string, language: 'en' | 'hi' | 'mr') => {
  const lower = message.toLowerCase().trim();

  if (!lower) {
    return language === 'hi' ? 'कृपया अपना सवाल बताइए।' : language === 'mr' ? 'कृपया तुमचा प्रश्न सांगा.' : 'Please ask your question.';
  }

  if (/(price|rate|mandi|sell|market|cost|qtl|कीमत|मंडी|बाजार|विक्री|किंमत)/.test(lower)) {
    return language === 'hi'
      ? 'मंडी दर की तुलना करने से पहले आज के रेट, आपके क्षेत्र की फसल, और ताजगी का ध्यान रखें। अगर आप प्याज, सोयाबीन या गेहूं बेच रहे हैं, तो अपने स्थानीय मंडी के हाल के तीन-चार दिनों के रेट की तुलना करें।'
      : language === 'mr'
        ? 'मंडयांच्या दरांची तुलना करण्यापूर्वी आजचा दर, तुमच्या क्षेत्रातील पिकं आणि ताजेपणाचा विचार करा. प्याज, सोयाबीन किंवा गहू विकत असाल तर स्थानिक मंडीत गेल्या ३-४ दिवसांचा दर तुलना करा.'
        : 'Compare today’s mandi rate with your local market trend before selling. Check recent rates for your crop and consider quality, transport, and timing before deciding.';
  }

  if (/(water|irrigation|rain|dry|सिंचाई|पानी|बारिश|खेत|सिंचन|ओल|कोरडी|माती)/.test(lower)) {
    return language === 'hi'
      ? 'मिट्टी की नमी जांचें। अगर खेत सूखा है तो पानी दें, लेकिन ज्यादा पानी देने से जड़ें खराब हो सकती हैं। फसल की अवस्था देखकर सिंचाई का समय तय करें।'
      : language === 'mr'
        ? 'मातीतील ओल तपासा. शेत कोरडे असल्यास योग्य वेळी पाणी द्या, पण जास्त पाणी देऊ नका; यामुळे मुळे खराब होऊ शकतात. पिकाच्या अवस्थेनुसार सिंचन वेळ ठरवा.'
        : 'Check soil moisture before watering. If the field is dry, irrigate at the right time but avoid overwatering, which can damage roots. Match irrigation to crop stage and weather.';
  }

  if (/(pest|insect|disease|fungi|spray|disease|कीट|रोग|दवा|स्प्रे|फफूंद|किटाणु)/.test(lower)) {
    return language === 'hi'
      ? 'कीट या रोग की पहचान के बाद सुरक्षित फसल-विशिष्ट दवा का उपयोग करें। पैकेट पर उपयोग की विधि पढ़ें और सही मात्रा का उपयोग करें। अगर समस्या गंभीर है, तो कृषि अधिकारी से सलाह लें।'
      : language === 'mr'
        ? 'कीटक किंवा रोग ओळखल्यानंतर सुरक्षित, पिकांशी जुळणारा कीटकनाशक वापरा. पॅकेटवरील मार्गदर्शक वाचून योग्य प्रमाण वापरा. गंभीर प्रकरणात कृषि अधिकाऱ्यांची सल्ला घ्या.'
        : 'Identify the pest or disease before applying treatment. Use a crop-specific and safe pesticide with the correct dosage, and consult an agriculture officer if the issue is severe.';
  }

  if (/(quality|grade|fresh|storage|harvest|क्वालिटी|ग्रेड|ताजगी|कटाई|भंडारण|गुणवत्ता)/.test(lower)) {
    return language === 'hi'
      ? 'उच्च गुणवत्ता के लिए सही समय पर कटाई करें, पंक्तियों को साफ रखें, और फसल को सीधे धूप में न छोड़ें। ग्रेडिंग के लिए AI गुणवत्ता डेस्क का उपयोग करें।'
      : language === 'mr'
        ? 'उच्च गुणवत्तेसाठी योग्य वेळी कापणी करा, पिक स्वच्छ ठेवा आणि थेट सूर्यप्रकाशात ठेवू नका. ग्रेडिंगसाठी AI गुणवत्ता डेस्क वापरा.'
        : 'Harvest at the right time, keep produce clean, and avoid direct sunlight during storage. Use the AI quality desk to grade your crop sample before selling.';
  }

  if (/(loan|scheme|subsidy|support|कर्ज|योजना|सहायता|सब्सिडी|अनुदान)/.test(lower)) {
    return language === 'hi'
      ? 'कृषि सहायता, सब्सिडी, और कर्ज के लिए अपने कृषि कार्यालय, सहकारी बैंक, या FPO से संपर्क करें। कई योजनाएं सिंचाई, बीज, और फसल बीमा के लिए मदद देती हैं।'
      : language === 'mr'
        ? 'शेतीसाठी कर्ज, अनुदान किंवा मदत मिळवण्यासाठी जिल्हा कृषी कार्यालय, सहकारी बँक किंवा FPO शी संपर्क करा. सिंचन, बियाणे आणि पीक विम्यांसाठी अनेक योजना उपलब्ध असतात.'
        : 'Contact your agriculture office, cooperative bank, or nearby FPO for crop loans, support schemes, and subsidy guidance. Many programmes help with irrigation, seeds, and crop insurance.';
  }

  if (/(hello|namaste|hi|नमस्कार|नमस्ते|शुभ|good morning|morning|सवाल)/.test(lower)) {
    return language === 'hi'
      ? 'नमस्कार! मैं आपके खेत, मंडी दर, सिंचाई, बीज, और बिक्री से जुड़े सवालों में मदद कर सकता हूँ।'
      : language === 'mr'
        ? 'नमस्कार! मी तुमच्या शेत, मंडी किंमत, सिंचन, बियाणे आणि विक्रीशी संबंधित प्रश्नांमध्ये मदत करू शकतो.'
        : 'Hello! I can help with crop prices, irrigation, pest control, seed decisions, and the best time to sell your harvest.';
  }

  return language === 'hi'
    ? 'मैं आपकी फसल, मंडी दर, सिंचाई और बिक्री से संबंधित सामान्य सवालों में मदद कर सकता हूँ। कृपया अपना सवाल स्पष्ट रूप से बताइए।'
    : language === 'mr'
      ? 'मी तुमच्या पिकांची किंमत, सिंचन आणि विक्रीशी संबंधित सामान्य प्रश्नांमध्ये मदत करू शकतो. कृपया तुमचा प्रश्न स्पष्टपणे सांगा.'
      : 'I can help with common farming questions. Please ask clearly about prices, crop health, irrigation, pests, or timing to sell.';
};

const openAiKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

const buildSystemPrompt = (language: 'en' | 'hi' | 'mr') => {
  const languagePrompt = language === 'hi'
    ? 'उत्तर हिंदी में दें।' : language === 'mr' ? 'उत्तर मराठीत द्या.' : 'Answer in English.';

  return `${languagePrompt} You are a helpful agriculture assistant for Indian farmers. Give practical and simple advice. Keep answers short, clear, and farmer-friendly. Prefer direct advice about crop care, mandi prices, irrigation, pest control, loans, and selling decisions. If you do not know the exact rate, say so honestly and suggest how to verify it.`;
};

const callOpenAI = async (message: string, language: 'en' | 'hi' | 'mr') => {
  if (!openAiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: buildSystemPrompt(language) },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text || null;
};

const callGemini = async (message: string, language: 'en' | 'hi' | 'mr') => {
  if (!geminiKey) return null;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `${buildSystemPrompt(language)}\n\nQuestion: ${message}` }],
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(' ').trim();
  return text || null;
};

router.post('/assistant', async (req, res) => {
  try {
    const { message, language = 'en', context } = assistantInputSchema.parse(req.body);

    const systemMessage = context ? `${message}\n\nContext: ${context}` : message;

    try {
      const openAIReply = await callOpenAI(systemMessage, language);
      if (openAIReply) {
        return res.json({ reply: openAIReply, source: 'openai' });
      }
    } catch (error) {
      console.warn('OpenAI assistant fallback triggered:', error instanceof Error ? error.message : error);
    }

    try {
      const geminiReply = await callGemini(systemMessage, language);
      if (geminiReply) {
        return res.json({ reply: geminiReply, source: 'gemini' });
      }
    } catch (error) {
      console.warn('Gemini assistant fallback triggered:', error instanceof Error ? error.message : error);
    }

    return res.json({
      reply: fallbackAssistantReply(systemMessage, language),
      source: 'local',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Unable to process the chat request.' });
  }
});

export default router;
