import React, { useState, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, ShoppingCart, ChevronRight, Droplets, Wind, 
  Thermometer, Sun, Languages, Send, ShieldCheck, 
  Leaf, Info, ArrowRight, CheckCircle2, Loader2,
  HeartPulse, Sparkles, Sprout, Globe, Award,
  Activity, Zap, Database, Eye, History, MapPin, CreditCard
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

/**
 * HEKISUI ORCHARD - 碧翠果園
 * Stripe Checkout Integration Version
 */

// --- i18n 多言語設定 ---
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
    checkout: "Checkout",
    lang: "EN",
    mikan: "Satsuma Mandarin",
    hassaku: "Hassaku",
    shiranui: "Shiranui",
    sugar: "Brix",
    acid: "Acidity",
    add_cart: "Add to Cart",
    status: "In Stock",
    chat_placeholder: "Tell me your condition. I will prescribe the best fruit.",
    concept: "Selling Life History",
    conceptDesc: "Not just produce, but the specific environment and history of each fruit. Transparency for every lot."
  }
}

// --- 商品データ (Stripeの価格IDをここに紐付けます) ---
const PRODUCTS = [
  { 
    id: 1, 
    nameKey: 'mikan', 
    price: 4800, 
    brix: 13.5, 
    acid: 0.8, 
    size: 'L', 
    img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dcab5b?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_YOUR_MIKAN_ID' // Stripeダッシュボードで取得したIDに書き換えてください
  },
  { 
    id: 2, 
    nameKey: 'hassaku', 
    price: 5200, 
    brix: 11.2, 
    acid: 1.5, 
    size: 'M', 
    img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_YOUR_HASSAKU_ID' 
  },
  { 
    id: 3, 
    nameKey: 'shiranui', 
    price: 6500, 
    brix: 15.0, 
    acid: 1.1, 
    size: 'L', 
    img: 'https://images.unsplash.com/photo-1591206111081-1756b342e811?auto=format&fit=crop&q=80&w=800',
    stripePriceId: 'price_YOUR_SHIRANUI_ID'
  },
]

