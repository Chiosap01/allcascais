// src/layouts/MainLayout.tsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode, FC } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkBase =
  "px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors";

type LanguageCode = "en" | "pt";

const LANGUAGES: { id: LanguageCode; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "pt", label: "Português", short: "PT" },
];

/* ------------ Language context ------------ */

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

/* ------------ Main Layout ------------ */

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>("en");

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isPT = language === "pt";

  const handleChangeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
  };

  const handleGoToAuth = () => {
    navigate("/auth", { state: { from: location.pathname } });
  };

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate("/auth");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // Prefer first + last name from AuthContext; fallback to email
  const userLabel =
    user && (user.first_name || user.last_name)
      ? `${user.first_name ?? ""}${
          user.last_name ? ` ${user.last_name}` : ""
        }`.trim()
      : user?.email ?? "";

  // For mobile avatar initial
  const userInitial =
    userLabel && userLabel.trim().length > 0
      ? userLabel.trim().charAt(0).toUpperCase()
      : "👤";

  const userAvatarUrl = user?.profile_image_url ?? null; // ⬅ NEW

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen flex flex-col bg-transparent">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur shadow-md">
          <div className="max-w-6xl mx-auto px-3 sm:px-2 h-16 flex items-center justify-between gap-3">
            {/* LEFT – LOGO */}
            <Link to="/" className="flex items-center gap-2 sm:-ml-12">
              <img
                src="/logo.png"
                alt="All Cascais logo"
                className="h-14 w-auto rounded-xl object-contain"
              />
            </Link>

            {/* CENTER – NAV (desktop) */}
            <nav
              className="flex-1 mx-2 hidden sm:flex items-center justify-center gap-12"
              aria-label="Main navigation"
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-50 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {isPT ? "Serviços" : "Services"}
              </NavLink>

              <NavLink
                to="/offers"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-50 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {isPT ? "Ofertas" : "Offers"}
              </NavLink>

              <NavLink
                to="/real-estate"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-50 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {isPT ? "Imobiliário" : "Real Estate"}
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-50 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {isPT ? "Sobre" : "About"}
              </NavLink>
            </nav>

            {/* RIGHT – LANG + AUTH */}
            <div className="flex items-center gap-3">
              {/* Mobile language selector */}
              <div className="sm:hidden">
                <label htmlFor="mobile-language" className="sr-only">
                  Language
                </label>
                <select
                  id="mobile-language"
                  value={language}
                  onChange={(e) =>
                    handleChangeLanguage(e.target.value as LanguageCode)
                  }
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.short}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop language selector */}
              <div className="hidden sm:flex items-center">
                <label htmlFor="desktop-language" className="sr-only">
                  Language
                </label>
                <select
                  id="desktop-language"
                  value={language}
                  onChange={(e) =>
                    handleChangeLanguage(e.target.value as LanguageCode)
                  }
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-inner"
                  aria-label="Language selector"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.short} — {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* AUTH AREA */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <>
                    {/* Desktop: user pill (replaces Sign In) */}
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="hidden sm:inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-slate-800 bg-sky-50 border border-sky-200 shadow-sm hover:bg-sky-100 transition ml-6"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userLabel || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {userInitial}
                          </span>
                        )}
                      </div>
                      <span className="text-xs">▾</span>
                    </button>

                    {/* Mobile: round avatar with initial */}
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="sm:hidden inline-flex items-center justify-center rounded-full w-10 h-10 text-xs font-semibold text-white shadow-sm transition bg-sky-600 hover:bg-sky-700 overflow-hidden"
                    >
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userLabel || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-[320px] rounded-3xl bg-white/95 backdrop-blur shadow-xl border border-slate-200 overflow-hidden z-30">
                        {/* Header */}
                        <div className="px-4 py-3 bg-linear-to-b from-slate-50 to-white border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center border border-slate-200">
                              {userAvatarUrl ? (
                                <img
                                  src={userAvatarUrl}
                                  alt={userLabel || "Profile"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-slate-700">
                                  {userInitial}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {userLabel}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {isPT
                                  ? "Conta & publicações"
                                  : "Account & listings"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                          {/* Primary action: List property */}
                          <button
                            type="button"
                            onClick={() => {
                              navigate("/properties/new");
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left rounded-2xl px-3 py-3 mb-2 border border-sky-200 bg-linear-to-b from-sky-50 to-white hover:from-sky-100 hover:to-white transition shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                                {/* home icon */}
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 10.5 12 3l9 7.5V21a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 21v-10.5z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 22.5V15h6v7.5"
                                  />
                                </svg>
                              </span>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900">
                                  {isPT ? "Anunciar imóvel" : "List a property"}
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  {isPT
                                    ? "Destaque o seu imóvel com contexto local."
                                    : "Feature your home with local context."}
                                </div>
                              </div>

                              <span className="ml-auto text-slate-400 mt-1">
                                ›
                              </span>
                            </div>
                          </button>

                          {/* Secondary actions grid */}
                          <div className="grid grid-cols-1 gap-2">
                            {/* My service */}
                            <button
                              type="button"
                              onClick={() => {
                                navigate("/service-listing");
                                setUserMenuOpen(false);
                              }}
                              className="w-full text-left rounded-2xl px-3 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 transition"
                            >
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                                  {/* briefcase icon */}
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4 12h16"
                                    />
                                  </svg>
                                </span>

                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-slate-900">
                                    {isPT ? "O meu serviço" : "My service"}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {isPT
                                      ? "Editar perfil e contactos."
                                      : "Edit profile & contacts."}
                                  </div>
                                </div>

                                <span className="ml-auto text-slate-300 mt-1">
                                  ›
                                </span>
                              </div>
                            </button>

                            {/* Create offer */}
                            <button
                              type="button"
                              onClick={() => {
                                navigate("/offers/new");
                                setUserMenuOpen(false);
                              }}
                              className="w-full text-left rounded-2xl px-3 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 transition"
                            >
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                                  {/* tag icon */}
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M7 7h3l10 10-6 6L4 13V7a0 0 0 0 1 0 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M7 7 3 11"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 9h.01"
                                    />
                                  </svg>
                                </span>

                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-slate-900">
                                    {isPT ? "Criar oferta" : "Create an offer"}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {isPT
                                      ? "Promoções e campanhas locais."
                                      : "Local promotions & deals."}
                                  </div>
                                </div>

                                <span className="ml-auto text-slate-300 mt-1">
                                  ›
                                </span>
                              </div>
                            </button>
                          </div>

                          {/* Divider */}
                          <div className="my-2 h-px bg-slate-100" />

                          {/* Logout */}
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left rounded-2xl px-3 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-rose-600 border border-rose-200">
                                {/* logout icon */}
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 17l5-5-5-5"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12H3"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21V3a2 2 0 0 0-2-2h-6"
                                  />
                                </svg>
                              </span>

                              <div>
                                <div className="text-[13px] font-semibold text-rose-700">
                                  {isPT ? "Terminar sessão" : "Logout"}
                                </div>
                                <div className="text-[11px] text-rose-600/80">
                                  {isPT
                                    ? "Sair com segurança."
                                    : "Sign out securely."}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Desktop: Sign in / Register button */}
                    <button
                      type="button"
                      onClick={handleGoToAuth}
                      className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm bg-[#1F6FA6] hover:bg-sky-800 transition ml-6"
                      disabled={loading}
                    >
                      {isPT ? "Entrar / Registar" : "Sign In / Register"}
                    </button>

                    {/* Mobile: auth icon */}
                    <button
                      type="button"
                      onClick={handleGoToAuth}
                      className="sm:hidden inline-flex items-center justify-center rounded-full p-2 text-white shadow-sm transition bg-sky-600 hover:bg-sky-700"
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m0 0H5a2 2 0 00-2 2v10a2 2 0 002 2h8"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile nav row */}
          <div className="sm:hidden border-t border-slate-100">
            <nav
              className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 text-xs"
              aria-label="Main navigation"
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-100 text-slate-900 font-semibold"
                      : "text-slate-600"
                  }`
                }
              >
                {isPT ? "Serviços" : "Services"}
              </NavLink>
              <NavLink
                to="/offers"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-100 text-slate-900 font-semibold"
                      : "text-slate-600"
                  }`
                }
              >
                {isPT ? "Ofertas" : "Offers"}
              </NavLink>
              <NavLink
                to="/real-estate"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-100 text-slate-900 font-semibold"
                      : "text-slate-600"
                  }`
                }
              >
                {isPT ? "Imobiliário" : "Real Estate"}
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `${navLinkBase} ${
                    isActive
                      ? "bg-cyan-100 text-slate-900 font-semibold"
                      : "text-slate-600"
                  }`
                }
              >
                {isPT ? "Sobre" : "About"}
              </NavLink>
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1">{children}</main>

        {/* FOOTER */}
        <div className="relative mt-10">
          {/* soft fade into the footer */}
          <div className="absolute -top-12 left-0 right-0 h-12 bg-linear-to-b from-transparent to-white/30 pointer-events-none" />

          <footer className="border-t border-sky-200/60 bg-white/70 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 py-4 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span>© {new Date().getFullYear()} AllCascais.</span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link className="underline hover:text-slate-900" to="/terms">
                  {isPT ? "Termos" : "Terms"}
                </Link>
                <Link className="underline hover:text-slate-900" to="/privacy">
                  {isPT ? "Privacidade" : "Privacy"}
                </Link>
                <Link className="underline hover:text-slate-900" to="/cookies">
                  {isPT ? "Cookies" : "Cookies"}
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </LanguageContext.Provider>
  );
};

export default MainLayout;
