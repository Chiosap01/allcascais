// src/pages/AuthPage.tsx
import React, { useState } from "react";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

type Mode = "signin" | "signup";

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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password state
  const [resetSent, setResetSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-slate-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {open ? (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.71 18.71 0 0 1 5.11-5.79" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.64 18.64 0 0 1-2.87 4.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSent(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg(
        isPT ? "Introduza o seu email primeiro." : "Enter your email first."
      );
      return;
    }

    setLoading(true);
    try {
      // Make sure you have this route and it is whitelisted in Supabase Auth Redirect URLs
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSent(false);
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
        if (password !== confirmPwd) {
          setErrorMsg(
            isPT
              ? "As palavras-passe não coincidem."
              : "Passwords do not match."
          );
          setLoading(false);
          return;
        }

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
        setMode("signin");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "signin"
      ? isPT
        ? "Iniciar sessão"
        : "Sign in"
      : isPT
      ? "Criar conta"
      : "Create account";

  const subtitle =
    mode === "signin"
      ? isPT
        ? "Entre na sua conta AllCascais"
        : "Sign in to your AllCascais account"
      : isPT
      ? "Junte-se à comunidade AllCascais"
      : "Join the AllCascais community";

  const AZULEJO = {
    primary: "bg-[#1F6FA6]",
    primaryHover: "hover:bg-[#155A87]",
    ring: "focus:ring-[#1F6FA6]/35",
    text: "text-[#1F6FA6]",
    border: "border-[#1F6FA6]/30",
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/background.png')" }}
        aria-hidden="true"
      />

      {/* Porcelain wash overlay */}
      <div className="absolute inset-0" aria-hidden="true" />

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Brand header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-white/85 border border-slate-200 shadow-sm overflow-hidden">
              <img
                src="/logo.png"
                alt="AllCascais"
                className="w-full h-full object-contain p-0"
                draggable={false}
              />
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/70 overflow-hidden">
            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setResetSent(false);
                }}
                className={[
                  "py-3 text-sm font-semibold transition",
                  mode === "signin"
                    ? "bg-[#1F6FA6] text-white"
                    : "bg-white/70 text-slate-700 hover:bg-white",
                ].join(" ")}
              >
                {isPT ? "Iniciar sessão" : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setResetSent(false);
                }}
                className={[
                  "py-3 text-sm font-semibold transition",
                  mode === "signup"
                    ? "bg-[#1F6FA6] text-white"
                    : "bg-white/70 text-slate-700 hover:bg-white",
                ].join(" ")}
              >
                {isPT ? "Criar conta" : "Create account"}
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="px-7 sm:px-8 py-6 space-y-4"
            >
              {mode === "signup" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPT ? "Primeiro nome" : "First name"}
                    </label>
                    <input
                      type="text"
                      className={[
                        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
                        "focus:outline-none focus:ring-4",
                        AZULEJO.ring,
                      ].join(" ")}
                      placeholder={isPT ? "Primeiro nome" : "First name"}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPT ? "Apelido" : "Last name"}
                    </label>
                    <input
                      type="text"
                      className={[
                        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
                        "focus:outline-none focus:ring-4",
                        AZULEJO.ring,
                      ].join(" ")}
                      placeholder={isPT ? "Apelido" : "Last name"}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isPT ? "Endereço de email" : "Email address"}
                </label>
                <input
                  type="email"
                  className={[
                    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
                    "focus:outline-none focus:ring-4",
                    AZULEJO.ring,
                  ].join(" ")}
                  placeholder={isPT ? "O seu email" : "Your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isPT ? "Palavra-passe" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={[
                      "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm",
                      "focus:outline-none focus:ring-4",
                      AZULEJO.ring,
                    ].join(" ")}
                    placeholder={isPT ? "A sua palavra-passe" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center justify-center px-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isPT ? "Confirmar palavra-passe" : "Confirm password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      className={[
                        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm",
                        "focus:outline-none focus:ring-4",
                        AZULEJO.ring,
                      ].join(" ")}
                      placeholder={
                        isPT ? "Repita a palavra-passe" : "Repeat password"
                      }
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center justify-center px-1"
                      aria-label={
                        showConfirmPwd ? "Hide password" : "Show password"
                      }
                    >
                      <EyeIcon open={showConfirmPwd} />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              {errorMsg && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  {successMsg}
                  {resetSent && (
                    <div className="mt-1 text-[11px] text-emerald-700">
                      {isPT
                        ? "Verifique a caixa de entrada e o spam."
                        : "Check your inbox and spam folder."}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={[
                  "w-full rounded-xl text-white text-sm font-semibold py-3 shadow-md transition",
                  AZULEJO.primary,
                  AZULEJO.primaryHover,
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {loading
                  ? isPT
                    ? "A processar..."
                    : "Processing..."
                  : mode === "signin"
                  ? isPT
                    ? "Iniciar sessão"
                    : "Sign in"
                  : isPT
                  ? "Criar conta"
                  : "Create account"}
              </button>

              {/* Forgot password */}
              {mode === "signin" && (
                <button
                  type="button"
                  className={`text-xs ${AZULEJO.text} hover:underline disabled:opacity-60`}
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {isPT ? "Esqueceu-se da palavra-passe?" : "Forgot password?"}
                </button>
              )}

              {/* Footer */}
              <p className="text-[11px] text-slate-600 text-center pt-2">
                {mode === "signin" ? (
                  <>
                    {isPT ? "Novo na AllCascais?" : "New to AllCascais?"}{" "}
                    <button
                      type="button"
                      className={`${AZULEJO.text} underline underline-offset-2`}
                      onClick={() => {
                        setMode("signup");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setResetSent(false);
                      }}
                    >
                      {isPT ? "Criar conta" : "Create an account"}
                    </button>
                    .
                  </>
                ) : (
                  <>
                    {isPT ? "Já tem conta?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      className={`${AZULEJO.text} underline underline-offset-2`}
                      onClick={() => {
                        setMode("signin");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setResetSent(false);
                      }}
                    >
                      {isPT ? "Iniciar sessão" : "Sign in"}
                    </button>
                    .
                  </>
                )}
              </p>
            </form>
          </div>

          {/* Small note */}
          <p className="mt-5 text-center text-[11px] text-slate-600">
            {isPT
              ? "Ao continuar, concorda com os termos e a política de privacidade."
              : "By continuing, you agree to our terms and privacy policy."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
