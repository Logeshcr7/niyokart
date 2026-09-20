import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { CartItem } from '../types/index.ts';
import { formatINR } from '../data/phones.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (phoneId: string, quantity: number) => void;
  onRemoveItem: (phoneId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [coupon, setCoupon] = useState('FESTIVE10');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.phone.price * item.quantity, 0);
  const discount = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const delivery = subtotal > 0 ? 0 : 0; // Free express delivery
  const finalTotal = subtotal - discount + delivery;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === 'FESTIVE10' || coupon.trim().toUpperCase() === 'NIYO10') {
      setDiscountApplied(true);
    }
  };

  const handleCheckout = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      onClearCart();
      setOrderPlaced(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Your Shopping Cart</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {orderPlaced ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900">Order Placed Successfully!</h4>
            <p className="mt-2 text-xs text-slate-600">
              Thank you for ordering with Niyo Kart. Your brand-sealed phone will be delivered via Express Delivery within 24-48 hours.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Your cart is empty</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Explore our Top Deals or compare mobile specifications to select your ideal smartphone.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.phone.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1 flex items-center justify-center">
                    <img
                      src={item.phone.image}
                      alt={item.phone.name}
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">
                            {item.phone.brand}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {item.phone.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.phone.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-mono text-xs font-black text-slate-900 mt-1">
                        {formatINR(item.phone.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.phone.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.phone.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Sub: {formatINR(item.phone.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Coupon */}
            <div className="border-t border-slate-200 bg-slate-50 p-6">
              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon (e.g. FESTIVE10)"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono uppercase focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Apply
                </button>
              </form>

              {discountApplied && (
                <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 flex justify-between">
                  <span>Festive 10% Discount Applied!</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900">{formatINR(subtotal)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Delivery</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="font-mono text-blue-600">{formatINR(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-2 text-center text-[10px] text-slate-400">
                Safe & Secure Payments • 7-Day Replacement Guarantee
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
