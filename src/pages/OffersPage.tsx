// src/pages/OffersPage.tsx
import React, { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";

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
const BRAND_HOVER = "#195c8a";

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
const formatPrice = (value?: number | null): string => {
  if (value == null) return "-";
  return `€${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
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
    return "bg-rose-50/95 text-rose-700 border-rose-100";
  return "bg-amber-50/95 text-amber-700 border-amber-100";
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

/* ---------------------------------------------------------
   OFFER CARD — cleaner hierarchy, hover lift
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
  const [showFullDescription, setShowFullDescription] = useState(false);

  const discountPercent = calcDiscountPercent(offer);
  const hasDiscount = discountPercent != null;

  const discountAmount =
    hasDiscount && offer.originalPrice != null && offer.discountedPrice != null
      ? offer.originalPrice - offer.discountedPrice
      : null;

  const instagramUrl = socialUrl("instagram", offer.instagram);
  const facebookUrl = socialUrl("facebook", offer.facebook);
  const tiktokUrl = socialUrl("tiktok", offer.tiktok);
  const linkedinUrl = socialUrl("linkedin", offer.linkedin);
  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl || linkedinUrl;

  const initials =
    offer.serviceName?.charAt(0).toUpperCase() ||
    offer.title?.charAt(0).toUpperCase() ||
    "?";

  const primaryPrice = formatPrice(
    offer.discountedPrice ?? offer.originalPrice ?? null
  );
  const oldPrice = hasDiscount ? formatPrice(offer.originalPrice) : null;

  const phoneTel =
    offer.phone && offer.phone.trim()
      ? normalizePhoneForTel(offer.phone)
      : null;

  const descRef = React.useRef<HTMLParagraphElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

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
  }, [offer.description]);

  const days = daysUntil(offer.validUntil);
  const isEndingSoon = days != null && days <= 3 && days >= 0;

  const closeAllOverlays = () => {
    setShowContact(false);
    setShowFullDescription(false);
  };

  return (
    <article className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* IMAGE */}
      <div className="relative">
        <div className="w-full aspect-[16/10] bg-slate-100 overflow-hidden">
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Top pills */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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

          {hasDiscount && discountPercent != null && (
            <span className="inline-flex items-center rounded-full bg-emerald-600 text-white text-[11px] font-semibold px-3 py-1 shadow-sm">
              -{discountPercent}%
            </span>
          )}

          {isEndingSoon && (
            <span className="inline-flex items-center rounded-full bg-rose-500 text-white text-[11px] font-semibold px-3 py-1 shadow-sm">
              {days === 0
                ? isPT
                  ? "Termina hoje"
                  : "Ends today"
                : isPT
                ? `Termina em ${days}d`
                : `Ends in ${days}d`}
            </span>
          )}
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-white text-xl sm:text-2xl font-extrabold drop-shadow">
                {primaryPrice}
              </span>
              {oldPrice && (
                <span className="text-white/80 text-sm line-through drop-shadow">
                  {oldPrice}
                </span>
              )}
            </div>
            {hasDiscount && discountAmount != null && (
              <div className="mt-1 text-[12px] text-white/90 drop-shadow">
                {isPT ? "Poupa" : "Save"} €{discountAmount}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="shrink-0 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-md hover:bg-slate-50 transition"
          >
            {isPT ? "Ver contacto" : "Get this deal"}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
            {getCategoryLabel(offer.categoryId, isPT)}
          </span>

          {offer.subcategoryId && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
              {getSubcategoryLabel(offer.categoryId, offer.subcategoryId, isPT)}
            </span>
          )}

          {offer.validUntil && (
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 border border-sky-100 ml-auto">
              ⏰ {formatValidUntil(offer.validUntil, isPT)}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
            {offer.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            {offer.serviceName && (
              <span className="font-semibold text-slate-800">
                {offer.serviceName}
              </span>
            )}
            {offer.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
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
        </div>

        {offer.shortLabel && (
          <div className="rounded-2xl border border-slate-100 bg-sky-50/50 px-3 py-2 text-[12px] text-slate-700">
            <span className="font-semibold text-slate-900">
              {isPT ? "Destaque:" : "Deal:"}
            </span>{" "}
            {offer.shortLabel}
          </div>
        )}

        {offer.description && (
          <div className="space-y-2">
            <p
              ref={descRef}
              className="text-sm text-slate-700 leading-relaxed line-clamp-3"
            >
              {offer.description}
            </p>

            {isTruncated && (
              <button
                type="button"
                onClick={() => setShowFullDescription(true)}
                className="text-[12px] font-semibold text-[#1F6FA6] hover:text-[#195c8a] underline underline-offset-2"
              >
                {isPT ? "Mostrar mais" : "Show more"}
              </button>
            )}
          </div>
        )}

        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 transition shadow-sm"
            style={{ backgroundColor: "#F59E0B" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#D97706")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#F59E0B")
            }
          >
            {isPT ? "Ver contacto / Comprar" : "Contact / Buy"}
          </button>

          {phoneTel ? (
            <a
              href={`tel:${phoneTel}`}
              className="rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold px-4 py-2.5 border border-slate-200 transition"
              aria-label={isPT ? "Ligar" : "Call"}
            >
              📞
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold px-4 py-2.5 border border-slate-200 transition"
              aria-label={isPT ? "Abrir contactos" : "Open contacts"}
            >
              📞
            </button>
          )}
        </div>

        {canDelete && (
          <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
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

      {/* OVERLAYS */}
      <div
        className={[
          "absolute inset-0 z-30 transition",
          showContact || showFullDescription
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!(showContact || showFullDescription)}
      >
        <button
          type="button"
          onClick={closeAllOverlays}
          className={[
            "absolute inset-0 w-full h-full transition-opacity",
            showContact || showFullDescription
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
          style={{ background: "rgba(2, 6, 23, 0.5)" }}
          aria-label={isPT ? "Fechar" : "Close"}
        />

        {/* CONTACT PANEL */}
        <div
          className={[
            "absolute left-3 right-3 bottom-3 sm:left-5 sm:right-5 sm:bottom-5",
            "rounded-3xl bg-white border border-slate-200 shadow-xl",
            "transition-all duration-200",
            showContact
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Contactos" : "Contacts"}
                </div>
                <div className="mt-1 text-[12px] text-slate-500 break-words">
                  {offer.serviceName || offer.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {offer.phone && (
                <a
                  href={`tel:${normalizePhoneForTel(offer.phone)}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:bg-slate-100 transition overflow-hidden"
                >
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800 break-words">
                    {offer.phone}
                  </span>
                </a>
              )}

              {offer.contactEmail && (
                <a
                  href={`mailto:${offer.contactEmail}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:bg-slate-100 transition overflow-hidden"
                >
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800 break-all">
                    {offer.contactEmail}
                  </span>
                </a>
              )}

              {offer.website && (
                <a
                  href={`https://${offer.website.replace(/^https?:\/\//, "")}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:bg-slate-100 transition sm:col-span-2 overflow-hidden"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-800 break-all">
                    {offer.website}
                  </span>
                </a>
              )}
            </div>

            {hasAnySocial && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-slate-500 mr-1">
                  {isPT ? "Redes:" : "Socials:"}
                </span>
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
                      className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#1F6FA6] hover:text-[#1F6FA6] transition"
                    >
                      {s.name}
                    </a>
                  ))}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="flex-1 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold py-2.5 border border-slate-200 transition"
              >
                {isPT ? "Voltar" : "Back"}
              </button>
              {phoneTel ? (
                <a
                  href={`tel:${phoneTel}`}
                  className="flex-1 text-center rounded-full text-white text-sm font-semibold py-2.5 transition"
                  style={{ backgroundColor: "#F59E0B" }}
                >
                  {isPT ? "Ligar agora" : "Call now"}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowContact(false)}
                  className="flex-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 transition"
                >
                  {isPT ? "Continuar" : "Continue"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FULL DESCRIPTION PANEL */}
        <div
          className={[
            "absolute left-3 right-3 bottom-3 sm:left-5 sm:right-5 sm:bottom-5",
            "rounded-3xl bg-white border border-slate-200 shadow-xl",
            "transition-all duration-200",
            showFullDescription
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Descrição completa" : "Full description"}
                </div>
                <div className="mt-1 text-[12px] text-slate-500 break-words">
                  {offer.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullDescription(false)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 max-h-[45vh] overflow-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {offer.description}
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFullDescription(false)}
                className="flex-1 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold py-2.5 border border-slate-200 transition"
              >
                {isPT ? "Mostrar menos" : "Show less"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFullDescription(false);
                  setShowContact(true);
                }}
                className="flex-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 transition"
              >
                {isPT ? "Ver contacto" : "Get this deal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

/* ---------------------------------------------------------
   SKELETON
--------------------------------------------------------- */
const OfferSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="w-full aspect-[16/10] bg-slate-200" />
    <div className="p-4 sm:p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="h-10 bg-slate-100 rounded-full mt-2" />
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

  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

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

    // Auto-hide expired
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

    // Sort
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

  const handleDeleteOffer = async (offerId: string | number) => {
    if (!user || typeof offerId !== "string") return;

    const confirmText = isPT
      ? "Tem a certeza de que quer remover esta oferta?"
      : "Are you sure you want to remove this offer?";
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase
      .from("service_offers")
      .delete()
      .eq("id", offerId)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert(
        isPT
          ? "Erro ao remover a oferta."
          : "Something went wrong while removing the offer."
      );
      return;
    }

    setDbOffers((prev) => prev.filter((o) => o.id !== offerId));
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
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-white to-amber-50/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-10 sm:pt-14 pb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-800 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" />
              {isPT
                ? "Ofertas selecionadas em Cascais"
                : "Curated deals in Cascais"}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {isPT
                ? "Poupa nos melhores serviços."
                : "Save on the best services."}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {isPT
                ? "Descontos, pacotes e campanhas sazonais dos prestadores verificados de Cascais."
                : "Discounts, packages and seasonal campaigns from verified Cascais providers."}
            </p>

            {/* Search */}
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 pr-12 py-4 text-sm sm:text-base shadow-sm outline-none focus:ring-4 focus:border-amber-400/40 transition"
                  style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
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

              <div className="relative">
                <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar py-1 pr-10 sm:pr-0">
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
                          "shrink-0 rounded-2xl border px-3 py-2 transition flex items-center gap-2 text-xs font-semibold",
                          active
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                        ].join(" ")}
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-base">
                          {isAll ? "🏖️" : category.icon}
                        </span>
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
                      "shrink-0 rounded-2xl border px-3 py-2 transition flex items-center gap-2 text-xs font-semibold",
                      selectedSubcategory === "all"
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-base">
                      🏖️
                    </span>
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
                            ? "border-amber-400 bg-amber-50 text-amber-800"
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
          RESULTS BAR — count + highlight filter + sort
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
            {/* Highlight filter */}
            <div className="inline-flex items-center rounded-full bg-white border border-slate-200 px-1 py-1 shadow-sm">
              {(
                [
                  { id: "all", label: isPT ? "Todas" : "All" },
                  { id: "new", label: isPT ? "Novas" : "New" },
                  { id: "last-minute", label: isPT ? "Últ. hora" : "Last min" },
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
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold transition",
                      active
                        ? "bg-amber-100 text-amber-800"
                        : "text-slate-500 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {h.label}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-full bg-white border border-slate-200 pl-8 pr-7 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferSkeleton key={i} />
            ))}
          </div>
        )}

        {!loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-3">🫧</div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const isOwner = !!user && offer.userId === user.id;
            return (
              <OfferCard
                key={offer.id}
                offer={offer}
                isPT={isPT}
                canDelete={isOwner}
                onDelete={
                  isOwner ? () => handleDeleteOffer(offer.id) : undefined
                }
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
    </div>
  );
};

export default OffersPage;
