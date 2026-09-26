// src/pages/ServiceProfilePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Clock,
  Image as ImageIcon,
  Eye,
  EyeOff,
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
type LanguageOption = {
  code: string;
  labelEn: string;
  labelPt: string;
  flag: string;
};

type OpeningHour = {
  dayKey: string;
  labelEn: string;
  labelPt: string;
  open: string;
  close: string;
  closed: boolean;
};

type ServiceListingRow = {
  id: string;
  user_id: string;
  service_name: string;
  description: string | null;
  category_id: CategoryId;
  subcategory_id: string | null;
  location: string[] | string | null;
  contact_email: string;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  linkedin: string | null;
  opening_hours: OpeningHour[] | null;
  show_online: boolean | null;
  provider_profile_image_url: string | null;
  languages: string[] | null;
};

type StepId = 1 | 2 | 3;

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

const CASCAIS_LOCATIONS: string[] = [
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

const INITIAL_OPENING_HOURS: OpeningHour[] = [
  {
    dayKey: "mon",
    labelEn: "Monday",
    labelPt: "Segunda",
    open: "09:00",
    close: "18:00",
    closed: false,
  },
  {
    dayKey: "tue",
    labelEn: "Tuesday",
    labelPt: "Terça",
    open: "09:00",
    close: "18:00",
    closed: false,
  },
  {
    dayKey: "wed",
    labelEn: "Wednesday",
    labelPt: "Quarta",
    open: "09:00",
    close: "18:00",
    closed: false,
  },
  {
    dayKey: "thu",
    labelEn: "Thursday",
    labelPt: "Quinta",
    open: "09:00",
    close: "18:00",
    closed: false,
  },
  {
    dayKey: "fri",
    labelEn: "Friday",
    labelPt: "Sexta",
    open: "09:00",
    close: "18:00",
    closed: false,
  },
  {
    dayKey: "sat",
    labelEn: "Saturday",
    labelPt: "Sábado",
    open: "10:00",
    close: "14:00",
    closed: true,
  },
  {
    dayKey: "sun",
    labelEn: "Sunday",
    labelPt: "Domingo",
    open: "10:00",
    close: "14:00",
    closed: true,
  },
];

const SERVICE_NAME_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 800;

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
const ServiceProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isPT = language === "pt";
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [listingId, setListingId] = useState<string | null>(null);

  // Step 1
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showProfileOnline, setShowProfileOnline] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    INITIAL_OPENING_HOURS
  );

  // UI
  const [saving, setSaving] = useState(false);
  const [loadingListing, setLoadingListing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentSubcategories: Subcategory[] = useMemo(
    () =>
      selectedCategory !== "all"
        ? ((SUBCATEGORIES[selectedCategory] ?? []) as Subcategory[])
        : [],
    [selectedCategory]
  );

  /* ---------- LOAD EXISTING LISTING ---------- */
  useEffect(() => {
    const loadListing = async () => {
      if (!user || authLoading) {
        setLoadingListing(false);
        return;
      }

      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<ServiceListingRow>();

      if (error && (error as any).code !== "PGRST116") {
        console.error("Error loading service listing", error);
      }

      if (data) {
        setListingId(data.id);
        setServiceName(data.service_name ?? "");
        setDescription(data.description ?? "");
        setSelectedCategory(data.category_id ?? "all");
        setSelectedSubcategory(data.subcategory_id ?? "");

        const rawLocation = data.location;
        if (Array.isArray(rawLocation) && rawLocation.length > 0) {
          setSelectedLocation(rawLocation[0] ?? "");
        } else if (
          typeof rawLocation === "string" &&
          rawLocation.trim() !== ""
        ) {
          const first = rawLocation.split(",")[0]?.trim() ?? "";
          setSelectedLocation(first);
        } else {
          setSelectedLocation("");
        }

        setContactEmail(data.contact_email ?? user.email ?? "");
        setPhone(phoneDbToInput(data.phone ?? null));
        setWebsite(data.website ?? "");
        setInstagram(data.instagram ?? "");
        setFacebook(data.facebook ?? "");
        setTiktok(data.tiktok ?? "");
        setLinkedin(data.linkedin ?? "");
        setShowProfileOnline(data.show_online ?? true);
        setOpeningHours(
          data.opening_hours && Array.isArray(data.opening_hours)
            ? data.opening_hours
            : INITIAL_OPENING_HOURS
        );
        setProfileImageUrl(data.provider_profile_image_url ?? null);
        setSelectedLanguages(data.languages ?? []);
      } else {
        setListingId(null);
        setContactEmail(user.email ?? "");
      }

      setLoadingListing(false);
    };

    loadListing();
  }, [user, authLoading]);

  /* ---------- STEP VALIDATION ---------- */
  const validateStep = (step: StepId): string | null => {
    if (step === 1) {
      if (!serviceName.trim())
        return isPT
          ? "Indique o nome do serviço."
          : "Please enter the service name.";
      if (selectedCategory === "all")
        return isPT ? "Escolha uma categoria." : "Please choose a category.";
    }
    if (step === 2) {
      if (!contactEmail.trim())
        return isPT
          ? "Indique o email de contacto."
          : "Please enter a contact email.";
      const clean = phone.replace(/\D/g, "");
      if (clean.length !== 9)
        return isPT
          ? "O telefone deve ter 9 dígitos."
          : "Phone must have 9 digits.";
      if (!selectedLocation)
        return isPT
          ? "Escolha uma zona de atuação."
          : "Please choose a service area.";
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
    if (currentStep < 3) {
      goToStep((currentStep + 1) as StepId);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      goToStep((currentStep - 1) as StepId);
    }
  };

  /* ---------- HANDLERS ---------- */
  const handleOpeningHourChange = (
    index: number,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setOpeningHours((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

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

      const bucketName = "profile-images";
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true, cacheControl: "3600" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

      setProfileImageUrl(publicUrl);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
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
      const dbPhone = phoneInputToDb(phone);

      const payload = {
        user_id: user.id,
        service_name: serviceName.trim(),
        description: description.trim() || null,
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory || null,
        location: selectedLocation ? [selectedLocation] : null,
        contact_email: contactEmail.trim(),
        phone: dbPhone,
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        linkedin: linkedin.trim() || null,
        opening_hours: openingHours,
        show_online: showProfileOnline,
        provider_profile_image_url: profileImageUrl,
        languages: selectedLanguages.length > 0 ? selectedLanguages : null,
      };

      let error;

      if (listingId) {
        const { error: updateError } = await supabase
          .from("service_listings")
          .update(payload)
          .eq("id", listingId)
          .eq("user_id", user.id);
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("service_listings")
          .insert(payload)
          .select("id")
          .single();
        if (!insertError && insertData?.id) setListingId(insertData.id);
        error = insertError;
      }

      if (error) {
        console.error("Error saving service listing:", error);
        setErrorMsg(
          isPT
            ? "Erro ao guardar. Verifique as políticas RLS."
            : "Something went wrong. Check RLS policies."
        );
        return;
      }

      setSuccessMsg(
        isPT ? "Serviço guardado com sucesso!" : "Service saved successfully!"
      );
      setTimeout(() => navigate("/"), 800);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- STEP LABELS ---------- */
  const steps = [
    { id: 1 as StepId, label: isPT ? "Serviço" : "Service" },
    { id: 2 as StepId, label: isPT ? "Contactos" : "Contacts" },
    { id: 3 as StepId, label: isPT ? "Detalhes" : "Details" },
  ];

  /* ---------- RENDER ---------- */
  if (authLoading || loadingListing) {
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
          <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#1F6FA6]" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {isPT ? "Inicie sessão" : "Sign in"}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            {isPT
              ? "Precisa de iniciar sessão para criar o seu perfil de serviço."
              : "You need to sign in to create your service profile."}
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/auth", { state: { from: "/service-listing" } })
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {isPT ? "Perfil de serviço" : "Service profile"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {listingId
              ? isPT
                ? "Editar o meu serviço"
                : "Edit my service"
              : isPT
              ? "Criar o meu serviço"
              : "Create my service"}
          </h1>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isPT
              ? "Preencha os 3 passos. Leva menos de 5 minutos."
              : "Fill in 3 steps. Takes less than 5 minutes."}
          </p>
        </header>

        {/* STEP INDICATOR */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden"
        >
          {/* STEP CONTENT */}
          <div className="px-5 sm:px-7 py-6 space-y-6">
            {/* ---------- STEP 1: SERVICE ---------- */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Escolha a categoria *" : "Choose your category *"}
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
                                ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6] shadow-sm"
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
                                  ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6] shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <span>{sub.icon}</span>
                              <span>
                                {getSubcategoryLabel(
                                  selectedCategory,
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
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Nome do serviço *" : "Service name *"}
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                    placeholder={
                      isPT
                        ? "Ex: Limpezas Casa Atlântica"
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                    style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                    placeholder={
                      isPT
                        ? "Explique o que oferece, para quem, como funciona..."
                        : "Explain what you offer, who it's for, how it works..."
                    }
                  />
                </div>
              </>
            )}

            {/* ---------- STEP 2: CONTACTS ---------- */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Zona de atuação *" : "Service area *"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CASCAIS_LOCATIONS.map((loc: string) => {
                      const active = selectedLocation === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() =>
                            setSelectedLocation((prev) =>
                              prev === loc ? "" : loc
                            )
                          }
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition",
                            active
                              ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6] shadow-sm"
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

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Email de contacto *" : "Contact email *"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                      style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Telefone *" : "Phone *"}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                      +351
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const onlyDigits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9);
                        setPhone(onlyDigits);
                      }}
                      className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                      style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                      placeholder="912345678"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isPT ? "9 dígitos" : "9 digits"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {isPT ? "Website (opcional)" : "Website (optional)"}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                      style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* ---------- STEP 3: DETAILS ---------- */}
            {currentStep === 3 && (
              <>
                {/* Visibility toggle — top, since it's important */}
                <div
                  className={[
                    "rounded-2xl border px-4 py-3 transition",
                    showProfileOnline
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-amber-200 bg-amber-50/60",
                  ].join(" ")}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProfileOnline}
                      onChange={(e) => setShowProfileOnline(e.target.checked)}
                      className="mt-1 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {showProfileOnline ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-amber-600" />
                        )}
                        {isPT
                          ? "Mostrar o meu perfil online"
                          : "Show my profile online"}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {isPT
                          ? "Desmarque se estiver de férias ou temporariamente fechado."
                          : "Uncheck if you're on vacation or temporarily closed."}
                      </p>
                    </div>
                    <span
                      className={[
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                        showProfileOnline
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white",
                      ].join(" ")}
                    >
                      {showProfileOnline
                        ? isPT
                          ? "Visível"
                          : "Visible"
                        : isPT
                        ? "Oculto"
                        : "Hidden"}
                    </span>
                  </label>
                </div>

                {/* Profile image */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT
                      ? "Imagem do perfil (opcional)"
                      : "Profile image (optional)"}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Service"
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
                        : profileImageUrl
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

                {/* Languages */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    {isPT ? "Idiomas que fala" : "Languages you speak"}
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
                              ? "border-[#1F6FA6] bg-sky-50 text-[#1F6FA6]"
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

                {/* Social links */}
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
                        icon: Instagram,
                        label: "Instagram",
                      },
                      {
                        value: facebook,
                        setter: setFacebook,
                        placeholder: "facebook.com/...",
                        icon: Facebook,
                        label: "Facebook",
                      },
                      {
                        value: tiktok,
                        setter: setTiktok,
                        placeholder: "@tiktok",
                        icon: Youtube,
                        label: "TikTok",
                      },
                      {
                        value: linkedin,
                        setter: setLinkedin,
                        placeholder: "linkedin.com/...",
                        icon: Linkedin,
                        label: "LinkedIn",
                      },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={s.value}
                            onChange={(e) => s.setter(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                            style={{
                              ["--tw-ring-color" as any]: `${BRAND}22`,
                            }}
                            placeholder={s.placeholder}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Opening hours */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {isPT ? "Horário de funcionamento" : "Opening hours"}
                  </label>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <div className="col-span-4">{isPT ? "Dia" : "Day"}</div>
                      <div className="col-span-3">{isPT ? "Abre" : "Open"}</div>
                      <div className="col-span-3">
                        {isPT ? "Fecha" : "Close"}
                      </div>
                      <div className="col-span-2 text-center">
                        {isPT ? "Fech." : "Closed"}
                      </div>
                    </div>
                    {openingHours.map((row, index) => (
                      <div
                        key={row.dayKey}
                        className="px-3 py-2 grid grid-cols-12 gap-2 items-center border-t border-slate-100 bg-white"
                      >
                        <div className="col-span-4 text-xs font-medium text-slate-700">
                          {isPT ? row.labelPt : row.labelEn}
                        </div>
                        <div className="col-span-3">
                          <input
                            type="time"
                            value={row.open}
                            disabled={row.closed}
                            onChange={(e) =>
                              handleOpeningHourChange(
                                index,
                                "open",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 disabled:bg-slate-50 disabled:text-slate-400 transition"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="time"
                            value={row.close}
                            disabled={row.closed}
                            onChange={(e) =>
                              handleOpeningHourChange(
                                index,
                                "close",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F6FA6]/30 disabled:bg-slate-50 disabled:text-slate-400 transition"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <input
                            type="checkbox"
                            checked={row.closed}
                            onChange={(e) =>
                              handleOpeningHourChange(
                                index,
                                "closed",
                                e.target.checked
                              )
                            }
                            className="rounded border-slate-300"
                          />
                        </div>
                      </div>
                    ))}
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
                type="submit"
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
                    {isPT ? "Guardar perfil" : "Save profile"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* FOOTER TIP */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          {isPT
            ? "Pode editar o seu perfil a qualquer momento."
            : "You can edit your profile anytime."}
        </p>
      </div>
    </div>
  );
};

export default ServiceProfilePage;
