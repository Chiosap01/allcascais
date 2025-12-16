// src/pages/PropertyListingPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { CASCAIS_AREAS, NEIGHBORHOODS_BY_AREA } from "../constants/locations";

type BuyRent = "buy" | "rent";

type PropertyType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "warehouse"
  | "garage";

type PublisherType = "owner" | "agency";

const MAX_IMAGES = 8;

// Brand color used in your RealEstatePage
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#195c8a";

const DESCRIPTION_MAX_LENGTH = 800;
const TITLE_MAX_LENGTH = 70;
const NAME_MAX_LENGTH = 30;
const PRICE_MAX_DIGITS = 8;
const AREA_MAX_DIGITS = 6;

const phoneInputToDb = (input: string): string | null => {
  const digits = input.replace(/[^\d]/g, "").slice(0, 9);
  if (!digits) return null;
  return `+351 ${digits}`;
};

const phoneDbToInput = (dbPhone: string | null): string => {
  if (!dbPhone) return "";
  const digits = dbPhone.replace(/[^\d]/g, "");
  return digits.replace(/^351/, "").slice(0, 9);
};

type PropertyListingRow = {
  id: string;
  user_id: string;
  buy_rent: "buy" | "rent" | null;
  property_type: PropertyType | null;

  title: string | null;
  // legacy
  location: string | null;

  // ✅ new
  location_area: string | null;
  location_neighborhood: string | null;

  description: string | null;
  price: number | null;

  bedrooms: number | null;
  bathrooms: number | null;

  usable_area: number | null;
  land_area: number | null;
  gross_area: number | null;

  is_price_negotiable: boolean | null;
  condition: string | null;
  furnished: "" | "yes" | "no" | "partial" | null;

  divisions: number | null;
  energy_certificate: string | null;

  images: string[] | null;

  publisher_type: PublisherType | null;

  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  status: "active" | "sold" | "rented" | null;
};

const PropertyListingPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Route: /properties/:id/edit  OR  /properties/new
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // ✅ Fix “it keeps reverting my edits”
  const didPrefillRef = useRef(false);
  const isDirtyRef = useRef(false);
  const markDirty = () => {
    isDirtyRef.current = true;
  };

  // core fields
  const [buyRent, setBuyRent] = useState<BuyRent>("buy");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");

  const [title, setTitle] = useState("");

  // ✅ NEW: area + neighborhood (instead of one "location")
  const [locationArea, setLocationArea] = useState("");
  const [locationNeighborhood, setLocationNeighborhood] = useState("");

  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");

  const [bedrooms, setBedrooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");

  const [usableArea, setUsableArea] = useState<string>("");
  const [landArea, setLandArea] = useState<string>("");
  const [grossArea, setGrossArea] = useState<string>("");

  // extras
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [condition, setCondition] = useState("");
  const [furnished, setFurnished] = useState<"" | "yes" | "no" | "partial">("");
  const [divisions, setDivisions] = useState<string>("");
  const [energyCert, setEnergyCert] = useState<string>("");

  // who is listing
  const [publisherType, setPublisherType] = useState<PublisherType>("owner");

  // contact details
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // UI
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isApartmentOrHouse =
    propertyType === "apartment" || propertyType === "house";
  const isLand = propertyType === "land";
  const isCommercial = propertyType === "commercial";
  const isGarage = propertyType === "garage";
  const isWarehouse = propertyType === "warehouse";

  const numericPrice = Number(price.replace(/\D/g, "")) || 0;
  const numericUsableArea = Number(usableArea) || 0;
  const numericLandArea = Number(landArea) || 0;

  const areaForPrice = isLand ? numericLandArea : numericUsableArea;

  const pricePerSqm = useMemo(() => {
    if (numericPrice > 0 && areaForPrice > 0) {
      return Math.round((numericPrice / areaForPrice) * 100) / 100;
    }
    return null;
  }, [numericPrice, areaForPrice]);

  // ✅ neighborhoods list depends on chosen area
  const neighborhoodOptions = useMemo(() => {
    if (!locationArea) return [];
    return NEIGHBORHOODS_BY_AREA[locationArea] ?? [];
  }, [locationArea]);

  // ✅ Prefill for EDIT mode (only once; never overwrite if user started editing)
  useEffect(() => {
    const load = async () => {
      if (authLoading) return;

      if (!user) {
        setLoadingPrefill(false);
        return;
      }

      if (!isEditing || !id) {
        // create mode
        setContactEmail(user.email ?? "");
        setLoadingPrefill(false);
        return;
      }

      if (didPrefillRef.current) return;
      if (isDirtyRef.current) return;
      didPrefillRef.current = true;

      try {
        setLoadingPrefill(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from("property_listings")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle<PropertyListingRow>();

        if (error) {
          console.error("Error loading property for edit:", error);
          setErrorMsg(
            isPT ? "Erro ao carregar o anúncio." : "Failed to load listing."
          );
          return;
        }

        if (!data) {
          setErrorMsg(isPT ? "Anúncio não encontrado." : "Listing not found.");
          return;
        }

        setBuyRent((data.buy_rent ?? "buy") as BuyRent);
        setPropertyType((data.property_type ?? "apartment") as PropertyType);

        setTitle(data.title ?? "");

        // ✅ new fields (fallback to legacy location)
        const area = data.location_area ?? data.location ?? "";
        setLocationArea(area);
        setLocationNeighborhood(data.location_neighborhood ?? "");

        setDescription(data.description ?? "");
        setPrice(data.price != null ? String(data.price) : "");

        setBedrooms(data.bedrooms != null ? String(data.bedrooms) : "");
        setBathrooms(data.bathrooms != null ? String(data.bathrooms) : "");

        setUsableArea(data.usable_area != null ? String(data.usable_area) : "");
        setLandArea(data.land_area != null ? String(data.land_area) : "");
        setGrossArea(data.gross_area != null ? String(data.gross_area) : "");

        setIsPriceNegotiable(!!data.is_price_negotiable);
        setCondition(data.condition ?? "");
        setFurnished((data.furnished ?? "") as any);

        setDivisions(data.divisions != null ? String(data.divisions) : "");
        setEnergyCert(data.energy_certificate ?? "");

        setImageUrls(Array.isArray(data.images) ? data.images : []);

        setPublisherType((data.publisher_type ?? "owner") as PublisherType);

        setContactName(data.contact_name ?? "");
        setContactEmail(data.contact_email ?? user.email ?? "");
        setContactPhone(phoneDbToInput(data.contact_phone ?? null));
      } finally {
        setLoadingPrefill(false);
      }
    };

    load();
  }, [authLoading, user, isEditing, id, isPT]);

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(
        isPT
          ? "Já atingiu o máximo de fotos."
          : "You already reached the maximum photos."
      );
      return;
    }

    setUploadingImages(true);
    setErrorMsg(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const bucketName = "property-images";
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            upsert: false,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path);
        uploadedUrls.push(pub.publicUrl);
      }

      markDirty();
      setImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        isPT ? "Falha ao carregar imagens." : "Failed to upload images."
      );
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    markDirty();
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      alert(isPT ? "Indique o título." : "Please enter a title.");
      return false;
    }
    if (!locationArea) {
      alert(isPT ? "Escolha a zona." : "Please choose area.");
      return false;
    }
    if (!description.trim()) {
      alert(isPT ? "Escreva uma descrição." : "Please write a description.");
      return false;
    }
    if (!price.trim() || numericPrice <= 0) {
      alert(isPT ? "Preço inválido." : "Invalid price.");
      return false;
    }
    if (!contactName.trim()) {
      alert(
        isPT ? "Indique o nome de contacto." : "Please enter contact name."
      );
      return false;
    }
    if (!contactEmail.trim()) {
      alert(isPT ? "Indique o e-mail." : "Please enter e-mail.");
      return false;
    }

    if (isApartmentOrHouse || isCommercial || isGarage || isWarehouse) {
      if (!usableArea.trim() || numericUsableArea <= 0) {
        alert(isPT ? "Indique a área útil." : "Please enter usable area.");
        return false;
      }
    }
    if (isLand) {
      if (!landArea.trim() || numericLandArea <= 0) {
        alert(isPT ? "Indique a área do terreno." : "Please enter land area.");
        return false;
      }
    }

    if (isApartmentOrHouse) {
      if (!bedrooms.trim()) {
        alert(isPT ? "Indique os quartos." : "Please select bedrooms.");
        return false;
      }
      if (!bathrooms.trim()) {
        alert(isPT ? "Indique as casas de banho." : "Please select bathrooms.");
        return false;
      }
    }

    if (isCommercial && !bathrooms.trim()) {
      alert(isPT ? "Indique as casas de banho." : "Please select bathrooms.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // ✅ prevent double-submit

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        buy_rent: buyRent,
        property_type: propertyType,

        title: title.trim(),

        // ✅ Keep legacy location filled for compatibility
        location: locationArea,

        // ✅ New fields
        location_area: locationArea,
        location_neighborhood: locationNeighborhood || null,

        description: description.trim(),
        price: numericPrice,

        is_price_negotiable: isPriceNegotiable,

        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,

        usable_area: usableArea ? Number(usableArea) : null,
        land_area: landArea ? Number(landArea) : null,
        gross_area: grossArea ? Number(grossArea) : null,

        condition: condition.trim() || null,
        furnished: furnished || null,

        divisions: divisions ? Number(divisions) : null,
        energy_certificate: energyCert.trim() || null,

        images: imageUrls.length > 0 ? imageUrls : null,

        publisher_type: publisherType,

        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: phoneInputToDb(contactPhone),

        status: "active" as const,
      };

      let err: any = null;

      if (isEditing && id) {
        const { error } = await supabase
          .from("property_listings")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id);
        err = error;
      } else {
        const { error } = await supabase
          .from("property_listings")
          .insert(payload);
        err = error;
      }

      if (err) {
        console.error("Save error:", err);
        setErrorMsg(
          isPT
            ? "Erro ao guardar. Verifique RLS e colunas da tabela."
            : "Failed to save. Check RLS and table columns."
        );
        return;
      }

      isDirtyRef.current = false;

      setSuccessMsg(
        isPT
          ? isEditing
            ? "Anúncio atualizado com sucesso!"
            : "Anúncio publicado com sucesso!"
          : isEditing
          ? "Listing updated successfully!"
          : "Listing published successfully!"
      );

      setTimeout(() => navigate("/real-estate"), 700);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingPrefill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isPT ? "A carregar..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 px-6 py-6 text-center max-w-md">
          <p className="text-sm text-slate-700 mb-4">
            {isPT
              ? "Tem de iniciar sessão para anunciar o seu imóvel."
              : "You need to sign in to list a property."}
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/auth", {
                state: {
                  from: isEditing
                    ? `/properties/${id}/edit`
                    : "/properties/new",
                },
              })
            }
            className="inline-flex items-center justify-center rounded-full text-white text-sm font-semibold px-6 py-2.5 shadow"
            style={{ backgroundColor: BRAND }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = BRAND_HOVER)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = BRAND)
            }
          >
            {isPT ? "Entrar / Registar" : "Sign in / Register"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            {isPT
              ? isEditing
                ? "Editar anúncio"
                : "Anunciar imóvel"
              : isEditing
              ? "Edit listing"
              : "List a property"}
          </h1>
          <p className="text-sm text-slate-500">
            {isPT
              ? "Preencha os detalhes do seu imóvel em Cascais."
              : "Fill in your property details in Cascais."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-md border border-slate-100 px-6 py-6 space-y-6"
        >
          {/* Buy / Rent + Type */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Pretende" : "You want to"}
              </label>
              <div className="inline-flex rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    markDirty();
                    setBuyRent("buy");
                  }}
                  className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition"
                  style={{
                    backgroundColor: buyRent === "buy" ? BRAND : "transparent",
                    color: buyRent === "buy" ? "white" : "#475569",
                    boxShadow:
                      buyRent === "buy"
                        ? "0 8px 20px rgba(0,0,0,0.08)"
                        : "none",
                  }}
                >
                  {isPT ? "Vender" : "Sell"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markDirty();
                    setBuyRent("rent");
                  }}
                  className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition"
                  style={{
                    backgroundColor: buyRent === "rent" ? BRAND : "transparent",
                    color: buyRent === "rent" ? "white" : "#475569",
                    boxShadow:
                      buyRent === "rent"
                        ? "0 8px 20px rgba(0,0,0,0.08)"
                        : "none",
                  }}
                >
                  {isPT ? "Arrendar" : "Rent out"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Tipo de imóvel" : "Property type"}
              </label>
              <select
                value={propertyType}
                onChange={(e) => {
                  markDirty();
                  setPropertyType(e.target.value as PropertyType);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
              >
                <option value="apartment">
                  {isPT ? "Apartamento" : "Apartment"}
                </option>
                <option value="house">{isPT ? "Moradia" : "House"}</option>
                <option value="land">{isPT ? "Terreno" : "Land"}</option>
                <option value="commercial">
                  {isPT ? "Espaço Comercial" : "Commercial space"}
                </option>
                <option value="warehouse">
                  {isPT ? "Armazém" : "Warehouse"}
                </option>
                <option value="garage">{isPT ? "Garagem" : "Garage"}</option>
              </select>
            </div>
          </section>

          {/* Title + Area + Neighborhood */}
          <section className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Título do anúncio" : "Listing title"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  markDirty();
                  setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH));
                }}
                maxLength={TITLE_MAX_LENGTH}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                placeholder={
                  isPT
                    ? "Ex: Apartamento T2 perto da praia"
                    : "e.g. 2-bedroom apartment near the beach"
                }
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {title.length}/{TITLE_MAX_LENGTH}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Zona" : "Area"}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isPT ? "Escolha a zona principal." : "Choose the main area."}
              </p>
              <div className="flex flex-wrap gap-2">
                {CASCAIS_AREAS.map((area) => {
                  const active = locationArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        markDirty();
                        setLocationArea((prev) => {
                          const next = prev === area ? "" : area;
                          // ✅ if switching area, reset neighborhood (prevents mismatch)
                          setLocationNeighborhood("");
                          return next;
                        });
                      }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs border transition"
                      style={{
                        backgroundColor: active ? `${BRAND}0D` : "white",
                        borderColor: active ? BRAND : "#E2E8F0",
                        color: active ? BRAND : "#475569",
                      }}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>

              {locationArea && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {isPT ? "Zona selecionada:" : "Selected area:"} {locationArea}
                </p>
              )}
            </div>

            {/* ✅ Neighborhood (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Bairro (opcional)" : "Neighborhood (optional)"}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isPT
                  ? "Para tornar o anúncio mais fácil de encontrar."
                  : "Helps people find the listing faster."}
              </p>

              <select
                value={locationNeighborhood}
                onChange={(e) => {
                  markDirty();
                  setLocationNeighborhood(e.target.value);
                }}
                disabled={!locationArea || neighborhoodOptions.length === 0}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 disabled:opacity-60"
                style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
              >
                <option value="">
                  {locationArea
                    ? isPT
                      ? "Selecionar (opcional)"
                      : "Select (optional)"
                    : isPT
                    ? "Escolha a zona primeiro"
                    : "Choose area first"}
                </option>

                {neighborhoodOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              {locationNeighborhood && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {isPT ? "Bairro:" : "Neighborhood:"} {locationNeighborhood}
                </p>
              )}
            </div>
          </section>

          {/* Bedrooms / Bathrooms */}
          {(isApartmentOrHouse || isCommercial || isWarehouse) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isApartmentOrHouse && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isPT ? "Quartos (Tipologia)" : "Bedrooms (Typology)"}
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => {
                      markDirty();
                      setBedrooms(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                  >
                    <option value="">{isPT ? "Selecionar" : "Select"}</option>
                    <option value="0">
                      {isPT ? "T0 / Estúdio" : "Studio"}
                    </option>
                    <option value="1">T1</option>
                    <option value="2">T2</option>
                    <option value="3">T3</option>
                    <option value="4">T4</option>
                    <option value="5">T5</option>
                    <option value="6">{isPT ? "T6 ou +" : "T6 or +"}</option>
                  </select>
                </div>
              )}

              {(isApartmentOrHouse || isCommercial) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isPT ? "Casas de banho" : "Bathrooms"}
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => {
                      markDirty();
                      setBathrooms(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                  >
                    <option value="">{isPT ? "Selecionar" : "Select"}</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">{isPT ? "6 ou +" : "6 or +"}</option>
                  </select>
                </div>
              )}
            </section>
          )}

          {/* Description */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                {isPT ? "Descrição" : "Description"}
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length}/{DESCRIPTION_MAX_LENGTH}{" "}
                {isPT ? "caracteres" : "characters"}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                markDirty();
                setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH));
              }}
              rows={5}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
              style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
            />
          </section>

          {/* Price */}
          <section>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Preço" : "Price"}
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="w-full sm:flex-1 min-w-0 flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs text-slate-500">
                    €
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => {
                      markDirty();
                      const digitsOnly = e.target.value
                        .replace(/[^\d]/g, "")
                        .slice(0, PRICE_MAX_DIGITS);
                      setPrice(digitsOnly);
                    }}
                    className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    markDirty();
                    setIsPriceNegotiable((v) => !v);
                  }}
                  className={[
                    "inline-flex items-center gap-2 self-start",
                    "rounded-full px-3 py-2 sm:px-4 sm:py-2",
                    "text-xs sm:text-xs font-semibold",
                    "border transition-all hover:bg-slate-50 active:scale-[0.99]",
                    "focus:outline-none focus:ring-4",
                    isPriceNegotiable
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                  aria-pressed={isPriceNegotiable}
                >
                  <span
                    className={[
                      "w-2.5 h-2.5 rounded-full",
                      isPriceNegotiable ? "bg-emerald-600" : "bg-slate-400",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  {isPT
                    ? isPriceNegotiable
                      ? "Preço negociável"
                      : "Tornar negociável"
                    : isPriceNegotiable
                    ? "Price negotiable"
                    : "Make negotiable"}
                </button>
              </div>

              {pricePerSqm !== null && (
                <p className="mt-1 text-[11px] text-slate-500 font-semibold">
                  {isPT
                    ? `Preço por m²: €${pricePerSqm.toLocaleString("pt-PT")}/m²`
                    : `Price per m²: €${pricePerSqm.toLocaleString(
                        "en-US"
                      )}/m²`}
                </p>
              )}
            </div>
          </section>

          {/* Areas */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isApartmentOrHouse ||
              isCommercial ||
              isGarage ||
              isWarehouse) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Área útil (m²)" : "Usable area (m²)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={usableArea}
                  onChange={(e) => {
                    markDirty();
                    const digitsOnly = e.target.value
                      .replace(/[^\d]/g, "")
                      .slice(0, AREA_MAX_DIGITS);
                    setUsableArea(digitsOnly);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                />
              </div>
            )}

            {(isApartmentOrHouse || isCommercial) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Área bruta (m²)" : "Gross area (m²)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={grossArea}
                  onChange={(e) => {
                    markDirty();
                    const digitsOnly = e.target.value
                      .replace(/[^\d]/g, "")
                      .slice(0, AREA_MAX_DIGITS);
                    setGrossArea(digitsOnly);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                />
              </div>
            )}

            {isLand && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Área de Terreno (m²)" : "Land area (m²)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={landArea}
                  onChange={(e) => {
                    markDirty();
                    const digitsOnly = e.target.value
                      .replace(/[^\d]/g, "")
                      .slice(0, AREA_MAX_DIGITS);
                    setLandArea(digitsOnly);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                />
              </div>
            )}
          </section>

          {/* Optional extras */}
          <section className="space-y-3">
            {(isApartmentOrHouse ||
              isCommercial ||
              isGarage ||
              isWarehouse) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Condição do imóvel" : "Property condition"}
                </label>
                <select
                  value={condition}
                  onChange={(e) => {
                    markDirty();
                    setCondition(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                >
                  <option value="">{isPT ? "Selecionar" : "Select"}</option>
                  <option value="usado">{isPT ? "Usado" : "Used"}</option>
                  <option value="renovado">
                    {isPT ? "Renovado" : "Renovated"}
                  </option>
                  <option value="novo">{isPT ? "Novo" : "New"}</option>
                  <option value="para_recuperar">
                    {isPT ? "Para recuperar" : "To restore"}
                  </option>
                  <option value="em_construcao">
                    {isPT ? "Em construção" : "Under construction"}
                  </option>
                  <option value="ruina">{isPT ? "Ruína" : "Ruins"}</option>
                </select>
              </div>
            )}

            {isApartmentOrHouse && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Mobilado" : "Furnished"}
                </label>
                <div className="flex gap-2">
                  {(["yes", "no", "partial"] as const).map((v) => {
                    const active = furnished === v;
                    const label =
                      v === "yes"
                        ? isPT
                          ? "Sim"
                          : "Yes"
                        : v === "no"
                        ? isPT
                          ? "Não"
                          : "No"
                        : isPT
                        ? "Parcial"
                        : "Partial";
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          markDirty();
                          setFurnished(v);
                        }}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: active ? BRAND : "white",
                          color: active ? "white" : "#475569",
                          borderColor: active ? BRAND : "#CBD5E1",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(isApartmentOrHouse || isCommercial) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Certificado energético" : "Energy certificate"}
                </label>
                <select
                  value={energyCert}
                  onChange={(e) => {
                    markDirty();
                    setEnergyCert(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                >
                  <option value="">{isPT ? "Selecionar" : "Select"}</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                  <option value="isento">{isPT ? "Isento" : "Exempt"}</option>
                </select>
              </div>
            )}

            {isCommercial && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "N.º de divisões" : "Number of rooms"}
                </label>
                <select
                  value={divisions}
                  onChange={(e) => {
                    markDirty();
                    setDivisions(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                >
                  <option value="">{isPT ? "Selecionar" : "Select"}</option>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </option>
                  ))}
                  <option value="11">
                    {isPT ? "10 ou mais" : "10 or more"}
                  </option>
                </select>
              </div>
            )}
          </section>

          {/* Images */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              {isPT ? "Fotografias do imóvel" : "Property photos"}
            </h2>
            <p className="text-[11px] text-slate-400 mb-3">
              {isPT
                ? "Até 8 fotos. A primeira é a capa."
                : "Up to 8 photos. First is cover."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: MAX_IMAGES }).map((_, idx) => {
                const url = imageUrls[idx];
                const isAddTile =
                  !url &&
                  idx === imageUrls.length &&
                  imageUrls.length < MAX_IMAGES;

                if (isAddTile) {
                  return (
                    <label
                      key={idx}
                      className="h-24 sm:h-32 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 transition"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-emerald-900">
                        {isPT ? "Adicionar fotos" : "Add photos"}
                      </span>
                      <span className="mt-1 w-12 sm:w-16 h-px bg-emerald-900" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImagesChange}
                        disabled={
                          uploadingImages || imageUrls.length >= MAX_IMAGES
                        }
                      />
                    </label>
                  );
                }

                if (url) {
                  return (
                    <div
                      key={idx}
                      className="h-24 sm:h-32 rounded-xl bg-slate-100 relative overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Property ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="h-24 sm:h-32 rounded-xl bg-slate-100 flex items-center justify-center"
                  />
                );
              })}
            </div>

            {uploadingImages && (
              <p className="mt-2 text-[11px] text-slate-500">
                {isPT ? "A carregar imagens..." : "Uploading images..."}
              </p>
            )}
          </section>

          {/* Publisher type */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              {isPT ? "Quem está a anunciar?" : "Who is listing?"}
            </h2>

            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  markDirty();
                  setPublisherType("owner");
                }}
                className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition"
                style={{
                  backgroundColor:
                    publisherType === "owner" ? BRAND : "transparent",
                  color: publisherType === "owner" ? "white" : "#475569",
                }}
              >
                {isPT ? "Particular" : "Owner"}
              </button>

              <button
                type="button"
                onClick={() => {
                  markDirty();
                  setPublisherType("agency");
                }}
                className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition"
                style={{
                  backgroundColor:
                    publisherType === "agency" ? BRAND : "transparent",
                  color: publisherType === "agency" ? "white" : "#475569",
                }}
              >
                {isPT ? "Agência" : "Agency"}
              </button>
            </div>
          </section>

          {/* Contact Details */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              {isPT ? "Detalhes de contacto" : "Contact details"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Nome" : "Name"}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => {
                    markDirty();
                    setContactName(e.target.value.slice(0, NAME_MAX_LENGTH));
                  }}
                  maxLength={NAME_MAX_LENGTH}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {contactName.length}/{NAME_MAX_LENGTH}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    markDirty();
                    setContactEmail(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                  style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Telemóvel (opcional)" : "Mobile phone (optional)"}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs text-slate-500">
                    +351
                  </span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      markDirty();
                      const onlyDigits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 9);
                      setContactPhone(onlyDigits);
                    }}
                    className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}33` }}
                    placeholder="9xxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </section>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          <section className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-full text-white text-sm font-semibold px-6 py-2.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND_HOVER)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND)
              }
            >
              {saving
                ? isPT
                  ? "A guardar..."
                  : "Saving..."
                : isPT
                ? isEditing
                  ? "Guardar alterações"
                  : "Publicar anúncio"
                : isEditing
                ? "Save changes"
                : "Publish listing"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
};

export default PropertyListingPage;
