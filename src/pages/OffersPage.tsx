// src/pages/OffersPage.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  CATEGORIES,
  SUBCATEGORIES,
  getCategoryLabel,
  getSubcategoryLabel,
} from "../data/categories";

import type { CategoryId, Category, Subcategory } from "../data/categories";

/* ---------- EXTRA TYPES ---------- */

type CategoryFilterId = CategoryId | "all";
type OfferHighlight = "new" | "last-minute" | "popular";
type SortMode = "newest" | "biggest-discount" | "ending-soon";

/* ---------- SHARED PILL STYLES ---------- */

const pillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-2.5 py-2 text-[10px] sm:text-[11px] transform transition duration-150";
const pillSize = "min-w-[76px] sm:min-w-[96px] md:min-w-[104px]";

const subPillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-2.5 py-1.5 text-[9.5px] sm:text-[11px] transform transition duration-150";
const subPillSize = "min-w-[70px] sm:min-w-[90px] md:min-w-[96px]";

/* ---------- OFFER TYPES ---------- */

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

/* Supabase row type */

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

/* ---------- HELPERS ---------- */

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

const highlightLabel = (highlight?: OfferHighlight, isPT?: boolean): string => {
  if (!highlight) return "";
  if (!isPT) {
    if (highlight === "new") return "New";
    if (highlight === "last-minute") return "Last minute";
    if (highlight === "popular") return "Popular";
  } else {
    if (highlight === "new") return "Novo";
    if (highlight === "last-minute") return "Última hora";
    if (highlight === "popular") return "Popular";
  }
  return "";
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
  const c = code.toUpperCase();
  switch (c) {
    case "EN":
      return "🇬🇧";
    case "PT":
      return "🇵🇹";
    case "ES":
      return "🇪🇸";
    case "FR":
      return "🇫🇷";
    case "DE":
      return "🇩🇪";
    case "IT":
      return "🇮🇹";
    case "RU":
      return "🇷🇺";
    default:
      return "🏳️";
  }
};

const mapRowToOffer = (row: OfferRow): Offer => {
  let languages: string[] = [];

  if (Array.isArray(row.languages)) {
    languages = row.languages;
  } else if (typeof row.languages === "string" && row.languages.trim() !== "") {
    languages = row.languages.split(",").map((s) => s.trim());
  }

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

const safeNumber = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n) ? n : null;

const calcDiscountPercent = (o: Offer) => {
  const op = safeNumber(o.originalPrice);
  const dp = safeNumber(o.discountedPrice);
  if (op == null || dp == null || dp >= op) return null;
  return Math.round(((op - dp) / op) * 100);
};

const normalizePhoneForTel = (raw: string) => raw.replace(/[^\d+]/g, "");

