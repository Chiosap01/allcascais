import React, { useMemo, useState } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";

type BuyRent = "all" | "buy" | "rent";

type PropertyType = "all" | "apartment" | "house" | "villa" | "studio" | "land";

interface Property {
  id: number;
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
  image?: string;
  images?: string[];

  // NEW – who represents this listing
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

const PROPERTIES: Property[] = [
  {
    id: 1,
    status: "active",
    title: "Moradia T4 com jardim em São Pedro do Estoril",
    description:
      "Localizada no prestigiado bairro de São Pedro do Estoril, esta moradia T4 oferece uma combinação única de conforto, localização e potencial de valorização. Com 190 m² de área útil e terreno de 230 m², a propriedade encontra-se em bom estado de conservação e dispõe de amplos espaços interiores e exteriores. A sala de 44 m² tem ligação direta ao jardim virado a sul, perfeita para quem privilegia luminosidade e privacidade. A cozinha de 20 m², também com acesso ao jardim, proporciona um ambiente funcional e moderno para o dia a dia. A moradia conta com um quarto principal de 20 m², três quartos adicionais — sendo que um pode facilmente ser convertido em suite — e três casas de banho, incluindo uma com cerca de 13 m² que pode ser dividida em duas, permitindo criar mais uma suite. No piso superior encontra-se uma suite exclusiva com vista mar, 16 m² e um terraço privativo de 12 m². O jardim tardoz, com aproximadamente 60 m², é virado a sul, garantindo ótima exposição solar. A propriedade inclui ainda um jardim de inverno coberto de 12 m², ideal para relaxar durante todo o ano. Situada a apenas 1 minuto da estação da CP de São Pedro e a 3 minutos a pé da praia, esta é uma oportunidade rara numa das zonas mais desejadas da linha de Cascais.",
    price: 1195000,
    currency: "EUR",
    buyRent: "buy",
    location: "São Pedro do Estoril",
    type: "house",
    bedrooms: 4,
    bathrooms: 3,
    usableArea: 210,
    image: "/properties/moradia-sp.jpeg",
    images: ["/properties/moradia-sp.jpeg", "/properties/sp-2.jpg"],
    agentName: "CHIOSS REAL ESTATE",
    agentPhone: "+351 930630880",
    agentEmail: "info@chioss.com",
  },
];

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 👇 MOVE IT HERE:
  const [showAgentEmail, setShowAgentEmail] = useState(false);

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

