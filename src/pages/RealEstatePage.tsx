// src/pages/RealEstatePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  location: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  usableArea: number; // m²

  // ✅ extra listing details
  grossArea?: number | null;
  landArea?: number | null;
  condition?: string | null;
  furnished?: "yes" | "no" | "partial" | null;
  energyCertificate?: string | null;
  divisions?: number | null;

  image?: string;
  images?: string[];
  isPriceNegotiable?: boolean;

  // who represents this listing (for your user listings, this is contact details)
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;

  // owner
  ownerId?: string;
}

// Shape of a row in Supabase "property_listings" table
type PropertyRow = {
  id: string | number;
  user_id: string;

  status: "active" | "sold" | "rented" | null;

  title: string;
  description: string | null;
  price: number;
  currency: string | null;

  buy_rent: "buy" | "rent";
  location: string;

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

  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

// Map DB row → UI Property
const mapRowToProperty = (row: PropertyRow): Property => ({
  id: String(row.id),
  status: (row.status ?? "active") as Property["status"],

  title: row.title,
  description: row.description ?? "",
  price: row.price,
  currency: "EUR",

  buyRent: row.buy_rent as BuyRent,
  location: row.location,
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
  ownerId: row.user_id,

  isPriceNegotiable: !!row.is_price_negotiable,

  // ✅ show represented-by + call + email for user-created listings
  agentName: row.contact_name ?? undefined,
  agentEmail: row.contact_email ?? undefined,
  agentPhone: row.contact_phone ?? undefined,
});

// -------- helpers --------

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

const BASE_LOCATIONS = [
  "Cascais",
  "Estoril",
  "Monte Estoril",
  "São João do Estoril",
  "São Pedro do Estoril",
  "Carcavelos",
  "Parede",
  "Alcabideche",
  "São Domingos de Rana",
];

const AREA_STEPS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275,
  300, 350,
];

const RealEstatePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";

  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters
  const [buyRent, setBuyRent] = useState<BuyRent>("all");
  const [location, setLocation] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<PropertyType>("all");
  const [bedrooms, setBedrooms] = useState<string>("any");
  const [bathrooms, setBathrooms] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">(
    "default"
  );
  const [minArea, setMinArea] = useState<string>("any");
  const [maxArea, setMaxArea] = useState<string>("any");

  // Agent email reveal/copy
  const [showAgentEmail, setShowAgentEmail] = useState(false);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  // Properties from DB + static demo
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  // Property detail modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Concierge / request form modal
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState<"rent" | "buy">("rent");
  const [requestName, setRequestName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestFrom, setRequestFrom] = useState("");
  const [requestTo, setRequestTo] = useState("");
  const [requestSize, setRequestSize] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

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
            is_price_negotiable,
            contact_name,
            contact_email,
            contact_phone
          `
          )
          .eq("status", "active");

        if (error) {
          console.error("Error loading properties from Supabase:", error);
          setPropertiesError("Failed to load properties.");
          setProperties([]); // no fallback
          return;
        }

        const dbProps = (data as PropertyRow[]).map(mapRowToProperty);
        setProperties(dbProps);
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  const formatPricePerSqm = (p: Property) => {
    const area = p.usableArea ?? 0; // if you want land to use land_area, we can extend this
    if (!area || area <= 0) return null;
    const perSqm = Math.round((p.price / area) * 100) / 100;
    return perSqm;
  };

  const filteredProperties = useMemo(() => {
    let list = [...properties];

    if (buyRent !== "all") list = list.filter((p) => p.buyRent === buyRent);
    if (location !== "all") list = list.filter((p) => p.location === location);
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
      if (!Number.isNaN(n)) list = list.filter((p) => p.usableArea >= n);
    }

    if (maxArea !== "any") {
      const n = Number(maxArea);
      if (!Number.isNaN(n)) list = list.filter((p) => p.usableArea <= n);
    }

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);

    return list;
  }, [
    properties,
    buyRent,
    location,
    propertyType,
    bedrooms,
    bathrooms,
    maxPrice,
    minArea,
    maxArea,
    sortBy,
  ]);

  const handleListPropertyClick = () => {
    if (user) navigate("/properties/new");
    else navigate("/auth", { state: { from: "/properties/new" } });
  };

  const locations = Array.from(
    new Set([...BASE_LOCATIONS, ...properties.map((p) => p.location)])
  );

  const formatBuyRentLabel = (p: { buyRent: BuyRent }) => {
    if (p.buyRent === "rent") return isPT ? "Para arrendar" : "For rent";
    if (p.buyRent === "buy") return isPT ? "Para venda" : "For sale";
    return isPT ? "Imóvel" : "Property";
  };

  const openPropertyModal = (property: Property) => {
    setSelectedProperty(property);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
    document.body.style.overflow = "hidden";
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    setActiveImageIndex(0);
    setShowAgentEmail(false);
    setHasCopiedEmail(false);
    document.body.style.overflow = "";
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
      prev - 1 < 0 ? selectedProperty.images!.length - 1 : prev - 1
    );
  };

  const selectedImages =
    selectedProperty?.images ??
    (selectedProperty?.image ? [selectedProperty.image] : []);

  // Request form helpers
  const openRequestForm = () => {
    setShowRequestForm(true);
    document.body.style.overflow = "hidden";
  };

  const closeRequestForm = () => {
    setShowRequestForm(false);
    document.body.style.overflow = "";
  };

  const handleCopyAgentEmail = async () => {
    if (!selectedProperty?.agentEmail) return;

    // First click → reveal email
    if (!showAgentEmail) {
      setShowAgentEmail(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedProperty.agentEmail);
      setHasCopiedEmail(true);
      setTimeout(() => setHasCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("property_search_requests").insert({
      type: requestType,
      name: requestName,
      email: requestEmail,
      phone: requestPhone || null,
      from_date: requestType === "rent" && requestFrom ? requestFrom : null,
      to_date: requestType === "rent" && requestTo ? requestTo : null,
      min_size: requestSize ? Number(requestSize) : null,
      notes: requestNotes || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      alert(
        isPT
          ? "Ocorreu um erro ao enviar o pedido. Tente novamente mais tarde."
          : "There was an error sending your request. Please try again later."
      );
      return;
    }

    alert(
      isPT
        ? "Obrigado! Recebemos o seu pedido e entraremos em contacto em breve."
        : "Thank you! We’ve received your request and will get back to you soon."
    );

    closeRequestForm();
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

  if (loadingProperties) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isPT ? "A carregar imóveis..." : "Loading properties..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* CHIOSS highlight */}
        <div className="mb-8">
          <div
            className="relative group rounded-2xl bg-cover bg-center bg-no-repeat border border-slate-200 shadow-md px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-5 text-white overflow-hidden transform transition duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.01]"
            style={{ backgroundImage: "url('/cascais-coast.png')" }}
          >
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full gap-5">
              <div className="text-left drop-shadow-xl">
                <div className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-1 opacity-90">
                  {isPT ? "Parceiro em Destaque" : "Featured Partner"}
                </div>

                <span
                  className="block text-2xl sm:text-3xl font-semibold tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  CHIOSS
                </span>

                <span
                  className="block text-base sm:text-lg mt-1 opacity-90"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {isPT
                    ? "Vida costeira de luxo em Portugal"
                    : "Luxury Coastal Living in Portugal"}
                </span>

                <p className="mt-2 text-[13px] sm:text-sm max-w-xl leading-relaxed opacity-90">
                  {isPT
                    ? "Casas selecionadas em Cascais, Estoril, Carcavelos e Lisboa — destacadas em exclusivo com a AllCascais Real Estate."
                    : "Curated homes across Cascais, Estoril, Carcavelos and Lisbon — exclusively highlighted with AllCascais Real Estate."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => window.open("https://chioss.com", "_blank")}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white px-6 py-3 text-xs sm:text-sm font-medium shadow hover:bg-white/30 transition"
                >
                  {isPT
                    ? "Explorar imóveis CHIOSS"
                    : "Explore CHIOSS Properties"}
                  <span className="ml-2">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open("https://chioss.com", "_blank")}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-md border border-white/30 text-white px-6 py-3 text-xs sm:text-sm font-medium hover:bg-black/55 transition"
                >
                  {isPT ? "Estudo de Mercado" : "Market Study"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER CARD */}
        <section className="mb-8">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 px-4 sm:px-6 py-4 sm:py-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-slate-600">
                  🏡 {isPT ? "Comprar / Arrendar" : "Buy / Rent"}
                </label>
                <select
                  value={buyRent}
                  onChange={(e) => setBuyRent(e.target.value as BuyRent)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="buy">{isPT ? "Comprar" : "Buy"}</option>
                  <option value="rent">{isPT ? "Arrendar" : "Rent"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  📍 {isPT ? "Localização" : "Location"}
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="all">
                    {isPT ? "🌍 Todas" : "🌍 All locations"}
                  </option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  🏘️ {isPT ? "Tipo de imóvel" : "Property Type"}
                </label>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as PropertyType)
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="all">{isPT ? "Todos" : "All"}</option>
                  <option value="apartment">
                    {isPT ? "Apartamento" : "Apartment"}
                  </option>
                  <option value="house">{isPT ? "Moradia" : "House"}</option>
                  <option value="land">{isPT ? "Terreno" : "Land"}</option>
                  <option value="commercial">
                    {isPT ? "Espaço Comercial" : "Commercial Space"}
                  </option>
                  <option value="warehouse">
                    {isPT ? "Armazém" : "Warehouse"}
                  </option>
                  <option value="garage">{isPT ? "Garagem" : "Garage"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  🛏 {isPT ? "Quartos" : "Bedrooms"}
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  🛁 {isPT ? "Casas de banho" : "Bathrooms"}
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="any">{isPT ? "Qualquer" : "Any"}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  💶 {isPT ? "Ordenar por preço" : "Sort by Price"}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "default" | "price-asc" | "price-desc"
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="default">{isPT ? "Padrão" : "Default"}</option>
                  <option value="price-asc">
                    {isPT ? "Mais barato primeiro" : "Lowest first"}
                  </option>
                  <option value="price-desc">
                    {isPT ? "Mais caro primeiro" : "Highest first"}
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  💰 {isPT ? "Preço máximo" : "Max price"}
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="any">
                    {isPT ? "Sem limite" : "No limit"}
                  </option>
                  <option value="1000">€1.000</option>
                  <option value="2000">€2.000</option>
                  <option value="3000">€3.000</option>
                  <option value="500000">€500.000</option>
                  <option value="1000000">€1.000.000</option>
                  <option value="2000000">€2.000.000</option>
                  <option value="4000000">€4.000.000</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  📏 {isPT ? "Área útil (m²)" : "Usable area (m²)"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="any">
                      {isPT ? "De (mín.)" : "From (min.)"}
                    </option>
                    {AREA_STEPS.map((val) => (
                      <option key={`min-${val}`} value={val}>
                        {isPT ? `De ${val} m²` : `From ${val} m²`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="any">
                      {isPT ? "Até (máx.)" : "Up to (max.)"}
                    </option>
                    {AREA_STEPS.map((val) => (
                      <option key={`max-${val}`} value={val}>
                        {isPT ? `Até ${val} m²` : `Up to ${val} m²`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {propertiesError && (
              <p className="mt-3 text-[11px] text-red-500">
                {isPT
                  ? "Não foi possível carregar todos os imóveis neste momento."
                  : "Some properties could not be loaded right now."}
              </p>
            )}
          </div>
        </section>

        {/* RESULTS SUMMARY + CONCIERGE BUTTON */}
        <section className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {filteredProperties.length}{" "}
              {isPT ? "imóveis encontrados" : "properties found"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-800 flex items-center gap-2">
              <span role="img" aria-hidden="true">
                🏡
              </span>
              <span>{isPT ? "Todos os imóveis" : "All Properties"}</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={openRequestForm}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow hover:bg-sky-700 transition"
            >
              <svg
                className="mr-1.5 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 10.5V21h14V10.5" />
                <path d="M10 21v-6h4v6" />
              </svg>
              {isPT ? "Encontrar imóvel para mim" : "Help me find a property"}
            </button>

            <button
              type="button"
              onClick={handleListPropertyClick}
              className="inline-flex items-center justify-center rounded-full border border-sky-600 bg-white text-sky-700 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow-sm hover:bg-sky-50 transition"
            >
              <svg
                className="mr-1.5 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 11L12 4l9 7" />
                <path d="M5 11v9h14v-9" />
                <path d="M10 20v-5h4v5" />
                <path d="M18 3v4" />
                <path d="M16 5h4" />
              </svg>
              {isPT ? "Anunciar o meu imóvel" : "List my property"}
            </button>
          </div>
        </section>

        {/* PROPERTY CARDS */}
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
                className="cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition"
              >
                {coverImage && (
                  <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={coverImage}
                      alt={property.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {property.isPriceNegotiable ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-3 py-1">
                      {isPT ? "Preço negociável" : "Price negotiable"}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-slate-400">
                    {property.location}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 leading-snug mt-1">
                  {property.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {property.description}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>
                    🛏 {property.bedrooms} {isPT ? "quartos" : "bedrooms"}
                  </span>
                  <span>
                    🛁 {property.bathrooms}{" "}
                    {isPT ? "casas de banho" : "bathrooms"}
                  </span>
                  <span>
                    📏 {property.usableArea} m²{" "}
                    {isPT ? "área útil" : "usable area"}
                  </span>
                </div>

                {/* extra compact chips */}
                <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                    {formatTypeLabel(property.type, isPT)}
                  </span>

                  {ppsm != null && (
                    <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                      €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}/m²
                    </span>
                  )}

                  {property.energyCertificate && (
                    <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                      {isPT ? "CE" : "EC"}: {property.energyCertificate}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-sky-600">
                        €{property.price.toLocaleString("en-US")}
                      </div>

                      {formatPricePerSqm(property) != null && (
                        <div className="text-[11px] font-semibold text-slate-500">
                          (€
                          {formatPricePerSqm(property)!.toLocaleString("en-US")}
                          /m²)
                        </div>
                      )}
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
                </div>
              </article>
            );
          })}

          {filteredProperties.length === 0 && (
            <div className="col-span-full text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              {isPT
                ? "Ainda não há imóveis que correspondam aos filtros. Experimente ajustar a pesquisa."
                : "No properties match your filters yet. Try adjusting your search."}
            </div>
          )}
        </section>
      </div>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100 bg-slate-50/80">
              <div>
                <p className="text-[11px] font-medium text-sky-600 mb-0.5">
                  {formatBuyRentLabel(selectedProperty)} ·{" "}
                  {selectedProperty.location}
                </p>
                <h2 className="text-sm sm:text-lg font-semibold text-slate-900">
                  {selectedProperty.title}
                </h2>
              </div>
              <button
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
                  {/* Fixed aspect ratio so it never looks weird on laptop */}
                  <div className="relative w-full aspect-16/10 md:aspect-16/11 overflow-hidden">
                    {selectedImages.length > 0 ? (
                      <>
                        {/* Blurred "cover" background (nice look even with contain) */}
                        <img
                          src={selectedImages[activeImageIndex]}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        />

                        {/* Actual image (no distortion, no weird crop) */}
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

                    {/* Controls */}
                    {selectedImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700"
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white text-slate-700"
                          aria-label="Next image"
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
                              ? "border-sky-500"
                              : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={src}
                            alt={`${selectedProperty.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: info */}
              <div className="md:w-1/2 flex flex-col p-5 sm:p-6 overflow-y-auto bg-slate-50/40">
                {/* Price & summary */}
                <div className="mb-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        €{selectedProperty.price.toLocaleString("en-US")}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {selectedProperty.buyRent === "rent"
                          ? isPT
                            ? "Arrendamento mensal"
                            : "Monthly rent"
                          : isPT
                          ? "Preço de venda"
                          : "Sale price"}
                      </div>
                    </div>

                    {(() => {
                      const ppsm = calcPricePerSqm(selectedProperty);
                      return ppsm != null ? (
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700">
                            {isPT ? "Preço por m²" : "Price per m²"}
                          </div>
                          <div className="text-sm font-bold text-sky-700">
                            €{ppsm.toLocaleString(isPT ? "pt-PT" : "en-US")}/m²
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Key details grid */}
                <div className="mb-5 rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-800 mb-3">
                    {isPT ? "Detalhes do imóvel" : "Property details"}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        {isPT ? "Tipo" : "Type"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatTypeLabel(selectedProperty.type, isPT)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        📍 {isPT ? "Zona" : "Location"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedProperty.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        🛏 {isPT ? "Quartos" : "Bedrooms"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedProperty.bedrooms}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        🛁 {isPT ? "WC" : "Bathrooms"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedProperty.bathrooms}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        📏 {isPT ? "Área útil" : "Usable"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedProperty.usableArea
                          ? `${selectedProperty.usableArea} m²`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-slate-500">
                        {isPT ? "Área bruta" : "Gross area"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedProperty.grossArea
                          ? `${selectedProperty.grossArea} m²`
                          : "-"}
                      </span>
                    </div>

                    {selectedProperty.type === "land" && (
                      <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-500">
                          {isPT ? "Área de terreno" : "Land area"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedProperty.landArea
                            ? `${selectedProperty.landArea} m²`
                            : "-"}
                        </span>
                      </div>
                    )}

                    {formatConditionLabel(selectedProperty.condition, isPT) && (
                      <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-500">
                          {isPT ? "Condição" : "Condition"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatConditionLabel(
                            selectedProperty.condition,
                            isPT
                          )}
                        </span>
                      </div>
                    )}

                    {formatFurnishedLabel(selectedProperty.furnished, isPT) && (
                      <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-500">
                          {isPT ? "Mobilado" : "Furnished"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatFurnishedLabel(
                            selectedProperty.furnished,
                            isPT
                          )}
                        </span>
                      </div>
                    )}

                    {selectedProperty.energyCertificate && (
                      <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-slate-500">
                          {isPT
                            ? "Certificado Energético"
                            : "Energy certificate"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedProperty.energyCertificate}
                        </span>
                      </div>
                    )}

                    {selectedProperty.divisions != null &&
                      selectedProperty.divisions > 0 && (
                        <div className="col-span-2 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <span className="text-slate-500">
                            {isPT ? "N.º de divisões" : "Rooms"}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {selectedProperty.divisions}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                    {isPT ? "Sobre este imóvel" : "About this property"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Owner controls (edit / delete) */}
                {isOwner && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleEditListing}
                      className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-amber-600"
                    >
                      ✏️ {isPT ? "Editar anúncio" : "Edit listing"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteListing}
                      className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-red-700"
                    >
                      🗑 {isPT ? "Remover anúncio" : "Remove listing"}
                    </button>
                  </div>
                )}

                {/* Agent/Contact CTA */}
                <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-[11px] sm:text-xs text-slate-500">
                      {selectedProperty.agentName ? (
                        isPT ? (
                          <>Representado por {selectedProperty.agentName}.</>
                        ) : (
                          <>Represented by {selectedProperty.agentName}.</>
                        )
                      ) : isPT ? (
                        "Representado por agente local."
                      ) : (
                        "Represented by a local agent."
                      )}
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
                          📞 {isPT ? "Ligar agora" : "Call now"}
                        </button>
                      )}

                      {selectedProperty.agentEmail && (
                        <button
                          type="button"
                          onClick={handleCopyAgentEmail}
                          className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-sky-700 transition"
                        >
                          ✉️{" "}
                          {hasCopiedEmail
                            ? isPT
                              ? "Copiado!"
                              : "Copied!"
                            : showAgentEmail
                            ? selectedProperty.agentEmail
                            : isPT
                            ? "Ver e-mail"
                            : "See e-mail"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONCIERGE REQUEST FORM MODAL */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                  {isPT
                    ? "Pedido de procura de imóvel"
                    : "Property search request"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isPT
                    ? "Partilhe alguns detalhes e enviaremos opções em Cascais."
                    : "Share a few details and we’ll send you options in Cascais."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRequestForm}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitRequest}
              className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4"
            >
              <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-4 space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                  {isPT
                    ? "Os seus dados de contacto"
                    : "Your Contact Information"}
                </h3>

                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-600">
                    {isPT ? "Nome" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    required
                    placeholder={isPT ? "O seu nome" : "Your name"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-600">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    required
                    placeholder="you@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-600">
                    {isPT ? "Telefone (opcional)" : "Phone (optional)"}
                  </label>
                  <input
                    type="tel"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    placeholder="+351 xxx xxx xxx"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isPT
                    ? "O que procura em Cascais?"
                    : "What are you looking for in Cascais?"}
                </label>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRequestType("rent")}
                    className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition ${
                      requestType === "rent"
                        ? "bg-sky-600 text-white shadow"
                        : "text-slate-600"
                    }`}
                  >
                    {isPT ? "Arrendar (estadia)" : "Rent (stay)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType("buy")}
                    className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition ${
                      requestType === "buy"
                        ? "bg-sky-600 text-white shadow"
                        : "text-slate-600"
                    }`}
                  >
                    {isPT ? "Comprar" : "Buy"}
                  </button>
                </div>
              </div>

              {requestType === "rent" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-600">
                      {isPT ? "Desde" : "From"}
                    </label>
                    <input
                      type="date"
                      value={requestFrom}
                      onChange={(e) => setRequestFrom(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-600">
                      {isPT ? "Até" : "To"}
                    </label>
                    <input
                      type="date"
                      value={requestTo}
                      onChange={(e) => setRequestTo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-600">
                  {isPT ? "Tamanho mínimo (m²)" : "Size (m²)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={requestSize}
                  onChange={(e) => setRequestSize(e.target.value)}
                  placeholder={isPT ? "ex.: a partir de 80" : "e.g. from 80"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-600">
                  {isPT ? "Pedidos especiais" : "Special requests"}
                </label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder={
                    isPT
                      ? "Piscina, vista mar, permite animais, garagem, orçamento aproximado..."
                      : "Pool, ocean view, pets allowed, parking, approximate budget..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>

              <div className="pt-2 pb-1 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow hover:bg-sky-700 transition"
                >
                  {isPT
                    ? "Enviar pedido de procura"
                    : "Send home-search request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealEstatePage;
