// src/pages/PropertyListingPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { CASCAIS_AREAS, NEIGHBORHOODS_BY_AREA } from "../constants/locations";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Building2,
  Home as HomeIcon,
  Euro,
  Image as ImageIcon,
  Plus,
  X,
  Sparkles,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#195c8a";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type BuyRent = "buy" | "rent";
type PublisherType = "owner" | "agency";
type StepId = 1 | 2 | 3;

type PropertyType =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "warehouse"
  | "garage";

type PropertyListingRow = {
  id: string;
  user_id: string;
  buy_rent: "buy" | "rent" | null;
  property_type: PropertyType | null;
  title: string | null;
  location: string | null;
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

/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */
const MAX_IMAGES = 8;
const DESCRIPTION_MAX_LENGTH = 800;
const TITLE_MAX_LENGTH = 70;
const NAME_MAX_LENGTH = 30;
const PRICE_MAX_DIGITS = 8;
const AREA_MAX_DIGITS = 6;

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   STEP INDICATOR
--------------------------------------------------------- */
const StepIndicator: React.FC<{
  currentStep: StepId;
  steps: { id: StepId; label: string }[];
}> = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
    {steps.map((step, idx) => {
      const isActive = step.id === currentStep;
      const isComplete = step.id < currentStep;

      return (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={[
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all",
                isComplete
                  ? "bg-emerald-500 text-white shadow-md"
                  : isActive
                  ? "text-white shadow-lg scale-110"
                  : "bg-white text-slate-400 border-2 border-slate-200",
              ].join(" ")}
              style={isActive ? { backgroundColor: BRAND } : undefined}
            >
              {isComplete ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                step.id
              )}
            </div>

            <span
              className={[
                "hidden sm:block text-xs sm:text-sm font-semibold transition",
                isActive
                  ? "text-slate-900"
                  : isComplete
                  ? "text-emerald-600"
                  : "text-slate-400",
              ].join(" ")}
            >
              {step.label}
            </span>
          </div>

          {idx < steps.length - 1 && (
            <div
              className={[
                "h-0.5 w-6 sm:w-16 rounded-full transition",
                isComplete ? "bg-emerald-500" : "bg-slate-200",
              ].join(" ")}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
const PropertyListingPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const didPrefillRef = useRef(false);
  const isDirtyRef = useRef(false);
  const markDirty = () => {
    isDirtyRef.current = true;
  };

  /* ---------- STATE ---------- */
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Step 1 — Basics
  const [buyRent, setBuyRent] = useState<BuyRent>("buy");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [title, setTitle] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [locationNeighborhood, setLocationNeighborhood] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 — Details
  const [price, setPrice] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [usableArea, setUsableArea] = useState("");
  const [landArea, setLandArea] = useState("");
  const [grossArea, setGrossArea] = useState("");
  const [condition, setCondition] = useState("");
  const [furnished, setFurnished] = useState<"" | "yes" | "no" | "partial">("");
  const [divisions, setDivisions] = useState("");
  const [energyCert, setEnergyCert] = useState("");

  // Step 3 — Photos & contact
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [publisherType, setPublisherType] = useState<PublisherType>("owner");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // UI
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ---------- COMPUTED ---------- */
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

  const neighborhoodOptions = useMemo(() => {
    if (!locationArea) return [];
    return NEIGHBORHOODS_BY_AREA[locationArea] ?? [];
  }, [locationArea]);

  /* ---------- PREFILL ---------- */
  useEffect(() => {
    const load = async () => {
      if (authLoading) return;

      if (!user) {
        setLoadingPrefill(false);
        return;
      }

      if (!isEditing || !id) {
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
          console.error("Error loading property:", error);
          setErrorMsg(isPT ? "Erro ao carregar." : "Failed to load.");
          return;
        }

        if (!data) {
          setErrorMsg(isPT ? "Anúncio não encontrado." : "Listing not found.");
          return;
        }

        setBuyRent((data.buy_rent ?? "buy") as BuyRent);
        setPropertyType((data.property_type ?? "apartment") as PropertyType);
        setTitle(data.title ?? "");
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

  /* ---------- IMAGE HANDLERS ---------- */
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    const filesToUpload = files.slice(0, remaining);

    if (filesToUpload.length === 0) {
      setErrorMsg(
        isPT ? "Máximo de fotos atingido." : "Maximum photos reached."
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

  /* ---------- VALIDATION ---------- */
  const validateStep = (step: StepId): string | null => {
    if (step === 1) {
      if (!title.trim())
        return isPT ? "Indique o título." : "Please enter a title.";
      if (!locationArea)
        return isPT ? "Escolha a zona." : "Please choose area.";
      if (!description.trim())
        return isPT ? "Escreva uma descrição." : "Please write a description.";
    }
    if (step === 2) {
      if (!price.trim() || numericPrice <= 0)
        return isPT ? "Preço inválido." : "Invalid price.";

      if (isApartmentOrHouse || isCommercial || isGarage || isWarehouse) {
        if (!usableArea.trim() || numericUsableArea <= 0)
          return isPT ? "Indique a área útil." : "Please enter usable area.";
      }
      if (isLand) {
        if (!landArea.trim() || numericLandArea <= 0)
          return isPT
            ? "Indique a área do terreno."
            : "Please enter land area.";
      }
      if (isApartmentOrHouse) {
        if (!bedrooms.trim())
          return isPT ? "Indique os quartos." : "Please select bedrooms.";
        if (!bathrooms.trim())
          return isPT
            ? "Indique as casas de banho."
            : "Please select bathrooms.";
      }
      if (isCommercial && !bathrooms.trim())
        return isPT ? "Indique as casas de banho." : "Please select bathrooms.";
    }
    if (step === 3) {
      if (!contactName.trim())
        return isPT
          ? "Indique o nome de contacto."
          : "Please enter contact name.";
      if (!contactEmail.trim())
        return isPT ? "Indique o email." : "Please enter email.";
    }
    return null;
  };

  const goToStep = (step: StepId) => {
    setErrorMsg(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setErrorMsg(err);
      return;
    }
    if (currentStep < 3) goToStep((currentStep + 1) as StepId);
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) goToStep((currentStep - 1) as StepId);
  };

  /* ---------- SUBMIT ----------
     Norman: só o botão final dispara submit.
     Enter em inputs avança de passo, nunca submete.
  --------------------------------------------------------- */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;

    for (const step of [1, 2, 3] as StepId[]) {
      const err = validateStep(step);
      if (err) {
        setErrorMsg(err);
        setCurrentStep(step);
        return;
      }
    }

    if (!user) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        user_id: user.id,
        buy_rent: buyRent,
        property_type: propertyType,
        title: title.trim(),
        location: locationArea,
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
            ? "Erro ao guardar. Verifique RLS."
            : "Failed to save. Check RLS."
        );
        return;
      }

      isDirtyRef.current = false;
      setSuccessMsg(
        isEditing
          ? isPT
            ? "Anúncio atualizado!"
            : "Listing updated!"
          : isPT
          ? "Anúncio publicado!"
          : "Listing published!"
      );

      setTimeout(() => navigate("/real-estate"), 1200);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1 as StepId, label: isPT ? "O imóvel" : "Property" },
    { id: 2 as StepId, label: isPT ? "Detalhes" : "Details" },
    { id: 3 as StepId, label: isPT ? "Fotos & contacto" : "Photos & contact" },
  ];

  /* ---------- RENDER ---------- */
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
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {isPT ? "Inicie sessão" : "Sign in"}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            {isPT
              ? "Precisa de iniciar sessão para anunciar um imóvel."
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
            className="inline-flex items-center justify-center rounded-full text-white text-sm font-semibold px-6 py-2.5 shadow-sm transition"
            style={{ backgroundColor: BRAND }}
          >
            {isPT ? "Entrar / Registar" : "Sign in / Register"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* HEADER */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {isPT ? "Anúncio de imóvel" : "Property listing"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {isEditing
              ? isPT
                ? "Editar anúncio"
                : "Edit listing"
              : isPT
              ? "Anunciar imóvel"
              : "List a property"}
          </h1>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isPT
              ? "Preencha os detalhes em 3 passos rápidos."
              : "Fill in details in 3 quick steps."}
          </p>
        </header>

        {/* STEP INDICATOR */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            const target = e.target as HTMLElement;
            if (e.key === "Enter" && target.tagName !== "TEXTAREA") {
              e.preventDefault();
              if (currentStep < 3) handleNext();
            }
          }}
          className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden"
        >
          <div className="px-5 sm:px-7 py-6 space-y-6">
            {/* ========== STEP 1: PROPERTY BASICS ========== */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Pretende *" : "You want to *"}
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setBuyRent("buy");
                      }}
                      className="flex-1 sm:flex-none px-5 py-2 text-sm rounded-full font-semibold transition"
                      style={{
                        backgroundColor:
                          buyRent === "buy" ? BRAND : "transparent",
                        color: buyRent === "buy" ? "white" : "#475569",
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
                      className="flex-1 sm:flex-none px-5 py-2 text-sm rounded-full font-semibold transition"
                      style={{
                        backgroundColor:
                          buyRent === "rent" ? BRAND : "transparent",
                        color: buyRent === "rent" ? "white" : "#475569",
                      }}
                    >
                      {isPT ? "Arrendar" : "Rent out"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {isPT ? "Tipo de imóvel *" : "Property type *"}
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => {
                      markDirty();
                      setPropertyType(e.target.value as PropertyType);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                    style={{ ["--tw-ring-color" as any]: "#10B98122" }}
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
                    <option value="garage">
                      {isPT ? "Garagem" : "Garage"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Título do anúncio *" : "Listing title *"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      markDirty();
                      setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH));
                    }}
                    maxLength={TITLE_MAX_LENGTH}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                    style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                    placeholder={
                      isPT
                        ? "Ex: Apartamento T2 perto da praia"
                        : "e.g. 2-bed apartment near the beach"
                    }
                  />
                  <p className="mt-1 text-[11px] text-slate-400 text-right">
                    {title.length}/{TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {isPT ? "Zona *" : "Area *"}
                  </label>
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
                              setLocationNeighborhood("");
                              return next;
                            });
                          }}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition",
                            active
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {active && <MapPin className="w-3 h-3" />}
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {locationArea && neighborhoodOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {isPT ? "Bairro (opcional)" : "Neighborhood (optional)"}
                    </label>
                    <select
                      value={locationNeighborhood}
                      onChange={(e) => {
                        markDirty();
                        setLocationNeighborhood(e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                      style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                    >
                      <option value="">
                        {isPT ? "Selecionar (opcional)" : "Select (optional)"}
                      </option>
                      {neighborhoodOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-800">
                      {isPT ? "Descrição *" : "Description *"}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {description.length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      markDirty();
                      setDescription(
                        e.target.value.slice(0, DESCRIPTION_MAX_LENGTH)
                      );
                    }}
                    rows={5}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                    style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                    placeholder={
                      isPT
                        ? "Descreva o imóvel, características, envolvente..."
                        : "Describe the property, features, surroundings..."
                    }
                  />
                </div>
              </>
            )}

            {/* ========== STEP 2: DETAILS ========== */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    {isPT ? "Preço *" : "Price *"}
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-1 min-w-0">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                        €
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) => {
                          markDirty();
                          setPrice(
                            e.target.value
                              .replace(/[^\d]/g, "")
                              .slice(0, PRICE_MAX_DIGITS)
                          );
                        }}
                        className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                        style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setIsPriceNegotiable((v) => !v);
                      }}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold border transition",
                        isPriceNegotiable
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "w-2.5 h-2.5 rounded-full",
                          isPriceNegotiable ? "bg-emerald-600" : "bg-slate-400",
                        ].join(" ")}
                      />
                      {isPT ? "Negociável" : "Negotiable"}
                    </button>
                  </div>

                  {pricePerSqm !== null && (
                    <p className="mt-2 text-[12px] text-emerald-700 font-semibold">
                      {isPT
                        ? `€${pricePerSqm.toLocaleString("pt-PT")}/m²`
                        : `€${pricePerSqm.toLocaleString("en-US")}/m²`}
                    </p>
                  )}
                </div>

                {(isApartmentOrHouse || isCommercial || isWarehouse) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isApartmentOrHouse && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          {isPT ? "Quartos *" : "Bedrooms *"}
                        </label>
                        <select
                          value={bedrooms}
                          onChange={(e) => {
                            markDirty();
                            setBedrooms(e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                          style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                        >
                          <option value="">
                            {isPT ? "Selecionar" : "Select"}
                          </option>
                          <option value="0">
                            {isPT ? "T0 / Estúdio" : "Studio"}
                          </option>
                          <option value="1">T1</option>
                          <option value="2">T2</option>
                          <option value="3">T3</option>
                          <option value="4">T4</option>
                          <option value="5">T5</option>
                          <option value="6">
                            {isPT ? "T6 ou +" : "T6 or +"}
                          </option>
                        </select>
                      </div>
                    )}

                    {(isApartmentOrHouse || isCommercial) && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          {isPT ? "Casas de banho *" : "Bathrooms *"}
                        </label>
                        <select
                          value={bathrooms}
                          onChange={(e) => {
                            markDirty();
                            setBathrooms(e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                          style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                        >
                          <option value="">
                            {isPT ? "Selecionar" : "Select"}
                          </option>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n}
                              {n === 6 ? "+" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(isApartmentOrHouse ||
                    isCommercial ||
                    isGarage ||
                    isWarehouse) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        {isPT ? "Área útil (m²) *" : "Usable area (m²) *"}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={usableArea}
                        onChange={(e) => {
                          markDirty();
                          setUsableArea(
                            e.target.value
                              .replace(/[^\d]/g, "")
                              .slice(0, AREA_MAX_DIGITS)
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                        style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                      />
                    </div>
                  )}

                  {(isApartmentOrHouse || isCommercial) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        {isPT ? "Área bruta (m²)" : "Gross area (m²)"}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={grossArea}
                        onChange={(e) => {
                          markDirty();
                          setGrossArea(
                            e.target.value
                              .replace(/[^\d]/g, "")
                              .slice(0, AREA_MAX_DIGITS)
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                        style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                      />
                    </div>
                  )}

                  {isLand && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        {isPT ? "Área do terreno (m²) *" : "Land area (m²) *"}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={landArea}
                        onChange={(e) => {
                          markDirty();
                          setLandArea(
                            e.target.value
                              .replace(/[^\d]/g, "")
                              .slice(0, AREA_MAX_DIGITS)
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                        style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                      />
                    </div>
                  )}
                </div>

                {(isApartmentOrHouse ||
                  isCommercial ||
                  isGarage ||
                  isWarehouse) && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {isPT ? "Condição" : "Condition"}
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => {
                        markDirty();
                        setCondition(e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                      style={{ ["--tw-ring-color" as any]: "#10B98122" }}
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
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      {isPT ? "Mobilado" : "Furnished"}
                    </label>
                    <div className="flex flex-wrap gap-2">
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
                            className={[
                              "px-4 py-2 rounded-full text-xs font-semibold border transition",
                              active
                                ? "text-white"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                            ].join(" ")}
                            style={
                              active
                                ? {
                                    backgroundColor: BRAND,
                                    borderColor: BRAND,
                                  }
                                : undefined
                            }
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
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {isPT ? "Certificado energético" : "Energy certificate"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["A+", "A", "B", "C", "D", "E", "F", "G"].map((cert) => {
                        const active = energyCert === cert;
                        return (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => {
                              markDirty();
                              setEnergyCert(active ? "" : cert);
                            }}
                            className={[
                              "w-10 h-10 rounded-full font-bold text-sm border transition",
                              active
                                ? "text-white"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                            ].join(" ")}
                            style={
                              active
                                ? {
                                    backgroundColor: BRAND,
                                    borderColor: BRAND,
                                  }
                                : undefined
                            }
                          >
                            {cert}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          markDirty();
                          setEnergyCert(
                            energyCert === "isento" ? "" : "isento"
                          );
                        }}
                        className={[
                          "px-3 h-10 rounded-full text-xs font-semibold border transition",
                          energyCert === "isento"
                            ? "text-white"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                        style={
                          energyCert === "isento"
                            ? { backgroundColor: BRAND, borderColor: BRAND }
                            : undefined
                        }
                      >
                        {isPT ? "Isento" : "Exempt"}
                      </button>
                    </div>
                  </div>
                )}

                {isCommercial && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      {isPT ? "N.º de divisões" : "Number of rooms"}
                    </label>
                    <select
                      value={divisions}
                      onChange={(e) => {
                        markDirty();
                        setDivisions(e.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                      style={{ ["--tw-ring-color" as any]: "#10B98122" }}
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
              </>
            )}

            {/* ========== STEP 3: PHOTOS & CONTACT ========== */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {isPT ? "Fotografias" : "Photos"}
                  </label>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {isPT
                      ? `Até ${MAX_IMAGES} fotos. A primeira é a capa.`
                      : `Up to ${MAX_IMAGES} photos. First is cover.`}
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
                            className="h-24 sm:h-28 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 transition"
                          >
                            <Plus className="w-5 h-5 text-emerald-700 mb-1" />
                            <span className="text-[11px] font-semibold text-emerald-900">
                              {isPT ? "Adicionar" : "Add photos"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleImagesChange}
                              disabled={
                                uploadingImages ||
                                imageUrls.length >= MAX_IMAGES
                              }
                            />
                          </label>
                        );
                      }

                      if (url) {
                        return (
                          <div
                            key={idx}
                            className="h-24 sm:h-28 rounded-xl bg-slate-100 relative overflow-hidden group"
                          >
                            <img
                              src={url}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition"
                              aria-label={isPT ? "Remover" : "Remove"}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-semibold">
                                {isPT ? "Capa" : "Cover"}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="h-24 sm:h-28 rounded-xl bg-slate-50 border border-dashed border-slate-200"
                        />
                      );
                    })}
                  </div>

                  {uploadingImages && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      {isPT ? "A carregar imagens..." : "Uploading images..."}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Quem está a anunciar?" : "Who is listing?"}
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setPublisherType("owner");
                      }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-sm rounded-full font-semibold transition"
                      style={{
                        backgroundColor:
                          publisherType === "owner" ? BRAND : "transparent",
                        color: publisherType === "owner" ? "white" : "#475569",
                      }}
                    >
                      <HomeIcon className="w-4 h-4" />
                      {isPT ? "Particular" : "Owner"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setPublisherType("agency");
                      }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-sm rounded-full font-semibold transition"
                      style={{
                        backgroundColor:
                          publisherType === "agency" ? BRAND : "transparent",
                        color: publisherType === "agency" ? "white" : "#475569",
                      }}
                    >
                      <Building2 className="w-4 h-4" />
                      {isPT ? "Agência" : "Agency"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Detalhes de contacto *" : "Contact details *"}
                  </label>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {isPT ? "Nome" : "Name"}
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => {
                          markDirty();
                          setContactName(
                            e.target.value.slice(0, NAME_MAX_LENGTH)
                          );
                        }}
                        maxLength={NAME_MAX_LENGTH}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                        style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => {
                            markDirty();
                            setContactEmail(e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                          style={{ ["--tw-ring-color" as any]: "#10B98122" }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {isPT ? "Telemóvel (opcional)" : "Mobile (optional)"}
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                            +351
                          </span>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => {
                              markDirty();
                              setContactPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 9)
                              );
                            }}
                            className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-emerald-400/40 transition"
                            style={{
                              ["--tw-ring-color" as any]: "#10B98122",
                            }}
                            placeholder="912345678"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MESSAGES */}
          {(errorMsg || successMsg) && (
            <div className="px-5 sm:px-7 pb-2">
              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="px-5 sm:px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={[
                "inline-flex items-center gap-1.5 rounded-full text-sm font-semibold px-4 py-2.5 transition",
                currentStep === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-white border border-slate-200",
              ].join(" ")}
            >
              <ChevronLeft className="w-4 h-4" />
              {isPT ? "Voltar" : "Back"}
            </button>

            <div className="text-xs text-slate-400 font-medium">
              {currentStep} / 3
            </div>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-full text-white text-sm font-semibold px-5 py-2.5 shadow-sm transition"
                style={{ backgroundColor: BRAND }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND_HOVER)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND)
                }
              >
                {isPT ? "Continuar" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full text-white text-sm font-semibold px-5 py-2.5 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: BRAND }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND_HOVER)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND)
                }
              >
                {saving ? (
                  isPT ? (
                    "A guardar..."
                  ) : (
                    "Saving..."
                  )
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {isEditing
                      ? isPT
                        ? "Guardar alterações"
                        : "Save changes"
                      : isPT
                      ? "Publicar anúncio"
                      : "Publish listing"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          {isPT
            ? "Pode editar o anúncio a qualquer momento."
            : "You can edit the listing anytime."}
        </p>
      </div>
    </div>
  );
};

export default PropertyListingPage;
