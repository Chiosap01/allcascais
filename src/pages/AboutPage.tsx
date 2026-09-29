// src/pages/AboutPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../layouts/MainLayout";
import {
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  ShieldCheck,
  Heart,
  Globe,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#195c8a";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type WeatherState = {
  temperature: number;
  windspeed: number;
  weatherCode: number;
};

type WeatherMeta = {
  label: string;
  iconPath: string;
};

/* ---------------------------------------------------------
   WEATHER
--------------------------------------------------------- */
const mapWeatherCode = (code: number, isPT: boolean): WeatherMeta => {
  if (code === 0)
    return {
      label: isPT ? "Céu limpo" : "Clear sky",
      iconPath: "/icons/sun.png",
    };
  if (code === 1 || code === 2)
    return {
      label: isPT ? "Maioritariamente limpo" : "Mostly clear",
      iconPath: "/icons/partly.png",
    };
  if (code === 3)
    return {
      label: isPT ? "Nublado" : "Overcast",
      iconPath: "/icons/cloud.png",
    };
  if (code === 45 || code === 48)
    return { label: isPT ? "Nevoeiro" : "Foggy", iconPath: "/icons/fog.png" };
  if (code >= 51 && code <= 67)
    return {
      label: isPT ? "Chuvisco" : "Drizzle",
      iconPath: "/icons/rain.png",
    };
  if (code >= 71 && code <= 77)
    return {
      label: isPT ? "Neve" : "Snow",
      iconPath: "/icons/weather-cloud.png",
    };
  if ((code >= 80 && code <= 82) || (code >= 61 && code <= 69))
    return {
      label: isPT ? "Aguaceiros" : "Rain showers",
      iconPath: "/icons/rain.png",
    };
  if (code >= 95 && code <= 99)
    return {
      label: isPT ? "Trovoada" : "Thunderstorm",
      iconPath: "/icons/thunder.png",
    };
  return {
    label: isPT ? "Meteorologia em Cascais" : "Cascais weather",
    iconPath: "/icons/partly.png",
  };
};

