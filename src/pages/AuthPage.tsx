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

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        // SIGN IN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        setSuccessMsg(isPT ? "Sessão iniciada!" : "Signed in!");
        navigate("/");
      } else {
        // SIGN UP
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
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (error) {
          // handle duplicate email nicely
          if (
            error.code === "user_already_exists" ||
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
            ? "Conta criada! Confirme o seu email. Depois de confirmar, será redirecionado para a sua página de boas-vindas."
            : "Account created! Please confirm your email. After confirming you’ll be redirected to your welcome page."
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
        : "Sign In"
      : isPT
      ? "Criar conta"
      : "Create Account";

  const subtitle =
    mode === "signin"
      ? isPT
        ? "Entre na sua conta AllCascais"
        : "Sign in to your AllCascais account"
      : isPT
      ? "Junte-se à comunidade AllCascais"
      : "Join the AllCascais community";

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

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`py-3 text-sm font-semibold ${
              mode === "signin"
                ? "bg-teal-600 text-white"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {isPT ? "Iniciar sessão" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-3 text-sm font-semibold ${
              mode === "signup"
                ? "bg-teal-600 text-white"
                : "bg-slate-50 text-slate-600"
            }`}
          >
            {isPT ? "Criar conta" : "Create Account"}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {mode === "signup" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Primeiro nome" : "First name"}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={
                    isPT
                      ? "Introduza o seu primeiro nome"
                      : "Enter your first name"
                  }
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isPT ? "Apelido" : "Last name"}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={
                    isPT ? "Introduza o seu apelido" : "Enter your last name"
                  }
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Endereço de email" : "Email address"}
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={
                isPT ? "Introduza o seu email" : "Enter your email address"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* PASSWORD FIELD WITH TOGGLE */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isPT ? "Palavra-passe" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={
                  isPT ? "Introduza a sua palavra-passe" : "Enter your password"
                }
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
                  showPassword
                    ? isPT
                      ? "Esconder palavra-passe"
                      : "Hide password"
                    : isPT
                    ? "Mostrar palavra-passe"
                    : "Show password"
                }
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD FIELD (SIGNUP ONLY) WITH TOGGLE */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isPT ? "Confirmar palavra-passe" : "Confirm password"}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={
                    isPT ? "Repita a palavra-passe" : "Repeat your password"
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
                    showConfirmPwd
                      ? isPT
                        ? "Esconder palavra-passe"
                        : "Hide password"
                      : isPT
                      ? "Mostrar palavra-passe"
                      : "Show password"
                  }
                >
                  <EyeIcon open={showConfirmPwd} />
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 text-white text-sm font-semibold py-3 mt-2 shadow-md hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? isPT
                ? "A processar..."
                : "Processing..."
              : mode === "signin"
              ? isPT
                ? "Iniciar sessão"
                : "Sign In"
              : isPT
              ? "Criar conta"
              : "Create Account"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              className="mt-2 text-xs text-sky-600 hover:underline"
              onClick={() =>
                alert(
                  isPT
                    ? "Em breve: recuperação de palavra-passe."
                    : "Coming soon: forgot password flow."
                )
              }
            >
              {isPT ? "Esqueceu-se da palavra-passe?" : "Forgot Password?"}
            </button>
          )}

          <p className="mt-4 text-[11px] text-slate-500 text-center">
            {mode === "signin" ? (
              isPT ? (
                <>
                  Novo na AllCascais?{" "}
                  <button
                    type="button"
                    className="text-sky-600 underline"
                    onClick={() => setMode("signup")}
                  >
                    Criar conta
                  </button>
                  .
                </>
              ) : (
                <>
                  New to AllCascais?{" "}
                  <button
                    type="button"
                    className="text-sky-600 underline"
                    onClick={() => setMode("signup")}
                  >
                    Create an account
                  </button>
                  .
                </>
              )
            ) : isPT ? (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  className="text-sky-600 underline"
                  onClick={() => setMode("signin")}
                >
                  Iniciar sessão
                </button>
                .
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-sky-600 underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
                .
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
