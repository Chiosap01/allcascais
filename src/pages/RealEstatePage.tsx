// src/pages/RealEstatePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CASCAIS_AREAS, NEIGHBORHOODS_BY_AREA } from "../constants/locations";

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

interface Property {
  id: string;
  status: "active" | "sold" | "rented";
  title: string;
  description: string;
  price: number;
  currency: "EUR";
  buyRent: BuyRent;

  // split (zona + bairro)
  location: string; // zona (area)
  neighborhood?: string | null; // bairro (optional)

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

  // kept in data model but NOT used in UI while paid features are disabled
  featuredUntil?: string | null;

  ownerId?: string;
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

  // legacy + new
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

  // kept in DB but NOT used in UI while paid features are disabled
  featured_until: string | null;
};

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
  };
};

// helpers
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

type GuideKey = "buying" | "renting" | "costs" | "areas" | "owners" | "moving";

const RealEstatePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";

  const { user } = useAuth();
  const navigate = useNavigate();

  const filtersRef = useRef<HTMLDivElement | null>(null);

  // “Get matched” mini-lead modal (no new pages needed)
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchType, setMatchType] = useState<"buyer" | "owner">("buyer");
  const [matchName, setMatchName] = useState("");
  const [matchEmail, setMatchEmail] = useState("");
  const [matchPhone, setMatchPhone] = useState("");
  const [matchNotes, setMatchNotes] = useState("");

  const [openGuide, setOpenGuide] = useState<GuideKey | null>(null);

  const guides = useMemo(
    () => [
      {
        key: "areas" as const,
        title: isPT
          ? "Zonas de Cascais (guia rápido)"
          : "Cascais areas (quick guide)",
        desc: isPT
          ? "Escolha a zona certa: estilo, acessos e ambiente."
          : "Pick the right area: vibe, access, and lifestyle.",
        bullets: isPT
          ? [
              "Pense no seu dia-a-dia: praia, escolas, commute, tranquilidade.",
              "Visite em horários diferentes (manhã, tarde, noite).",
              "Compare estacionamento, ruído e acessos.",
            ]
          : [
              "Optimize for your day-to-day: beach, schools, commute, quiet.",
              "Visit at different times (morning, afternoon, evening).",
              "Compare parking, noise, and access.",
            ],
      },
      {
        key: "buying" as const,
        title: isPT ? "Comprar em Cascais" : "Buying in Cascais",
        desc: isPT
          ? "O essencial: critérios, documentos e passos."
          : "The essentials: criteria, docs, and steps.",
        bullets: isPT
          ? [
              "Defina 3 não-negociáveis (zona, tipologia, orçamento).",
              "Peça sempre caderneta, licença de utilização, CE, e plantas.",
              "Negocie com base em comparáveis (€/m²) e estado do imóvel.",
            ]
          : [
              "Set 3 non-negotiables (area, type, budget).",
              "Always request key docs (license, certificate, plans).",
              "Negotiate using comparables (€/m²) and condition.",
            ],
      },
      {
        key: "renting" as const,
        title: isPT ? "Arrendar em Cascais" : "Renting in Cascais",
        desc: isPT
          ? "Como evitar surpresas: contratos, cauções e prazos."
          : "Avoid surprises: contracts, deposits, and timelines.",
        bullets: isPT
          ? [
              "Confirme duração do contrato e condições de renovação.",
              "Verifique despesas incluídas (condomínio, água, internet).",
              "Faça inventário (fotos) no check-in.",
            ]
          : [
              "Confirm contract duration and renewal terms.",
              "Check what’s included (condo fees, water, internet).",
              "Do an inventory (photos) at check-in.",
            ],
      },
      {
        key: "costs" as const,
        title: isPT
          ? "Custos reais (além do preço)"
          : "Real costs (beyond price)",
        desc: isPT
          ? "Planeie: impostos, escritura, obras e manutenção."
          : "Plan for taxes, closing, renovations, and upkeep.",
        bullets: isPT
          ? [
              "Reserve margem para obras/pequenas reparações.",
              "Considere custos anuais (IMI, condomínio, manutenção).",
              "Pense no custo total (não só no preço).",
            ]
          : [
              "Keep a buffer for repairs/renovations.",
              "Consider yearly costs (tax, condo fees, maintenance).",
              "Optimize for total cost, not only price.",
            ],
      },
      {
        key: "moving" as const,
        title: isPT ? "Mudar-se para Cascais" : "Moving to Cascais",
        desc: isPT
          ? "Checklist de serviços e tarefas (rápido)."
          : "A quick checklist of tasks and services.",
        bullets: isPT
          ? [
              "Mudanças + limpeza + internet: marque com antecedência.",
              "Se tem filhos: valide escolas e distâncias reais.",
              "Crie a sua rede local (saúde, bem-estar, mobilidade).",
            ]
          : [
              "Moving + cleaning + internet: book early.",
              "If kids: validate schools and real distances.",
              "Build your local network (health, wellness, mobility).",
            ],
      },
      {
        key: "owners" as const,
        title: isPT
          ? "Para proprietários: como vender melhor"
          : "For owners: sell smarter",
        desc: isPT
          ? "Destaque-se com apresentação + narrativa local."
          : "Stand out with presentation + local narrative.",
        bullets: isPT
          ? [
              "Fotos + planta + descrição clara geram visitas qualificadas.",
              "Posicione o imóvel: estilo de vida, ruas, proximidade a serviços.",
              "Preço: alinhe com €/m² e estado real (não com “achismos”).",
            ]
          : [
              "Photos + floorplan + clarity = better leads.",
              "Position your home: lifestyle, streets, nearby services.",
              "Pricing: align with €/m² and condition (not wishful thinking).",
            ],
      },
    ],
    [isPT]
  );

  const scrollToFilters = () => {
    requestAnimationFrame(() => {
      filtersRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const openMatch = (type: "buyer" | "owner") => {
    setMatchType(type);
    setShowMatchModal(true);
    setMatchNotes("");
  };

  const closeMatch = () => setShowMatchModal(false);

  const submitMatch = async () => {
    // basic validation
    if (!matchName.trim() || !matchEmail.trim()) {
      alert(isPT ? "Preencha nome e email." : "Please add name and email.");
      return;
    }

    const payload = {
      source: "real-estate", // keep different from living-guides if you want
      page_url: window.location.href, // or your route if you prefer
      language: isPT ? "pt" : "en",
      match_type: matchType, // "buyer" | "owner"
      name: matchName.trim(),
      email: matchEmail.trim(),
      phone: matchPhone.trim() || null,
      notes: matchNotes.trim() || null,

      // optional but useful: capture context
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

      // success UX (simple)
      alert(isPT ? "Pedido recebido ✅" : "Request received ✅");
      setShowMatchModal(false);

      // clear fields
      setMatchName("");
      setMatchEmail("");
      setMatchPhone("");
      setMatchNotes("");
    } catch (err) {
      console.error("Lead insert failed:", err);

      alert(
        isPT
          ? "Não foi possível enviar automaticamente. Vamos abrir o seu email como alternativa."
          : "Couldn’t submit automatically. We’ll open your email as a fallback."
      );
      openMailto();
      setShowMatchModal(false);
    }
  };

  // Filters
  const [buyRent, setBuyRent] = useState<BuyRent>("all");

  // split filters
  const [locationArea, setLocationArea] = useState<string>("all");
  const [locationNeighborhood, setLocationNeighborhood] =
    useState<string>("all");

  const [propertyType, setPropertyType] = useState<PropertyType>("all");
  const [bedrooms, setBedrooms] = useState<string>("any");
  const [bathrooms, setBathrooms] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">(
    "default"
  );
  const [minArea, setMinArea] = useState<string>("any");
  const [maxArea, setMaxArea] = useState<string>("any");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Agent email reveal/copy
  const [showAgentEmail, setShowAgentEmail] = useState(false);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  // Properties
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  // Property detail modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const lastFocusedElRef = React.useRef<HTMLElement | null>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Scroll lock safety
  useEffect(() => {
    const shouldLock = !!selectedProperty || showMatchModal;
    if (shouldLock) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProperty, showMatchModal]);

  useEffect(() => {
    setMaxPrice("any");
  }, [buyRent]);

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

  // display "Zona · Bairro"
  const locationLabel = (p: Property) =>
    p.neighborhood ? `${p.location} · ${p.neighborhood}` : p.location;

  // Load properties from Supabase
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setPropertiesError(null);
        setLoadingProperties(true);

        const { data, error } = await supabase
          .from("property_listings")
          .select(
            `
            id,
            user_id,
            status,
            buy_rent,
            property_type,
            title,
            description,
            price,
            currency,
            location,
            location_area,
            location_neighborhood,
            bedrooms,
            bathrooms,
            usable_area,
            gross_area,
            land_area,
            condition,
            furnished,
            divisions,
            energy_certificate,
            images,
            publisher_type,
            is_price_negotiable,
            contact_name,
            contact_email,
            contact_phone
          `
          )
          .eq("status", "active");

        if (error) {
          console.error("Error loading properties from Supabase:", error);
          setPropertiesError(
            isPT
              ? "Não foi possível carregar os imóveis."
              : "Failed to load properties."
          );
          setProperties([]);
          return;
        }

        const dbProps = (data as PropertyRow[]).map(mapRowToProperty);
        setProperties(dbProps);
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locations = useMemo(() => {
    const set = new Set<string>();
    CASCAIS_AREAS.forEach((l) => set.add(l));
    properties.forEach((p) => {
      if (p.location) set.add(p.location);
    });
    return Array.from(set);
  }, [properties]);

  // neighborhoods list depends on selected area
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

    // area filter
    if (locationArea !== "all")
      list = list.filter((p) => p.location === locationArea);

    // neighborhood filter (only when area selected)
    if (locationNeighborhood !== "all" && locationArea !== "all") {
      list = list.filter(
        (p) => (p.neighborhood ?? "") === locationNeighborhood
      );
    }

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

    // IMPORTANT: Paid/featured sorting disabled for now (free platform)

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);

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

  const hasFilters =
    buyRent !== "all" ||
    locationArea !== "all" ||
    (locationArea !== "all" && locationNeighborhood !== "all") ||
    propertyType !== "all" ||
    bedrooms !== "any" ||
    bathrooms !== "any" ||
    maxPrice !== "any" ||
    minArea !== "any" ||
    maxArea !== "any" ||
    sortBy !== "default";

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

  const handleListPropertyClick = () => {
    if (user) navigate("/properties/new");
    else navigate("/auth", { state: { from: "/properties/new" } });
  };

  const formatBuyRentLabel = (p: { buyRent: BuyRent }) => {
    if (p.buyRent === "rent") return isPT ? "Para arrendar" : "For rent";
    if (p.buyRent === "buy") return isPT ? "Para venda" : "For sale";
    return isPT ? "Imóvel" : "Property";
  };

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

  const selectedImages =
    selectedProperty?.images ??
    (selectedProperty?.image ? [selectedProperty.image] : []);

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

  // OWNER ACTIONS (edit + delete)
  const isOwner =
    !!user && !!selectedProperty && selectedProperty.ownerId === user.id;

  const handleEditListing = () => {
    if (!selectedProperty || !user) return;
    closePropertyModal();
    navigate(`/properties/${selectedProperty.id}/edit`);
  };

  const handleDeleteListing = async () => {
    if (!selectedProperty || !user) return;

    const confirmText = isPT
      ? "Tem a certeza que quer remover este anúncio? Esta ação é permanente."
      : "Are you sure you want to remove this listing? This action is permanent.";

    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;

    const { error } = await supabase
      .from("property_listings")
      .delete()
      .eq("id", selectedProperty.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting listing:", error);
      alert(
        isPT
          ? "Ocorreu um erro ao remover o anúncio."
          : "Something went wrong while removing the listing."
      );
      return;
    }

    setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
    closePropertyModal();
  };

  const areaLabel =
    propertyType === "land"
      ? isPT
        ? "Área do terreno (m²)"
        : "Land area (m²)"
      : isPT
      ? "Área útil (m²)"
      : "Usable area (m²)";

  if (loadingProperties) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] py-10">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="h-40 rounded-3xl bg-white border border-slate-100 shadow-sm mb-8 animate-pulse" />
          <div className="h-28 rounded-3xl bg-white border border-slate-100 shadow-sm mb-6 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  // zona chip
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

  // bairro chip
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
  if (sortBy !== "default") {
    appliedChips.push({
      key: "sortBy",
      label:
        sortBy === "price-asc"
          ? isPT
            ? "Preço: baixo → alto"
            : "Price: low → high"
          : isPT
          ? "Preço: alto → baixo"
          : "Price: high → low",
      onRemove: () => setSortBy("default"),
    });
  }

  return (
    <div className="min-h-screen bg-transparent py-3">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* 🏡 Living in Cascais HERO (Top level framing) */}
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
                  "linear-gradient(90deg, rgba(2,6,23,0.78) 0%, rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.25) 100%)",
              }}
            />
            <div className="relative px-5 py-5 sm:px-8 sm:py-7">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
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
                      ? "Casas, zonas e serviços — no mesmo lugar."
                      : "Homes and neighborhoods — in one place."}
                  </h1>

                  <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl">
                    {isPT
                      ? "Descubra imóveis com contexto local: zonas, lifestyle e serviços úteis para o dia-a-dia em Cascais."
                      : "Discover homes with local context: areas, lifestyle, and services that make moving (and living) easier in Cascais."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={scrollToFilters}
                      className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold shadow hover:bg-white/90 transition"
                    >
                      {isPT ? "Ver imóveis" : "Browse homes"}
                      <span className="ml-2">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMatch("buyer")}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow hover:bg-emerald-600 transition"
                    >
                      {isPT ? "Receber sugestões (24h)" : "Get matches (24h)"}
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

                {/* Your existing “Featured partner” block (kept, but framed as a collection) */}
                <div className="w-full lg:w-95">
                  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      {isPT ? "Coleção em Destaque" : "Featured Collection"}
                    </div>
                    <div
                      className="mt-1 text-lg font-semibold text-white tracking-wide"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      CHIOSS
                    </div>
                    <div className="mt-1 text-xs text-white/75">
                      {isPT
                        ? "Vida costeira de luxo em Portugal"
                        : "Luxury coastal living in Portugal"}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          window.open("https://chioss.com", "_blank")
                        }
                        className="flex-1 inline-flex items-center justify-center rounded-xl bg-white text-slate-900 px-4 py-2 text-xs font-semibold shadow hover:bg-white/90 transition"
                      >
                        {isPT ? "Ver coleção" : "View"}
                        <span className="ml-2">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky filter bar (kept, but now anchored as “Homes of Cascais”) */}
        <section className="mb-6 sticky top-2 sm:top-3 z-20" ref={filtersRef}>
          <div className="bg-white/92 backdrop-blur rounded-3xl shadow-md border border-slate-100 px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-700">
                  {isPT ? "Homes of Cascais" : "Homes of Cascais"}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {isPT
                    ? "Filtre por zona/bairro e encontre o seu lugar."
                    : "Filter by area/neighborhood and find your place."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-3 py-2 hover:bg-slate-50 active:scale-[0.99] transition"
                  >
                    {isPT ? "Limpar" : "Clear"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMoreFilters((v) => !v)}
                  className="inline-flex items-center justify-center rounded-full border border-[#1F6FA6] bg-white text-[#1F6FA6] text-xs font-semibold px-3 py-2 hover:bg-blue-50 active:scale-[0.99] transition"
                >
                  {showMoreFilters
                    ? isPT
                      ? "Menos filtros"
                      : "Less filters"
                    : isPT
                    ? "Mais filtros"
                    : "More filters"}
                </button>
              </div>
            </div>

            {/* Primary filters */}
            <div className="md:grid md:grid-cols-5 md:gap-3 flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              <div className="flex flex-col gap-1 shrink-0 w-55 md:w-auto md:col-span-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Comprar / Arrendar" : "Buy / Rent"}
                </label>
                <select
                  value={buyRent}
                  onChange={(e) => setBuyRent(e.target.value as BuyRent)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full bg-white"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="buy">{isPT ? "Comprar" : "Buy"}</option>
                  <option value="rent">{isPT ? "Arrendar" : "Rent"}</option>
                </select>
              </div>

              {/* Zona */}
              <div className="flex flex-col gap-1 shrink-0 w-55 md:w-auto">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Zona" : "Area"}
                </label>
                <select
                  value={locationArea}
                  onChange={(e) => {
                    setLocationArea(e.target.value);
                    setLocationNeighborhood("all");
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                >
                  <option value="all">{isPT ? "Todas" : "All"}</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bairro */}
              <div className="flex flex-col gap-1 shrink-0 w-55 md:w-auto">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Bairro" : "Neighborhood"}
                </label>
                <select
                  value={locationNeighborhood}
                  onChange={(e) => setLocationNeighborhood(e.target.value)}
                  disabled={locationArea === "all"}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white disabled:opacity-50"
                >
                  <option value="all">
                    {locationArea === "all"
                      ? isPT
                        ? "Escolha uma zona"
                        : "Pick an area first"
                      : isPT
                      ? "Todos"
                      : "All"}
                  </option>
                  {neighborhoodsForArea.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 shrink-0 w-55 md:w-auto">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Tipo de imóvel" : "Property type"}
                </label>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as PropertyType)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="apartment">
                    {isPT ? "Apartamento" : "Apartment"}
                  </option>
                  <option value="house">{isPT ? "Moradia" : "House"}</option>
                  <option value="land">{isPT ? "Terreno" : "Land"}</option>
                  <option value="commercial">
                    {isPT ? "Espaço Comercial" : "Commercial"}
                  </option>
                  <option value="warehouse">
                    {isPT ? "Armazém" : "Warehouse"}
                  </option>
                  <option value="garage">{isPT ? "Garagem" : "Garage"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 shrink-0 w-55 md:w-auto">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isPT ? "Preço máx." : "Max price"}
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                >
                  <option value="any">
                    {isPT ? "Sem limite" : "No limit"}
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

                  {buyRent === "all" && (
                    <option value="any" disabled>
                      {isPT
                        ? "Escolha Comprar ou Arrendar"
                        : "Pick Buy or Rent"}
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* More filters */}
            {showMoreFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-600 mb-3">
                  {isPT ? "Filtros avançados" : "Advanced filters"}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {isPT ? "Ordenar" : "Sort"}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | "default"
                            | "price-asc"
                            | "price-desc"
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    >
                      <option value="default">
                        {isPT ? "Recomendado" : "Recommended"}
                      </option>
                      <option value="price-asc">
                        {isPT ? "Mais barato" : "Lowest price"}
                      </option>
                      <option value="price-desc">
                        {isPT ? "Mais caro" : "Highest price"}
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {isPT ? "Quartos" : "Bedrooms"}
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {isPT ? "Casas de banho" : "Bathrooms"}
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    >
                      <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      {areaLabel}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={minArea}
                        onChange={(e) => setMinArea(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                      >
                        <option value="any">{isPT ? "Mín." : "Min"}</option>
                        {AREA_STEPS.map((val) => (
                          <option key={`min-${val}`} value={val}>
                            {val} m²
                          </option>
                        ))}
                      </select>

                      <select
                        value={maxArea}
                        onChange={(e) => setMaxArea(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                      >
                        <option value="any">{isPT ? "Máx." : "Max"}</option>
                        {AREA_STEPS.map((val) => (
                          <option key={`max-${val}`} value={val}>
                            {val} m²
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applied chips */}
            {appliedChips.length > 0 && (
              <div className="mt-4 -mx-1 px-1">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {appliedChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={c.onRemove}
                      className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition"
                      aria-label={isPT ? "Remover filtro" : "Remove filter"}
                      title={isPT ? "Remover" : "Remove"}
                    >
                      {c.label}
                      <span className="text-slate-400">✕</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {propertiesError && (
              <p className="mt-3 text-[11px] text-red-500">
                {isPT
                  ? "Não foi possível carregar todos os imóveis neste momento."
                  : "Some properties could not be loaded right now."}
              </p>
            )}
          </div>
        </section>

        {/* Results header + 2 CTAs (buyer + owner) */}
        <section className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {filteredProperties.length}{" "}
              {isPT ? "imóveis encontrados" : "properties found"}
            </p>

            <div className="mt-1 text-[11px] text-slate-600">
              {[
                buyRent !== "all"
                  ? buyRent === "buy"
                    ? isPT
                      ? "Comprar"
                      : "Buy"
                    : isPT
                    ? "Arrendar"
                    : "Rent"
                  : null,
                locationArea !== "all" ? locationArea : null,
                locationArea !== "all" && locationNeighborhood !== "all"
                  ? locationNeighborhood
                  : null,
                propertyType !== "all"
                  ? formatTypeLabel(propertyType, isPT)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") ||
                (isPT ? "Cascais e arredores" : "Cascais & nearby")}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openMatch("buyer")}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow hover:bg-emerald-700 transition"
            >
              {isPT ? "Receber sugestões" : "Get matches"}
            </button>

            <button
              type="button"
              onClick={() => openMatch("owner")}
              className="inline-flex items-center justify-center rounded-full border border-[#1F6FA6] bg-white text-[#1F6FA6] text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow-sm hover:bg-blue-50 transition"
            >
              {isPT ? "Sou proprietário" : "I'm an owner"}
            </button>

            <button
              type="button"
              onClick={handleListPropertyClick}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow-sm hover:bg-slate-50 transition"
            >
              {isPT ? "Anunciar propriedade" : "List property"}
            </button>
          </div>
        </section>

        {/* Property cards */}
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
                className="cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md transition"
              >
                {coverImage && (
                  <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={coverImage}
                      alt={property.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    {property.isPriceNegotiable ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1">
                        {isPT ? "Negociável" : "Negotiable"}
                      </span>
                    ) : null}

                    <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 px-2.5 py-1">
                      {property.publisherType === "agency"
                        ? isPT
                          ? "Agência"
                          : "Agency"
                        : isPT
                        ? "Particular"
                        : "Owner"}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {locationLabel(property)}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
                  {property.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {property.description}
                </p>

                {/* Context row (adds “Living in Cascais” feel, not portal feel) */}
                <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#FAF8F4] border border-slate-200 px-2 py-0.5">
                    {formatTypeLabel(property.type, isPT)}
                  </span>

                  {ppsm != null && (
                    <span className="rounded-full bg-[#FAF8F4] border border-slate-200 px-2 py-0.5">
                      €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}/m²
                    </span>
                  )}

                  {property.energyCertificate && (
                    <span className="rounded-full bg-[#FAF8F4] border border-slate-200 px-2 py-0.5">
                      {isPT ? "CE" : "EC"}: {property.energyCertificate}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <div className="flex flex-col">
                    <div className="text-lg font-bold text-[#1F6FA6]">
                      €{property.price.toLocaleString(isPT ? "pt-PT" : "en-US")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {property.buyRent === "rent"
                        ? isPT
                          ? "por mês"
                          : "per month"
                        : isPT
                        ? "preço de venda"
                        : "sale price"}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 text-right">
                    <div>
                      {property.bedrooms} {isPT ? "q." : "bd"} ·{" "}
                      {property.bathrooms} {isPT ? "wc" : "ba"}
                    </div>
                    <div>
                      {property.type === "land"
                        ? `${property.landArea ?? 0} m²`
                        : `${property.usableArea ?? 0} m²`}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredProperties.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <div className="text-sm font-semibold text-slate-800">
                {isPT
                  ? "Sem resultados para estes filtros"
                  : "No results for these filters"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {isPT
                  ? "Experimente remover zona/bairro, aumentar o preço máximo ou ajustar área."
                  : "Try removing area/neighborhood, increasing max price, or adjusting area."}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center rounded-full bg-[#1F6FA6] text-white text-xs font-semibold px-5 py-2.5 shadow hover:bg-[#195c8a]"
                  >
                    {isPT ? "Limpar filtros" : "Clear filters"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openMatch("buyer")}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold px-5 py-2.5 shadow hover:bg-emerald-700"
                >
                  {isPT ? "Quero sugestões" : "Get matches"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Guides (in-page, so you don’t need new routes yet) */}
        <section className="pb-6">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                {isPT ? "Guias rápidos" : "Quick guides"}
              </h2>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600">
                {isPT
                  ? "Conteúdo curto e útil — pensado para Cascais."
                  : "Short, practical content — tailored for Cascais."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guides.map((g) => {
              const isOpen = openGuide === g.key;
              return (
                <div
                  key={g.key}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/living/guides/${g.key}`)}
                    className="w-full text-left p-5 sm:p-6 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {g.title}
                        </div>
                        <div className="mt-1 text-[11px] sm:text-xs text-slate-600">
                          {g.desc}
                        </div>
                      </div>
                      <div className="text-slate-400 text-lg leading-none">
                        {isOpen ? "−" : "+"}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                      <div className="rounded-2xl bg-[#FAF8F4] border border-slate-200 p-4">
                        <ul className="list-disc pl-5 text-[11px] sm:text-xs text-slate-700 space-y-2">
                          {g.bullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openMatch("buyer")}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 shadow hover:bg-emerald-700 transition"
                          >
                            {isPT ? "Pedir ajuda (24h)" : "Get help (24h)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenGuide(null);
                              scrollToFilters();
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition"
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

      {/* MATCH MODAL (buyer/owner) */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <div className="text-[11px] font-semibold text-[#1F6FA6]">
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
                      ? "Quer destacar o seu imóvel em Cascais?"
                      : "Want to feature your home in Cascais?"
                    : isPT
                    ? "Diga-nos o que procura (resposta em 24h)"
                    : "Tell us what you need (reply in 24h)"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeMatch}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                ✕
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
                      ? "border-[#1F6FA6] bg-blue-50 text-[#1F6FA6]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
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
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    placeholder={isPT ? "O seu nome" : "Your name"}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Email
                  </label>
                  <input
                    value={matchEmail}
                    onChange={(e) => setMatchEmail(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {isPT ? "Telefone (opcional)" : "Phone (optional)"}
                  </label>
                  <input
                    value={matchPhone}
                    onChange={(e) => setMatchPhone(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                    placeholder={isPT ? "+351 ..." : "+351 ..."}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {matchType === "owner"
                      ? isPT
                        ? "Fale-nos do imóvel (zona, tipologia, objetivo)"
                        : "Tell us about the home (area, type, goal)"
                      : isPT
                      ? "O que procura? (zona, orçamento, tipologia, timing)"
                      : "What are you looking for? (area, budget, type, timing)"}
                  </label>
                  <textarea
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white min-h-27.5"
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
                    ? "Ao enviar, irá abrir o seu e-mail com o pedido preenchido."
                    : "Submitting will open your email client with the request pre-filled."}
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
                    className="inline-flex items-center justify-center rounded-full bg-[#1F6FA6] text-white text-xs font-semibold px-5 py-2 shadow hover:bg-[#195c8a] transition"
                  >
                    {isPT ? "Enviar pedido" : "Send request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROPERTY DETAIL MODAL (your existing modal kept) */}
      {selectedProperty && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100 bg-slate-50/80">
              <div>
                <p className="text-[11px] font-medium text-[#1F6FA6] mb-0.5">
                  {formatBuyRentLabel(selectedProperty)} ·{" "}
                  {locationLabel(selectedProperty)}
                </p>
                <h2
                  id="property-modal-title"
                  className="text-sm sm:text-lg font-semibold text-slate-900"
                >
                  {selectedProperty.title}
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closePropertyModal}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left: gallery */}
              <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-900/3">
                <div className="relative w-full bg-slate-900/5">
                  <div className="relative w-full aspect-16/10 md:aspect-16/11 overflow-hidden">
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
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-slate-400 text-xs">
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700"
                          aria-label={
                            isPT ? "Imagem anterior" : "Previous image"
                          }
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700"
                          aria-label={isPT ? "Seguinte" : "Next image"}
                        >
                          ›
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
                  <div className="px-3 sm:px-4 py-2 border-t border-slate-100 bg-slate-900/2">
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedImages.map((src, idx) => (
                        <button
                          key={src + idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-20 aspect-4/3 rounded-xl overflow-hidden border transition shrink-0 ${
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
                            decoding="async"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: info */}
              <div className="md:w-1/2 flex flex-col overflow-y-auto bg-linear-to-b from-white to-slate-50">
                {/* MAIN CONTENT (scrollable) */}
                <div className="p-5 sm:p-7">
                  {/* Top meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center rounded-full bg-[#1F6FA6]/10 text-[#1F6FA6] text-[11px] font-semibold px-3 py-1">
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
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-semibold px-3 py-1">
                        {isPT ? "Negociável" : "Negotiable"}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
                    {selectedProperty.title}
                  </h3>

                  {/* Location */}
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    {locationLabel(selectedProperty)}
                  </p>

                  {/* Price card */}
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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

                          <div className="mt-1 text-[11px] text-slate-500">
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
                                {isPT ? "€/m²" : "€/m²"}
                              </div>
                              <div className="text-sm sm:text-base font-bold text-[#1F6FA6]">
                                €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Quick stats row */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "Quartos" : "Bedrooms"}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {selectedProperty.bedrooms}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "WC" : "Baths"}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {selectedProperty.bathrooms}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "Área" : "Area"}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
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
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {isPT ? "Detalhes" : "Details"}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {formatTypeLabel(selectedProperty.type, isPT)}
                      </span>
                    </div>

                    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
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

                        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <dt className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "Área bruta" : "Gross"}
                          </dt>
                          <dd className="mt-0.5 font-semibold text-slate-900">
                            {selectedProperty.grossArea
                              ? `${selectedProperty.grossArea} m²`
                              : "—"}
                          </dd>
                        </div>

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

                        {selectedProperty.divisions != null &&
                          selectedProperty.divisions > 0 && (
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                              <dt className="text-[10px] font-semibold text-slate-500">
                                {isPT ? "Divisões" : "Rooms"}
                              </dt>
                              <dd className="mt-0.5 font-semibold text-slate-900">
                                {selectedProperty.divisions}
                              </dd>
                            </div>
                          )}

                        <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                          <dt className="text-[10px] font-semibold text-slate-500">
                            {isPT ? "Localização" : "Location"}
                          </dt>
                          <dd className="mt-0.5 font-semibold text-slate-900 wrap-break-word">
                            {locationLabel(selectedProperty)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {isPT ? "Descrição" : "Description"}
                    </h4>
                    <div className="mt-2 rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {selectedProperty.description}
                      </p>
                    </div>
                  </div>

                  {/* Owner controls (only edit/delete while free features) */}
                  {isOwner && selectedProperty && (
                    <div className="mt-6 flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleEditListing}
                        className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-amber-600"
                      >
                        {isPT ? "Editar anúncio" : "Edit listing"}
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteListing}
                        className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-red-700"
                      >
                        {isPT ? "Remover anúncio" : "Remove listing"}
                      </button>
                    </div>
                  )}
                </div>

                {/* CONTACT FOOTER */}
                <div className="mt-auto border-t border-slate-200 bg-white/90 backdrop-blur px-5 sm:px-7 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[11px] sm:text-xs text-slate-600">
                      <div className="font-semibold text-slate-900">
                        {selectedProperty.publisherType === "agency"
                          ? isPT
                            ? "Agência"
                            : "Agency"
                          : isPT
                          ? "Particular"
                          : "Owner"}
                      </div>
                      <div className="mt-0.5">
                        {selectedProperty.agentName ? (
                          isPT ? (
                            <>Representado por {selectedProperty.agentName}.</>
                          ) : (
                            <>Represented by {selectedProperty.agentName}.</>
                          )
                        ) : isPT ? (
                          "Contacto disponível no anúncio."
                        ) : (
                          "Contact available on listing."
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {selectedProperty.agentPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `tel:${selectedProperty.agentPhone}`;
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-emerald-700"
                        >
                          {isPT ? "Ligar" : "Call"}
                        </button>
                      )}

                      {selectedProperty.agentEmail && (
                        <button
                          type="button"
                          onClick={handleCopyAgentEmail}
                          className="inline-flex items-center justify-center rounded-full bg-[#1F6FA6] text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-[#195c8a] transition"
                        >
                          {hasCopiedEmail
                            ? isPT
                              ? "Copiado"
                              : "Copied"
                            : showAgentEmail
                            ? isPT
                              ? "Copiar e-mail"
                              : "Copy email"
                            : isPT
                            ? "Mostrar e-mail"
                            : "Show email"}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedProperty.agentEmail &&
                    showAgentEmail &&
                    !hasCopiedEmail && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        {isPT
                          ? `E-mail: ${selectedProperty.agentEmail} (clique novamente para copiar)`
                          : `Email: ${selectedProperty.agentEmail} (tap again to copy)`}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Mobile CTA strip */}
            <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
              <div className="flex gap-2">
                {selectedProperty.agentPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `tel:${selectedProperty.agentPhone}`;
                    }}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 shadow hover:bg-emerald-700"
                  >
                    {isPT ? "Ligar" : "Call"}
                  </button>
                )}
                {selectedProperty.agentEmail && (
                  <button
                    type="button"
                    onClick={handleCopyAgentEmail}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-[#1F6FA6] text-white text-sm font-semibold px-4 py-2.5 shadow hover:bg-[#195c8a]"
                  >
                    {hasCopiedEmail
                      ? isPT
                        ? "Copiado"
                        : "Copied"
                      : showAgentEmail
                      ? isPT
                        ? "Copiar"
                        : "Copy"
                      : isPT
                      ? "E-mail"
                      : "Email"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstatePage;
