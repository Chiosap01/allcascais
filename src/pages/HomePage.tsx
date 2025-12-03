// src/pages/HomePage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

// Value imports from categories.ts
import {
  CATEGORIES,
  SUBCATEGORIES,
  getCategoryLabel,
  getSubcategoryLabel,
} from "../data/categories";

// Type-only imports
import type { CategoryId, Category, Subcategory } from "../data/categories";

/* ---------- SHARED PILL STYLES ---------- */

const pillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-2 text-[11px] sm:text-xs transform transition duration-150";
const pillSize = "min-w-[88px] sm:min-w-[110px]";

const subPillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-1.5 text-[10px] sm:text-xs transform transition duration-150";
const subPillSize = "min-w-[78px] sm:min-w-[100px]";

/* ---------- OPENING HOURS TYPE (matches jsonb) ---------- */

type OpeningHour = {
  dayKey: string; // "mon", "tue", ...
  labelEn: string;
  labelPt: string;
  open: string; // "09:00"
  close: string; // "18:00"
  closed: boolean;
};

/* ---------- SERVICE TYPES ---------- */

type Service = {
  id: number | string;
  name: string;
  quote: string;
  categoryId: CategoryId;
  subcategoryId?: string;
  location: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHoursText?: string;

  // Derived rating summary
  rating?: number;
  ratingCount?: number;

  languages: string[];

  avatarUrl?: string;
  providerFirstName?: string;

  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;

  // raw rating details
  workQuality?: number;
  punctuality?: number;
  ratingComment?: string;
  ratingCreatedAt?: string;
};

type ServiceRatingRow = {
  service_id: string;
  user_id: string;
  work_quality: number;
  punctuality: number;
  comment: string | null;
  created_at: string;
};

/* ---------- STATIC DEMO SERVICES ---------- */

const STATIC_SERVICES: Service[] = [
  {
    id: 1,
    name: "Blue Waves Property Care",
    quote:
      "We care for your home as if it were our own. Reliable, multilingual and detail-oriented.",
    categoryId: "real-estate",
    subcategoryId: "property-management",
    location: "Cascais Center",
    phone: "+351 912 345 678",
    email: "info@bluewaves-cascais.pt",
    website: "www.bluewaves-cascais.pt",
    openingHoursText: "Mo–Fr 09:00–18:00",
    rating: 4.9,
    ratingCount: 18,
    languages: ["en", "pt", "es", "de"],
  },
  {
    id: 2,
    name: "Guincho Surf School",
    quote:
      "Small groups, patient instructors and all equipment included – just bring your smile.",
    categoryId: "sports-outdoors",
    subcategoryId: "surf-school",
    location: "Praia do Guincho",
    phone: "+351 965 111 222",
    email: "hello@guinchosurf.pt",
    website: "www.guinchosurf.pt",
    openingHoursText: "Every day 08:00–19:00",
    rating: 4.7,
    ratingCount: 42,
    languages: ["en", "pt", "fr", "es"],
  },
  {
    id: 3,
    name: "Cascais Healthy Smiles",
    quote: "Gentle, modern dentistry with a focus on expats and families.",
    categoryId: "medical",
    subcategoryId: "dentist",
    location: "Cascais Historic Center",
    phone: "+351 214 000 555",
    email: "clinic@healthysmiles.pt",
    website: "www.healthysmiles.pt",
    openingHoursText: "Mo–Sat 09:00–19:00",
    rating: 4.5,
    ratingCount: 27,
    languages: ["en", "pt"],
  },
  {
    id: 4,
    name: "Casa Atlântica Cleaning",
    quote:
      "From turnover cleans to deep seasonal refresh – we keep your Cascais home guest-ready.",
    categoryId: "home-services",
    subcategoryId: "cleaning",
    location: "Cascais & Carcavelos",
    phone: "+351 937 000 444",
    email: "contact@casaatlantica.pt",
    website: "www.casaatlantica.pt",
    openingHoursText: "Mo–Fr 08:00–17:00",
    rating: 4.2,
    ratingCount: 11,
    languages: ["pt", "en"],
  },
  {
    id: 5,
    name: "Lisbon Coast Airport Transfers",
    quote:
      "On-time pickups, child seats on request and friendly English-speaking drivers.",
    categoryId: "transportation",
    subcategoryId: "airport-transfer",
    location: "Cascais, Estoril, Carcavelos",
    phone: "+351 933 987 123",
    email: "bookings@lisboncoasttransfers.pt",
    website: "www.lisboncoasttransfers.pt",
    openingHoursText: "24/7",
    rating: 4.8,
    ratingCount: 36,
    languages: ["en", "pt", "es"],
  },
  {
    id: 6,
    name: "Cascais Co-Work Hub",
    quote:
      "Sea views, fast Wi-Fi and a relaxed international community right next to the train station.",
    categoryId: "professional",
    subcategoryId: "coworking",
    location: "Near Cascais train station",
    phone: "+351 932 222 777",
    email: "hello@cascaiscowork.pt",
    website: "www.cascaiscowork.pt",
    openingHoursText: "Mo–Fr 08:00–20:00",
    rating: undefined,
    ratingCount: 0,
    languages: ["en", "pt"],
  },
];

