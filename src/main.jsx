import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ShoppingCart, ChevronRight, Droplets, Wind, 
  Thermometer, Sun, Languages, Send, ShieldCheck, 
  Leaf, Info, ArrowRight, CheckCircle2, Loader2,
  HeartPulse, Sparkles, Sprout, Globe, Award,
  Activity, Zap, Database, Eye, History, MapPin
} from 'lucide-react';

/**
 * HEKISUI ORCHARD - 碧翠果園
 * "Manufacturing Information"
 * * すべてのロジック、スタイル、i18nデータ、起動命令をこのファイルに集約しています。
 * Vercelデプロイ時は、GitHub上の src フォルダ内に main.jsx として保存してください。
 */

// --- 多言語辞書 (i18n) ---
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
    conceptDesc: "Not just produce, but the specific environment and history of each fruit. Full transparency."
  },
  zh: {
    brand: "碧翠果园",
    tagline: "夜间恢复后，生命觉醒。",
    heroDesc: "作为“信息制造业”，我们量化阳光、土壤呼吸和夜间恢复，提供优质体验。",
    dashboard: "实时田间数据",
    products: "精品水果",
    advisor: "AI 水果顾问",
    cart: "购物车",
    checkout: "去结账",
    lang: "ZH",
    mikan: "温州蜜柑",
    hassaku: "八朔",
    shiranui: "不知火",
    sugar: "糖度",
    acid: "酸度",
    add_cart: "加入购物车",
    status: "有货",
    chat_placeholder: "请告诉我您的身体状况。我会为您推荐最合适的水果。",
    concept: "销售生命的简历",
    conceptDesc: "不仅仅是农产品，还有每个水果的具体环境和历史。"
  },
  ko: {
    brand: "헤키스이 과수원",
    tagline: "야간 회복 후 생명이 깨어난다.",
    heroDesc: "「정보 제조업」으로서 우리는 햇빛, 토양의 호흡, 야간 회복을 수치화하여 프리미엄 경험을 제공합니다.",
    dashboard: "실시간 농장 데이터",
    products: "프리미엄 과일",
    advisor: "AI 과일 처방",
    cart: "장바구니",
    checkout: "결제하기",
    lang: "KO",
    mikan: "온주 밀감",
    hassaku: "핫사쿠",
    shiranui: "한라봉",
    sugar: "당도",
    acid: "산도",
    add_cart: "장바구니 담기",
    status: "재고 있음",
    chat_placeholder: "컨디션을 알려주세요. 최적의 과일을 추천해 드립니다.",
    concept: "생명의 이력을 판매하다",
    conceptDesc: "단순한 농산물이 아닌, 각 과일의 환경과 역사를 전달합니다."
  }
};

