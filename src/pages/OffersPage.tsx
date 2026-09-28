// src/pages/OffersPage.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  AlertCircle,
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
const BRAND = "#1F6FA6";
const OFFER_ACCENT = "#F59E0B";
const OFFER_ACCENT_HOVER = "#D97706";

/* Categorias prioritárias para a grelha mobile */
const PRIMARY_CATEGORY_IDS: CategoryId[] = [
  "food",
  "wellness-beauty",
  "sports-outdoors",
  "home-services",
  "events-entertainment",
  "professional",
];

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type CategoryFilterId = CategoryId | "all";
type OfferHighlight = "new" | "last-minute" | "popular";
type SortOption = "recent" | "discount" | "ending-soon";

type Offer = {
  id: string | number;
  userId?: string | null;
  title: string;
  shortLabel: string;
  description: string;
  categoryId: CategoryId;
  subcategoryId?: string;
  serviceName: string;
  location: string;
  languages: string[];
  originalPrice?: number | null;
  discountedPrice?: number | null;
  validUntil?: string | null;
  highlight?: OfferHighlight;
  imageUrl?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  createdAt?: string | null;
};

type OfferRow = {
  id: string;
  user_id: string | null;
  title: string;
  short_label: string | null;
  description: string | null;
  category_id: CategoryId | null;
  subcategory_id: string | null;
  service_name: string | null;
  location: string | null;
  languages: string[] | string | null;
  original_price: number | null;
  discounted_price: number | null;
  valid_until: string | null;
  highlight: string | null;
  image_url: string | null;
  phone: string | null;
  contact_email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkedin: string | null;
  created_at: string;
};

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
const formatPrice = (value?: number | null, isPT: boolean = false): string => {
  if (value == null) return "-";
  const locale = isPT ? "pt-PT" : "en-US";
  return `€${value.toLocaleString(locale, { minimumFractionDigits: 0 })}`;
};

const formatValidUntil = (value: string | null | undefined, isPT: boolean) => {
  if (!value) return "";
  const d = new Date(value);
  const formatted = d.toLocaleDateString(isPT ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return isPT ? `Válido até ${formatted}` : `Valid until ${formatted}`;
};

const daysUntil = (value?: string | null): number | null => {
  if (!value) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatEndingSoon = (days: number, isPT: boolean): string => {
  if (days === 0) return isPT ? "Termina hoje" : "Ends today";
  if (days === 1) return isPT ? "Termina amanhã" : "Ends tomorrow";
  return isPT ? `Termina em ${days} dias` : `Ends in ${days} days`;
};

const highlightLabel = (highlight?: OfferHighlight, isPT?: boolean): string => {
  if (!highlight) return "";
  const map = {
    new: isPT ? "Novo" : "New",
    "last-minute": isPT ? "Última hora" : "Last minute",
    popular: isPT ? "Popular" : "Popular",
  };
  return map[highlight];
};

const highlightPillClass = (highlight?: OfferHighlight) => {
  if (!highlight) return "bg-white/85 text-slate-700 border-white/60";
  if (highlight === "new")
    return "bg-emerald-50/95 text-emerald-700 border-emerald-100";
  if (highlight === "last-minute")
    return "bg-amber-50/95 text-amber-800 border-amber-100";
  return "bg-sky-50/95 text-sky-800 border-sky-100";
};

const languageFlag = (code: string) => {
  const map: Record<string, string> = {
    EN: "🇬🇧",
    PT: "🇵🇹",
    ES: "🇪🇸",
    FR: "🇫🇷",
    DE: "🇩🇪",
    IT: "🇮🇹",
    RU: "🇷🇺",
  };
  return map[code.toUpperCase()] ?? "🏳️";
};

const mapRowToOffer = (row: OfferRow): Offer => {
  let languages: string[] = [];
  if (Array.isArray(row.languages)) languages = row.languages;
  else if (typeof row.languages === "string" && row.languages.trim() !== "")
    languages = row.languages.split(",").map((s) => s.trim());

  let highlight: OfferHighlight | undefined;
  if (
    row.highlight === "new" ||
    row.highlight === "last-minute" ||
    row.highlight === "popular"
  ) {
    highlight = row.highlight;
  }

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? "",
    shortLabel: row.short_label ?? "",
    description: row.description ?? "",
    categoryId: (row.category_id as CategoryId) ?? "real-estate",
    subcategoryId: row.subcategory_id ?? undefined,
    serviceName: row.service_name ?? "",
    location: row.location ?? "",
    languages,
    originalPrice: row.original_price,
    discountedPrice: row.discounted_price,
    validUntil: row.valid_until,
    highlight,
    imageUrl: row.image_url,
    phone: row.phone,
    contactEmail: row.contact_email,
    website: row.website,
    instagram: row.instagram,
    facebook: row.facebook,
    tiktok: row.tiktok,
    linkedin: row.linkedin,
    createdAt: row.created_at ?? null,
  };
};

const socialUrl = (
  platform: "instagram" | "facebook" | "tiktok" | "linkedin",
  value?: string | null
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

const safeNumber = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n) ? n : null;

const calcDiscountPercent = (o: Offer) => {
  const op = safeNumber(o.originalPrice);
  const dp = safeNumber(o.discountedPrice);
  if (op == null || dp == null || dp >= op) return null;
  return Math.round(((op - dp) / op) * 100);
};

const normalizePhoneForTel = (raw: string) => raw.replace(/[^\d+]/g, "");

const isRecentlyAdded = (createdAt?: string | null): boolean => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 48 * 60 * 60 * 1000;
};