/* ---------- DB ROW TYPE & FORMATTER ---------- */

type ServiceRow = {
  id: string;
  user_id: string;
  service_name: string;
  description: string | null;
  category_id: CategoryId;
  subcategory_id: string | null;
  location: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;

  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkedin: string | null;

  opening_hours: OpeningHour[] | null;
  show_online: boolean | null;

  created_at: string;
  updated_at: string | null;
  languages: string[] | string | null;
  provider_profile_image_url: string | null;

  work_quality: number | null;
  punctuality: number | null;
  comment: string | null;
  rating_created_at: string | null;
};

// Format OpeningHour[] into a compact string
const formatOpeningHours = (
  opening: OpeningHour[] | null | undefined,
  isPT: boolean
) => {
  if (!opening || !Array.isArray(opening) || opening.length === 0) return "";

  const ORDER: string[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const LABEL_EN: Record<string, string> = {
    mon: "Mo",
    tue: "Tu",
    wed: "We",
    thu: "Th",
    fri: "Fr",
    sat: "Sa",
    sun: "Su",
  };

  const LABEL_PT: Record<string, string> = {
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sáb",
    sun: "Dom",
  };

  const LABEL = isPT ? LABEL_PT : LABEL_EN;

  const byKey: Record<string, OpeningHour> = {};
  opening.forEach((row) => {
    if (row && row.dayKey) {
      byKey[row.dayKey] = row;
    }
  });

  const openDays = ORDER.filter(
    (k) => byKey[k] && !byKey[k].closed && byKey[k].open && byKey[k].close
  );
  if (openDays.length === 0) return "";

  type Group = {
    startKey: string;
    endKey: string;
    open: string;
    close: string;
  };

  const groups: Group[] = [];
  let current: Group | null = null;

  const indexOfDay = (key: string) => ORDER.indexOf(key);

  for (const key of openDays) {
    const row = byKey[key];
    if (!row) continue;

    if (
      !current ||
      row.open !== current.open ||
      row.close !== current.close ||
      indexOfDay(key) !== indexOfDay(current.endKey) + 1
    ) {
      current = {
        startKey: key,
        endKey: key,
        open: row.open,
        close: row.close,
      };
      groups.push(current);
    } else {
      current.endKey = key;
    }
  }

  const parts = groups.map((g) => {
    const startLabel = LABEL[g.startKey] ?? g.startKey;
    const endLabel = LABEL[g.endKey] ?? g.endKey;
    const dayPart =
      g.startKey === g.endKey ? startLabel : `${startLabel}–${endLabel}`;
    return `${dayPart} ${g.open}-${g.close}`;
  });

  return parts.join(", ");
};

const mapRowToService = (row: ServiceRow, isPT: boolean): Service => {
  // languages can be text[] or comma-separated string
  let languages: string[] = [];
  if (Array.isArray(row.languages)) {
    languages = row.languages;
  } else if (typeof row.languages === "string" && row.languages.trim() !== "") {
    languages = row.languages.split(",").map((s) => s.trim());
  }

  const openingHoursText = formatOpeningHours(row.opening_hours ?? null, isPT);

  // derive overall rating if both criteria exist (fallback when we don't aggregate)
  let rating: number | undefined;
  let ratingCount: number | undefined;

  if (row.work_quality != null && row.punctuality != null) {
    rating = (row.work_quality + row.punctuality) / 2;
    ratingCount = 1;
  }

  return {
    id: row.id,
    name: row.service_name,
    quote: row.description ?? "",
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id ?? undefined,
    location: row.location ?? "",
    email: row.contact_email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    openingHoursText,
    rating,
    ratingCount,
    languages,
    avatarUrl: row.provider_profile_image_url ?? undefined,
    providerFirstName: undefined,

    instagram: row.instagram ?? undefined,
    facebook: row.facebook ?? undefined,
    tiktok: row.tiktok ?? undefined,
    linkedin: row.linkedin ?? undefined,

    workQuality: row.work_quality ?? undefined,
    punctuality: row.punctuality ?? undefined,
    ratingComment: row.comment ?? undefined,
    ratingCreatedAt: row.rating_created_at ?? undefined,
  };
};

/* ---------- STAR INPUT (for rating modal) ---------- */

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
};

