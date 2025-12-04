// src/pages/ServiceProfilePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";

// Value imports from categories.ts
import {
  CATEGORIES,
  SUBCATEGORIES,
  getCategoryLabel,
  getSubcategoryLabel,
} from "../data/categories";

// Type-only imports
import type { CategoryId, Category, Subcategory } from "../data/categories";

/* ---------- SHARED PILL STYLES ---------- */

/* ---------- SHARED PILL STYLES (match HomePage) ---------- */

const pillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-2 text-[11px] sm:text-xs transform transition duration-150";
const pillSize = "min-w-[88px] sm:min-w-[110px]";

const subPillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-1.5 text-[10px] sm:text-xs transform transition duration-150";
const subPillSize = "min-w-[78px] sm:min-w-[100px]";

/* ---------- LANGUAGE OPTIONS (for listing) ---------- */

type LanguageOption = {
  code: string;
  labelEn: string;
  labelPt: string;
  flag: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "pt", labelEn: "Portuguese", labelPt: "Português", flag: "🇵🇹" },
  { code: "en", labelEn: "English", labelPt: "Inglês", flag: "🇬🇧" },
  { code: "es", labelEn: "Spanish", labelPt: "Espanhol", flag: "🇪🇸" },
  { code: "fr", labelEn: "French", labelPt: "Francês", flag: "🇫🇷" },
  { code: "de", labelEn: "German", labelPt: "Alemão", flag: "🇩🇪" },
  { code: "it", labelEn: "Italian", labelPt: "Italiano", flag: "🇮🇹" },
  { code: "ru", labelEn: "Russian", labelPt: "Russo", flag: "🇷🇺" },
];

/* ---------- OPENING HOURS TYPES ---------- */

type OpeningHour = {
  dayKey: string;
  labelEn: string;
  labelPt: string;
  open: string; // "09:00"
  close: string; // "18:00"
  closed: boolean;
};

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

/* ---------- CASCAIS LOCATIONS (new) ---------- */

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

const SERVICE_NAME_MAX_LENGTH = 30;

/* ---------- SERVICE LISTING ROW TYPE ---------- */

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

/* ---------- HELPERS ---------- */

// Take DB phone (maybe "+351 962...") and convert to just the 9 digits
const phoneDbToInput = (dbPhone: string | null): string => {
  if (!dbPhone) return "";
  const digits = dbPhone.replace(/[^\d]/g, ""); // remove + and spaces
  // remove leading 351 if present
  return digits.replace(/^351/, "");
};

// Take input digits and convert to "+351 9xxxxxxx" or null
const phoneInputToDb = (input: string): string | null => {
  const digits = input.replace(/[^\d]/g, "").slice(0, 9);
  if (!digits) return null;
  return `+351 ${digits}`;
};

/* ---------- COMPONENT ---------- */

const ServiceProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isPT = language === "pt";
  const navigate = useNavigate();

  // One listing per user: store its id when it exists
  const [listingId, setListingId] = useState<string | null>(null);

  // Category + Subcategory
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // Main form fields
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");

  // Single selected location
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState(""); // just 9 digits, UI-only
  const [website, setWebsite] = useState("");

  // Social links
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Languages used in the listing
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Profile image for this listing
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Visibility toggle
  const [showProfileOnline, setShowProfileOnline] = useState(true);

  // Opening hours
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    INITIAL_OPENING_HOURS
  );

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

  const descriptionLimit = 800;
  const descriptionLength = description.length;

  /* ---------- LOAD EXISTING LISTING (ONE PER USER) ---------- */

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
        // We have an existing listing – fill the form
        setListingId(data.id);
        setServiceName(data.service_name ?? "");
        setDescription(data.description ?? "");
        setSelectedCategory(data.category_id ?? "all");
        setSelectedSubcategory(data.subcategory_id ?? "");

        const rawLocation = data.location;

        if (Array.isArray(rawLocation) && rawLocation.length > 0) {
          // DB is text[] → take the first element
          setSelectedLocation(rawLocation[0] ?? "");
        } else if (
          typeof rawLocation === "string" &&
          rawLocation.trim() !== ""
        ) {
          // If it's still a plain string (old data), keep previous behaviour
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
        // No listing yet – new listing
        setListingId(null);
        setContactEmail(user.email ?? "");
      }

      setLoadingListing(false);
    };

    loadListing();
  }, [user, authLoading]);

  /* ---------- HANDLERS ---------- */

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value.slice(0, descriptionLimit);
    setDescription(value);
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
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

      setProfileImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Image upload error", err);
      setErrorMsg(
        isPT
          ? `Falha ao carregar a imagem de perfil: ${err?.message ?? ""}`
          : `Failed to upload profile image: ${err?.message ?? ""}`
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      alert(
        isPT
          ? "Tem de iniciar sessão para criar ou editar o seu serviço."
          : "You must be signed in to create or edit your service."
      );
      return;
    }

    if (!serviceName.trim()) {
      alert(
        isPT
          ? "Por favor, indique o nome do serviço."
          : "Please enter the service name."
      );
      return;
    }

    if (!contactEmail.trim()) {
      alert(
        isPT
          ? "Por favor, indique o email de contacto."
          : "Please enter a contact email."
      );
      return;
    }

    if (selectedCategory === "all") {
      alert(
        isPT ? "Por favor, escolha uma categoria." : "Please choose a category."
      );
      return;
    }

    // 🔐 phone must have 9 digits if filled
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 9) {
      alert(
        isPT
          ? "Por favor, indique um número de telefone com 9 dígitos."
          : "Please enter a phone number with 9 digits."
      );
      return;
    }

    if (!selectedLocation) {
      alert(
        isPT
          ? "Por favor, escolha uma zona de atuação."
          : "Please choose a service area."
      );
      return;
    }

    setSaving(true);

    try {
      const dbPhone = phoneInputToDb(phone);

      const payload = {
        user_id: user.id,
        service_name: serviceName.trim(),
        description: description.trim() || null,
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory || null,

        // ✅ DB column is text[] → send a JS array
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
        // Update existing listing
        const { error: updateError } = await supabase
          .from("service_listings")
          .update(payload)
          .eq("id", listingId)
          .eq("user_id", user.id);

        error = updateError;
      } else {
        // Insert new listing
        const { data: insertData, error: insertError } = await supabase
          .from("service_listings")
          .insert(payload)
          .select("id")
          .single();

        if (!insertError && insertData?.id) {
          setListingId(insertData.id);
        }

        error = insertError;
      }

      if (error) {
        console.error("Error saving service listing:", error);
        setErrorMsg(
          isPT
            ? "Ocorreu um erro ao guardar o seu serviço. Verifique as políticas RLS e as colunas da tabela."
            : "Something went wrong while saving your service. Check RLS policies and table columns."
        );
        return;
      }

      setSuccessMsg(
        isPT
          ? "Serviço guardado com sucesso! Quando visível, aparecerá na página inicial."
          : "Service saved successfully! When visible, it will appear on the homepage."
      );

      // Small delay then go back home
      setTimeout(() => navigate("/"), 700);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- RENDER ---------- */

  if (authLoading) {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isPT
            ? "Por favor, inicie sessão para criar o seu perfil de serviço."
            : "Please sign in to create your service profile."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* HEADER */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {isPT ? "O meu perfil de serviço" : "My service profile"}
          </h1>
          <p className="text-sm text-slate-500">
            {isPT
              ? "Configure o seu serviço para aparecer na página inicial do AllCascais."
              : "Set up your service so it appears on the AllCascais homepage."}
          </p>
        </header>

        {loadingListing ? (
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 text-sm text-slate-500">
            {isPT ? "A carregar o seu serviço..." : "Loading your service..."}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-md border border-slate-100 px-6 py-6 space-y-6"
          >
            {/* VISIBILITY TOGGLE */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={showProfileOnline}
                      onChange={(e) => setShowProfileOnline(e.target.checked)}
                    />
                    <span>
                      {isPT
                        ? "Mostrar o meu perfil online 🌐"
                        : "Show my profile online 🌐"}
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-slate-500 max-w-md">
                    {isPT
                      ? "Desmarque se estiver de férias, totalmente reservado ou temporariamente fechado. O seu perfil, ofertas e propriedades ficarão ocultos de todas as páginas."
                      : "Uncheck this if you're on vacation, fully booked, or temporarily closed. Your profile, offers, and properties will be hidden from all pages."}
                  </p>
                </div>

                <div className="text-xs mt-2 sm:mt-1 sm:text-right">
                  {showProfileOnline ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-semibold">
                      ✅ {isPT ? "Atualmente: Visível" : "Currently: Visible"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-3 py-1 font-semibold">
                      ✅ {isPT ? "Atualmente: Oculto" : "Currently: Hidden"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CATEGORY SELECTION */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                {isPT ? "Categoria (obrigatório)" : "Category (required)"}
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
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
                            SUBCATEGORIES[cat.id as CategoryId]?.[0]?.id ?? "";
                          setSelectedSubcategory(firstSub);
                        }}
                        className={[
                          pillBase,
                          pillSize,
                          active
                            ? "border-sky-500 bg-linear-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                            : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                          "hover:-translate-y-0.5 hover:shadow-md",
                        ].join(" ")}
                      >
                        {cat.icon && (
                          <span
                            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-lg sm:text-xl"
                            aria-hidden="true"
                          >
                            {cat.icon}
                          </span>
                        )}
                        <span className="truncate font-medium">
                          {getCategoryLabel(cat.id as CategoryId, isPT)}
                        </span>

                        {active && (
                          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-sky-200/60" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            {/* SUBCATEGORY SELECTION */}
            {selectedCategory !== "all" && currentSubcategories.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  {isPT
                    ? "Subcategoria (escolha uma, se aplicável)"
                    : "Subcategory (choose one, if applicable)"}
                </h2>

                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                  {currentSubcategories.map((sub: Subcategory) => {
                    const active = selectedSubcategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={[
                          subPillBase,
                          subPillSize,
                          active
                            ? "border-sky-500 bg-linear-to-b from-sky-50 to-cyan-50 text-slate-900 ring-2 ring-sky-100"
                            : "border-sky-300 text-slate-700 hover:bg-white hover:border-sky-400",
                          "hover:-translate-y-0.5 hover:shadow-md",
                        ].join(" ")}
                      >
                        <span
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-base"
                          aria-hidden="true"
                        >
                          {sub.icon}
                        </span>
                        <span className="truncate font-medium">
                          {getSubcategoryLabel(selectedCategory, sub.id, isPT)}
                        </span>

                        {active && (
                          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-sky-200/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SERVICE NAME */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Nome do serviço" : "Service name"}
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
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder={
                  isPT
                    ? "Ex: Limpezas Casa Atlântica"
                    : "e.g. Casa Atlântica Cleaning"
                }
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {serviceName.length}/{SERVICE_NAME_MAX_LENGTH}
              </p>
            </div>

            {/* DESCRIPTION + COUNTER */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">
                  {isPT ? "Descrição detalhada" : "Detailed description"}
                </label>
                <span className="text-[11px] text-slate-400">
                  {descriptionLength} / {descriptionLimit}{" "}
                  {isPT ? "caracteres" : "characters"}
                </span>
              </div>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                rows={5}
                maxLength={descriptionLimit}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder={
                  isPT
                    ? "Explique o que oferece, para quem, como funciona, preços aproximados, etc."
                    : "Explain what you offer, who it's for, how it works, approximate pricing, etc."
                }
              />
            </div>

            {/* LOCATION (new pills instead of free text) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Zona de atuação" : "Service area / location"}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isPT
                  ? "Escolha as zonas onde trabalha."
                  : "Choose the areas where you work."}
              </p>

              <div className="flex flex-wrap gap-2">
                {CASCAIS_LOCATIONS.map((loc: string) => {
                  const active = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() =>
                        setSelectedLocation((prev) => (prev === loc ? "" : loc))
                      }
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-xs border transition",
                        active
                          ? "bg-sky-50 border-sky-500 text-sky-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>

              {selectedLocation && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {isPT ? "Zona selecionada:" : "Selected area:"}{" "}
                  {selectedLocation}
                </p>
              )}
            </div>

            {/* CONTACT INFO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Email de contacto" : "Contact email"}
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Telefone" : "Phone"}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-xs text-slate-500">
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
                    className="flex-1 rounded-r-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder={isPT ? "Ex: 912345678" : "e.g. 912345678"}
                  />
                </div>
              </div>
            </div>

            {/* WEBSITE */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Website (opcional)" : "Website (optional)"}
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="https://..."
              />
            </div>

            {/* SOCIAL LINKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Instagram (optional)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="@yourinstagram or URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Facebook (optional)
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Page name or URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  TikTok (optional)
                </label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="@yourtiktok or URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  LinkedIn (optional)
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Profile or company URL"
                />
              </div>
            </div>

            {/* LANGUAGES */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT
                  ? "Idiomas que fala neste serviço"
                  : "Languages you speak for this service"}
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
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
                        active
                          ? "bg-sky-50 border-sky-400 text-sky-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span>{langOpt.flag}</span>
                      <span>{isPT ? langOpt.labelPt : langOpt.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PROFILE IMAGE FOR LISTING */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT
                  ? "Imagem para o seu perfil de serviço"
                  : "Image for your service profile"}
              </label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Service avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {serviceName.charAt(0) || "👤"}
                    </span>
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center rounded-full bg-sky-600 text-white text-xs font-semibold px-4 py-2 shadow-sm hover:bg-sky-700 transition">
                  {uploadingImage
                    ? isPT
                      ? "A carregar..."
                      : "Uploading..."
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

            {/* OPENING HOURS */}
            {/* (unchanged – left as in your original) */}
            {/* ... your opening hours JSX here ... */}

            {/* MESSAGES */}
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

            {/* SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center rounded-full bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? isPT
                    ? "A guardar..."
                    : "Saving..."
                  : isPT
                  ? "Guardar perfil de serviço"
                  : "Save service profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceProfilePage;
