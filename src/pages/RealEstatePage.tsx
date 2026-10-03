// src/pages/RealEstatePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CASCAIS_AREAS, NEIGHBORHOODS_BY_AREA } from "../constants/locations";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Sparkles,
  Bed,
  Bath,
  Maximize,
  Home as HomeIcon,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  SlidersHorizontal,
  Loader2,
  Pencil,
  Trash2,
  BookOpen,
  Calculator,
  Map,
  Coins,
  KeyRound,
  Wallet,
  Truck,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F1F3D";
const BRAND_HOVER = "#15152E";
const SUCCESS = "#10B981";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type BuyRent = "all" | "buy" | "rent";

type PropertyType =
  | "all"
  | "apartment"
  | "house"
  | "villa"
  | "studio"
  | "land"
  | "commercial"
  | "warehouse"
  | "garage";

type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "area-desc"
  | "recent";

interface Property {
  id: string;
  status: "active" | "sold" | "rented";
  title: string;
  description: string;
  price: number;
  currency: "EUR";
  buyRent: BuyRent;
  location: string;
  neighborhood?: string | null;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  usableArea: number;
  grossArea?: number | null;
  landArea?: number | null;
  condition?: string | null;
  furnished?: "yes" | "no" | "partial" | null;
  energyCertificate?: string | null;
  divisions?: number | null;
  image?: string;
  images?: string[];
  isPriceNegotiable?: boolean;
  publisherType?: "owner" | "agency";
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  featuredUntil?: string | null;
  ownerId?: string;
  createdAt?: string | null;
}

type PropertyRow = {
  id: string | number;
  user_id: string;
  status: "active" | "sold" | "rented" | null;
  title: string;
  description: string | null;
  price: number;
  currency: string | null;
  buy_rent: "buy" | "rent";
  location: string | null;
  location_area: string | null;
  location_neighborhood: string | null;
  property_type:
    | "apartment"
    | "house"
    | "villa"
    | "studio"
    | "land"
    | "commercial"
    | "warehouse"
    | "garage";
  bedrooms: number | null;
  bathrooms: number | null;
  usable_area: number | null;
  gross_area: number | null;
  land_area: number | null;
  condition: string | null;
  furnished: "yes" | "no" | "partial" | null;
  divisions: number | null;
  energy_certificate: string | null;
  images: string[] | null;
  is_price_negotiable: boolean | null;
  publisher_type: "owner" | "agency" | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  featured_until: string | null;
  created_at?: string | null;
};

/**
 * Guide keys must match the ones used in `livingGuides.ts` and the
 * LivingGuidePage route (/living/guides/:key).
 */
type GuideKey = "areas" | "buying" | "renting" | "costs" | "owners" | "moving";

type Overlay = "none" | "property" | "match" | "delete";

/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */
const RENT_MAX_STEPS = [
  750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7500,
  10000,
];
const BUY_MAX_STEPS = [
  200000, 300000, 400000, 500000, 650000, 800000, 1000000, 1500000, 2000000,
  3000000, 4000000, 6000000, 8000000, 10000000,
];
const AREA_STEPS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275,
  300, 350,
];

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
const formatPriceOption = (value: number, isPT: boolean) =>
  "€" + value.toLocaleString(isPT ? "pt-PT" : "en-US");

const mapRowToProperty = (row: PropertyRow): Property => {
  const area = row.location_area ?? row.location ?? "";
  return {
    id: String(row.id),
    status: (row.status ?? "active") as Property["status"],
    title: row.title,
    description: row.description ?? "",
    price: row.price,
    currency: "EUR",
    buyRent: row.buy_rent as BuyRent,
    location: area,
    neighborhood: row.location_neighborhood ?? null,
    type: row.property_type as PropertyType,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    usableArea: row.usable_area ?? 0,
    grossArea: row.gross_area,
    landArea: row.land_area,
    condition: row.condition,
    furnished: row.furnished,
    divisions: row.divisions,
    energyCertificate: row.energy_certificate,
    images: row.images ?? undefined,
    publisherType: (row.publisher_type ?? "owner") as "owner" | "agency",
    ownerId: row.user_id,
    isPriceNegotiable: !!row.is_price_negotiable,
    agentName: row.contact_name ?? undefined,
    agentEmail: row.contact_email ?? undefined,
    agentPhone: row.contact_phone ?? undefined,
    featuredUntil: row.featured_until ?? null,
    createdAt: row.created_at ?? null,
  };
};

const formatTypeLabel = (t: PropertyType, isPT: boolean) => {
  const map: Record<PropertyType, { pt: string; en: string }> = {
    all: { pt: "Todos", en: "All" },
    apartment: { pt: "Apartamento", en: "Apartment" },
    house: { pt: "Moradia", en: "House" },
    villa: { pt: "Villa", en: "Villa" },
    studio: { pt: "Estúdio", en: "Studio" },
    land: { pt: "Terreno", en: "Land" },
    commercial: { pt: "Comercial", en: "Commercial" },
    warehouse: { pt: "Armazém", en: "Warehouse" },
    garage: { pt: "Garagem", en: "Garage" },
  };
  return (map[t] ?? map.all)[isPT ? "pt" : "en"];
};

const formatConditionLabel = (v?: string | null, isPT?: boolean) => {
  if (!v) return null;
  const map: Record<string, { pt: string; en: string }> = {
    usado: { pt: "Usado", en: "Used" },
    renovado: { pt: "Renovado", en: "Renovated" },
    novo: { pt: "Novo", en: "New" },
    para_recuperar: { pt: "Para recuperar", en: "To restore" },
    em_construcao: { pt: "Em construção", en: "Under construction" },
    ruina: { pt: "Ruína", en: "Ruins" },
  };
  return (map[v] ?? { pt: v, en: v })[isPT ? "pt" : "en"];
};

const formatFurnishedLabel = (
  v?: "yes" | "no" | "partial" | null,
  isPT?: boolean
) => {
  if (!v) return null;
  const map = {
    yes: { pt: "Sim", en: "Yes" },
    no: { pt: "Não", en: "No" },
    partial: { pt: "Parcial", en: "Partial" },
  };
  return map[v][isPT ? "pt" : "en"];
};

