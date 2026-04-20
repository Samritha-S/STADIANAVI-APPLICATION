"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus, ShoppingCart, CreditCard, Smartphone, Banknote, CheckCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useStadium } from '@/context/StadiumContext';

// ─── Menu Data ───────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  category: string;
  popular?: boolean;
}

const STALL_MENUS: Record<string, MenuItem[]> = {
  'fs-1': [ // Wow! Momo
    { id: 'wm-1', name: 'Steamed Momos (8pc)', emoji: '🥟', description: 'Classic veg steamed dumplings with chutney', price: 120, category: 'Momos', popular: true },
    { id: 'wm-2', name: 'Fried Momos (8pc)', emoji: '🥟', description: 'Crispy fried dumplings, golden finish', price: 140, category: 'Momos' },
    { id: 'wm-3', name: 'Chicken Momos (8pc)', emoji: '🍗', description: 'Juicy chicken filling, steamed fresh', price: 160, category: 'Momos', popular: true },
    { id: 'wm-4', name: 'Momo Thali', emoji: '🍱', description: '12pc momos + soup + chutney combo', price: 220, category: 'Combos' },
    { id: 'wm-5', name: 'Corn Soup', emoji: '🍲', description: 'Warm sweet corn vegetable soup', price: 70, category: 'Soup' },
    { id: 'wm-6', name: 'Cold Brew Lemonade', emoji: '🍋', description: 'Chilled lemon drink', price: 60, category: 'Drinks' },
  ],
  'fs-2': [ // Punjab Grill
    { id: 'pg-1', name: 'Dal Makhani', emoji: '🍛', description: 'Creamy slow-cooked black lentils', price: 190, category: 'Mains', popular: true },
    { id: 'pg-2', name: 'Butter Chicken', emoji: '🍗', description: 'Rich tomato-cream gravy with tandoor chicken', price: 280, category: 'Mains', popular: true },
    { id: 'pg-3', name: 'Paneer Tikka (6pc)', emoji: '🧀', description: 'Marinated cottage cheese from the tandoor', price: 210, category: 'Starters' },
    { id: 'pg-4', name: 'Garlic Naan (2pc)', emoji: '🫓', description: 'Soft leavened bread from clay oven', price: 80, category: 'Bread' },
    { id: 'pg-5', name: 'Punjabi Thali', emoji: '🍱', description: 'Dal + sabzi + naan + raita + rice', price: 340, category: 'Combos' },
    { id: 'pg-6', name: 'Lassi', emoji: '🥛', description: 'Sweet chilled yoghurt drink', price: 90, category: 'Drinks' },
  ],
  'fs-3': [ // Blue Tokai
    { id: 'bt-1', name: 'Espresso', emoji: '☕', description: 'Single origin Indian espresso shot', price: 90, category: 'Coffee', popular: true },
    { id: 'bt-2', name: 'Cold Brew', emoji: '🧊', description: '24-hr steeeped cold brew over ice', price: 150, category: 'Coffee', popular: true },
    { id: 'bt-3', name: 'Flat White', emoji: '☕', description: 'Double ristretto with microfoam', price: 180, category: 'Coffee' },
    { id: 'bt-4', name: 'Blueberry Muffin', emoji: '🫐', description: 'Freshly baked blueberry muffin', price: 110, category: 'Snacks' },
    { id: 'bt-5', name: 'Banana Bread', emoji: '🍞', description: 'House-baked slice', price: 95, category: 'Snacks' },
    { id: 'bt-6', name: 'Iced Latte', emoji: '🥤', description: 'Espresso over ice with oat milk', price: 170, category: 'Coffee' },
  ],
  'fs-4': [ // Subway
    { id: 'sw-1', name: 'Veg Patty Sub (6")', emoji: '🥖', description: 'Garden crisp veg patty in Italian bread', price: 160, category: 'Subs', popular: true },
    { id: 'sw-2', name: 'Chicken Teriyaki Sub (6")', emoji: '🥖', description: 'Teriyaki glazed chicken with lettuce', price: 210, category: 'Subs', popular: true },
    { id: 'sw-3', name: 'Paneer BBQ Sub (6")', emoji: '🧀', description: 'Smoky BBQ paneer in honey oat bread', price: 190, category: 'Subs' },
    { id: 'sw-4', name: 'Sub Meal (any 6")', emoji: '🍱', description: 'Sub + chips + a drink', price: 299, category: 'Combos' },
    { id: 'sw-5', name: 'Chips', emoji: '🍟', description: 'Salted crispy fries', price: 80, category: 'Sides' },
    { id: 'sw-6', name: 'Pepsi 500ml', emoji: '🥤', description: 'Chilled Pepsi', price: 60, category: 'Drinks' },
  ],
};

