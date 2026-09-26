import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Tag,
  Home,
  Sparkles,
  ShieldCheck,
  Globe,
  ChevronRight,
  Mail,
  Building2,
  MapPin,
  Star,
  ArrowRight,
  Users,
  Quote,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../layouts/MainLayout";

const LandingPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<
    "services" | "offers" | "real-estate"
  >("services");
  const [emailCopied, setEmailCopied] = useState(false);

  /* ---------------------------------------------------------
     TRUST METRICS (concrete, not vague)
  --------------------------------------------------------- */
  const trustMetrics = {
    rating: 4.8,
    reviews: 500,
    providers: 140,
    completedJobs: 1200,
  };

  /* ---------------------------------------------------------
     TESTIMONIALS (real social proof)
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
     SEARCH TABS (unified behavior)
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
      placeholder: isPT
        ? "Ex: T2 Cascais, apartamento Estoril..."
        : "E.g. 2-bed Cascais, apartment Estoril...",
      accent: "bg-emerald-600",
      accentHover: "hover:bg-emerald-700",
      text: "text-emerald-600",
      icon: Home,
    },
  } as const;

  const activeTab = SEARCH_TABS[searchTab];

  const SUGGESTIONS_BY_TAB = {
    services: isPT
      ? ["Eletricista", "Canalizador", "Limpezas", "Dentista", "Restaurante"]
      : ["Electrician", "Plumber", "Cleaning", "Dentist", "Restaurant"],
    offers: isPT
      ? ["Spa", "Surf", "Jantar", "Desconto", "Última hora"]
      : ["Spa", "Surf", "Dinner", "Discount", "Last minute"],
    "real-estate": isPT
      ? ["T2 Cascais", "Moradia Estoril", "Arrendamento", "Venda"]
      : ["2-bed Cascais", "House Estoril", "Rent", "Buy"],
  } as const;

  const suggestions = SUGGESTIONS_BY_TAB[searchTab];

  /* ---------------------------------------------------------
     HANDLERS
  --------------------------------------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(
      q ? `${activeTab.route}?search=${encodeURIComponent(q)}` : activeTab.route
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`${activeTab.route}?search=${encodeURIComponent(suggestion)}`);
  };

  const handleCategoryClick = (route: string) => navigate(route);

  /* ---------------------------------------------------------
     EMAIL HANDLER — mailto + clipboard fallback
  --------------------------------------------------------- */
  const handleEmailClick = async () => {
    const email = "info@allcascais.com";
    const subject = isPT ? "Contacto via AllCascais" : "Contact via AllCascais";

    // 1. Tenta abrir o cliente de email padrão
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}`;

    // 2. Fallback: copia o email para o clipboard + feedback visual
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    } catch {
      // clipboard pode falhar em http:// ou browsers antigos — ignorar
    }
  };

  /* ---------------------------------------------------------
     MAIN CATEGORIES (3 clear paths)
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

  return (
    <div className="min-h-screen bg-[#fafcfb] text-slate-900">
      {/* =========================================================
          1. HERO — StoryBrand: customer as hero, clear problem
      ========================================================== */}
      <section className="relative overflow-hidden min-h-[680px] sm:min-h-[720px] flex items-center">
        <img
          src="/casc.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/50 to-slate-950/80" />

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-96 h-96 rounded-full bg-amber-200/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center text-white">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs sm:text-sm font-medium mb-7 shadow-lg">
              <MapPin className="w-4 h-4 text-sky-300" />
              <span>Cascais</span>
              <span className="text-white/40">·</span>
              <span>PT / EN</span>
            </div>

            {/* HERO — focused on customer problem */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] drop-shadow-2xl">
              {isPT ? (
                <>
                  Encontra um profissional
                  <span className="block text-sky-200">
                    de confiança em Cascais.
                  </span>
                </>
              ) : (
                <>
                  Find a trusted professional
                  <span className="block text-sky-200">in Cascais.</span>
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto mt-5 text-base sm:text-lg md:text-xl text-white/85 leading-relaxed">
              {isPT
                ? "Verificados pela comunidade. Em português ou inglês. Sem intermediários."
                : "Community-verified. In English or Portuguese. No middlemen."}
            </p>

            {/* SOCIAL PROOF — immediate, concrete */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="font-semibold text-white">
                  {trustMetrics.rating}
                </span>
                <span>({trustMetrics.reviews}+)</span>
              </span>
              <span className="text-white/30 hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-white">
                  {trustMetrics.providers}+
                </span>
                <span>{isPT ? "profissionais" : "professionals"}</span>
              </span>
              <span className="text-white/30 hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{isPT ? "Verificados" : "Verified"}</span>
              </span>
            </div>

            {/* =====================================================
                SEARCH CARD — unified behavior across all tabs
            ====================================================== */}
            <div className="mt-9 max-w-2xl mx-auto">
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
                            isActive
                              ? "bg-white text-slate-900"
                              : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
                          ].join(" ")}
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

                {/* Search form — SAME behavior for all tabs */}
                <form
                  onSubmit={handleSearch}
                  className="min-h-[200px] flex flex-col"
                >
                  <div className="flex-1 p-5 sm:p-7">
                    <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-3">
                      {activeTab.question}
                    </p>

                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-slate-300 shrink-0" />

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab.placeholder}
                        className="w-full text-base sm:text-lg outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 p-3">
                    <span className="hidden sm:block text-xs text-slate-400 pl-2">
                      {isPT
                        ? "Procura por aquilo que precisas"
                        : "Search for what you need"}
                    </span>

                    <button
                      type="submit"
                      className={`${activeTab.accent} ${activeTab.accentHover} text-white px-5 sm:px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm shadow-md transition-all hover:shadow-lg ml-auto`}
                    >
                      <activeTab.icon className="w-4 h-4" />
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
              </div>

              {/* Suggestions */}
              <div className="mt-6 min-h-[62px]">
                <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-white/50 mb-3 text-center">
                  {isPT ? "Experimenta com" : "Try searching for"}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="px-3.5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs sm:text-sm text-white hover:bg-white/20 transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FOUNDER STORY — emotional hook (Cialdini: affinity)
      ========================================================== */}
      <section className="relative z-20 -mt-7 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Quote className="w-5 h-5 text-[#1F6FA6]" />
            </div>

            <div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                {isPT
                  ? '"Cresci em Cascais. Vi a minha cidade tornar-se mais internacional, mais vibrante — mas também vi vizinhos recém-chegados a lutar para encontrar um eletricista, um dentista, uma limpeza de confiança. E vi profissionais locais que eu conhecia com a agenda vazia. Havia um fosso. Decidi construir a ponte."'
                  : '"I grew up in Cascais. I watched my town become more international, more vibrant — but I also watched newly-arrived neighbours struggle to find an electrician, a dentist, a trustworthy cleaner. And I watched local professionals I knew with empty schedules. There was a gap. So I built the bridge."'}
              </p>
              <div className="mt-3 text-xs text-slate-500">
                — {isPT ? "Fundador do AllCascais" : "Founder of AllCascais"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. TRUST BAR — concrete metrics (Cialdini: social proof)
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F6FA6]">
              {trustMetrics.providers}+
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
              {isPT ? "Profissionais" : "Professionals"}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-[#1F6FA6]">
              {trustMetrics.completedJobs}+
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
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
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
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
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
              {isPT ? "Dois idiomas" : "Two languages"}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. MAIN CATEGORIES — 3 clear paths, fully clickable
      ========================================================== */}
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

          <p className="mt-3 text-slate-500 leading-relaxed">
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
                className="group relative h-[390px] overflow-hidden rounded-[28px] text-left shadow-md hover:shadow-2xl transition-all duration-500"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-transparent" />

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

                  <p className="text-sm text-white/70 mt-2 max-w-sm">
                    {cat.description}
                  </p>

                  <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-white/90 group-hover:gap-3 transition-all">
                    {cat.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          5. TESTIMONIALS — real social proof (Cialdini)
      ========================================================== */}
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

            <p className="mt-3 text-slate-500 text-sm sm:text-base">
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
          6. BUSINESS CTA — one clear path (Godin: permission)
      ========================================================== */}
      <section className="max-w-7xl mx-auto px-4 py-16">
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

              <p className="text-white/65 mt-4 leading-relaxed text-sm sm:text-base">
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
                    className="flex items-center gap-3 text-sm text-white/80"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Single clear CTA */}
            <div className="lg:justify-self-end w-full lg:w-auto">
              <button
                type="button"
                onClick={() => navigate("/service-listing")}
                className="group w-full lg:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-slate-900 px-8 py-5 font-bold text-base shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 text-[#1F6FA6]" />
                {isPT ? "Publicar o meu serviço" : "List my service"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="mt-3 text-center text-xs text-white/50">
                {isPT
                  ? "Grátis. Leva menos de 5 minutos."
                  : "Free. Takes less than 5 minutes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. FOOTER TRUST
      ========================================================== */}
      <section className="border-t border-slate-200 bg-[#fafcfb]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-500">
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
    FLOATING EMAIL BUTTON (mailto + clipboard fallback)
========================================================== */}
      <button
        type="button"
        onClick={handleEmailClick}
        className="fixed bottom-5 right-5 z-30 group flex items-center gap-2 rounded-full bg-[#1F6FA6] text-white pl-4 pr-5 py-3 shadow-2xl hover:bg-[#195c8a] transition-all hover:-translate-y-0.5"
        aria-label={isPT ? "Enviar-nos um email" : "Send us an email"}
      >
        <Mail className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">
          {emailCopied
            ? isPT
              ? "Email copiado!"
              : "Email copied!"
            : isPT
            ? "Enviar email"
            : "Send email"}
        </span>
      </button>
    </div>
  );
};

export default LandingPage;
