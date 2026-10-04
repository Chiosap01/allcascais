// src/pages/LivingGuidePage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../layouts/MainLayout";
import { getLivingGuide, LIVING_GUIDES } from "../content/livingGuides";
import { supabase } from "../supabase";
import {
  RotateCcw,
  Mail,
  Check,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */
type Localized = { pt: string; en: string };

type GuideTone = "default" | "tip" | "warning" | "checklist";

type LivingGuideExtras = {
  audience?: Localized[];
  takeaways?: Localized[];
  updatedAt?: string;
  sharePost?: Localized;
  templates?: Array<{
    title: Localized;
    description?: Localized;
    copyText: Localized;
  }>;
  faqs?: Array<{ q: Localized; a: Localized }>;
  sections?: Array<{ tone?: GuideTone }>;
};

type MatchType = "buyer" | "owner";
type PurchaseUse = "hpp" | "hab";
type YesNo = "yes" | "no";

type CalcSummary = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

/* Qualification enums (para match modal) */
type BuyerFinancing =
  | ""
  | "cash"
  | "pre-approved"
  | "need-mortgage"
  | "not-yet";
type OwnerStatus =
  | ""
  | "not-listed"
  | "with-agency"
  | "selling-myself"
  | "just-evaluating";

/* =========================================================
   CONSTANTS
========================================================= */
const CONTACT_EMAIL = "info@allcascais.com";

/* =========================================================
   HELPERS
========================================================= */
const eur = (n: number, isPT: boolean) =>
  "€" + Math.round(n).toLocaleString(isPT ? "pt-PT" : "en-US");

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

const toNumber = (v: string) => {
  const cleaned = v.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const pct = (n: number) => (n * 100).toFixed(2).replace(/\.00$/, "") + "%";

const cls = (...a: Array<string | undefined | false | null>) =>
  a.filter(Boolean).join(" ");

/* Próximo guia recomendado — jornada */
const NEXT_GUIDE_MAP: Record<string, string> = {
  areas: "costs",
  buying: "costs",
  renting: "moving",
  costs: "buying",
  moving: "areas",
  owners: "costs",
};

/* Ícones das takeaways */
const TAKEAWAY_ICONS = ["🎯", "🔍", "✅"];

/* =========================================================
   UI PRIMITIVES
========================================================= */
const GlassSurface = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cls(
      "relative rounded-3xl border border-white/35 bg-white/86 backdrop-blur-md",
      "shadow-[0_12px_40px_-20px_rgba(2,6,23,0.55)]",
      "ring-1 ring-slate-900/5",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-b from-white/30 to-transparent" />
    <div className="relative">{children}</div>
  </div>
);

const ButtonBase =
  "inline-flex items-center justify-center rounded-full font-semibold transition " +
  "focus:outline-none focus:ring-2 focus:ring-cyan-400/80 focus:ring-offset-2 focus:ring-offset-white/40 " +
  "active:translate-y-[1px] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

const PrimaryBtn = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cls(
      ButtonBase,
      "bg-[#1F1F3D] text-white shadow-md shadow-slate-900/10",
      "hover:bg-[#15152E] hover:-translate-y-px",
      "px-5 py-2.5 text-xs",
      className
    )}
  >
    {children}
  </button>
);

const SuccessBtn = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cls(
      ButtonBase,
      "bg-emerald-600 text-white shadow-md shadow-emerald-900/10",
      "hover:bg-emerald-700 hover:-translate-y-px",
      "px-5 py-2.5 text-xs",
      className
    )}
  >
    {children}
  </button>
);

const GhostBtn = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cls(
      ButtonBase,
      "bg-white/55 backdrop-blur-md border border-white/35 text-slate-800",
      "hover:bg-white/70 hover:-translate-y-px",
      "px-4 py-2 text-xs",
      className
    )}
  >
    {children}
  </button>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    className={cls(
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
      "bg-white/60 backdrop-blur-md border border-white/35 text-slate-800",
      "shadow-sm shadow-slate-900/5"
    )}
  >
    {children}
  </span>
);

/* ---------- TONE SYSTEM ---------- */
function toneStyles(tone?: GuideTone) {
  if (tone === "warning")
    return "border-amber-300/80 bg-amber-50/92 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-amber-200/60";
  if (tone === "tip")
    return "border-emerald-300/80 bg-emerald-50/92 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-emerald-200/60";
  if (tone === "checklist")
    return "border-sky-300/80 bg-sky-50/92 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-sky-200/60";
  return "border-white/35 bg-white/86 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-slate-900/5";
}

function tonePadding(tone?: GuideTone) {
  if (tone === "checklist" || tone === "warning") return "p-6 sm:p-8";
  return "p-5 sm:p-6";
}

function toneIcon(tone?: GuideTone): string | null {
  if (tone === "warning") return "⚠️";
  if (tone === "tip") return "💡";
  if (tone === "checklist") return "✅";
  return null;
}

function toneLabel(tone: GuideTone | undefined, isPT: boolean): string | null {
  if (!tone || tone === "default") return null;
  if (tone === "warning") return isPT ? "Atenção" : "Attention";
  if (tone === "tip") return isPT ? "Dica" : "Tip";
  if (tone === "checklist") return isPT ? "Checklist" : "Checklist";
  return null;
}

/* =========================================================
   TAX CALCULATORS
========================================================= */
function calcIMT_2026_continente(
  price: number,
  use: PurchaseUse,
  youngU35: boolean
) {
  const p = clamp0(price);

  const tableHPP = [
    { upTo: 106_346, rate: 0.0, abate: 0 },
    { upTo: 145_470, rate: 0.02, abate: 2_126.92 },
    { upTo: 198_347, rate: 0.05, abate: 6_491.02 },
    { upTo: 330_539, rate: 0.07, abate: 10_457.96 },
    { upTo: 660_982, rate: 0.08, abate: 13_763.35 },
  ] as const;

  const tableHPPYoung = [
    { upTo: 330_539, rate: 0.0, abate: 0 },
    { upTo: 660_982, rate: 0.08, abate: 26_443.12 },
  ] as const;

  const tableHab = [
    { upTo: 106_346, rate: 0.01, abate: 0 },
    { upTo: 145_470, rate: 0.02, abate: 1_063.46 },
    { upTo: 198_347, rate: 0.05, abate: 5_427.56 },
    { upTo: 330_539, rate: 0.07, abate: 9_394.5 },
    { upTo: 633_931, rate: 0.08, abate: 12_699.89 },
  ] as const;

  const bracketCalc = (rate: number, abate: number) =>
    Math.max(0, p * rate - abate);

  const unique6Upper = 1_150_853;

  if (use === "hpp") {
    if (youngU35) {
      if (p <= tableHPPYoung[0].upTo) return 0;
      if (p <= tableHPPYoung[1].upTo)
        return bracketCalc(tableHPPYoung[1].rate, tableHPPYoung[1].abate);
      if (p <= unique6Upper) return p * 0.06;
      return p * 0.075;
    }

    for (const row of tableHPP) {
      if (p <= row.upTo) return bracketCalc(row.rate, row.abate);
    }
    if (p <= unique6Upper) return p * 0.06;
    return p * 0.075;
  }

  for (const row of tableHab) {
    if (p <= row.upTo) return bracketCalc(row.rate, row.abate);
  }
  if (p <= unique6Upper) return p * 0.06;
  return p * 0.075;
}

function calcStampDutyPurchase(price: number) {
  return clamp0(price) * 0.008;
}

function calcStampDutyMortgage(loanAmount: number, termYears: number) {
  const loan = clamp0(loanAmount);
  const y = clamp0(termYears);
  if (loan <= 0 || y <= 0) return 0;

  if (y < 1) {
    const months = Math.max(1, Math.ceil(y * 12));
    return loan * 0.0004 * months;
  }
  if (y < 5) return loan * 0.005;
  return loan * 0.006;
}