const calcPricePerSqm = (p: Property) => {
  const area = p.type === "land" ? p.landArea ?? 0 : p.usableArea ?? 0;
  if (!p.price || !area || area <= 0) return null;
  return Math.round((p.price / area) * 100) / 100;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/* ---------------------------------------------------------
   GUIDES CONTENT
   - "tools" = calculadoras interativas (destaque visual)
   - "guides" = guias de leitura (grid compacto)
   Cada key tem de existir em livingGuides.ts e ter rota
   /living/guides/:key.
--------------------------------------------------------- */
type GuideCategory = "tools" | "guides";

type GuideMeta = {
  key: GuideKey;
  category: GuideCategory;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  Icon: React.ComponentType<{ className?: string }>;
  badgePt: string;
  badgeEn: string;
  bulletsPt: [string, string];
  bulletsEn: [string, string];
};

const GUIDES: GuideMeta[] = [
  /* ---------- Tools (calculadoras) ---------- */
  {
    key: "costs",
    category: "tools",
    titlePt: "Custos reais",
    titleEn: "Real costs",
    descPt: "IMT 2026, escritura e obras — calculados.",
    descEn: "2026 IMT, closing and works — calculated.",
    Icon: Calculator,
    badgePt: "🧮 Calculadora",
    badgeEn: "🧮 Calculator",
    bulletsPt: [
      "IMT 2026 (Continente) + Imposto do Selo já calculados.",
      "Pense no custo total no 1º ano, não só no preço.",
    ],
    bulletsEn: [
      "2026 IMT (Mainland) + Stamp Duty included.",
      "Think total first-year cost, not only price.",
    ],
  },
  {
    key: "owners",
    category: "tools",
    titlePt: "Vender em Cascais",
    titleEn: "Selling in Cascais",
    descPt: "Líquido estimado: comissão, IVA e mais-valias.",
    descEn: "Estimated net: agency, VAT and capital gains.",
    Icon: Coins,
    badgePt: "🧮 Calculadora",
    badgeEn: "🧮 Calculator",
    bulletsPt: [
      "Comissão, IVA, crédito e mais-valias — estimados.",
      "Veja o líquido que fica no bolso antes de decidir.",
    ],
    bulletsEn: [
      "Agency, VAT, mortgage and capital gains — estimated.",
      "See your net proceeds before you decide.",
    ],
  },

  /* ---------- Guides (leitura) ---------- */
  {
    key: "areas",
    category: "guides",
    titlePt: "Zonas de Cascais",
    titleEn: "Cascais areas",
    descPt: "Escolha a zona certa: estilo, acessos e ambiente.",
    descEn: "Pick the right area: vibe, access, and lifestyle.",
    Icon: Map,
    badgePt: "Mapa",
    badgeEn: "Map",
    bulletsPt: [
      "Do Guincho ao Estoril: cada zona tem um ritmo diferente.",
      "Visite em horários diferentes antes de decidir.",
    ],
    bulletsEn: [
      "From Guincho to Estoril: each area has its own pace.",
      "Visit at different times before you decide.",
    ],
  },
  {
    key: "buying",
    category: "guides",
    titlePt: "Comprar em Cascais",
    titleEn: "Buying in Cascais",
    descPt: "O essencial: critérios, documentos e passos.",
    descEn: "The essentials: criteria, docs, and steps.",
    Icon: KeyRound,
    badgePt: "Guia",
    badgeEn: "Guide",
    bulletsPt: [
      "Defina 3 não-negociáveis antes de visitar.",
      "Peça caderneta, licença, CE e plantas.",
    ],
    bulletsEn: [
      "Set 3 non-negotiables before you visit.",
      "Ask for license, usage permit, energy cert, plans.",
    ],
  },
  {
    key: "renting",
    category: "guides",
    titlePt: "Arrendar em Cascais",
    titleEn: "Renting in Cascais",
    descPt: "Contratos, cauções e prazos — sem surpresas.",
    descEn: "Contracts, deposits and timelines — no surprises.",
    Icon: Wallet,
    badgePt: "Guia",
    badgeEn: "Guide",
    bulletsPt: [
      "Confirme duração do contrato e condições de renovação.",
      "Faça inventário (fotos) no check-in.",
    ],
    bulletsEn: [
      "Confirm contract duration and renewal terms.",
      "Do an inventory (photos) at check-in.",
    ],
  },
  {
    key: "moving",
    category: "guides",
    titlePt: "Mudar-se para Cascais",
    titleEn: "Moving to Cascais",
    descPt: "Checklist 7 dias + 30 dias para se instalar bem.",
    descEn: "7-day + 30-day checklist to settle in well.",
    Icon: Truck,
    badgePt: "Checklist",
    badgeEn: "Checklist",
    bulletsPt: [
      "Internet, água e energia: marque logo (slots acabam).",
      "Inventário com fotos no dia 1 e reporte problemas.",
    ],
    bulletsEn: [
      "Internet, water, energy: book early (slots go fast).",
      "Photo inventory on day 1 and report issues.",
    ],
  },
];

/* ---------------------------------------------------------
   LOADING SKELETONS
--------------------------------------------------------- */
const PropertySkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 animate-pulse">
    <div className="aspect-[4/3] rounded-xl bg-slate-200 mb-3" />
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-5 bg-slate-200 rounded w-1/3 mt-3" />
    </div>
  </div>
);

const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#FAF8F4] py-4">
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="h-56 sm:h-64 rounded-3xl bg-slate-200 border border-slate-100 shadow-sm mb-6 animate-pulse" />
      <div className="h-32 rounded-3xl bg-white border border-slate-100 shadow-sm mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertySkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------
   CONFIRM DELETE MODAL