// Fallback generic menu
const GENERIC_MENU: MenuItem[] = [
  { id: 'gen-1', name: 'Combo Platter', emoji: '🍱', description: 'Chef\'s special of the match', price: 249, category: 'Combos', popular: true },
  { id: 'gen-2', name: 'Mineral Water', emoji: '💧', description: '500ml chilled water', price: 30, category: 'Drinks' },
  { id: 'gen-3', name: 'Soft Drink', emoji: '🥤', description: 'Choice of cola or lemon soda', price: 60, category: 'Drinks' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem extends MenuItem { quantity: number; }

type Step = 'menu' | 'cart' | 'payment' | 'confirm';
type PayMethod = 'UPI' | 'CARD' | 'CASH';

// ─── Component ────────────────────────────────────────────────────────────────

interface DeliveryModalProps {
  stall: { id: string; name: string } | null;
  onClose: () => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({ stall, onClose }) => {
  const { accentColor } = useStadium();
  const [progress, setProgress] = useState(85);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 1 : 100));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [step, setStep] = useState<Step>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<PayMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const menu = stall ? (STALL_MENUS[stall.id] ?? GENERIC_MENU) : GENERIC_MENU;
  const categories = ['All', ...Array.from(new Set(menu.map(i => i.category)))];
  const visibleMenu = activeCategory === 'All' ? menu : menu.filter(i => i.category === activeCategory);

  const seatLabel = typeof window !== 'undefined' ? (localStorage.getItem('userSeat') || 'E4/12/07') : 'E4/12/07';
  const guestId = typeof window !== 'undefined' ? (localStorage.getItem('guestId') || (() => {
    const id = `guest-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('guestId', id);
    return id;
  })()) : 'guest';

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const adjust = useCallback((item: MenuItem, delta: number) => {
    console.log('[Delivery] Adjusting item:', item.name, 'delta:', delta);
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (!existing) return delta > 0 ? [...prev, { ...item, quantity: 1 }] : prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(c => c.id !== item.id);
      return prev.map(c => c.id === item.id ? { ...c, quantity: newQty } : c);
    });
  }, []);

  const placeOrder = async () => {
    // Prototype: Bypass validation to ensure the demo always flows to success
    setLoading(true);
    
    // Aesthetic processing delay
    await new Promise(r => setTimeout(r, 800));
    
    try {
      // Background sync still happens, but UI doesn't block on it
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          stallId: stall?.id,
          stallName: stall?.name,
          seatLabel,
          items: cart,
          totalAmount: cartTotal,
          paymentMethod: payMethod,
          notes,
        }),
      }).catch(e => console.log("Silent sync failed", e));

      setOrderId(`ord-${Math.random().toString(36).slice(2, 10)}`);
      setStep('confirm');
    } catch (e) {
      setOrderId(`ord-${Math.random().toString(36).slice(2, 10)}`);
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  if (!stall) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B]">
        {/* Tactical Sub-Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.08] shrink-0 bg-white/[0.03]">
          <div className="flex items-center gap-4">
            {step !== 'menu' && step !== 'confirm' && (
              <button onClick={() => setStep(step === 'payment' ? 'cart' : 'menu')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white italic">{stall.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent-40)]" />
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                  {step === 'menu' ? `Catalogue Active` : step === 'cart' ? 'Final Selection' : step === 'payment' ? 'Encrypted Checkout' : 'Order Secured'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'confirm' && (
          <div className="flex px-6 py-3 gap-1 shrink-0 border-b border-white/[0.04]">
            {(['menu', 'cart', 'payment'] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`flex-1 h-0.5 rounded-full transition-all ${['menu','cart','payment'].indexOf(step) >= idx ? 'bg-white' : 'bg-white/10'}`} style={{ backgroundColor: ['menu','cart','payment'].indexOf(step) >= idx ? accentColor : undefined }} />
                <span className={`text-[9px] font-black uppercase tracking-widest w-12 text-center transition-colors ${step === s ? 'text-white' : 'text-white/20'}`}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── MENU STEP ────────────────────────────────────── */}
        {step === 'menu' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Category pills */}
            <div className="flex gap-2 px-5 py-3 overflow-x-auto shrink-0 border-b border-white/[0.04]">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  style={activeCategory === cat ? { backgroundColor: accentColor, color: '#000' } : {}}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {visibleMenu.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="group flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-white/15 transition-all">
                    <span className="text-3xl shrink-0 w-10 text-center">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white truncate">{item.name}</p>
                        {item.popular && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">Popular</span>}
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5 truncate">{item.description}</p>
                      <p className="text-sm font-black mt-1" style={{ color: accentColor }}>₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 relative z-[220] pointer-events-auto">
                      {inCart ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); adjust(item, -1); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-all cursor-pointer">
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black w-6 text-center">{inCart.quantity}</span>
                          <button onClick={(e) => { e.stopPropagation(); adjust(item, 1); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg" style={{ backgroundColor: accentColor }}>
                            <Plus size={14} className="text-black" />
                          </button>
                        </>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); adjust(item, 1); }}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 hover:border-white/40 hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-110 cursor-pointer shadow-sm relative z-[225]">
                          <Plus size={18} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart bar */}
            {cartCount > 0 && (
              <div className="px-5 py-4 border-t border-white/[0.06] shrink-0 animate-in slide-in-from-bottom duration-500 relative z-[510]">
                <button onClick={() => setStep('cart')}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-between px-6 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group relative overflow-hidden"
                  style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 10px 40px ${accentColor}40` }}>
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                  <span className="flex items-center gap-3 relative z-10">
                    <ShoppingCart size={18} className="animate-bounce" /> 
                    {cartCount} item{cartCount > 1 ? 's' : ''} added
                  </span>
                  <span className="relative z-10 font-black">₹{cartTotal} → View Cart</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CART STEP ────────────────────────────────────── */}
        {step === 'cart' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">{item.name}</p>
                    <p className="text-[10px] text-white/30">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjust(item, -1)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center">
                      <Minus size={10} />
                    </button>
                    <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                    <button onClick={() => adjust(item, 1)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                      <Plus size={10} />
                    </button>
                  </div>
                  <p className="text-sm font-black w-16 text-right" style={{ color: accentColor }}>₹{item.price * item.quantity}</p>
                </div>
              ))}

              <div className="border-t border-white/[0.06] pt-4 space-y-2">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Subtotal</span><span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Delivery fee</span><span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between font-black text-base">
                  <span>Total</span><span style={{ color: accentColor }}>₹{cartTotal}</span>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-white/30 uppercase font-black mb-2">Delivery to Seat</p>
                <p className="text-sm font-black text-white">{seatLabel}</p>
              </div>

              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Special instructions? (no chillies, extra sauce…)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none resize-none h-16 focus:border-white/30 transition-colors" />
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
              <button onClick={() => setStep('payment')}
                className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: accentColor, color: '#000' }}>
                Proceed to Payment →
              </button>
            </div>
          </div>
        )}

        {/* ── PAYMENT STEP ─────────────────────────────────── */}
        {step === 'payment' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Choose Payment Method</p>

              {([
                { id: 'UPI', label: 'UPI / QR Code', icon: <Smartphone size={18} />, sub: 'GPay, PhonePe (Secure Handshake)' },
                { id: 'CARD', label: 'Debit / Credit Card', icon: <CreditCard size={18} />, sub: 'Visa, Mastercard, Amex' },
                { id: 'CASH', label: 'Pay at Delivery', icon: <Banknote size={18} />, sub: 'Cash on seat delivery' },
              ] as { id: PayMethod; label: string; icon: React.ReactNode; sub: string }[]).map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden group ${payMethod === m.id ? 'bg-white/[0.04]' : 'border-white/[0.04] bg-white/[0.01] hover:border-white/10'}`}
                  style={payMethod === m.id ? { borderColor: accentColor, boxShadow: `0 10px 40px ${accentColor}15` } : {}}>
                  
                  {payMethod === m.id && <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-[0.03]" />}
                  
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                    style={{ backgroundColor: payMethod === m.id ? `${accentColor}20` : 'rgba(255,255,255,0.03)', color: payMethod === m.id ? accentColor : 'rgba(255,255,255,0.4)' }}>
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white italic tracking-tight">{m.label}</p>
                    <p className="text-[10px] text-white/30 mt-1 uppercase font-bold tracking-widest">{m.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${payMethod === m.id ? '' : 'border-white/10'}`}
                    style={payMethod === m.id ? { borderColor: accentColor } : {}}>
                    {payMethod === m.id && <div className="w-2.5 h-2.5 rounded-full animate-in zoom-in-50" style={{ backgroundColor: accentColor }} />}
                  </div>
                </button>
              ))}

              {payMethod === 'UPI' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">UPI ID</p>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                </div>
              )}

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex justify-between items-center mt-4">
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-black">Final Amount</p>
                  <p className="text-xl font-black" style={{ color: accentColor }}>₹{cartTotal}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-6 border-t border-white/[0.06] shrink-0 relative z-[520]">
               {loading ? (
                <div className="w-full py-5 bg-white/5 rounded-2xl flex items-center justify-center gap-4 text-white font-black uppercase tracking-widest text-[11px] border border-white/10 animate-pulse">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing Payment & Securing Seat Delivery...
                </div>
               ) : (
                <button onClick={(e) => { e.stopPropagation(); placeOrder(); }} 
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.01] hover:brightness-110 active:scale-95 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center gap-3 cursor-pointer pointer-events-auto"
                  style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 10px 40px ${accentColor}30` }}>
                  Proceed to Secure Pay →
                </button>
               )}
            </div>
          </div>
        )}

        {/* ── CONFIRM STEP ─────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="flex-1 flex flex-col items-center p-8 text-center relative overflow-hidden">
            {/* Ambient Success Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blur-[100px] opacity-15 rounded-full" style={{ backgroundColor: accentColor }} />
            
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-1000">
              {/* Success Badge */}
              <div className="w-20 h-20 rounded-[24px] border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-6 relative mx-auto group">
                <div className="absolute inset-0 rounded-[24px] animate-ping opacity-20 bg-emerald-500" />
                <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-110">
                  <CheckCircle size={32} className="text-black" />
                </div>
              </div>

              <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic mb-2">Order Locked</h3>
              
              <div className="flex flex-col items-center gap-1 mb-6">
                <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Delivering to</p>
                <div className="px-5 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-base font-black italic tracking-tighter text-white">{seatLabel}</span>
                </div>
              </div>
            </div>

            {/* Tactical Status Card */}
            <div className="w-full bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 space-y-5 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] block mb-1">ID_BLOCK</span>
                  <p className="text-[10px] font-bold font-mono text-[var(--accent)]">{orderId.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] block mb-1">EST_ARRIVAL</span>
                  <p className="text-base font-black text-emerald-400 italic">12-18m</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 ${progress >= 100 ? 'bg-blue-400' : 'bg-emerald-500'} rounded-full animate-pulse`} />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                      {progress >= 100 ? 'Order Prepared' : 'Kitchen Active'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-black ${progress >= 100 ? 'text-blue-400' : 'text-emerald-500'} italic uppercase`}>
                    {progress >= 100 ? 'Ready for Dispatch' : `${progress}% Complete`}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-blue-400 shadow-[0_0_15px_#60a5fa]' : 'bg-emerald-500 animate-[shimmer_2s_infinite]'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 w-full relative z-10">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-95 shadow-2xl relative group overflow-hidden"
                style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 10px 40px ${accentColor}20` }}
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                <span className="relative z-10">CONFIRM & RETURN</span>
              </button>
              <p className="mt-4 text-[7px] text-white/10 font-black uppercase tracking-[0.5em]">Protocol v4-Delta</p>
            </div>
          </div>
        )}
    </div>
  );
};
