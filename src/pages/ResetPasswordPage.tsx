// src/pages/ResetPasswordPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  ShieldCheck,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const BRAND = "#1F1F3D";
const BRAND_HOVER = "#155A87";

/* ---------------------------------------------------------
   PASSWORD STRENGTH (mesmo padrão do AuthPage)
--------------------------------------------------------- */
type Strength = "weak" | "fair" | "good" | "strong";

const getPasswordStrength = (pwd: string) => {
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
const ResetPasswordPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ---------- DETECT RECOVERY SESSION ---------- */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /* ---------- VALIDATION ---------- */
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPwd,
    [password, confirmPwd]
  );

  const canSubmit = useMemo(
    () => password.length > 0 && passwordStrength.score >= 2 && passwordsMatch,
    [password, passwordStrength.score, passwordsMatch]
  );

  const showFieldError = (field: string) => touched[field];

  /* ---------- SUBMIT ---------- */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setTouched({ password: true, confirmPwd: true });

    if (!canSubmit) {
      setErrorMsg(
        isPT
          ? "Verifique os campos e tente novamente."
          : "Please check the fields and try again."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg(
        isPT
          ? "Palavra-passe atualizada! Vamos redirecioná-lo."
          : "Password updated! Redirecting you now."
      );
      setTimeout(() => navigate("/auth"), 1400);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch">
      {/* =========================================================
          LEFT: FORM
      ========================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="px-4 sm:px-8 pt-6">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isPT ? "Voltar ao login" : "Back to sign in"}
          </button>
        </div>

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
                {isPT ? "Nova palavra-passe" : "New password"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">
                {isPT
                  ? "Escolha uma palavra-passe segura para a sua conta."
                  : "Choose a secure password for your account."}
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              {/* STATE: CHECKING */}
              {checking && (
                <div className="p-8 text-center">
                  <Loader2
                    className="w-8 h-8 mx-auto animate-spin"
                    style={{ color: BRAND }}
                  />
                  <p className="mt-3 text-sm text-slate-500">
                    {isPT ? "A verificar o link..." : "Checking your link..."}
                  </p>
                </div>
              )}

              {/* STATE: NOT READY (invalid/expired link) */}
              {!checking && !ready && (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-amber-600" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mb-2">
                    {isPT
                      ? "Link inválido ou expirado"
                      : "Invalid or expired link"}
                  </h2>
                  <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                    {isPT
                      ? "Peça um novo link de recuperação na página de login."
                      : "Request a new recovery link from the sign-in page."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="inline-flex items-center justify-center gap-2 rounded-full text-white text-sm font-semibold px-6 py-2.5 shadow-sm transition"
                    style={{ backgroundColor: BRAND }}
                  >
                    {isPT ? "Ir para login" : "Go to sign in"}
                  </button>
                </div>
              )}

              {/* STATE: READY (form) */}
              {!checking && ready && (
                <form
                  onSubmit={handleUpdate}
                  className="px-6 sm:px-8 py-6 space-y-4"
                  noValidate
                >
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isPT ? "Nova palavra-passe" : "New password"}
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
                        autoComplete="new-password"
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

                    {/* Strength */}
                    {password.length > 0 && (
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

                  {/* Confirm password */}
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
                      <span>{successMsg}</span>
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
                        {isPT ? "A atualizar..." : "Updating..."}
                      </>
                    ) : isPT ? (
                      "Atualizar palavra-passe"
                    ) : (
                      "Update password"
                    )}
                  </button>

                  {/* Footer */}
                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    {isPT ? "Lembrou-se da palavra-passe?" : "Remembered it?"}{" "}
                    <Link
                      to="/auth"
                      className="font-semibold underline underline-offset-2"
                      style={{ color: BRAND }}
                    >
                      {isPT ? "Iniciar sessão" : "Sign in"}
                    </Link>
                  </p>
                </form>
              )}
            </div>

            {/* Footer note */}
            <p className="mt-5 text-center text-[11px] text-slate-500">
              © {new Date().getFullYear()} AllCascais
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT: TRUST PANEL (desktop only)
      ========================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/casc.jpg')" }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/90" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${BRAND}33` }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12 text-white w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5 text-[11px] font-semibold self-start mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isPT ? "Recuperação segura" : "Secure recovery"}</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-5">
            {isPT ? (
              <>
                A sua conta,
                <br />
                <span className="text-slate-100">protegida.</span>
              </>
            ) : (
              <>
                Your account,
                <br />
                <span className="text-slate-100">protected.</span>
              </>
            )}
          </h2>

          <p className="text-sm xl:text-base text-white/75 leading-relaxed max-w-md">
            {isPT
              ? "Escolha uma palavra-passe forte. Nunca a partilhe. Se algo parecer estranho, contacte-nos."
              : "Choose a strong password. Never share it. If anything looks odd, contact us."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
