// src/pages/AuthPage.tsx
import React, { useMemo, useState } from "react";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F6FA6";
const BRAND_HOVER = "#155A87";

type Mode = "signin" | "signup";

/* ---------------------------------------------------------
   PASSWORD STRENGTH (Norman: feedback)
--------------------------------------------------------- */
type Strength = "weak" | "fair" | "good" | "strong";

const getPasswordStrength = (
  pwd: string
): {
  strength: Strength;
  score: number; // 0-4
  labelPt: string;
  labelEn: string;
  color: string;
} => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const map: Record<Strength, { pt: string; en: string; color: string }> = {
    weak: { pt: "Fraca", en: "Weak", color: "#EF4444" },
    fair: { pt: "Razoável", en: "Fair", color: "#F59E0B" },
    good: { pt: "Boa", en: "Good", color: "#10B981" },
    strong: { pt: "Forte", en: "Strong", color: "#059669" },
  };

  const strength: Strength =
    score <= 1
      ? "weak"
      : score === 2
      ? "fair"
      : score === 3
      ? "good"
      : "strong";

  return {
    strength,
    score,
    labelPt: map[strength].pt,
    labelEn: map[strength].en,
    color: map[strength].color,
  };
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
const AuthPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---------- VALIDATION ---------- */
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPwd,
    [password, confirmPwd]
  );

  const canSubmit = useMemo(() => {
    if (mode === "signin") {
      return emailValid && password.length > 0;
    }
    return (
      firstName.trim().length > 0 &&
      emailValid &&
      passwordStrength.score >= 2 &&
      passwordsMatch &&
      acceptedTerms
    );
  }, [
    mode,
    emailValid,
    password,
    firstName,
    passwordStrength.score,
    passwordsMatch,
    acceptedTerms,
  ]);

  /* ---------- SWITCH MODE ---------- */
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSent(false);
    setTouched({});
  };

  /* ---------- FORGOT PASSWORD ---------- */
  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSent(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !emailValid) {
      setErrorMsg(
        isPT
          ? "Introduza um email válido primeiro."
          : "Enter a valid email first."
      );
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });
      if (error) throw error;

      setResetSent(true);
      setSuccessMsg(
        isPT
          ? "Enviámos um email para redefinir a palavra-passe."
          : "We sent you an email to reset your password."
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSent(false);

    // Mark all as touched for validation
    setTouched({
      firstName: true,
      email: true,
      password: true,
      confirmPwd: true,
    });

    if (!canSubmit) {
      setErrorMsg(
        isPT
          ? "Preencha todos os campos corretamente."
          : "Please fill in all fields correctly."
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        setSuccessMsg(isPT ? "Sessão iniciada!" : "Signed in!");
        navigate("/");
      } else {
        const redirectTo = `${window.location.origin}/service-listing`;

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { first_name: firstName, last_name: lastName },
          },
        });

        if (error) {
          if (
            (error as any).code === "user_already_exists" ||
            error.message.toLowerCase().includes("already registered") ||
            error.message.toLowerCase().includes("already exists")
          ) {
            setErrorMsg(
              isPT
                ? "Já existe uma conta com este email. Inicie sessão em vez disso."
                : "An account with this email already exists. Please sign in instead."
            );
          } else {
            setErrorMsg(error.message ?? "Something went wrong");
          }
          return;
        }

        setSuccessMsg(
          isPT
            ? "Conta criada! Confirme o seu email."
            : "Account created! Please confirm your email."
        );
        switchMode("signin");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- LABELS ---------- */
  const title =
    mode === "signin"
      ? isPT
        ? "Bem-vindo de volta"
        : "Welcome back"
      : isPT
      ? "Criar conta"
      : "Create account";

  const subtitle =
    mode === "signin"
      ? isPT
        ? "Entre na sua conta AllCascais."
        : "Sign in to your AllCascais account."
      : isPT
      ? "Junte-se à comunidade de Cascais."
      : "Join the Cascais community.";

  const showFieldError = (field: string) => touched[field];

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch">
      {/* =========================================================
          LEFT: FORM
      ========================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Top bar */}
        <div className="px-4 sm:px-8 pt-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isPT ? "Voltar ao início" : "Back to home"}
          </button>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-md">
            {/* Brand */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="AllCascais"
                  className="h-14 w-auto mx-auto"
                  draggable={false}
                />
              </Link>

              <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="grid grid-cols-2 border-b border-slate-100">
                {(["signin", "signup"] as const).map((tab) => {
                  const active = mode === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => switchMode(tab)}
                      className={[
                        "py-3.5 text-sm font-semibold transition relative",
                        active
                          ? "text-slate-900"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      {tab === "signin"
                        ? isPT
                          ? "Iniciar sessão"
                          : "Sign in"
                        : isPT
                        ? "Criar conta"
                        : "Create account"}
                      {active && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[3px]"
                          style={{ backgroundColor: BRAND }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="px-6 sm:px-8 py-6 space-y-4"
                noValidate
              >
                {/* Signup: names */}
                {mode === "signup" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {isPT ? "Primeiro nome" : "First name"}
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          onBlur={() =>
                            setTouched((t) => ({ ...t, firstName: true }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                          style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                          placeholder={isPT ? "Maria" : "Jane"}
                          autoComplete="given-name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {isPT ? "Apelido" : "Last name"}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                        style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                        placeholder={isPT ? "Silva" : "Doe"}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isPT ? "Email" : "Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      className={[
                        "w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 transition",
                        showFieldError("email") && email && !emailValid
                          ? "border-red-300"
                          : "border-slate-200",
                      ].join(" ")}
                      style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                      placeholder={isPT ? "o.seu@email.com" : "you@email.com"}
                      autoComplete="email"
                    />
                    {email && emailValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  {showFieldError("email") && email && !emailValid && (
                    <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {isPT ? "Email inválido." : "Invalid email."}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isPT ? "Palavra-passe" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, password: true }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 transition"
                      style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                      placeholder={
                        isPT ? "Mínimo 8 caracteres" : "At least 8 characters"
                      }
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center justify-center px-1.5 text-slate-400 hover:text-slate-700 transition"
                      aria-label={
                        showPassword
                          ? isPT
                            ? "Esconder"
                            : "Hide"
                          : isPT
                          ? "Mostrar"
                          : "Show"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password strength (signup only) */}
                  {mode === "signup" && password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(passwordStrength.score / 4) * 100}%`,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: passwordStrength.color }}
                        >
                          {isPT
                            ? passwordStrength.labelPt
                            : passwordStrength.labelEn}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {isPT
                          ? "Use 8+ caracteres, maiúsculas, números e símbolos."
                          : "Use 8+ chars, uppercase, numbers and symbols."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password (signup) */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isPT ? "Confirmar palavra-passe" : "Confirm password"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, confirmPwd: true }))
                        }
                        className={[
                          "w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 transition",
                          showFieldError("confirmPwd") &&
                          confirmPwd &&
                          !passwordsMatch
                            ? "border-red-300"
                            : "border-slate-200",
                        ].join(" ")}
                        style={{ ["--tw-ring-color" as any]: `${BRAND}22` }}
                        placeholder={isPT ? "Repita" : "Repeat"}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center justify-center px-1.5 text-slate-400 hover:text-slate-700 transition"
                        aria-label={
                          showConfirmPwd
                            ? isPT
                              ? "Esconder"
                              : "Hide"
                            : isPT
                            ? "Mostrar"
                            : "Show"
                        }
                      >
                        {showConfirmPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {confirmPwd && passwordsMatch && (
                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {showFieldError("confirmPwd") &&
                      confirmPwd &&
                      !passwordsMatch && (
                        <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {isPT
                            ? "As palavras-passe não coincidem."
                            : "Passwords do not match."}
                        </p>
                      )}
                  </div>
                )}

                {/* Terms (signup) */}
                {mode === "signup" && (
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#1F6FA6] focus:ring-[#1F6FA6]/30"
                    />
                    <span className="text-[11px] text-slate-600 leading-relaxed">
                      {isPT ? (
                        <>
                          Concordo com os{" "}
                          <Link
                            to="/terms"
                            className="font-semibold underline underline-offset-2"
                            style={{ color: BRAND }}
                          >
                            termos
                          </Link>{" "}
                          e a{" "}
                          <Link
                            to="/privacy"
                            className="font-semibold underline underline-offset-2"
                            style={{ color: BRAND }}
                          >
                            política de privacidade
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link
                            to="/terms"
                            className="font-semibold underline underline-offset-2"
                            style={{ color: BRAND }}
                          >
                            terms
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy"
                            className="font-semibold underline underline-offset-2"
                            style={{ color: BRAND }}
                          >
                            privacy policy
                          </Link>
                          .
                        </>
                      )}
                    </span>
                  </label>
                )}

                {/* Messages */}
                {errorMsg && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div>{successMsg}</div>
                      {resetSent && (
                        <div className="mt-1 text-[11px] text-emerald-700">
                          {isPT
                            ? "Verifique a caixa de entrada e o spam."
                            : "Check your inbox and spam folder."}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold py-3 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: BRAND }}
                  onMouseEnter={(e) => {
                    if (!loading && canSubmit)
                      e.currentTarget.style.backgroundColor = BRAND_HOVER;
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND)
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isPT ? "A processar..." : "Processing..."}
                    </>
                  ) : mode === "signin" ? (
                    isPT ? (
                      "Iniciar sessão"
                    ) : (
                      "Sign in"
                    )
                  ) : isPT ? (
                    "Criar conta"
                  ) : (
                    "Create account"
                  )}
                </button>

                {/* Forgot password */}
                {mode === "signin" && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-xs font-semibold hover:underline disabled:opacity-60 transition"
                      style={{ color: BRAND }}
                    >
                      {isPT
                        ? "Esqueceu-se da palavra-passe?"
                        : "Forgot password?"}
                    </button>
                  </div>
                )}

                {/* Switch mode footer */}
                <p className="text-[11px] text-slate-600 text-center pt-2">
                  {mode === "signin" ? (
                    <>
                      {isPT ? "Novo no AllCascais?" : "New to AllCascais?"}{" "}
                      <button
                        type="button"
                        className="font-semibold underline underline-offset-2"
                        style={{ color: BRAND }}
                        onClick={() => switchMode("signup")}
                      >
                        {isPT ? "Criar conta" : "Create account"}
                      </button>
                    </>
                  ) : (
                    <>
                      {isPT ? "Já tem conta?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        className="font-semibold underline underline-offset-2"
                        style={{ color: BRAND }}
                        onClick={() => switchMode("signin")}
                      >
                        {isPT ? "Iniciar sessão" : "Sign in"}
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT: SOCIAL PROOF PANEL (desktop only)
      ========================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/casc.jpg')" }}
          aria-hidden="true"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/90" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${BRAND}33` }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12 text-white w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5 text-[11px] font-semibold self-start mb-6">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>{isPT ? "Comunidade de Cascais" : "Cascais community"}</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-5">
            {isPT ? (
              <>
                Encontra profissionais
                <br />
                <span className="text-sky-200">de confiança.</span>
              </>
            ) : (
              <>
                Find trusted
                <br />
                <span className="text-sky-200">professionals.</span>
              </>
            )}
          </h2>

          <p className="text-sm xl:text-base text-white/75 leading-relaxed mb-8 max-w-md">
            {isPT
              ? "Verificados pela comunidade. Em português ou inglês. Sem intermediários."
              : "Community-verified. In English or Portuguese. No middlemen."}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
            <div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-xl font-bold">4.8</span>
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isPT ? "Avaliação média" : "Average rating"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-sky-300" />
                <span className="text-xl font-bold">140+</span>
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isPT ? "Profissionais" : "Professionals"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-xl font-bold">100%</span>
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isPT ? "Verificados" : "Verified"}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-md rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-5">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 text-amber-300 fill-amber-300"
                />
              ))}
            </div>
            <p className="text-sm text-white/85 leading-relaxed mb-4">
              {isPT
                ? '"Encontrei um canalizador que falava inglês em 10 minutos. Salvou o meu domingo."'
                : '"Found an English-speaking plumber in 10 minutes. Saved my Sunday."'}
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: BRAND }}
              >
                SM
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Sarah M.</div>
                <div className="text-[10px] text-white/60">
                  {isPT ? "Expat no Estoril" : "Expat in Estoril"}
                </div>
              </div>
            </div>
          </div>

          {/* Trust chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              isPT ? "Grátis para residentes" : "Free for residents",
              isPT ? "PT / EN" : "PT / EN",
              isPT ? "Sem taxas escondidas" : "No hidden fees",
            ].map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75"
              >
                <Check className="w-3 h-3 text-emerald-300" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
