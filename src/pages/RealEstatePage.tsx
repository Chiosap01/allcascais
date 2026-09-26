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
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#195c8a";

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

type GuideKey = "buying" | "renting" | "costs" | "areas" | "owners" | "moving";

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

/* ---------------------------------------------------------
   GUIDES CONTENT
--------------------------------------------------------- */
const GUIDES: {
  key: GuideKey;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  bulletsPt: string[];
  bulletsEn: string[];
}[] = [
  {
    key: "areas",
    titlePt: "Zonas de Cascais",
    titleEn: "Cascais areas",
    descPt: "Escolha a zona certa: estilo, acessos e ambiente.",
    descEn: "Pick the right area: vibe, access, and lifestyle.",
    bulletsPt: [
      "Pense no seu dia-a-dia: praia, escolas, commute, tranquilidade.",
      "Visite em horários diferentes (manhã, tarde, noite).",
      "Compare estacionamento, ruído e acessos.",
    ],
    bulletsEn: [
      "Optimize for your day-to-day: beach, schools, commute, quiet.",
      "Visit at different times (morning, afternoon, evening).",
      "Compare parking, noise, and access.",
    ],
  },
  {
    key: "buying",
    titlePt: "Comprar em Cascais",
    titleEn: "Buying in Cascais",
    descPt: "O essencial: critérios, documentos e passos.",
    descEn: "The essentials: criteria, docs, and steps.",
    bulletsPt: [
      "Defina 3 não-negociáveis (zona, tipologia, orçamento).",
      "Peça sempre caderneta, licença de utilização, CE, e plantas.",
      "Negocie com base em comparáveis (€/m²) e estado do imóvel.",
    ],
    bulletsEn: [
      "Set 3 non-negotiables (area, type, budget).",
      "Always request key docs (license, certificate, plans).",
      "Negotiate using comparables (€/m²) and condition.",
    ],
  },
  {
    key: "renting",
    titlePt: "Arrendar em Cascais",
    titleEn: "Renting in Cascais",
    descPt: "Como evitar surpresas: contratos, cauções e prazos.",
    descEn: "Avoid surprises: contracts, deposits, and timelines.",
    bulletsPt: [
      "Confirme duração do contrato e condições de renovação.",
      "Verifique despesas incluídas (condomínio, água, internet).",
      "Faça inventário (fotos) no check-in.",
    ],
    bulletsEn: [
      "Confirm contract duration and renewal terms.",
      "Check what's included (condo fees, water, internet).",
      "Do an inventory (photos) at check-in.",
    ],
  },
  {
    key: "costs",
    titlePt: "Custos reais",
    titleEn: "Real costs",
    descPt: "Impostos, escritura, obras e manutenção.",
    descEn: "Taxes, closing, renovations, and upkeep.",
    bulletsPt: [
      "Reserve margem para obras/pequenas reparações.",
      "Considere custos anuais (IMI, condomínio, manutenção).",
      "Pense no custo total (não só no preço).",
    ],
    bulletsEn: [
      "Keep a buffer for repairs/renovations.",
      "Consider yearly costs (tax, condo fees, maintenance).",
      "Optimize for total cost, not only price.",
    ],
  },
];

