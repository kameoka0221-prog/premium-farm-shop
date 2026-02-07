import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingCart, ChevronRight, Droplets, Wind, 
  Thermometer, Sun, Languages, Send, ShieldCheck, 
  Leaf, Info, ArrowRight, CheckCircle2, Loader2,
  HeartPulse, Sparkles, Sprout, Globe, Award,
  Activity, Zap, Database, Eye, History, MapPin, AlertCircle
} from 'lucide-react';

/**
 * HEKISUI ORCHARD - 碧翠果園
 * Stripe Checkout 連携・修正版 (Final Debug Version)
 */

// --- 多言語辞書 ---
const translations = {
  ja: {
    brand: "碧翠果園",
    tagline: "夜間回復を経て、生命は目覚める。",
    heroDesc: "「情報の製造業」として、私たちは果実が吸収した太陽、土の呼吸、そして夜間の生命回復プロセスを数値化し、最高品質の没入体験をお届けします。",
    dashboard: "圃場リアルタイムデータ",
    products: "極選果実",
    advisor: "AI果実処方",
    cart: "買い物かご",
    checkout: "決済へ進む",
    lang: "JP",
    mikan: "温州ミカン",
    hassaku: "八朔",
    shiranui: "不知火",
    sugar: "糖度",
    acid: "酸度",
    add_cart: "カートに追加",
    status: "出荷可能",
    chat_placeholder: "今の体調や気分を教えてください。最適な果実を処方します。",
    concept: "生命の履歴を販売する",
    conceptDesc: "単なる農産物ではなく、その個体がどのような環境で育ち、どのような「履歴」を持ったのか。全てのロットに透明性を。"
  },
  en: {
    brand: "HEKISUI ORCHARD",
    tagline: "Life Awakens after Night Recovery.",
    heroDesc: "As 'Information Manufacturers', we quantify sunlight, soil breath, and nocturnal recovery to deliver a premium experience.",
    dashboard: "Live Field Data",
    products: "Premium Fruits",
    advisor: "AI Care Advisor",
    cart: "Cart",
    checkout: "Proceed to Checkout",
    lang: "EN",
    mikan: "Satsuma Mandarin",
    hassaku: "Hassaku",
    shiranui: "Shiranui",
    sugar: "Brix",
    acid: "Acidity",
    add_cart: "Add to Cart",
    status: "In Stock",
    chat_placeholder: "Tell me your condition. I will prescribe the best fruit.",
    concept: "Selling the History of Life",
    conceptDesc: "Not just produce, but the specific environment and history of each fruit."
  }
};

// --- 商品データ (Stripeの価格IDを貼り付けてください) ---
const PRODUCTS = [
  { 
    id: 1, nameKey: 'mikan', price: 4800, brix: 13.5, acid: 0.8, size: 'L', 
    img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dcab5b?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_あなたのミカンID' 
  },
  { 
    id: 2, nameKey: 'hassaku', price: 5200, brix: 11.2, acid: 1.5, size: 'M', 
    img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_あなたの八朔ID' 
  },
  { 
    id: 3, nameKey: 'shiranui', price: 6500, brix: 15.0, acid: 1.1, size: 'L', 
    img: 'https://images.unsplash.com/photo-1591206111081-1756b342e811?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_あなたの不知火ID'
  },
];

// --- ヘルパー関数 ---

/**
 * 環境変数を安全に取得する関数
 * Viteの import.meta.env を直接使うと、一部のビルド環境でエラーになるため動的にアクセスします
 */
const getEnvVariable = (key) => {
  try {
    // import.meta.env が利用可能な場合はそこから取得
    // 直接的な構文エラーを避けるため、オプションチェーンと動的なチェックを使用
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    return env[key] || "";
  } catch (e) {
    // import.meta 自体が定義されていない環境（古いESターゲットなど）でのフォールバック
    return "";
  }
};

/**
 * Stripe.jsをCDN経由で読み込む
 */
const loadStripeScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error('Stripe.js の読み込みに失敗しました。'));
    document.head.appendChild(script);
  });
};

