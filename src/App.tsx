import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NiyoHeader } from './components/NiyoHeader.tsx';
import { FestiveHeroBanner } from './components/FestiveHeroBanner.tsx';
import { TopDealsSection } from './components/TopDealsSection.tsx';
import { CompareBeforeYouBuySection } from './components/CompareBeforeYouBuySection.tsx';
import { GrandLaunchBanner } from './components/GrandLaunchBanner.tsx';
import { BudgetBuysSection } from './components/BudgetBuysSection.tsx';
import { BrandStoresSection } from './components/BrandStoresSection.tsx';
import { PhoneCatalogSection } from './components/PhoneCatalogSection.tsx';
import { WhyShopSection } from './components/WhyShopSection.tsx';
import { NiyoFooter } from './components/NiyoFooter.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { AddPhoneModal } from './components/AddPhoneModal.tsx';
import { AlgorithmModal } from './components/AlgorithmModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { PhoneDetailModal } from './components/PhoneDetailModal.tsx';
import { SavedComparisonsView } from './components/SavedComparisonsView.tsx';
import { AdminPortalModal } from './components/AdminPortalModal.tsx';
import { DeveloperAuthModal } from './components/DeveloperAuthModal.tsx';
import { useDeveloperMode } from './hooks/useDeveloperMode.ts';
import {
  PHONES_DATA,
  DEFAULT_WEIGHTS,
  AlgorithmWeights,
  PhoneSpecs,
} from './data/phones.ts';
import { CartItem } from './types/index.ts';

