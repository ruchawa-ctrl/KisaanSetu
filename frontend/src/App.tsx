import { ChangeEvent, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Camera,
  CheckCircle2,
  CircleHelp,
  HandCoins,
  Leaf,
  Menu,
  ScanLine,
  ShieldCheck,
  Sprout,
  Truck,
  X,
} from "lucide-react";
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
});
type Role = "farmer" | "buyer";
type SupportedLanguage = "en" | "hi" | "mr";
type Language = SupportedLanguage | "te" | "as" | "mai" | "hne" | "kok" | "gu" | "bg" | "sat" | "kn" | "ml" | "mni" | "kha" | "lus" | "ao" | "or" | "pa" | "raj" | "ne" | "ta" | "ur" | "bn" | "gar" | "bho" | "ks" | "sd" | "tcy";
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
    fileLimit: "JPG or PNG · up to 10 MB", cropDesk: "AI QUALITY DESK", publishRequirement: "Publish a requirement", crop: "Crop", quantity: "Quantity (kg)", maximumPrice: "Maximum price / qtl", publishRfq: "Publish RFQ", today: "Today", qrReady: "QR verification ready for delivery",
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
    fileLimit: "JPG या PNG · अधिकतम 10 MB", cropDesk: "एआई गुणवत्ता केंद्र", publishRequirement: "आवश्यकता प्रकाशित करें", crop: "फसल", quantity: "मात्रा (किग्रा)", maximumPrice: "अधिकतम कीमत / क्विंटल", publishRfq: "आरएफक्यू प्रकाशित करें", today: "आज", qrReady: "डिलीवरी के लिए क्यूआर सत्यापन तैयार है",
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
    fileLimit: "JPG किंवा PNG · कमाल 10 MB", cropDesk: "एआय गुणवत्ता केंद्र", publishRequirement: "गरज प्रकाशित करा", crop: "पीक", quantity: "प्रमाण (किलो)", maximumPrice: "कमाल किंमत / क्विंटल", publishRfq: "आरएफक्यू प्रकाशित करा", today: "आज", qrReady: "वितरणासाठी क्यूआर सत्यापन तयार आहे",
  },
} as const;
const lots = [
  {
    id: "lot-1",
    crop: "Nashik Red Onion",
    grade: "GRADE A",
    weight: "820 kg",
    price: "₹2,450",
    farmer: "Suresh Patil",
    verified: true,
  },
  {
    id: "lot-2",
    crop: "Latur Soybean",
    grade: "GRADE B",
    weight: "1,240 kg",
    price: "₹4,720",
    farmer: "Mahalaxmi FPO",
    verified: true,
  },
  {
    id: "lot-3",
    crop: "Pune Onion",
    grade: "GRADE A",
    weight: "560 kg",
    price: "₹2,310",
    farmer: "Green Valley FPO",
    verified: true,
  },
];
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
  const [role, setRole] = useState<Role>("farmer");
  const [language, setLanguage] = useState<Language>("en");
  const [scan, setScan] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<string[]>(["lot-1"]);
  const [notice, setNotice] = useState("");
  const [rfq, setRfq] = useState(false);
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState("");
  const selectedLanguage = languageOptions.find((option) => option.code === language);
  const labels = copy[selectedLanguage?.fallback || "en"];
  const toggleLot = (id: string) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const handleSample = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setNotice(labels.choose);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice(language === "hi" ? "छवि 10 MB से छोटी होनी चाहिए" : language === "mr" ? "प्रतिमा 10 MB पेक्षा लहान असावी" : "Image must be smaller than 10 MB");
      return;
    }
    setSampleName(file.name);
    setSampleImage(URL.createObjectURL(file));
  };
  const gradeSample = async () => {
    const input = document.getElementById("crop-sample") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_ML_URL || "http://localhost:8000"}/grade-image`,
        formData,
      );
      setNotice(
        `${labels.ready}: ${response.data.predicted_grade} · ${Math.round(response.data.confidence * 100)}% confidence`,
      );
    } catch {
      setNotice(`${labels.ready}: GRADE A · 94% confidence (demo mode)`);
    }
    setScan(false);
  };
  const createRfq = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(language === "hi" ? "आरएफक्यू सत्यापित किसान नेटवर्क पर प्रकाशित हुआ" : language === "mr" ? "आरएफक्यू सत्यापित शेतकरी नेटवर्कवर प्रकाशित झाले" : "RFQ published to verified farmer networks");
    setRfq(false);
    try {
      await api.post("/demands/create", {
        cropName: "Onion",
        targetGrade: "GRADE_A",
        requiredQuantityKg: 500,
        maxPrice: 2600,
        destinationPincode: "411001",
      });
    } catch {
      /* offline demo mode */
    }
  };
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
          <button className="nav-active">{labels.marketplace}</button>
          <button>{labels.prices}</button>
          <button>{labels.activity}</button>
        </nav>
        <div className="header-actions">
          <label className="language-picker">
            <span>{labels.language}</span>
            <select
              value={language}
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
          <button className="icon-btn" title={labels.help}>
            <CircleHelp size={20} />
          </button>
          <button className="profile">SP</button>
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
          <button onClick={() => setMenu(false)}>{labels.marketplace}</button>
          <button onClick={() => setMenu(false)}>{labels.prices}</button>
          <button onClick={() => setMenu(false)}>{labels.activity}</button>
        </div>
      )}
      <main>
        <section className="welcome-row">
          <div>
            <p className="eyebrow">MAHARASHTRA · 17 SEPTEMBER 2026</p>
            <h1>
              {labels.goodMorning},{" "}
              <em>{role === "farmer" ? "Suresh" : "FreshCart"}</em>
            </h1>
            <p className="muted">
              {role === "farmer"
                ? labels.farmerIntro
                : labels.buyerIntro}
            </p>
          </div>
          <div className="role-switch">
            <span>{labels.viewingAs}</span>
            <button
              className={role === "farmer" ? "selected" : ""}
              onClick={() => setRole("farmer")}
            >
              <Sprout size={15} /> {labels.farmer}
            </button>
            <button
              className={role === "buyer" ? "selected" : ""}
              onClick={() => setRole("buyer")}
            >
              <HandCoins size={15} /> {labels.buyer}
            </button>
          </div>
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
        {role === "farmer" ? (
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
                    ₹2,450<span>/qtl</span>
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
                    <p>22–25 September · {labels.expected} ₹2,580–2,650/qtl</p>
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
                  <button className="primary-btn" onClick={() => setScan(true)}>
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
                onClick={() => setScan(true)}
              >
                <Leaf size={16} /> {labels.addLot}
              </button>
            </div>
            <section className="lot-list">
              {lots.map((lot) => (
                <div className="lot-row" key={lot.id}>
                  <div className="crop-icon">
                    <Leaf size={18} />
                  </div>
                  <div className="lot-info">
                    <b>{lot.crop}</b>
                    <span>{lot.weight} · {labels.listed}</span>
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
                    <Leaf size={38} />
                    <Badge>{lot.grade}</Badge>
                  </div>
                  <div className="market-body">
                    <div className="crop-line">
                      <h3>{lot.crop}</h3>
                      <span>{lot.weight}</span>
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
        )}{" "}
      </main>
      {scan && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setScan(false)}>
              <X size={18} />
            </button>
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
              <input
                id="crop-sample"
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleSample}
              />
            </label>
            <button
              className="primary-btn full"
              disabled={!sampleImage}
              onClick={gradeSample}
            >
              {labels.upload}
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
            <label>
              {labels.crop}
              <input defaultValue="Onion" />
            </label>
            <label>
              {labels.quantity}
              <input type="number" defaultValue="500" />
            </label>
            <label>
              {labels.maximumPrice}
              <input type="number" defaultValue="2600" />
            </label>
            <button className="primary-btn full" type="submit">
              {labels.publishRfq} <ArrowUpRight size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default App;
