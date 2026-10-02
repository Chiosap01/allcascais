// src/pages/HomePage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { toCdnUrl } from "../utils/cdn";
import {
  MapPin,
  Clock,
  Star,
  StarOff,
  Phone,
  Mail,
  Globe,
  Search,
  X,
  Plus,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  LayoutGrid,
} from "lucide-react";

import CategorySheet from "../components/CategorySheet";

import {
  CATEGORIES,
  SUBCATEGORIES,
  getCategoryLabel,
  getSubcategoryLabel,
} from "../data/categories";

import type { CategoryId, Category, Subcategory } from "../data/categories";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F1F3D";
const BRAND_HOVER = "#15152E";

/* Categorias prioritárias para a grelha mobile (Weinschenk: 6 itens = scan instantâneo) */
const PRIMARY_CATEGORY_IDS: CategoryId[] = [
  "home-services",
  "real-estate",
  "food",
  "wellness-beauty",
  "medical",
  "professional",
];

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type OpeningHour = {
  dayKey: string;
  labelEn: string;
  labelPt: string;
  open: string;
  close: string;
  closed: boolean;
};

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
  rating?: number;
  ratingCount?: number;
  languages: string[];
  avatarUrl?: string;
  providerFirstName?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  workQuality?: number;
  punctuality?: number;
  ratingComment?: string;
  ratingCreatedAt?: string;
  createdAt: string;
};

type ServiceRatingRow = {
  service_id: string;
  user_id: string;
  work_quality: number;
  punctuality: number;
  comment: string | null;
  created_at: string;
};

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