function MainAppContent() {
  const { token, dbUser, refreshUserData } = useAuth();
  const {
    isDeveloper,
    isAuthModalOpen,
    setIsAuthModalOpen,
    verifyAndEnable,
    disableDeveloperMode,
  } = useDeveloperMode(dbUser?.email);

  // Dynamic phones catalog synced with server
  const [phonesCatalog, setPhonesCatalog] = useState<PhoneSpecs[]>(PHONES_DATA);

  // Selected comparison phones (defaults to the 3 phones in the Figma screenshot)
  const [comparedPhoneIds, setComparedPhoneIds] = useState<string[]>([
    'iphone-15-pro',
    'samsung-galaxy-s24-plus',
    'oneplus-12',
  ]);

  // Algorithm Weights
  const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);

  // Cart Items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      phone: PHONES_DATA.find((p) => p.id === 'galaxy-s24-ultra') || PHONES_DATA[0],
      quantity: 1,
    },
  ]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddPhoneOpen, setIsAddPhoneOpen] = useState(false);
  const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<string | undefined>();
  const [isSavedComparisonsOpen, setIsSavedComparisonsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [detailPhone, setDetailPhone] = useState<PhoneSpecs | null>(null);

  // Fetch updated catalog on mount
  const refreshCatalog = async () => {
    try {
      const res = await fetch('/api/phones');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPhonesCatalog(data);
        }
      }
    } catch (err) {
      console.error('Failed to load live phones catalog:', err);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  const handleAdminPhoneAdded = (newPhone: PhoneSpecs, wasPublished: boolean) => {
    if (wasPublished) {
      setPhonesCatalog((prev) => [newPhone, ...prev.filter((p) => p.id !== newPhone.id)]);
      showToast(`🚀 "${newPhone.name}" is now live in store for all users!`);
      // Put new phone into compare arena so user can see it right away!
      setComparedPhoneIds((prev) => [newPhone.id, ...prev.filter((id) => id !== newPhone.id).slice(0, 3)]);
    } else {
      showToast(`💾 "${newPhone.name}" saved as draft in developer backend.`);
    }
    refreshCatalog();
  };

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavingComparison, setIsSavingComparison] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compare handlers
  const handleToggleCompare = (phone: PhoneSpecs) => {
    setComparedPhoneIds((prev) => {
      if (prev.includes(phone.id)) {
        showToast(`Removed ${phone.name} from comparison.`);
        return prev.filter((id) => id !== phone.id);
      }
      if (prev.length >= 4) {
        showToast(`Comparison limit reached (max 4). Replaced oldest.`);
        return [...prev.slice(1), phone.id];
      }
      showToast(`Added ${phone.name} to comparison.`);
      return [...prev, phone.id];
    });
  };

  const handleRemoveCompare = (phoneId: string) => {
    setComparedPhoneIds((prev) => prev.filter((id) => id !== phoneId));
  };

  const handleAddCompare = (phone: PhoneSpecs) => {
    if (!comparedPhoneIds.includes(phone.id)) {
      if (comparedPhoneIds.length >= 4) {
        setComparedPhoneIds((prev) => [...prev.slice(1), phone.id]);
      } else {
        setComparedPhoneIds((prev) => [...prev, phone.id]);
      }
      showToast(`Added ${phone.name} to comparison.`);
    }
  };

  // Cart handlers
  const handleAddToCart = (phone: PhoneSpecs) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.phone.id === phone.id);
      if (existing) {
        return prev.map((item) =>
          item.phone.id === phone.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { phone, quantity: 1 }];
    });
    showToast(`Added ${phone.name} to cart.`);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (phoneId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.phone.id !== phoneId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.phone.id === phoneId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveFromCart = (phoneId: string) => {
    setCartItems((prev) => prev.filter((item) => item.phone.id !== phoneId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Save comparison session to PostgreSQL
  const handleSaveToPostgres = async () => {
    if (!token || !dbUser) {
      setLoginPromptReason('Sign in to persist this comparison matrix into your PostgreSQL database.');
      setIsLoginOpen(true);
      return;
    }

    if (comparedPhoneIds.length < 2) {
      showToast('Select at least 2 smartphones to save a comparison.');
      return;
    }

    const comparedNames = comparedPhoneIds
      .map((id) => PHONES_DATA.find((p) => p.id === id)?.name || id)
      .join(' vs ');

    const title = `${comparedNames}`;

    setIsSavingComparison(true);
    try {
      const res = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          phoneIds: comparedPhoneIds,
          weights,
          notes: 'Saved from Niyo Kart Compare Arena',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save comparison');
      }

      showToast('Comparison successfully saved to PostgreSQL database!');
      refreshUserData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving to database');
    } finally {
      setIsSavingComparison(false);
    }
  };

  // Save custom algorithm preset to PostgreSQL
  const handleSavePresetToPostgres = async (name: string, customWeights: AlgorithmWeights) => {
    if (!token || !dbUser) {
      setLoginPromptReason('Sign in to save custom algorithm presets to PostgreSQL.');
      setIsLoginOpen(true);
      return;
    }

    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        weights: customWeights,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save preset');
    }

    showToast(`Preset "${name}" saved to PostgreSQL!`);
    refreshUserData();
  };

  const comparedPhones = comparedPhoneIds
    .map((id) => phonesCatalog.find((p) => p.id === id))
    .filter(Boolean) as PhoneSpecs[];

  const grandLaunchPhone = phonesCatalog.find((p) => p.id === 'nord-ce-4-lite') || phonesCatalog[0];

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.phone.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* 1. Header (Top Bar + Main Bar) */}
      <NiyoHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        compareCount={comparedPhoneIds.length}
        onOpenCompare={() => {
          const compareEl = document.getElementById('compare-section');
          compareEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAlgorithm={() => setIsAlgorithmOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLogin={() => {
          setLoginPromptReason(undefined);
          setIsLoginOpen(true);
        }}
        onOpenSaved={() => setIsSavedComparisonsOpen(true)}
        onOpenAdmin={() => {
          if (isDeveloper) {
            setIsAdminOpen(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }}
        isDeveloper={isDeveloper}
        onExitDeveloperMode={disableDeveloperMode}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        cartTotal={cartTotal}
      />

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 2. Festive Offer Hero Banner */}
        <FestiveHeroBanner
          onExploreDeals={() => {
            const dealsEl = document.getElementById('all-phones-catalog');
            dealsEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          onCompareFlagships={() => {
            setComparedPhoneIds(['galaxy-s24-ultra', 'iphone-15-pro', 'oneplus-12']);
            const compareEl = document.getElementById('compare-section');
            compareEl?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. Top Deals on Mobiles */}
        <TopDealsSection
          phones={phonesCatalog}
          comparedPhoneIds={comparedPhoneIds}
          onToggleCompare={handleToggleCompare}
          onAddToCart={handleAddToCart}
          onSelectPhone={(phone) => setDetailPhone(phone)}
        />

        {/* 4. Compare Before You Buy (Algorithmic Comparison Matrix) */}
        <CompareBeforeYouBuySection
          comparedPhones={comparedPhones}
          weights={weights}
          onRemovePhone={handleRemoveCompare}
          onOpenAddPhoneModal={() => setIsAddPhoneOpen(true)}
          onOpenAlgorithmModal={() => setIsAlgorithmOpen(true)}
          onAddToCart={handleAddToCart}
          onSaveToPostgres={handleSaveToPostgres}
          isSaving={isSavingComparison}
        />

        {/* 5. Grand Launch Banner */}
        <GrandLaunchBanner
          phone={grandLaunchPhone}
          onAddToCart={handleAddToCart}
          onCompare={handleToggleCompare}
        />

        {/* 6. Budget Buys Under ₹10,000 */}
        <BudgetBuysSection
          phones={phonesCatalog}
          comparedPhoneIds={comparedPhoneIds}
          onToggleCompare={handleToggleCompare}
          onAddToCart={handleAddToCart}
          onSelectPhone={(phone) => setDetailPhone(phone)}
        />

        {/* 7. Official Brand Stores */}
        <BrandStoresSection
          selectedBrand={selectedBrand}
          onSelectBrand={(b) => {
            setSelectedBrand(b);
            const cat = document.getElementById('all-phones-catalog');
            cat?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 8. Full Catalog Section */}
        <PhoneCatalogSection
          phones={phonesCatalog}
          weights={weights}
          comparedPhoneIds={comparedPhoneIds}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleCompare={handleToggleCompare}
          onAddToCart={handleAddToCart}
          onSelectPhone={(phone) => setDetailPhone(phone)}
        />

        {/* 9. Why Shop On Niyo Kart */}
        <WhyShopSection />
      </main>

      {/* 10. Footer */}
      <NiyoFooter
        isDeveloper={isDeveloper}
        onOpenDeveloperPortal={() => {
          if (isDeveloper) {
            setIsAdminOpen(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }}
      />

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <AddPhoneModal
        isOpen={isAddPhoneOpen}
        onClose={() => setIsAddPhoneOpen(false)}
        allPhones={phonesCatalog}
        comparedPhoneIds={comparedPhoneIds}
        onAddPhone={handleAddCompare}
      />

      <AlgorithmModal
        isOpen={isAlgorithmOpen}
        onClose={() => setIsAlgorithmOpen(false)}
        weights={weights}
        onUpdateWeights={setWeights}
        onSavePresetToPostgres={handleSavePresetToPostgres}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        requiredForAction={loginPromptReason}
      />

      <PhoneDetailModal
        phone={detailPhone}
        weights={weights}
        onClose={() => setDetailPhone(null)}
        isSelected={detailPhone ? comparedPhoneIds.includes(detailPhone.id) : false}
        onToggleSelect={(id) => {
          const p = phonesCatalog.find((x) => x.id === id);
          if (p) handleToggleCompare(p);
        }}
        onAddToCart={handleAddToCart}
        openLoginModal={() => {
          setLoginPromptReason('Sign in with PostgreSQL to save favorites.');
          setIsLoginOpen(true);
        }}
      />

      <SavedComparisonsView
        isOpen={isSavedComparisonsOpen}
        onClose={() => setIsSavedComparisonsOpen(false)}
        phones={phonesCatalog}
        onLoadComparison={(ids, savedWeights) => {
          setComparedPhoneIds(ids);
          if (savedWeights) setWeights(savedWeights);
          showToast('Loaded comparison into Arena.');
          const compareEl = document.getElementById('compare-section');
          compareEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        openLoginModal={() => {
          setLoginPromptReason('Sign in to view saved PostgreSQL comparisons.');
          setIsLoginOpen(true);
        }}
      />

      <AdminPortalModal
        isOpen={isAdminOpen && isDeveloper}
        onClose={() => setIsAdminOpen(false)}
        onPhoneAdded={handleAdminPhoneAdded}
        onOpenPhoneDetail={(phone) => setDetailPhone(phone)}
      />

      <DeveloperAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdminOpen(true);
          showToast('Developer Mode Unlocked.');
        }}
        verifyCode={verifyAndEnable}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
