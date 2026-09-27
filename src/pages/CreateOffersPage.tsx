// src/pages/CreateOffersPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  Euro,
  Calendar,
  Tag,
  Languages,
  Sparkles,
} from "lucide-react";

import {
  CATEGORIES,
  SUBCATEGORIES,
  getCategoryLabel,
  getSubcategoryLabel,
} from "../data/categories";

import type { CategoryId, Category, Subcategory } from "../data/categories";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#195c8a";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type CategoryFilterId = CategoryId | "all";
type StepId = 1 | 2 | 3;

type LanguageOption = {
  code: string;
  labelEn: string;
  labelPt: string;
  flag: string;
};

type ServiceListingRow = {
  id: string;
  user_id: string;
  service_name: string;
  description: string | null;
  category_id: CategoryId;
  subcategory_id: string | null;
  location: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkedin: string | null;
  show_online: boolean | null;
  provider_profile_image_url: string | null;
  languages: string[] | null;
};

type ServiceOfferRow = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category_id: CategoryId | null;
  subcategory_id: string | null;
  service_name: string | null;
  location: string[] | string | null;
  original_price: number | null;
  discounted_price: number | null;
  valid_until: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkedin: string | null;
  languages: string[] | null;
  image_url: string | null;
};

/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "pt", labelEn: "Portuguese", labelPt: "Português", flag: "🇵🇹" },
  { code: "en", labelEn: "English", labelPt: "Inglês", flag: "🇬🇧" },
  { code: "es", labelEn: "Spanish", labelPt: "Espanhol", flag: "🇪🇸" },
  { code: "fr", labelEn: "French", labelPt: "Francês", flag: "🇫🇷" },
  { code: "de", labelEn: "German", labelPt: "Alemão", flag: "🇩🇪" },
  { code: "it", labelEn: "Italian", labelPt: "Italiano", flag: "🇮🇹" },
  { code: "ru", labelEn: "Russian", labelPt: "Russo", flag: "🇷🇺" },
];