// --- 商品データ ---
const PRODUCTS = [
  { id: 1, nameKey: 'mikan', price: 4800, brix: 13.5, acid: 0.8, size: 'L', img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dcab5b?auto=format&fit=crop&q=80&w=800' },
  { id: 2, nameKey: 'hassaku', price: 5200, brix: 11.2, acid: 1.5, size: 'M', img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&q=80&w=800' },
  { id: 3, nameKey: 'shiranui', price: 6500, brix: 15.0, acid: 1.1, size: 'L', img: 'https://images.unsplash.com/photo-1591206111081-1756b342e811?auto=format&fit=crop&q=80&w=800' },
];

function App() {
  const [lang, setLang] = useState('ja');
  const t = useMemo(() => translations[lang], [lang]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [weather, setWeather] = useState({ temp: 18.5, humidity: 62, wind: 1.8 });
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Vercel環境変数からAPIキーを取得
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // 圃場データのシミュレーション
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

  // Gemini API連携 (AI Advisor)
  const handleGeminiChat = async () => {
    if (!chatMessage.trim()) return;
    
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    const input = chatMessage;
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたは高級果樹園「碧翠果園」のAIコンシェルジュです。顧客の悩み（${input}）に合わせて、温州ミカン、八朔、不知火のいずれかを推奨してください。回答は150文字以内で、優雅な日本語でお願いします。` }] }]
        })
      });
      
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ございません。現在コンシェルジュが離席しております。";
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "接続エラーが発生しました。Vercelの環境変数設定を確認してください。" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1B3022] font-sans selection:bg-[#E29578] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b border-[#1B3022]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 className="text-xl md:text-2xl font-light tracking-[0.5em] uppercase transition-all hover:tracking-[0.6em] cursor-pointer">
              {t.brand}
            </h1>
            <div className="hidden lg:flex gap-8 text-[10px] tracking-[0.3em] uppercase opacity-40 font-bold">
              <a href="#narrative" className="hover:opacity-100 transition-opacity">Narrative</a>
              <a href="#dashboard" className="hover:opacity-100 transition-opacity">Live Data</a>
              <a href="#products" className="hover:opacity-100 transition-opacity">Collection</a>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} className="text-[10px] tracking-widest uppercase border border-black/10 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-all font-bold">
              {t.lang}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative group p-2">
              <ShoppingCart size={20} className="group-hover:text-[#E29578] transition-colors" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-[#E29578] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center bg-[#1B3022] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1558230407-1601a74d2836?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-50 scale-105" alt="Dawn" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1B3022]/30 to-[#1B3022]" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.8, ease: "easeOut" }}>
            <span className="text-[#E29578] tracking-[0.6em] uppercase text-[10px] mb-8 block font-semibold">Zero Cross: Night Recovery</span>
            <h2 className="text-4xl md:text-8xl font-light text-white tracking-tighter mb-12 leading-[1.05]">{t.tagline}</h2>
            <p className="text-white/60 text-sm md:text-lg leading-relaxed mb-16 tracking-wide font-light max-w-3xl mx-auto">{t.heroDesc}</p>
            <button onClick={() => document.getElementById('products').scrollIntoView({behavior: 'smooth'})} className="px-14 py-6 bg-[#E29578] text-white text-[10px] tracking-[0.4em] uppercase hover:bg-[#D18467] transition-all rounded-full shadow-2xl">Shop Collection</button>
          </motion.div>
        </div>
      </section>

      {/* Real-time Dashboard */}
      <section id="dashboard" className="py-32 px-6 bg-white border-b border-black/5 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
            <div>
              <h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-6 font-bold flex items-center gap-3"><Activity size={14} /> {t.dashboard}</h3>
              <p className="text-3xl md:text-5xl font-light tracking-tight leading-snug">圃場は、今この瞬間も<br />太陽の記憶を刻んでいる。</p>
            </div>
            <div className="grid grid-cols-3 gap-12 lg:gap-24 border-l border-black/5 pl-12 lg:pl-24 font-mono">
              <div className="text-center group">
                <Thermometer size={24} className="mx-auto mb-4 text-[#E29578]" />
                <div className="text-3xl tracking-tighter">{weather.temp.toFixed(1)}°C</div>
              </div>
              <div className="text-center group">
                <Droplets size={24} className="mx-auto mb-4 text-[#E29578]" />
                <div className="text-3xl tracking-tighter">{weather.humidity.toFixed(0)}%</div>
              </div>
              <div className="text-center group">
                <Wind size={24} className="mx-auto mb-4 text-[#E29578]" />
                <div className="text-3xl tracking-tighter">{weather.wind.toFixed(1)}m</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/5 border border-black/5 shadow-sm">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-12 bg-white hover:bg-[#FDFCFB] transition-all group">
                <div className="flex justify-between items-start mb-16 opacity-20 group-hover:opacity-100 transition-opacity">
                  <div className="text-[9px] font-mono">NODE-0X{i} // LIVE</div>
                  <Zap size={14} className="text-[#E29578] animate-pulse" />
                </div>
                <h4 className="text-[11px] tracking-[0.3em] uppercase mb-6 font-bold text-[#1B3022]">Vitality Analysis</h4>
                <div className="h-[2px] w-full bg-black/5 mb-8 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${60 + Math.random() * 30}%` }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} className="h-full bg-[#1B3022]" />
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed uppercase tracking-widest group-hover:opacity-80 transition-opacity">生命回復フェーズを数値監視中。</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section id="narrative" className="py-32 px-6 bg-[#1B3022] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-2xl group">
             <img src="https://images.unsplash.com/photo-1594149929911-78975a43d4f5?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" alt="Nature" />
             <div className="absolute inset-0 bg-[#1B3022]/20 group-hover:bg-transparent transition-all" />
          </div>
          <div className="space-y-12">
            <h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] font-bold">{t.concept}</h3>
            <p className="text-4xl md:text-6xl font-light leading-tight tracking-tight">果実の「履歴」は、<br />未来への「処方箋」。</p>
            <p className="text-base text-white/60 leading-loose tracking-widest font-light">{t.conceptDesc} 私たちは、単に農産物を販売しているのではありません。生命の全プロセスをデータ化し提供します。</p>
            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-white/10">
              <div className="group cursor-pointer">
                <History size={28} className="mb-6 text-[#E29578] group-hover:rotate-12 transition-transform" />
                <p className="text-[9px] opacity-40 uppercase tracking-widest leading-relaxed">全ロットに栽培履歴を付与</p>
              </div>
              <div className="group cursor-pointer">
                <Eye size={28} className="mb-6 text-[#E29578] group-hover:rotate-12 transition-transform" />
                <p className="text-[9px] opacity-40 uppercase tracking-widest leading-relaxed">成分データの完全公開</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="products" className="py-32 px-6 bg-[#FDFCFB]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center md:text-left">
            <h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-6 font-bold">{t.products}</h3>
            <p className="text-4xl font-light tracking-tight">生命の記憶を、食卓へ。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
            {PRODUCTS.map((p) => (
              <motion.div key={p.id} whileHover={{ y: -15 }} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden mb-10 bg-white shadow-sm transition-shadow hover:shadow-2xl rounded-sm">
                  <img src={p.img} alt={t[p.nameKey]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-6 right-6 bg-white/95 px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold text-[#1B3022]">{t.status}</div>
                  <div className="absolute inset-0 bg-[#1B3022]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-full p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/95 backdrop-blur-md">
                    <button onClick={() => addToCart(p)} className="w-full py-5 bg-[#1B3022] text-white text-[10px] tracking-[0.4em] uppercase hover:bg-black transition-all shadow-lg">{t.add_cart} <ArrowRight size={16} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-start px-2">
                  <div>
                    <h4 className="text-2xl md:text-3xl font-light tracking-wide">{t[p.nameKey]}</h4>
                    <div className="flex gap-4 text-[9px] uppercase tracking-widest font-bold text-[#E29578] mt-6 pt-6 border-t border-black/5">
                      <span>{t.sugar} {p.brix}°</span><span>{t.acid} {p.acid}%</span>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-mono font-light text-[#1B3022]/80">¥{p.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Care Advisor Floating UI */}
      <div className="fixed bottom-10 right-10 z-[1000]">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-[#1B3022] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#E29578] transition-all group overflow-hidden"><Sparkles size={26} className="group-hover:scale-125 transition-transform" /></button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-[340px] md:w-[420px] h-[580px] bg-white shadow-3xl rounded-3xl border border-black/5 flex flex-col overflow-hidden">
            <div className="bg-[#1B3022] p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-[#E29578] flex items-center justify-center shadow-xl"><Sparkles size={20} /></div><div className="text-[10px] tracking-[0.3em] uppercase font-bold">{t.advisor}</div></div>
              <button onClick={() => setIsChatOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-[#FDFCFB]/50 scroll-smooth">
              {chatHistory.length === 0 && <div className="text-center py-20 opacity-30 flex flex-col items-center"><HeartPulse className="mb-10 text-[#E29578]" size={40} /><p className="text-[11px] leading-loose px-12 uppercase tracking-[0.2em] font-medium">{t.chat_placeholder}</p></div>}
              {chatHistory.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-5 text-[11px] rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-[#E29578] text-white shadow-lg' : 'bg-white border border-black/5 text-[#1B3022]'}`}>{msg.content}</div></div>)}
              {isChatLoading && <Loader2 className="animate-spin text-[#E29578] mx-auto mt-4" size={24} />}
            </div>
            <div className="p-8 border-t border-black/5 bg-white">
              <div className="flex items-center gap-4 bg-[#FDFCFB] rounded-full px-8 py-4 border border-black/5">
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGeminiChat()} placeholder="Ask your advisor..." className="flex-1 text-[12px] bg-transparent focus:outline-none" />
                <button onClick={handleGeminiChat} disabled={isChatLoading} className="text-[#E29578] hover:scale-125 transition-transform"><Send size={20} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-[1200] shadow-2xl p-12 md:p-16 flex flex-col">
              <div className="flex justify-between items-center mb-16"><h2 className="text-2xl font-light tracking-[0.4em] uppercase">{t.cart}</h2><button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-black/5 rounded-full transition-all"><X size={28} /></button></div>
              <div className="flex-1 overflow-y-auto space-y-12 pr-4 scroll-smooth">
                {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-10"><ShoppingCart size={72} className="mb-10" /><p className="text-sm tracking-[0.6em] uppercase font-bold">Your cart is empty</p></div> : cart.map((item, idx) => <div key={idx} className="flex gap-10 items-center pb-12 border-b border-black/5 group"><img src={item.img} className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-sm" alt="" /><div className="flex-1"><h4 className="text-lg md:text-xl font-light tracking-widest mb-3">{t[item.nameKey]}</h4><p className="text-base font-mono font-bold text-[#E29578]">¥{item.price.toLocaleString()}</p></div></div>)}
              </div>
              {cart.length > 0 && <div className="mt-16 pt-16 border-t border-black/5"><div className="flex justify-between items-end mb-16 px-4 font-mono"><span className="text-[10px] tracking-[0.5em] uppercase opacity-30 font-bold">Subtotal Amount</span><span className="text-4xl tracking-tighter">¥{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span></div><button className="w-full py-7 bg-[#1B3022] text-white text-[11px] tracking-[0.7em] uppercase flex items-center justify-center gap-6 hover:bg-black transition-all shadow-2xl shadow-black/20"><ShieldCheck size={20} /> {t.checkout}</button></div>}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1B3022] text-white py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          <div className="lg:col-span-1"><h2 className="text-2xl font-light tracking-[0.6em] uppercase mb-12">{t.brand}</h2><p className="text-[10px] opacity-40 leading-[2.8] uppercase tracking-[0.3em] font-medium">Ecological Farming based on "Manufacturing Information".<br />WAKAYAMA, JAPAN.</p></div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-16 border-t border-white/5 text-center md:text-left"><p className="text-[10px] opacity-20 tracking-[0.5em] uppercase font-bold">© 2026 HEKISUI ORCHARD. All Rights Reserved.</p></div>
      </footer>
    </div>
  );
}

// Reactのレンダリング開始（この部分が「白い画面」を防ぐためのエンジン起動命令です）
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
