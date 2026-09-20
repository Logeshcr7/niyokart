import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Scale,
  Trash2,
  Calendar,
  Database,
  ShieldCheck,
  UserCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PhoneSpecs, AlgorithmWeights, formatINR } from '../data/phones.ts';
import { SavedComparisonRecord } from '../types/index.ts';

interface SavedComparisonsViewProps {
  isOpen: boolean;
  onClose: () => void;
  phones: PhoneSpecs[];
  onLoadComparison: (phoneIds: string[], weights?: AlgorithmWeights) => void;
  openLoginModal: () => void;
}

export const SavedComparisonsView: React.FC<SavedComparisonsViewProps> = ({
  isOpen,
  onClose,
  phones,
  onLoadComparison,
  openLoginModal,
}) => {
  const { token, dbUser, refreshUserData } = useAuth();
  const [comparisons, setComparisons] = useState<SavedComparisonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fetchComparisons = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comparisons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch saved comparisons');
      const data = await res.json();
      setComparisons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading saved comparisons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchComparisons();
    } else {
      setComparisons([]);
    }
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/comparisons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComparisons((prev) => prev.filter((c) => c.id !== id));
        refreshUserData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Saved Comparisons in PostgreSQL</h3>
              <p className="text-xs text-slate-500">
                Persistent database sessions stored in Cloud SQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token || !dbUser ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
                <Database className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">PostgreSQL Sign In Required</h4>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Log in to synchronize and access your saved smartphone comparison sessions.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Sign In to PostgreSQL
              </button>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading comparisons from Cloud SQL PostgreSQL...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : comparisons.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bookmark className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">
                You haven't saved any comparisons to PostgreSQL yet. Compare 2 or more phones in the table and click "Save to PostgreSQL".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {comparisons.map((comp) => {
                let phoneIds: string[] = [];
                let savedWeights: AlgorithmWeights | undefined;
                try {
                  phoneIds = JSON.parse(comp.phoneIds);
                } catch (e) {
                  phoneIds = [];
                }
                try {
                  savedWeights = JSON.parse(comp.weights);
                } catch (e) {}

                const matchedPhones = phones.filter((p) => phoneIds.includes(p.id));

                return (
                  <div
                    key={comp.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{comp.title}</h4>
                        <button
                          onClick={() => handleDelete(comp.id)}
                          className="text-slate-400 hover:text-rose-600"
                          title="Delete comparison"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(comp.createdAt).toLocaleDateString()}
                      </p>

                      {comp.notes && (
                        <p className="mt-2 text-[11px] italic text-slate-600">
                          "{comp.notes}"
                        </p>
                      )}

                      {/* Phone pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {matchedPhones.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                          >
                            <span>{p.name}</span>
                            <span className="text-blue-600 font-mono">{formatINR(p.price)}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onLoadComparison(phoneIds, savedWeights);
                        onClose();
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      <span>Load into Comparison</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