  const filteredProperties = useMemo(() => {
    let list = [...PROPERTIES];

    if (buyRent !== "all") {
      list = list.filter((p) => p.buyRent === buyRent);
    }

    if (location !== "all") {
      list = list.filter((p) => p.location === location);
    }

    if (propertyType !== "all") {
      list = list.filter((p) => p.type === propertyType);
    }

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
      if (!Number.isNaN(n)) {
        list = list.filter((p) => p.price <= n);
      }
    }

    if (minArea !== "any") {
      const n = Number(minArea);
      if (!Number.isNaN(n)) {
        list = list.filter((p) => p.usableArea >= n);
      }
    }

    if (maxArea !== "any") {
      const n = Number(maxArea);
      if (!Number.isNaN(n)) {
        list = list.filter((p) => p.usableArea <= n);
      }
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [
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

  // distinct locations from base list + properties
  const locations = Array.from(
    new Set([...BASE_LOCATIONS, ...PROPERTIES.map((p) => p.location)])
  );

  const formatStatus = (status: Property["status"]) => {
    if (!isPT)
      return status === "active"
        ? "Active"
        : status === "sold"
        ? "Sold"
        : "Rented";
    if (status === "active") return "Ativo";
    if (status === "sold") return "Vendido";
    return "Arrendado";
  };

  const formatBuyRentLabel = (p: { buyRent: BuyRent }) => {
    if (p.buyRent === "rent") {
      return isPT ? "Para arrendar" : "For rent";
    }
    if (p.buyRent === "buy") {
      return isPT ? "Para venda" : "For sale";
    }
    return isPT ? "Imóvel" : "Property";
  };

  const openPropertyModal = (property: Property) => {
    setSelectedProperty(property);
    setActiveImageIndex(0);
    setShowAgentEmail(false); // 👈 reset
    document.body.style.overflow = "hidden";
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    setActiveImageIndex(0);
    setShowAgentEmail(false); // 👈 reset
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

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("property_search_requests").insert({
      type: requestType, // "rent" | "buy"
      name: requestName,
      email: requestEmail,
      phone: requestPhone || null,
      from_date: requestType === "rent" && requestFrom ? requestFrom : null,
      to_date: requestType === "rent" && requestTo ? requestTo : null,
      min_size: requestSize ? Number(requestSize) : null,
      notes: requestNotes || null,
      language: isPT ? "pt" : "en",
      source_page: "real-estate",
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

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* CHIOSS highlight */}
        <div className="mb-8">
          <div
            className="relative group rounded-2xl bg-cover bg-center bg-no-repeat border border-slate-200 shadow-md px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-5 text-white overflow-hidden transform transition duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.01]"
            style={{
              backgroundImage: "url('/cascais-coast.png')",
            }}
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
            {/* First row – 2 per row on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {/* Buy/Rent */}
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

              {/* Location */}
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

              {/* Property Type */}
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
                  <option value="villa">Villa</option>
                  <option value="studio">{isPT ? "Estúdio" : "Studio"}</option>
                  <option value="land">{isPT ? "Terreno" : "Land"}</option>
                </select>
              </div>

              {/* Bedrooms */}
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

              {/* Bathrooms */}
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

            {/* Second row – 2 per row on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
              {/* Sort by Price */}
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

              {/* Max Price */}
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

              {/* Usable area (min/max) */}
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

              {/* Advanced Filters button */}
              <div className="flex justify-start md:justify-end mt-1 col-span-2 md:col-span-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 transition w-full md:w-auto"
                >
                  {showAdvanced
                    ? isPT
                      ? "▲ Ocultar filtros avançados"
                      : "▲ Hide advanced filters"
                    : isPT
                    ? "▼ Filtros avançados"
                    : "▼ Advanced filters"}
                </button>
              </div>
            </div>

            {/* Advanced filters content */}
            {showAdvanced && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
                {isPT
                  ? "Em breve mais filtros — preço por m², ano de construção, estacionamento e muito mais."
                  : "More filters coming soon – price per m², year built, parking, and more."}
              </div>
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

          <button
            type="button"
            onClick={openRequestForm}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 shadow hover:bg-sky-700 transition"
          >
            <span role="img" aria-hidden="true" className="mr-1.5">
              ✨
            </span>
            {isPT ? "Encontrar imóvel para mim" : "Help me find a property"}
          </button>
        </section>

        {/* PROPERTY CARDS */}
        <section className="grid md:grid-cols-2 gap-5 pb-10">
          {filteredProperties.map((property) => {
            const coverImage = property.images?.[0] ?? property.image;
            return (
              <article
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => openPropertyModal(property)}
                onKeyDown={(e) =>
                  e.key === "Enter" && openPropertyModal(property)
                }
                className="cursor-pointer bg-white rounded-2xl shadow-md border border-slate-100 p-4 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                {coverImage && (
                  <img
                    src={coverImage}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-xl mb-2"
                  />
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-500 text-white text-xs font-semibold px-3 py-1">
                    {formatStatus(property.status)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {property.location}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
                  {property.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3">
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

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-sky-600">
                      €{property.price.toLocaleString("en-US")}
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
                <div className="relative flex-1 bg-slate-900/5">
                  {selectedImages.length > 0 ? (
                    <img
                      src={selectedImages[activeImageIndex]}
                      alt={selectedProperty.title}
                      className="w-full h-full max-h-80 md:max-h-none object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      {isPT ? "Sem imagens disponíveis" : "No images available"}
                    </div>
                  )}

                  {selectedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg:white text-slate-700"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg:white text-slate-700"
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

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow">
                    {formatStatus(selectedProperty.status)}
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
                          className={`h-16 w-20 rounded-xl overflow-hidden border transition shrink-0 ${
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
                {/* Price & key facts */}
                <div className="mb-5 space-y-3">
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

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-slate-200 text-slate-700">
                      🛏 {selectedProperty.bedrooms}{" "}
                      {isPT ? "quartos" : "bedrooms"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-slate-200 text-slate-700">
                      🛁 {selectedProperty.bathrooms}{" "}
                      {isPT ? "casas de banho" : "bathrooms"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-slate-200 text-slate-700">
                      📏 {selectedProperty.usableArea} m²
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-slate-200 text-slate-700">
                      📍 {selectedProperty.location}
                    </span>
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

                {/* Agent CTA */}
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
                          onClick={() => setShowAgentEmail(true)}
                          className="inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:bg-sky-700"
                        >
                          ✉️{" "}
                          {showAgentEmail
                            ? selectedProperty.agentEmail
                            : isPT
                            ? "Ver e-mail"
                            : "See e-mail"}
                        </button>
                      )}
                    </div>
                  </div>

                  {showAgentEmail && selectedProperty.agentEmail && (
                    <div className="text-[11px] sm:text-xs text-slate-600 mt-1 break-all">
                      {isPT ? "Contacto:" : "Contact:"}{" "}
                      <span className="font-medium">
                        {selectedProperty.agentEmail}
                      </span>
                    </div>
                  )}
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
            {/* Header */}
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

            {/* Form body */}
            <form
              onSubmit={handleSubmitRequest}
              className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4"
            >
              {/* Contact info block */}
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

              {/* Looking for */}
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

              {/* Dates – only for Rent */}
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

              {/* Size */}
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

              {/* Special requests */}
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

              {/* Submit */}
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
