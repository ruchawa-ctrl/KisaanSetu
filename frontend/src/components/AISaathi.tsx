import { FormEvent, useEffect, useRef, useState } from 'react';
import { Check, Mic, MicOff, Send, Sparkles, Volume2 } from 'lucide-react';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'te' | 'as' | 'mai' | 'hne' | 'kok' | 'gu' | 'bg' | 'sat' | 'kn' | 'ml' | 'mni' | 'kha' | 'lus' | 'ao' | 'or' | 'pa' | 'raj' | 'ne' | 'ta' | 'ur' | 'bn' | 'gar' | 'bho' | 'ks' | 'sd' | 'tcy';
type SaathiState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'SUCCESS' | 'ALERT' | 'ERROR';
type Recommendation = { crop: string; quantityKg: number; buyer: string; pricePerKg: number; estimatedNet: number; distanceKm: number; pickup: boolean; paymentWindow: string; verified: boolean; note: string };
type AssistantResponse = { state: 'SUCCESS' | 'ALERT' | 'ERROR'; message: string; recommendation?: Recommendation; action?: { type: 'CREATE_LOT'; label: string; requiresConfirmation: true } };
type Message = { speaker: 'farmer' | 'saathi'; text: string };

type SpeechRecognitionEventLike = Event & { results: { [index: number]: { [index: number]: { transcript: string } } } };
type SpeechRecognitionLike = { lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((event: SpeechRecognitionEventLike) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
declare global { interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor } }

const languageCodes: Record<SupportedLanguage, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', te: 'te-IN', as: 'as-IN', mai: 'mai-IN', hne: 'hi-IN', kok: 'kok-IN', gu: 'gu-IN', bg: 'hi-IN', sat: 'sat-IN', kn: 'kn-IN', ml: 'ml-IN', mni: 'mni-IN', kha: 'kha-IN', lus: 'lus-IN', ao: 'en-IN', or: 'or-IN', pa: 'pa-IN', raj: 'hi-IN', ne: 'ne-IN', ta: 'ta-IN', ur: 'ur-IN', bn: 'bn-IN', gar: 'hi-IN', bho: 'hi-IN', ks: 'ks-IN', sd: 'sd-IN', tcy: 'tcy-IN' };
const languageLabels: Record<SupportedLanguage, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी', te: 'తెలుగు', as: 'অসমীয়া', mai: 'मैथिली', hne: 'छत्तीसगढ़ी', kok: 'कोंकणी', gu: 'ગુજરાતી', bg: 'बागड़ी', sat: 'ᱥᱟᱱᱛᱟᱲᱤ', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', mni: 'মৈতৈলোন্', kha: 'Khasi', lus: 'Mizo', ao: 'Ao', or: 'ଓଡ଼ିଆ', pa: 'ਪੰਜਾਬੀ', raj: 'राजस्थानी', ne: 'नेपाली', ta: 'தமிழ்', ur: 'اردو', bn: 'বাংলা', gar: 'गढ़वाली', bho: 'भोजपुरी', ks: 'कॉशुर', sd: 'सिन्धी', tcy: 'ತುಳು' };
type AssistantCopy = { greeting: string; prompt: string; listen: string; think: string; talk: string; fallback: string; placeholder: string; send: string; view: string; compare: string; again: string; confirm: string; cancel: string; confirmed: string; estimated: string; verified: string; pickup: string; payment: string; demo: string };
const copy: Partial<Record<SupportedLanguage, AssistantCopy>> = {
  en: { greeting: "Namaskar! I'm AI Saathi", prompt: 'Tell me what you need.', listen: "I'm listening...", think: 'Let me check the markets for you...', talk: 'Talk to AI Saathi', fallback: 'Voice is unavailable. You can type your question instead.', placeholder: 'Try: I have 500 kg tomatoes. Should I sell today?', send: 'Send', view: 'View offer', compare: 'Compare options', again: 'Talk again', confirm: 'Confirm', cancel: 'Cancel', confirmed: 'Done. I have kept this recommendation ready for you.', estimated: 'estimated net', verified: 'Verified buyer', pickup: 'Pickup available', payment: 'Payment within', demo: 'Prototype market information' },
  hi: { greeting: 'नमस्कार! मैं AI साथी हूँ', prompt: 'बताइए, आपको क्या चाहिए।', listen: 'मैं सुन रही हूँ...', think: 'मैं आपके लिए बाजार देख रही हूँ...', talk: 'AI साथी से बात करें', fallback: 'आवाज़ उपलब्ध नहीं है। आप अपना सवाल लिख सकते हैं।', placeholder: 'जैसे: मेरे पास 500 किलो टमाटर हैं। आज बेचूं?', send: 'भेजें', view: 'ऑफर देखें', compare: 'विकल्पों की तुलना', again: 'फिर बात करें', confirm: 'पुष्टि करें', cancel: 'रद्द करें', confirmed: 'ठीक है। मैंने यह सुझाव आपके लिए तैयार रखा है।', estimated: 'अनुमानित राशि', verified: 'सत्यापित खरीदार', pickup: 'पिकअप उपलब्ध', payment: 'भुगतान', demo: 'प्रोटोटाइप बाजार जानकारी' },
  mr: { greeting: 'नमस्कार! मी AI साथी आहे', prompt: 'तुम्हाला काय हवे ते सांगा.', listen: 'मी ऐकत आहे...', think: 'मी तुमच्यासाठी बाजार तपासत आहे...', talk: 'AI साथीशी बोला', fallback: 'आवाज उपलब्ध नाही. तुम्ही तुमचा प्रश्न टाइप करू शकता.', placeholder: 'उदा.: माझ्याकडे 500 किलो टोमॅटो आहेत. आज विकू का?', send: 'पाठवा', view: 'ऑफर पहा', compare: 'पर्यायांची तुलना', again: 'पुन्हा बोला', confirm: 'पुष्टी करा', cancel: 'रद्द करा', confirmed: 'ठीक आहे. हा पर्याय तुमच्यासाठी तयार ठेवला आहे.', estimated: 'अंदाजे उत्पन्न', verified: 'सत्यापित खरेदीदार', pickup: 'पिकअप उपलब्ध', payment: 'पेमेंट', demo: 'प्रोटोटाइप बाजार माहिती' },
};

