import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../layouts/MainLayout";

type WeatherState = {
  temperature: number;
  windspeed: number;
  weatherCode: number;
};

type WeatherMeta = {
  label: string;
  iconPath: string;
};

const mapWeatherCode = (code: number, isPT: boolean): WeatherMeta => {
  // Open-Meteo / WMO codes
  if (code === 0) {
    return {
      label: isPT ? "Céu limpo" : "Clear sky",
      iconPath: "/icons/sun.png",
    };
  }
  if (code === 1 || code === 2) {
    return {
      label: isPT ? "Maioritariamente limpo" : "Mostly clear",
      iconPath: "/icons/partly.png",
    };
  }
  if (code === 3) {
    return {
      label: isPT ? "Nublado" : "Overcast",
      iconPath: "/icons/cloud.png",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: isPT ? "Nevoeiro" : "Foggy",
      iconPath: "/icons/fog.png",
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      label: isPT ? "Chuvisco / Chuva fraca" : "Drizzle / Light rain",
      iconPath: "/icons/rain.png",
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      label: isPT ? "Neve" : "Snow",
      iconPath: "/icons/weather-cloud.png",
    };
  }
  if ((code >= 80 && code <= 82) || (code >= 61 && code <= 69)) {
    return {
      label: isPT ? "Aguaceiros" : "Rain showers",
      iconPath: "/icons/rain.png",
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      label: isPT ? "Trovoada" : "Thunderstorm",
      iconPath: "/icons/thunder.png",
    };
  }

  return {
    label: isPT ? "Meteorologia em Cascais" : "Cascais weather",
    iconPath: "/icons/partly.png",
  };
};

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isPT = language === "pt";

  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Fetch live weather for Cascais (Open-Meteo, no API key)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=38.6961&longitude=-9.4217&current_weather=true"
        );
        const data: any = await res.json();
        if (data?.current_weather) {
          setWeather({
            temperature: data.current_weather.temperature,
            windspeed: data.current_weather.windspeed,
            weatherCode: data.current_weather.weathercode,
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const handleGoToServices = () => {
    navigate("/"); // Services / Home route
  };

  const handleEmergencyClick = () => {
    const message = isPT
      ? "Números de emergência:\nPolícia: 112\nAmbulância: 112\nBombeiros: 112\n\nLigar 112 agora?"
      : "Emergency Numbers:\nPolice: 112\nAmbulance: 112\nFire Department: 112\n\nCall 112 now?";

    if (window.confirm(message)) {
      window.location.href = "tel:112";
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* HERO + WEATHER */}
      <section className="relative">
        {/* Background image */}
        <div
          className="h-[640px] sm:h-[700px] w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/cascais-about.jpg')" }}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/15 via-slate-900/60 to-slate-900/85" />

        {/* Content + weather card */}
        <div className="absolute inset-0">
          <div className="max-w-5xl mx-auto px-4 h-full flex flex-col justify-between py-10">
            {/* Top content */}
            <div className="text-center text-white">
              {/* Top pill */}
              <div className="inline-flex items-center justify-center rounded-full bg-teal-500/90 px-4 py-1.5 text-xs sm:text-sm font-medium shadow-md mb-4 sm:mb-6">
                <span className="mr-2">🌊</span>
                <span>
                  {isPT
                    ? "Exclusivo para residentes e visitantes de Cascais"
                    : "Exclusive for Cascais Residents & Visitors"}
                </span>
              </div>

              <h1 className="text-[26px] sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3">
                {isPT ? (
                  <>
                    Encontre Serviços Locais
                    <br className="hidden sm:block" />
                    de Confiança em Cascais
                  </>
                ) : (
                  <>
                    Find Trusted Local
                    <br className="hidden sm:block" />
                    Services in Cascais
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-lg text-slate-100 mb-3">
                {isPT
                  ? "Prestadores verificados. Remuneração justa. Confiança da comunidade."
                  : "Verified providers. Fair wages. Community trust."}
              </p>

              <p className="max-w-2xl mx-auto text-xs sm:text-base text-slate-100/90 mb-6">
                {isPT
                  ? "Ligue-se a prestadores de serviços locais verificados em Cascais – de pequenos serviços a luxo – todos recomendados pela comunidade."
                  : "Connect with verified local service providers in Cascais – from handymen to luxury services – all vetted by your community."}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 px-2 mb-4">
                <button
                  type="button"
                  onClick={handleGoToServices}
                  className="w-full max-w-xs inline-flex items-center justify-center rounded-full border border-white/70 bg-yellow-400/70 px-7 py-4 text-sm sm:text-base font-semibold text-slate-900 shadow-lg hover:bg-yellow-400 hover:shadow-xl hover:-translate-y-0.5 transition"
                >
                  <span className="mr-2">🔍</span>
                  {isPT ? "Procurar serviços" : "Find Services"}
                </button>

                <button
                  type="button"
                  onClick={handleGoToServices}
                  className="w-full max-w-xs inline-flex items-center justify-center rounded-full border border-white/70 bg-white/10 px-7 py-4 text-sm sm:text-base font-semibold text-white shadow-md backdrop-blur hover:bg-white/20 hover:-translate-y-0.5 transition"
                >
                  🤝 {isPT ? "Juntar-me à comunidade" : "Join Community"}
                </button>

                <button
                  type="button"
                  onClick={handleEmergencyClick}
                  className="w-full max-w-xs inline-flex items-center justify-center rounded-full border border-white/70 bg-red-500/70 px-7 py-4 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-red-600 hover:-translate-y-0.5 transition"
                >
                  🚨 {isPT ? "Emergência" : "Emergency"}
                </button>
              </div>
            </div>

            {/* Bottom weather card */}
            <div className="flex justify-center">
              <div className="bg-white/80 rounded-2xl shadow-lg px-6 py-4 text-left text-slate-800 flex items-center gap-4 w-full max-w-md">
                {/* circle with PNG icon */}
                <div className="h-10 w-10 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                  <img
                    src={weatherMeta.iconPath}
                    alt={weatherMeta.label}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="text-xl font-semibold">
                    {weatherLoading
                      ? "—"
                      : weather
                      ? `${Math.round(weather.temperature)}°C`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-slate-500 -mt-0.5">
                    {weatherMeta.label} · Cascais
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {isPT ? "Sensação" : "Feels like"}{" "}
                      {weather && !weatherLoading
                        ? `${Math.round(weather.temperature + 1)}°C`
                        : "—"}
                    </span>
                    <span>
                      {weather && !weatherLoading
                        ? `${Math.round(weather.windspeed)} km/h ${
                            isPT ? "vento" : "wind"
                          }`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT CONTENT */}
      <section className="max-w-5xl mx-auto px-4 pb-10 md:pb-14">
        {/* 3 feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <img
              src="/icons/verified.png"
              alt={isPT ? "Prestadores verificados" : "Verified providers"}
              className="h-8 w-8 mb-3"
            />
            <h3 className="font-semibold mb-2">
              {isPT ? "Prestadores verificados" : "Verified providers"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "Cada prestador é verificado manualmente para garantir qualidade, fiabilidade e preços justos."
                : "Every provider is manually checked and reviewed to ensure quality, reliability, and fair pricing."}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <img
              src="/icons/fair-play.png"
              alt={
                isPT
                  ? "Preços justos e transparentes"
                  : "Fair, transparent rates"
              }
              className="h-8 w-8 mb-3"
            />
            <h3 className="font-semibold mb-2">
              {isPT
                ? "Preços justos e transparentes"
                : "Fair, transparent rates"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "Sem taxas escondidas. Tem acesso a informação clara para escolher o serviço certo com confiança."
                : "No hidden fees. You see clear information so you can choose the right service with confidence."}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <img
              src="/icons/focused.png"
              alt={isPT ? "Focado em Cascais" : "Focused on Cascais"}
              className="h-8 w-8 mb-3"
            />
            <h3 className="font-semibold mb-2">
              {isPT ? "Focado em Cascais" : "Focused on Cascais"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "Do centro histórico ao Guincho, focamo-nos apenas em Cascais e zonas próximas para manter tudo verdadeiramente local."
                : "From the historic centre to Guincho, we focus only on Cascais and nearby areas to keep it truly local."}
            </p>
          </div>
        </div>

        {/* Two-column: What is + How it works */}
        <div className="grid md:grid-cols-2 gap-8 items-start mb-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              {isPT ? "O que é a AllCascais?" : "What is AllCascais?"}
            </h2>
            <p className="text-sm md:text-base text-slate-600 mb-3">
              {isPT
                ? "A AllCascais é um diretório selecionado de serviços locais de confiança. Nasceu com um objetivo simples: tornar mais fácil e seguro para residentes e visitantes encontrarem pessoas de confiança em Cascais – sem pesquisas intermináveis ou adivinhações."
                : "AllCascais is a curated directory of trusted local services. It started with a simple goal: make it easy and safe for residents and visitors to find reliable people in Cascais – without endless searching or guessing."}
            </p>
            <p className="text-sm md:text-base text-slate-600">
              {isPT
                ? "Combinamos recomendações da comunidade, verificação manual e categorias claras para chegar rapidamente a empresas de limpeza, pequenos arranjos, explicadores, bem-estar, restaurantes e muito mais – tudo num só lugar."
                : "We combine community recommendations, manual verification and clear categories so you can quickly reach cleaners, handymen, tutors, wellness professionals, restaurants and more – all in one place."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3 text-sm md:text-base text-slate-600">
            <h3 className="font-semibold text-slate-800 mb-2">
              {isPT ? "Como funciona" : "How it works"}
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                {isPT
                  ? "Navegue pelas categorias ou pesquise uma necessidade específica."
                  : "Browse categories or search for a specific need."}
              </li>
              <li>
                {isPT
                  ? "Veja perfis, avaliações e contactos."
                  : "Check profiles, reviews, and contact details."}
              </li>
              <li>
                {isPT
                  ? "Contacte diretamente os prestadores – sem comissões extra."
                  : "Contact providers directly – no extra commissions."}
              </li>
              <li>
                {isPT
                  ? "Partilhe a sua experiência e ajude outros em Cascais."
                  : "Share your experience and help others in Cascais."}
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
          {isPT ? "Perguntas Frequentes" : "Frequently Asked Questions"}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
            <h3 className="font-semibold mb-2 text-slate-800">
              {isPT
                ? "Como encontro um profissional de confiança em Cascais?"
                : "How do I find a trusted handyman in Cascais?"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "Explore a nossa secção de Serviços, onde todos os prestadores são verificados pela comunidade. Veja classificações e opiniões de vizinhos."
                : "Browse our Services section where all providers are verified by community members. Check ratings and reviews from your neighbors."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
            <h3 className="font-semibold mb-2 text-slate-800">
              {isPT
                ? "A plataforma é gratuita para residentes?"
                : "Is this platform free for residents?"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "Sim! Encontrar serviços é totalmente gratuito. Apoiamos os profissionais locais ligando-os diretamente aos residentes, sem taxas de intermediários."
                : "Yes! Finding services is completely free. We support local workers by connecting them directly with residents without middleman fees."}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left">
            <h3 className="font-semibold mb-2 text-slate-800">
              {isPT
                ? "Como posso evitar taxas de plataformas como o Airbnb?"
                : "How do I avoid Airbnb fees for rentals?"}
            </h3>
            <p className="text-sm text-slate-600">
              {isPT
                ? "A nossa secção de Imobiliário liga-o diretamente a proprietários em Cascais, evitando taxas de plataformas e complicações nas reservas."
                : "Our Real Estate section connects you directly with property owners in Cascais, skipping platform fees and booking complications."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