const StarInput: React.FC<StarInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-xl focus:outline-none"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <span className={star <= value ? "text-amber-400" : "text-slate-300"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

/* ---------- RATING MODAL (write rating) ---------- */

type RatingModalProps = {
  service: Service;
  onClose: () => void;
};

const RatingModal: React.FC<RatingModalProps> = ({ service, onClose }) => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { user } = useAuth();

  // start empty; we don't prefill with averages
  const [workQuality, setWorkQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      alert(
        isPT
          ? "Tem de iniciar sessão para avaliar um serviço."
          : "You need to be signed in to rate a service."
      );
      return;
    }

    if (!workQuality || !punctuality) {
      setErrorMsg(
        isPT
          ? "Por favor, atribua uma classificação em ambos os critérios."
          : "Please give a rating for both criteria."
      );
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("service_ratings").upsert(
        {
          service_id: String(service.id),
          user_id: user.id,
          work_quality: workQuality,
          punctuality,
          comment: comment.trim() || null,
        },
        {
          onConflict: "service_id,user_id", // matches the unique index
        }
      );

      if (error) {
        // 23505 = unique_violation (already has a rating for this service+user)
        if ((error as any).code === "23505") {
          setErrorMsg(
            isPT
              ? "Já avaliou este serviço. Só pode avaliar uma vez."
              : "You have already rated this service. You can only rate it once."
          );
          return;
        }

        console.error("Error inserting into service_ratings:", error);
        setErrorMsg(
          isPT
            ? "Ocorreu um erro ao submeter a sua avaliação."
            : "Something went wrong while submitting your rating."
        );
        return;
      }

      setSuccessMsg(
        isPT ? "Avaliação enviada – obrigado!" : "Rating submitted – thank you!"
      );

      setTimeout(() => {
        onClose();
        // Optionally: trigger a refetch of services to update stars immediately
      }, 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-3">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit} className="px-5 py-4 sm:px-6 sm:py-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {isPT ? "Avaliar" : "Rate"} {service.name}
              </h2>
              <p className="text-xs text-slate-500">
                {isPT
                  ? "Partilhe a sua experiência para ajudar outros em Cascais."
                  : "Share your experience to help others in Cascais."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-lg"
              aria-label={isPT ? "Fechar" : "Close"}
            >
              ×
            </button>
          </div>

          {/* Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span>🎯</span>
                <span>{isPT ? "Qualidade do trabalho" : "Work quality"}</span>
              </div>
              <StarInput value={workQuality} onChange={setWorkQuality} />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span>⏰</span>
                <span>{isPT ? "Pontualidade" : "Punctuality"}</span>
              </div>
              <StarInput value={punctuality} onChange={setPunctuality} />
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1">
              <span>💬</span>
              <span>
                {isPT ? "Comentário (opcional)" : "Comment (optional)"}
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={
                isPT
                  ? "Partilhe detalhes sobre a sua experiência com este serviço..."
                  : "Share a bit about your experience with this service..."
              }
            />
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm hover:bg-sky-700 disabled:opacity-60"
            >
              {submitting
                ? isPT
                  ? "A submeter..."
                  : "Submitting..."
                : isPT
                ? "Submeter avaliação"
                : "Submit rating"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold px-5 py-2.5 hover:bg-slate-200"
            >
              {isPT ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- RATING DETAILS MODAL (read-only) ---------- */

type RatingDetailsModalProps = {
  service: Service;
  onClose: () => void;
};

const RatingDetailsModal: React.FC<RatingDetailsModalProps> = ({
  service,
  onClose,
}) => {
  const { language } = useLanguage();
  const isPT = language === "pt";

  const rating =
    service.workQuality != null && service.punctuality != null
      ? (service.workQuality + service.punctuality) / 2
      : undefined;

  const createdAt = service.ratingCreatedAt
    ? new Date(service.ratingCreatedAt)
    : null;

  const formattedDate = createdAt
    ? createdAt.toLocaleDateString(isPT ? "pt-PT" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-3">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl border border-slate-100">
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {isPT ? "Avaliações de" : "Ratings for"} {service.name}
              </h2>
              <p className="text-xs text-slate-500">
                {isPT
                  ? "Veja como outros avaliam este serviço em Cascais."
                  : "See how others rate this service in Cascais."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-lg"
              aria-label={isPT ? "Fechar" : "Close"}
            >
              ×
            </button>
          </div>

          {rating == null ? (
            <div className="text-xs sm:text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl px-3 py-3">
              {isPT
                ? "Ainda não há avaliações para este serviço."
                : "There are no ratings for this service yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall */}
              <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    {isPT ? "Classificação geral" : "Overall rating"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {rating.toFixed(1)}
                    </span>
                    <div className="flex text-amber-400 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {i < Math.round(rating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {formattedDate && (
                  <div className="text-[11px] text-slate-500">
                    {isPT ? "Avaliado em " : "Rated on "}
                    {formattedDate}
                  </div>
                )}
              </div>

              {/* Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                    <span>🎯</span>
                    <span>
                      {isPT ? "Qualidade do trabalho" : "Work quality"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {service.workQuality && i < service.workQuality
                            ? "★"
                            : "☆"}
                        </span>
                      ))}
                    </div>
                    {service.workQuality != null && (
                      <span className="text-[11px] text-slate-500">
                        {service.workQuality.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                    <span>⏰</span>
                    <span>{isPT ? "Pontualidade" : "Punctuality"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {service.punctuality && i < service.punctuality
                            ? "★"
                            : "☆"}
                        </span>
                      ))}
                    </div>
                    {service.punctuality != null && (
                      <span className="text-[11px] text-slate-500">
                        {service.punctuality.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment */}
              {service.ratingComment && (
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                    <span>💬</span>
                    <span>{isPT ? "Comentário" : "Comment"}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                    {service.ratingComment}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold px-5 py-2.5 hover:bg-slate-200"
            >
              {isPT ? "Fechar" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SERVICE CARD COMPONENT ---------- */

type ServiceCardProps = {
  service: Service;
  onRate: (service: Service) => void;
  onShowRatingDetails: (service: Service) => void;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onRate,
  onShowRatingDetails,
}) => {
  const { language } = useLanguage();
  const isPT = language === "pt";

  const [showContact, setShowContact] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const localizeOpeningHoursText = (text?: string) => {
    if (!text) return "";
    if (!isPT) return text;

    const map: Record<string, string> = {
      Mo: "Seg",
      Tu: "Ter",
      We: "Qua",
      Th: "Qui",
      Fr: "Sex",
      Sa: "Sáb",
      Su: "Dom",
    };

    let result = text;
    Object.entries(map).forEach(([en, pt]) => {
      const regex = new RegExp(`\\b${en}\\b`, "g");
      result = result.replace(regex, pt);
    });

    return result;
  };

  const renderStars = (rating?: number) => {
    if (rating == null) {
      return (
        <span className="text-[11px] text-slate-400 italic">
          {isPT ? "Sem avaliação" : "No rating yet"}
        </span>
      );
    }

    const fullStars = Math.round(rating);

    return (
      <div className="flex items-center gap-1 text-amber-400 text-xs">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < fullStars ? "★" : "☆"}</span>
        ))}
        <span className="ml-1 text-[11px] text-slate-500">
          {rating.toFixed(1)}{" "}
          {service.ratingCount !== undefined ? `(${service.ratingCount})` : ""}
        </span>
      </div>
    );
  };

  const languageFlag = (code: string) => {
    const c = code.toLowerCase();
    switch (c) {
      case "en":
        return "🇬🇧";
      case "pt":
        return "🇵🇹";
      case "es":
        return "🇪🇸";
      case "fr":
        return "🇫🇷";
      case "de":
        return "🇩🇪";
      case "it":
        return "🇮🇹";
      case "ru":
        return "🇷🇺";
      default:
        return "🏳️";
    }
  };

  const socialUrl = (
    platform: "instagram" | "facebook" | "tiktok" | "linkedin",
    value?: string
  ) => {
    if (!value) return null;
    const v = value.trim();
    if (!v) return null;

    if (v.startsWith("http://") || v.startsWith("https://")) return v;

    switch (platform) {
      case "instagram":
        return `https://instagram.com/${v.replace(/^@/, "")}`;
      case "facebook":
        return `https://facebook.com/${v}`;
      case "tiktok":
        return `https://www.tiktok.com/@${v.replace(/^@/, "")}`;
      case "linkedin":
        return `https://www.linkedin.com/${v}`;
      default:
        return null;
    }
  };

  const instagramUrl = socialUrl("instagram", service.instagram);
  const facebookUrl = socialUrl("facebook", service.facebook);
  const tiktokUrl = socialUrl("tiktok", service.tiktok);
  const linkedinUrl = socialUrl("linkedin", service.linkedin);
  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl || linkedinUrl;

  const avatarLetter =
    (service.providerFirstName &&
      service.providerFirstName.charAt(0).toUpperCase()) ||
    (service.name && service.name.charAt(0).toUpperCase()) ||
    "?";

  const isLongDescription = (service.quote || "").length > 220;

  return (
    <article className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition break-inside-avoid">
      {/* HEADER */}
      <div className="p-4 pb-3 flex items-start gap-3 border-b border-slate-100">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
          {service.avatarUrl ? (
            <img
              src={service.avatarUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{avatarLetter}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {service.name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                  {getCategoryLabel(service.categoryId, isPT)}
                </span>

                {service.subcategoryId && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                    {getSubcategoryLabel(
                      service.categoryId,
                      service.subcategoryId,
                      isPT
                    )}
                  </span>
                )}
              </div>
            </div>

            {service.languages.length > 0 && (
              <div className="flex flex-wrap gap-1 text-base">
                {service.languages.map((lang) => (
                  <span key={lang}>{languageFlag(lang)}</span>
                ))}
              </div>
            )}
          </div>

          {/* Rating + location */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div>{renderStars(service.rating)}</div>

              {service.workQuality != null && service.punctuality != null && (
                <button
                  type="button"
                  onClick={() => onShowRatingDetails(service)}
                  className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
                >
                  {isPT ? "Ver avaliação" : "See rating"}
                </button>
              )}
            </div>

            {service.location && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <span>📍</span>
                <span className="truncate">{service.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        {service.quote && (
          <div className="space-y-1">
            <p
              className={[
                "text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed",
                !showFullDescription ? "line-clamp-3" : "",
              ].join(" ")}
            >
              {service.quote}
            </p>

            {isLongDescription && (
              <button
                type="button"
                onClick={() => setShowFullDescription((v) => !v)}
                className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
              >
                {showFullDescription
                  ? isPT
                    ? "Mostrar menos"
                    : "Show less"
                  : isPT
                  ? "Mostrar descrição completa"
                  : "Show full description"}
              </button>
            )}
          </div>
        )}

        {service.openingHoursText && (
          <div className="inline-flex items-center rounded-full bg-slate-100 text-[11px] text-slate-700 px-3 py-1 mb-2">
            <span className="mr-1">🕒</span>
            <span>
              {isPT ? "Horário:" : "Opening hours:"}{" "}
              {localizeOpeningHoursText(service.openingHoursText)}
            </span>
          </div>
        )}

        {showContact && (
          <div className="mt-1 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-[11px] sm:text-xs space-y-2">
            <div className="font-semibold text-slate-700 mb-1">
              {isPT ? "Informações de contacto" : "Contact information"}
            </div>

            {service.phone && (
              <div className="flex items-center gap-2">
                <span>📞</span>
                <a
                  href={`tel:${service.phone.replace(/\s/g, "")}`}
                  className="hover:underline"
                >
                  {service.phone}
                </a>
              </div>
            )}

            {service.email && (
              <div className="flex items-center gap-2">
                <span>✉️</span>
                <a
                  href={`mailto:${service.email}`}
                  className="truncate text-sky-700 hover:underline"
                >
                  {service.email}
                </a>
              </div>
            )}

            {service.website && (
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <a
                  href={`https://${service.website.replace(
                    /^https?:\/\//,
                    ""
                  )}`}
                  className="text-sky-600 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {service.website}
                </a>
              </div>
            )}

            {hasAnySocial && (
              <div className="pt-2 mt-2 border-t border-slate-200 flex flex-wrap gap-3">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-7 h-7"
                  >
                    <img
                      src="assets/social-media/instagram.png"
                      alt="Instagram"
                      className="w-4 h-4 object-contain"
                    />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-7 h-7"
                  >
                    <img
                      src="assets/social-media/facebook.png"
                      alt="Facebook"
                      className="w-4 h-4 object-contain"
                    />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-7 h-7"
                  >
                    <img
                      src="assets/social-media/tiktok.png"
                      alt="TikTok"
                      className="w-4 h-4 object-contain"
                    />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-7 h-7"
                  >
                    <img
                      src="assets/social-media/linkedin.png"
                      alt="LinkedIn"
                      className="w-4 h-4 object-contain"
                    />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer buttons – contact + rate */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setShowContact((v) => !v)}
            className={[
              "flex-1 rounded-full text-xs font-semibold py-2.5 border transition",
              showContact
                ? "bg-slate-100 text-slate-800 border-slate-400 hover:bg-slate-200"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
            ].join(" ")}
          >
            {showContact
              ? isPT
                ? "Esconder contacto"
                : "Hide contact"
              : isPT
              ? "Mostrar contacto"
              : "Show contact"}
          </button>

          <button
            type="button"
            onClick={() => onRate(service)}
            className="flex-1 rounded-full bg-sky-600 text-white text-xs font-semibold py-2.5 shadow-sm hover:bg-sky-700 transition"
          >
            {isPT ? "Avaliar serviço" : "Rate service"}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ---------- HOMEPAGE ---------- */

type RatingFilter = "all" | "no-rating" | 1 | 2 | 3 | 4 | 5;

const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | "all"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

  // lifted modal state
  const [ratingModalService, setRatingModalService] = useState<Service | null>(
    null
  );
  const [ratingDetailsService, setRatingDetailsService] =
    useState<Service | null>(null);

  const currentSubcategories: Subcategory[] = (SUBCATEGORIES[
    selectedCategory
  ] ?? []) as Subcategory[];

  const displayCategories: Category[] =
    selectedCategory === "all"
      ? CATEGORIES
      : CATEGORIES.filter(
          (c: Category) => c.id === "all" || c.id === selectedCategory
        );

  const allServices = useMemo(
    () => [...dbServices, ...STATIC_SERVICES],
    [dbServices]
  );

  const filteredServices = useMemo(() => {
    let list = [...allServices];

    if (selectedCategory !== "all") {
      list = list.filter((s) => s.categoryId === selectedCategory);
    }

    if (selectedSubcategory !== "all") {
      list = list.filter((s) => s.subcategoryId === selectedSubcategory);
    }

    if (ratingFilter === "no-rating") {
      list = list.filter((s) => !s.rating);
    } else if (ratingFilter !== "all") {
      list = list.filter((s) => (s.rating ?? 0) >= ratingFilter);
    }

    return list;
  }, [allServices, selectedCategory, selectedSubcategory, ratingFilter]);

  // Only show the most common useful thresholds
  const ratingOptions: RatingFilter[] = [5, 4, 3];

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      // 1) Load service listings
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_listings")
        .select("*")
        .eq("show_online", true);

      if (servicesError) {
        console.error("Error loading services from Supabase:", servicesError);
        setDbServices([]);
        setLoadingServices(false);
        return;
      }

      const serviceRows = (servicesData ?? []) as ServiceRow[];
      let mapped = serviceRows.map((row) => mapRowToService(row, isPT));

      // 2) Load all ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("service_ratings")
        .select("*");

      if (ratingsError) {
        console.error("Error loading ratings from Supabase:", ratingsError);
        setDbServices(mapped);
        setLoadingServices(false);
        return;
      }

      const ratings = (ratingsData ?? []) as ServiceRatingRow[];

      // 3) Aggregate ratings by service_id
      const ratingStats: Record<
        string,
        {
          sumWork: number;
          sumPunct: number;
          count: number;
          lastComment: string | null;
          lastCreatedAt: string | null;
        }
      > = {};

      ratings.forEach((r) => {
        const key = r.service_id;
        if (!ratingStats[key]) {
          ratingStats[key] = {
            sumWork: 0,
            sumPunct: 0,
            count: 0,
            lastComment: null,
            lastCreatedAt: null,
          };
        }
        const stat = ratingStats[key];
        stat.sumWork += r.work_quality;
        stat.sumPunct += r.punctuality;
        stat.count += 1;

        // keep latest comment by created_at
        if (!stat.lastCreatedAt || r.created_at > stat.lastCreatedAt) {
          stat.lastCreatedAt = r.created_at;
          stat.lastComment = r.comment;
        }
      });

      // 4) Merge stats into services
      mapped = mapped.map((svc) => {
        const stats = ratingStats[String(svc.id)];
        if (!stats || stats.count === 0) return svc;

        const avgWork = stats.sumWork / stats.count;
        const avgPunct = stats.sumPunct / stats.count;
        const overall = (avgWork + avgPunct) / 2;

        return {
          ...svc,
          rating: overall,
          ratingCount: stats.count,
          workQuality: avgWork,
          punctuality: avgPunct,
          ratingComment: stats.lastComment ?? undefined,
          ratingCreatedAt: stats.lastCreatedAt ?? undefined,
        };
      });

      setDbServices(mapped);
      setLoadingServices(false);
    };

    fetchServices();
  }, [isPT]);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* HEADER / INTRO */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
          {isPT
            ? "Serviços verificados em Cascais"
            : "Trusted services in Cascais"}
        </h1>
        <p className="text-sm text-slate-600">
          {isPT
            ? "Encontre prestadores de confiança na linha de Cascais – de surf a saúde, de limpezas a transfers."
            : "Discover local, trusted providers around Cascais – from surf and health to cleaning and transfers."}
        </p>
      </header>

      {/* CATEGORY STRIP */}
      <section
        className="bg-linear-to-r from-sky-50 via-cyan-50 to-sky-50 pt-4 pb-4 border-y border-sky-100/70"
        aria-label={isPT ? "Categorias de serviços" : "Service categories"}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {displayCategories.map((category: Category) => {
              const active = category.id === selectedCategory;

              const baseClasses = [
                pillBase,
                pillSize,
                active
                  ? "border-sky-500 bg-gradient-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                  : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                "hover:-translate-y-0.5 hover:shadow-md",
              ].join(" ");

              const isAll = category.id === "all";

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    if (isAll) {
                      setSelectedCategory("all");
                      setSelectedSubcategory("all");
                    } else {
                      setSelectedCategory(category.id as CategoryId);
                      setSelectedSubcategory("all");
                    }
                  }}
                  className={baseClasses}
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-lg sm:text-xl"
                    aria-hidden="true"
                  >
                    {isAll ? "🏖️" : category.icon}
                  </span>
                  <span className="truncate font-medium">
                    {isAll
                      ? isPT
                        ? "Todos"
                        : "All"
                      : getCategoryLabel(category.id as CategoryId, isPT)}
                  </span>

                  {active && (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-sky-200/60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SUBCATEGORY STRIP */}
          {selectedCategory !== "all" && currentSubcategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 items-center">
              {/* "All" pill styled like the others */}
              <button
                type="button"
                onClick={() => setSelectedSubcategory("all")}
                className={[
                  subPillBase,
                  subPillSize,
                  selectedSubcategory === "all"
                    ? "border-sky-500 bg-linear-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                    : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                  "hover:-translate-y-0.5 hover:shadow-md",
                ].join(" ")}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-base"
                  aria-hidden="true"
                >
                  🏖️
                </span>
                <span className="truncate font-medium">
                  {isPT ? "Todos" : "All"}
                </span>
              </button>

              {currentSubcategories.map((sub: Subcategory) => {
                const active = selectedSubcategory === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={[
                      subPillBase,
                      subPillSize,
                      active
                        ? "border-sky-500 bg-linear-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                        : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                      "hover:-translate-y-0.5 hover:shadow-md",
                    ].join(" ")}
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-base"
                      aria-hidden="true"
                    >
                      {sub.icon}
                    </span>
                    <span className="truncate font-medium">
                      {getSubcategoryLabel(selectedCategory, sub.id, isPT)}
                    </span>

                    {active && (
                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-sky-200/60" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RATING FILTER BAR */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Left: minimum rating chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-slate-500">
              {isPT ? "Avaliação mínima" : "Minimum rating"}
            </span>

            {ratingOptions.map((value: RatingFilter) => {
              const active = ratingFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatingFilter(value)}
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] sm:text-xs font-medium",
                    active
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span>{value}+</span>
                  <span>⭐</span>
                </button>
              );
            })}
          </div>

          {/* Middle: no-rating toggle */}
          <button
            type="button"
            onClick={() => setRatingFilter("no-rating")}
            className={[
              "inline-flex items-center rounded-full border px-3 py-1 text-[11px] sm:text-xs",
              ratingFilter === "no-rating"
                ? "border-slate-700 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {isPT ? "Sem avaliação" : "No rating"}
          </button>

          {/* Right: reset */}
          <button
            type="button"
            onClick={() => setRatingFilter("all")}
            className="ml-auto text-[11px] sm:text-xs text-slate-500 underline"
          >
            {isPT ? "Limpar filtro" : "Reset filter"}
          </button>
        </div>
      </section>

      {/* SERVICES LIST */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        {loadingServices && dbServices.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-400">
            {isPT ? "A carregar serviços..." : "Loading services..."}
          </div>
        )}

        {filteredServices.length === 0 && !loadingServices && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {isPT
              ? "Ainda não há serviços que correspondam aos filtros. Experimente mudar a categoria, subcategoria ou avaliação."
              : "No services match your filters yet. Try changing category, subcategory or rating."}
          </div>
        )}

        {filteredServices.length > 0 && (
          <div className="mb-3 text-xs sm:text-sm text-slate-500">
            {isPT
              ? `${filteredServices.length} serviço(s) encontrado(s)`
              : `${filteredServices.length} service(s) found`}
          </div>
        )}

        <div className="columns-1 md:columns-2 xl:columns-3 gap-5 space-y-5">
          {filteredServices.map((service: Service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onRate={(svc) => setRatingModalService(svc)}
              onShowRatingDetails={(svc) => setRatingDetailsService(svc)}
            />
          ))}
        </div>
      </section>

      {/* GLOBAL MODALS (avoids flicker on re-render) */}
      {ratingModalService && (
        <RatingModal
          service={ratingModalService}
          onClose={() => setRatingModalService(null)}
        />
      )}

      {ratingDetailsService && (
        <RatingDetailsModal
          service={ratingDetailsService}
          onClose={() => setRatingDetailsService(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
