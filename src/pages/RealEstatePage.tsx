import React, { useMemo, useState } from "react";
import { useLanguage } from "../layouts/MainLayout"; // ajuste o path se necessário

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
}

const PROPERTIES: Property[] = [
  {
    id: 1,
    status: "active",
    title: "Moradia T4 com jardim em São Pedro do Estoril",
    description:
      "Spacious 4-bedroom family house with a private garden in the prestigious São Pedro do Estoril area, just a short walk from the sea.",
    price: 1195000,
    currency: "EUR",
    buyRent: "buy",
    location: "São Pedro do Estoril",
    type: "house",
    bedrooms: 4,
    bathrooms: 3,
    usableArea: 210,
    image: "/properties/moradia-sp.jpeg",
  },
  {
    id: 2,
    status: "active",
    title: "Contemporary Oceanfront Villa",
    description:
      "Stunning contemporary villa with panoramic ocean views and infinity pool",
    price: 3950000,
    currency: "EUR",
    buyRent: "buy",
    location: "Cascais Center",
    type: "apartment",
    bedrooms: 5,
    bathrooms: 6,
    usableArea: 320,
    image: "/properties/moradia-2.jpg",
  },
  {
    id: 3,
    status: "active",
    title: "Beachfront Estate with Private Garden",
    description:
      "Magnificent estate steps from the beach with lush private gardens",
    price: 4200000,
    currency: "EUR",
    buyRent: "buy",
    location: "Guincho",
    type: "villa",
    bedrooms: 6,
    bathrooms: 7,
    usableArea: 450,
    image: "/properties/moradia-3.jpg",
  },
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

  // distinct locations from the mock data
  const locations = Array.from(new Set(PROPERTIES.map((p) => p.location)));

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
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors" />

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full gap-5">
              {/* Left text */}
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

              {/* Buttons */}
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

        {/* Filter card */}
        <section className="mb-8">
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 px-4 sm:px-6 py-4 sm:py-5">
            {/* First row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              {/* Buy/Rent */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">
                  🏡 {isPT ? "Comprar / Arrendar" : "Buy / Rent"}
                </label>
                <select
                  value={buyRent}
                  onChange={(e) => setBuyRent(e.target.value as BuyRent)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                    {isPT ? "🌍 Todas as localizações" : "🌍 All Locations"}
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

            {/* Second row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
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
                  {/* Some reasonable steps for both rent & buy */}
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
              <div className="flex justify-start md:justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
                >
                  {showAdvanced
                    ? isPT
                      ? "▲ Ocultar filtros avançados"
                      : "▲ Hide Advanced Filters"
                    : isPT
                    ? "▼ Filtros avançados"
                    : "▼ Advanced Filters"}
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

        {/* Results summary */}
        <section className="mb-4">
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
        </section>

        {/* Property cards */}
        <section className="grid md:grid-cols-2 gap-5 pb-10">
          {filteredProperties.map((property) => (
            <article
              key={property.id}
              className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-lg transition"
            >
              {property.image && (
                <img
                  src={property.image}
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
                <button
                  type="button"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  {isPT ? "Ver detalhes →" : "View details →"}
                </button>
              </div>
            </article>
          ))}

          {filteredProperties.length === 0 && (
            <div className="col-span-full text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              {isPT
                ? "Ainda não há imóveis que correspondam aos filtros. Experimente ajustar a pesquisa."
                : "No properties match your filters yet. Try adjusting your search."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RealEstatePage;