/* ---------- OFFER CARD ---------- */

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
  // ✅ overlays: no layout shift, no grid “white bars”
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

  const isLongDescription = (offer.description || "").trim().length > 220;

  const initials =
    offer.serviceName?.charAt(0).toUpperCase() ||
    offer.title?.charAt(0).toUpperCase() ||
    "?";

  const primaryPrice = formatPrice(
    offer.discountedPrice ?? offer.originalPrice ?? null
  );

  const oldPrice = hasDiscount ? formatPrice(offer.originalPrice) : null;

  const closeAllOverlays = () => {
    setShowContact(false);
    setShowFullDescription(false);
  };

  const phoneTel =
    offer.phone && offer.phone.trim()
      ? normalizePhoneForTel(offer.phone)
      : null;

  return (
    <article className="relative bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* IMAGE TOP */}
      <div className="relative">
        <div className="w-full aspect-16/10 bg-slate-100 overflow-hidden">
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

        {/* Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />

        {/* Badges */}
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
        </div>

        {/* Price + CTA */}
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
            className="shrink-0 rounded-full bg-white/95 hover:bg-white text-slate-900 text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-sm border border-white/60 transition"
          >
            {isPT ? "Ver contacto" : "Get this deal"}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Meta tags */}
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Title + provider */}
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
                <span>📍</span>
                <span>{offer.location}</span>
              </span>
            )}
            {offer.languages.length > 0 && (
              <span className="flex items-center gap-1 ml-auto">
                {offer.languages.map((lang) => (
                  <span key={lang} title={lang}>
                    {languageFlag(lang)}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Short label */}
        {offer.shortLabel && (
          <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-sky-50/70 via-white to-white px-3 py-2 text-[12px] text-slate-700">
            <span className="font-semibold text-slate-900">
              {isPT ? "Destaque:" : "Deal:"}
            </span>{" "}
            {offer.shortLabel}
          </div>
        )}

        {/* Description (always clamped to avoid grid row height issues) */}
        {offer.description && (
          <div className="space-y-2">
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
              {offer.description}
            </p>

            {isLongDescription && (
              <button
                type="button"
                onClick={() => setShowFullDescription(true)}
                className="text-[12px] font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2"
              >
                {isPT ? "Mostrar descrição completa" : "Show full description"}
              </button>
            )}
          </div>
        )}

        {/* Bottom CTA row */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="flex-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 transition"
          >
            {isPT ? "Ver contacto / Comprar" : "Contact / Buy"}
          </button>

          {/* ✅ small button should call the provider (if phone exists) */}
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

        {/* Owner actions */}
        {canDelete && (
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isPT ? "Gerir oferta" : "Manage offer"}
            </span>
            <div className="flex items-center gap-4">
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

      {/* OVERLAY WRAPPER */}
      <div
        className={[
          "absolute inset-0 z-30 transition",
          showContact || showFullDescription
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!(showContact || showFullDescription)}
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={closeAllOverlays}
          className={[
            "absolute inset-0 w-full h-full transition-opacity",
            showContact || showFullDescription
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
          style={{ background: "rgba(2, 6, 23, 0.45)" }}
          aria-label={isPT ? "Fechar" : "Close"}
        />

        {/* CONTACT PANEL */}
        <div
          className={[
            "absolute left-3 right-3 bottom-3 sm:left-5 sm:right-5 sm:bottom-5",
            "rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg",
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
                <div className="mt-1 text-[12px] text-slate-500 wrap-break-word">
                  {offer.serviceName || offer.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3 py-2 transition"
              >
                ✕
              </button>
            </div>

            {/* ✅ Desktop-safe wrapping: no truncate, no overflow */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {offer.phone && (
                <a
                  href={`tel:${normalizePhoneForTel(offer.phone)}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:bg-slate-100 transition overflow-hidden"
                >
                  <span>📞</span>
                  <span className="font-semibold text-slate-800 wrap-break-word">
                    {offer.phone}
                  </span>
                </a>
              )}

              {offer.contactEmail && (
                <a
                  href={`mailto:${offer.contactEmail}`}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 hover:bg-slate-100 transition overflow-hidden"
                  title={offer.contactEmail}
                >
                  <span>✉️</span>
                  {/* ✅ show full email with wrapping */}
                  <span className="font-semibold text-slate-800 break-all select-text">
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
                  title={offer.website}
                >
                  <span>🌐</span>
                  <span className="font-semibold text-slate-800 break-all">
                    {offer.website}
                  </span>
                </a>
              )}
            </div>

            {hasAnySocial && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <span className="text-[12px] text-slate-500 mr-1">
                  {isPT ? "Redes sociais:" : "Socials:"}
                </span>

                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-10 h-10 hover:shadow-sm transition"
                    aria-label="Instagram"
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
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-10 h-10 hover:shadow-sm transition"
                    aria-label="Facebook"
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
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-10 h-10 hover:shadow-sm transition"
                    aria-label="TikTok"
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
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 w-10 h-10 hover:shadow-sm transition"
                    aria-label="LinkedIn"
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
                  className="flex-1 text-center rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 transition"
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
            "rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg",
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
                <div className="mt-1 text-[12px] text-slate-500 wrap-break-word">
                  {offer.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullDescription(false)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3 py-2 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 max-h-[45vh] overflow-auto">
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

/* ---------- OFFERS PAGE ---------- */

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

  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const currentSubcategories =
    (selectedCategory !== "all"
      ? SUBCATEGORIES[selectedCategory as CategoryId]
      : []) ?? ([] as Subcategory[]);

  const displayCategories =
    selectedCategory === "all"
      ? CATEGORIES
      : CATEGORIES.filter(
          (c: Category) =>
            c.id === "all" || c.id === (selectedCategory as CategoryId)
        );

  useEffect(() => {
    const fetchOffers = async () => {
      setLoadingOffers(true);

      const { data, error } = await supabase
        .from("service_offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading offers from Supabase:", error);
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

    const discountPercent = (o: Offer) => calcDiscountPercent(o) ?? 0;

    const validUntilTime = (o: Offer) => {
      if (!o.validUntil) return Number.POSITIVE_INFINITY;
      const t = new Date(o.validUntil).getTime();
      return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
    };

    const createdTime = (o: Offer) => {
      if (!o.createdAt) return 0;
      const t = new Date(o.createdAt).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    if (sortMode === "newest") {
      list.sort((a, b) => createdTime(b) - createdTime(a));
    } else if (sortMode === "biggest-discount") {
      list.sort((a, b) => discountPercent(b) - discountPercent(a));
    } else if (sortMode === "ending-soon") {
      list.sort((a, b) => validUntilTime(a) - validUntilTime(b));
    }

    return list;
  }, [dbOffers, selectedCategory, selectedSubcategory, search, sortMode]);

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
      console.error("Error deleting offer:", error);
      alert(
        isPT
          ? "Ocorreu um erro ao remover a oferta."
          : "Something went wrong while removing the offer."
      );
      return;
    }

    setDbOffers((prev) => prev.filter((o) => o.id !== offerId));
  };

  return (
    <div className="min-h-screen bg-transparent pb-10">
      {/* HERO */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-5">
        <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {isPT ? "Ofertas locais em Cascais" : "Local offers in Cascais"}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                {isPT
                  ? "Descubra descontos, pacotes especiais e campanhas sazonais dos prestadores verificados."
                  : "Discover discounts, special packages and seasonal campaigns from trusted local providers."}
              </p>
            </div>

            {/* Search + Sort */}
            <div className="w-full md:w-105 flex flex-col gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isPT
                      ? "Pesquisar por serviço, local, desconto..."
                      : "Search by service, location, deal..."
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1F6FA6]/40"
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {isPT ? "Ordenar:" : "Sort:"}
                </span>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1F6FA6]/40"
                >
                  <option value="newest">
                    {isPT ? "Mais recentes" : "Newest"}
                  </option>
                  <option value="biggest-discount">
                    {isPT ? "Maior desconto" : "Biggest discount"}
                  </option>
                  <option value="ending-soon">
                    {isPT ? "A terminar" : "Ending soon"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-3 py-1">
              ✨ {isPT ? "Dica:" : "Tip:"}{" "}
              {isPT
                ? "Toque em “Ver contacto” para ligar ou visitar o website."
                : "Tap “Get this deal” to call or visit the website."}
            </span>

            <span className="ml-auto">
              {filteredOffers.length}{" "}
              {isPT ? "oferta(s) encontrada(s)" : "offer(s) found"}
            </span>
          </div>
        </div>
      </header>

      {/* CATEGORY STRIP */}
      <section
        className="
          relative
          pt-4 pb-5
          border-y border-sky-200/60
          bg-white/75
          backdrop-blur-md
          shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]
        "
        aria-label={isPT ? "Categorias de ofertas" : "Offer categories"}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/60 via-white/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {displayCategories.map((category: Category) => {
              const active = category.id === selectedCategory;
              const isAll = category.id === "all";

              const classes = [
                pillBase,
                pillSize,
                "border",
                "hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? [
                      "border-sky-500/80",
                      "bg-gradient-to-b from-white to-sky-50",
                      "text-slate-900",
                      "ring-2 ring-[#1F6FA6]/70",
                      "shadow-sm",
                    ].join(" ")
                  : [
                      "border-sky-200/70",
                      "bg-white/90",
                      "text-slate-700",
                      "hover:bg-white",
                      "hover:border-sky-300",
                    ].join(" "),
              ].join(" ");

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
                  className={classes}
                >
                  <span
                    className={[
                      "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full",
                      active
                        ? "bg-sky-100 text-sky-900"
                        : "bg-slate-50 text-slate-700",
                    ].join(" ")}
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
                    <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/60" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedCategory !== "all" && currentSubcategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3 items-center">
              <button
                type="button"
                onClick={() => setSelectedSubcategory("all")}
                className={[
                  subPillBase,
                  subPillSize,
                  "border hover:-translate-y-0.5 hover:shadow-md",
                  selectedSubcategory === "all"
                    ? "border-sky-500/80 bg-linear-to-b from-white to-sky-50 text-slate-900 ring-2 ring-[#1F6FA6]/70"
                    : "border-[#1F6FA6]/70 bg-white/90 text-slate-700 hover:bg-white hover:border-sky-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex items-center justify-center w-6.5 h-6.5 rounded-full",
                    selectedSubcategory === "all"
                      ? "bg-sky-100 text-sky-900"
                      : "bg-slate-50 text-slate-700",
                  ].join(" ")}
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
                      "border hover:-translate-y-0.5 hover:shadow-md",
                      active
                        ? "border-[#1F6FA6]/80 bg-linear-to-b from-white to-sky-50 text-slate-900 ring-2 ring-[#1F6FA6]/70"
                        : "border-sky-200/70 bg-white/90 text-slate-700 hover:bg-white hover:border-sky-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex items-center justify-center w-6.5 h-6.5 rounded-full",
                        active
                          ? "bg-sky-100 text-sky-900"
                          : "bg-slate-50 text-slate-700",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {sub.icon}
                    </span>

                    <span className="truncate font-medium">
                      {getSubcategoryLabel(
                        selectedCategory as CategoryId,
                        sub.id,
                        isPT
                      )}
                    </span>

                    {active && (
                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/60" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* OFFERS GRID */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            {isPT ? "A carregar ofertas..." : "Loading offers..."}
          </div>
        )}

        {!loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-600">
            <div className="text-2xl mb-2">🫧</div>
            {isPT
              ? "Ainda não há ofertas que correspondam aos filtros. Experimente mudar a categoria, subcategoria ou pesquisa."
              : "No offers match your filters yet. Try changing category, subcategory, or your search."}
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
