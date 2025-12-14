import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useLanguage } from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Em muitos casos o Supabase já deteta a sessão pelo URL,
    // mas isto garante que só mostramos o form quando for PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // fallback: se já houver sessão, deixa avançar
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg(isPT ? "Mínimo 6 caracteres." : "Minimum 6 characters.");
      return;
    }
    if (password !== confirmPwd) {
      setErrorMsg(
        isPT ? "As palavras-passe não coincidem." : "Passwords do not match."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg(isPT ? "Palavra-passe atualizada!" : "Password updated!");
      setTimeout(() => navigate("/auth"), 900);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/70 p-6">
        <h1 className="text-xl font-bold text-slate-900">
          {isPT ? "Redefinir palavra-passe" : "Reset password"}
        </h1>

        {!ready ? (
          <p className="mt-2 text-sm text-slate-600">
            {isPT
              ? "Abra este ecrã a partir do link enviado por email."
              : "Please open this page from the email link."}
          </p>
        ) : (
          <form onSubmit={handleUpdate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isPT ? "Nova palavra-passe" : "New password"}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-[#1F6FA6]/35"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isPT ? "Confirmar palavra-passe" : "Confirm password"}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-[#1F6FA6]/35"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1F6FA6] text-white text-sm font-semibold py-3 shadow-md hover:bg-sky-800 transition disabled:opacity-60"
            >
              {loading
                ? isPT
                  ? "A atualizar..."
                  : "Updating..."
                : isPT
                ? "Atualizar palavra-passe"
                : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
