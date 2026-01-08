import React, { useEffect, useState } from "react";
import { useLanguage } from "../layouts/MainLayout";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";

const FeaturedSuccess: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const [params] = useSearchParams();
  const orderId = params.get("order_id");

  const [status, setStatus] = useState<
    "idle" | "activating" | "active" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!orderId) return;

      setStatus("activating");
      setErrorMsg(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setStatus("error");
        setErrorMsg(
          isPT
            ? "Sessão inválida. Faça login."
            : "Invalid session. Please log in."
        );
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/confirm-featured-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order_id: orderId }),
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(
            json?.error ??
              (isPT
                ? "Não foi possível ativar o destaque."
                : "Could not activate highlight.")
          );
          return;
        }

        setStatus("active");
      } catch (e) {
        setStatus("error");
        setErrorMsg(
          isPT
            ? "Erro de rede ao ativar destaque."
            : "Network error activating highlight."
        );
      }
    };

    run();
  }, [orderId, isPT]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 text-center">
        <div className="text-2xl">✅</div>

        <h1 className="mt-2 text-lg font-bold text-slate-900">
          {isPT ? "Pagamento recebido!" : "Payment received!"}
        </h1>

        {status === "activating" && (
          <p className="mt-2 text-sm text-slate-600">
            {isPT ? "A ativar o destaque..." : "Activating highlight..."}
          </p>
        )}

        {status === "active" && (
          <p className="mt-2 text-sm text-emerald-700">
            {isPT
              ? "✅ Destaque ativado com sucesso!"
              : "✅ Highlight activated successfully!"}
          </p>
        )}

        {status === "error" && (
          <p className="mt-2 text-sm text-red-600">
            {errorMsg ?? (isPT ? "Ocorreu um erro." : "Something went wrong.")}
          </p>
        )}

        {orderId && (
          <p className="mt-3 text-[11px] text-slate-500">
            Order: <span className="font-mono">{orderId}</span>
          </p>
        )}

        <div className="mt-5 flex gap-2 justify-center">
          <Link
            to="/real-estate"
            className="rounded-full bg-[#1F6FA6] text-white text-sm font-semibold px-5 py-2 hover:bg-[#195c8a]"
          >
            {isPT ? "Voltar aos imóveis" : "Back to Real Estate"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedSuccess;