const CASCAIS_LOCATIONS = [
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

const TITLE_MAX_LENGTH = 50;
const SERVICE_NAME_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 800;
const PRICE_MAX_DIGITS = 8;

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
const phoneDbToInput = (dbPhone: string | null): string => {
  if (!dbPhone) return "";
  const digits = dbPhone.replace(/[^\d]/g, "");
  return digits.replace(/^351/, "");
};

const phoneInputToDb = (input: string): string | null => {
  const digits = input.replace(/[^\d]/g, "").slice(0, 9);
  if (!digits) return null;
  return `+351 ${digits}`;
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
const CreateOffersPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId?: string }>();
  const isEditing = !!offerId;

  /* ---------- STATE ---------- */
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Step 1 — The offer
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 — Pricing & validity
  const [listPrice, setListPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");

  // Step 3 — Contact & extras
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // UI
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentSubcategories: Subcategory[] = useMemo(
    () =>
      selectedCategory !== "all"
        ? ((SUBCATEGORIES[selectedCategory as CategoryId] ??
            []) as Subcategory[])
        : [],
    [selectedCategory]
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, []);

  /* ---------- DISCOUNT CALC ---------- */
  const discountPercent = useMemo(() => {
    const lp = parseFloat(listPrice);
    const op = parseFloat(offerPrice);
    if (!isNaN(lp) && !isNaN(op) && lp > 0 && op < lp) {
      return Math.round(((lp - op) / lp) * 100);
    }
    return null;
  }, [listPrice, offerPrice]);

  /* ---------- PREFILL ---------- */
  useEffect(() => {
    const load = async () => {
      if (!user || authLoading) {
        setLoadingPrefill(false);
        return;
      }

      try {
        if (isEditing && offerId) {
          const { data, error } = await supabase
            .from("service_offers")
            .select("*")
            .eq("id", offerId)
            .eq("user_id", user.id)
            .maybeSingle<ServiceOfferRow>();

          if (error && (error as any).code !== "PGRST116") {
            console.error("Error loading offer", error);
          }

          if (data) {
            setTitle(data.title ?? "");
            setDescription(data.description ?? "");
            setSelectedCategory((data.category_id as CategoryId) ?? "all");
            setSelectedSubcategory(data.subcategory_id ?? "");
            setServiceName(data.service_name ?? "");

            let locStr = "";
            if (Array.isArray(data.location) && data.location.length > 0) {
              locStr = data.location[0] ?? "";
            } else if (typeof data.location === "string") {
              locStr = data.location.split(",")[0]?.trim() ?? "";
            }
            setLocation(locStr);

            if (data.original_price != null)
              setListPrice(String(data.original_price));
            if (data.discounted_price != null)
              setOfferPrice(String(data.discounted_price));
            setEndDate(data.valid_until ?? "");

            setContactEmail(data.contact_email ?? user.email ?? "");
            setPhone(phoneDbToInput(data.phone ?? null));
            setWebsite(data.website ?? "");
            setInstagram(data.instagram ?? "");
            setFacebook(data.facebook ?? "");
            setTiktok(data.tiktok ?? "");
            setLinkedin(data.linkedin ?? "");
            if (Array.isArray(data.languages))
              setSelectedLanguages(data.languages);
            setImageUrl(data.image_url ?? null);
          }
        } else {
          const { data, error } = await supabase
            .from("service_listings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle<ServiceListingRow>();

          if (error && (error as any).code !== "PGRST116") {
            console.error("Error loading service listing", error);
          }

          if (data) {
            setServiceName(data.service_name ?? "");
            setSelectedCategory(data.category_id ?? "all");
            setSelectedSubcategory(data.subcategory_id ?? "");

            const rawLocation = data.location ?? "";
            if (rawLocation) {
              const first = rawLocation.split(",")[0]?.trim() ?? "";
              setLocation(first);
            }
            setContactEmail(data.contact_email ?? user.email ?? "");
            setPhone(phoneDbToInput(data.phone ?? null));
            setWebsite(data.website ?? "");
            setInstagram(data.instagram ?? "");
            setFacebook(data.facebook ?? "");
            setTiktok(data.tiktok ?? "");
            setLinkedin(data.linkedin ?? "");
            if (Array.isArray(data.languages))
              setSelectedLanguages(data.languages);
            setImageUrl(data.provider_profile_image_url ?? null);
          } else {
            setContactEmail(user.email ?? "");
          }
        }
      } finally {
        setLoadingPrefill(false);
      }
    };

    load();
  }, [user, authLoading, isEditing, offerId]);

  /* ---------- VALIDATION ---------- */
  const validateStep = (step: StepId): string | null => {
    if (step === 1) {
      if (!title.trim())
        return isPT ? "Indique o título da oferta." : "Enter the offer title.";
      if (!serviceName.trim())
        return isPT
          ? "Indique o nome do seu serviço."
          : "Enter your service name.";
      if (selectedCategory === "all")
        return isPT ? "Escolha uma categoria." : "Choose a category.";
    }
    if (step === 2) {
      const lp = parseFloat(listPrice);
      const op = parseFloat(offerPrice);
      if (!isNaN(lp) && !isNaN(op) && op >= lp)
        return isPT
          ? "O preço da oferta deve ser inferior ao preço de tabela."
          : "Offer price must be lower than list price.";
      if (endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chosen = new Date(endDate);
        chosen.setHours(0, 0, 0, 0);
        if (chosen <= today)
          return isPT
            ? "A data de validade deve ser no futuro."
            : "Valid until date must be in the future.";
      }
      if (!location.trim())
        return isPT ? "Escolha uma zona." : "Choose a service area.";
    }
    if (step === 3) {
      if (!contactEmail.trim())
        return isPT ? "Indique o email." : "Enter the contact email.";
      const clean = phone.replace(/\D/g, "");
      if (clean.length !== 9)
        return isPT
          ? "O telefone deve ter 9 dígitos."
          : "Phone must have 9 digits.";
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

  /* ---------- HANDLERS ---------- */
  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingImage(true);
      setErrorMsg(null);

      const bucketName = "offer-images";
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true, cacheControl: "3600" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Image upload error", err);
      setErrorMsg(
        isPT
          ? `Falha ao carregar imagem: ${err?.message ?? ""}`
          : `Failed to upload image: ${err?.message ?? ""}`
      );
    } finally {
      setUploadingImage(false);
    }
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
      const listPriceNumber = listPrice.trim()
        ? Number.parseFloat(listPrice)
        : null;
      const offerPriceNumber = offerPrice.trim()
        ? Number.parseFloat(offerPrice)
        : null;
      const dbPhone = phoneInputToDb(phone);
      const trimmedLocation = location.trim();

      const payload = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category_id: selectedCategory as CategoryId,
        subcategory_id: selectedSubcategory || null,
        service_name: serviceName.trim(),
        location: trimmedLocation ? [trimmedLocation] : null,
        original_price: listPriceNumber,
        discounted_price: offerPriceNumber,
        valid_until: endDate || null,
        contact_email: contactEmail.trim(),
        phone: dbPhone,
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        linkedin: linkedin.trim() || null,
        languages: selectedLanguages.length > 0 ? selectedLanguages : null,
        image_url: imageUrl,
      };

      let error;

      if (isEditing && offerId) {
        const { error: updateError } = await supabase
          .from("service_offers")
          .update(payload)
          .eq("id", offerId)
          .eq("user_id", user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("service_offers")
          .insert(payload)
          .select("id")
          .single();
        error = insertError;
      }

      if (error) {
        console.error("Error saving offer:", error);
        setErrorMsg(
          isPT
            ? "Erro ao guardar. Verifique as políticas RLS."
            : "Something went wrong. Check RLS policies."
        );
        return;
      }

      setSuccessMsg(
        isEditing
          ? isPT
            ? "Oferta atualizada!"
            : "Offer updated!"
          : isPT
          ? "Oferta criada!"
          : "Offer created!"
      );

      setTimeout(() => navigate("/offers"), 1200);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1 as StepId, label: isPT ? "A oferta" : "The offer" },
    { id: 2 as StepId, label: isPT ? "Preços" : "Pricing" },
    { id: 3 as StepId, label: isPT ? "Contactos" : "Contacts" },
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
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {isPT ? "Inicie sessão" : "Sign in"}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            {isPT
              ? "Precisa de iniciar sessão para criar uma oferta."
              : "You need to sign in to create an offer."}
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/auth", { state: { from: "/offers/new" } })
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
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {isPT ? "Oferta especial" : "Special offer"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {isEditing
              ? isPT
                ? "Editar oferta"
                : "Edit offer"
              : isPT
              ? "Criar nova oferta"
              : "Create new offer"}
          </h1>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isPT
              ? "Atraia clientes com promoções. 3 passos rápidos."
              : "Attract customers with promotions. 3 quick steps."}
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
            {/* ========== STEP 1: THE OFFER ========== */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Categoria *" : "Category *"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter((c: Category) => c.id !== "all").map(
                      (cat: Category) => {
                        const active = cat.id === selectedCategory;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id as CategoryId);
                              const firstSub =
                                SUBCATEGORIES[cat.id as CategoryId]?.[0]?.id ??
                                "";
                              setSelectedSubcategory(firstSub);
                            }}
                            className={[
                              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                              active
                                ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {cat.icon && <span>{cat.icon}</span>}
                            <span>
                              {getCategoryLabel(cat.id as CategoryId, isPT)}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {selectedCategory !== "all" &&
                  currentSubcategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        {isPT
                          ? "Subcategoria (opcional)"
                          : "Subcategory (optional)"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {currentSubcategories.map((sub: Subcategory) => {
                          const active = selectedSubcategory === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setSelectedSubcategory(sub.id)}
                              className={[
                                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                                active
                                  ? "border-amber-400 bg-amber-50 text-amber-800"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <span>{sub.icon}</span>
                              <span>
                                {getSubcategoryLabel(
                                  selectedCategory as CategoryId,
                                  sub.id,
                                  isPT
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {isPT ? "Título da oferta *" : "Offer title *"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))
                    }
                    maxLength={TITLE_MAX_LENGTH}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                    placeholder={
                      isPT
                        ? "Ex: 20% de desconto em limpezas de primavera"
                        : "e.g. 20% off spring cleaning"
                    }
                  />
                  <p className="mt-1 text-[11px] text-slate-400 text-right">
                    {title.length}/{TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Nome do seu serviço *" : "Your service name *"}
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) =>
                      setServiceName(
                        e.target.value.slice(0, SERVICE_NAME_MAX_LENGTH)
                      )
                    }
                    maxLength={SERVICE_NAME_MAX_LENGTH}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                    placeholder={
                      isPT
                        ? "Ex: Casa Atlântica Limpezas"
                        : "e.g. Casa Atlântica Cleaning"
                    }
                  />
                  <p className="mt-1 text-[11px] text-slate-400 text-right">
                    {serviceName.length}/{SERVICE_NAME_MAX_LENGTH}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-800">
                      {isPT ? "Descrição" : "Description"}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {description.length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value.slice(0, DESCRIPTION_MAX_LENGTH)
                      )
                    }
                    rows={5}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                    placeholder={
                      isPT
                        ? "Explique o que está incluído, condições, termos..."
                        : "Explain what's included, conditions, terms..."
                    }
                  />
                </div>
              </>
            )}

            {/* ========== STEP 2: PRICING ========== */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      {isPT ? "Preço tabela (€)" : "List price (€)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={listPrice}
                      onChange={(e) =>
                        setListPrice(
                          e.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, PRICE_MAX_DIGITS)
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                      style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      {isPT ? "Preço da oferta (€)" : "Offer price (€)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={offerPrice}
                      onChange={(e) =>
                        setOfferPrice(
                          e.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, PRICE_MAX_DIGITS)
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                      style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                      placeholder="80"
                    />
                  </div>
                </div>

                {discountPercent !== null && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      -{discountPercent}%
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-emerald-900">
                        {isPT
                          ? `Desconto de ${discountPercent}%`
                          : `${discountPercent}% discount`}
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        {isPT
                          ? `Poupa €${(
                              parseFloat(listPrice) - parseFloat(offerPrice)
                            ).toLocaleString("pt-PT")}`
                          : `Saves €${(
                              parseFloat(listPrice) - parseFloat(offerPrice)
                            ).toLocaleString("en-US")}`}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {isPT ? "Válido até" : "Valid until"}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={todayStr}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isPT
                      ? "Deixe em branco para oferta sem limite."
                      : "Leave empty for unlimited offer."}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {isPT ? "Zona de atuação *" : "Service area *"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CASCAIS_LOCATIONS.map((loc) => {
                      const active = location === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() =>
                            setLocation((prev) => (prev === loc ? "" : loc))
                          }
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition",
                            active
                              ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {active && <MapPin className="w-3 h-3" />}
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ========== STEP 3: CONTACT ========== */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {isPT ? "Email de contacto *" : "Contact email *"}
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {isPT ? "Telefone *" : "Phone *"}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      +351
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                      }
                      className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                      style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                      placeholder="912345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {isPT ? "Website (opcional)" : "Website (optional)"}
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                    style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT
                      ? "Redes sociais (opcional)"
                      : "Social links (optional)"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        value: instagram,
                        setter: setInstagram,
                        placeholder: "@instagram",
                        label: "Instagram",
                      },
                      {
                        value: facebook,
                        setter: setFacebook,
                        placeholder: "facebook.com/...",
                        label: "Facebook",
                      },
                      {
                        value: tiktok,
                        setter: setTiktok,
                        placeholder: "@tiktok",
                        label: "TikTok",
                      },
                      {
                        value: linkedin,
                        setter: setLinkedin,
                        placeholder: "linkedin.com/...",
                        label: "LinkedIn",
                      },
                    ].map((s) => (
                      <div key={s.label}>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {s.label}
                        </label>
                        <input
                          type="text"
                          value={s.value}
                          onChange={(e) => s.setter(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 transition"
                          style={{ ["--tw-ring-color" as any]: "#F59E0B22" }}
                          placeholder={s.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    {isPT ? "Idiomas em que atende" : "Languages you speak"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((langOpt) => {
                      const active = selectedLanguages.includes(langOpt.code);
                      return (
                        <button
                          key={langOpt.code}
                          type="button"
                          onClick={() => toggleLanguage(langOpt.code)}
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                              ? "border-amber-400 bg-amber-50 text-amber-800"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span>{langOpt.flag}</span>
                          <span>
                            {isPT ? langOpt.labelPt : langOpt.labelEn}
                          </span>
                          {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {isPT ? "Imagem da oferta" : "Offer image"}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Offer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <label
                      className="cursor-pointer inline-flex items-center rounded-full text-white text-xs font-semibold px-4 py-2.5 shadow-sm transition"
                      style={{ backgroundColor: BRAND }}
                    >
                      {uploadingImage
                        ? isPT
                          ? "A carregar..."
                          : "Uploading..."
                        : imageUrl
                        ? isPT
                          ? "Trocar imagem"
                          : "Change image"
                        : isPT
                        ? "Carregar imagem"
                        : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={uploadingImage}
                      />
                    </label>
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
                      ? "Publicar oferta"
                      : "Publish offer"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          {isPT
            ? "Pode editar a sua oferta a qualquer momento."
            : "You can edit your offer anytime."}
        </p>
      </div>
    </div>
  );
};

export default CreateOffersPage;