function AISaathiAvatar({ state, assetSrc }: { state: SaathiState; assetSrc?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className={`saathi-avatar ${state.toLowerCase()}`} aria-label={`AI Saathi ${state.toLowerCase()}`}><div className="saathi-waves" /><div className="saathi-face">{assetSrc && !imageFailed ? <img src={assetSrc} alt="AI Saathi" onError={() => setImageFailed(true)} /> : <><Sparkles size={31} /><span>AI</span></>}</div></div>;
}

export default function AISaathi({ language, assetSrc, onLanguageChange }: { language: SupportedLanguage; assetSrc?: string; onLanguageChange: (language: SupportedLanguage) => void }) {
  const t = copy[language] || copy.en!;
  const [state, setState] = useState<SaathiState>('IDLE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const contextRef = useRef<{ crop?: string; quantityKg?: number }>({});

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const speak = (message: string) => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(message); utterance.lang = languageCodes[language]; window.speechSynthesis.speak(utterance); }
  };

  const ask = async (question: string) => {
    const message = question.trim();
    if (!message) return;
    setMessages((current) => [...current, { speaker: 'farmer', text: message }]);
    setText(''); setResponse(null); setState('THINKING');
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/ai-saathi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, language, farmerContext: contextRef.current }) });
      if (!result.ok) throw new Error('Assistant unavailable');
      const data = await result.json() as AssistantResponse;
      setResponse(data); setMessages((current) => [...current, { speaker: 'saathi', text: data.message }]); setState(data.state === 'SUCCESS' ? 'SPEAKING' : data.state); speak(data.message);
      if (data.recommendation) contextRef.current = { crop: data.recommendation.crop, quantityKg: data.recommendation.quantityKg };
    } catch { setState('ERROR'); setMessages((current) => [...current, { speaker: 'saathi', text: 'I could not get the latest market information. Let us try again.' }]); }
  };

  const transcribeRecording = async () => {
    const blob = new Blob(recordingChunksRef.current, { type: recorderRef.current?.mimeType || 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'voice.webm');
    const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/ai-saathi/transcribe`, { method: 'POST', body: form });
    const data = await result.json() as { text?: string; error?: string };
    if (!result.ok || !data.text) throw new Error(data.error || 'Voice transcription failed');
    setText(data.text);
    void ask(data.text);
  };

  const startRecordingFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceUnavailable(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data); };
      recorder.onerror = () => { setVoiceUnavailable(true); setState('IDLE'); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        if (recordingChunksRef.current.length) {
          setState('THINKING');
          void transcribeRecording().catch(() => { setVoiceUnavailable(true); setState('IDLE'); });
        }
      };
      setVoiceUnavailable(false);
      setState('LISTENING');
      recorder.start();
    } catch {
      setVoiceUnavailable(true);
      setState('IDLE');
    }
  };

  const startListening = () => {
    if (state === 'LISTENING') {
      recognitionRef.current?.stop();
      recorderRef.current?.stop();
      setState('IDLE');
      return;
    }
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) { void startRecordingFallback(); return; }
    setVoiceUnavailable(false);
    const recognition = new Constructor();
    recognition.lang = languageCodes[language];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setText(transcript);
      setState('THINKING');
      void ask(transcript);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setVoiceUnavailable(true);
      setState('IDLE');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setState((current) => current === 'LISTENING' ? 'IDLE' : current);
    };
    recognitionRef.current = recognition;
    setState('LISTENING');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceUnavailable(true);
      setState('IDLE');
    }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void ask(text); };
  const statusText = state === 'LISTENING' ? t.listen : state === 'THINKING' ? t.think : state === 'IDLE' ? t.prompt : response?.message || t.prompt;

  return <section className={`saathi-panel ${state.toLowerCase()}`} aria-label="AI Saathi assistant">
    <div className="saathi-main"><div><p className="eyebrow">KISAAN SETU · AI SAATHI</p><h2>{t.greeting}</h2><p className="saathi-status">{statusText}</p></div><AISaathiAvatar state={state} assetSrc={assetSrc} /></div>
    <button className="saathi-talk" onClick={startListening} disabled={state === 'THINKING'}><span className="saathi-mic">{state === 'LISTENING' ? <MicOff size={21} /> : <Mic size={21} />}</span>{state === 'LISTENING' ? t.listen : t.talk}</button>
    <label className="saathi-language-picker">Assistant language<select value={language} onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)} aria-label="Assistant language">{Object.entries(languageLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
    {voiceUnavailable && <p className="saathi-fallback"><MicOff size={14} /> {t.fallback}</p>}
    <div className="saathi-conversation">{messages.slice(-4).map((message, index) => <p className={message.speaker} key={`${message.speaker}-${index}`}><b>{message.speaker === 'farmer' ? 'You' : 'AI Saathi'}</b>{message.text}</p>)}</div>
    <form className="saathi-input" onSubmit={submit}><input value={text} onChange={(event) => setText(event.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} /><button type="submit" title={t.send}><Send size={17} /></button></form>
    {response?.recommendation && <div className="saathi-recommendation"><div className="saathi-recommendation-head"><div><span className="badge">BEST OPTION · {t.demo}</span><h3>{response.recommendation.buyer}</h3></div><strong>₹{response.recommendation.pricePerKg}/kg</strong></div><div className="saathi-recommendation-grid"><span><b>₹{response.recommendation.estimatedNet.toLocaleString('en-IN')}</b>{t.estimated}</span><span><b>{response.recommendation.distanceKm} km</b>away</span><span><b>{response.recommendation.paymentWindow}</b>{t.payment}</span></div><p className="saathi-note"><Check size={15} /> {response.recommendation.verified ? t.verified : ''} · {response.recommendation.pickup ? t.pickup : ''}<br />{response.recommendation.note}</p><div className="saathi-actions"><button className="outline-btn" type="button">{t.view}</button><button className="outline-btn" type="button">{t.compare}</button><button className="icon-btn" type="button" title={t.again} onClick={startListening}><Volume2 size={17} /></button></div>{response.action && <div className="saathi-confirm"><span>{response.action.label}</span><button className="primary-btn small" type="button" onClick={() => { setState('SUCCESS'); setMessages((current) => [...current, { speaker: 'saathi', text: t.confirmed }]); }}>{t.confirm}</button><button className="outline-btn" type="button" onClick={() => setResponse(null)}>{t.cancel}</button></div>}</div>}
  </section>;
}