const App = () => {
  const [lang, setLang] = useState('ja')
  const t = useMemo(() => translations[lang], [lang])
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [weather, setWeather] = useState({ temp: 18.5, humidity: 62, wind: 1.8 })
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)

  // 環境変数からStripe公開キーを取得
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ""

  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        temp: prev.temp + (Math.random() - 0.5) * 0.1,
        humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 0.2)),
        wind: Math.max(0, prev.wind + (Math.random() - 0.5) * 0.1)
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Stripe決済実行ロジック
  const handleCheckout = async () => {
    setIsProcessingCheckout(true)
    const stripe = await stripePromise

    // カート内の商品をStripeが理解できる形式に変換
    const lineItems = cart.map(item => ({
      price: item.stripePriceId,
      quantity: 1
    }))

    const { error } = await stripe.redirectToCheckout({
      lineItems: lineItems,
      mode: 'payment',
      successUrl: window.location.origin + '?status=success',
      cancelUrl: window.location.origin + '?status=cancel',
    })

    if (error) {
      console.error("Stripe Error:", error)
      setIsProcessingCheckout(false)
    }
  }

  const handleGeminiChat = async () => {
    if (!chatMessage.trim()) return
    const userMsg = { role: 'user', content: chatMessage }
    setChatHistory(prev => [...prev, userMsg])
    const currentInput = chatMessage
    setChatMessage('')
    setIsChatLoading(true)

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `あなたは高級果樹園「碧翠果園」のAIコンシェルジュです。悩み:「${currentInput}」に対し、最適な果実を優雅に提案してください。150字以内。` }] }]
        })
      })
      const data = await response.json()
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "コンシェルジュが離席中です。"
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }])
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "接続に失敗しました。" }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart([...cart, product])
    setIsCartOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1B3022] font-sans selection:bg-[#E29578] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b border-[#1B3022]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.5em] uppercase cursor-pointer">{t.brand}</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} className="text-[10px] tracking-widest uppercase border border-black/10 px-3 py-1.5 rounded-full font-bold">{translations[lang === 'ja' ? 'en' : 'ja'].lang}</button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2"><ShoppingCart size={20} />{cart.length > 0 && <span className="absolute top-0 right-0 bg-[#E29578] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center bg-[#1B3022] overflow-hidden">
        <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1558230407-1601a74d2836?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-40" alt="Dawn" /></div>
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5 }}>
            <span className="text-[#E29578] tracking-[0.6em] uppercase text-[10px] mb-8 block font-semibold font-mono">Zero Cross Phase</span>
            <h2 className="text-4xl md:text-8xl font-light text-white tracking-tighter mb-12 leading-[1.05]">{t.tagline}</h2>
            <p className="text-white/60 text-sm md:text-lg mb-16 max-w-3xl mx-auto font-light">{t.heroDesc}</p>
            <button onClick={() => document.getElementById('products').scrollIntoView({behavior: 'smooth'})} className="px-14 py-6 bg-[#E29578] text-white text-[10px] tracking-[0.4em] uppercase hover:bg-[#D18467] transition-all rounded-full shadow-2xl">Explore Collection</button>
          </motion.div>
        </div>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="py-32 px-6 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
          <div><h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-6 font-bold flex items-center gap-3"><Activity size={14} /> {t.dashboard}</h3><p className="text-3xl md:text-5xl font-light tracking-tight">圃場は、太陽の記憶を刻んでいる。</p></div>
          <div className="grid grid-cols-3 gap-12 font-mono text-center">
            <div><Thermometer size={24} className="mx-auto mb-4 text-[#E29578]" /><div className="text-3xl">{weather.temp.toFixed(1)}°C</div></div>
            <div><Droplets size={24} className="mx-auto mb-4 text-[#E29578]" /><div className="text-3xl">{weather.humidity.toFixed(0)}%</div></div>
            <div><Wind size={24} className="mx-auto mb-4 text-[#E29578]" /><div className="text-3xl">{weather.wind.toFixed(1)}m</div></div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-32 px-6 bg-[#FDFCFB]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24"><h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-6 font-bold">{t.products}</h3><p className="text-4xl font-light tracking-tight">生命の記憶を、食卓へ。</p></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
            {PRODUCTS.map((p) => (
              <motion.div key={p.id} whileHover={{ y: -15 }} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden mb-10 bg-white shadow-sm rounded-sm">
                  <img src={p.img} alt={t[p.nameKey]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute top-6 right-6 bg-white/95 px-4 py-2 text-[9px] font-bold text-[#1B3022]">{t.status}</div>
                  <div className="absolute bottom-0 left-0 w-full p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/95 backdrop-blur-md">
                    <button onClick={() => addToCart(p)} className="w-full py-5 bg-[#1B3022] text-white text-[10px] tracking-[0.4em] uppercase hover:bg-black transition-all shadow-lg">{t.add_cart} <ArrowRight size={16} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-start px-2">
                  <div><h4 className="text-2xl font-light tracking-wide">{t[p.nameKey]}</h4><p className="text-[10px] opacity-30 uppercase font-bold mt-2">Grade A / Size {p.size}</p></div>
                  <p className="text-xl font-mono font-bold">¥{p.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Care Advisor */}
      <div className="fixed bottom-10 right-10 z-[1000]">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-[#1B3022] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#E29578] transition-all"><Sparkles size={26} /></button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-[340px] md:w-[420px] h-[580px] bg-white shadow-3xl rounded-3xl border border-black/5 flex flex-col overflow-hidden">
            <div className="bg-[#1B3022] p-8 text-white flex justify-between items-center relative">
              <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-[#E29578] flex items-center justify-center"><Sparkles size={18} /></div><div className="text-[10px] tracking-widest font-bold uppercase">{t.advisor}</div></div>
              <button onClick={() => setIsChatOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-[#FDFCFB]/50 scroll-smooth text-[11px]">
              {chatHistory.length === 0 && <div className="text-center py-20 opacity-30 flex flex-col items-center"><HeartPulse className="mb-10 text-[#E29578]" size={40} /><p className="px-12 uppercase tracking-[0.2em] font-medium">{t.chat_placeholder}</p></div>}
              {chatHistory.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-[#E29578] text-white shadow-lg' : 'bg-white border border-black/5 text-[#1B3022]'}`}>{msg.content}</div></div>)}
              {isChatLoading && <Loader2 className="animate-spin text-[#E29578] mx-auto mt-4" size={24} />}
            </div>
            <div className="p-8 border-t border-black/5 bg-white flex items-center gap-4 group">
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGeminiChat()} placeholder="Ask advisor..." className="flex-1 text-[12px] bg-transparent focus:outline-none" />
              <button onClick={handleGeminiChat} disabled={isChatLoading} className="text-[#E29578] hover:scale-125 transition-transform"><Send size={20} /></button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cart Drawer with Stripe Checkout */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-[1200] shadow-2xl p-12 md:p-16 flex flex-col">
              <div className="flex justify-between items-center mb-16"><h2 className="text-2xl font-light tracking-[0.4em] uppercase">{t.cart}</h2><button onClick={() => setIsCartOpen(false)}><X size={28} /></button></div>
              <div className="flex-1 overflow-y-auto space-y-12 pr-4 scroll-smooth font-mono">
                {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-10"><ShoppingCart size={72} className="mb-10" /><p className="text-sm tracking-[0.6em] font-bold uppercase">Cart is empty</p></div> : cart.map((item, idx) => <div key={idx} className="flex gap-10 items-center pb-12 border-b border-black/5 group"><img src={item.img} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-sm shadow-sm" /><div className="flex-1"><h4 className="text-lg tracking-widest mb-3 font-light font-sans">{t[item.nameKey]}</h4><p className="text-base font-bold text-[#E29578]">¥{item.price.toLocaleString()}</p></div></div>)}
              </div>
              {cart.length > 0 && (
                <div className="mt-16 pt-16 border-t border-black/5 font-mono">
                  <div className="flex justify-between items-end mb-16 px-4 font-mono text-3xl"><span className="text-[10px] tracking-[0.5em] uppercase opacity-30 font-bold">Subtotal</span><span>¥{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span></div>
                  <button 
                    onClick={handleCheckout} 
                    disabled={isProcessingCheckout}
                    className="w-full py-7 bg-[#1B3022] text-white text-[11px] tracking-[0.7em] uppercase flex items-center justify-center gap-6 hover:bg-black transition-all shadow-2xl disabled:opacity-50"
                  >
                    {isProcessingCheckout ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> {t.checkout}</>}
                  </button>
                  <div className="text-center mt-10 opacity-20 font-bold italic text-[9px]">STRIPE SECURE CHECKOUT</div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
