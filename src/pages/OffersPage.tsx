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

/* ---------- SHARED PILL STYLES ---------- */

const pillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-2 text-[11px] sm:text-xs transform transition duration-150";
const pillSize = "min-w-[88px] sm:min-w-[110px]";

const subPillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-1.5 text-[10px] sm:text-xs transform transition duration-150";
const subPillSize = "min-w-[78px] sm:min-w-[100px]";

/* ---------- OFFER TYPES ---------- */

type OfferHighlight = "new" | "last-minute" | "popular";

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

/* ---------- OFFER CARD COMPONENT ---------- */

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

  const hasDiscount =
    offer.originalPrice != null &&
    offer.discountedPrice != null &&
    offer.discountedPrice < offer.originalPrice;

  const discountPercent =
    hasDiscount && offer.originalPrice
      ? Math.round(
          ((offer.originalPrice - (offer.discountedPrice ?? 0)) /
            offer.originalPrice) *
            100
        )
      : null;

  const discountAmount =
    hasDiscount && offer.originalPrice && offer.discountedPrice
      ? offer.originalPrice - offer.discountedPrice
      : null;

  const isLongDescription = (offer.description || "").length > 220;

  const instagramUrl = socialUrl("instagram", offer.instagram);
  const facebookUrl = socialUrl("facebook", offer.facebook);
  const tiktokUrl = socialUrl("tiktok", offer.tiktok);
  const linkedinUrl = socialUrl("linkedin", offer.linkedin);

  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl || linkedinUrl;

  const initials =
    offer.serviceName?.charAt(0).toUpperCase() ||
    offer.title?.charAt(0).toUpperCase() ||
    "?";

  return (
    <article className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition">
      <div className="flex flex-col md:flex-row">
        {/* IMAGE / LEFT SIDE */}
        <div className="md:w-2/5 lg:w-1/3 relative bg-slate-100">
          {offer.imageUrl ? (
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-full h-52 md:h-56 lg:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-52 md:h-56 lg:h-64 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
                {initials}
              </div>
              <span>
                {isPT
                  ? "Adicione uma imagem da oferta"
                  : "Add a photo of your offer"}
              </span>
            </div>
          )}

          {offer.highlight && (
            <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-amber-50/95 text-amber-700 text-[11px] font-semibold px-3 py-1 shadow-sm">
              ⭐ {highlightLabel(offer.highlight, isPT)}
            </div>
          )}
        </div>

        {/* CONTENT / RIGHT SIDE */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
          {/* TOP ROW: category + service + location + languages */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
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

              {offer.validUntil && (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 border border-sky-100 ml-auto">
                  ⏰ {formatValidUntil(offer.validUntil, isPT)}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {offer.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {offer.serviceName && (
                <span className="font-semibold text-slate-700">
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
                    <span key={lang}>{languageFlag(lang)}</span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          {offer.description && (
            <div className="space-y-1">
              <p
                className={[
                  "text-xs sm:text-sm text-slate-800 leading-relaxed",
                  !showFullDescription ? "line-clamp-3" : "",
                ].join(" ")}
              >
                {offer.description}
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

          {/* PRICES */}
          <div className="flex flex-wrap items-baseline gap-3 mt-1">
            <div className="flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-lg font-bold text-sky-600">
                    {formatPrice(offer.discountedPrice)}
                  </span>
                  <span className="text-xs line-through text-slate-400">
                    {formatPrice(offer.originalPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-sky-600">
                  {formatPrice(
                    offer.discountedPrice ?? offer.originalPrice ?? null
                  )}
                </span>
              )}
            </div>

            {hasDiscount && discountPercent != null && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5">
                -{discountPercent}%{" "}
                {discountAmount != null &&
                  ` (${isPT ? "Poupa" : "Save"} €${discountAmount})`}
              </span>
            )}
          </div>

          {/* CONTACT PANEL */}
          {showContact && (
            <div className="mt-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-[11px] sm:text-xs space-y-2">
              <div className="font-semibold text-slate-700 mb-1">
                {isPT ? "Informações de contacto" : "Contact information"}
              </div>

              {offer.phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <a
                    href={`tel:${offer.phone.replace(/\s/g, "")}`}
                    className="hover:underline"
                  >
                    {offer.phone}
                  </a>
                </div>
              )}

              {offer.contactEmail && (
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <a
                    href={`mailto:${offer.contactEmail}`}
                    className="truncate text-sky-700 hover:underline"
                  >
                    {offer.contactEmail}
                  </a>
                </div>
              )}

              {offer.website && (
                <div className="flex items-center gap-2">
                  <span>🌐</span>
                  <a
                    href={`https://${offer.website.replace(
                      /^https?:\/\//,
                      ""
                    )}`}
                    className="text-sky-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {offer.website}
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

          {/* FOOTER BUTTONS */}
          <div className="mt-3 flex flex-col sm:flex-row gap-3 items-center">
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

            {canDelete && (
              <div className="flex items-center gap-3">
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    {isPT ? "Editar oferta" : "Edit offer"}
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="text-[11px] sm:text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    {isPT ? "Remover oferta" : "Remove offer"}
                  </button>
                )}
              </div>
            )}
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
  const [onlyHighlighted, setOnlyHighlighted] = useState(false);

  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

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

  /* Load offers from Supabase */
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
      const mapped = rows.map((row) => mapRowToOffer(row));
      setDbOffers(mapped);
      setLoadingOffers(false);
    };

    fetchOffers();
  }, []);

  const filteredOffers = useMemo(() => {
    let list = [...dbOffers];

    // ✅ Auto-hide expired offers (valid_until before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    list = list.filter((o) => {
      if (!o.validUntil) return true; // no expiration → always visible
      const d = new Date(o.validUntil);
      d.setHours(0, 0, 0, 0);
      return d >= today; // only show offers valid today or later
    });

    if (selectedCategory !== "all") {
      list = list.filter((o) => o.categoryId === selectedCategory);
    }

    if (selectedSubcategory !== "all") {
      list = list.filter((o) => o.subcategoryId === selectedSubcategory);
    }

    if (onlyHighlighted) {
      list = list.filter((o) => o.highlight != null);
    }

    return list;
  }, [dbOffers, selectedCategory, selectedSubcategory, onlyHighlighted]);

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
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* HEADER / INTRO */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
          {isPT ? "Ofertas locais em Cascais" : "Local offers in Cascais"}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          {isPT
            ? "Descubra pacotes especiais, descontos e campanhas sazonais dos prestadores de serviços verificados em Cascais."
            : "Discover special packages, discounts and seasonal campaigns from trusted local providers in the Cascais area."}
        </p>
      </header>

      {/* CATEGORY STRIP */}
      <section
        className="bg-linear-to-r from-sky-50 via-cyan-50 to-sky-50 pt-3 pb-4 border-y border-sky-100/70"
        aria-label={isPT ? "Categorias de ofertas" : "Offer categories"}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {displayCategories.map((category: Category) => {
              const active = category.id === selectedCategory;
              const isAll = category.id === "all";

              const baseClasses = [
                pillBase,
                pillSize,
                active
                  ? "border-sky-500 bg-gradient-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                  : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                "hover:-translate-y-0.5 hover:shadow-md",
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
              {/* "All" subcategory pill */}
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
                      {getSubcategoryLabel(
                        selectedCategory as CategoryId,
                        sub.id,
                        isPT
                      )}
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

      {/* FILTER BAR (highlight toggle + summary) */}
      <section className="max-w-7xl mx-auto px-4 pt-4 pb-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOnlyHighlighted((v) => !v)}
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-medium",
            onlyHighlighted
              ? "bg-amber-50 border-amber-400 text-amber-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          ⭐ {isPT ? "Só ofertas em destaque" : "Only highlighted offers"}
        </button>

        {filteredOffers.length > 0 && (
          <span className="text-xs sm:text-sm text-slate-500 ml-auto">
            {filteredOffers.length}{" "}
            {isPT ? "oferta(s) encontrada(s)" : "offer(s) found"}
          </span>
        )}
      </section>

      {/* OFFERS LIST */}
      <section className="max-w-7xl mx-auto px-4 pt-4 space-y-4 pb-10">
        {loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-400">
            {isPT ? "A carregar ofertas..." : "Loading offers..."}
          </div>
        )}

        {!loadingOffers && filteredOffers.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {isPT
              ? "Ainda não há ofertas que correspondam aos filtros. Experimente mudar a categoria ou subcategoria."
              : "No offers match your filters yet. Try changing category or subcategory."}
          </div>
        )}

        {filteredOffers.map((offer) => {
          const isOwner = !!user && offer.userId === user.id;

          return (
            <OfferCard
              key={offer.id}
              offer={offer}
              isPT={isPT}
              canDelete={isOwner}
              onDelete={isOwner ? () => handleDeleteOffer(offer.id) : undefined}
              onEdit={
                isOwner ? () => navigate(`/offers/edit/${offer.id}`) : undefined
              }
            />
          );
        })}
      </section>
    </div>
  );
};

export default OffersPage;
