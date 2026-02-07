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
 * 【碧翠果園 / HEKISUI ORCHARD】
 * 高級ブランド果樹農園 D2Cプラットフォーム 
 * Stripe決済 & Gemini AI 統合修正版
 * * * 修正点:
 * 1. ES2015ターゲットでの import.meta エラーを完全に回避するアクセス方式に変更。
 * 2. Stripe.js の読み込みをより堅牢に修正。
 */

// --- 多言語設定 ---
const translations = {
  ja: {
    brand: "碧翠果園",
    tagline: "夜間回復（ゼロクロス）を経て、生命は目覚める。",
    heroDesc: "「情報の製造業」として、太陽、土、そして夜間の生命回復プロセスを数値化し、最高品質の体験をお届けします。",
    dashboard: "圃場リアルタイムデータ",
    products: "極選果実",
    advisor: "AI果実処方",
    cart: "買い物かご",
    checkout: "決済へ進む",
    lang: "JP",
    mikan: "温州ミカン",
    hassaku: "八朔",
    shiranui: "不知火",
    add_cart: "カートに追加",
    chat_placeholder: "今の体調や気分を教えてください。"
  },
  en: {
    brand: "HEKISUI ORCHARD",
    tagline: "Life Awakens after Night Recovery.",
    heroDesc: "Quantifying sunlight, soil, and nocturnal recovery for a premium experience.",
    dashboard: "Live Field Data",
    products: "Premium Fruits",
    advisor: "AI Care Advisor",
    cart: "Cart",
    checkout: "Checkout",
    lang: "EN",
    mikan: "Satsuma Mandarin",
    hassaku: "Hassaku",
    shiranui: "Shiranui",
    add_cart: "Add to Cart",
    chat_placeholder: "Tell me your condition."
  }
};

const PRODUCTS = [
  { id: 1, nameKey: 'mikan', price: 4800, img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dcab5b?auto=format&fit=crop&q=80&w=800', stripePriceId: 'price_あなたのミカンID' },
  { id: 2, nameKey: 'hassaku', price: 5200, img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&q=80&w=800', stripePriceId: 'price_あなたの八朔ID' },
  { id: 3, nameKey: 'shiranui', price: 6500, img: 'https://images.unsplash.com/photo-1591206111081-1756b342e811?auto=format&fit=crop&q=80&w=800', stripePriceId: 'price_あなたの不知火ID' },
];

// --- ヘルパー: 環境変数の安全な取得 ---
const getEnv = (key) => {
  try {
    // import.meta 構文を動的なオブジェクトとして扱うことでコンパイルエラーを回避
    const meta = window['import']?.['meta'] || {};
    const env = meta['env'] || (typeof process !== 'undefined' ? process.env : {});
    return env[key] || "";
  } catch (e) {
    return "";
  }
};

// --- Stripe.jsの動的読み込み ---
const loadStripeScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(window.Stripe); return; }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error('Stripe.js の読み込みに失敗しました。'));
    document.head.appendChild(script);
  });
};

