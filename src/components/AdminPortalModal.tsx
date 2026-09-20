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
} from 'lucide-react';
import { PhoneSpecs, formatINR } from '../data/phones.ts';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneAdded: (newPhone: PhoneSpecs, wasPublished: boolean) => void;
  onOpenPhoneDetail: (phone: PhoneSpecs) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onPhoneAdded,
  onOpenPhoneDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'ai-ingest' | 'manage-catalog'>('ai-ingest');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'published' | 'drafts'>('all');

  // AI Ingest state
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [optionalHint, setOptionalHint] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractStep, setExtractStep] = useState<string>('');
  const [extractError, setExtractError] = useState<string | null>(null);

  // Extracted draft phone data
  const [extractedPhone, setExtractedPhone] = useState<PhoneSpecs | null>(null);
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

  // Support pasting image anywhere inside the modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
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

  const handleUseSampleImage = async (samplePath: string, hint: string) => {
    try {
      setIsExtracting(true);
      setExtractStep('Loading sample image...');
      setExtractError(null);
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageBase64(reader.result as string);
        setImagePreviewUrl(reader.result as string);
        setSelectedImageMimeType(blob.type || 'image/jpeg');
        setOptionalHint(hint);
        setIsExtracting(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsExtracting(false);
      setExtractError('Could not load sample image: ' + err.message);
    }
  };

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
      }, 2500);

      const timer2 = setTimeout(() => {
        setExtractStep('Step 3/3: Retrieving web hardware specs & computing algorithm scores...');
      }, 5500);

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
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractError(err.message || 'Error occurred during AI extraction.');
    } finally {
      setIsExtracting(false);
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

      setPublishSuccess(`🚀 "${extractedPhone.name}" is now published and available to all shoppers in the store!`);
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

  // Toggle publish status on existing phone
  const handleTogglePublish = async (phone: PhoneSpecs) => {
    const nextStatus = phone.isPublished === false;
    setTogglingId(phone.id);
    try {
      const res = await fetch(`/api/admin/phones/${phone.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
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
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white sm:text-lg">
                  Developer Backend • Smartphone CMS
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold text-indigo-400 border border-indigo-500/30">
                  DEVELOPER ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI extraction backend: Ingest photos, draft specs, and publish to make smartphones instantly available to shoppers.
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
                      className="flex items-center gap-1 font-bold text-emerald-300 hover:underline"
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

              {/* Step 1: Upload Box */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-indigo-400" />
                      <span>1. Upload Smartphone Image / Poster</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Ctrl+V to paste screenshot</span>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                      imagePreviewUrl
                        ? 'border-indigo-500/50 bg-slate-950/60'
                        : 'border-slate-700 bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />

                    {imagePreviewUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={imagePreviewUrl}
                          alt="Uploaded phone preview"
                          className="max-h-40 max-w-full rounded-lg object-contain shadow-md border border-slate-700"
                        />
                        <p className="text-xs text-indigo-400 font-medium">
                          Click or drag to replace image
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-200">
                          Click to select image or drag & drop here
                        </p>
                        <p className="text-xs text-slate-400">
                          Supports phone photos, Flipkart/Amazon banners, box photos & spec sheets
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sample buttons & Quick Fill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>Quick test sample:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUseSampleImage(
                          '/images/moto-g37-power.jpg',
                          'Motorola Moto G37 Power with 7000mAh Battery & Dimensity 6400'
                        )
                      }
                      className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 hover:border-indigo-500 hover:text-white"
                    >
                      Moto G37 Power photo
                    </button>
                  </div>

                  {/* Optional Hint */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Brand / Model Hint or Web Spec URL <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Motorola Moto G37 Power, or Flipkart/Amazon URL"
                      value={optionalHint}
                      onChange={(e) => setOptionalHint(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      If left blank, Gemini will automatically detect the phone name and read text directly from the photo.
                    </p>
                  </div>

                  {/* Extraction Action Button */}
                  <button
                    onClick={handleExtractWithAI}
                    disabled={!imagePreviewUrl || isExtracting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Extracting Specs with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Analyze Image & Extract All Specs with AI</span>
                      </>
                    )}
                  </button>

                  {isExtracting && (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-center">
                      <p className="text-xs font-semibold text-indigo-300">{extractStep}</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-indigo-500 to-purple-400"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Extracted Spec Preview & Publishing Form */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      <span>2. Review Extracted Specs & Backend Action</span>
                    </h3>
                    {extractedPhone && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        Score: {Math.round(
                          (extractedPhone.scores.performance +
                            extractedPhone.scores.camera +
                            extractedPhone.scores.battery +
                            extractedPhone.scores.display +
                            extractedPhone.scores.value) /
                            5
                        )}/100
                      </span>
                    )}
                  </div>

                  {extractedPhone ? (
                    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                      {/* Live Card Preview */}
                      <div className="flex gap-4 rounded-lg bg-slate-900 p-3 border border-slate-800">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
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
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                            {extractedPhone.brand}
                          </span>
                          <h4 className="text-sm font-bold text-white truncate">
                            {extractedPhone.name}
                          </h4>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-base font-black text-white">
                              {formatINR(extractedPhone.price)}
                            </span>
                            {extractedPhone.originalPrice && (
                              <span className="text-xs text-slate-500 line-through">
                                {formatINR(extractedPhone.originalPrice)}
                              </span>
                            )}
                            {extractedPhone.discountPercent && (
                              <span className="text-[11px] font-bold text-emerald-400">
                                {extractedPhone.discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                            {extractedPhone.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Key Specs Breakdown Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                            <Battery className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-semibold text-[11px]">Battery & Charging</span>
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
                            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="font-semibold text-[11px]">Processor</span>
                          </div>
                          <p className="font-bold text-slate-200 truncate">
                            {extractedPhone.details.processor}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            AnTuTu: {extractedPhone.details.antutuScore ? extractedPhone.details.antutuScore.toLocaleString() : 'N/A'}
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

                        <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                            <Shield className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="font-semibold text-[11px]">Display & Build</span>
                          </div>
                          <p className="font-bold text-slate-200 truncate">
                            {extractedPhone.details.displayType}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {extractedPhone.details.ipRating || 'Standard Build'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Edit Fields */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">Phone Name</label>
                            <input
                              type="text"
                              value={extractedPhone.name}
                              onChange={(e) =>
                                setExtractedPhone({ ...extractedPhone, name: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">Store Price (₹)</label>
                            <input
                              type="number"
                              value={extractedPhone.price}
                              onChange={(e) =>
                                setExtractedPhone({
                                  ...extractedPhone,
                                  price: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400">USP Tagline</label>
                          <input
                            type="text"
                            value={extractedPhone.tagline}
                            onChange={(e) =>
                              setExtractedPhone({ ...extractedPhone, tagline: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Developer Action Buttons: Draft vs Publish */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
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
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center text-slate-500">
                      <Sparkles className="h-10 w-10 text-slate-700 mb-2" />
                      <p className="text-sm font-medium text-slate-400">
                        No phone analyzed yet
                      </p>
                      <p className="text-xs text-slate-600 max-w-xs mt-1">
                        Select or drop a phone image on the left, then click &quot;Analyze Image &amp; Extract All Specs with AI&quot;.
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
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
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
                    Use the &quot;AI Ingest&quot; tab to upload any photo or brochure screenshot. Gemini will extract specs and let you publish or draft.
                  </p>
                  <button
                    onClick={() => setActiveTab('ai-ingest')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Upload Phone Image with AI</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950">
                  {filteredPhones.map((phone) => {
                    const isPublished = phone.isPublished !== false;
                    return (
                      <div
                        key={phone.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center gap-3">
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
                          <div>
                            <div className="flex items-center gap-2">
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
                            </div>
                            <h4 className="text-sm font-bold text-white">{phone.name}</h4>
                            <p className="text-xs text-slate-400">
                              {formatINR(phone.price)} • {phone.details.batteryCapacity} • {phone.details.processor}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Toggle Publish / Unpublish */}
                          <button
                            onClick={() => handleTogglePublish(phone)}
                            disabled={togglingId === phone.id}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition ${
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
                            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-white"
                            title="Preview in Store"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </button>

                          <button
                            onClick={() => handleDeletePhone(phone.id, phone.name)}
                            disabled={deletingId === phone.id}
                            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50"
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
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Close Backend
          </button>
        </div>
      </div>
    </div>
  );
};