export default function App() {
  const [lang, setLang] = useState('ja');
  const t = useMemo(() => translations[lang], [lang]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [weather, setWeather] = useState({ temp: 18.5, humidity: 62, wind: 1.8 });
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 環境変数の取得
  const publishableKey = getEnvVariable('VITE_STRIPE_PUBLISHABLE_KEY');
  const geminiApiKey = ""; // Runtime provides the key

  // 決済実行
  const handleCheckout = async () => {
    setErrorMessage(null);
    if (!publishableKey) {
      setErrorMessage("Vercelの環境変数『VITE_STRIPE_PUBLISHABLE_KEY』が設定されていません。Vercelの設定画面を確認してください。");
      return;
    }
    if (cart.length === 0) return;

    setIsProcessingCheckout(true);

    try {
      const Stripe = await loadStripeScript();
      const stripeInstance = Stripe(publishableKey);
      
      const lineItems = cart.map(item => ({
        price: item.stripePriceId,
        quantity: 1
      }));

      // 価格IDが正しく設定されているか簡易チェック
      if (lineItems.some(item => !item.price || item.price.includes('あなたの'))) {
        throw new Error("商品の価格IDが設定されていません。プログラム内の 'price_...' を取得したIDに書き換えてください。");
      }

      const { error } = await stripeInstance.redirectToCheckout({
        lineItems: lineItems,
        mode: 'payment',
        successUrl: window.location.origin + '?status=success',
        cancelUrl: window.location.origin + '?status=cancel',
      });

      if (error) throw error;
    } catch (err) {
      console.error("Checkout Error:", err);
      setErrorMessage(`決済エラー: ${err.message}`);
      setIsProcessingCheckout(false);
    }
  };

  // 圃場データシミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        temp: prev.temp + (Math.random() - 0.5) * 0.1,
        humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 0.2)),
        wind: Math.max(0, prev.wind + (Math.random() - 0.5) * 0.1)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // AI Advisor
  const handleGeminiChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    const input = chatMessage;
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたは高級果樹園「碧翠果園」のAIコンシェルジュです。顧客の悩み: ${input} に対し、最適な果実を推奨してください。` }] }]
        })
      });
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "コンシェルジュが離席中です。";
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "接続エラーです。しばらく経ってからお試しください。" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1B3022] font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b border-[#1B3022]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.5em] uppercase cursor-pointer">{t.brand}</h1>
          <div className="flex items-center gap-6">
             <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} className="text-[10px] tracking-widest uppercase border border-black/10 px-3 py-1.5 rounded-full font-bold">
              {lang === 'ja' ? 'EN' : 'JP'}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-[#E29578] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center bg-[#1B3022]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1558230407-1601a74d2836?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-40" alt="Dawn" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
            <h2 className="text-4xl md:text-8xl font-light text-white tracking-tighter mb-12">{t.tagline}</h2>
            <button onClick={() => document.getElementById('products').scrollIntoView({behavior: 'smooth'})} className="px-14 py-6 bg-[#E29578] text-white text-[10px] tracking-[0.4em] uppercase rounded-full shadow-2xl transition-all hover:bg-[#D18467]">Shop Now</button>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Summary */}
      <section className="py-20 px-6 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
           <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E29578] mb-2 font-bold flex items-center gap-2">
              <Activity size={12} /> {t.dashboard}
            </div>
            <div className="text-2xl font-light">{weather.temp.toFixed(1)}°C / {weather.humidity.toFixed(0)}% RH</div>
          </div>
          <div className="col-span-2">
            <p className="text-sm opacity-50 leading-relaxed max-w-2xl">{t.heroDesc}</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-4 font-bold">{t.products}</h3>
            <p className="text-4xl font-light tracking-tight">生命の記憶を、食卓へ。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden mb-10 bg-white shadow-sm rounded-sm">
                  <img src={p.img} alt={t[p.nameKey]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute bottom-0 left-0 w-full p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/95 backdrop-blur-md">
                    <button onClick={() => addToCart(p)} className="w-full py-5 bg-[#1B3022] text-white text-[10px] tracking-[0.4em] uppercase shadow-lg hover:bg-black transition-colors">カートに追加</button>
                  </div>
                </div>
                <div className="flex justify-between items-start px-2">
                  <h4 className="text-2xl font-light">{t[p.nameKey]}</h4>
                  <p className="text-xl font-mono font-bold">¥{p.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advisor Floating UI */}
      <div className="fixed bottom-10 right-10 z-[1000]">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-[#1B3022] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
            <Sparkles size={26} />
          </button>
        ) : (
          <div className="w-[340px] md:w-[420px] h-[580px] bg-white shadow-3xl rounded-3xl border border-black/5 flex flex-col overflow-hidden">
            <div className="bg-[#1B3022] p-8 text-white flex justify-between items-center">
              <span className="text-[10px] tracking-widest uppercase font-bold flex items-center gap-2"><Sparkles size={14} /> {t.advisor}</span>
              <button onClick={() => setIsChatOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-[#FDFCFB]">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
                   <HeartPulse size={40} className="mb-4 text-[#E29578]" />
                   <p className="text-[10px] uppercase tracking-widest">{t.chat_placeholder}</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl text-xs leading-loose max-w-[85%] ${msg.role === 'user' ? 'bg-[#E29578] text-white shadow-md' : 'bg-white border text-[#1B3022]'}`}>{msg.content}</div>
                </div>
              ))}
              {isChatLoading && <Loader2 className="animate-spin text-[#E29578] mx-auto" size={20} />}
            </div>
            <div className="p-8 border-t flex gap-4 bg-white">
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGeminiChat()} className="flex-1 text-xs focus:outline-none" placeholder="お悩みを聞かせてください..." />
              <button onClick={handleGeminiChat} disabled={isChatLoading} className="text-[#E29578] hover:scale-110 disabled:opacity-30 transition-transform"><Send size={20} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-[1200] shadow-2xl p-12 flex flex-col">
              <div className="flex justify-between items-center mb-16">
                <h2 className="text-2xl font-light tracking-[0.4em] uppercase">{t.cart}</h2>
                <button onClick={() => setIsCartOpen(false)}><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <ShoppingCart size={64} className="mb-6" />
                    <p className="uppercase tracking-[0.3em] font-bold">Cart is empty</p>
                  </div>
                ) : cart.map((item, idx) => (
                  <div key={idx} className="flex gap-10 items-center pb-10 border-b mb-10 border-black/5">
                    <img src={item.img} className="w-24 h-24 object-cover rounded-sm shadow-sm" />
                    <div className="flex-1 font-mono">
                      <h4 className="text-lg font-sans mb-2">{t[item.nameKey]}</h4>
                      <p className="text-[#E29578] font-bold">¥{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 text-[10px] flex items-start gap-3 border border-red-100 rounded-lg">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-10 pt-10 border-t border-black/5 font-mono">
                  <div className="flex justify-between text-3xl mb-12 items-baseline">
                    <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest font-sans">Total</span>
                    <span>¥{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout} 
                    disabled={isProcessingCheckout} 
                    className="w-full py-7 bg-[#1B3022] text-white tracking-[0.7em] uppercase flex items-center justify-center gap-6 shadow-2xl disabled:opacity-50 transition-all hover:bg-black"
                  >
                    {isProcessingCheckout ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> {t.checkout}</>}
                  </button>
                  <p className="text-center mt-6 text-[9px] opacity-30 font-bold italic">SECURE STRIPE CHECKOUT</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