/* ---------------------------------------------------------
   LOADING SKELETON
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

  // Aplica ?buyRent= da URL (vindo da LandingPage)
  useEffect(() => {
    const buyRentParam = searchParams.get("buyRent");
    if (buyRentParam === "buy" || buyRentParam === "rent") {
      setBuyRent(buyRentParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  /* ---------- MODAL ---------- */
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
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchType, setMatchType] = useState<"buyer" | "owner">("buyer");
  const [matchName, setMatchName] = useState("");
  const [matchEmail, setMatchEmail] = useState("");
  const [matchPhone, setMatchPhone] = useState("");
  const [matchNotes, setMatchNotes] = useState("");

  /* ---------- GUIDES ---------- */
  const [openGuide, setOpenGuide] = useState<GuideKey | null>(null);

  /* ---------- SCROLL LOCK ---------- */
  useEffect(() => {
    const shouldLock = !!selectedProperty || showMatchModal;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProperty, showMatchModal]);

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
    let list = [...properties];

    if (buyRent !== "all") list = list.filter((p) => p.buyRent === buyRent);
    if (locationArea !== "all")
      list = list.filter((p) => p.location === locationArea);
    if (locationNeighborhood !== "all" && locationArea !== "all")
      list = list.filter(
        (p) => (p.neighborhood ?? "") === locationNeighborhood
      );
    if (propertyType !== "all")
      list = list.filter((p) => p.type === propertyType);

    if (bedrooms !== "any") {
      const n = Number(bedrooms);
      list = list.filter((p) => p.bedrooms >= n);
    }
    if (bathrooms !== "any") {
      const n = Number(bathrooms);
      list = list.filter((p) => p.bathrooms >= n);
    }
    if (maxPrice !== "any") {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) list = list.filter((p) => p.price <= n);
    }
    if (minArea !== "any") {
      const n = Number(minArea);
      if (!Number.isNaN(n)) {
        list = list.filter((p) => {
          const area = p.type === "land" ? p.landArea ?? 0 : p.usableArea ?? 0;
          return area >= n;
        });
      }
    }
    if (maxArea !== "any") {
      const n = Number(maxArea);
      if (!Number.isNaN(n)) {
        list = list.filter((p) => {
          const area = p.type === "land" ? p.landArea ?? 0 : p.usableArea ?? 0;
          return area <= n;
        });
      }
    }

    /* ---------- SORT ---------- */
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "area-desc":
        list.sort((a, b) => {
          const aa = a.type === "land" ? a.landArea ?? 0 : a.usableArea ?? 0;
          const ab = b.type === "land" ? b.landArea ?? 0 : b.usableArea ?? 0;
          return ab - aa;
        });
        break;
      case "recent":
        list.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        break;
      default:
        // Default: keep Supabase order (already recent first)
        break;
    }

    return list;
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

  /* ---------- MODAL HANDLERS ---------- */
  const openPropertyModal = (property: Property) => {
    lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    setSelectedProperty(property);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
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
    if (!showAgentEmail) {
      setShowAgentEmail(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedProperty.agentEmail);
      setHasCopiedEmail(true);
      setTimeout(() => setHasCopiedEmail(false), 1800);
    } catch (err) {
      console.error("Failed to copy:", err);
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

  const handleDeleteListing = async () => {
    if (!selectedProperty || !user) return;
    const confirmText = isPT
      ? "Tem a certeza que quer remover este anúncio? Esta ação é permanente."
      : "Are you sure you want to remove this listing? This action is permanent.";
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase
      .from("property_listings")
      .delete()
      .eq("id", selectedProperty.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting listing:", error);
      alert(
        isPT
          ? "Erro ao remover o anúncio."
          : "Something went wrong while removing the listing."
      );
      return;
    }

    setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
    closePropertyModal();
  };

  /* ---------- MATCH MODAL HANDLERS ---------- */
  const openMatch = (type: "buyer" | "owner") => {
    setMatchType(type);
    setShowMatchModal(true);
    setMatchNotes("");
  };

  const closeMatch = () => setShowMatchModal(false);

  const submitMatch = async () => {
    if (!matchName.trim() || !matchEmail.trim()) {
      alert(isPT ? "Preencha nome e email." : "Please add name and email.");
      return;
    }

    const payload = {
      source: "real-estate",
      page_url: window.location.href,
      language: isPT ? "pt" : "en",
      match_type: matchType,
      name: matchName.trim(),
      email: matchEmail.trim(),
      phone: matchPhone.trim() || null,
      notes: matchNotes.trim() || null,
      meta: {
        filters: {
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
        },
      },
    };

    const openMailto = () => {
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
        `Nome/Name: ${matchName || "—"}`,
        `Email: ${matchEmail || "—"}`,
        `Telefone/Phone: ${matchPhone || "—"}`,
        "",
        isPT ? "Notas:" : "Notes:",
        matchNotes || "—",
        "",
        "Page:",
        window.location.href,
      ];

      window.location.href = `mailto:info@allcascais.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;

      alert(isPT ? "Pedido recebido ✅" : "Request received ✅");
      setShowMatchModal(false);
      setMatchName("");
      setMatchEmail("");
      setMatchPhone("");
      setMatchNotes("");
    } catch (err) {
      console.error("Lead insert failed:", err);
      alert(
        isPT
          ? "Não foi possível enviar automaticamente. Vamos abrir o seu email como alternativa."
          : "Couldn't submit automatically. We'll open your email as a fallback."
      );
      openMailto();
      setShowMatchModal(false);
    }
  };

  /* ---------- MODAL FOCUS TRAP ---------- */
  useEffect(() => {
    if (!selectedProperty) return;

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
  }, [selectedProperty]);

  /* ---------- LOADING ---------- */
  if (loadingProperties) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] py-8">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <div className="h-48 rounded-3xl bg-white border border-slate-100 shadow-sm mb-6 animate-pulse" />
          <div className="h-24 rounded-3xl bg-white border border-slate-100 shadow-sm mb-6 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
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
              style={{ backgroundImage: "url('/cascais-coast.png')" }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(90deg, rgba(2,6,23,0.80) 0%, rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.25) 100%)",
              }}
            />

            <div className="relative px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isPT ? "Viver em Cascais" : "Living in Cascais"}
                  </div>

                  <h1
                    className="mt-2 text-2xl sm:text-3xl font-semibold text-white tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {isPT
                      ? "Casas com contexto local."
                      : "Homes with local context."}
                  </h1>

                  <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl">
                    {isPT
                      ? "Descubra imóveis com contexto: zonas, lifestyle e serviços úteis para o dia-a-dia em Cascais."
                      : "Discover homes with context: areas, lifestyle, and services that make moving easier."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={scrollToFilters}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold shadow hover:bg-white/90 transition"
                    >
                      {isPT ? "Ver imóveis" : "Browse homes"}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openMatch("buyer")}
                      className="inline-flex items-center justify-center gap-2 rounded-full text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow hover:opacity-90 transition"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isPT ? "Receber sugestões" : "Get matches"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/75">
                    <span className="inline-flex items-center rounded-full bg-black/20 border border-white/10 px-3 py-1">
                      {isPT ? "Contexto local" : "Local context"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-black/20 border border-white/10 px-3 py-1">
                      {isPT ? "Zonas & bairros" : "Areas & neighborhoods"}
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
            {/* Header row */}
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

            {/* Primary filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Buy/Rent */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Comprar / Arrendar" : "Buy / Rent"}
                </label>
                <select
                  value={buyRent}
                  onChange={(e) => setBuyRent(e.target.value as BuyRent)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="buy">{isPT ? "Comprar" : "Buy"}</option>
                  <option value="rent">{isPT ? "Arrendar" : "Rent"}</option>
                </select>
              </div>

              {/* Area */}
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
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                >
                  <option value="all">{isPT ? "Todas" : "All"}</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Tipo" : "Type"}
                </label>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as PropertyType)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
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

              {/* Max price */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Preço máx." : "Max price"}
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  disabled={buyRent === "all"}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white disabled:opacity-50 transition"
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

              {/* Sort */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPT ? "Ordenar" : "Sort"}
                </label>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none rounded-xl border border-slate-200 pl-8 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
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

            {/* Advanced filters */}
            {showMoreFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Bedrooms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Quartos" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>

                  {/* Bathrooms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Casas de banho" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  {/* Min area */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Área mín. (m²)" : "Min area (m²)"}
                    </label>
                    <select
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
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

                  {/* Max area */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isPT ? "Área máx. (m²)" : "Max area (m²)"}
                    </label>
                    <select
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
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

                  {/* Neighborhood (only when area selected) */}
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
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
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

            {/* Applied chips */}
            {appliedChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
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
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {filteredProperties.map((property) => {
            const coverImage = property.images?.[0] ?? property.image;
            const ppsm = calcPricePerSqm(property);

            return (
              <article
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => openPropertyModal(property)}
                onKeyDown={(e) =>
                  e.key === "Enter" && openPropertyModal(property)
                }
                className="group cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
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

                {/* Content */}
                <div className="p-4">
                  {/* Top row: type + location */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 px-2 py-0.5">
                      {formatTypeLabel(property.type, isPT)}
                    </span>

                    <span className="text-[10px] text-slate-500 truncate">
                      {locationLabel(property)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-3 min-h-[2.4em]">
                    {property.title}
                  </h3>

                  {/* Price */}
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

                  {/* Meta row */}
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

                  {/* Badges */}
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
          })}

          {/* Empty state */}
          {filteredProperties.length === 0 && (
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
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPT ? "Quero sugestões" : "Get matches"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================
            GUIDES
        ========================================================== */}
        <section className="pb-8">
          <div className="mb-4">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {isPT ? "Guias rápidos" : "Quick guides"}
            </h2>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600">
              {isPT
                ? "Conteúdo curto e útil — pensado para Cascais."
                : "Short, practical content — tailored for Cascais."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GUIDES.map((g) => {
              const isOpen = openGuide === g.key;
              const title = isPT ? g.titlePt : g.titleEn;
              const desc = isPT ? g.descPt : g.descEn;
              const bullets = isPT ? g.bulletsPt : g.bulletsEn;

              return (
                <div
                  key={g.key}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGuide(isOpen ? null : g.key)}
                    className="w-full text-left p-5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {title}
                        </div>
                        <div className="mt-1 text-[11px] sm:text-xs text-slate-600">
                          {desc}
                        </div>
                      </div>
                      <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                        <ul className="list-disc pl-5 text-[11px] sm:text-xs text-slate-700 space-y-2">
                          {bullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openMatch("buyer")}
                            className="inline-flex items-center gap-1.5 rounded-full text-white text-xs font-semibold px-4 py-2 shadow-sm transition hover:opacity-90"
                            style={{ backgroundColor: "#10B981" }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isPT ? "Pedir ajuda" : "Get help"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenGuide(null);
                              scrollToFilters();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition"
                          >
                            {isPT ? "Voltar aos imóveis" : "Back to homes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* =========================================================
          MATCH MODAL
      ========================================================== */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0">
              <div>
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: BRAND }}
                >
                  {matchType === "owner"
                    ? isPT
                      ? "Para proprietários"
                      : "For owners"
                    : isPT
                    ? "Para compradores/arrendatários"
                    : "For buyers/renters"}
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-900">
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
                onClick={closeMatch}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7">
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
                      ? "bg-sky-50 text-[#1F6FA6]"
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
                    {isPT ? "Nome" : "Name"}
                  </label>
                  <input
                    value={matchName}
                    onChange={(e) => setMatchName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                    placeholder={isPT ? "O seu nome" : "Your name"}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={matchEmail}
                    onChange={(e) => setMatchEmail(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {isPT ? "Telefone (opcional)" : "Phone (optional)"}
                  </label>
                  <input
                    type="tel"
                    value={matchPhone}
                    onChange={(e) => setMatchPhone(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition"
                    placeholder="+351 ..."
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
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    rows={4}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 bg-white transition resize-none"
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

              <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-[11px] text-slate-500">
                  {isPT
                    ? "Ao enviar, iremos contactá-lo em até 24h."
                    : "Submitting will get you a reply within 24h."}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeMatch}
                    className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition"
                  >
                    {isPT ? "Cancelar" : "Cancel"}
                  </button>

                  <button
                    type="button"
                    onClick={submitMatch}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full text-white text-xs font-semibold px-5 py-2 shadow transition hover:opacity-90"
                    style={{ backgroundColor: BRAND }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isPT ? "Enviar pedido" : "Send request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PROPERTY DETAIL MODAL
      ========================================================== */}
      {selectedProperty && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-2 sm:px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
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

            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Gallery */}
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
                          <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700 transition"
                          aria-label={isPT ? "Seguinte" : "Next image"}
                        >
                          <ChevronDown className="w-4 h-4 -rotate-90" />
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
                              ? "border-[#1F6FA6]"
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

              {/* Info panel */}
              <div className="md:w-1/2 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-slate-50">
                <div className="p-5 sm:p-7 space-y-5">
                  {/* Meta pills */}
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

                  {/* Title */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
                      {selectedProperty.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {locationLabel(selectedProperty)}
                    </p>
                  </div>

                  {/* Price card */}
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

                      {/* Quick stats */}
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

                  {/* Details */}
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

                  {/* Description */}
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

                  {/* Owner controls */}
                  {isOwner && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleEditListing}
                        className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-amber-600 transition"
                      >
                        {isPT ? "Editar anúncio" : "Edit listing"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteListing}
                        className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-red-700 transition"
                      >
                        {isPT ? "Remover anúncio" : "Remove listing"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact footer */}
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
                          style={{ backgroundColor: "#10B981" }}
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
                            : showAgentEmail
                            ? isPT
                              ? "Copiar email"
                              : "Copy email"
                            : isPT
                            ? "Ver email"
                            : "Show email"}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedProperty.agentEmail &&
                    showAgentEmail &&
                    !hasCopiedEmail && (
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
    </div>
  );
};

export default RealEstatePage;
