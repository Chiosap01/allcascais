import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Tag,
  Home,
  Sparkles,
  ShieldCheck,
  Globe,
  Mail,
  MapPin,
  Star,
  ArrowRight,
  Users,
  Quote,
  CheckCircle2,
  Building2,
  X,
  Gift,
  Send,
  Loader2,
  AlertCircle,
  MessageCircle,
  Lock,
} from "lucide-react";
import { useLanguage } from "../layouts/MainLayout";
import { supabase } from "../supabase";

/* =========================================================
   CONTACT MODAL
   Godin: permissão, não interrupção
   Krug: 3 campos, zero fricção
   Norman: feedback claro em todos os estados
========================================================= */
type ContactSubject = "question" | "feedback" | "partnership";

const ContactModal: React.FC<{
  open: boolean;
  onClose: () => void;
  isPT: boolean;
}> = ({ open, onClose, isPT }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<ContactSubject>("question");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Reset ao fechar ---------- */
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName("");
        setEmail("");
        setMessage("");
        setSubject("question");
        setStatus("idle");
        setErrorMsg(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* ---------- ESC + scroll lock + focus ---------- */
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstInputRef.current?.focus(), 100);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const SUBJECTS: { id: ContactSubject; pt: string; en: string }[] = [
    { id: "question", pt: "Dúvida", en: "Question" },
    { id: "feedback", pt: "Sugestão", en: "Feedback" },
    { id: "partnership", pt: "Parceria", en: "Partnership" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg(
        isPT ? "Preenche todos os campos." : "Please fill in all fields."
      );
      return;
    }

    setStatus("submitting");

    const subjectLine = SUBJECTS.find((s) => s.id === subject);
    const subjectLabel = isPT ? subjectLine?.pt : subjectLine?.en;

    const payload = {
      source: "landing-contact",
      page_url: window.location.href,
      language: isPT ? "pt" : "en",
      name: name.trim(),
      email: email.trim(),
      notes: message.trim(),
      meta: {
        subject: subjectLabel ?? subject,
        subject_id: subject,
      },
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;

      setStatus("success");
      setTimeout(() => onClose(), 1600);
    } catch (err) {
      console.error("Contact insert failed:", err);
      setStatus("error");
      setErrorMsg(
        isPT
          ? "Não conseguimos enviar automaticamente. Usa o email direto:"
          : "Couldn't submit automatically. Use direct email:"
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1F6FA6] mb-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {isPT ? "Fala connosco" : "Talk to us"}
            </div>
            <h2
              id="contact-modal-title"
              className="text-base sm:text-lg font-semibold text-slate-900"
            >
              {isPT ? "Como podemos ajudar?" : "How can we help?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FA6]"
            aria-label={isPT ? "Fechar" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {status === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {isPT ? "Mensagem enviada!" : "Message sent!"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT ? "Respondemos em até 24h." : "We reply within 24h."}
            </p>
          </div>
        )}

        {/* Form */}
        {status !== "success" && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4"
            noValidate
          >
            {/* Subject chips */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                {isPT ? "Motivo" : "Reason"}
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => {
                  const active = subject === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSubject(s.id)}
                      className={[
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FA6]",
                        active
                          ? "bg-sky-50 border-[#1F6FA6] text-[#1F6FA6]"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      {isPT ? s.pt : s.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="contact-name"
                className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
              >
                {isPT ? "Nome" : "Name"}
              </label>
              <input
                id="contact-name"
                ref={firstInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                style={{ ["--tw-ring-color" as any]: "#1F6FA622" }}
                placeholder={isPT ? "O teu nome" : "Your name"}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="contact-email"
                className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                style={{ ["--tw-ring-color" as any]: "#1F6FA622" }}
                placeholder="email@exemplo.com"
                autoComplete="email"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
              >
                {isPT ? "Mensagem" : "Message"}
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition resize-none"
                style={{ ["--tw-ring-color" as any]: "#1F6FA622" }}
                placeholder={
                  isPT ? "Escreve a tua mensagem..." : "Write your message..."
                }
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{errorMsg}</div>
                  <a
                    href="mailto:info@allcascais.com"
                    className="mt-1 inline-block font-semibold underline underline-offset-2"
                  >
                    info@allcascais.com
                  </a>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold py-3 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed bg-[#1F6FA6] hover:bg-[#195c8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1F6FA6]"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPT ? "A enviar..." : "Sending..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isPT ? "Enviar mensagem" : "Send message"}
                </>
              )}
            </button>

            {/* Trust line */}
            <p className="text-[11px] text-slate-500 text-center">
              {isPT ? "Ou envia diretamente para " : "Or email us directly at "}
              <a
                href="mailto:info@allcascais.com"
                className="font-semibold text-[#1F6FA6] hover:underline"
              >
                info@allcascais.com
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   LEAD MAGNET
   Godin: dar valor primeiro, pedir permissão depois
   Cialdini: reciprocidade + prova social
   Miller: o guia como "ferramenta" dada pelo guia
========================================================= */
const LeadMagnetSection: React.FC<{ isPT: boolean }> = ({ isPT }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg(isPT ? "Introduz um email válido." : "Enter a valid email.");
      return;
    }

    setStatus("submitting");

    const payload = {
      source: "landing-lead-magnet",
      page_url: window.location.href,
      language: isPT ? "pt" : "en",
      email: clean,
      meta: {
        magnet: "cascais-guide-2025",
        magnet_name: isPT
          ? "Guia Viver em Cascais 2025"
          : "Cascais Living Guide 2025",
      },
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error("Lead magnet insert failed:", err);
      setStatus("error");
      setErrorMsg(
        isPT
          ? "Não conseguimos guardar. Tenta novamente."
          : "Couldn't save. Please try again."
      );
    }
  };

  const bullets = isPT
    ? [
        "25 profissionais recomendados por zona",
        "Checklist de mudança em 30 dias",
        "Ofertas exclusivas de boas-vindas",
      ]
    : [
        "25 recommended professionals by area",
        "30-day moving-in checklist",
        "Exclusive welcome offers",
      ];

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-slate-200">
        {/* Decoração */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 p-6 sm:p-10">
          {/* LEFT — content */}
          <div className="lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1F6FA6] shadow-sm mb-5">
              <Gift className="w-3.5 h-3.5" />
              {isPT ? "Guia grátis" : "Free guide"}
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              {isPT ? (
                <>
                  Viver em Cascais,
                  <span className="block text-[#1F6FA6]">
                    sem complicações.
                  </span>
                </>
              ) : (
                <>
                  Living in Cascais,
                  <span className="block text-[#1F6FA6]">
                    without the hassle.
                  </span>
                </>
              )}
            </h2>

            {/* Description */}
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
              {isPT
                ? "O guia essencial para quem acabou de chegar — ou está a pensar mudar-se. Profissionais, dicas e tudo o que precisas para te instalares bem."
                : "The essential guide for newcomers — or anyone planning the move. Professionals, tips and everything you need to settle in well."}
            </p>

            {/* Bullets */}
            <ul className="mt-6 space-y-2.5">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Social proof — Cialdini */}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <div className="flex -space-x-2">
                {["SM", "JP", "EL"].map((initials, i) => (
                  <div
                    key={initials}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: ["#1F6FA6", "#10B981", "#F59E0B"][i],
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span>
                {isPT
                  ? "Junta-te a residentes que já recebem as nossas dicas."
                  : "Join residents already getting our tips."}
              </span>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="lg:col-span-2 lg:self-center">
            {status === "success" ? (
              <div className="rounded-3xl bg-white border border-emerald-200 shadow-md p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  {isPT ? "Guia a caminho!" : "Guide on its way!"}
                </h3>
                <p className="text-xs text-slate-600">
                  {isPT
                    ? "Verifica o teu email nos próximos minutos."
                    : "Check your email in the next few minutes."}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white border border-slate-200 shadow-md p-5 sm:p-6 space-y-3"
                noValidate
              >
                <label
                  htmlFor="lead-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {isPT
                    ? "Recebe o guia no teu email"
                    : "Get the guide by email"}
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-4 focus:border-[#1F6FA6]/40 transition"
                    style={{ ["--tw-ring-color" as any]: "#1F6FA622" }}
                    placeholder="email@exemplo.com"
                    autoComplete="email"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold py-3 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed bg-[#1F6FA6] hover:bg-[#195c8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1F6FA6]"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isPT ? "A enviar..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      {isPT ? "Receber guia grátis" : "Get free guide"}
                    </>
                  )}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Lock className="w-3 h-3" />
                  {isPT
                    ? "Sem spam. Cancelas quando quiseres."
                    : "No spam. Unsubscribe anytime."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */
const LandingPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<
    "services" | "offers" | "real-estate"
  >("services");

  /* ---------- Contact modal state ---------- */
  const [contactOpen, setContactOpen] = useState(false);

  /* ---------- Floating button: visível após scroll (Krug) ---------- */
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowFloating(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------------------------------------------------
     TRUST METRICS
  --------------------------------------------------------- */
  const trustMetrics = {
    rating: 4.8,
    reviews: 500,
    providers: 140,
    completedJobs: 1200,
  };

  /* ---------------------------------------------------------
     TESTIMONIALS
  --------------------------------------------------------- */
  const testimonials = [
    {
      id: "1",
      name: "Sarah M.",
      role: isPT ? "Expat no Estoril" : "Expat in Estoril",
      avatar: "SM",
      quote: isPT
        ? "Encontrei um canalizador que falava inglês em 10 minutos. Salvou o meu domingo."
        : "Found an English-speaking plumber in 10 minutes. Saved my Sunday.",
      service: isPT ? "Canalização" : "Plumbing",
    },
    {
      id: "2",
      name: "João P.",
      role: isPT ? "Residente em Cascais" : "Cascais resident",
      avatar: "JP",
      quote: isPT
        ? "Finalmente um sítio onde encontro profissionais de confiança sem pedir favores no Facebook."
        : "Finally a place where I find trusted pros without asking favors on Facebook.",
      service: isPT ? "Eletricidade" : "Electrical",
    },
    {
      id: "3",
      name: "Emma L.",
      role: isPT ? "Recém-chegada a Carcavelos" : "New to Carcavelos",
      avatar: "EL",
      quote: isPT
        ? "Mudei-me há um mês e já usei o AllCascais três vezes. Nunca falhou."
        : "Moved here a month ago and already used AllCascais three times. Never failed.",
      service: isPT ? "Limpezas" : "Cleaning",
    },
  ];

  /* ---------------------------------------------------------
     SEARCH TABS
  --------------------------------------------------------- */
  const SEARCH_TABS = {
    services: {
      route: "/services",
      label: isPT ? "Serviços" : "Services",
      question: isPT ? "O que precisas?" : "What do you need?",
      placeholder: isPT
        ? "Ex: canalizador, dentista, limpezas..."
        : "E.g. plumber, dentist, cleaning...",
      accent: "bg-[#1F6FA6]",
      accentHover: "hover:bg-[#195c8a]",
      text: "text-[#1F6FA6]",
      icon: Search,
    },
    offers: {
      route: "/offers",
      label: isPT ? "Ofertas" : "Offers",
      question: isPT ? "O que procuras?" : "What are you looking for?",
      placeholder: isPT
        ? "Ex: spa, surf, jantar, desconto..."
        : "E.g. spa, surf, dinner, discount...",
      accent: "bg-amber-500",
      accentHover: "hover:bg-amber-600",
      text: "text-amber-600",
      icon: Tag,
    },
    "real-estate": {
      route: "/real-estate",
      label: isPT ? "Imóveis" : "Properties",
      question: isPT ? "O que procuras?" : "What are you looking for?",
      placeholder: "",
      accent: "bg-emerald-600",
      accentHover: "hover:bg-emerald-700",
      text: "text-emerald-600",
      icon: Home,
    },
  } as const;

  const activeTab = SEARCH_TABS[searchTab];
  const ActiveIcon = activeTab.icon;

  const SUGGESTIONS_BY_TAB = {
    services: isPT
      ? ["Eletricista", "Canalizador", "Limpezas", "Dentista", "Restaurante"]
      : ["Electrician", "Plumber", "Cleaning", "Dentist", "Restaurant"],
    offers: isPT
      ? ["Spa", "Surf", "Jantar", "Desconto", "Última hora"]
      : ["Spa", "Surf", "Dinner", "Discount", "Last minute"],
    "real-estate": [],
  } as const;

  const suggestions = SUGGESTIONS_BY_TAB[searchTab];

  /* ---------------------------------------------------------
     HANDLERS
  --------------------------------------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === "real-estate") return;

    const q = searchQuery.trim();
    navigate(
      q ? `${activeTab.route}?search=${encodeURIComponent(q)}` : activeTab.route
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (searchTab === "real-estate") return;
    setSearchQuery(suggestion);
    navigate(`${activeTab.route}?search=${encodeURIComponent(suggestion)}`);
  };

  const handleCategoryClick = (route: string) => navigate(route);

  const handleBuyClick = () => navigate("/real-estate?buyRent=buy");
  const handleRentClick = () => navigate("/real-estate?buyRent=rent");

  /* ---------------------------------------------------------
     MAIN CATEGORIES
  --------------------------------------------------------- */
  const categories = [
    {
      id: "services",
      route: "/services",
      label: isPT ? "SERVIÇOS" : "SERVICES",
      title: isPT ? "Encontra quem te ajude." : "Find someone to help.",
      description: isPT
        ? "Profissionais, restaurantes, saúde, casa, atividades e mais."
        : "Professionals, restaurants, health, home, activities and more.",
      cta: isPT ? "Explorar serviços" : "Explore services",
      accent: "#1F6FA6",
      icon: Search,
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "offers",
      route: "/offers",
      label: isPT ? "OFERTAS" : "OFFERS",
      title: isPT ? "Descobre o que acontece." : "Discover what's on.",
      description: isPT
        ? "Experiências, wellness, descontos e oportunidades locais."
        : "Experiences, wellness, discounts and local opportunities.",
      cta: isPT ? "Explorar ofertas" : "Explore offers",
      accent: "#F59E0B",
      icon: Tag,
      image:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "real-estate",
      route: "/real-estate",
      label: isPT ? "IMÓVEIS" : "PROPERTIES",
      title: isPT ? "Encontra o teu lugar." : "Find your next place.",
      description: isPT
        ? "Casas, apartamentos e espaços para viver ou investir."
        : "Homes, apartments and spaces to live or invest.",
      cta: isPT ? "Explorar imóveis" : "Explore properties",
      accent: "#10B981",
      icon: Home,
      image:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop",
    },
  ];

  /* ---------------------------------------------------------
     3-STEP PLAN (Miller)
  --------------------------------------------------------- */
  const STEPS = [
    { n: 1, label: isPT ? "Pesquisa" : "Search" },
    { n: 2, label: isPT ? "Contacta direto" : "Contact direct" },
    { n: 3, label: isPT ? "Avalia" : "Review" },
  ];

  return (
    <div className="min-h-screen bg-[#fafcfb] text-slate-900">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden min-h-[600px] sm:min-h-[720px] flex items-center">
        <img
          src="/casc.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/55 to-slate-950/85" />

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-96 h-96 rounded-full bg-amber-200/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 sm:py-16">
          <div className="text-center text-white">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs sm:text-sm font-medium mb-5 sm:mb-6 shadow-lg">
              <MapPin className="w-4 h-4 text-sky-300" />
              <span>Cascais</span>
              <span className="text-white/50">·</span>
              <span>PT / EN</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] drop-shadow-2xl">
              {isPT ? (
                <>
                  Em Cascais,
                  <span className="block text-sky-200">tudo resolvido.</span>
                </>
              ) : (
                <>
                  In Cascais,
                  <span className="block text-sky-200">
                    everything handled.
                  </span>
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto mt-5 text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
              {isPT
                ? "Profissionais verificados, ofertas locais e imóveis — em PT/EN, sem intermediários."
                : "Verified professionals, local deals and properties — in EN/PT, no middlemen."}
            </p>

            {/* Social proof */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="font-semibold text-white">
                  {trustMetrics.rating}
                </span>
                <span className="text-white/80">({trustMetrics.reviews}+)</span>
              </span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-white">
                  {trustMetrics.providers}+
                </span>
                <span className="text-white/80">
                  {isPT ? "profissionais" : "professionals"}
                </span>
              </span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-white/90">
                  {isPT ? "Verificados" : "Verified"}
                </span>
              </span>
            </div>

            {/* SEARCH CARD */}
            <div className="mt-8 sm:mt-9 max-w-2xl mx-auto">
              <div className="bg-white rounded-[28px] shadow-2xl overflow-hidden text-left border border-white/30">
                {/* Tabs */}
                <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50">
                  {(["services", "offers", "real-estate"] as const).map(
                    (key) => {
                      const tab = SEARCH_TABS[key];
                      const Icon = tab.icon;
                      const isActive = searchTab === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSearchTab(key)}
                          className={[
                            "relative flex items-center justify-center gap-2 py-4 px-2 text-xs sm:text-sm font-semibold transition-all",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FA6] focus-visible:ring-inset",
                            isActive
                              ? "bg-white text-slate-900"
                              : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
                          ].join(" ")}
                          aria-pressed={isActive}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>

                          {isActive && (
                            <span
                              className={`absolute bottom-0 left-0 right-0 h-[3px] ${tab.accent}`}
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="sm:h-[240px] flex flex-col">
                  {searchTab !== "real-estate" && (
                    <form
                      onSubmit={handleSearch}
                      className="sm:h-full flex flex-col"
                    >
                      <div className="p-4 sm:p-6 sm:flex-1">
                        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-3">
                          {activeTab.question}
                        </p>

                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-[#1F6FA6] focus-within:ring-4 focus-within:ring-[#1F6FA6]/15 transition">
                          <Search className="w-5 h-5 text-slate-300 shrink-0" />

                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeTab.placeholder}
                            className="w-full text-base outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                        <span className="hidden sm:block text-xs text-slate-500">
                          {isPT
                            ? "Procura por aquilo que precisas"
                            : "Search for what you need"}
                        </span>

                        <button
                          type="submit"
                          className={`${activeTab.accent} ${activeTab.accentHover} text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm shadow-md transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1F6FA6] ml-auto`}
                        >
                          <ActiveIcon className="w-4 h-4" />
                          {searchQuery.trim()
                            ? isPT
                              ? "Procurar"
                              : "Search"
                            : isPT
                            ? "Explorar"
                            : "Explore"}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {searchTab === "real-estate" && (
                    <div className="flex flex-col p-4 sm:p-6 sm:h-full">
                      <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-3">
                        {isPT
                          ? "Escolhe o que procuras"
                          : "Choose what you're looking for"}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 sm:flex-1">
                        <button
                          type="button"
                          onClick={handleBuyClick}
                          className="group rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-3.5 text-left hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <Home className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-900">
                              {isPT ? "Comprar" : "Buy"}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              {isPT
                                ? "Casas e apartamentos para venda."
                                : "Homes and apartments for sale."}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={handleRentClick}
                          className="group rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-3.5 text-left hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-900">
                              {isPT ? "Arrendar" : "Rent"}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              {isPT
                                ? "Para viver agora, sem complicações."
                                : "Move-in ready, no hassle."}
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Abaixo do card */}
              <div className="mt-5 sm:mt-6 flex flex-col justify-start gap-4">
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-white/90">
                  {STEPS.map((step, idx) => (
                    <React.Fragment key={step.n}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 border border-white/30 text-[10px] font-bold">
                          {step.n}
                        </span>
                        <span className="font-medium">{step.label}</span>
                      </span>
                      {idx < STEPS.length - 1 && (
                        <span className="text-white/50" aria-hidden="true">
                          →
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {searchTab !== "real-estate" && suggestions.length > 0 && (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/70 text-center">
                      {isPT ? "Experimenta com" : "Try searching for"}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleSuggestionClick(item)}
                          className="px-3.5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs sm:text-sm text-white hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {searchTab === "real-estate" && (
                  <div className="text-center">
                    <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/70 mb-2">
                      {isPT ? "Sabia que" : "Did you know"}
                    </p>
                    <p className="text-xs sm:text-sm text-white/85 max-w-md mx-auto">
                      {isPT
                        ? "Pode filtrar por zona, tipo, quartos e preço dentro da página de imóveis."
                        : "You can filter by area, type, bedrooms and price inside the properties page."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="relative z-20 -mt-7 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Quote className="w-5 h-5 text-[#1F6FA6]" />
            </div>

            <div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                {isPT
                  ? '"Cresci em Cascais. Vi a minha cidade tornar-se mais internacional, mais vibrante, mas também vi vizinhos recém-chegados a lutar para encontrar um eletricista, um dentista, uma limpeza de confiança. E vi profissionais locais que eu conhecia com a agenda vazia. Decidi construir a ponte."'
                  : '"I grew up in Cascais. I watched my town become more international, more vibrant, but I also watched newly-arrived neighbours struggle to find an electrician, a dentist, a trustworthy cleaner. And I watched local professionals I knew with empty schedules. So I built the bridge."'}
              </p>
              <div className="mt-3 text-xs text-slate-500">
                — {isPT ? "Fundador do AllCascais" : "Founder of AllCascais"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F6FA6]">
              {trustMetrics.providers}+
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              {isPT ? "Profissionais" : "Professionals"}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F6FA6]">
              {trustMetrics.completedJobs}+
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              {isPT ? "Serviços concluídos" : "Jobs completed"}
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center gap-1.5">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {trustMetrics.rating}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              {isPT ? "Avaliação média" : "Average rating"}
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center gap-1.5">
              <Globe className="w-6 h-6 text-[#1F6FA6]" />
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                PT / EN
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              {isPT ? "Dois idiomas" : "Two languages"}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="max-w-2xl mb-9">
          <div className="flex items-center gap-2 text-[#1F6FA6] text-xs font-bold uppercase tracking-[0.15em] mb-3">
            <Sparkles className="w-4 h-4" />
            AllCascais
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {isPT
              ? "Descobre Cascais à tua maneira."
              : "Discover Cascais your way."}
          </h2>

          <p className="mt-3 text-slate-600 leading-relaxed">
            {isPT
              ? "Encontra o que precisas, descobre novas experiências ou encontra o próximo lugar para chamar de casa."
              : "Find what you need, discover new experiences, or find your next place to call home."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.route)}
                className="group relative h-[390px] overflow-hidden rounded-[28px] text-left shadow-md hover:shadow-2xl transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1F6FA6]/40"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/35 to-transparent" />

                <div className="absolute top-5 left-5">
                  <span
                    className="inline-flex items-center gap-2 rounded-full text-white px-3 py-1.5 text-xs font-semibold shadow-lg"
                    style={{ backgroundColor: cat.accent }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold">{cat.title}</h3>

                  <p className="text-sm text-white/80 mt-2 max-w-sm">
                    {cat.description}
                  </p>

                  <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                    {cat.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
              <Star className="w-4 h-4 fill-amber-500" />
              {isPT ? "Histórias reais" : "Real stories"}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {isPT
                ? "O que dizem os residentes de Cascais"
                : "What Cascais residents say"}
            </h2>

            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              {isPT
                ? "Histórias reais de quem já usou o AllCascais para resolver o seu dia-a-dia."
                : "Real stories from people who used AllCascais to solve their day-to-day."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50 rounded-3xl border border-slate-100 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-5">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-[#1F6FA6] text-white flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          LEAD MAGNET — Godin + Cialdini
      ========================================================== */}
      <div className="pt-16">
        <LeadMagnetSection isPT={isPT} />
      </div>

      {/* BUSINESS CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-10 sm:px-10 sm:py-12">
          <div className="absolute -right-20 -top-32 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sky-300 text-xs uppercase tracking-[0.15em] font-bold mb-4">
                <Star className="w-4 h-4" />
                AllCascais for business
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                {isPT
                  ? "Tens um negócio em Cascais?"
                  : "Do you run a business in Cascais?"}
              </h2>

              <p className="text-white/75 mt-4 leading-relaxed text-sm sm:text-base">
                {isPT
                  ? "Publica o teu serviço gratuitamente e aparece para os residentes que já procuram o que ofereces. Sem taxas, sem intermediários."
                  : "Publish your service for free and appear to residents already searching for what you offer. No fees, no middlemen."}
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  isPT
                    ? "Perfil verificado pela comunidade"
                    : "Community-verified profile",
                  isPT
                    ? "Aparece nas buscas locais"
                    : "Appear in local searches",
                  isPT
                    ? "Contacto direto, sem comissões"
                    : "Direct contact, no commissions",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/90"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:justify-self-end w-full lg:w-auto">
              <button
                type="button"
                onClick={() => navigate("/service-listing")}
                className="group w-full lg:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-slate-900 px-8 py-5 font-bold text-base shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Sparkles className="w-5 h-5 text-[#1F6FA6]" />
                {isPT ? "Publicar o meu serviço" : "List my service"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="mt-3 text-center text-xs text-white/70">
                {isPT
                  ? "Grátis. Leva menos de 5 minutos."
                  : "Free. Takes less than 5 minutes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER TRUST */}
      <section className="border-t border-slate-200 bg-[#fafcfb]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1F6FA6]" />
              {isPT ? "Comunidade verificada" : "Community verified"}
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1F6FA6]" />
              PT / EN
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1F6FA6]" />
              Cascais, Portugal
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FLOATING CONTACT BUTTON
          Krug: só aparece após scroll
          Godin: abre modal (permissão), não mailto (interrupção)
      ========================================================== */}
      <button
        type="button"
        onClick={() => setContactOpen(true)}
        aria-hidden={!showFloating}
        tabIndex={showFloating ? 0 : -1}
        className={[
          "fixed bottom-5 right-5 z-30 group flex items-center gap-2 rounded-full bg-[#1F6FA6] text-white pl-4 pr-5 py-3 shadow-2xl",
          "hover:bg-[#195c8a] hover:-translate-y-0.5",
          "transition-all duration-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1F6FA6]",
          showFloating
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none",
        ].join(" ")}
        aria-label={isPT ? "Falar connosco" : "Talk to us"}
      >
        <Mail className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">
          {isPT ? "Falar connosco" : "Talk to us"}
        </span>
      </button>

      {/* =========================================================
          CONTACT MODAL
      ========================================================== */}
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        isPT={isPT}
      />
    </div>
  );
};

export default LandingPage;