--------------------------------------------------------- */
const ConfirmDeleteModal: React.FC<{
  open: boolean;
  listingTitle: string;
  isPT: boolean;
  busy: boolean;
  errorMsg: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, listingTitle, isPT, busy, errorMsg, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-listing-title"
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
                id="confirm-delete-listing-title"
                className="text-base font-semibold text-slate-900"
              >
                {isPT ? "Remover anúncio?" : "Remove listing?"}
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {isPT
                  ? `"${listingTitle}" será removido permanentemente. Esta ação não pode ser desfeita.`
                  : `"${listingTitle}" will be permanently removed. This action cannot be undone.`}
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
              className="rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 shadow-sm disabled:opacity-60 transition inline-flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
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
   MATCH MODAL
--------------------------------------------------------- */
const MatchModal: React.FC<{
  open: boolean;
  initialType: "buyer" | "owner";
  isPT: boolean;
  filtersSnapshot: Record<string, unknown>;
  onClose: () => void;
}> = ({ open, initialType, isPT, filtersSnapshot, onClose }) => {
  const [matchType, setMatchType] = useState<"buyer" | "owner">(initialType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setStatus("idle");
        setErrorMsg(null);
        setMailtoUrl(null);
        setMatchType(initialType);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, initialType]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 100);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "submitting") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose, status]);

  if (!open) return null;

  const buildMailto = () => {
    const subject =
      matchType === "owner"
        ? isPT
          ? "AllCascais — Pedido (Proprietário)"
          : "AllCascais — Owner request"
        : isPT
        ? "AllCascais — Pedido (Comprador/Arrendatário)"
        : "AllCascais — Buyer/Renter request";

    const bodyLines = [
      matchType === "owner"
        ? isPT
          ? "Tipo: Proprietário"
          : "Type: Owner"
        : isPT
        ? "Tipo: Comprador/Arrendatário"
        : "Type: Buyer/Renter",
      `Nome/Name: ${name || "—"}`,
      `Email: ${email || "—"}`,
      `Telefone/Phone: ${phone || "—"}`,
      "",
      isPT ? "Notas:" : "Notes:",
      notes || "—",
      "",
      "Page:",
      window.location.href,
    ];

    return `mailto:info@allcascais.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !isValidEmail(email)) {
      setErrorMsg(
        isPT
          ? "Preencha nome e email válido."
          : "Please add name and a valid email."
      );
      return;
    }

    setStatus("submitting");

    const payload = {
      source: "real-estate",
      page_url: window.location.href,
      language: isPT ? "pt" : "en",
      match_type: matchType,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      meta: { filters: filtersSnapshot },
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;
      setStatus("success");
      setTimeout(() => onClose(), 1600);
    } catch (err) {
      console.error("Lead insert failed:", err);
      setMailtoUrl(buildMailto());
      setStatus("error");
      setErrorMsg(
        isPT
          ? "Não foi possível enviar automaticamente. Pode enviar por email."
          : "Couldn't submit automatically. You can send it by email."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
      onClick={status === "submitting" ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
          <div>
            <div className="text-[11px] font-semibold" style={{ color: BRAND }}>
              {matchType === "owner"
                ? isPT
                  ? "Para proprietários"
                  : "For owners"
                : isPT
                ? "Para compradores/arrendatários"
                : "For buyers/renters"}
            </div>
            <div
              id="match-modal-title"
              className="text-sm sm:text-base font-semibold text-slate-900"
            >
              {matchType === "owner"
                ? isPT
                  ? "Quer destacar o seu imóvel?"
                  : "Want to feature your home?"
                : isPT
                ? "Diga-nos o que procura"
                : "Tell us what you need"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition"
            aria-label={isPT ? "Fechar" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "success" && (
          <div className="px-5 sm:px-7 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {isPT ? "Pedido recebido!" : "Request received!"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT ? "Respondemos em até 24h." : "We'll reply within 24h."}
            </p>
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-7" noValidate>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMatchType("buyer")}
                className={[
                  "flex-1 rounded-full border px-4 py-2 text-xs font-semibold transition",
                  matchType === "buyer"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {isPT ? "Quero comprar/arrendar" : "I want to buy/rent"}
              </button>
              <button
                type="button"
                onClick={() => setMatchType("owner")}
                className={[
                  "flex-1 rounded-full border px-4 py-2 text-xs font-semibold transition",
                  matchType === "owner"
                    ? "bg-slate-50 text-[#1F1F3D]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                style={
                  matchType === "owner" ? { borderColor: BRAND } : undefined
                }
              >
                {isPT ? "Sou proprietário" : "I'm an owner"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Nome *" : "Name *"}
                </label>
                <input
                  ref={firstInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                  placeholder={isPT ? "O seu nome" : "Your name"}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Telefone (opcional)" : "Phone (optional)"}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                  placeholder="+351 ..."
                  autoComplete="tel"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  {matchType === "owner"
                    ? isPT
                      ? "Sobre o imóvel"
                      : "About the home"
                    : isPT
                    ? "O que procura?"
                    : "What are you looking for?"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition resize-none"
                  placeholder={
                    matchType === "owner"
                      ? isPT
                        ? "Ex: Moradia T3 em Birre, vender em 2-3 meses..."
                        : "e.g. T3 house in Birre, selling in 2-3 months..."
                      : isPT
                      ? "Ex: Arrendar T2 até €2.000/mês, perto de escolas..."
                      : "e.g. Rent T2 up to €2,000/mo, near schools..."
                  }
                />
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{errorMsg}</div>
                  {mailtoUrl && (
                    <a
                      href={mailtoUrl}
                      className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                    >
                      {isPT ? "Abrir email" : "Open email"}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-500">
                {isPT
                  ? "Ao enviar, iremos contactá-lo em até 24h."
                  : "Submitting will get you a reply within 24h."}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 hover:bg-slate-50 disabled:opacity-60 transition"
                >
                  {isPT ? "Cancelar" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs font-semibold px-5 py-2 shadow transition disabled:opacity-60"
                  style={{ backgroundColor: BRAND }}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isPT ? "A enviar..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isPT ? "Enviar pedido" : "Send request"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   TOOL CARD — calculadoras interativas (destaque)
--------------------------------------------------------- */
const ToolCard: React.FC<{
  guide: GuideMeta;
  isPT: boolean;
  onOpen: (key: GuideKey) => void;
}> = ({ guide, isPT, onOpen }) => {
  const Icon = guide.Icon;
  const title = isPT ? guide.titlePt : guide.titleEn;
  const desc = isPT ? guide.descPt : guide.descEn;
  const badge = isPT ? guide.badgePt : guide.badgeEn;

  return (
    <button
      type="button"
      onClick={() => onOpen(guide.key)}
      className="group text-left rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>

          <span className="inline-flex items-center rounded-full bg-white border border-emerald-200 text-[10px] font-semibold text-emerald-800 px-2.5 py-0.5">
            {badge}
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-[12px] text-slate-700 leading-relaxed">
          {desc}
        </p>

        <div className="mt-5 pt-4 border-t border-emerald-100 flex items-center justify-between">
          <span className="text-[12px] font-semibold inline-flex items-center gap-1 text-emerald-700">
            {isPT ? "Abrir calculadora" : "Open calculator"}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700/70">
            {isPT ? "Interativo" : "Interactive"}
          </span>
        </div>
      </div>
    </button>
  );
};

/* ---------------------------------------------------------
   GUIDE CARD — guias de leitura (compacto)
--------------------------------------------------------- */
const GuideCard: React.FC<{
  guide: GuideMeta;
  isPT: boolean;
  onOpen: (key: GuideKey) => void;
}> = ({ guide, isPT, onOpen }) => {
  const Icon = guide.Icon;
  const title = isPT ? guide.titlePt : guide.titleEn;
  const desc = isPT ? guide.descPt : guide.descEn;
  const badge = isPT ? guide.badgePt : guide.badgeEn;

  return (
    <button
      type="button"
      onClick={() => onOpen(guide.key)}
      className="group text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F1F3D]/30"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#1F1F3D]">
            <Icon className="w-4 h-4" />
          </div>

          <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 px-2 py-0.5">
            {badge}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
          {desc}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-semibold inline-flex items-center gap-1 text-[#1F1F3D]">
            {isPT ? "Ler guia" : "Read guide"}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <BookOpen className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1F1F3D] transition-colors" />
        </div>
      </div>
    </button>
  );
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
const RealEstatePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { user } = useAuth();
  const navigate = useNavigate();

  const filtersRef = useRef<HTMLDivElement | null>(null);

  /* ---------- FILTERS ---------- */
  const [searchParams] = useSearchParams();
  const [buyRent, setBuyRent] = useState<BuyRent>("all");

  useEffect(() => {
    const buyRentParam = searchParams.get("buyRent");
    if (buyRentParam === "buy" || buyRentParam === "rent") {
      setBuyRent(buyRentParam);
    }
  }, [searchParams]);

  const [locationArea, setLocationArea] = useState<string>("all");
  const [locationNeighborhood, setLocationNeighborhood] =
    useState<string>("all");
  const [propertyType, setPropertyType] = useState<PropertyType>("all");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [bedrooms, setBedrooms] = useState<string>("any");
  const [bathrooms, setBathrooms] = useState<string>("any");
  const [minArea, setMinArea] = useState<string>("any");
  const [maxArea, setMaxArea] = useState<string>("any");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  /* ---------- DATA ---------- */
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  /* ---------- OVERLAY STATE ---------- */
  const [overlay, setOverlay] = useState<Overlay>("none");

  /* ---------- PROPERTY MODAL ---------- */
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAgentEmail, setShowAgentEmail] = useState(false);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElRef = useRef<HTMLElement | null>(null);

  /* ---------- MATCH MODAL ---------- */
  const [matchInitialType, setMatchInitialType] = useState<"buyer" | "owner">(
    "buyer"
  );

  /* ---------- DELETE MODAL ---------- */
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ---------- TOAST ---------- */
  const [toast, setToast] = useState<{
    text: string;
    tone: "success" | "error";
  } | null>(null);

  const showToast = (text: string, tone: "success" | "error" = "success") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3200);
  };

  /* ---------- SCROLL LOCK ---------- */
  useEffect(() => {
    document.body.style.overflow = overlay !== "none" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlay]);

  /* ---------- RESET MAX PRICE ON BUY/RENT CHANGE ---------- */
  useEffect(() => {
    setMaxPrice("any");
  }, [buyRent]);

  /* ---------- LOAD PROPERTIES ---------- */
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setPropertiesError(null);
        setLoadingProperties(true);

        const { data, error } = await supabase
          .from("property_listings")
          .select(
            `
            id, user_id, status, buy_rent, property_type, title, description,
            price, currency, location, location_area, location_neighborhood,
            bedrooms, bathrooms, usable_area, gross_area, land_area,
            condition, furnished, divisions, energy_certificate, images,
            publisher_type, is_price_negotiable, contact_name, contact_email,
            contact_phone, featured_until, created_at
          `
          )
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading properties:", error);
          setPropertiesError(
            isPT
              ? "Não foi possível carregar os imóveis."
              : "Failed to load properties."
          );
          setProperties([]);
          return;
        }

        setProperties((data as PropertyRow[]).map(mapRowToProperty));
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- DERIVED ---------- */
  const locations = useMemo(() => {
    const set = new Set<string>();
    CASCAIS_AREAS.forEach((l) => set.add(l));
    properties.forEach((p) => {
      if (p.location) set.add(p.location);
    });
    return Array.from(set);
  }, [properties]);

  const neighborhoodsForArea = useMemo(() => {
    if (locationArea === "all") return [];
    const hardcoded = NEIGHBORHOODS_BY_AREA[locationArea] ?? [];
    const fromDb = properties
      .filter((p) => p.location === locationArea)
      .map((p) => p.neighborhood ?? "")
      .filter(Boolean) as string[];
    return Array.from(new Set([...hardcoded, ...fromDb]));
  }, [locationArea, properties]);

  const filteredProperties = useMemo(() => {
    const list = [...properties];

    const filtered = list.filter((p) => {
      if (buyRent !== "all" && p.buyRent !== buyRent) return false;
      if (locationArea !== "all" && p.location !== locationArea) return false;
      if (
        locationNeighborhood !== "all" &&
        locationArea !== "all" &&
        (p.neighborhood ?? "") !== locationNeighborhood
      )
        return false;
      if (propertyType !== "all" && p.type !== propertyType) return false;

      if (bedrooms !== "any" && p.bedrooms < Number(bedrooms)) return false;
      if (bathrooms !== "any" && p.bathrooms < Number(bathrooms)) return false;
      if (maxPrice !== "any") {
        const n = Number(maxPrice);
        if (!Number.isNaN(n) && p.price > n) return false;
      }
      if (minArea !== "any") {
        const n = Number(minArea);
        if (!Number.isNaN(n)) {
          const area = p.type === "land" ? p.landArea ?? 0 : p.usableArea ?? 0;
          if (area < n) return false;
        }
      }
      if (maxArea !== "any") {
        const n = Number(maxArea);
        if (!Number.isNaN(n)) {
          const area = p.type === "land" ? p.landArea ?? 0 : p.usableArea ?? 0;
          if (area > n) return false;
        }
      }
      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "area-desc":
        sorted.sort((a, b) => {
          const aa = a.type === "land" ? a.landArea ?? 0 : a.usableArea ?? 0;
          const ab = b.type === "land" ? b.landArea ?? 0 : b.usableArea ?? 0;
          return ab - aa;
        });
        break;
      case "recent":
        sorted.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [
    properties,
    buyRent,
    locationArea,
    locationNeighborhood,
    propertyType,
    bedrooms,
    bathrooms,
    maxPrice,
    minArea,
    maxArea,
    sortBy,
  ]);

  /* ---------- FILTER CHIPS ---------- */
  const appliedChips: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (buyRent !== "all") {
    appliedChips.push({
      key: "buyRent",
      label:
        buyRent === "buy"
          ? isPT
            ? "Comprar"
            : "Buy"
          : isPT
          ? "Arrendar"
          : "Rent",
      onRemove: () => setBuyRent("all"),
    });
  }
  if (locationArea !== "all") {
    appliedChips.push({
      key: "locationArea",
      label: locationArea,
      onRemove: () => {
        setLocationArea("all");
        setLocationNeighborhood("all");
      },
    });
  }
  if (locationArea !== "all" && locationNeighborhood !== "all") {
    appliedChips.push({
      key: "locationNeighborhood",
      label: locationNeighborhood,
      onRemove: () => setLocationNeighborhood("all"),
    });
  }
  if (propertyType !== "all") {
    appliedChips.push({
      key: "type",
      label: formatTypeLabel(propertyType, isPT),
      onRemove: () => setPropertyType("all"),
    });
  }
  if (bedrooms !== "any") {
    appliedChips.push({
      key: "bedrooms",
      label: isPT ? `${bedrooms}+ quartos` : `${bedrooms}+ bedrooms`,
      onRemove: () => setBedrooms("any"),
    });
  }
  if (bathrooms !== "any") {
    appliedChips.push({
      key: "bathrooms",
      label: isPT ? `${bathrooms}+ WC` : `${bathrooms}+ baths`,
      onRemove: () => setBathrooms("any"),
    });
  }
  if (maxPrice !== "any") {
    appliedChips.push({
      key: "maxPrice",
      label: `≤ €${Number(maxPrice).toLocaleString(isPT ? "pt-PT" : "en-US")}`,
      onRemove: () => setMaxPrice("any"),
    });
  }
  if (minArea !== "any") {
    appliedChips.push({
      key: "minArea",
      label: `≥ ${minArea} m²`,
      onRemove: () => setMinArea("any"),
    });
  }
  if (maxArea !== "any") {
    appliedChips.push({
      key: "maxArea",
      label: `≤ ${maxArea} m²`,
      onRemove: () => setMaxArea("any"),
    });
  }

  const hasFilters =
    buyRent !== "all" ||
    locationArea !== "all" ||
    locationNeighborhood !== "all" ||
    propertyType !== "all" ||
    bedrooms !== "any" ||
    bathrooms !== "any" ||
    maxPrice !== "any" ||
    minArea !== "any" ||
    maxArea !== "any";

  const clearFilters = () => {
    setBuyRent("all");
    setLocationArea("all");
    setLocationNeighborhood("all");
    setPropertyType("all");
    setBedrooms("any");
    setBathrooms("any");
    setMaxPrice("any");
    setMinArea("any");
    setMaxArea("any");
    setSortBy("default");
    setShowMoreFilters(false);
  };

  /* ---------- HELPERS ---------- */
  const scrollToFilters = () => {
    requestAnimationFrame(() => {
      filtersRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleListPropertyClick = () => {
    if (user) navigate("/properties/new");
    else navigate("/auth", { state: { from: "/properties/new" } });
  };

  const formatBuyRentLabel = (p: { buyRent: BuyRent }) => {
    if (p.buyRent === "rent") return isPT ? "Para arrendar" : "For rent";
    if (p.buyRent === "buy") return isPT ? "Para venda" : "For sale";
    return isPT ? "Imóvel" : "Property";
  };

  const locationLabel = (p: Property) =>
    p.neighborhood ? `${p.location} · ${p.neighborhood}` : p.location;

  /* ---------- GUIDE NAV ---------- */
  const handleOpenGuide = (guideKey: GuideKey) => {
    navigate(`/living/guides/${guideKey}`);
  };

  /* ---------- MODAL HANDLERS ---------- */
  const openPropertyModal = (property: Property) => {
    lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    setSelectedProperty(property);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
    setOverlay("property");
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
    setOverlay("none");
    requestAnimationFrame(() => {
      lastFocusedElRef.current?.focus?.();
    });
  };

  const handleNextImage = () => {
    if (!selectedProperty?.images || selectedProperty.images.length <= 1)
      return;
    setActiveImageIndex((prev) =>
      prev + 1 >= selectedProperty.images!.length ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    if (!selectedProperty?.images || selectedProperty.images.length <= 1)
      return;
    setActiveImageIndex((prev) =>
      prev - 1 < 0 ? selectedProperty.images!.length - 1 : prev
    );
  };

  const handleCopyAgentEmail = async () => {
    if (!selectedProperty?.agentEmail) return;
    try {
      await navigator.clipboard.writeText(selectedProperty.agentEmail);
      setHasCopiedEmail(true);
      setTimeout(() => setHasCopiedEmail(false), 1800);
    } catch (err) {
      console.error("Failed to copy:", err);
      setShowAgentEmail(true);
    }
  };

  const isOwner =
    !!user && !!selectedProperty && selectedProperty.ownerId === user.id;

  const handleEditListing = () => {
    if (!selectedProperty || !user) return;
    const id = selectedProperty.id;
    closePropertyModal();
    navigate(`/properties/${id}/edit`);
  };

  const handleEditFromCard = (property: Property) => {
    if (!user) return;
    navigate(`/properties/${property.id}/edit`);
  };

  const handleDeleteFromCard = (property: Property) => {
    if (!user) return;
    setSelectedProperty(property);
    setDeleteError(null);
    setDeleteBusy(false);
    setOverlay("delete");
  };

  const openDeleteListingModal = () => {
    setDeleteError(null);
    setDeleteBusy(false);
    setOverlay("delete");
  };

  const closeDeleteListingModal = () => {
    if (deleteBusy) return;
    setDeleteError(null);
    setOverlay(
      selectedProperty && user && selectedProperty.ownerId === user.id
        ? "property"
        : "none"
    );
  };

  const confirmDeleteListing = async () => {
    if (!selectedProperty || !user) return;
    setDeleteBusy(true);
    setDeleteError(null);

    const { error } = await supabase
      .from("property_listings")
      .delete()
      .eq("id", selectedProperty.id)
      .eq("user_id", user.id);

    setDeleteBusy(false);

    if (error) {
      console.error("Error deleting listing:", error);
      setDeleteError(
        isPT
          ? "Erro ao remover o anúncio. Tenta novamente."
          : "Something went wrong while removing the listing."
      );
      return;
    }

    const removedTitle = selectedProperty.title;
    setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
    closePropertyModal();
    showToast(
      isPT ? `"${removedTitle}" removido.` : `"${removedTitle}" removed.`,
      "success"
    );
  };

  /* ---------- MATCH MODAL HANDLERS ---------- */
  const openMatch = (type: "buyer" | "owner") => {
    setMatchInitialType(type);
    setOverlay("match");
  };

  const closeMatch = () => setOverlay("none");

  const filtersSnapshot = useMemo(
    () => ({
      buyRent,
      locationArea,
      locationNeighborhood,
      propertyType,
      bedrooms,
      bathrooms,
      maxPrice,
      minArea,
      maxArea,
      sortBy,
    }),
    [
      buyRent,
      locationArea,
      locationNeighborhood,
      propertyType,
      bedrooms,
      bathrooms,
      maxPrice,
      minArea,
      maxArea,
      sortBy,
    ]
  );

  /* ---------- MODAL FOCUS TRAP ---------- */
  useEffect(() => {
    if (overlay !== "property") return;

    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePropertyModal();
        return;
      }
      if (e.key !== "Tab") return;

      const root = modalRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          [
            "a[href]",
            "button:not([disabled])",
            "textarea:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "[tabindex]:not([tabindex='-1'])",
          ].join(",")
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  /* ---------- LOADING ---------- */
  if (loadingProperties) {
    return <PageSkeleton />;
  }

  const selectedImages =
    selectedProperty?.images ??
    (selectedProperty?.image ? [selectedProperty.image] : []);

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-[#FAF8F4] py-4">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-sm bg-slate-900">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/cascais-coast.jpg')" }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(90deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.20) 100%)",
              }}
            />

            <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:py-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="min-w-0 max-w-2xl">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isPT ? "Viver em Cascais" : "Living in Cascais"}
                  </div>

                  <h1
                    className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {isPT
                      ? "Encontra o teu lugar em Cascais."
                      : "Find your place in Cascais."}
                  </h1>

                  <p className="mt-3 text-sm sm:text-base text-white/85 max-w-2xl">
                    {isPT
                      ? "Do Guincho a Carcavelos, do centro ao Estoril. Imóveis locais, sem comissões."
                      : "From Guincho to Carcavelos, from the centre to Estoril. Local homes, no commissions."}
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={scrollToFilters}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-lg hover:bg-slate-50 transition"
                    >
                      {isPT ? "Ver imóveis" : "Browse homes"}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openMatch("buyer")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/30 backdrop-blur text-white px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/20 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isPT ? "Receber sugestões" : "Get matches"}
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-2 lg:hidden text-[11px] text-white/60">
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                    <span>
                      {isPT
                        ? "Deslize para ver imóveis"
                        : "Scroll to browse homes"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FILTERS
        ========================================================== */}
        <section className="mb-6 sticky top-2 sm:top-3 z-20" ref={filtersRef}>
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-md border border-slate-100 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {isPT ? "Filtros" : "Filters"}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {isPT
                    ? "Encontre o seu lugar em Cascais."
                    : "Find your place in Cascais."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-3 py-2 hover:bg-slate-50 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isPT ? "Limpar" : "Clear"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMoreFilters((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-2 transition"
                  style={{
                    backgroundColor: showMoreFilters ? `${BRAND}15` : "white",
                    color: BRAND,
                    border: `1px solid ${BRAND}`,
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {showMoreFilters
                    ? isPT
                      ? "Menos"
                      : "Less"
                    : isPT
                    ? "Mais filtros"
                    : "More filters"}
                  {showMoreFilters ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Comprar / Arrendar" : "Buy / Rent"}
                </label>
                <select
                  value={buyRent}
                  onChange={(e) => setBuyRent(e.target.value as BuyRent)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="buy">{isPT ? "Comprar" : "Buy"}</option>
                  <option value="rent">{isPT ? "Arrendar" : "Rent"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Zona" : "Area"}
                </label>
                <select
                  value={locationArea}
                  onChange={(e) => {
                    setLocationArea(e.target.value);
                    setLocationNeighborhood("all");
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                >
                  <option value="all">{isPT ? "Todas" : "All"}</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Tipo" : "Type"}
                </label>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as PropertyType)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="apartment">
                    {isPT ? "Apartamento" : "Apartment"}
                  </option>
                  <option value="house">{isPT ? "Moradia" : "House"}</option>
                  <option value="land">{isPT ? "Terreno" : "Land"}</option>
                  <option value="commercial">
                    {isPT ? "Comercial" : "Commercial"}
                  </option>
                  <option value="warehouse">
                    {isPT ? "Armazém" : "Warehouse"}
                  </option>
                  <option value="garage">{isPT ? "Garagem" : "Garage"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Preço máx." : "Max price"}
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  disabled={buyRent === "all"}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white disabled:opacity-50 transition"
                >
                  <option value="any">
                    {buyRent === "all"
                      ? isPT
                        ? "Escolha tipo"
                        : "Pick type"
                      : isPT
                      ? "Sem limite"
                      : "No limit"}
                  </option>
                  {(buyRent === "rent"
                    ? RENT_MAX_STEPS
                    : buyRent === "buy"
                    ? BUY_MAX_STEPS
                    : []
                  ).map((val) => (
                    <option key={val} value={val}>
                      {formatPriceOption(val, isPT)}
                      {buyRent === "rent" ? (isPT ? " /mês" : " /mo") : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Ordenar" : "Sort"}
                </label>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none rounded-xl border border-slate-200 pl-8 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                  >
                    <option value="default">
                      {isPT ? "Recomendado" : "Recommended"}
                    </option>
                    <option value="recent">
                      {isPT ? "Mais recentes" : "Most recent"}
                    </option>
                    <option value="price-asc">
                      {isPT ? "Preço ↑" : "Price ↑"}
                    </option>
                    <option value="price-desc">
                      {isPT ? "Preço ↓" : "Price ↓"}
                    </option>
                    <option value="area-desc">
                      {isPT ? "Área ↓" : "Area ↓"}
                    </option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {showMoreFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Quartos" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Casas de banho" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Área mín. (m²)" : "Min area (m²)"}
                    </label>
                    <select
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                    >
                      <option value="any">
                        {isPT ? "Sem mín." : "No min"}
                      </option>
                      {AREA_STEPS.map((val) => (
                        <option key={`min-${val}`} value={val}>
                          ≥ {val} m²
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Área máx. (m²)" : "Max area (m²)"}
                    </label>
                    <select
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                    >
                      <option value="any">
                        {isPT ? "Sem máx." : "No max"}
                      </option>
                      {AREA_STEPS.map((val) => (
                        <option key={`max-${val}`} value={val}>
                          ≤ {val} m²
                        </option>
                      ))}
                    </select>
                  </div>

                  {locationArea !== "all" &&
                    neighborhoodsForArea.length > 0 && (
                      <div className="flex flex-col gap-1 col-span-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {isPT ? "Bairro" : "Neighborhood"}
                        </label>
                        <select
                          value={locationNeighborhood}
                          onChange={(e) =>
                            setLocationNeighborhood(e.target.value)
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 bg-white transition"
                        >
                          <option value="all">{isPT ? "Todos" : "All"}</option>
                          {neighborhoodsForArea.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>
              </div>
            )}

            {appliedChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {appliedChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {c.label}
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                ))}

                {appliedChips.length > 1 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-full text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 px-2"
                  >
                    {isPT ? "Limpar todos" : "Clear all"}
                  </button>
                )}
              </div>
            )}

            {propertiesError && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {propertiesError}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            RESULTS HEADER
        ========================================================== */}
        <section className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {filteredProperties.length}{" "}
              {isPT
                ? filteredProperties.length === 1
                  ? "imóvel encontrado"
                  : "imóveis encontrados"
                : filteredProperties.length === 1
                ? "property found"
                : "properties found"}
            </p>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {isPT ? "Cascais e arredores" : "Cascais & nearby"}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openMatch("owner")}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border text-xs sm:text-sm font-semibold px-4 py-2 transition hover:bg-slate-50"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              <User className="w-4 h-4" />
              {isPT ? "Sou proprietário" : "I'm an owner"}
            </button>

            <button
              type="button"
              onClick={handleListPropertyClick}
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
              {isPT ? "Anunciar" : "List property"}
            </button>
          </div>
        </section>

        {/* =========================================================
            PROPERTY GRID
        ========================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10 items-start">
          {propertiesError ? (
            <div className="col-span-full bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-red-900 mb-1">
                {isPT
                  ? "Não conseguimos carregar os imóveis"
                  : "Couldn't load properties"}
              </h3>
              <p className="text-sm text-red-700 mb-4">{propertiesError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-white border border-red-200 text-red-700 text-xs font-semibold px-5 py-2.5 hover:bg-red-100 transition"
              >
                {isPT ? "Tentar novamente" : "Try again"}
              </button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto">
              <div className="text-4xl mb-3">🏡</div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                {isPT ? "Sem resultados" : "No results"}
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                {isPT
                  ? "Experimente remover filtros ou ajustar o preço e a área."
                  : "Try removing filters or adjusting price and area."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition"
                    style={{ backgroundColor: BRAND }}
                  >
                    <X className="w-3.5 h-3.5" />
                    {isPT ? "Limpar filtros" : "Clear filters"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openMatch("buyer")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: SUCCESS }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPT ? "Quero sugestões" : "Get matches"}
                </button>
              </div>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const coverImage = property.images?.[0] ?? property.image;
              const ppsm = calcPricePerSqm(property);
              const isPropertyOwner = !!user && property.ownerId === user.id;

              return (
                <article
                  key={property.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPropertyModal(property)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && openPropertyModal(property)
                  }
                  className="group cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative"
                >
                  {isPropertyOwner && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFromCard(property);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur shadow-sm text-slate-700 hover:bg-white hover:text-[#1F1F3D] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F1F3D]/40"
                        aria-label={isPT ? "Editar anúncio" : "Edit listing"}
                        title={isPT ? "Editar anúncio" : "Edit listing"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFromCard(property);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur shadow-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        aria-label={isPT ? "Remover anúncio" : "Remove listing"}
                        title={isPT ? "Remover anúncio" : "Remove listing"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {coverImage ? (
                    <div className="w-full aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={coverImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center">
                      <HomeIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 px-2 py-0.5">
                        {formatTypeLabel(property.type, isPT)}
                      </span>

                      <span className="text-[10px] text-slate-500 truncate">
                        {locationLabel(property)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-3 min-h-[2.4em]">
                      {property.title}
                    </h3>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: BRAND }}
                        >
                          €
                          {property.price.toLocaleString(
                            isPT ? "pt-PT" : "en-US"
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {property.buyRent === "rent"
                            ? isPT
                              ? "por mês"
                              : "per month"
                            : isPT
                            ? "preço de venda"
                            : "sale price"}
                        </div>
                      </div>

                      {ppsm != null && (
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">€/m²</div>
                          <div className="text-xs font-semibold text-slate-700">
                            €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      {property.bedrooms > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" />
                          {property.bathrooms}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 ml-auto">
                        <Maximize className="w-3.5 h-3.5" />
                        {property.type === "land"
                          ? `${property.landArea ?? 0} m²`
                          : `${property.usableArea ?? 0} m²`}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {property.isPriceNegotiable && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold px-2 py-0.5">
                          {isPT ? "Negociável" : "Negotiable"}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 px-2 py-0.5">
                        {property.publisherType === "agency"
                          ? isPT
                            ? "Agência"
                            : "Agency"
                          : isPT
                          ? "Particular"
                          : "Owner"}
                      </span>
                      {property.energyCertificate && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 px-2 py-0.5">
                          CE: {property.energyCertificate}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* =========================================================
            DECISION TOOLS + GUIDES
            Weinschenk: hierarquia por função
            Krug: 6 itens visíveis sem "ver todos"
            Miller: título promete valor
        ========================================================== */}
        <section className="pb-10 pt-2">
          {/* Section header */}
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F1F3D] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {isPT ? "Viver em Cascais" : "Living in Cascais"}
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              {isPT
                ? "Antes de decidir, vê isto."
                : "Before you decide, see this."}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              {isPT
                ? "Ferramentas e guias com contexto local — impostos, zonas, prazos e mais."
                : "Tools and guides with local context — taxes, areas, timelines and more."}
            </p>
          </div>

          {/* Tools (calculadoras) — destaque */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                🧮 {isPT ? "Ferramentas" : "Tools"}
              </div>
              <div className="h-px flex-1 bg-emerald-200/60" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GUIDES.filter((g) => g.category === "tools").map((guide) => (
                <ToolCard
                  key={guide.key}
                  guide={guide}
                  isPT={isPT}
                  onOpen={handleOpenGuide}
                />
              ))}
            </div>
          </div>

          {/* Guides (leitura) — grid compacto */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                📖 {isPT ? "Guias" : "Guides"}
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GUIDES.filter((g) => g.category === "guides").map((guide) => (
                <GuideCard
                  key={guide.key}
                  guide={guide}
                  isPT={isPT}
                  onOpen={handleOpenGuide}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================
          MATCH MODAL
      ========================================================== */}
      <MatchModal
        open={overlay === "match"}
        initialType={matchInitialType}
        isPT={isPT}
        filtersSnapshot={filtersSnapshot}
        onClose={closeMatch}
      />

      {/* =========================================================
          PROPERTY DETAIL MODAL
      ========================================================== */}
      {selectedProperty && overlay === "property" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-2 sm:px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100 bg-slate-50/80">
              <div className="min-w-0">
                <p
                  className="text-[11px] font-medium mb-0.5"
                  style={{ color: BRAND }}
                >
                  {formatBuyRentLabel(selectedProperty)} ·{" "}
                  {locationLabel(selectedProperty)}
                </p>
                <h2
                  id="property-modal-title"
                  className="text-sm sm:text-lg font-semibold text-slate-900 truncate"
                >
                  {selectedProperty.title}
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closePropertyModal}
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-900/5">
                <div className="relative w-full bg-slate-900/5">
                  <div className="relative w-full aspect-[16/10] md:aspect-[16/11] overflow-hidden">
                    {selectedImages.length > 0 ? (
                      <>
                        <img
                          src={selectedImages[activeImageIndex]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        />
                        <img
                          src={selectedImages[activeImageIndex]}
                          alt={selectedProperty.title}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                        {isPT
                          ? "Sem imagens disponíveis"
                          : "No images available"}
                      </div>
                    )}

                    {selectedImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700 transition"
                          aria-label={
                            isPT ? "Imagem anterior" : "Previous image"
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700 transition"
                          aria-label={isPT ? "Seguinte" : "Next image"}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {selectedImages.length > 0 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px]">
                        {activeImageIndex + 1} / {selectedImages.length}
                      </div>
                    )}

                    {selectedProperty.isPriceNegotiable && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow">
                        {isPT ? "Preço negociável" : "Price negotiable"}
                      </div>
                    )}
                  </div>
                </div>

                {selectedImages.length > 1 && (
                  <div className="px-3 sm:px-4 py-2 border-t border-slate-100 bg-white">
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedImages.map((src, idx) => (
                        <button
                          key={src + idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-20 aspect-[4/3] rounded-xl overflow-hidden border transition shrink-0 ${
                            idx === activeImageIndex
                              ? "border-[#1F1F3D]"
                              : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={src}
                            alt={`${selectedProperty.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:w-1/2 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-slate-50">
                <div className="p-5 sm:p-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full text-[11px] font-semibold px-3 py-1"
                      style={{
                        backgroundColor: `${BRAND}15`,
                        color: BRAND,
                      }}
                    >
                      {formatBuyRentLabel(selectedProperty)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 px-3 py-1">
                      {selectedProperty.publisherType === "agency"
                        ? isPT
                          ? "Agência"
                          : "Agency"
                        : isPT
                        ? "Particular"
                        : "Owner"}
                    </span>
                    {selectedProperty.isPriceNegotiable && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-3 py-1">
                        {isPT ? "Negociável" : "Negotiable"}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
                      {selectedProperty.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {locationLabel(selectedProperty)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            {selectedProperty.buyRent === "rent"
                              ? isPT
                                ? "Arrendamento"
                                : "Rent"
                              : isPT
                              ? "Venda"
                              : "Sale"}
                          </div>
                          <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            €
                            {selectedProperty.price.toLocaleString(
                              isPT ? "pt-PT" : "en-US"
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {selectedProperty.buyRent === "rent"
                              ? isPT
                                ? "por mês"
                                : "per month"
                              : isPT
                              ? "preço de venda"
                              : "sale price"}
                          </div>
                        </div>

                        {(() => {
                          const ppsm = calcPricePerSqm(selectedProperty);
                          return ppsm != null ? (
                            <div className="text-right">
                              <div className="text-[11px] font-semibold text-slate-500">
                                €/m²
                              </div>
                              <div
                                className="text-sm sm:text-base font-bold"
                                style={{ color: BRAND }}
                              >
                                €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            {isPT ? "Quartos" : "Bedrooms"}
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {selectedProperty.bedrooms}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                            <Bath className="w-3 h-3" />
                            {isPT ? "WC" : "Baths"}
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {selectedProperty.bathrooms}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                            <Maximize className="w-3 h-3" />
                            {isPT ? "Área" : "Area"}
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {selectedProperty.type === "land"
                              ? selectedProperty.landArea
                                ? `${selectedProperty.landArea} m²`
                                : "—"
                              : selectedProperty.usableArea
                              ? `${selectedProperty.usableArea} m²`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      {isPT ? "Detalhes" : "Details"}
                    </h4>

                    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <dt className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "Tipo" : "Type"}
                          </dt>
                          <dd className="mt-0.5 font-semibold text-slate-900">
                            {formatTypeLabel(selectedProperty.type, isPT)}
                          </dd>
                        </div>

                        {formatConditionLabel(
                          selectedProperty.condition,
                          isPT
                        ) && (
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <dt className="text-[10px] font-semibold text-slate-500">
                              {isPT ? "Condição" : "Condition"}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">
                              {formatConditionLabel(
                                selectedProperty.condition,
                                isPT
                              )}
                            </dd>
                          </div>
                        )}

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <dt className="text-[10px] font-semibold text-slate-500">
                            {selectedProperty.type === "land"
                              ? isPT
                                ? "Terreno"
                                : "Land"
                              : isPT
                              ? "Área útil"
                              : "Usable"}
                          </dt>
                          <dd className="mt-0.5 font-semibold text-slate-900">
                            {selectedProperty.type === "land"
                              ? selectedProperty.landArea
                                ? `${selectedProperty.landArea} m²`
                                : "—"
                              : selectedProperty.usableArea
                              ? `${selectedProperty.usableArea} m²`
                              : "—"}
                          </dd>
                        </div>

                        {selectedProperty.grossArea && (
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <dt className="text-[10px] font-semibold text-slate-500">
                              {isPT ? "Área bruta" : "Gross"}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">
                              {selectedProperty.grossArea} m²
                            </dd>
                          </div>
                        )}

                        {formatFurnishedLabel(
                          selectedProperty.furnished,
                          isPT
                        ) && (
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <dt className="text-[10px] font-semibold text-slate-500">
                              {isPT ? "Mobilado" : "Furnished"}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">
                              {formatFurnishedLabel(
                                selectedProperty.furnished,
                                isPT
                              )}
                            </dd>
                          </div>
                        )}

                        {selectedProperty.energyCertificate && (
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                            <dt className="text-[10px] font-semibold text-slate-500">
                              {isPT ? "Certificado" : "Certificate"}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-900">
                              {selectedProperty.energyCertificate}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                      {isPT ? "Descrição" : "Description"}
                    </h4>
                    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {selectedProperty.description}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleEditListing}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F1F3D]/30"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {isPT ? "Editar anúncio" : "Edit listing"}
                      </button>
                      <button
                        type="button"
                        onClick={openDeleteListingModal}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-sm hover:bg-red-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isPT ? "Remover anúncio" : "Remove listing"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-slate-200 bg-white/95 backdrop-blur px-5 sm:px-7 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[11px] sm:text-xs text-slate-600">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {selectedProperty.publisherType === "agency" ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                        {selectedProperty.publisherType === "agency"
                          ? isPT
                            ? "Agência"
                            : "Agency"
                          : isPT
                          ? "Particular"
                          : "Owner"}
                      </div>
                      {selectedProperty.agentName && (
                        <div className="mt-0.5">
                          {isPT
                            ? `Representado por ${selectedProperty.agentName}.`
                            : `Represented by ${selectedProperty.agentName}.`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {selectedProperty.agentPhone && (
                        <a
                          href={`tel:${selectedProperty.agentPhone}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow transition hover:opacity-90"
                          style={{ backgroundColor: SUCCESS }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isPT ? "Ligar" : "Call"}
                        </a>
                      )}

                      {selectedProperty.agentEmail && (
                        <button
                          type="button"
                          onClick={handleCopyAgentEmail}
                          className="inline-flex items-center justify-center rounded-full text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow transition hover:opacity-90"
                          style={{ backgroundColor: BRAND }}
                        >
                          {hasCopiedEmail
                            ? isPT
                              ? "Copiado ✓"
                              : "Copied ✓"
                            : isPT
                            ? "Copiar email"
                            : "Copy email"}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedProperty.agentEmail && showAgentEmail && (
                    <div className="mt-2 text-[11px] text-slate-500 break-all">
                      {selectedProperty.agentEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONFIRM DELETE MODAL
      ========================================================== */}
      <ConfirmDeleteModal
        open={overlay === "delete" && !!selectedProperty}
        listingTitle={selectedProperty?.title ?? ""}
        isPT={isPT}
        busy={deleteBusy}
        errorMsg={deleteError}
        onConfirm={confirmDeleteListing}
        onCancel={closeDeleteListingModal}
      />

      {/* =========================================================
          TOAST
      ========================================================== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] pointer-events-none px-4">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 shadow-xl text-sm font-semibold",
              toast.tone === "success"
                ? "bg-slate-900 text-white"
                : "bg-red-600 text-white",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstatePage;
