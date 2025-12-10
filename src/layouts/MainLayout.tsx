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
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur shadow-md">
          <div className="max-w-6xl mx-auto px-3 sm:px-0 h-16 flex items-center justify-between gap-3">
            {/* LEFT – LOGO */}
            <Link to="/" className="flex items-center gap-2">
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
                      <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-lg border border-slate-100 py-2 text-sm z-30">
                        <div className="px-4 pb-2 text-[11px] text-slate-500 truncate">
                          {userLabel}
                        </div>

                        {/* Create Service Listing */}
                        <button
                          type="button"
                          onClick={() => {
                            navigate("/service-listing"); // 👈 new page
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          {isPT ? "Meu serviço" : "My service"}
                        </button>

                        {/* Create Offer */}
                        <button
                          type="button"
                          onClick={() => {
                            navigate("/offers/new"); // 👈 your offer creation page
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          {isPT ? "Criar nova oferta" : "Create new offer"}
                        </button>

                        <hr className="my-1 border-slate-100" />

                        {/* Logout */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-600 font-semibold"
                        >
                          {isPT ? "Terminar sessão" : "Logout"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Desktop: Sign in / Register button */}
                    <button
                      type="button"
                      onClick={handleGoToAuth}
                      className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm bg-sky-600 hover:bg-sky-700 transition ml-6"
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
        <footer className="border-t border-slate-200 bg-white mt-6">
          <div className="max-w-6xl mx-auto px-4 py-4 text-[11px] text-slate-500 flex justify-between">
            <span>© {new Date().getFullYear()} All Cascais.</span>
            <span>
              {isPT
                ? "Serviços locais de confiança em Cascais"
                : "Trusted local services in Cascais"}
            </span>
          </div>
        </footer>
      </div>
    </LanguageContext.Provider>
  );
};

export default MainLayout;