/* ---------------------------------------------------------
   CONFIRM DELETE MODAL
--------------------------------------------------------- */
const ConfirmDeleteModal: React.FC<{
  open: boolean;
  offerTitle: string;
  isPT: boolean;
  busy: boolean;
  errorMsg: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, offerTitle, isPT, busy, errorMsg, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-lg">
              ⚠️
            </div>
            <div className="min-w-0">
              <h3
                id="confirm-delete-title"
                className="text-base font-semibold text-slate-900"
              >
                {isPT ? "Remover oferta?" : "Remove offer?"}
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {isPT
                  ? `"${offerTitle}" será removida permanentemente. Esta ação não pode ser desfeita.`
                  : `"${offerTitle}" will be permanently removed. This action cannot be undone.`}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full bg-slate-100 text-slate-700 text-sm font-semibold px-5 py-2.5 hover:bg-slate-200 disabled:opacity-60 transition"
            >
              {isPT ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 shadow-sm disabled:opacity-60 transition"
            >
              {busy
                ? isPT
                  ? "A remover..."
                  : "Removing..."
                : isPT
                ? "Remover"
                : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   OFFER CARD
--------------------------------------------------------- */
type OfferCardProps = {
  offer: Offer;
  isPT: boolean;
  canDelete: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
};

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  isPT,
  canDelete,
  onDelete,
  onEdit,
}) => {
  const [showContact, setShowContact] = useState(false);

  const contactPanelRef = useRef<HTMLDivElement | null>(null);

  const discountPercent = calcDiscountPercent(offer);
  const discountAmount =
    discountPercent != null &&
    offer.originalPrice != null &&
    offer.discountedPrice != null
      ? offer.originalPrice - offer.discountedPrice
      : null;

  const instagramUrl = socialUrl("instagram", offer.instagram);
  const facebookUrl = socialUrl("facebook", offer.facebook);
  const tiktokUrl = socialUrl("tiktok", offer.tiktok);
  const linkedinUrl = socialUrl("linkedin", offer.linkedin);
  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl || linkedinUrl;

  const hasContactInfo =
    !!offer.phone || !!offer.contactEmail || !!offer.website || hasAnySocial;

  const initials =
    offer.serviceName?.charAt(0).toUpperCase() ||
    offer.title?.charAt(0).toUpperCase() ||
    "?";

  const primaryPrice = formatPrice(
    offer.discountedPrice ?? offer.originalPrice ?? null,
    isPT
  );
  const oldPrice =
    discountPercent != null ? formatPrice(offer.originalPrice, isPT) : null;

  const phoneTel =
    offer.phone && offer.phone.trim()
      ? normalizePhoneForTel(offer.phone)
      : null;

  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => check());
      ro.observe(el);
    }
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
      ro?.disconnect();
    };
  }, [offer.description, showFullDescription]);

  useEffect(() => {
    if (showContact && contactPanelRef.current) {
      const focusable = contactPanelRef.current.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      focusable?.focus();
    }
  }, [showContact]);

  useEffect(() => {
    if (!showContact) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowContact(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showContact]);

  const days = daysUntil(offer.validUntil);
  const isEndingSoon = days != null && days <= 3 && days >= 0;
  const recentlyAdded = isRecentlyAdded(offer.createdAt);

  return (
    <article className="relative flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 hover:shadow-md transition-[box-shadow,border-color] duration-200">
      {/* IMAGE */}
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
          {offer.imageUrl ? (
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
                {initials}
              </div>
              <span className="text-center px-4">
                {isPT
                  ? "Adicione uma imagem da oferta"
                  : "Add a photo of your offer"}
              </span>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[70%]">
          {offer.highlight && (
            <span
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm",
                highlightPillClass(offer.highlight),
              ].join(" ")}
            >
              ⭐ {highlightLabel(offer.highlight, isPT)}
            </span>
          )}

          {discountPercent != null && (
            <span className="inline-flex items-center rounded-full bg-emerald-600 text-white text-[11px] font-semibold px-3 py-1 shadow-sm">
              -{discountPercent}%
            </span>
          )}

          {isEndingSoon && days != null && (
            <span className="inline-flex items-center rounded-full bg-amber-700 text-white text-[11px] font-semibold px-3 py-1 shadow-sm">
              {formatEndingSoon(days, isPT)}
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
            {offer.title}
          </h3>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {primaryPrice}
            </span>
            {oldPrice && (
              <span className="text-sm line-through text-slate-400">
                {oldPrice}
              </span>
            )}
            {discountPercent != null && discountAmount != null && (
              <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                {isPT ? "Poupa" : "Save"} {formatPrice(discountAmount, isPT)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {offer.serviceName && (
              <span className="text-[13px] font-semibold text-slate-900">
                {offer.serviceName}
              </span>
            )}
            {offer.location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{offer.location}</span>
              </span>
            )}
            {offer.languages.length > 0 && (
              <span className="flex items-center gap-0.5 ml-auto text-sm">
                {offer.languages.slice(0, 3).map((lang) => (
                  <span key={lang} title={lang}>
                    {languageFlag(lang)}
                  </span>
                ))}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
              {getCategoryLabel(offer.categoryId, isPT)}
            </span>

            {offer.subcategoryId && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                {getSubcategoryLabel(
                  offer.categoryId,
                  offer.subcategoryId,
                  isPT
                )}
              </span>
            )}

            {recentlyAdded && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                {isPT ? "Adicionada recentemente" : "Added recently"}
              </span>
            )}

            {offer.validUntil && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200 ml-auto">
                ⏰ {formatValidUntil(offer.validUntil, isPT)}
              </span>
            )}
          </div>
        </div>

        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 transition shadow-sm"
            style={{ backgroundColor: OFFER_ACCENT }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = OFFER_ACCENT_HOVER)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = OFFER_ACCENT)
            }
          >
            {isPT ? "Ver contacto" : "Contact"}
          </button>

          {phoneTel && (
            <a
              href={`tel:${phoneTel}`}
              className="rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold px-4 py-2.5 border border-slate-200 transition"
              aria-label={isPT ? "Ligar" : "Call"}
            >
              📞
            </a>
          )}
        </div>

        {offer.shortLabel && (
          <div className="inline-flex items-center gap-1.5 self-start text-[12px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
            ✨ {offer.shortLabel}
          </div>
        )}

        {offer.description && (
          <div className="space-y-2">
            <p
              ref={descRef}
              className={[
                "text-sm text-slate-600 leading-relaxed",
                !showFullDescription ? "line-clamp-3" : "",
              ].join(" ")}
            >
              {offer.description}
            </p>

            {isTruncated && (
              <button
                type="button"
                onClick={() => setShowFullDescription((v) => !v)}
                className="text-[12px] font-semibold text-[#1F6FA6] hover:text-[#195c8a] underline underline-offset-2"
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

        {canDelete && (
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isPT ? "Gerir oferta" : "Manage offer"}
            </span>
            <div className="flex items-center gap-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-[12px] text-slate-600 hover:text-slate-900 font-semibold"
                >
                  {isPT ? "Editar" : "Edit"}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-[12px] text-red-600 hover:text-red-700 font-semibold"
                >
                  {isPT ? "Remover" : "Remove"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BACKDROP */}
      {showContact && (
        <button
          type="button"
          onClick={() => setShowContact(false)}
          className="absolute inset-0 z-20 cursor-default"
          aria-label={isPT ? "Fechar contactos" : "Close contacts"}
          style={{ background: "rgba(2, 6, 23, 0.15)" }}
        />
      )}

      {/* CONTACT PANEL */}
      {showContact && (
        <div
          ref={contactPanelRef}
          className="absolute inset-x-0 bottom-0 top-[calc(75%-2rem)] z-30 bg-white flex flex-col rounded-b-3xl pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label={isPT ? "Contactos" : "Contacts"}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800">
                {isPT ? "Contactos" : "Contacts"}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {offer.serviceName || offer.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowContact(false)}
              className="rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
              aria-label={isPT ? "Fechar" : "Close"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 text-[12px] space-y-2">
            {!hasContactInfo && (
              <p className="text-slate-500 italic">
                {isPT
                  ? "Este prestador ainda não adicionou contactos."
                  : "This provider hasn't added contact details yet."}
              </p>
            )}

            {offer.phone && (
              <a
                href={`tel:${normalizePhoneForTel(offer.phone)}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
              >
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {offer.phone}
                </span>
              </a>
            )}

            {offer.contactEmail && (
              <a
                href={`mailto:${offer.contactEmail}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
              >
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {offer.contactEmail}
                </span>
              </a>
            )}

            {offer.website && (
              <a
                href={`https://${offer.website.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition"
              >
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-[#1F6FA6] underline truncate">
                  {offer.website}
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
                      className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:border-[#1F6FA6] hover:text-[#1F6FA6] transition"
                    >
                      {s.name}
                    </a>
                  ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 shrink-0 flex gap-2">
            {phoneTel && (
              <a
                href={`tel:${phoneTel}`}
                className="flex-1 text-center rounded-full text-white text-xs font-semibold py-2.5 shadow-sm transition"
                style={{ backgroundColor: OFFER_ACCENT }}
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
  );
};

/* ---------------------------------------------------------
   SKELETON
--------------------------------------------------------- */
const OfferSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="w-full aspect-[4/3] bg-slate-200" />
    <div className="p-4 sm:p-5 space-y-3">
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-7 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      <div className="h-10 bg-slate-100 rounded-full mt-2" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
    </div>
  </div>
);

/* ---------------------------------------------------------
   OFFERS PAGE
--------------------------------------------------------- */
const OffersPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | "all"
  >("all");
  const [selectedHighlight, setSelectedHighlight] = useState<
    OfferHighlight | "all"
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const currentSubcategories: Subcategory[] = (
    selectedCategory !== "all"
      ? SUBCATEGORIES[selectedCategory as CategoryId] ?? []
      : []
  ) as Subcategory[];

  const displayCategories: Category[] =
    selectedCategory === "all"
      ? CATEGORIES
      : CATEGORIES.filter(
          (c: Category) =>
            c.id === "all" || c.id === (selectedCategory as CategoryId)
        );

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoadingOffers(true);
      const { data, error } = await supabase
        .from("service_offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setDbOffers([]);
        setLoadingOffers(false);
        return;
      }

      const rows = (data ?? []) as OfferRow[];
      setDbOffers(rows.map((row) => mapRowToOffer(row)));
      setLoadingOffers(false);
    };
    fetchOffers();
  }, []);

  const filteredOffers = useMemo(() => {
    let list = [...dbOffers];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    list = list.filter((o) => {
      if (!o.validUntil) return true;
      const d = new Date(o.validUntil);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    });

    if (selectedCategory !== "all") {
      list = list.filter((o) => o.categoryId === selectedCategory);
    }

    if (selectedSubcategory !== "all") {
      list = list.filter((o) => o.subcategoryId === selectedSubcategory);
    }

    if (selectedHighlight !== "all") {
      list = list.filter((o) => o.highlight === selectedHighlight);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const hay = [
          o.title,
          o.shortLabel,
          o.description,
          o.serviceName,
          o.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortBy === "discount") {
      list.sort(
        (a, b) => (calcDiscountPercent(b) ?? 0) - (calcDiscountPercent(a) ?? 0)
      );
    } else if (sortBy === "ending-soon") {
      list.sort((a, b) => {
        const da = daysUntil(a.validUntil);
        const db = daysUntil(b.validUntil);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
    } else {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    }

    return list;
  }, [
    dbOffers,
    selectedCategory,
    selectedSubcategory,
    selectedHighlight,
    search,
    sortBy,
  ]);

  const openDeleteModal = (offer: Offer) => {
    setOfferToDelete(offer);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (deleteBusy) return;
    setOfferToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!user || !offerToDelete) return;
    const offerId = offerToDelete.id;
    if (typeof offerId !== "string") return;

    setDeleteBusy(true);
    setDeleteError(null);

    const { error } = await supabase
      .from("service_offers")
      .delete()
      .eq("id", offerId)
      .eq("user_id", user.id);

    setDeleteBusy(false);

    if (error) {
      console.error(error);
      setDeleteError(
        isPT
          ? "Erro ao remover a oferta. Tenta novamente."
          : "Something went wrong while removing the offer."
      );
      return;
    }

    setDbOffers((prev) => prev.filter((o) => o.id !== offerId));
    setOfferToDelete(null);
  };

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
    selectedHighlight !== "all" ||
    search.trim() ||
    sortBy !== "recent";

  const clearAll = () => {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedHighlight("all");
    setSearch("");
    setSortBy("recent");
  };

  return (
    <div className="min-h-screen bg-transparent pb-10">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-white to-sky-50/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-10 sm:pt-14 pb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/80 px-3 py-1 text-[11px] font-semibold text-[#1F6FA6] backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" />
              {isPT
                ? "Ofertas de moradores locais"
                : "Deals from local residents"}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {isPT
                ? "Poupa nos melhores serviços."
                : "Save on the best services."}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {isPT
                ? "Descontos, pacotes e campanhas sazonais de prestadores locais em Cascais."
                : "Discounts, packages and seasonal campaigns from local Cascais providers."}
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
                      ? "Ex: spa, surf, jantar, desconto…"
                      : "E.g. spa, surf, dinner, discount…"
                  }
                  aria-label={isPT ? "Pesquisar ofertas" : "Search offers"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 pr-12 py-4 text-sm sm:text-base shadow-sm outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
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
      ========================================================== */}
      <section className="relative -mt-2 pb-4" aria-label="Offer categories">
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
                      ? "Filtre por tipo de oferta."
                      : "Filter by offer type."}
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
                            ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6] shadow-sm"
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
                            ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6] shadow-sm"
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

                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 pr-10">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("all")}
                    className={[
                      "shrink-0 rounded-2xl border px-3.5 py-2 transition flex items-center gap-2 text-xs font-semibold",
                      selectedSubcategory === "all"
                        ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6]"
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
                            ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                        ].join(" ")}
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-base">
                          {sub.icon}
                        </span>
                        <span className="max-w-[160px] truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          RESULTS BAR
      ========================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {filteredOffers.length}
            </span>{" "}
            {isPT ? "resultado(s)" : "result(s)"}
            <span className="text-slate-400"> • </span>
            <span>
              {activeCategoryLabel}
              {activeSubcategoryLabel ? ` / ${activeSubcategoryLabel}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                {isPT ? "Filtrar:" : "Filter:"}
              </span>
              <div className="inline-flex items-center rounded-full bg-white border border-slate-200 px-1 py-1 shadow-sm">
                {(
                  [
                    { id: "all", label: isPT ? "Todas" : "All" },
                    { id: "new", label: isPT ? "Novas" : "New" },
                    {
                      id: "last-minute",
                      label: isPT ? "Últ. hora" : "Last min",
                    },
                    { id: "popular", label: isPT ? "Popular" : "Popular" },
                  ] as const
                ).map((h) => {
                  const active = selectedHighlight === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() =>
                        setSelectedHighlight(h.id as OfferHighlight | "all")
                      }
                      className={[
                        "px-2.5 py-1 rounded-full text-xs font-semibold transition",
                        active
                          ? "bg-sky-100 text-[#1F6FA6]"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={isPT ? "Ordenar" : "Sort"}
                className="appearance-none rounded-full bg-white border border-slate-200 pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 transition"
              >
                <option value="recent">
                  {isPT ? "Mais recentes" : "Most recent"}
                </option>
                <option value="discount">
                  {isPT ? "Maior desconto" : "Biggest discount"}
                </option>
                <option value="ending-soon">
                  {isPT ? "Termina em breve" : "Ending soon"}
                </option>
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
          </div>
        </div>
      </section>

      {/* =========================================================
          OFFERS GRID
      ========================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-10">
        {loadingOffers && dbOffers.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferSkeleton key={i} />
            ))}
          </div>
        )}

        {!loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              {isPT ? "Sem ofertas" : "No offers"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {isPT
                ? "Experimente mudar a categoria, o filtro de destaque ou a pesquisa."
                : "Try changing category, highlight filter, or search."}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {filteredOffers.map((offer) => {
            const isOwner = !!user && offer.userId === user.id;
            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                isPT={isPT}
                canDelete={isOwner}
                onDelete={isOwner ? () => openDeleteModal(offer) : undefined}
                onEdit={
                  isOwner
                    ? () => navigate(`/offers/edit/${offer.id}`)
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>

      {/* =========================================================
          CONFIRM DELETE MODAL
      ========================================================== */}
      <ConfirmDeleteModal
        open={!!offerToDelete}
        offerTitle={offerToDelete?.title ?? ""}
        isPT={isPT}
        busy={deleteBusy}
        errorMsg={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />

      {/* CATEGORY SHEET (mobile) */}
      <CategorySheet
        open={showCategorySheet}
        isPT={isPT}
        selectedCategory={selectedCategory as CategoryId}
        onSelect={(id) => {
          setSelectedCategory(id);
          setSelectedSubcategory("all");
        }}
        onClose={() => setShowCategorySheet(false)}
      />
    </div>
  );
};

export default OffersPage;