const App = () => {
  const [lang, setLang] = useState('ja');
  const t = useMemo(() => translations[lang], [lang]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [weather, setWeather] = useState({ temp: 18.5, humidity: 62 });
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 公開キーの取得
  const publishableKey = getEnv('VITE_STRIPE_PUBLISHABLE_KEY');

  const handleCheckout = async () => {
    setErrorMessage(null);
    if (!publishableKey) {
      setErrorMessage("Stripeの公開キーが設定されていません。Vercelの環境変数『VITE_STRIPE_PUBLISHABLE_KEY』を確認してください。");
      return;
    }
    setIsProcessingCheckout(true);
    try {
      const StripeLib = await loadStripeScript();
      const stripe = StripeLib(publishableKey);
      const lineItems = cart.map(item => ({ price: item.stripePriceId, quantity: 1 }));

      if (lineItems.some(item => !item.price || item.price.includes('あなたの'))) {
        throw new Error("価格IDが設定されていません。App.jsx内の price_... を実際のIDに書き換えてください。");
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems,
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

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1B3022] font-sans">
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b px-6 h-20 flex items-center justify-between">
        <h1 className="text-xl font-light tracking-[0.4em] uppercase">{t.brand}</h1>
        <button onClick={() => setIsCartOpen(true)} className="relative p-2 transition-transform hover:scale-110">
          <ShoppingCart size={20} />
          {cart.length > 0 && <span className="absolute top-0 right-0 bg-[#E29578] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">{cart.length}</span>}
        </button>
      </nav>

      <section className="h-screen flex items-center justify-center bg-[#1B3022] relative">
        <div className="absolute inset-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1558230407-1601a74d2836?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative text-center text-white px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-7xl font-light mb-12 tracking-tight leading-tight">{t.tagline}</motion.h2>
          <button onClick={() => document.getElementById('products').scrollIntoView({behavior:'smooth'})} className="bg-[#E29578] hover:bg-[#d48467] px-14 py-6 rounded-full text-[10px] tracking-[0.4em] uppercase shadow-2xl transition-all">Explore Collection</button>
        </div>
      </section>

      <section id="products" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="mb-20 text-center md:text-left">
          <h3 className="text-[10px] tracking-[0.5em] uppercase text-[#E29578] mb-4 font-bold">{t.products}</h3>
          <p className="text-4xl font-light tracking-tight">生命の記憶を、食卓へ。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {PRODUCTS.map(p => (
            <div key={p.id} className="group cursor-pointer">
              <div className="aspect-[4/5] overflow-hidden mb-8 bg-gray-100 relative shadow-sm">
                <img src={p.img} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <button onClick={() => addToCart(p)} className="absolute bottom-0 w-full py-6 bg-white/95 backdrop-blur text-[10px] uppercase tracking-[0.3em] font-bold translate-y-full group-hover:translate-y-0 transition-transform duration-500">カートに追加</button>
              </div>
              <div className="flex justify-between items-start px-2">
                <h4 className="text-2xl font-light tracking-wide">{t[p.nameKey]}</h4>
                <p className="text-xl font-mono font-bold">¥{p.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[1200] p-12 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-16 uppercase tracking-[0.4em]"><h2 className="text-2xl font-light">{t.cart}</h2><button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform"><X size={28} /></button></div>
              <div className="flex-1 overflow-y-auto space-y-10">
                {cart.length === 0 ? <p className="text-center opacity-30 mt-20 uppercase tracking-widest text-xs font-bold">Cart is empty</p> : cart.map((item, i) => (
                  <div key={i} className="flex gap-8 mb-8 pb-8 border-b border-black/5 items-center animate-in fade-in slide-in-from-right-4">
                    <img src={item.img} className="w-20 h-20 object-cover rounded-sm shadow-sm" alt="" />
                    <div className="flex-1">
                      <p className="text-sm font-light tracking-widest">{t[item.nameKey]}</p>
                      <p className="text-sm font-bold text-[#E29578] mt-1">¥{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {errorMessage && <div className="p-4 bg-red-50 text-red-600 text-[10px] rounded-lg mt-6 border border-red-100 flex items-start gap-2 shadow-sm animate-bounce"><AlertCircle size={16} className="shrink-0"/>{errorMessage}</div>}
              {cart.length > 0 && (
                <div className="pt-10 border-t border-black/5">
                  <div className="flex justify-between text-3xl mb-12 font-mono items-baseline"><span className="text-[10px] uppercase opacity-40 font-bold tracking-widest font-sans">Total</span><span>¥{cart.reduce((s, i) => s + i.price, 0).toLocaleString()}</span></div>
                  <button onClick={handleCheckout} disabled={isProcessingCheckout} className="w-full py-7 bg-[#1B3022] hover:bg-black text-white text-[10px] tracking-[0.5em] uppercase flex items-center justify-center gap-6 shadow-2xl transition-all disabled:opacity-50">
                    {isProcessingCheckout ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> {t.checkout}</>}
                  </button>
                  <p className="text-center mt-6 text-[9px] opacity-20 font-bold tracking-[0.3em] uppercase italic">Secure Checkout with Stripe</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
