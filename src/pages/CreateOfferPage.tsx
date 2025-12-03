// src/pages/CreateOffersPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

/* ---------- EXTRA TYPES ---------- */

type CategoryFilterId = CategoryId | "all";

/* ---------- SHARED PILL STYLES ---------- */

const pillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-2 text-[11px] sm:text-xs transform transition duration-150";
const pillSize = "min-w-[88px] sm:min-w-[110px]";

const subPillBase =
  "relative flex flex-col items-center justify-center gap-1 text-center rounded-2xl border bg-white/90 shadow-sm px-3 py-1.5 text-[10px] sm:text-xs transform transition duration-150";
const subPillSize = "min-w-[78px] sm:min-w-[100px]";

/* ---------- LANGUAGE OPTIONS ---------- */

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

const TITLE_MAX_LENGTH = 50;
const SERVICE_NAME_MAX_LENGTH = 30;
const PRICE_MAX_DIGITS = 8;

/* ---------- TYPES FOR PREFILL FROM service_listings & service_offers ---------- */

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

  opening_hours: unknown;
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

  // location is text[] in DB → JS array, or string if you used text before
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

/* ---------- COMPONENT ---------- */

const CreateOffersPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId?: string }>();
  const isEditing = !!offerId;

  // Category + Subcategory
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterId>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // Offer info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceName, setServiceName] = useState(""); // name of the provider’s service
  const [location, setLocation] = useState("");

  // Prices
  const [listPrice, setListPrice] = useState(""); // €
  const [offerPrice, setOfferPrice] = useState(""); // €

  // End date (valid until)
  const [endDate, setEndDate] = useState(""); // yyyy-mm-dd

  // Contact
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Social links
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Languages
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Offer image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // State
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

  const descriptionLimit = 800;
  const descriptionLength = description.length;

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
  }, []);

  /* ---------- PREFILL (EDIT or CREATE) ---------- */

  useEffect(() => {
    const load = async () => {
      if (!user || authLoading) {
        setLoadingPrefill(false);
        return;
      }

      try {
        if (isEditing && offerId) {
          // EDIT MODE: load existing offer
          const { data, error } = await supabase
            .from("service_offers")
            .select("*")
            .eq("id", offerId)
            .eq("user_id", user.id)
            .maybeSingle<ServiceOfferRow>();

          if (error && (error as any).code !== "PGRST116") {
            console.error("Error loading offer for edit", error);
          }

          if (data) {
            setTitle(data.title ?? "");
            setDescription(data.description ?? "");
            setSelectedCategory((data.category_id as CategoryId) ?? "all");
            setSelectedSubcategory(data.subcategory_id ?? "");
            setServiceName(data.service_name ?? "");

            // location (text[] or string) → single string for UI
            let locStr = "";
            if (Array.isArray(data.location) && data.location.length > 0) {
              locStr = data.location[0] ?? "";
            } else if (typeof data.location === "string") {
              locStr = data.location.split(",")[0]?.trim() ?? "";
            }
            setLocation(locStr);

            if (data.original_price != null) {
              setListPrice(String(data.original_price));
            }
            if (data.discounted_price != null) {
              setOfferPrice(String(data.discounted_price));
            }
            setEndDate(data.valid_until ?? "");

            setContactEmail(data.contact_email ?? user.email ?? "");
            setPhone(phoneDbToInput(data.phone ?? null));
            setWebsite(data.website ?? "");

            setInstagram(data.instagram ?? "");
            setFacebook(data.facebook ?? "");
            setTiktok(data.tiktok ?? "");
            setLinkedin(data.linkedin ?? "");

            if (Array.isArray(data.languages)) {
              setSelectedLanguages(data.languages);
            }

            setImageUrl(data.image_url ?? null);
          }
        } else {
          // CREATE MODE: prefill from service_listings
          const { data, error } = await supabase
            .from("service_listings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle<ServiceListingRow>();

          if (error && (error as any).code !== "PGRST116") {
            console.error(
              "Error loading service listing for offer prefill",
              error
            );
          }

          if (data) {
            setServiceName(data.service_name ?? "");
            setSelectedCategory(data.category_id ?? "all");
            setSelectedSubcategory(data.subcategory_id ?? "");

            const rawLocation = data.location ?? "";
            if (rawLocation) {
              const first = rawLocation.split(",")[0]?.trim() ?? "";
              setLocation(first);
            } else {
              setLocation("");
            }

            setContactEmail(data.contact_email ?? user.email ?? "");
            setPhone(phoneDbToInput(data.phone ?? null));
            setWebsite(data.website ?? "");

            setInstagram(data.instagram ?? "");
            setFacebook(data.facebook ?? "");
            setTiktok(data.tiktok ?? "");
            setLinkedin(data.linkedin ?? "");

            if (Array.isArray(data.languages)) {
              setSelectedLanguages(data.languages);
            }

            setImageUrl(data.provider_profile_image_url ?? null);
          } else {
            // no listing yet
            setContactEmail(user.email ?? "");
          }
        }
      } finally {
        setLoadingPrefill(false);
      }
    };

    load();
  }, [user, authLoading, isEditing, offerId]);

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

      const bucketName = "offer-images"; // make sure this exists in Supabase
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

      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Image upload error", err);
      setErrorMsg(
        isPT
          ? `Falha ao carregar a imagem da oferta: ${err?.message ?? ""}`
          : `Failed to upload offer image: ${err?.message ?? ""}`
      );
    } finally {
      setUploadingImage(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      alert(
        isPT
          ? "Tem de iniciar sessão para criar uma oferta."
          : "You must be signed in to create an offer."
      );
      return;
    }

    if (!title.trim()) {
      alert(
        isPT
          ? "Por favor, indique o título da oferta."
          : "Please enter a title."
      );
      return;
    }

    if (!serviceName.trim()) {
      alert(
        isPT
          ? "Por favor, indique o nome do seu serviço."
          : "Please enter your service name."
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

    // Prices
    const listPriceNumber =
      listPrice.trim() !== "" ? Number.parseFloat(listPrice) : null;
    const offerPriceNumber =
      offerPrice.trim() !== "" ? Number.parseFloat(offerPrice) : null;

    if (listPrice.trim() !== "" && Number.isNaN(listPriceNumber as number)) {
      alert(
        isPT
          ? "Preço de tabela inválido."
          : "Invalid list price (original price)."
      );
      return;
    }

    if (offerPrice.trim() !== "" && Number.isNaN(offerPriceNumber as number)) {
      alert(isPT ? "Preço promocional inválido." : "Invalid offer price.");
      return;
    }

    // Ensure valid 9-digit phone
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 9) {
      alert(
        isPT
          ? "Por favor, indique um número de telefone com 9 dígitos."
          : "Please enter a 9-digit phone number."
      );
      return;
    }

    if (!location.trim()) {
      alert(
        isPT
          ? "Por favor, escolha uma zona de atuação."
          : "Please choose a service area."
      );
      return;
    }

    // Ensure "valid until" is after today (if provided)
    if (endDate.trim()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const chosen = new Date(endDate);
      chosen.setHours(0, 0, 0, 0);

      if (Number.isNaN(chosen.getTime())) {
        alert(
          isPT ? "Data de validade inválida." : "Invalid 'valid until' date."
        );
        return;
      }

      if (chosen <= today) {
        alert(
          isPT
            ? "A data de validade deve ser depois de hoje."
            : "The 'valid until' date must be after today."
        );
        return;
      }
    }

    const trimmedLocation = location.trim();
    const dbPhone = phoneInputToDb(phone);

    setSaving(true);
    try {
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
        // 🔁 UPDATE existing offer
        const { error: updateError } = await supabase
          .from("service_offers")
          .update(payload)
          .eq("id", offerId)
          .eq("user_id", user.id);

        error = updateError;
      } else {
        // 🆕 INSERT new offer
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
            ? "Ocorreu um erro ao guardar a oferta. Verifique as políticas RLS e as colunas da tabela."
            : "Something went wrong while saving your offer. Check RLS policies and table columns."
        );
        return;
      }

      setSuccessMsg(
        isEditing
          ? isPT
            ? "Oferta atualizada com sucesso!"
            : "Offer updated successfully!"
          : isPT
          ? "Oferta criada com sucesso!"
          : "Offer created successfully!"
      );

      setTimeout(() => {
        navigate("/offers");
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- COMPUTED: automatic discount percent ---------- */

  const discountPercent =
    listPrice.trim() !== "" &&
    offerPrice.trim() !== "" &&
    !Number.isNaN(Number(listPrice)) &&
    !Number.isNaN(Number(offerPrice)) &&
    Number(listPrice) > 0
      ? Math.round(
          ((Number(listPrice) - Number(offerPrice)) / Number(listPrice)) * 100
        )
      : null;

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">
          {isPT
            ? "Por favor, inicie sessão para criar uma oferta."
            : "Please sign in to create an offer."}
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
            {isPT
              ? isEditing
                ? "Editar oferta"
                : "Criar nova oferta"
              : isEditing
              ? "Edit offer"
              : "Create new offer"}
          </h1>
          <p className="text-sm text-slate-500">
            {isPT
              ? "Adicione uma promoção ou oferta especial para o seu serviço. Aparecerá na página de ofertas do AllCascais."
              : "Add a promotion or special offer for your service. It will appear on the AllCascais offers page."}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-md border border-slate-100 px-6 py-6 space-y-6"
        >
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
                        {getSubcategoryLabel(
                          selectedCategory as CategoryId,
                          sub.id,
                          isPT
                        )}
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

          {/* OFFER TITLE */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Título da oferta" : "Offer title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))
              }
              maxLength={TITLE_MAX_LENGTH}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={
                isPT
                  ? "Ex: 20% de desconto em limpezas de primavera"
                  : "e.g. 20% off spring cleaning"
              }
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {title.length}/{TITLE_MAX_LENGTH}
            </p>
          </div>

          {/* SERVICE NAME */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Nome do seu serviço" : "Your service name"}
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) =>
                setServiceName(e.target.value.slice(0, SERVICE_NAME_MAX_LENGTH))
              }
              maxLength={SERVICE_NAME_MAX_LENGTH}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={
                isPT
                  ? "Ex: Casa Atlântica Limpezas"
                  : "e.g. Casa Atlântica Cleaning"
              }
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {serviceName.length}/{SERVICE_NAME_MAX_LENGTH}
            </p>
          </div>

          {/* DESCRIPTION */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                {isPT ? "Descrição da oferta" : "Offer description"}
              </label>
              <span className="text-[11px] text-slate-400">
                {descriptionLength} / {descriptionLimit}{" "}
                {isPT ? "caracteres" : "characters"}
              </span>
            </div>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              rows={4}
              maxLength={descriptionLimit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={
                isPT
                  ? "Explique o que está incluído na oferta, condições, termos, etc."
                  : "Explain what's included in the offer, conditions, terms, etc."
              }
            />
          </div>

          {/* LOCATION */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Zona de atuação" : "Service area / location"}
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              {isPT
                ? "Escolha a principal zona onde esta oferta se aplica."
                : "Choose the main area where this offer applies."}
            </p>

            <div className="flex flex-wrap gap-2">
              {CASCAIS_LOCATIONS.map((loc: string) => {
                const active = location === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() =>
                      setLocation((prev) => (prev === loc ? "" : loc))
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

            {location && (
              <p className="mt-2 text-[11px] text-slate-500">
                {isPT ? "Zona selecionada:" : "Selected area:"} {location}
              </p>
            )}
          </div>

          {/* PRICES (automatic discount display) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Preço de tabela (€)" : "List price (€)"}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={listPrice}
                onChange={(e) => {
                  const digitsOnly = e.target.value
                    .replace(/[^\d]/g, "")
                    .slice(0, PRICE_MAX_DIGITS);
                  setListPrice(digitsOnly);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Preço da oferta (€)" : "Offer price (€)"}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={offerPrice}
                onChange={(e) => {
                  const digitsOnly = e.target.value
                    .replace(/[^\d]/g, "")
                    .slice(0, PRICE_MAX_DIGITS);
                  setOfferPrice(digitsOnly);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="80"
              />

              {discountPercent !== null && (
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  {isPT
                    ? `Desconto: ${discountPercent}%`
                    : `Discount: ${discountPercent}%`}
                </p>
              )}
            </div>
          </div>

          {/* END DATE ONLY (valid_until) */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Válido até" : "Valid until"}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={todayStr} // ✅ cannot pick a date before today
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
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
                ? "Idiomas em que atende nesta oferta"
                : "Languages you speak for this offer"}
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

          {/* OFFER IMAGE */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Imagem para esta oferta" : "Image for this offer"}
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Offer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">🏷️</span>
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
                ? isEditing
                  ? "Guardar alterações"
                  : "Guardar oferta"
                : isEditing
                ? "Save changes"
                : "Save offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOffersPage;
