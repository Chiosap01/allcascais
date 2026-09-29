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
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";

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

  /* ---------- CONTENT ---------- */
  /* Stats honestos — afirmam o que somos, não números que não temos */
  const stats = [
    {
      value: isPT ? "Grátis" : "Free",
      label: isPT
        ? "Para residentes e prestadores"
        : "For residents and providers",
    },
    {
      value: isPT ? "Sem comissões" : "No fees",
      label: isPT ? "Contacto direto" : "Direct contact",
    },
    {
      value: "PT / EN",
      label: isPT ? "Dois idiomas" : "Two languages",
    },
    {
      value: isPT ? "Local" : "Local",
      label: isPT ? "Focado em Cascais" : "Focused on Cascais",
    },
  ];

  const steps = [
    {
      icon: Search,
      title: isPT ? "Descubra" : "Discover",
      desc: isPT
        ? "Pesquise por serviço, zona ou categoria."
        : "Search by service, area, or category.",
    },
    {
      icon: MessageCircle,
      title: isPT ? "Contacte" : "Contact",
      desc: isPT
        ? "Fale diretamente com o profissional, sem intermediários."
        : "Talk directly with the professional, no middlemen.",
    },
    {
      icon: CheckCircle2,
      title: isPT ? "Avalie" : "Review",
      desc: isPT
        ? "Partilhe a sua experiência e ajude a comunidade."
        : "Share your experience and help the community.",
    },
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: isPT ? "Confiança" : "Trust",
      desc: isPT
        ? "Cada serviço é publicado pelo próprio prestador. A comunidade avalia depois de usar."
        : "Each service is posted by the provider. The community rates after use.",
      color: "#1F6FA6",
    },
    {
      icon: Heart,
      title: isPT ? "Local" : "Local",
      desc: isPT
        ? "Do centro histórico ao Guincho — tudo focado em Cascais."
        : "From the historic centre to Guincho — all focused on Cascais.",
      color: "#10B981",
    },
    {
      icon: Globe,
      title: isPT ? "Inclusivo" : "Inclusive",
      desc: isPT
        ? "Em português e inglês. Feito para residentes e visitantes."
        : "In Portuguese and English. Made for residents and visitors.",
      color: "#F59E0B",
    },
  ];

  const faqs = [
    {
      id: "find",
      q: isPT
        ? "Como encontro um profissional de confiança?"
        : "How do I find a trusted professional?",
      a: isPT
        ? "Explore a secção de Serviços. Pode ver classificações, comentários e zonas de atuação antes de contactar. Os perfis com histórico de avaliações ficam visíveis no topo."
        : "Browse the Services section. Check ratings, reviews, and service areas before contacting. Profiles with a review history appear higher in the list.",
    },
    {
      id: "free",
      q: isPT ? "A plataforma é gratuita?" : "Is the platform free?",
      a: isPT
        ? "Sim. Procurar e contactar serviços é totalmente gratuito para residentes. Para profissionais, publicar é grátis — sem taxas de intermediários."
        : "Yes. Searching and contacting services is completely free for residents. For professionals, listing is free — no middleman fees.",
    },
    {
      id: "trust",
      q: isPT ? "Como funcionam as avaliações?" : "How do reviews work?",
      a: isPT
        ? "Cada serviço é publicado pelo próprio prestador. A comunidade avalia depois de usar — qualidade do trabalho e pontualidade. Os perfis com histórico de avaliações ficam visíveis no topo."
        : "Each service is posted by the provider themselves. The community rates after use — work quality and punctuality. Profiles with review history appear higher.",
    },
    {
      id: "payments",
      q: isPT
        ? "O AllCascais processa pagamentos?"
        : "Does AllCascais handle payments?",
      a: isPT
        ? "Não. O AllCascais liga diretamente o cliente ao profissional. Pagamento e condições são combinados diretamente entre as partes."
        : "No. AllCascais connects the client directly to the professional. Payment and terms are agreed directly between both parties.",
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
        ? 'Clique em "Publicar o meu serviço" e preencha o perfil em 3 passos rápidos. Fica visível na secção de Serviços imediatamente.'
        : 'Click "List my service" and fill in the profile in 3 quick steps. It appears in the Services section immediately.',
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
          HERO — mission-driven, single primary CTA
      ========================================================== */}
      <section className="relative">
        <div
          className="min-h-[420px] sm:min-h-[520px] w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/cascais-about.jpg')" }}
        />

        {/* Overlay — topo menos escuro para céu, fundo escuro para texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/65 to-slate-900/90" />

        {/* Content */}
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

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                {isPT ? (
                  <>
                    Tudo o que precisas,
                    <br className="hidden sm:block" />
                    <span className="text-sky-200">ao lado de casa.</span>
                  </>
                ) : (
                  <>
                    Everything you need,
                    <br className="hidden sm:block" />
                    <span className="text-sky-200">right next door.</span>
                  </>
                )}
              </h1>

              <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/85 leading-relaxed mb-8">
                {isPT
                  ? "AllCascais liga residentes e visitantes a profissionais locais — sem intermediários, em português e inglês."
                  : "AllCascais connects residents and visitors with local professionals — no middlemen, in Portuguese and English."}
              </p>

              {/* Primary CTA + secondary */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGoToServices}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-7 py-3.5 text-sm font-bold shadow-lg hover:bg-slate-50 hover:-translate-y-0.5 transition"
                >
                  <Search className="w-4 h-4" />
                  {isPT ? "Explorar serviços" : "Explore services"}
                </button>

                <button
                  type="button"
                  onClick={handleGoToCreateServices}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {isPT ? "Publicar o meu serviço" : "List my service"}
                </button>
              </div>
            </div>
          </div>

          {/* Weather card — bottom, discreet */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
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

      {/* =========================================================
          FOUNDER STORY — a alma da página (Miller/Godin)
      ========================================================== */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center text-3xl sm:text-4xl">
              🌉
            </div>

            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-3"
                style={{ color: BRAND }}
              >
                <Heart className="w-4 h-4" />
                {isPT ? "Porque é que isto existe" : "Why this exists"}
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic mb-4">
                {isPT
                  ? '"Cresci em Cascais. Vi a minha cidade tornar-se mais internacional, mais vibrante, mas também vi vizinhos recém-chegados a lutar para encontrar um eletricista, um dentista, uma limpeza de confiança. E vi profissionais locais que eu conhecia com a agenda vazia. Decidi construir a ponte."'
                  : '"I grew up in Cascais. I watched my town become more international, more vibrant, but I also watched newly-arrived neighbours struggle to find an electrician, a dentist, a trustworthy cleaner. And I watched local professionals I knew with empty schedules. So I built the bridge."'}
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {isPT ? "— Fundador do AllCascais" : "— Founder of AllCascais"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
    FOUNDER STORY
========================================================== */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
            {/* Photo column — replace the emoji with a real photo */}
            <div className="relative bg-gradient-to-br from-sky-50 to-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100 flex items-center justify-center min-h-[180px] sm:min-h-full">
              {/*
          PHOTO GUIDANCE:
          - Replace this entire block with:
            <img
              src="/founder.jpg"
              alt="[O teu nome], fundador do AllCascais"
              className="w-full h-full object-cover"
            />
          - Warm, casual, taken in Cascais. Not a LinkedIn headshot.
          - Café, beach, street in the old town — anywhere real.
        */}
              <div className="text-center px-6 py-8">
                <div className="text-4xl mb-2" aria-hidden="true">
                  🌉
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {isPT ? "Foto em breve" : "Photo coming soon"}
                </div>
              </div>
            </div>

            {/* Content column */}
            <div className="p-6 sm:p-8">
              <div
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: BRAND }}
              >
                <Heart className="w-4 h-4" />
                {isPT ? "Porque é que isto existe" : "Why this exists"}
              </div>

              {/* Quote — Version A: the neighbour moment */}
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                {isPT
                  ? "Ao mudar-se para Estoril, Sarah levou três semanas para encontrar um canalizador que falasse inglês. Naquele mesmo mês, João, que é eletricista em Cascais há duas décadas, estava com a agenda um pouco livre. Notei que o problema não era a falta de profissionais. Era necessário conectá-los. Fundei o AllCascais com esse propósito: um local onde quem precisa pode se conectar diretamente com quem sabe, sem intermediários."
                  : "It took Sarah three weeks to find an English-speaking plumber after she moved to Estoril. That same month, João, an electrician in Cascais for 20 years, had half an empty schedule. I realized it wasn’t a lack of professionals. It was a failure of connection. So I created AllCascais. A place where those who know, find those who need. No intermediaries."}
              </p>

              {/* Signature block — honest, specific, human */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">
                  {/* Replace with initials or avatar */}
                  PC
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {/* Replace with your name */}
                    [Paulo Chiosa]
                  </div>
                  <div className="text-xs text-slate-500">
                    {isPT
                      ? "Fundador, AllCascais · Cascais, 2025"
                      : "Founder, AllCascais · Cascais, 2025"}
                  </div>
                </div>
              </div>

              {/* Mission statement — right after the story */}
              <div className="mt-6 pt-5 border-t border-slate-100">
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
          HOW IT WORKS — 3 steps, simple
      ========================================================== */}
      <section className="bg-white border-y border-slate-100">
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
          VALUES — 3 pillars
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {isPT ? "Os nossos princípios" : "Our principles"}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {isPT
              ? "Três valores que guiam tudo o que fazemos no AllCascais."
              : "Three values that guide everything we do at AllCascais."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${v.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: v.color }} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            );
          })}
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
          EMERGENCY + CONTACT — single footer band
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Emergency — <a href="tel:"> direto, sem window.confirm */}
          <div className="rounded-3xl bg-red-50 border border-red-100 p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold">🚨</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 mb-1">
                  {isPT ? "Emergência em Portugal?" : "Emergency in Portugal?"}
                </h3>
                <p className="text-xs text-red-800/80 leading-relaxed mb-3">
                  {isPT
                    ? "O número 112 funciona em todo o país para polícia, ambulância e bombeiros."
                    : "112 works everywhere in the country for police, ambulance, and fire department."}
                </p>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white text-xs font-semibold px-4 py-2 shadow-sm hover:bg-red-600 transition"
                >
                  {isPT ? "Ligar 112" : "Call 112"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-3xl bg-slate-900 text-white p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {isPT ? "Sugestões ou dúvidas?" : "Suggestions or questions?"}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed mb-3">
                  {isPT
                    ? "Estamos sempre a melhorar o AllCascais com base no feedback da comunidade."
                    : "We're always improving AllCascais based on community feedback."}
                </p>
                <a
                  href="mailto:info@allcascais.com"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold px-4 py-2 shadow-sm hover:bg-slate-100 transition"
                >
                  info@allcascais.com
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BOTTOM CTA — ação única e focada (Krug: diferente do hero)
      ========================================================== */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-slate-200 p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            {isPT ? "Comece por onde precisar." : "Start where you need."}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-6">
            {isPT
              ? "Se está à procura de um serviço, comece pela pesquisa. Se oferece um, publique o seu perfil."
              : "If you're looking for a service, start with a search. If you offer one, publish your profile."}
          </p>

          <button
            type="button"
            onClick={handleGoToServices}
            className="inline-flex items-center justify-center gap-2 rounded-full text-white px-7 py-3.5 text-sm font-bold shadow-md transition hover:opacity-95"
            style={{ backgroundColor: BRAND }}
          >
            <Search className="w-4 h-4" />
            {isPT ? "Começar agora" : "Get started"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