type SortOption = "recent" | "rating" | "name";

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
const formatOpeningHours = (
  opening: OpeningHour[] | null | undefined,
  isPT: boolean
) => {
  if (!opening || !Array.isArray(opening) || opening.length === 0) return "";

  const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const LABEL_PT: Record<string, string> = {
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sáb",
    sun: "Dom",
  };
  const LABEL_EN: Record<string, string> = {
    mon: "Mo",
    tue: "Tu",
    wed: "We",
    thu: "Th",
    fri: "Fr",
    sat: "Sa",
    sun: "Su",
  };
  const LABEL = isPT ? LABEL_PT : LABEL_EN;

  const byKey: Record<string, OpeningHour> = {};
  opening.forEach((row) => {
    if (row?.dayKey) byKey[row.dayKey] = row;
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

  return groups
    .map((g) => {
      const s = LABEL[g.startKey] ?? g.startKey;
      const e = LABEL[g.endKey] ?? g.endKey;
      const dayPart = g.startKey === g.endKey ? s : `${s}–${e}`;
      return `${dayPart} ${g.open}-${g.close}`;
    })
    .join(", ");
};

const mapRowToService = (row: ServiceRow, isPT: boolean): Service => {
  const raw = row.provider_profile_image_url;
  const avatarUrl = toCdnUrl(
    raw && !raw.includes("/") && row.user_id ? `${row.user_id}/${raw}` : raw,
    "profile-images"
  );

  let languages: string[] = [];
  if (Array.isArray(row.languages)) languages = row.languages;
  else if (typeof row.languages === "string" && row.languages.trim() !== "")
    languages = row.languages.split(",").map((s) => s.trim());

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
    openingHoursText: formatOpeningHours(row.opening_hours ?? null, isPT),
    languages,
    avatarUrl,
    instagram: row.instagram ?? undefined,
    facebook: row.facebook ?? undefined,
    tiktok: row.tiktok ?? undefined,
    linkedin: row.linkedin ?? undefined,
    workQuality: row.work_quality ?? undefined,
    punctuality: row.punctuality ?? undefined,
    ratingComment: row.comment ?? undefined,
    ratingCreatedAt: row.rating_created_at ?? undefined,
    createdAt: row.created_at,
  };
};

/* ---------------------------------------------------------
   STAR INPUT
--------------------------------------------------------- */
const StarInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
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

/* ---------------------------------------------------------
   RATING MODAL (write)
--------------------------------------------------------- */
const RatingModal: React.FC<{ service: Service; onClose: () => void }> = ({
  service,
  onClose,
}) => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workQuality, setWorkQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-3">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-slate-100">
          <div className="px-5 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-sky-100 flex items-center justify-center mx-auto mb-4 text-2xl">
              🔒
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              {isPT
                ? "Precisas de uma conta para avaliar"
                : "You need an account to rate"}
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              {isPT
                ? "Entra na tua conta e volta para partilhar a tua experiência."
                : "Sign in and come back to share your experience."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 shadow-sm transition"
                style={{ backgroundColor: BRAND }}
              >
                {isPT ? "Entrar" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold py-2.5 hover:bg-slate-200 transition"
              >
                {isPT ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
        { onConflict: "service_id,user_id" }
      );

      if (error) {
        if ((error as any).code === "23505") {
          setErrorMsg(
            isPT
              ? "Já avaliou este serviço."
              : "You have already rated this service."
          );
          return;
        }
        console.error(error);
        setErrorMsg(
          isPT ? "Ocorreu um erro ao submeter." : "Something went wrong."
        );
        return;
      }

      setSuccessMsg(isPT ? "Avaliação enviada!" : "Rating submitted!");
      setTimeout(onClose, 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-3">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit} className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {isPT ? "Avaliar" : "Rate"} {service.name}
              </h2>
              <p className="text-xs text-slate-500">
                {isPT
                  ? "Partilhe a sua experiência para ajudar outros."
                  : "Share your experience to help others."}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span>🎯</span>
                <span>{isPT ? "Qualidade" : "Work quality"}</span>
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
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:border-[#1F1F3D]/40"
              style={{ ["--tw-ring-color" as any]: `${BRAND}55` }}
            />
          </div>

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

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm disabled:opacity-60 transition"
              style={{ backgroundColor: BRAND }}
            >
              {submitting
                ? isPT
                  ? "A submeter..."
                  : "Submitting..."
                : isPT
                ? "Submeter"
                : "Submit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold px-5 py-2.5 hover:bg-slate-200 transition"
            >
              {isPT ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   RATING DETAILS MODAL
--------------------------------------------------------- */
const RatingDetailsModal: React.FC<{
  service: Service;
  onClose: () => void;
}> = ({ service, onClose }) => {
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
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {isPT ? "Avaliações de" : "Ratings for"} {service.name}
              </h2>
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
            <div className="text-xs sm:text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3">
              {isPT ? "Ainda não há avaliações." : "No ratings yet."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
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
                    {isPT ? "Em " : "On "}
                    {formattedDate}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-800 mb-1">
                    🎯 {isPT ? "Qualidade" : "Work quality"}
                  </div>
                  <div className="flex text-amber-400 text-base">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {service.workQuality && i < service.workQuality
                          ? "★"
                          : "☆"}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-800 mb-1">
                    ⏰ {isPT ? "Pontualidade" : "Punctuality"}
                  </div>
                  <div className="flex text-amber-400 text-base">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {service.punctuality && i < service.punctuality
                          ? "★"
                          : "☆"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {service.ratingComment && (
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-800 mb-1">
                    💬 {isPT ? "Comentário" : "Comment"}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                    {service.ratingComment}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold px-5 py-2.5 hover:bg-slate-200 transition"
            >
              {isPT ? "Fechar" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   SERVICE CARD
--------------------------------------------------------- */
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
  const [showAvatarZoom, setShowAvatarZoom] = useState(false);

  const localizeOpeningHoursText = (text?: string) => {
    if (!text || !isPT) return text ?? "";
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
      result = result.replace(new RegExp(`\\b${en}\\b`, "g"), pt);
    });
    return result;
  };

  const renderStars = (rating?: number) => {
    if (rating == null) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-slate-400 italic">
          <StarOff className="w-3.5 h-3.5" />
          {isPT ? "Sem avaliações" : "No ratings"}
        </span>
      );
    }
    const full = Math.round(rating);
    return (
      <div className="flex items-center gap-1 text-amber-500 text-xs">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < full ? "fill-current" : "stroke-current"
            }`}
          />
        ))}
        <span className="ml-1 text-[11px] text-slate-500">
          {rating.toFixed(1)}
          {service.ratingCount !== undefined && ` (${service.ratingCount})`}
        </span>
      </div>
    );
  };

  const languageFlag = (code: string) => {
    const c = code.toLowerCase();
    const map: Record<string, string> = {
      en: "🇬🇧",
      pt: "🇵🇹",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      ru: "🇷🇺",
    };
    return map[c] ?? "🏳️";
  };

  const socialUrl = (
    platform: "instagram" | "facebook" | "tiktok" | "linkedin",
    value?: string
  ) => {
    if (!value?.trim()) return null;
    const v = value.trim();
    if (v.startsWith("http")) return v;
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

  const createdAtDate = service.createdAt ? new Date(service.createdAt) : null;
  const isNew =
    createdAtDate !== null &&
    Date.now() - createdAtDate.getTime() < 48 * 60 * 60 * 1000;

  const instagramUrl = socialUrl("instagram", service.instagram);
  const facebookUrl = socialUrl("facebook", service.facebook);
  const tiktokUrl = socialUrl("tiktok", service.tiktok);
  const linkedinUrl = socialUrl("linkedin", service.linkedin);
  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl || linkedinUrl;

  const avatarLetter =
    service.providerFirstName?.charAt(0).toUpperCase() ||
    service.name?.charAt(0).toUpperCase() ||
    "?";

  const normalizedQuote = (service.quote || "").replace(/\s+/g, " ").trim();
  const isLongDescription = normalizedQuote.length > 140;

  const closeAvatarZoom = () => setShowAvatarZoom(false);

  const hasContactInfo =
    !!service.phone || !!service.email || !!service.website || hasAnySocial;

  return (
    <>
      <article className="relative h-full flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* HEADER */}
        <div className="p-4 pb-3 flex items-start gap-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => service.avatarUrl && setShowAvatarZoom(true)}
            className={[
              "group relative w-12 h-12 shrink-0",
              "rounded-2xl overflow-hidden",
              "bg-white border border-slate-200 shadow-sm p-0.5",
              service.avatarUrl
                ? "cursor-zoom-in hover:shadow-md transition"
                : "cursor-default",
            ].join(" ")}
            aria-label={isPT ? "Ver imagem do perfil" : "View profile image"}
            disabled={!service.avatarUrl}
          >
            <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {service.avatarUrl ? (
                <img
                  src={service.avatarUrl}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <span className="text-sm font-semibold text-slate-700">
                  {avatarLetter}
                </span>
              )}
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {service.name}
                  </h3>

                  {isNew && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {isPT ? "Novo" : "New"}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                <div className="flex flex-wrap gap-0.5 text-sm shrink-0">
                  {service.languages.slice(0, 3).map((lang) => (
                    <span key={lang} title={lang}>
                      {languageFlag(lang)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {renderStars(service.rating)}

                {service.workQuality != null && service.punctuality != null && (
                  <button
                    type="button"
                    onClick={() => onShowRatingDetails(service)}
                    className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
                  >
                    {isPT ? "Ver" : "See"}
                  </button>
                )}
              </div>

              {service.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[45%]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{service.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
          {service.quote && (
            <div className="space-y-1">
              <p
                className={[
                  "text-xs sm:text-sm text-slate-700 leading-relaxed",
                  "whitespace-pre-line",
                  !showFullDescription ? "line-clamp-3" : "",
                ].join(" ")}
              >
                {service.quote}
              </p>

              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((v) => !v)}
                  className="text-[11px] text-[#1F1F3D] underline underline-offset-2 hover:text-[#15152E]"
                >
                  {showFullDescription
                    ? isPT
                      ? "Mostrar menos"
                      : "Show less"
                    : isPT
                    ? "Mostrar mais"
                    : "Show more"}
                </button>
              )}
            </div>
          )}

          {service.openingHoursText && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] text-slate-600 px-3 py-1 w-fit">
              <Clock className="w-3 h-3" />
              <span>{localizeOpeningHoursText(service.openingHoursText)}</span>
            </div>
          )}

          <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setShowContact((v) => !v)}
              className={[
                "flex-1 rounded-full text-xs font-semibold py-2.5 transition shadow-sm",
                showContact
                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                  : "text-white",
              ].join(" ")}
              style={!showContact ? { backgroundColor: BRAND } : undefined}
              onMouseEnter={(e) => {
                if (!showContact)
                  e.currentTarget.style.backgroundColor = BRAND_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!showContact) e.currentTarget.style.backgroundColor = BRAND;
              }}
            >
              {showContact
                ? isPT
                  ? "Esconder"
                  : "Hide"
                : isPT
                ? "Contactar"
                : "Contact"}
            </button>

            <button
              type="button"
              onClick={() => onRate(service)}
              className="flex-1 rounded-full text-xs font-semibold py-2.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              {isPT ? "Avaliar" : "Rate"}
            </button>
          </div>
        </div>

        {/* PAINEL DE CONTACTOS — overlay absoluto */}
        {showContact && (
          <div
            className="absolute inset-0 z-20 bg-white flex flex-col rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label={isPT ? "Contactos" : "Contacts"}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="text-sm font-semibold text-slate-800">
                {isPT ? "Contactos" : "Contact"}
              </div>
              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-[12px] sm:text-xs space-y-2">
              {!hasContactInfo && (
                <p className="text-slate-500 italic">
                  {isPT
                    ? "Este serviço ainda não adicionou contactos."
                    : "This service hasn't added contact details yet."}
                </p>
              )}

              {service.phone && (
                <a
                  href={`tel:${service.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
                >
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">
                    {service.phone}
                  </span>
                </a>
              )}

              {service.email && (
                <a
                  href={`mailto:${service.email}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
                >
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">
                    {service.email}
                  </span>
                </a>
              )}

              {service.website && (
                <a
                  href={`https://${service.website.replace(
                    /^https?:\/\//,
                    ""
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
                >
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-[#1F1F3D] underline truncate">
                    {service.website}
                  </span>
                </a>
              )}

              {hasAnySocial && (
                <div className="pt-2 mt-1 border-t border-slate-100 flex flex-wrap gap-2">
                  {[
                    { url: instagramUrl, name: "Instagram" },
                    { url: facebookUrl, name: "Facebook" },
                    { url: tiktokUrl, name: "TikTok" },
                    { url: linkedinUrl, name: "LinkedIn" },
                  ]
                    .filter((s) => s.url)
                    .map((s) => (
                      <a
                        key={s.name}
                        href={s.url!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:border-[#1F1F3D] hover:text-[#1F1F3D] transition"
                      >
                        {s.name}
                      </a>
                    ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 shrink-0 flex gap-2">
              {service.phone && (
                <a
                  href={`tel:${service.phone.replace(/\s/g, "")}`}
                  className="flex-1 text-center rounded-full text-white text-xs font-semibold py-2.5 shadow-sm transition"
                  style={{ backgroundColor: BRAND }}
                >
                  {isPT ? "Ligar agora" : "Call now"}
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="flex-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 hover:bg-slate-200 transition"
              >
                {isPT ? "Voltar" : "Back"}
              </button>
            </div>
          </div>
        )}
      </article>

      {/* ZOOM MODAL */}
      {showAvatarZoom && service.avatarUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeAvatarZoom}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAvatarZoom}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-2xl"
              aria-label={isPT ? "Fechar" : "Close"}
            >
              ×
            </button>
            <div className="rounded-3xl overflow-hidden bg-white shadow-2xl">
              <img
                src={service.avatarUrl}
                alt={service.name}
                className="w-full h-auto object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ---------------------------------------------------------
   LOADING SKELETON
--------------------------------------------------------- */
const ServiceSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 animate-pulse">
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="pt-3 space-y-2">
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-4/6" />
    </div>
  </div>
);

/* ---------------------------------------------------------
   HOMEPAGE
--------------------------------------------------------- */
const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | "all"
  >("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);

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

  const allServices = useMemo(() => [...dbServices], [dbServices]);

  const filteredServices = useMemo(() => {
    let list = [...allServices];

    if (selectedCategory !== "all") {
      list = list.filter((s) => s.categoryId === selectedCategory);
    }

    if (selectedSubcategory !== "all") {
      list = list.filter((s) => s.subcategoryId === selectedSubcategory);
    }

    if (minRating > 0) {
      list = list.filter((s) => (s.rating ?? 0) >= minRating);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const cat = getCategoryLabel(s.categoryId, false);
        const catPt = getCategoryLabel(s.categoryId, true);
        const sub = s.subcategoryId
          ? getSubcategoryLabel(s.categoryId, s.subcategoryId, false)
          : "";
        const subPt = s.subcategoryId
          ? getSubcategoryLabel(s.categoryId, s.subcategoryId, true)
          : "";

        const hay = [s.name, s.quote, s.location, cat, catPt, sub, subPt]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortBy === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return list;
  }, [
    allServices,
    selectedCategory,
    selectedSubcategory,
    search,
    minRating,
    sortBy,
  ]);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_listings")
        .select("*")
        .eq("show_online", true);

      if (servicesError) {
        console.error(servicesError);
        setDbServices([]);
        setLoadingServices(false);
        return;
      }

      const serviceRows = (servicesData ?? []) as ServiceRow[];
      let mapped = serviceRows.map((row) => mapRowToService(row, isPT));

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("service_ratings")
        .select("*");

      if (ratingsError) {
        console.error(ratingsError);
        setDbServices(mapped);
        setLoadingServices(false);
        return;
      }

      const ratings = (ratingsData ?? []) as ServiceRatingRow[];
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
        const s = ratingStats[key];
        s.sumWork += r.work_quality;
        s.sumPunct += r.punctuality;
        s.count += 1;
        if (!s.lastCreatedAt || r.created_at > s.lastCreatedAt) {
          s.lastCreatedAt = r.created_at;
          s.lastComment = r.comment;
        }
      });

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

  const activeCategoryLabel =
    selectedCategory === "all"
      ? isPT
        ? "Todos"
        : "All"
      : getCategoryLabel(selectedCategory as CategoryId, isPT);

  const activeSubcategoryLabel =
    selectedCategory !== "all" && selectedSubcategory !== "all"
      ? getSubcategoryLabel(
          selectedCategory as CategoryId,
          selectedSubcategory,
          isPT
        )
      : null;

  const hasFilters =
    selectedCategory !== "all" ||
    selectedSubcategory !== "all" ||
    search.trim() ||
    minRating > 0 ||
    sortBy !== "recent";

  const clearAll = () => {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSearch("");
    setMinRating(0);
    setSortBy("recent");
  };

  return (
    <div className="min-h-screen bg-transparent pb-10">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-white to-slate-50/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-10 sm:pt-14 pb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold text-emerald-800 backdrop-blur">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isPT
                ? "Verificado por residentes de Cascais"
                : "Verified by Cascais residents"}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {isPT
                ? "Encontra quem te pode ajudar."
                : "Find someone who can help."}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {isPT
                ? "Profissionais recomendados por vizinhos. Contacta diretamente, sem intermediários."
                : "Professionals recommended by neighbours. Contact directly, no middlemen."}
            </p>

            <div className="mt-6 max-w-2xl mx-auto">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-5 h-5" />
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isPT
                      ? "Ex: fisioterapia, limpezas, surf, cabeleireiro…"
                      : "E.g. physio, cleaning, surf, hairdresser…"
                  }
                  aria-label={isPT ? "Pesquisar serviços" : "Search services"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 pr-12 py-4 text-sm sm:text-base shadow-sm outline-none focus:ring-4 focus:border-[#1F1F3D]/40 transition"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                />

                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    aria-label={isPT ? "Limpar" : "Clear"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORY STRIP
          Mobile: grelha 3×2 + "Ver todas" (Weinschenk + Krug)
          Desktop: fila horizontal com todas
      ========================================================== */}
      <section className="relative -mt-2 pb-4" aria-label="Categories">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {isPT ? "Categorias" : "Categories"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {isPT
                      ? "Filtre por tipo de serviço."
                      : "Filter by service type."}
                  </div>
                </div>
              </div>

              {/* ---------- MOBILE: grelha 3×2 + Ver todas ---------- */}
              <div className="sm:hidden">
                <div className="grid grid-cols-3 gap-2">
                  {PRIMARY_CATEGORY_IDS.map((id) => {
                    const cat = CATEGORIES.find((c) => c.id === id);
                    if (!cat) return null;
                    const active = selectedCategory === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(id);
                          setSelectedSubcategory("all");
                        }}
                        className={[
                          "flex flex-col items-center gap-1 p-3 rounded-2xl border transition",
                          active
                            ? "border-[#1F1F3D] bg-slate-50 text-[#1F1F3D] shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className="text-2xl" aria-hidden="true">
                          {cat.icon}
                        </span>
                        <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2">
                          {getCategoryLabel(id, isPT)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCategorySheet(true)}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 transition inline-flex items-center justify-center gap-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {isPT
                    ? `Ver todas as ${CATEGORIES.length - 1} categorias`
                    : `See all ${CATEGORIES.length - 1} categories`}
                </button>
              </div>

              {/* ---------- DESKTOP: fila horizontal ---------- */}
              <div className="hidden sm:block relative">
                <div className="flex flex-wrap gap-2 py-1">
                  {displayCategories.map((category: Category) => {
                    const active = category.id === selectedCategory;
                    const isAll = category.id === "all";
                    const label = isAll
                      ? isPT
                        ? "Todos"
                        : "All"
                      : getCategoryLabel(category.id as CategoryId, isPT);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(
                            isAll ? "all" : (category.id as CategoryId)
                          );
                          setSelectedSubcategory("all");
                        }}
                        className={[
                          "shrink-0 rounded-2xl border transition flex items-center gap-2 text-xs font-semibold",
                          isAll ? "px-3.5 py-2" : "px-3 py-2",
                          active
                            ? "border-[#1F1F3D] bg-slate-50 text-[#1F1F3D] shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                        ].join(" ")}
                      >
                        {!isAll && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-base">
                            {category.icon}
                          </span>
                        )}
                        <span className="max-w-[140px] truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedCategory !== "all" && currentSubcategories.length > 0 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-xs font-semibold text-slate-700">
                    {isPT ? "Subcategorias" : "Subcategories"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("all")}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 underline underline-offset-2"
                  >
                    {isPT ? "Limpar" : "Clear"}
                  </button>
                </div>

                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 pr-10">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory("all")}
                      className={[
                        "shrink-0 rounded-2xl border px-3.5 py-2 transition flex items-center gap-2 text-xs font-semibold",
                        selectedSubcategory === "all"
                          ? "border-[#1F1F3D] bg-slate-50 text-[#1F1F3D]"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                      ].join(" ")}
                    >
                      <span>{isPT ? "Todos" : "All"}</span>
                    </button>

                    {currentSubcategories.map((sub: Subcategory) => {
                      const active = selectedSubcategory === sub.id;
                      const label = getSubcategoryLabel(
                        selectedCategory as CategoryId,
                        sub.id,
                        isPT
                      );
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubcategory(sub.id)}
                          className={[
                            "shrink-0 rounded-2xl border px-3 py-2 transition flex items-center gap-2 text-xs font-semibold",
                            active
                              ? "border-[#1F1F3D] bg-slate-50 text-[#1F1F3D]"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                          ].join(" ")}
                        >
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-base">
                            {sub.icon}
                          </span>
                          <span className="max-w-[160px] truncate">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
    RESULTS BAR + PROVIDER CTA
========================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-4 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Lado esquerdo: contagem */}
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {filteredServices.length}
            </span>{" "}
            {isPT ? "resultado(s)" : "result(s)"}
            <span className="text-slate-400"> • </span>
            <span>
              {activeCategoryLabel}
              {activeSubcategoryLabel ? ` / ${activeSubcategoryLabel}` : ""}
            </span>
          </div>

          {/* Lado direito: filtros + CTA */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de avaliação */}
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                {isPT ? "Filtrar:" : "Filter:"}
              </span>
              <div className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-1 shadow-sm">
                {[0, 3, 4, 4.5].map((r) => {
                  const active = minRating === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinRating(r)}
                      className={[
                        "px-2.5 py-1 rounded-full text-xs font-semibold transition",
                        active
                          ? "bg-amber-100 text-amber-800"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      {r === 0 ? (isPT ? "Todas" : "All") : `⭐ ${r}+`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={isPT ? "Ordenar" : "Sort"}
                className="appearance-none rounded-full bg-white border border-slate-200 pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 transition"
              >
                <option value="recent">
                  {isPT ? "Mais recentes" : "Most recent"}
                </option>
                <option value="rating">
                  {isPT ? "Melhor avaliados" : "Top rated"}
                </option>
                <option value="name">{isPT ? "Nome A-Z" : "Name A-Z"}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 px-1"
              >
                {isPT ? "Limpar" : "Clear"}
              </button>
            )}

            {/* CTA PRESTADOR */}
            <button
              type="button"
              onClick={() => navigate("/service-listing")}
              className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-sm transition"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND_HOVER)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND)
              }
            >
              <Plus className="w-4 h-4" />
              {isPT ? "Oferecer serviço" : "Offer service"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICES LIST
      ========================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-2">
        {loadingServices && dbServices.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceSkeleton key={i} />
            ))}
          </div>
        )}

        {!loadingServices && filteredServices.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {isPT ? "Sem resultados" : "No results"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {isPT
                ? "Experimente mudar a categoria, o filtro de avaliação ou a pesquisa."
                : "Try changing category, rating filter, or search."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center justify-center rounded-full text-white text-sm font-semibold px-5 py-2.5 shadow-sm transition"
                style={{ backgroundColor: BRAND }}
              >
                {isPT ? "Limpar filtros" : "Clear filters"}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
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

      {/* CATEGORY SHEET (mobile) */}
      <CategorySheet
        open={showCategorySheet}
        isPT={isPT}
        selectedCategory={selectedCategory}
        onSelect={(id) => {
          setSelectedCategory(id);
          setSelectedSubcategory("all");
        }}
        onClose={() => setShowCategorySheet(false)}
      />
    </div>
  );
};

export default HomePage;
