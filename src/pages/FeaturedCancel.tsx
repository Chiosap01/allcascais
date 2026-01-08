import React from "react";
import { useLanguage } from "../layouts/MainLayout";
import { Link, useSearchParams } from "react-router-dom";

const FeaturedCancel: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const [params] = useSearchParams();
  const orderId = params.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 text-center">
        <div className="text-2xl">⚠️</div>
        <h1 className="mt-2 text-lg font-bold text-slate-900">
          {isPT ? "Pagamento cancelado" : "Payment cancelled"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isPT
            ? "Não foi cobrado nenhum valor. Pode tentar novamente quando quiser."
            : "No charge was made. You can try again anytime."}
        </p>

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

export default FeaturedCancel;
