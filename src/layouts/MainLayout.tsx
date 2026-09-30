// src/layouts/MainLayout.tsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode, FC } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Search,
  Tag,
  Building2,
  LogOut,
  Plus,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS (consistency — Wathan)
--------------------------------------------------------- */
const TOKENS = {
  brand: "#1F1F3D",
  brandHover: "#15152E",
  radius: {
    pill: "rounded-full",
    md: "rounded-2xl",
    lg: "rounded-3xl",
  },
} as const;

const navLinkBase =
  "px-3 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors";

type LanguageCode = "en" | "pt";

const LANGUAGES: { id: LanguageCode; label: string; short: string }[] = [
  { id: "pt", label: "Português", short: "PT" },
  { id: "en", label: "English", short: "EN" },
];

/* ---------------------------------------------------------
   LANGUAGE CONTEXT
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   MAIN LAYOUT
--------------------------------------------------------- */
interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>("pt");

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isPT = language === "pt";

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

  // Close dropdown on route change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // User label
  const userLabel =
    user && (user.first_name || user.last_name)
      ? `${user.first_name ?? ""}${
          user.last_name ? ` ${user.last_name}` : ""
        }`.trim()
      : user?.email ?? "";

  const userInitial = userLabel?.trim().charAt(0).toUpperCase() || "👤";
  const userAvatarUrl = user?.profile_image_url ?? null;

  /* ---------------------------------------------------------
     NAV ITEMS — reduced to 4 (Krug: don't make me think)
  --------------------------------------------------------- */
  const NAV_ITEMS = [
    {
      to: "/",
      label: isPT ? "Início" : "Home",
      icon: Home,
    },
    {
      to: "/services",
      label: isPT ? "Serviços" : "Services",
      icon: Search,
    },
    {
      to: "/offers",
      label: isPT ? "Ofertas" : "Offers",
      icon: Tag,
    },
    {
      to: "/real-estate",
      label: isPT ? "Imóveis" : "Properties",
      icon: Building2,
    },
  ] as const;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="min-h-screen flex flex-col bg-transparent">
        {/* =========================================================
            HEADER
        ========================================================== */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md shadow-sm">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="AllCascais — Home"
            >
              <img
                src="/logo.png"
                alt="AllCascais"
                className="h-12 w-auto object-contain"
              />
            </Link>

            {/* DESKTOP NAV — 4 items with icons */}
            <nav
              className="flex-1 hidden sm:flex items-center justify-center gap-1 lg:gap-2"
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      [
                        navLinkBase,
                        "inline-flex items-center gap-2",
                        isActive
                          ? "bg-slate-50 text-[#1F1F3D] font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      ].join(" ")
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* RIGHT — Language + Auth */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language selector (unified) */}
              <label className="sr-only" htmlFor="language-select">
                {isPT ? "Idioma" : "Language"}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1F1F3D]/30 transition"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.short}
                  </option>
                ))}
              </select>

              {/* AUTH AREA */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <>
                    {/* User pill (desktop + mobile unified) */}
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 bg-slate-50 border border-sky-200 hover:bg-slate-100 transition"
                      aria-label={isPT ? "Menu de utilizador" : "User menu"}
                      aria-expanded={userMenuOpen}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1F1F3D] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userLabel || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden z-30">
                        {/* User header */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1F1F3D] flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {userAvatarUrl ? (
                                <img
                                  src={userAvatarUrl}
                                  alt={userLabel || "Profile"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                userInitial
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {userLabel}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {isPT ? "A minha conta" : "My account"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions — 3 clear items (Krug: less is more) */}
                        <div className="p-2">
                          <MenuItem
                            icon={<UserIcon className="w-4 h-4" />}
                            title={isPT ? "O meu serviço" : "My service"}
                            subtitle={
                              isPT
                                ? "Editar perfil e contactos"
                                : "Edit profile & contacts"
                            }
                            onClick={() => navigate("/service-listing")}
                            accent="sky"
                          />

                          <MenuItem
                            icon={<Plus className="w-4 h-4" />}
                            title={isPT ? "Criar oferta" : "Create offer"}
                            subtitle={
                              isPT
                                ? "Promoções e campanhas"
                                : "Promotions & campaigns"
                            }
                            onClick={() => navigate("/offers/new")}
                            accent="amber"
                          />

                          <MenuItem
                            icon={<Building2 className="w-4 h-4" />}
                            title={isPT ? "Anunciar imóvel" : "List property"}
                            subtitle={
                              isPT ? "Vender ou arrendar" : "Sell or rent out"
                            }
                            onClick={() => navigate("/properties/new")}
                            accent="emerald"
                          />

                          <div className="my-2 h-px bg-slate-100" />

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-rose-50 transition group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 group-hover:bg-white">
                                <LogOut className="w-4 h-4" />
                              </span>
                              <span className="text-sm font-semibold text-rose-700">
                                {isPT ? "Terminar sessão" : "Sign out"}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoToAuth}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                    style={{ backgroundColor: TOKENS.brand }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        TOKENS.brandHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = TOKENS.brand)
                    }
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isPT ? "Entrar / Registar" : "Sign in / Register"}
                    </span>
                    <span className="sm:hidden">
                      {isPT ? "Entrar" : "Sign in"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE NAV — 4 items with icons */}
          <div className="sm:hidden border-t border-slate-100 bg-white/60">
            <nav
              className="flex items-center justify-around px-2 py-2"
              aria-label="Mobile navigation"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      [
                        "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition min-w-0 flex-1",
                        isActive
                          ? "text-[#1F1F3D] bg-slate-50"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1">{children}</main>

        {/* FOOTER — with About link moved here */}
        <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                <Link
                  to="/about"
                  className="hover:text-[#1F1F3D] transition font-medium"
                >
                  {isPT ? "Sobre" : "About"}
                </Link>
                <Link to="/terms" className="hover:text-[#1F1F3D] transition">
                  {isPT ? "Termos" : "Terms"}
                </Link>
                <Link to="/privacy" className="hover:text-[#1F1F3D] transition">
                  {isPT ? "Privacidade" : "Privacy"}
                </Link>
                <Link to="/cookies" className="hover:text-[#1F1F3D] transition">
                  Cookies
                </Link>
              </div>

              <div className="text-xs text-slate-500">
                © {new Date().getFullYear()} AllCascais
              </div>
            </div>
          </div>
        </footer>
      </div>
    </LanguageContext.Provider>
  );
};

/* ---------------------------------------------------------
   MENU ITEM (reusable, consistent)
--------------------------------------------------------- */
type MenuItemProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: "sky" | "amber" | "emerald";
};

const MenuItem: FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  accent,
}) => {
  const accentClasses = {
    sky: "bg-slate-50 text-[#1F1F3D] border-sky-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-slate-50 transition group"
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border shrink-0",
            accentClasses[accent],
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-900">
            {title}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 mt-2 group-hover:text-slate-500 transition" />
      </div>
    </button>
  );
};

export default MainLayout;