/* ---------------------------------------------------------
   FAQ ITEM (accordion — Krug)
--------------------------------------------------------- */
type FaqItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
      aria-expanded={isOpen}
    >
      <span className="text-sm font-semibold text-slate-900 pr-2">
        {question}
      </span>
      <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition">
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </span>
    </button>

    {isOpen && (
      <div className="px-5 pb-5 -mt-1">
        <div className="text-sm text-slate-600 leading-relaxed pt-1">
          {answer}
        </div>
      </div>
    )}
  </div>
);

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isPT = language === "pt";

  /* ---------- WEATHER (cache em sessionStorage) ---------- */
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = "cascais-weather";
    const CACHE_TTL = 30 * 60 * 1000; // 30 min

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setWeather(data);
          setWeatherLoading(false);
          return;
        }
      } catch {
        /* ignore malformed cache */
      }
    }

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=38.6961&longitude=-9.4217&current_weather=true"
        );
        const data: any = await res.json();
        if (data?.current_weather) {
          const w: WeatherState = {
            temperature: data.current_weather.temperature,
            windspeed: data.current_weather.windspeed,
            weatherCode: data.current_weather.weathercode,
          };
          setWeather(w);
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), data: w })
          );
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  /* ---------- FAQ ACCORDION STATE ---------- */
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const toggleFaq = (id: string) =>
    setOpenFaq((prev) => (prev === id ? null : id));

  /* ---------- HANDLERS ---------- */
  const handleGoToServices = () => navigate("/services");
  const handleGoToCreateServices = () => navigate("/service-listing");

  /* ---------------------------------------------------------
     PROOF POINTS — substituem os "valores" abstratos
     Cialdini: prova concreta > afirmação genérica.
     Cada cartão tem uma ação associada.
  --------------------------------------------------------- */
  const proofPoints = [
    {
      id: "listing",
      icon: Users,
      title: isPT ? "Prestadores locais" : "Local providers",
      desc: isPT
        ? "Profissionais, lojas e serviços publicados pelos próprios — verificados pela comunidade."
        : "Professionals, shops and services posted by their owners — verified by the community.",
      cta: isPT ? "Ver serviços" : "Browse services",
      onClick: () => navigate("/services"),
    },
    {
      id: "contact",
      icon: MessageCircle,
      title: isPT ? "Contacto direto" : "Direct contact",
      desc: isPT
        ? "Telefone, email ou redes sociais. Combinas tudo diretamente, sem taxas pelo meio."
        : "Phone, email or social. You agree everything directly, with no fees in between.",
      cta: isPT ? "Como funciona" : "How it works",
      onClick: () =>
        document
          .getElementById("how-it-works")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      id: "language",
      icon: Globe,
      title: isPT ? "PT / EN" : "PT / EN",
      desc: isPT
        ? "Feito para residentes e recém-chegados. Cada perfil indica os idiomas falados."
        : "Built for residents and newcomers. Every profile shows the languages spoken.",
      cta: isPT ? "Sobre a missão" : "About the mission",
      onClick: () =>
        document
          .getElementById("mission")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  const steps = [
    {
      icon: Search,
      title: isPT ? "Descobre" : "Discover",
      desc: isPT
        ? "Pesquisa por serviço, zona ou categoria. Filtra por avaliação e vê quem está disponível."
        : "Search by service, area, or category. Filter by rating and see who's available.",
    },
    {
      icon: MessageCircle,
      title: isPT ? "Contacta" : "Contact",
      desc: isPT
        ? "Fala diretamente com o profissional — telefone, email ou redes. Sem intermediários."
        : "Talk directly with the professional — phone, email or social. No middlemen.",
    },
    {
      icon: CheckCircle2,
      title: isPT ? "Avalia" : "Review",
      desc: isPT
        ? "Partilha a tua experiência e ajuda outros residentes a escolher bem."
        : "Share your experience and help other residents choose well.",
    },
  ];

  /* ---------------------------------------------------------
     FAQ — reescrito para ser honesto, sem overpromises
     Cialdini: consistência entre o que dizes e o que fazes.
  --------------------------------------------------------- */
  const faqs = [
    {
      id: "find",
      q: isPT
        ? "Como encontro um profissional de confiança?"
        : "How do I find a trusted professional?",
      a: isPT
        ? "Explora a secção de Serviços. Vês a zona de atuação, os idiomas falados e as avaliações de outros residentes antes de contactar. Contactas diretamente — sem passar por nós."
        : "Browse the Services section. You see the service area, languages spoken, and reviews from other residents before contacting. You reach out directly — we don't get in the way.",
    },
    {
      id: "free",
      q: isPT ? "A plataforma é gratuita?" : "Is the platform free?",
      a: isPT
        ? "Sim, para os dois lados. Procurar e contactar serviços é gratuito para residentes. Publicar o perfil também é gratuito para profissionais."
        : "Yes, for both sides. Searching and contacting services is free for residents. Listing a profile is also free for professionals.",
    },
    {
      id: "trust",
      q: isPT ? "Como funcionam as avaliações?" : "How do reviews work?",
      a: isPT
        ? "Quem usa um serviço pode avaliar duas coisas: qualidade do trabalho e pontualidade. Cada avaliação fica associada a uma conta real — não há avaliações anónimas."
        : "Anyone who uses a service can rate two things: work quality and punctuality. Every rating is tied to a real account — there are no anonymous reviews.",
    },
    {
      id: "payments",
      q: isPT
        ? "O AllCascais processa pagamentos?"
        : "Does AllCascais handle payments?",
      a: isPT
        ? "Não. Ligamos quem procura a quem oferece. Pagamento, orçamento e condições são combinados diretamente entre as duas partes."
        : "No. We connect those looking with those offering. Payment, quotes and terms are agreed directly between the two parties.",
    },
    {
      id: "business-model",
      q: isPT
        ? "Como é que o AllCascais se sustenta?"
        : "How does AllCascais sustain itself?",
      a: isPT
        ? "Somos, por agora, um projeto comunitário sem fins lucrativos. No futuro poderemos oferecer destaques pagos a prestadores — mantendo sempre o essencial gratuito para os residentes."
        : "For now we're a non-profit community project. In the future we may offer paid featured placements to providers — always keeping the core free for residents.",
    },
    {
      id: "business",
      q: isPT
        ? "Tenho um negócio. Como publico?"
        : "I run a business. How do I list?",
      a: isPT
        ? 'Clica em "Publicar o meu serviço" e preenche o perfil em três passos. Fica visível na secção de Serviços assim que guardares.'
        : 'Click "List my service" and fill in the profile in three steps. It appears in the Services section as soon as you save.',
    },
  ];

  const weatherMeta =
    weather && !weatherLoading
      ? mapWeatherCode(weather.weatherCode, isPT)
      : {
          label: weatherLoading
            ? isPT
              ? "A carregar…"
              : "Loading…"
            : isPT
            ? "Meteorologia em Cascais"
            : "Cascais weather",
          iconPath: "/icons/weather-partly.png",
        };

  return (
    <div className="min-h-screen bg-transparent">
      {/* =========================================================
          HERO
          Miller: dizer o que a coisa É, não o que "representa".
          Krug: uma CTA primária, uma secundária.
          Wathan: hierarquia visual clara.
          Mobile: weather sai do hero para não tapar CTAs.
      ========================================================== */}
      <section className="relative">
        <div
          className="min-h-[440px] sm:min-h-[520px] w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/cascais-about.jpg')" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/70 to-slate-900/90" />

        <div className="absolute inset-0">
          <div className="max-w-4xl mx-auto px-4 h-full flex flex-col justify-center py-10">
            <div className="text-center text-white">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-md mb-6"
                style={{ backgroundColor: `${BRAND}CC` }}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {isPT
                    ? "Feito em Cascais, para Cascais"
                    : "Made in Cascais, for Cascais"}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                {isPT ? (
                  <>
                    A ligação direta entre
                    <br className="hidden sm:block" />
                    <span className="text-sky-200">
                      residentes e profissionais.
                    </span>
                  </>
                ) : (
                  <>
                    The direct link between
                    <br className="hidden sm:block" />
                    <span className="text-sky-200">
                      residents and professionals.
                    </span>
                  </>
                )}
              </h1>

              <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/85 leading-relaxed mb-8">
                {isPT
                  ? "Sem intermediários, sem comissões. Em português e inglês. Feito para quem vive em Cascais — e para quem acabou de chegar."
                  : "No middlemen, no commissions. In Portuguese and English. Built for those who live in Cascais — and for those who just arrived."}
              </p>

              {/* CTA hierarchy */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGoToServices}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-7 py-3.5 text-sm font-bold shadow-lg hover:bg-slate-50 hover:-translate-y-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  <Search className="w-4 h-4" />
                  {isPT ? "Explorar serviços" : "Explore services"}
                </button>

                <button
                  type="button"
                  onClick={handleGoToCreateServices}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Sparkles className="w-4 h-4" />
                  {isPT ? "Publicar o meu serviço" : "List my service"}
                </button>
              </div>
            </div>
          </div>

          {/* Weather — apenas desktop, dentro do hero */}
          <div className="hidden sm:block absolute bottom-6 right-6">
            <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-white/60">
              <div className="h-9 w-9 flex items-center justify-center shrink-0">
                <img
                  src={weatherMeta.iconPath}
                  alt={weatherMeta.label}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 leading-tight">
                  {weatherLoading
                    ? "—"
                    : weather
                    ? `${Math.round(weather.temperature)}°C`
                    : "N/A"}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {weatherMeta.label} · Cascais
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weather — mobile, fora do hero, em flow normal */}
      <div className="sm:hidden max-w-3xl mx-auto px-4 pt-4">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-2.5">
          <div className="h-8 w-8 flex items-center justify-center shrink-0">
            <img
              src={weatherMeta.iconPath}
              alt={weatherMeta.label}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-slate-900">
              {weatherLoading
                ? "—"
                : weather
                ? `${Math.round(weather.temperature)}°C`
                : "N/A"}
            </span>
            <span className="text-xs text-slate-500 ml-2">
              {weatherMeta.label} · Cascais
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          FOUNDER STORY
          Mobile: avatar circular 80px, name inline next to eyebrow.
          Desktop: 200px photo column + signature block.
      ========================================================== */}
      <section className="max-w-3xl mx-auto px-4 pt-12 sm:pt-16 pb-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Photo — circular on mobile, strip on desktop */}
            <div className="sm:w-[200px] sm:shrink-0 sm:bg-gradient-to-br sm:from-sky-50 sm:to-slate-50 sm:border-r sm:border-slate-100 flex items-start sm:items-stretch justify-center pt-6 sm:pt-0 px-6 sm:px-0">
              <div className="w-20 h-20 sm:w-full sm:h-full rounded-full sm:rounded-none overflow-hidden bg-slate-100 border border-slate-200 sm:border-0 flex items-center justify-center text-xl font-bold text-[#1F6FA6]">
                <img
                  src="/founder.jpg"
                  alt="Paulo Chiosa, fundador do AllCascais"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 sm:p-8 min-w-0">
              {/* Header row */}
              <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
                <div
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em]"
                  style={{ color: BRAND }}
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>
                    {isPT ? "Porque é que isto existe" : "Why this exists"}
                  </span>
                </div>

                {/* Signature inline — mobile only */}
                <div className="sm:hidden text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                    Paulo Chiosa
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {isPT ? "Fundador" : "Founder"} · 2025
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                {isPT
                  ? "Quando a Sarah se mudou para o Estoril, levou três semanas a encontrar um canalizador que falasse inglês. Nesse mesmo mês, o João — eletricista em Cascais há vinte anos — tinha a agenda meio vazia. Percebi que não era falta de profissionais. Era preciso ligá-los. Criei o AllCascais para isso: um sítio onde quem precisa encontra quem sabe, sem intermediários."
                  : "It took Sarah three weeks to find an English-speaking plumber after she moved to Estoril. That same month, João, an electrician in Cascais for 20 years, had half an empty schedule. I realized it wasn't a lack of professionals. It was a failure of connection. So I created AllCascais — a place where those who need find those who know. No intermediaries."}
              </p>

              {/* Signature block — desktop only */}
              <div className="hidden sm:flex mt-6 pt-5 border-t border-slate-100 items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">
                  PC
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    Paulo Chiosa
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {isPT
                      ? "Fundador, AllCascais · Cascais, 2025"
                      : "Founder, AllCascais · Cascais, 2025"}
                  </div>
                </div>
              </div>

              {/* Mission */}
              <div
                id="mission"
                className="mt-6 pt-5 border-t border-slate-100 scroll-mt-24"
              >
                <div
                  className="text-xs font-bold uppercase tracking-[0.15em] mb-2"
                  style={{ color: BRAND }}
                >
                  {isPT ? "A nossa missão" : "Our mission"}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {isPT
                    ? "Ligar residentes e profissionais em Cascais — em português e inglês, sem comissões, sem intermediários. Quem precisa encontra quem sabe."
                    : "Connect residents and professionals in Cascais — in Portuguese and English, with no commissions, no middlemen. Those who need find those who know."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROOF POINTS
          Cialdini: prova concreta > afirmação genérica.
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: BRAND }}
          >
            <ShieldCheck className="w-4 h-4" />
            {isPT ? "O que podes contar" : "What you can count on"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {isPT
              ? "Três coisas que não mudam."
              : "Three things that don't change."}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {isPT
              ? "Nem com 10 ou com 10.000 prestadores. É assim que o AllCascais funciona."
              : "Not with 10 or with 10,000 providers. This is how AllCascais works."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {proofPoints.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={p.onClick}
                className="group text-left bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FA6]/40"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#1F6FA6]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {p.desc}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                  style={{ color: BRAND }}
                >
                  {p.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS — 3 steps, simple
      ========================================================== */}
      <section
        id="how-it-works"
        className="bg-white border-y border-slate-100 scroll-mt-24"
      >
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-3"
              style={{ color: BRAND }}
            >
              <Sparkles className="w-4 h-4" />
              {isPT ? "Como funciona" : "How it works"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {isPT ? "Simples, rápido, direto." : "Simple, fast, direct."}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: BRAND }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: BRAND }}
                    >
                      {isPT ? `Passo ${i + 1}` : `Step ${i + 1}`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ — accordion (Krug: progressive disclosure)
      ========================================================== */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: BRAND }}
          >
            <MessageCircle className="w-4 h-4" />
            {isPT ? "Perguntas frequentes" : "Frequently asked questions"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {isPT
              ? "Tudo o que precisa de saber."
              : "Everything you need to know."}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {isPT
              ? "Respostas rápidas sobre como usar o AllCascais — para quem procura e para quem oferece serviços."
              : "Quick answers on how to use AllCascais — for those seeking and offering services."}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <FaqItem
              key={f.id}
              question={f.q}
              answer={f.a}
              isOpen={openFaq === f.id}
              onToggle={() => toggleFaq(f.id)}
            />
          ))}
        </div>
      </section>

      {/* =========================================================
          CONTACT — single band, low commitment
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-sky-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                {isPT ? "Sugestões ou dúvidas?" : "Suggestions or questions?"}
              </h3>
              <p className="text-sm text-white/75 leading-relaxed mb-4 max-w-xl">
                {isPT
                  ? "Estamos sempre a melhorar o AllCascais com base no feedback da comunidade. Se algo não está a funcionar, diz-nos."
                  : "We're always improving AllCascais based on community feedback. If something isn't working, tell us."}
              </p>
              <a
                href="mailto:info@allcascais.com"
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                info@allcascais.com
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          EMERGENCY — discreto, no fim
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-red-50 border border-red-100 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-sm">
              <span className="text-base font-bold" aria-hidden="true">
                🚨
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-900 mb-1">
                {isPT ? "Emergência em Portugal?" : "Emergency in Portugal?"}
              </h3>
              <p className="text-xs text-red-800/80 leading-relaxed mb-3">
                {isPT
                  ? "O 112 funciona em todo o país para polícia, ambulância e bombeiros."
                  : "112 works everywhere in the country for police, ambulance, and fire department."}
              </p>
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white text-xs font-semibold px-4 py-2 shadow-sm hover:bg-red-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                {isPT ? "Ligar 112" : "Call 112"}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BOTTOM CTA
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-slate-200 p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            {isPT ? "Pronto para começar?" : "Ready to get started?"}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-6">
            {isPT
              ? "Pesquisa por serviço, zona ou categoria — ou publica o teu perfil se ofereces um."
              : "Search by service, area or category — or publish your profile if you offer one."}
          </p>

          <button
            type="button"
            onClick={handleGoToServices}
            className="inline-flex items-center justify-center gap-2 rounded-full text-white px-7 py-3.5 text-sm font-bold shadow-md transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1F6FA6]"
            style={{ backgroundColor: BRAND }}
          >
            <Search className="w-4 h-4" />
            {isPT ? "Explorar serviços" : "Explore services"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
