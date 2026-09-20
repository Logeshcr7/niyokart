import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Trash2,
  RefreshCw,
  X,
  Eye,
  Battery,
  Cpu,
  Camera,
  Layers,
  Shield,
  ArrowRight,
  Plus,
  Radio,
  FileCheck,
  Globe,
  Lock,
  EyeOff,
  Search,
  Zap,
  TrendingDown,
  Tag,
  Activity,
  Check,
} from 'lucide-react';
import { PhoneSpecs, formatINR } from '../data/phones.ts';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneAdded: (newPhone: PhoneSpecs, wasPublished: boolean) => void;
  onOpenPhoneDetail: (phone: PhoneSpecs) => void;
}

const COMMON_RAM_OPTIONS = ['6 GB', '8 GB', '12 GB', '16 GB', '24 GB'];
const RAM_TYPES = ['LPDDR5X', 'LPDDR5', 'LPDDR4X'];
const PROCESSOR_NODES = ['3nm', '4nm', '6nm'];

const QUICK_REALTIME_SEARCHES = [
  'OnePlus Nord 4 5G',
  'Realme GT 6T 5G',
  'Motorola Edge 50 Pro',
  'iQOO Z9s Pro 5G',
  'Samsung Galaxy S24 FE',
  'Poco X6 Pro 5G',
];

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onPhoneAdded,
  onOpenPhoneDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'ai-ingest' | 'manage-catalog'>('ai-ingest');
  const [ingestMode, setIngestMode] = useState<'realtime-search' | 'image-vision'>('realtime-search');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'published' | 'drafts'>('all');

  // Real-Time Search Ingestion State
  const [realTimeQuery, setRealTimeQuery] = useState<string>('');
  const [isSearchingRealTime, setIsSearchingRealTime] = useState<boolean>(false);

  // Vision Image Ingestion State
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [optionalHint, setOptionalHint] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractStep, setExtractStep] = useState<string>('');
  const [extractError, setExtractError] = useState<string | null>(null);

  // Extracted draft phone data & live refresh state
  const [extractedPhone, setExtractedPhone] = useState<PhoneSpecs | null>(null);
  const [isRefreshingLiveSpecs, setIsRefreshingLiveSpecs] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Catalog management state
  const [adminPhones, setAdminPhones] = useState<PhoneSpecs[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshingCatalogId, setRefreshingCatalogId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin phones on open or tab switch
  const fetchAdminPhones = async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await fetch('/api/admin/phones');
      if (res.ok) {
        const data = await res.json();
        setAdminPhones(data.adminPhones || []);
        setTotalCatalogCount(data.totalCount || 0);
        setDraftsCount(data.draftsCount || 0);
        setPublishedCount(data.publishedCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin phones:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminPhones();
    }
  }, [isOpen]);

  // Support pasting image anywhere inside the modal when in image-vision mode
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setIngestMode('image-vision');
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setExtractError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setExtractError(null);
    setPublishSuccess(null);
    setSelectedImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageBase64(result);
      setImagePreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Real-Time Web Search Ingestion (Google Search grounded)
  const handleRealTimeSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch || realTimeQuery).trim();
    if (!query) {
      setExtractError('Please enter a smartphone name or retail query.');
      return;
    }

    setIsSearchingRealTime(true);
    setExtractError(null);
    setPublishSuccess(null);
    setExtractedPhone(null);
    setExtractStep('Searching live Indian retail market (Amazon/Flipkart) with Gemini Google Search grounding...');

    try {
      const res = await fetch('/api/admin/ai-lookup-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve real-time specifications.');
      }

      setExtractedPhone(data.phone);
      setPublishSuccess(
        `⚡ Real-Time market grounded for "${data.phone.name}": Price ${formatINR(data.phone.price)} • ${data.phone.details.ram} • ${data.phone.details.processor}`
      );
    } catch (err: any) {
      console.error('Real-time search error:', err);
      setExtractError(err.message || 'Error occurred during real-time lookup.');
    } finally {
      setIsSearchingRealTime(false);
      setExtractStep('');
    }
  };

  // Multimodal Vision Extraction with automated real-time price, RAM & processor grounding
  const handleExtractWithAI = async () => {
    if (!selectedImageBase64) {
      setExtractError('Please select or upload a phone image first.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setPublishSuccess(null);
    setExtractedPhone(null);

    try {
      setExtractStep('Step 1/3: Reading image with Gemini 3.8 Flash multimodal vision...');
      const timer1 = setTimeout(() => {
        setExtractStep('Step 2/3: Identifying smartphone model & reading specs/badges...');
      }, 2000);

      const timer2 = setTimeout(() => {
        setExtractStep('Step 3/3: Grounding real-time market price, RAM variants & processor...');
      }, 4500);

      const response = await fetch('/api/admin/ai-extract-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImageBase64,
          imageMimeType: selectedImageMimeType,
          optionalHint: optionalHint.trim() || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract specifications with AI.');
      }

      setExtractedPhone(data.phone);
      setPublishSuccess(
        data.realTimeGrounded
          ? `🟢 Extracted from poster and verified with live market price (${formatINR(data.phone.price)}) & hardware architecture!`
          : `Extracted specifications from image. You can click "⚡ Check Live Price & Processor" to sync live market pricing.`
      );
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractError(err.message || 'Error occurred during AI extraction.');
    } finally {
      setIsExtracting(false);
      setExtractStep('');
    }
  };

  // Sync / Refresh Real-Time Environment Price & Processor for the currently drafted phone
  const handleRefreshLiveSpecs = async () => {
    if (!extractedPhone) return;

    setIsRefreshingLiveSpecs(true);
    setExtractError(null);

    try {
      const res = await fetch('/api/admin/ai-refresh-price-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneName: extractedPhone.name,
          brand: extractedPhone.brand,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh live market specs.');
      }

      const live = data.liveSpecs;
      setExtractedPhone((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          price: live.price ?? prev.price,
          originalPrice: live.originalPrice ?? prev.originalPrice,
          discountPercent: live.discountPercent ?? prev.discountPercent,
          storeSource: live.storeSource ?? prev.storeSource,
          realTimePriceVerified: true,
          realTimePriceUpdated: new Date().toISOString(),
          ramVariants: live.ramVariants ?? prev.ramVariants,
          details: {
            ...prev.details,
            ram: live.ram ?? prev.details.ram,
            processor: live.processor ?? prev.details.processor,
            antutuScore: live.antutuScore ?? prev.details.antutuScore,
            gpuScore: live.gpuScore ?? prev.details.gpuScore,
            geekbenchSingle: live.geekbenchSingle ?? prev.details.geekbenchSingle,
            geekbenchMulti: live.geekbenchMulti ?? prev.details.geekbenchMulti,
          },
        };
      });

      setPublishSuccess(
        `⚡ Real-time price & hardware refreshed: ${formatINR(live.price || extractedPhone.price)} • ${live.ram || extractedPhone.details.ram} • ${live.processor || extractedPhone.details.processor}`
      );
    } catch (err: any) {
      console.error('Refresh error:', err);
      setExtractError(err.message || 'Could not refresh real-time market data.');
    } finally {
      setIsRefreshingLiveSpecs(false);
    }
  };

  // Quick refresh live market specs for any phone directly inside Catalog CMS
  const handleRefreshCatalogPhone = async (phone: PhoneSpecs) => {
    setRefreshingCatalogId(phone.id);
    try {
      const res = await fetch('/api/admin/ai-refresh-price-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneName: phone.name,
          brand: phone.brand,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const live = data.liveSpecs;
        const updatedPhone: PhoneSpecs = {
          ...phone,
          price: live.price ?? phone.price,
          originalPrice: live.originalPrice ?? phone.originalPrice,
          discountPercent: live.discountPercent ?? phone.discountPercent,
          storeSource: live.storeSource ?? phone.storeSource,
          realTimePriceVerified: true,
          realTimePriceUpdated: new Date().toISOString(),
          ramVariants: live.ramVariants ?? phone.ramVariants,
          details: {
            ...phone.details,
            ram: live.ram ?? phone.details.ram,
            processor: live.processor ?? phone.details.processor,
            antutuScore: live.antutuScore ?? phone.details.antutuScore,
            gpuScore: live.gpuScore ?? phone.details.gpuScore,
          },
        };

        // Save updated phone to backend
        await fetch('/api/admin/phones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPhone),
        });

        setAdminPhones((prev) => prev.map((p) => (p.id === phone.id ? updatedPhone : p)));
        onPhoneAdded(updatedPhone, phone.isPublished !== false);
      }
    } catch (err) {
      console.error('Failed to refresh catalog phone:', err);
    } finally {
      setRefreshingCatalogId(null);
    }
  };

  // Publish to live user storefront
  const handlePublishToCatalog = async () => {
    if (!extractedPhone) return;

    setIsPublishing(true);
    setExtractError(null);

    try {
      const payload: PhoneSpecs = {
        ...extractedPhone,
        isPublished: true,
        publishedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish phone to store');
      }

      setPublishSuccess(`🚀 "${extractedPhone.name}" is now PUBLISHED and available to all shoppers in the live store!`);
      onPhoneAdded(data.phone, true);
      fetchAdminPhones();
    } catch (err: any) {
      setExtractError(err.message || 'Failed to publish phone');
    } finally {
      setIsPublishing(false);
    }
  };

  // Save as Draft (Backend only, not visible to public users)
  const handleSaveAsDraft = async () => {
    if (!extractedPhone) return;

    setIsSavingDraft(true);
    setExtractError(null);

    try {
      const payload: PhoneSpecs = {
        ...extractedPhone,
        isPublished: false,
      };

      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save draft');
      }

      setPublishSuccess(`💾 "${extractedPhone.name}" saved as Draft in developer backend (NOT visible to users).`);
      onPhoneAdded(data.phone, false);
      fetchAdminPhones();
    } catch (err: any) {
      setExtractError(err.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Toggle publish / unpublish status
  const handleTogglePublish = async (phone: PhoneSpecs) => {
    setTogglingId(phone.id);
    const nextStatus = phone.isPublished === false;

    try {
      const res = await fetch(`/api/admin/phones/${phone.id}/toggle-publish`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setAdminPhones((prev) =>
          prev.map((p) => (p.id === phone.id ? { ...p, isPublished: nextStatus } : p))
        );
        fetchAdminPhones();
        if (nextStatus) {
          onPhoneAdded({ ...phone, isPublished: true }, true);
        }
      }
    } catch (err) {
      console.error('Toggle publish error:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePhone = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the catalog?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/phones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdminPhones((prev) => prev.filter((p) => p.id !== id));
        fetchAdminPhones();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPhones = adminPhones.filter((p) => {
    if (catalogFilter === 'published') return p.isPublished !== false;
    if (catalogFilter === 'drafts') return p.isPublished === false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white sm:text-lg">
                  AI Admin Agent • Developer CMS
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold text-indigo-400 border border-indigo-500/30">
                  DEVELOPER ONLY
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <Zap className="h-3 w-3" />
                  <span>Real-Time Price &amp; RAM/CPU Grounding</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ground real-time environment prices, RAM variants &amp; processor silicon specs via live Google Search. Save drafts or publish directly to shoppers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('ai-ingest')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  activeTab === 'ai-ingest'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Ingest</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('manage-catalog');
                  fetchAdminPhones();
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  activeTab === 'manage-catalog'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Catalog CMS ({adminPhones.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'ai-ingest' ? (
            <div className="space-y-6">
              {/* Top Banner Alert */}
              {publishSuccess && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{publishSuccess}</span>
                  </div>
                  {extractedPhone && extractedPhone.isPublished !== false && (
                    <button
                      onClick={() => {
                        onOpenPhoneDetail(extractedPhone);
                        onClose();
                      }}
                      className="flex items-center gap-1 font-bold text-emerald-300 hover:underline cursor-pointer"
                    >
                      <span>Preview in Store</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {extractError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              {/* Ingestion Mode Selector Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ingestion Method:
                  </span>
                  <div className="flex rounded-lg bg-slate-800/80 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setIngestMode('realtime-search')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                        ingestMode === 'realtime-search'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-300" />
                      <span>⚡ Real-Time Live Web Search</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIngestMode('image-vision')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                        ingestMode === 'image-vision'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="h-3.5 w-3.5 text-indigo-300" />
                      <span>📷 Image / Spec Poster Ingest</span>
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Powered by Google Search Grounding &amp; Gemini Vision
                </span>
              </div>

              {/* Ingest Source Area + Live Review Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Side: Input Panel (Search OR Image) */}
                <div className="lg:col-span-6 space-y-4">
                  {ingestMode === 'realtime-search' ? (
                    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-emerald-400" />
                          <span>Real-Time Market Grounding Agent</span>
                        </h3>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          LIVE WEB
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enter any smartphone model name or e-commerce URL. The AI Agent executes Google Search grounding across Indian e-commerce (Amazon.in, Flipkart, official stores) to extract the <strong>real-time environment price (₹ INR)</strong>, <strong>exact RAM variants</strong>, and <strong>processor architecture</strong>.
                      </p>

                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            value={realTimeQuery}
                            onChange={(e) => setRealTimeQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRealTimeSearch();
                            }}
                            placeholder="e.g. OnePlus Nord 4 5G, Realme GT 6T, or Motorola Edge 50 Pro..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Quick Suggestions Chips */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-medium text-slate-400">Quick suggestions to ingest:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_REALTIME_SEARCHES.map((query) => (
                              <button
                                key={query}
                                type="button"
                                onClick={() => {
                                  setRealTimeQuery(query);
                                  handleRealTimeSearch(query);
                                }}
                                disabled={isSearchingRealTime}
                                className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition cursor-pointer"
                              >
                                + {query}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRealTimeSearch()}
                          disabled={isSearchingRealTime || !realTimeQuery.trim()}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                        >
                          {isSearchingRealTime ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin text-white" />
                              <span>Searching Live Web &amp; Grounding Price/RAM/CPU...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 text-emerald-200" />
                              <span>⚡ Ingest Real-Time Market Specs with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <UploadCloud className="h-4 w-4 text-indigo-400" />
                          <span>Upload Smartphone Image / Poster</span>
                        </h3>
                        <span className="text-[11px] text-slate-400">Ctrl+V to paste screenshot</span>
                      </div>

                      {/* Dropzone */}
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                          imagePreviewUrl
                            ? 'border-indigo-500/60 bg-indigo-950/20'
                            : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileSelect(e.target.files[0]);
                            }
                          }}
                        />

                        {imagePreviewUrl ? (
                          <div className="relative flex flex-col items-center gap-2">
                            <img
                              src={imagePreviewUrl}
                              alt="Upload preview"
                              className="max-h-36 rounded-lg object-contain shadow-md"
                            />
                            <p className="text-[11px] text-indigo-300">
                              Click or drop another image to replace
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-indigo-400">
                              <UploadCloud className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200">
                                Click to browse or drag &amp; drop poster image
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Supports PNG, JPG, WebP from retail brochures or specs
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Context Hint */}
                      <div>
                        <label className="text-xs font-medium text-slate-400">
                          Optional Hint (Model name, brand, or retail link):
                        </label>
                        <input
                          type="text"
                          value={optionalHint}
                          onChange={(e) => setOptionalHint(e.target.value)}
                          placeholder="e.g. Motorola Moto G37 Power or Realme 14 Pro"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Extraction Button */}
                      <button
                        onClick={handleExtractWithAI}
                        disabled={isExtracting || !selectedImageBase64}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                      >
                        {isExtracting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>{extractStep || 'Extracting & Grounding Specs with AI...'}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-indigo-200" />
                            <span>Analyze Poster &amp; Ground Real-Time Specs</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Real-Time Market Info Pill */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-2">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-[11px]">
                      <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span>AI Admin Agent Capabilities</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                      <li><strong>Real-time environment price:</strong> Live market pricing in INR across Amazon India, Flipkart, and brand stores.</li>
                      <li><strong>RAM Architecture:</strong> Extracted capacity (6GB/8GB/12GB/16GB), RAM type (LPDDR5X/LPDDR4X), and Virtual RAM boost.</li>
                      <li><strong>Processor &amp; GPU:</strong> Chipset node (4nm/3nm), AnTuTu v10 benchmark scores, GPU model, and CPU cores.</li>
                      <li><strong>Draft vs. Live:</strong> Save as draft in developer backend, or publish instantly to all shoppers.</li>
                    </ul>
                  </div>
                </div>

                {/* Right Side: Extracted Phone Review & Verification Editor */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      <span>2. Real-Time Specs Verification &amp; Review</span>
                    </h3>
                    {extractedPhone && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        <Check className="h-3 w-3" />
                        <span>Ready to Draft or Publish</span>
                      </span>
                    )}
                  </div>

                  {extractedPhone ? (
                    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      {/* Phone Basic Card Header */}
                      <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-white p-1 overflow-hidden flex items-center justify-center">
                          <img
                            src={extractedPhone.image}
                            alt={extractedPhone.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-indigo-400">
                              {extractedPhone.brand}
                            </span>
                            {extractedPhone.badge && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                {extractedPhone.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white truncate mt-0.5">
                            {extractedPhone.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {extractedPhone.tagline}
                          </p>
                        </div>
                      </div>

                      {/* --- SECTION A: REAL-TIME ENVIRONMENT PRICE (₹ INR) --- */}
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                              Real-Time Environment Price (₹)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {extractedPhone.realTimePriceVerified ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>Live Market Grounded</span>
                              </span>
                            ) : (
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                Vision Inferred
                              </span>
                            )}

                            {/* Live Re-sync Button */}
                            <button
                              type="button"
                              onClick={handleRefreshLiveSpecs}
                              disabled={isRefreshingLiveSpecs}
                              title="Re-query Google Search for real-time market price & specs"
                              className="flex items-center gap-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-2 py-1 text-[10px] font-bold border border-emerald-500/40 transition cursor-pointer"
                            >
                              <RefreshCw className={`h-3 w-3 ${isRefreshingLiveSpecs ? 'animate-spin' : ''}`} />
                              <span>{isRefreshingLiveSpecs ? 'Syncing...' : 'Sync Live'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-emerald-200">
                              Current Store Price (₹)
                            </label>
                            <input
                              type="number"
                              value={extractedPhone.price}
                              onChange={(e) => {
                                const newPrice = parseInt(e.target.value) || 0;
                                const original = extractedPhone.originalPrice || newPrice;
                                const discount = original > newPrice ? Math.round(((original - newPrice) / original) * 100) : 0;
                                setExtractedPhone({
                                  ...extractedPhone,
                                  price: newPrice,
                                  discountPercent: discount,
                                });
                              }}
                              className="w-full rounded-lg border border-emerald-500/40 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">
                              Original MRP (₹)
                            </label>
                            <input
                              type="number"
                              value={extractedPhone.originalPrice || extractedPhone.price}
                              onChange={(e) => {
                                const newOriginal = parseInt(e.target.value) || 0;
                                const discount = newOriginal > extractedPhone.price ? Math.round(((newOriginal - extractedPhone.price) / newOriginal) * 100) : 0;
                                setExtractedPhone({
                                  ...extractedPhone,
                                  originalPrice: newOriginal,
                                  discountPercent: discount,
                                });
                              }}
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">
                              Discount %
                            </label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 w-full text-center">
                                {extractedPhone.discountPercent || 0}% OFF
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">
                            Store Source / Live Retailer:
                          </label>
                          <input
                            type="text"
                            value={extractedPhone.storeSource || 'Amazon India / Flipkart Live'}
                            onChange={(e) =>
                              setExtractedPhone({ ...extractedPhone, storeSource: e.target.value })
                            }
                            className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* --- SECTION B: RAM & MEMORY ARCHITECTURE --- */}
                      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                              RAM &amp; Memory Architecture
                            </span>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-semibold">
                            Dual-Channel Memory
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">
                            RAM Capacity &amp; Technology:
                          </label>
                          <input
                            type="text"
                            value={extractedPhone.details.ram}
                            onChange={(e) =>
                              setExtractedPhone({
                                ...extractedPhone,
                                details: { ...extractedPhone.details, ram: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-cyan-200 focus:outline-none"
                            placeholder="e.g. 8GB / 12GB LPDDR5X (Up to 16GB Virtual RAM)"
                          />
                        </div>

                        {/* Quick RAM Preset Chips */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Quick RAM presets:</span>
                            <span>RAM Type:</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {COMMON_RAM_OPTIONS.map((ramOpt) => (
                                <button
                                  key={ramOpt}
                                  type="button"
                                  onClick={() => {
                                    setExtractedPhone({
                                      ...extractedPhone,
                                      details: {
                                        ...extractedPhone.details,
                                        ram: `${ramOpt} LPDDR5X (Up to 16GB Virtual RAM)`,
                                      },
                                    });
                                  }}
                                  className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20 border border-slate-700 cursor-pointer"
                                >
                                  {ramOpt}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-1">
                              {RAM_TYPES.map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    const current = extractedPhone.details.ram || '8GB';
                                    const cleaned = current.replace(/LPDDR[45]X?/g, '').trim();
                                    setExtractedPhone({
                                      ...extractedPhone,
                                      details: {
                                        ...extractedPhone.details,
                                        ram: `${cleaned} ${type}`,
                                      },
                                    });
                                  }}
                                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 cursor-pointer"
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Storage Spec Field */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">
                            Internal Storage Spec:
                          </label>
                          <input
                            type="text"
                            value={extractedPhone.details.storage}
                            onChange={(e) =>
                              setExtractedPhone({
                                ...extractedPhone,
                                details: { ...extractedPhone.details, storage: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                            placeholder="e.g. 128GB / 256GB UFS 4.0"
                          />
                        </div>
                      </div>

                      {/* --- SECTION C: PROCESSOR & SILICON ARCHITECTURE --- */}
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/15 p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Cpu className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                              Processor &amp; Silicon Architecture
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400">
                            {extractedPhone.details.antutuScore
                              ? `${(extractedPhone.details.antutuScore / 100000).toFixed(1)}L+ AnTuTu`
                              : 'Benchmark Ready'}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">
                            Processor Chipset Name &amp; Node:
                          </label>
                          <input
                            type="text"
                            value={extractedPhone.details.processor}
                            onChange={(e) =>
                              setExtractedPhone({
                                ...extractedPhone,
                                details: { ...extractedPhone.details, processor: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-indigo-200 focus:outline-none"
                            placeholder="e.g. Qualcomm Snapdragon 7+ Gen 3 (4nm TSMC)"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">
                              AnTuTu v10 Benchmark Score:
                            </label>
                            <input
                              type="number"
                              value={extractedPhone.details.antutuScore || 0}
                              onChange={(e) =>
                                setExtractedPhone({
                                  ...extractedPhone,
                                  details: {
                                    ...extractedPhone.details,
                                    antutuScore: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">
                              GPU Model:
                            </label>
                            <input
                              type="text"
                              value={extractedPhone.details.gpuScore}
                              onChange={(e) =>
                                setExtractedPhone({
                                  ...extractedPhone,
                                  details: { ...extractedPhone.details, gpuScore: e.target.value },
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="e.g. Adreno 732 or Mali-G615"
                            />
                          </div>
                        </div>

                        {/* Quick Node presets */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-500">Fabrication:</span>
                          {PROCESSOR_NODES.map((node) => (
                            <button
                              key={node}
                              type="button"
                              onClick={() => {
                                if (!extractedPhone.details.processor.includes(node)) {
                                  setExtractedPhone({
                                    ...extractedPhone,
                                    details: {
                                      ...extractedPhone.details,
                                      processor: `${extractedPhone.details.processor} (${node})`,
                                    },
                                  });
                                }
                              }}
                              className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            >
                              {node}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Display & Battery Quick Specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                            <Battery className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-semibold text-[11px]">Battery &amp; Charging</span>
                          </div>
                          <p className="font-bold text-slate-200">
                            {extractedPhone.details.batteryCapacity}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {extractedPhone.details.wiredCharging || 'Fast Charging'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                            <Camera className="h-3.5 w-3.5 text-amber-400" />
                            <span className="font-semibold text-[11px]">Cameras</span>
                          </div>
                          <p className="font-bold text-slate-200 truncate">
                            {extractedPhone.details.mainCamera}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Selfie: {extractedPhone.details.selfieCamera}
                          </p>
                        </div>
                      </div>

                      {/* Developer Action Buttons: Draft vs Publish */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={handleSaveAsDraft}
                          disabled={isSavingDraft || isPublishing}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingDraft ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-slate-300" />
                          ) : (
                            <FileCheck className="h-4 w-4 text-amber-400" />
                          )}
                          <span>Save as Draft (Backend Only)</span>
                        </button>

                        <button
                          onClick={handlePublishToCatalog}
                          disabled={isPublishing || isSavingDraft}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                        >
                          {isPublishing ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin text-white" />
                              <span>Publishing to Store...</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 text-white" />
                              <span>🚀 Publish (Make Live for Users)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center text-slate-500">
                      <Sparkles className="h-10 w-10 text-slate-700 mb-2" />
                      <p className="text-sm font-medium text-slate-400">
                        No phone analyzed yet
                      </p>
                      <p className="text-xs text-slate-600 max-w-xs mt-1">
                        Select a quick suggestion on the left or enter a model name to ground the <strong>real-time environment price</strong>, <strong>RAM</strong>, and <strong>processor</strong> directly from the live market.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Catalog Management */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Developer Catalog CMS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live for Users: <strong className="text-emerald-400">{publishedCount}</strong> • Backend Drafts: <strong className="text-amber-400">{draftsCount}</strong> • Total Store: <strong className="text-blue-400">{totalCatalogCount}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs font-medium">
                    <button
                      onClick={() => setCatalogFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition ${catalogFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      All ({adminPhones.length})
                    </button>
                    <button
                      onClick={() => setCatalogFilter('published')}
                      className={`px-2.5 py-1 rounded-md transition ${catalogFilter === 'published' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Published ({publishedCount})
                    </button>
                    <button
                      onClick={() => setCatalogFilter('drafts')}
                      className={`px-2.5 py-1 rounded-md transition ${catalogFilter === 'drafts' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Drafts ({draftsCount})
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('ai-ingest')}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ingest New Phone</span>
                  </button>
                </div>
              </div>

              {isLoadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : filteredPhones.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center">
                  <Smartphone className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">
                    {catalogFilter === 'drafts'
                      ? 'No drafts in backend'
                      : catalogFilter === 'published'
                      ? 'No custom published phones yet'
                      : 'No custom phones added yet'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Use the &quot;AI Ingest&quot; tab to search or upload any phone. Gemini grounds the real-time environment price, RAM, and processor, allowing you to draft or publish.
                  </p>
                  <button
                    onClick={() => setActiveTab('ai-ingest')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ingest Phone with AI Agent</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950">
                  {filteredPhones.map((phone) => {
                    const isPublished = phone.isPublished !== false;
                    const isRefreshingThis = refreshingCatalogId === phone.id;
                    return (
                      <div
                        key={phone.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 overflow-hidden">
                            <img
                              src={phone.image}
                              alt={phone.name}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase text-indigo-400">
                                {phone.brand}
                              </span>
                              {isPublished ? (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                                  <Globe className="h-2.5 w-2.5 text-emerald-400" />
                                  <span>LIVE FOR USERS</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                                  <Lock className="h-2.5 w-2.5 text-amber-400" />
                                  <span>DRAFT (BACKEND ONLY)</span>
                                </span>
                              )}
                              {phone.realTimePriceVerified && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                  <Zap className="h-2.5 w-2.5" />
                                  <span>Live Price Verified</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white truncate">{phone.name}</h4>
                            
                            {/* Real-Time Specs Badges */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-300 mt-1">
                              <span className="font-bold text-emerald-400">
                                {formatINR(phone.price)}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-800/40 text-[10px] font-semibold">
                                {phone.details.ram || '8GB RAM'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="rounded bg-indigo-950/60 px-1.5 py-0.5 text-indigo-300 border border-indigo-800/40 text-[10px] font-semibold truncate max-w-[180px]">
                                {phone.details.processor || 'Fast Octa-core'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Sync Live Price & Hardware Button */}
                          <button
                            type="button"
                            onClick={() => handleRefreshCatalogPhone(phone)}
                            disabled={isRefreshingThis}
                            className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                            title="Re-check live market price & processor via Google Search"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingThis ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">{isRefreshingThis ? 'Syncing...' : 'Sync Live'}</span>
                          </button>

                          {/* Toggle Publish / Unpublish */}
                          <button
                            onClick={() => handleTogglePublish(phone)}
                            disabled={togglingId === phone.id}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                              isPublished
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                            title={isPublished ? 'Unpublish from store (move to draft)' : 'Publish to live store for users'}
                          >
                            {togglingId === phone.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : isPublished ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>Unpublish</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-3.5 w-3.5" />
                                <span>Publish</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              onOpenPhoneDetail(phone);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-white cursor-pointer"
                            title="Preview in Store"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </button>

                          <button
                            onClick={() => handleDeletePhone(phone.id, phone.name)}
                            disabled={deletingId === phone.id}
                            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50 cursor-pointer"
                            title="Delete from Catalog"
                          >
                            {deletingId === phone.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Developer Backend • Live Users Catalog: <strong>{totalCatalogCount} phones</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-semibold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            Close Backend
          </button>
        </div>
      </div>
    </div>
  );
};