/* =========================================================
   INPUTS
========================================================= */
const NumField = ({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold text-slate-800">{label}</label>
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
        inputMode="decimal"
      />
      {suffix ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
          {suffix}
        </div>
      ) : null}
    </div>
  </div>
);

const ToggleChip = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cls(
      "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition backdrop-blur-md",
      active
        ? "border-emerald-500/60 bg-emerald-50/85 text-emerald-800 shadow-sm"
        : "border-white/35 bg-white/55 text-slate-800 hover:bg-white/70"
    )}
  >
    {label}
  </button>
);

/* =========================================================
   CALCULATOR: REAL COSTS (BUYING)
========================================================= */
const RealCostsCalculator: React.FC<{ isPT: boolean }> = ({ isPT }) => {
  const DEFAULTS = {
    priceStr: "650000",
    use: "hpp" as PurchaseUse,
    youngU35: "no" as YesNo,
    loanStr: "0",
    termStr: "30",
    notaryFeesStr: "1200",
    registryFeesStr: "450",
    lawyerFeesStr: "800",
    bankFeesStr: "600",
    vptStr: "",
  };

  const [priceStr, setPriceStr] = useState(DEFAULTS.priceStr);
  const [use, setUse] = useState<PurchaseUse>(DEFAULTS.use);
  const [youngU35, setYoungU35] = useState<YesNo>(DEFAULTS.youngU35);
  const [loanStr, setLoanStr] = useState(DEFAULTS.loanStr);
  const [termStr, setTermStr] = useState(DEFAULTS.termStr);
  const [notaryFeesStr, setNotaryFeesStr] = useState(DEFAULTS.notaryFeesStr);
  const [registryFeesStr, setRegistryFeesStr] = useState(
    DEFAULTS.registryFeesStr
  );
  const [lawyerFeesStr, setLawyerFeesStr] = useState(DEFAULTS.lawyerFeesStr);
  const [bankFeesStr, setBankFeesStr] = useState(DEFAULTS.bankFeesStr);
  const [vptStr, setVptStr] = useState(DEFAULTS.vptStr);

  const [emailOpen, setEmailOpen] = useState(false);
  const [sentSummary, setSentSummary] = useState<CalcSummary | null>(null);
  const [sent, setSent] = useState(false);

  const cascaisIMIRate = 0.0035;
  const cascaisHPPDiscount = 0.15;

  const price = toNumber(priceStr);
  const loan = toNumber(loanStr);
  const termYears = toNumber(termStr);
  const notaryFees = toNumber(notaryFeesStr);
  const registryFees = toNumber(registryFeesStr);
  const lawyerFees = toNumber(lawyerFeesStr);
  const bankFees = toNumber(bankFeesStr);
  const vpt = toNumber(vptStr);

  const imt = calcIMT_2026_continente(price, use, youngU35 === "yes");
  const stampPurchase = calcStampDutyPurchase(price);
  const stampMortgage = calcStampDutyMortgage(loan, termYears);
  const imiBase = vpt > 0 ? vpt * cascaisIMIRate : 0;
  const imi =
    vpt > 0
      ? use === "hpp"
        ? imiBase * (1 - cascaisHPPDiscount)
        : imiBase
      : 0;

  const totalOneOff =
    price +
    imt +
    stampPurchase +
    stampMortgage +
    notaryFees +
    registryFees +
    lawyerFees +
    bankFees;

  const resetAll = () => {
    setPriceStr(DEFAULTS.priceStr);
    setUse(DEFAULTS.use);
    setYoungU35(DEFAULTS.youngU35);
    setLoanStr(DEFAULTS.loanStr);
    setTermStr(DEFAULTS.termStr);
    setNotaryFeesStr(DEFAULTS.notaryFeesStr);
    setRegistryFeesStr(DEFAULTS.registryFeesStr);
    setLawyerFeesStr(DEFAULTS.lawyerFeesStr);
    setBankFeesStr(DEFAULTS.bankFeesStr);
    setVptStr(DEFAULTS.vptStr);
  };

  const buildSummary = (): CalcSummary => ({
    title: isPT
      ? "Cálculo: custo total de compra"
      : "Calculation: total cost of purchase",
    rows: [
      { label: isPT ? "Preço" : "Price", value: eur(price, isPT) },
      { label: "IMT", value: eur(imt, isPT) },
      {
        label: isPT ? "Imposto do Selo (0,8%)" : "Stamp Duty (0.8%)",
        value: eur(stampPurchase, isPT),
      },
      {
        label: isPT ? "IS sobre crédito" : "Mortgage stamp duty",
        value: eur(stampMortgage, isPT),
      },
      {
        label: isPT ? "Escritura/serviços" : "Notary/closing services",
        value: eur(notaryFees, isPT),
      },
      { label: isPT ? "Registos" : "Registry", value: eur(registryFees, isPT) },
      {
        label: isPT ? "Solicitador/advogado" : "Solicitor/lawyer",
        value: eur(lawyerFees, isPT),
      },
      {
        label: isPT ? "Banco/comissões" : "Bank/fees",
        value: eur(bankFees, isPT),
      },
      ...(vpt > 0
        ? [
            {
              label: isPT ? "IMI estimado/ano" : "Estimated IMI/year",
              value: eur(imi, isPT),
            },
          ]
        : []),
      {
        label: isPT ? "Total estimado (1x)" : "Estimated total (one-off)",
        value: eur(totalOneOff, isPT),
      },
    ],
  });

  return (
    <GlassSurface className="overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
            {isPT ? "Calculadora de custo total (2026)" : "Total-cost (2026)"}
          </div>
          <div className="mt-1 text-xs text-slate-700 max-w-lg">
            {isPT
              ? "Estimativa educativa com IMT 2026 (Continente), IS 0,8% e IS crédito."
              : "Educational estimate with 2026 IMT (Mainland), 0.8% stamp duty and mortgage stamp duty."}
          </div>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-white/45 bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white/85 transition"
          title={isPT ? "Repor valores" : "Reset"}
        >
          <RotateCcw className="w-3 h-3" />
          {isPT ? "Repor" : "Reset"}
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label={isPT ? "Preço do imóvel" : "Home price"}
            value={priceStr}
            onChange={setPriceStr}
            placeholder="650000"
            suffix="€"
          />

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-800">
              {isPT ? "Uso" : "Use"}
            </label>
            <select
              value={use}
              onChange={(e) => setUse(e.target.value as PurchaseUse)}
              className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
            >
              <option value="hpp">
                {isPT
                  ? "HPP (habitação própria permanente)"
                  : "Primary home (HPP)"}
              </option>
              <option value="hab">
                {isPT ? "Habitação (não HPP)" : "Housing (not HPP)"}
              </option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-800">
              {isPT ? "Comprador ≤35 (HPP)?" : "Buyer ≤35 (HPP)?"}
            </label>
            <select
              value={youngU35}
              onChange={(e) => setYoungU35(e.target.value as YesNo)}
              className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
              disabled={use !== "hpp"}
            >
              <option value="no">{isPT ? "Não" : "No"}</option>
              <option value="yes">{isPT ? "Sim" : "Yes"}</option>
            </select>
          </div>

          <NumField
            label={isPT ? "Crédito (opcional)" : "Mortgage (optional)"}
            value={loanStr}
            onChange={setLoanStr}
            placeholder="0"
            suffix="€"
          />
          <NumField
            label={isPT ? "Prazo do crédito" : "Loan term"}
            value={termStr}
            onChange={setTermStr}
            placeholder="30"
            suffix={isPT ? "anos" : "yrs"}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-900">
            {isPT ? "Custos típicos (editáveis)" : "Typical costs (editable)"}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumField
              label={isPT ? "Escritura/serviços" : "Notary/closing services"}
              value={notaryFeesStr}
              onChange={setNotaryFeesStr}
              suffix="€"
            />
            <NumField
              label={isPT ? "Registos" : "Registry"}
              value={registryFeesStr}
              onChange={setRegistryFeesStr}
              suffix="€"
            />
            <NumField
              label={isPT ? "Solicitador/advogado" : "Solicitor/lawyer"}
              value={lawyerFeesStr}
              onChange={setLawyerFeesStr}
              suffix="€"
            />
            <NumField
              label={isPT ? "Banco/avaliação/comissões" : "Bank/appraisal/fees"}
              value={bankFeesStr}
              onChange={setBankFeesStr}
              suffix="€"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-900">
            {isPT ? "IMI (opcional)" : "IMI (optional)"}
          </div>
          <div className="mt-1 text-[11px] text-slate-700">
            {isPT
              ? "Para estimar IMI precisa do VPT (Valor Patrimonial Tributário)."
              : "To estimate IMI you need VPT (tax value)."}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumField
              label={isPT ? "VPT (se souber)" : "VPT (if known)"}
              value={vptStr}
              onChange={setVptStr}
              suffix="€"
            />
            <div className="rounded-xl border border-white/35 bg-white/55 backdrop-blur-md px-3 py-2 shadow-sm">
              <div className="text-[11px] text-slate-700">
                {isPT ? "Taxa Cascais 2026" : "Cascais rate 2026"}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {pct(0.0035)}{" "}
                {use === "hpp" ? (
                  <span className="text-xs font-semibold text-emerald-700">
                    · {isPT ? "HPP -15%" : "HPP -15%"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {vpt > 0 ? (
            <div className="mt-3 text-xs text-slate-800">
              {isPT ? "IMI estimado/ano:" : "Estimated IMI/year:"}{" "}
              <span className="font-semibold text-slate-900">
                {eur(imi, isPT)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-700">
                <th className="text-left font-semibold py-2">Item</th>
                <th className="text-right font-semibold py-2">
                  {isPT ? "Estimativa" : "Estimate"}
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800 font-semibold">
                  {isPT ? "Preço do imóvel" : "Home price"}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {eur(price, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">IMT</td>
                <td className="py-2 text-right text-slate-900">
                  {eur(imt, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Imposto do Selo (0,8%)" : "Stamp Duty (0.8%)"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(stampPurchase, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "IS sobre crédito" : "Mortgage stamp duty"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(stampMortgage, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Escritura/serviços" : "Notary/closing services"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(notaryFees, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Registos" : "Registry"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(registryFees, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Solicitador/advogado" : "Solicitor/lawyer"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(lawyerFees, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Banco/comissões" : "Bank/fees"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(bankFees, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-900 font-semibold">
                  {isPT ? "Total estimado (1x)" : "Estimated total (one-off)"}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {eur(totalOneOff, isPT)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-[11px] text-slate-700">
          {isPT
            ? "Nota: valores finais dependem de VPT, regras em vigor e custos de entidades."
            : "Note: final amounts depend on VPT, current rules and service costs."}
        </div>
      </div>
    </GlassSurface>
  );
};

/* =========================================================
   CALCULATOR: SELLING
========================================================= */
const SellingCalculator: React.FC<{ isPT: boolean }> = ({ isPT }) => {
  const DEFAULTS = {
    salePriceStr: "750000",
    agencyPctStr: "5",
    includeVAT: "yes" as YesNo,
    mortgageLeftStr: "0",
    otherCostsStr: "800",
    wantCG: "no" as YesNo,
    purchasePriceStr: "550000",
    improvementsStr: "0",
    taxRateStr: "28",
  };

  const [salePriceStr, setSalePriceStr] = useState(DEFAULTS.salePriceStr);
  const [agencyPctStr, setAgencyPctStr] = useState(DEFAULTS.agencyPctStr);
  const [includeVAT, setIncludeVAT] = useState<YesNo>(DEFAULTS.includeVAT);
  const [mortgageLeftStr, setMortgageLeftStr] = useState(
    DEFAULTS.mortgageLeftStr
  );
  const [otherCostsStr, setOtherCostsStr] = useState(DEFAULTS.otherCostsStr);
  const [wantCG, setWantCG] = useState<YesNo>(DEFAULTS.wantCG);
  const [purchasePriceStr, setPurchasePriceStr] = useState(
    DEFAULTS.purchasePriceStr
  );
  const [improvementsStr, setImprovementsStr] = useState(
    DEFAULTS.improvementsStr
  );
  const [taxRateStr, setTaxRateStr] = useState(DEFAULTS.taxRateStr);

  const [emailOpen, setEmailOpen] = useState(false);
  const [sentSummary, setSentSummary] = useState<CalcSummary | null>(null);
  const [sent, setSent] = useState(false);

  const vatRate = 0.23;

  const salePrice = toNumber(salePriceStr);
  const agencyPct = toNumber(agencyPctStr) / 100;
  const mortgageLeft = toNumber(mortgageLeftStr);
  const otherCosts = toNumber(otherCostsStr);

  const agencyFee = salePrice * agencyPct;
  const agencyVAT = includeVAT === "yes" ? agencyFee * vatRate : 0;

  const proceedsBeforeTax =
    salePrice - agencyFee - agencyVAT - mortgageLeft - otherCosts;

  const purchasePrice = toNumber(purchasePriceStr);
  const improvements = toNumber(improvementsStr);
  const userTaxRate = toNumber(taxRateStr) / 100;

  const grossGain = Math.max(
    0,
    salePrice -
      purchasePrice -
      improvements -
      agencyFee -
      agencyVAT -
      otherCosts
  );
  const estimatedCGTax =
    wantCG === "yes" ? grossGain * Math.max(0, Math.min(0.6, userTaxRate)) : 0;
  const netAfterTax = proceedsBeforeTax - estimatedCGTax;

  const resetAll = () => {
    setSalePriceStr(DEFAULTS.salePriceStr);
    setAgencyPctStr(DEFAULTS.agencyPctStr);
    setIncludeVAT(DEFAULTS.includeVAT);
    setMortgageLeftStr(DEFAULTS.mortgageLeftStr);
    setOtherCostsStr(DEFAULTS.otherCostsStr);
    setWantCG(DEFAULTS.wantCG);
    setPurchasePriceStr(DEFAULTS.purchasePriceStr);
    setImprovementsStr(DEFAULTS.improvementsStr);
    setTaxRateStr(DEFAULTS.taxRateStr);
  };

  const buildSummary = (): CalcSummary => ({
    title: isPT ? "Cálculo: venda de imóvel" : "Calculation: property sale",
    rows: [
      {
        label: isPT ? "Preço de venda" : "Sale price",
        value: eur(salePrice, isPT),
      },
      {
        label: isPT ? "Comissão agência" : "Agency fee",
        value: eur(agencyFee, isPT),
      },
      { label: "IVA", value: eur(agencyVAT, isPT) },
      {
        label: isPT ? "Crédito por liquidar" : "Mortgage payoff",
        value: eur(mortgageLeft, isPT),
      },
      {
        label: isPT ? "Outros custos" : "Other costs",
        value: eur(otherCosts, isPT),
      },
      ...(wantCG === "yes"
        ? [
            {
              label: isPT ? "Mais-valias (est.)" : "Capital gains (est.)",
              value: eur(estimatedCGTax, isPT),
            },
          ]
        : []),
      {
        label: isPT ? "Líquido estimado" : "Estimated net",
        value: eur(netAfterTax, isPT),
      },
    ],
  });

  return (
    <GlassSurface className="overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
            {isPT ? "Calculadora de venda" : "Selling"}
          </div>
          <div className="mt-1 text-xs text-slate-700 max-w-lg">
            {isPT
              ? "Estimativa de custos de venda + líquido. Mais-valias é opcional e aproximado."
              : "Estimate selling costs + net proceeds. Capital gains is optional and rough."}
          </div>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-white/45 bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white/85 transition"
          title={isPT ? "Repor valores" : "Reset"}
        >
          <RotateCcw className="w-3 h-3" />
          {isPT ? "Repor" : "Reset"}
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label={isPT ? "Preço de venda" : "Sale price"}
            value={salePriceStr}
            onChange={setSalePriceStr}
            suffix="€"
          />
          <NumField
            label={isPT ? "Comissão agência" : "Agency fee"}
            value={agencyPctStr}
            onChange={setAgencyPctStr}
            suffix="%"
          />

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-800">
              {isPT ? "IVA na comissão?" : "VAT on fee?"}
            </label>
            <select
              value={includeVAT}
              onChange={(e) => setIncludeVAT(e.target.value as YesNo)}
              className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
            >
              <option value="yes">{isPT ? "Sim (23%)" : "Yes (23%)"}</option>
              <option value="no">{isPT ? "Não" : "No"}</option>
            </select>
          </div>

          <NumField
            label={
              isPT
                ? "Crédito por liquidar (opcional)"
                : "Mortgage payoff (optional)"
            }
            value={mortgageLeftStr}
            onChange={setMortgageLeftStr}
            suffix="€"
          />
          <NumField
            label={
              isPT
                ? "Outros custos (docs, CE, etc.)"
                : "Other costs (docs, energy cert, etc.)"
            }
            value={otherCostsStr}
            onChange={setOtherCostsStr}
            suffix="€"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900">
                {isPT ? "Mais-valias (opcional)" : "Capital gains (optional)"}
              </div>
              <div className="text-[11px] text-slate-700">
                {isPT
                  ? "Depende de residência fiscal, reinvestimento, etc."
                  : "Depends on tax residency, reinvestment, etc."}
              </div>
            </div>

            <select
              value={wantCG}
              onChange={(e) => setWantCG(e.target.value as YesNo)}
              className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="no">
                {isPT ? "Não estimar" : "Don't estimate"}
              </option>
              <option value="yes">{isPT ? "Estimar" : "Estimate"}</option>
            </select>
          </div>

          {wantCG === "yes" ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumField
                label={
                  isPT
                    ? "Preço de compra (histórico)"
                    : "Purchase price (historical)"
                }
                value={purchasePriceStr}
                onChange={setPurchasePriceStr}
                suffix="€"
              />
              <NumField
                label={
                  isPT
                    ? "Obras/melhorias (comprováveis)"
                    : "Improvements (documented)"
                }
                value={improvementsStr}
                onChange={setImprovementsStr}
                suffix="€"
              />
              <NumField
                label={
                  isPT
                    ? "Taxa efetiva para estimar"
                    : "Effective tax rate to estimate"
                }
                value={taxRateStr}
                onChange={setTaxRateStr}
                suffix="%"
              />
              <div className="rounded-xl border border-white/35 bg-white/55 backdrop-blur-md px-3 py-2 shadow-sm">
                <div className="text-[11px] text-slate-700">
                  {isPT ? "Ganho (muito aproximado)" : "Gain (very rough)"}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {eur(grossGain, isPT)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-700">
                <th className="text-left font-semibold py-2">Item</th>
                <th className="text-right font-semibold py-2">
                  {isPT ? "Estimativa" : "Estimate"}
                </th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800 font-semibold">
                  {isPT ? "Preço de venda" : "Sale price"}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {eur(salePrice, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Comissão agência" : "Agency fee"}{" "}
                  <span className="text-[11px] text-slate-700">
                    ({pct(agencyPct)})
                  </span>
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(agencyFee, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">IVA</td>
                <td className="py-2 text-right text-slate-900">
                  {eur(agencyVAT, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Crédito por liquidar" : "Mortgage payoff"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(mortgageLeft, isPT)}
                </td>
              </tr>
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-800">
                  {isPT ? "Outros custos" : "Other costs"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(otherCosts, isPT)}
                </td>
              </tr>
              {wantCG === "yes" ? (
                <tr className="border-t border-white/25">
                  <td className="py-2 text-slate-800">
                    {isPT ? "Mais-valias (estimativa)" : "Capital gains"}
                  </td>
                  <td className="py-2 text-right text-slate-900">
                    {eur(estimatedCGTax, isPT)}
                  </td>
                </tr>
              ) : null}
              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-900 font-semibold">
                  {isPT ? "Líquido estimado" : "Estimated net"}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {eur(netAfterTax, isPT)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-[11px] text-slate-700">
          {isPT
            ? "Nota: use como ordem de grandeza e valide com contabilista."
            : "Note: use as a rough magnitude and validate with an accountant."}
        </div>
      </div>
    </GlassSurface>
  );
};

/* =========================================================
   PAGE
========================================================= */
const LivingGuidePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { key } = useParams();
  const navigate = useNavigate();

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const rawGuide = useMemo(() => getLivingGuide(key), [key]);
  const guide = (rawGuide as typeof rawGuide & LivingGuideExtras) || undefined;

  const t = <T extends Localized>(obj: T) => (isPT ? obj.pt : obj.en);
  const to = (obj?: Localized, fallback = "") =>
    obj ? (isPT ? obj.pt : obj.en) : fallback;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  /* ---------- Match modal ---------- */
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("buyer");

  const [matchName, setMatchName] = useState("");
  const [matchEmail, setMatchEmail] = useState("");
  const [matchPhone, setMatchPhone] = useState("");
  const [matchNotes, setMatchNotes] = useState("");
  const [matchGdpr, setMatchGdpr] = useState(false);

  /* Qualificação */
  const [buyerFinancing, setBuyerFinancing] = useState<BuyerFinancing>("");
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus>("");

  const buyerTimingOptions: Localized[] = [
    { pt: "Agora", en: "Now" },
    { pt: "1–3 meses", en: "1–3 months" },
    { pt: "3–6 meses", en: "3–6 months" },
    { pt: "6+ meses", en: "6+ months" },
  ];
  const buyerTypeOptions: Localized[] = [
    { pt: "Apartamento", en: "Apartment" },
    { pt: "Moradia", en: "House" },
    { pt: "Novo", en: "New build" },
    { pt: "Para renovar", en: "Renovation" },
  ];
  const buyerMustHaveOptions: Localized[] = [
    { pt: "Perto de escolas", en: "Near schools" },
    { pt: "Caminhável", en: "Walkable" },
    { pt: "Comboio", en: "Train" },
    { pt: "Vista mar", en: "Sea view" },
    { pt: "Estacionamento", en: "Parking" },
  ];

  const [buyerTiming, setBuyerTiming] = useState<string>("");
  const [buyerType, setBuyerType] = useState<string>("");
  const [buyerMustHaves, setBuyerMustHaves] = useState<string[]>([]);

  const ownerGoalOptions: Localized[] = [
    { pt: "Vender", en: "Sell" },
    { pt: "Arrendar", en: "Rent" },
  ];
  const ownerConditionOptions: Localized[] = [
    { pt: "Pronto a habitar", en: "Move-in ready" },
    { pt: "Precisa de obras", en: "Needs work" },
    { pt: "Renovado", en: "Renovated" },
  ];
  const ownerTimelineOptions: Localized[] = [
    { pt: "ASAP", en: "ASAP" },
    { pt: "1–3 meses", en: "1–3 months" },
    { pt: "3–6 meses", en: "3–6 months" },
    { pt: "Flexível", en: "Flexible" },
  ];

  const [ownerGoal, setOwnerGoal] = useState<string>("");
  const [ownerCondition, setOwnerCondition] = useState<string>("");
  const [ownerTimeline, setOwnerTimeline] = useState<string>("");

  const buyerFinancingOptions: Array<{
    id: Exclude<BuyerFinancing, "">;
    pt: string;
    en: string;
  }> = [
    { id: "cash", pt: "Tenho capital", en: "Cash buyer" },
    { id: "pre-approved", pt: "Crédito pré-aprovado", en: "Pre-approved" },
    { id: "need-mortgage", pt: "Preciso de crédito", en: "Need mortgage" },
    { id: "not-yet", pt: "Ainda a explorar", en: "Still exploring" },
  ];

  const ownerStatusOptions: Array<{
    id: Exclude<OwnerStatus, "">;
    pt: string;
    en: string;
  }> = [
    { id: "not-listed", pt: "Ainda não anunciei", en: "Not listed yet" },
    { id: "with-agency", pt: "Já com agência", en: "Already with agency" },
    {
      id: "selling-myself",
      pt: "Estou a vender sozinho",
      en: "Selling myself",
    },
    { id: "just-evaluating", pt: "Só a avaliar", en: "Just evaluating" },
  ];

  const openMatch = (type: MatchType) => {
    setMatchType(type);
    setSubmitStatus("idle");
    setShowMatchModal(true);
  };

  const closeMatch = () => {
    setShowMatchModal(false);
    setSubmitStatus("idle");
  };

  const handleCta = (kind: string) => {
    if (kind === "browseHomes") return navigate("/real-estate");
    if (kind === "viewServices") return navigate("/");
    if (kind === "getMatched") return openMatch("buyer");
    if (kind === "ownerHelp") return openMatch("owner");
  };

  const buildMatchMeta = () => {
    if (matchType === "buyer") {
      const must = buyerMustHaves.length ? buyerMustHaves.join(", ") : "—";
      return `Match type: Buyer
Timing: ${buyerTiming || "—"}
Property type: ${buyerType || "—"}
Must-haves: ${must}
Financing: ${buyerFinancing || "—"}`;
    }
    return `Match type: Owner
Goal: ${ownerGoal || "—"}
Condition: ${ownerCondition || "—"}
Timeline: ${ownerTimeline || "—"}
Status: ${ownerStatus || "—"}`;
  };

  const submitMatch = async () => {
    if (!matchName.trim() || !matchEmail.trim()) {
      alert(isPT ? "Preencha nome e email." : "Please add name and email.");
      return;
    }

    if (!matchGdpr) {
      alert(
        isPT
          ? "Precisa de autorizar o contacto para continuar."
          : "You need to authorize contact to continue."
      );
      return;
    }

    const intent = matchType === "buyer" ? "acquisition" : "listing";

    const meta =
      matchType === "buyer"
        ? {
            kind: "match",
            intent,
            partner: "chioss-realty",
            timing: buyerTiming || null,
            propertyType: buyerType || null,
            mustHaves: buyerMustHaves || [],
            qualification: { financing: buyerFinancing || null },
          }
        : {
            kind: "match",
            intent,
            partner: "chioss-realty",
            goal: ownerGoal || null,
            condition: ownerCondition || null,
            timeline: ownerTimeline || null,
            qualification: { owner_status: ownerStatus || null },
          };

    const payload = {
      source: "living-guides",
      page_url: pageUrl,
      language: isPT ? "pt" : "en",
      match_type: matchType,
      name: matchName.trim(),
      email: matchEmail.trim(),
      phone: matchPhone.trim() || null,
      notes: matchNotes.trim() || null,
      meta,
    };

    const openMailto = () => {
      const metaText = buildMatchMeta();
      const subject = encodeURIComponent(
        matchType === "owner"
          ? isPT
            ? "Pedido (Proprietário) — AllCascais"
            : "Request (Owner) — AllCascais"
          : isPT
          ? "Pedido (Comprador) — AllCascais"
          : "Request (Buyer) — AllCascais"
      );

      const body = encodeURIComponent(
        `${isPT ? "Nome" : "Name"}: ${matchName}\n` +
          `Email: ${matchEmail}\n` +
          `${isPT ? "Telefone" : "Phone"}: ${matchPhone || "—"}\n\n` +
          `${isPT ? "Detalhes" : "Details"}:\n${metaText}\n\n` +
          `${isPT ? "Mensagem" : "Message"}:\n${matchNotes}\n\n` +
          `Page: ${pageUrl}\n`
      );

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;

      setSubmitStatus("success");

      setMatchName("");
      setMatchEmail("");
      setMatchPhone("");
      setMatchNotes("");
      setMatchGdpr(false);
      setBuyerTiming("");
      setBuyerType("");
      setBuyerMustHaves([]);
      setBuyerFinancing("");
      setOwnerGoal("");
      setOwnerCondition("");
      setOwnerTimeline("");
      setOwnerStatus("");
    } catch (err) {
      console.error(err);
      alert(
        isPT
          ? "Não foi possível enviar automaticamente. Vamos abrir o seu email para enviar o pedido."
          : "Couldn’t submit automatically. We’ll open your email to send the request."
      );
      openMailto();
      closeMatch();
    }
  };

  /* ---------- Copy feedback ---------- */
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      window.prompt(isPT ? "Copie:" : "Copy:", text);
    }
  };

  /* ---------- Buying example ---------- */
  const renderBuyingExample = () => {
    const examplePrice = 500000;
    const stampDutyPurchase = Math.round(examplePrice * 0.008);

    return (
      <GlassSurface className="overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
            {isPT ? "Exemplo rápido (estimativa)" : "Quick example (estimate)"}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            {isPT
              ? "Serve para entender a lógica do custo total."
              : "This helps you understand total-cost logic."}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-700">
                  <th className="text-left font-semibold py-2">Item</th>
                  <th className="text-right font-semibold py-2">
                    {isPT ? "Exemplo" : "Example"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                <tr className="border-t border-white/25">
                  <td className="py-2 text-slate-800 font-semibold">
                    {isPT ? "Preço do imóvel" : "Home price"}
                  </td>
                  <td className="py-2 text-right text-slate-900 font-semibold">
                    {eur(examplePrice, isPT)}
                  </td>
                </tr>
                <tr className="border-t border-white/25">
                  <td className="py-2 text-slate-800">
                    {isPT ? "Imposto de Selo (0,8%)" : "Stamp Duty (0.8%)"}
                  </td>
                  <td className="py-2 text-right text-slate-900">
                    {eur(stampDutyPurchase, isPT)}
                  </td>
                </tr>
                <tr className="border-t border-white/25">
                  <td className="py-2 text-slate-800">
                    {isPT ? "IMT (varia)" : "IMT (varies)"}
                  </td>
                  <td className="py-2 text-right text-slate-600">—</td>
                </tr>
                <tr className="border-t border-white/25">
                  <td className="py-2 text-slate-800">
                    {isPT
                      ? "Escritura/serviços (varia)"
                      : "Closing/services (varies)"}
                  </td>
                  <td className="py-2 text-right text-slate-600">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-slate-700">
            {isPT
              ? "Dica: compare imóveis por custo total no 1º ano."
              : "Tip: compare homes by total first-year cost."}
          </div>
        </div>
      </GlassSurface>
    );
  };

  const renderGuideExtras = () => {
    if (!guide) return null;
    if (guide.key === "buying") return renderBuyingExample();
    if (guide.key === "costs") return <RealCostsCalculator isPT={isPT} />;
    if (guide.key === "owners") return <SellingCalculator isPT={isPT} />;
    return null;
  };

  const hasExtraWidget =
    guide && ["buying", "costs", "owners"].includes(guide.key as string);

  if (!guide) {
    return (
      <div className="min-h-screen py-6">
        <div className="fixed inset-0 -z-10 bg-linear-to-b from-white/35 via-white/15 to-white/30 backdrop-blur-[2px]" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <GlassSurface className="p-6">
            <div className="text-sm font-semibold text-slate-900">
              {isPT ? "Guia não encontrado" : "Guide not found"}
            </div>
            <div className="mt-2 text-xs text-slate-700">
              {isPT
                ? "Volte aos guias e escolha um tema."
                : "Go back to the guides list and pick a topic."}
            </div>
            <div className="mt-4">
              <PrimaryBtn type="button" onClick={() => navigate("/living")}>
                {isPT ? "Voltar" : "Back"}
              </PrimaryBtn>
            </div>
          </GlassSurface>
        </div>
      </div>
    );
  }

  const primaryCta =
    guide.ctas.find((c) => c.kind === "getMatched") ??
    guide.ctas.find((c) => c.kind === "browseHomes") ??
    guide.ctas[0];

  const nextGuideKey = NEXT_GUIDE_MAP[guide.key] ?? null;
  const nextGuide = nextGuideKey
    ? LIVING_GUIDES.find((g: any) => g.key === nextGuideKey)
    : null;
  const otherGuides = LIVING_GUIDES.filter(
    (g: any) => g.key !== guide.key && g.key !== nextGuideKey
  ).slice(0, 2);

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="min-h-screen py-3">
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-white/35 via-white/15 to-white/30 backdrop-blur-[2px]" />

      {/* Sticky mini-TOC (mobile) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {guide.sections.map((s: any, i: number) => {
              const short = t(s.heading).split(/[:—–]/)[0].trim();
              return (
                <a
                  key={i}
                  href={`#section-${i}`}
                  className="shrink-0 text-[10px] font-semibold text-slate-600 hover:text-[#1F1F3D] px-2.5 py-1 rounded-full hover:bg-slate-100 transition"
                >
                  {short}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN */}
          <div className="min-w-0">
            {/* Back */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-slate-950 mb-4"
            >
              ← {isPT ? "Voltar" : "Back"}
            </button>

            {/* Card 1 — Identidade */}
            <GlassSurface className="overflow-hidden">
              <div
                className="relative px-5 py-5 sm:px-7 sm:py-6"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(31,111,166,0.18) 0%, rgba(250,248,244,0.92) 55%, rgba(255,255,255,0.96) 100%)",
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-white/25" />
                <div className="relative">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {isPT
                      ? "🏡 Viver em Cascais · Guia"
                      : "🏡 Living in Cascais · Guide"}
                  </div>

                  <h1
                    className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900 tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {t(guide.title)}
                  </h1>

                  <p className="mt-2 text-sm text-slate-700">
                    {t(guide.subtitle)}
                  </p>

                  {guide.audience?.length ? (
                    <div className="mt-3 space-y-1">
                      {guide.audience.map((a) => (
                        <div
                          key={a.en}
                          className="flex gap-2 text-[12px] text-slate-700"
                        >
                          <span className="text-[#1F1F3D]">→</span>
                          <span>{t(a)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </GlassSurface>

            {/* Card 2 — Utilitário */}
            <GlassSurface className="mt-4 overflow-hidden">
              <div className="px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>⏱ {t(guide.readTime)}</Pill>

                  {guide.updatedAt ? (
                    <Pill>
                      🗓 {isPT ? "Atualizado" : "Updated"}{" "}
                      {new Date(guide.updatedAt).toLocaleDateString(
                        isPT ? "pt-PT" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </Pill>
                  ) : null}

                  {guide.chips.map((c) => (
                    <Pill key={c.en}>{t(c)}</Pill>
                  ))}
                </div>

                {guide.takeaways?.length ? (
                  <div className="mt-4 border-l-2 border-[#1F1F3D]/25 pl-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-2">
                      {isPT ? "Se só levar 3 coisas" : "If you take 3 things"}
                    </div>
                    <ol className="space-y-1.5">
                      {guide.takeaways.map((tk, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[12px] text-slate-800"
                        >
                          <span aria-hidden="true">
                            {TAKEAWAY_ICONS[i] ?? "•"}
                          </span>
                          <span>{t(tk)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {guide.sections.length > 2 ? (
                  <nav
                    className="mt-4 pt-4 border-t border-white/30 flex flex-wrap gap-1.5"
                    aria-label="Sections"
                  >
                    {guide.sections.map((s: any, i: number) => {
                      const short = t(s.heading).split(/[:—–]/)[0].trim();
                      return (
                        <a
                          key={i}
                          href={`#section-${i}`}
                          className="inline-flex items-center rounded-full border border-white/40 bg-white/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white/85 transition"
                        >
                          {short}
                        </a>
                      );
                    })}
                  </nav>
                ) : null}
              </div>
            </GlassSurface>

            {/* Sections */}
            <div className="mt-6 space-y-6">
              {guide.sections.map((s: any, idx: number) => {
                const icon = toneIcon(s.tone);
                const label = toneLabel(s.tone, isPT);
                return (
                  <section
                    key={idx}
                    id={`section-${idx}`}
                    className={cls(
                      "scroll-mt-20 relative rounded-3xl border",
                      toneStyles(s.tone),
                      tonePadding(s.tone)
                    )}
                  >
                    <span
                      className="absolute top-4 right-5 text-[11px] font-bold text-slate-300 select-none"
                      aria-hidden="true"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {icon && label ? (
                      <div className="inline-flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                        <span aria-hidden="true">{icon}</span>
                        <span>{label}</span>
                      </div>
                    ) : null}

                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 pr-10">
                      {t(s.heading)}
                    </h2>

                    {s.body && (
                      <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {t(s.body)}
                      </p>
                    )}

                    {s.bullets && s.bullets.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {s.bullets.map((b: any, i: number) => (
                          <li
                            key={i}
                            className="flex gap-2 text-xs sm:text-sm text-slate-800"
                          >
                            <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#1F1F3D]" />
                            <span>{t(b)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Ferramenta interativa */}
            {hasExtraWidget ? (
              <section className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    🧮 {isPT ? "Ferramenta interativa" : "Interactive tool"}
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <h2
                  className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-wide text-center mb-5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {guide.key === "buying" &&
                    (isPT ? "Exemplo passo-a-passo" : "Step-by-step example")}
                  {guide.key === "costs" &&
                    (isPT
                      ? "Quanto custa, na prática?"
                      : "What it costs, in practice")}
                  {guide.key === "owners" &&
                    (isPT
                      ? "Quanto recebe, na prática?"
                      : "What you'll receive")}
                </h2>

                {renderGuideExtras()}
              </section>
            ) : null}

            {/* Templates */}
            {guide.templates?.length ? (
              <GlassSurface className="mt-8 p-5 sm:p-7">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Templates (copiar/colar)" : "Templates (copy/paste)"}
                </div>
                <div className="mt-4 space-y-3">
                  {guide.templates.map((tpl, idx) => {
                    const k = `tpl-${idx}`;
                    const copied = copiedKey === k;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md shadow-sm overflow-hidden"
                      >
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900">
                              {t(tpl.title)}
                            </div>
                            {tpl.description ? (
                              <div className="mt-1 text-[11px] text-slate-700">
                                {to(tpl.description)}
                              </div>
                            ) : null}
                          </div>
                          <GhostBtn
                            type="button"
                            onClick={() => copyToClipboard(t(tpl.copyText), k)}
                            className={cls(
                              "shrink-0",
                              copied &&
                                "border-emerald-400 bg-emerald-50 text-emerald-800"
                            )}
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                {isPT ? "Copiado" : "Copied"}
                              </>
                            ) : isPT ? (
                              "Copiar"
                            ) : (
                              "Copy"
                            )}
                          </GhostBtn>
                        </div>

                        <details className="border-t border-white/30 group">
                          <summary className="px-4 py-2 cursor-pointer list-none flex items-center justify-between text-[11px] text-slate-600 hover:text-slate-900 transition">
                            <span>
                              {isPT ? "Ver pré-visualização" : "See preview"}
                            </span>
                            <span className="transition-transform group-open:rotate-180">
                              ⌄
                            </span>
                          </summary>
                          <div className="px-4 pb-4 text-[11px] text-slate-700 whitespace-pre-line">
                            {t(tpl.copyText)}
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </GlassSurface>
            ) : null}

            {/* FAQs */}
            {guide.faqs?.length ? (
              <GlassSurface className="mt-8 p-5 sm:p-7">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Perguntas frequentes" : "FAQs"}
                </div>
                <div className="mt-4 space-y-2">
                  {guide.faqs.map((f, idx) => (
                    <details
                      key={idx}
                      open={idx === 0}
                      className="rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md px-4 py-3 shadow-sm group"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold text-slate-900">
                            {t(f.q)}
                          </div>
                          <span className="text-slate-600 transition-transform group-open:rotate-180">
                            ⌄
                          </span>
                        </div>
                      </summary>
                      <div className="mt-2 text-xs sm:text-sm text-slate-700">
                        {t(f.a)}
                      </div>
                    </details>
                  ))}
                </div>
              </GlassSurface>
            ) : null}

            {/* Share */}
            <GlassSurface className="mt-8 p-5 sm:p-7">
              <div className="text-sm font-semibold text-slate-900">
                {isPT ? "Partilhar este guia" : "Share this guide"}
              </div>
              <div className="mt-1 text-xs text-slate-700">
                {isPT
                  ? "Ajuda alguém que está a mudar-se para Cascais."
                  : "Help someone moving to Cascais."}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <GhostBtn
                  type="button"
                  onClick={() => copyToClipboard(pageUrl, "copy-link")}
                  className={cls(
                    copiedKey === "copy-link" &&
                      "border-emerald-400 bg-emerald-50 text-emerald-800"
                  )}
                >
                  {copiedKey === "copy-link" ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      {isPT ? "Copiado" : "Copied"}
                    </>
                  ) : isPT ? (
                    "Copiar link"
                  ) : (
                    "Copy link"
                  )}
                </GhostBtn>

                {guide.sharePost ? (
                  <SuccessBtn
                    type="button"
                    onClick={() =>
                      copyToClipboard(t(guide.sharePost!), "copy-post")
                    }
                    className={cls(
                      copiedKey === "copy-post" && "bg-emerald-700"
                    )}
                  >
                    {copiedKey === "copy-post" ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isPT ? "Copiado" : "Copied"}
                      </>
                    ) : (
                      <>{isPT ? "Copiar post" : "Copy post"}</>
                    )}
                  </SuccessBtn>
                ) : null}
              </div>
            </GlassSurface>

            {/* CTA final */}
            <section className="mt-8 rounded-3xl overflow-hidden bg-slate-950 px-6 py-8 sm:px-10 sm:py-10 relative">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 mb-2">
                  {isPT ? "Próximo passo" : "Next step"}
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  {isPT
                    ? "Se quiser, ajudamos em 24h."
                    : "If you want, we’ll help in 24h."}
                </h2>
                <p className="mt-2 text-sm text-white/70 max-w-lg">
                  {isPT
                    ? "Shortlist personalizada + contexto local. Sem spam, sem pressão."
                    : "Curated shortlist + local context. No spam, no pressure."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {guide.ctas.map((c: any, i: number) => (
                    <React.Fragment key={i}>
                      {c.kind === "browseHomes" ? (
                        <button
                          type="button"
                          onClick={() => handleCta(c.kind)}
                          className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-5 py-2.5 text-xs font-semibold shadow-lg hover:bg-slate-100 transition"
                        >
                          {t(c.label)}
                        </button>
                      ) : c.kind === "getMatched" ? (
                        <button
                          type="button"
                          onClick={() => handleCta(c.kind)}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-white px-5 py-2.5 text-xs font-semibold shadow-lg hover:bg-emerald-600 transition"
                        >
                          {t(c.label)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCta(c.kind)}
                          className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/25 text-white px-5 py-2.5 text-xs font-semibold hover:bg-white/20 transition backdrop-blur"
                        >
                          {t(c.label)}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>

            {/* Nota legal */}
            <p className="mt-6 text-[10px] text-slate-500 leading-relaxed max-w-2xl mx-auto text-center">
              {isPT
                ? "Nota: informação prática e educativa. Regras e impostos podem mudar. Para decisões finais, confirme com solicitador/advogado e fontes oficiais."
                : "Note: practical, educational guidance. Rules and taxes can change. For final decisions, confirm with a solicitor/lawyer and official sources."}
            </p>

            <div className="h-20 lg:hidden" />
          </div>

          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <GlassSurface className="p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {isPT ? "Próximo passo" : "Next step"}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {isPT ? "Quer ajuda em 24h?" : "Want help in 24h?"}
                </div>
                <div className="mt-2 text-xs text-slate-700">
                  {isPT
                    ? "Shortlist personalizada + contexto local. Sem spam."
                    : "Curated shortlist + local context. No spam."}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <SuccessBtn
                    type="button"
                    onClick={() => openMatch("buyer")}
                    className="text-sm py-2.5"
                  >
                    {isPT ? "Receber recomendações" : "Get recommendations"}
                  </SuccessBtn>
                  <GhostBtn
                    type="button"
                    onClick={() => openMatch("owner")}
                    className="text-sm py-2.5"
                  >
                    {isPT ? "Sou proprietário" : "I'm an owner"}
                  </GhostBtn>
                </div>
              </GlassSurface>

              {nextGuide ? (
                <GlassSurface className="p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {isPT ? "Próximo recomendado" : "Recommended next"}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/living/guides/${nextGuide.key}`)}
                    className="mt-3 w-full text-left rounded-2xl border border-[#1F1F3D]/25 bg-gradient-to-br from-sky-50/70 to-white px-4 py-3 hover:from-sky-50 hover:to-white shadow-sm transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {t(nextGuide.title)}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700 line-clamp-2">
                          {t(nextGuide.subtitle)}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#1F1F3D] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </GlassSurface>
              ) : null}

              {otherGuides.length > 0 ? (
                <GlassSurface className="p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {isPT ? "Outros guias" : "Other guides"}
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {otherGuides.map((g: any) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => navigate(`/living/guides/${g.key}`)}
                        className="text-left rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-white/70 shadow-sm transition"
                      >
                        <div className="text-slate-900">{t(g.title)}</div>
                        <div className="mt-1 text-[11px] text-slate-700 line-clamp-1">
                          {t(g.subtitle)}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/living")}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F1F3D] hover:text-[#15152E] underline underline-offset-2"
                  >
                    {isPT ? "Ver todos os guias" : "See all guides"}
                    <span>→</span>
                  </button>
                </GlassSurface>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-50 px-3 pb-3">
        <div className="rounded-3xl border border-white/35 bg-white/80 backdrop-blur-xl shadow-lg px-3 py-3 ring-1 ring-slate-900/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-700">
                {isPT ? "Próximo passo" : "Next step"}
              </div>
              <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                {isPT
                  ? "Fala connosco — resposta em 24h"
                  : "Talk to us — reply in 24h"}
              </div>
            </div>

            {primaryCta ? (
              <SuccessBtn
                type="button"
                onClick={() => handleCta(primaryCta.kind)}
                className="shrink-0"
              >
                {isPT ? "Quero ajuda" : "Get help"}
              </SuccessBtn>
            ) : null}
          </div>
        </div>
      </div>

      {/* MATCH MODAL */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white/88 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden border border-white/35 ring-1 ring-slate-900/10"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/25 bg-white/45 backdrop-blur-lg">
              <div>
                <div className="text-[11px] font-semibold text-[#1F1F3D]">
                  {matchType === "owner"
                    ? isPT
                      ? "Para proprietários"
                      : "For owners"
                    : isPT
                    ? "Para compradores/arrendatários"
                    : "For buyers/renters"}
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-900">
                  {matchType === "owner"
                    ? isPT
                      ? "Quer vender ou arrendar o seu imóvel?"
                      : "Want to sell or rent your home?"
                    : isPT
                    ? "Diga-nos o que procura"
                    : "Tell us what you need"}
                </div>
                <div className="mt-2 text-[11px] text-slate-700">
                  ✅ {isPT ? "Resposta em 24h" : "Reply in 24h"} • ✅{" "}
                  {isPT ? "Sem spam" : "No spam"} • ✅{" "}
                  {isPT ? "Sem pressão" : "No pressure"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeMatch}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/35 text-slate-700 hover:bg-white/75 transition"
                aria-label={isPT ? "Fechar" : "Close"}
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto max-h-[80vh]">
              {submitStatus === "success" ? (
                <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/88 backdrop-blur-md p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    {isPT ? "Pedido recebido ✅" : "Request received ✅"}
                  </div>
                  <div className="mt-2 text-xs sm:text-sm text-slate-800">
                    {isPT
                      ? "Obrigado! A sua mensagem foi entregue à nossa equipa. Respondemos em até 24h."
                      : "Thank you! Your message was delivered to our team. We reply within 24h."}
                  </div>

                  <div className="mt-3 text-center text-[11px] text-slate-500">
                    {isPT ? "ou envie email para " : "or email "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-semibold text-slate-700 hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>

                  <div className="mt-5 flex sm:justify-center">
                    <GhostBtn type="button" onClick={closeMatch}>
                      {isPT ? "Fechar" : "Close"}
                    </GhostBtn>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setMatchType("buyer")}
                      className={cls(
                        "flex-1 rounded-full border px-4 py-2 text-xs font-semibold transition backdrop-blur-md",
                        matchType === "buyer"
                          ? "border-emerald-500/60 bg-emerald-50/85 text-emerald-800 shadow-sm"
                          : "border-white/35 bg-white/55 text-slate-800 hover:bg-white/70"
                      )}
                    >
                      {isPT ? "Quero comprar/arrendar" : "I want to buy/rent"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchType("owner")}
                      className={cls(
                        "flex-1 rounded-full border px-4 py-2 text-xs font-semibold transition backdrop-blur-md",
                        matchType === "owner"
                          ? "border-[#1F1F3D]/60 bg-blue-50/85 text-[#1F1F3D] shadow-sm"
                          : "border-white/35 bg-white/55 text-slate-800 hover:bg-white/70"
                      )}
                    >
                      {isPT ? "Sou proprietário" : "I'm an owner"}
                    </button>
                  </div>

                  {matchType === "buyer" ? (
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {isPT
                          ? "Detalhes rápidos (1 clique)"
                          : "Quick details (1 click)"}
                      </div>
                      <div className="mt-2">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Timing" : "Timing"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {buyerTimingOptions.map((o) => {
                            const label = t(o);
                            return (
                              <ToggleChip
                                key={label}
                                active={buyerTiming === label}
                                label={label}
                                onClick={() => setBuyerTiming(label)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Tipo" : "Type"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {buyerTypeOptions.map((o) => {
                            const label = t(o);
                            return (
                              <ToggleChip
                                key={label}
                                active={buyerType === label}
                                label={label}
                                onClick={() => setBuyerType(label)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Must-haves" : "Must-haves"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {buyerMustHaveOptions.map((o) => {
                            const label = t(o);
                            const active = buyerMustHaves.includes(label);
                            return (
                              <ToggleChip
                                key={label}
                                active={active}
                                label={label}
                                onClick={() =>
                                  setBuyerMustHaves((prev) =>
                                    active
                                      ? prev.filter((x) => x !== label)
                                      : [...prev, label]
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT
                            ? "Como pretende financiar?"
                            : "How do you plan to finance?"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {buyerFinancingOptions.map((o) => {
                            const active = buyerFinancing === o.id;
                            return (
                              <ToggleChip
                                key={o.id}
                                active={active}
                                label={isPT ? o.pt : o.en}
                                onClick={() =>
                                  setBuyerFinancing(active ? "" : o.id)
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {isPT
                          ? "Detalhes rápidos (1 clique)"
                          : "Quick details (1 click)"}
                      </div>
                      <div className="mt-2">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Objetivo" : "Goal"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ownerGoalOptions.map((o) => {
                            const label = t(o);
                            return (
                              <ToggleChip
                                key={label}
                                active={ownerGoal === label}
                                label={label}
                                onClick={() => setOwnerGoal(label)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Estado" : "Condition"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ownerConditionOptions.map((o) => {
                            const label = t(o);
                            return (
                              <ToggleChip
                                key={label}
                                active={ownerCondition === label}
                                label={label}
                                onClick={() => setOwnerCondition(label)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT ? "Prazo" : "Timeline"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ownerTimelineOptions.map((o) => {
                            const label = t(o);
                            return (
                              <ToggleChip
                                key={label}
                                active={ownerTimeline === label}
                                label={label}
                                onClick={() => setOwnerTimeline(label)}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-[11px] text-slate-700 mb-1">
                          {isPT
                            ? "Em que fase está?"
                            : "What stage are you at?"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ownerStatusOptions.map((o) => {
                            const active = ownerStatus === o.id;
                            return (
                              <ToggleChip
                                key={o.id}
                                active={active}
                                label={isPT ? o.pt : o.en}
                                onClick={() =>
                                  setOwnerStatus(active ? "" : o.id)
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-800">
                        {isPT ? "Nome" : "Name"}
                      </label>
                      <input
                        value={matchName}
                        onChange={(e) => setMatchName(e.target.value)}
                        className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
                        placeholder={isPT ? "O seu nome" : "Your name"}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-800">
                        Email
                      </label>
                      <input
                        value={matchEmail}
                        onChange={(e) => setMatchEmail(e.target.value)}
                        className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-800">
                        {isPT ? "Telefone (opcional)" : "Phone (optional)"}
                      </label>
                      <input
                        value={matchPhone}
                        onChange={(e) => setMatchPhone(e.target.value)}
                        className="rounded-xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm"
                        placeholder={isPT ? "+351 ..." : "+351 ..."}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-800">
                        {matchType === "owner"
                          ? isPT
                            ? "Fale-nos do imóvel (zona, tipologia, objetivo)"
                            : "Tell us about the home (area, type, goal)"
                          : isPT
                          ? "O que procura? (zona, orçamento, tipologia, timing)"
                          : "What are you looking for? (area, budget, type, timing)"}
                      </label>
                      <textarea
                        value={matchNotes}
                        onChange={(e) => setMatchNotes(e.target.value)}
                        className="rounded-2xl border border-white/45 bg-white/70 backdrop-blur-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/80 shadow-sm min-h-27.5"
                      />
                    </div>
                  </div>

                  {/* RGPD */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchGdpr}
                        onChange={(e) => setMatchGdpr(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1F1F3D] focus:ring-[#1F1F3D]/30"
                      />
                      <span className="text-[11px] text-slate-700 leading-relaxed">
                        <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-[#1F1F3D]" />
                        {isPT
                          ? "Autorizo o contacto por email/telefone sobre imóveis em Cascais, feito pela equipa AllCascais. Posso pedir a eliminação dos meus dados a qualquer momento."
                          : "I authorize email/phone contact about Cascais properties, made by the AllCascais team. I can request deletion of my data at any time."}{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#1F1F3D] underline underline-offset-2"
                        >
                          {isPT ? "Política de privacidade" : "Privacy policy"}
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <div className="text-[11px] text-slate-500">
                        {isPT
                          ? "Respondemos em até 24h. Sem spam, sem pressão."
                          : "We reply within 24h. No spam, no pressure."}
                      </div>
                      <div className="flex gap-2">
                        <GhostBtn type="button" onClick={closeMatch}>
                          {isPT ? "Cancelar" : "Cancel"}
                        </GhostBtn>
                        <PrimaryBtn type="button" onClick={submitMatch}>
                          {isPT ? "Enviar pedido" : "Send request"}
                        </PrimaryBtn>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivingGuidePage;
