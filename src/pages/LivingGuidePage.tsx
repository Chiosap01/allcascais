// src/pages/LivingGuidePage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../layouts/MainLayout";
import { getLivingGuide, LIVING_GUIDES } from "../content/livingGuides";
import { supabase } from "../supabase";

/**
 * NOTE:
 * Your LivingGuide type (in livingGuides.ts) currently does NOT include optional fields like:
 * - updatedAt, sharePost, templates, faqs, tone
 * This page supports them safely by casting guide to an extended type with optional extras.
 */

type Localized = { pt: string; en: string };

type GuideTone = "default" | "tip" | "warning" | "checklist";

type LivingGuideExtras = {
  updatedAt?: string; // ISO date string
  sharePost?: Localized;
  templates?: Array<{
    title: Localized;
    description?: Localized;
    copyText: Localized;
  }>;
  faqs?: Array<{
    q: Localized;
    a: Localized;
  }>;
  // allow tone at section-level
  sections?: Array<{
    tone?: GuideTone;
  }>;
};

type MatchType = "buyer" | "owner";
type PurchaseUse = "hpp" | "hab";
type YesNo = "yes" | "no";

// ----------------------------
// Helpers
// ----------------------------
const eur = (n: number, isPT: boolean) =>
  "€" + Math.round(n).toLocaleString(isPT ? "pt-PT" : "en-US");

const clamp0 = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

const toNumber = (v: string) => {
  const cleaned = v.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const pct = (n: number) => (n * 100).toFixed(2).replace(/\.00$/, "") + "%";

// ----------------------------
// Premium UI helpers (glass + noise + buttons)
// ----------------------------
const cls = (...a: Array<string | undefined | false | null>) =>
  a.filter(Boolean).join(" ");

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
    {/* Soft noise texture */}
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.10]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E\")",
      }}
    />
    {/* Gradient sheen */}
    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-b from-white/30 to-transparent" />
    <div className="relative">{children}</div>
  </div>
);

const ButtonBase =
  "inline-flex items-center justify-center rounded-full font-semibold transition " +
  "focus:outline-none focus:ring-2 focus:ring-cyan-400/80 focus:ring-offset-2 focus:ring-offset-white/40 " +
  "active:translate-y-[1px] active:scale-[0.99]";

const PrimaryBtn = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cls(
      ButtonBase,
      "bg-[#1F6FA6] text-white shadow-md shadow-slate-900/10",
      "hover:bg-[#195c8a] hover:-translate-y-px",
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

function toneStyles(tone?: GuideTone) {
  if (tone === "warning")
    return "border-amber-200/70 bg-amber-50/88 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-slate-900/5";
  if (tone === "tip")
    return "border-emerald-200/70 bg-emerald-50/88 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-slate-900/5";
  if (tone === "checklist")
    return "border-sky-200/70 bg-sky-50/88 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-slate-900/5";
  return "border-white/35 bg-white/86 backdrop-blur-md shadow-[0_10px_32px_-20px_rgba(2,6,23,0.50)] ring-1 ring-slate-900/5";
}

// ----------------------------
// IMT / taxes
// ----------------------------

/**
 * IMT 2026 (Continente) – Cascais = Continente.
 * Uses marginal rates + "parcela a abater" for bracketed ranges,
 * and unique rates for upper ranges.
 */
function calcIMT_2026_continente(
  price: number,
  use: PurchaseUse,
  youngU35: boolean
) {
  const p = clamp0(price);

  // Continente – HPP
  const tableHPP = [
    { upTo: 106_346, rate: 0.0, abate: 0 },
    { upTo: 145_470, rate: 0.02, abate: 2_126.92 },
    { upTo: 198_347, rate: 0.05, abate: 6_491.02 },
    { upTo: 330_539, rate: 0.07, abate: 10_457.96 },
    { upTo: 660_982, rate: 0.08, abate: 13_763.35 },
  ] as const;

  // Continente – HPP (Jovens <= 35)
  const tableHPPYoung = [
    { upTo: 330_539, rate: 0.0, abate: 0 },
    { upTo: 660_982, rate: 0.08, abate: 26_443.12 },
  ] as const;

  // Continente – Habitação (não HPP)
  const tableHab = [
    { upTo: 106_346, rate: 0.01, abate: 0 },
    { upTo: 145_470, rate: 0.02, abate: 1_063.46 },
    { upTo: 198_347, rate: 0.05, abate: 5_427.56 },
    { upTo: 330_539, rate: 0.07, abate: 9_394.5 },
    { upTo: 633_931, rate: 0.08, abate: 12_699.89 },
  ] as const;

  const bracketCalc = (rate: number, abate: number) =>
    Math.max(0, p * rate - abate);

  // Unique-rate zones:
  // > 660_982 and <= 1_150_853: 6%
  // > 1_150_853: 7.5%
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

/**
 * Stamp duty on mortgage:
 * - < 1 year: 0.04% per month (or fraction)
 * - 1 to <5 years: 0.5%
 * - >=5 years: 0.6%
 */
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

// ----------------------------
// Inputs
// ----------------------------
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

// ----------------------------
// Calculators
// ----------------------------
function RealCostsCalculator({ isPT }: { isPT: boolean }) {
  const [priceStr, setPriceStr] = useState("650000");
  const [use, setUse] = useState<PurchaseUse>("hpp");
  const [youngU35, setYoungU35] = useState<YesNo>("no");

  const [loanStr, setLoanStr] = useState("0");
  const [termStr, setTermStr] = useState("30");

  // editable typical fees
  const [notaryFeesStr, setNotaryFeesStr] = useState("1200");
  const [registryFeesStr, setRegistryFeesStr] = useState("450");
  const [lawyerFeesStr, setLawyerFeesStr] = useState("800");
  const [bankFeesStr, setBankFeesStr] = useState("600");

  // optional IMI estimate (needs VPT)
  const [vptStr, setVptStr] = useState("");
  const cascaisIMIRate = 0.0035; // 0.35%
  const cascaisHPPDiscount = 0.15; // 15% discount for HPP

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

  return (
    <GlassSurface className="mt-4 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md">
        <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
          {isPT ? "Calculadora de custo total (2026)" : "Total-cost (2026)"}
        </div>
        <div className="mt-1 text-xs text-slate-700">
          {isPT
            ? "Estimativa educativa com IMT 2026 (Continente), IS 0,8% e IS crédito. Confirme valores finais com solicitador/advogado."
            : "Educational estimate with 2026 IMT (Mainland), 0.8% stamp duty and mortgage stamp duty. Confirm final values with a solicitor/lawyer."}
        </div>
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
              title={
                use !== "hpp"
                  ? isPT
                    ? "Só se aplica a HPP"
                    : "Only applies to primary home"
                  : undefined
              }
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
                <td className="py-2 text-slate-800">
                  IMT
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    {isPT
                      ? "Tabela 2026 (Continente)"
                      : "2026 table (Mainland)"}
                  </div>
                </td>
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
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    {loan > 0
                      ? `${eur(loan, isPT)} · ${termYears || 0} ${
                          isPT ? "anos" : "yrs"
                        }`
                      : isPT
                      ? "Sem crédito"
                      : "No mortgage"}
                  </div>
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
                  {isPT ? "Banco/avaliação/comissões" : "Bank/appraisal/fees"}
                </td>
                <td className="py-2 text-right text-slate-900">
                  {eur(bankFees, isPT)}
                </td>
              </tr>

              <tr className="border-t border-white/25">
                <td className="py-2 text-slate-900 font-semibold">
                  {isPT
                    ? "Total estimado (1x, compra)"
                    : "Estimated total (one-off, purchase)"}
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    {isPT
                      ? "Não inclui IMI/ano (opcional acima)."
                      : "Excludes annual IMI (optional above)."}
                  </div>
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
            ? "Nota: IMT/IS pagos antes da escritura. Valores finais dependem de VPT, regras em vigor e custos de entidades."
            : "Note: IMT/stamp duty are paid before closing. Final amounts depend on VPT, current rules and service costs."}
        </div>
      </div>
    </GlassSurface>
  );
}

function SellingCalculator({ isPT }: { isPT: boolean }) {
  const [salePriceStr, setSalePriceStr] = useState("750000");
  const [agencyPctStr, setAgencyPctStr] = useState("5");
  const [includeVAT, setIncludeVAT] = useState<YesNo>("yes");
  const vatRate = 0.23;

  const [mortgageLeftStr, setMortgageLeftStr] = useState("0");
  const [otherCostsStr, setOtherCostsStr] = useState("800");

  const [wantCG, setWantCG] = useState<YesNo>("no");
  const [purchasePriceStr, setPurchasePriceStr] = useState("550000");
  const [improvementsStr, setImprovementsStr] = useState("0");
  const [taxRateStr, setTaxRateStr] = useState("28");

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

  return (
    <GlassSurface className="mt-4 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md">
        <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
          {isPT ? "Calculadora de venda (proprietários)" : "Selling (owners)"}
        </div>
        <div className="mt-1 text-xs text-slate-700">
          {isPT
            ? "Estimativa de custos de venda + líquido. (Mais-valias é opcional e muito aproximado.)"
            : "Estimate selling costs + net proceeds. (Capital gains is optional and very rough.)"}
        </div>
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
                  ? "Depende de residência fiscal, reinvestimento, coeficientes, etc. Isto é só uma aproximação."
                  : "Depends on tax residency, reinvestment, coefficients, etc. This is only a rough estimate."}
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
                <td className="py-2 text-slate-800">
                  {isPT ? "IVA (se aplicável)" : "VAT (if applicable)"}
                </td>
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
            ? "Nota: mais-valias depende do seu caso fiscal. Use como ordem de grandeza e valide com contabilista."
            : "Note: capital gains depends on your tax situation. Use as a rough magnitude and validate with an accountant."}
        </div>
      </div>
    </GlassSurface>
  );
}

// ----------------------------
// Page
// ----------------------------
const LivingGuidePage: React.FC = () => {
  const { language } = useLanguage();
  const isPT = language === "pt";
  const { key } = useParams();
  const navigate = useNavigate();

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const CONTACT_PHONE = "+351 930 630 880";
  const CONTACT_EMAIL = "info@allcascais.com";

  const rawGuide = useMemo(() => getLivingGuide(key), [key]);
  const guide = (rawGuide as typeof rawGuide & LivingGuideExtras) || undefined;

  const t = <T extends Localized>(obj: T) => (isPT ? obj.pt : obj.en);
  const to = (obj?: Localized, fallback = "") =>
    obj ? (isPT ? obj.pt : obj.en) : fallback;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  // Copy / Share
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const flashCopied = (msg: string) => {
    setCopiedMsg(msg);
    setTimeout(() => setCopiedMsg(null), 1800);
  };

  const shareTitle = guide
    ? `${isPT ? "Guia:" : "Guide:"} ${t(guide.title)} — AllCascais`
    : "AllCascais";

  const copyToClipboard = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(okMsg);
    } catch {
      window.prompt(isPT ? "Copie:" : "Copy:", text);
    }
  };

  // Match modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("buyer");

  const [matchName, setMatchName] = useState("");
  const [matchEmail, setMatchEmail] = useState("");
  const [matchPhone, setMatchPhone] = useState("");
  const [matchNotes, setMatchNotes] = useState("");

  // buyer quick-selects
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

  // owner quick-selects
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
Must-haves: ${must}`;
    }
    return `Match type: Owner
Goal: ${ownerGoal || "—"}
Condition: ${ownerCondition || "—"}
Timeline: ${ownerTimeline || "—"}`;
  };

  const submitMatch = async () => {
    // basic validation
    if (!matchName.trim() || !matchEmail.trim()) {
      alert(isPT ? "Preencha nome e email." : "Please add name and email.");
      return;
    }

    const meta =
      matchType === "buyer"
        ? {
            timing: buyerTiming || null,
            propertyType: buyerType || null,
            mustHaves: buyerMustHaves || [],
          }
        : {
            goal: ownerGoal || null,
            condition: ownerCondition || null,
            timeline: ownerTimeline || null,
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

      window.location.href = `mailto:info@allcascais.com?subject=${subject}&body=${body}`;
    };

    try {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) throw error;

      setSubmitStatus("success");

      // clear fields
      setMatchName("");
      setMatchEmail("");
      setMatchPhone("");
      setMatchNotes("");
      setBuyerTiming("");
      setBuyerType("");
      setBuyerMustHaves([]);
      setOwnerGoal("");
      setOwnerCondition("");
      setOwnerTimeline("");
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

  // Example buying table
  const renderBuyingExample = () => {
    const examplePrice = 500000;
    const stampDutyPurchase = Math.round(examplePrice * 0.008);

    return (
      <GlassSurface className="mt-4 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-white/25 bg-white/40 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.14em]">
            {isPT ? "Exemplo rápido (estimativa)" : "Quick example (estimate)"}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            {isPT
              ? "Serve para entender a lógica do custo total. Confirme valores finais com solicitador/advogado."
              : "This helps you understand total-cost logic. Confirm final amounts with a solicitor/lawyer."}
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
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      {isPT
                        ? "Depende de escalões, tipo de uso e regras em vigor."
                        : "Depends on bands, intended use, and current rules."}
                    </div>
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
              ? "Dica: compare imóveis por custo total no 1º ano (não só pelo preço)."
              : "Tip: compare homes by total first-year cost (not only price)."}
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

  // CTA logic
  const primaryCta =
    guide.ctas.find((c) => c.kind === "getMatched") ??
    guide.ctas.find((c) => c.kind === "browseHomes") ??
    guide.ctas[0];

  const secondaryCta =
    guide.ctas.find((c) => c.kind === "browseHomes" && c !== primaryCta) ??
    guide.ctas.find((c) => c.kind === "viewServices") ??
    guide.ctas.find((c) => c !== primaryCta);

  return (
    <div className="min-h-screen py-3">
      {/* Veil global por cima da imagem de fundo */}
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-white/35 via-white/15 to-white/30 backdrop-blur-[2px]" />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN */}
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-slate-950"
              >
                ← {isPT ? "Voltar" : "Back"}
              </button>

              <GlassSurface className="mt-4 overflow-hidden">
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

                    <div className="mt-4 flex flex-wrap items-center gap-2">
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

                    {/* Share controls */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <GhostBtn
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            pageUrl,
                            isPT ? "✅ Link copiado" : "✅ Link copied"
                          )
                        }
                      >
                        {isPT ? "Copiar link" : "Copy link"}
                      </GhostBtn>

                      {"share" in navigator ? (
                        <GhostBtn
                          type="button"
                          onClick={async () => {
                            try {
                              // @ts-ignore
                              await navigator.share({
                                title: shareTitle,
                                text: shareTitle,
                                url: pageUrl,
                              });
                            } catch {}
                          }}
                        >
                          {isPT ? "Partilhar" : "Share"}
                        </GhostBtn>
                      ) : null}

                      {guide.sharePost ? (
                        <SuccessBtn
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              t(guide.sharePost!),
                              isPT ? "✅ Post copiado" : "✅ Post copied"
                            )
                          }
                          title={
                            isPT
                              ? "Copiar texto pronto para Facebook/WhatsApp"
                              : "Copy a ready-to-post text for Facebook/WhatsApp"
                          }
                        >
                          {isPT ? "Copiar post" : "Copy post"}
                        </SuccessBtn>
                      ) : null}
                    </div>

                    {copiedMsg ? (
                      <div className="mt-3 text-[11px] text-emerald-700 font-semibold">
                        {copiedMsg}
                      </div>
                    ) : null}
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {guide.sections.map((s: any, idx: number) => (
                <section
                  key={idx}
                  className={cls(
                    "rounded-3xl border p-5 sm:p-7",
                    toneStyles(s.tone)
                  )}
                >
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
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
                          <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#1F6FA6]" />
                          <span>{t(b)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Inject calculators / extras under the first section */}
                  {idx === 0 ? renderGuideExtras() : null}
                </section>
              ))}
            </div>

            {/* Templates */}
            {guide.templates?.length ? (
              <GlassSurface className="mt-6 p-5 sm:p-7">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Templates (copiar/colar)" : "Templates (copy/paste)"}
                </div>
                <div className="mt-4 space-y-3">
                  {guide.templates.map((tpl, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                          onClick={() =>
                            copyToClipboard(
                              t(tpl.copyText),
                              isPT ? "✅ Copiado" : "✅ Copied"
                            )
                          }
                          className="shrink-0"
                        >
                          {isPT ? "Copiar" : "Copy"}
                        </GhostBtn>
                      </div>
                      <div className="mt-3 text-xs text-slate-800 whitespace-pre-line">
                        {t(tpl.copyText)}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            ) : null}

            {/* FAQs */}
            {guide.faqs?.length ? (
              <GlassSurface className="mt-6 p-5 sm:p-7">
                <div className="text-sm font-semibold text-slate-900">
                  {isPT ? "Perguntas frequentes" : "FAQs"}
                </div>
                <div className="mt-4 space-y-2">
                  {guide.faqs.map((f, idx) => (
                    <details
                      key={idx}
                      className="rounded-2xl border border-white/35 bg-white/55 backdrop-blur-md px-4 py-3 shadow-sm"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold text-slate-900">
                            {t(f.q)}
                          </div>
                          <span className="text-slate-600">⌄</span>
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

            {/* Bottom CTA card */}
            <GlassSurface className="mt-6 p-5 sm:p-7">
              <div className="text-sm font-semibold text-slate-900">
                {isPT ? "Próximo passo" : "Next step"}
              </div>
              <div className="mt-1 text-xs text-slate-700">
                {isPT
                  ? "Se quiser, ajudamos a escolher opções e a planear o próximo passo."
                  : "If you want, we’ll help you shortlist options and plan your next step."}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {guide.ctas.map((c: any, i: number) => (
                  <React.Fragment key={i}>
                    {c.kind === "browseHomes" ? (
                      <PrimaryBtn
                        type="button"
                        onClick={() => handleCta(c.kind)}
                      >
                        {t(c.label)}
                      </PrimaryBtn>
                    ) : c.kind === "getMatched" ? (
                      <SuccessBtn
                        type="button"
                        onClick={() => handleCta(c.kind)}
                      >
                        {t(c.label)}
                      </SuccessBtn>
                    ) : (
                      <GhostBtn type="button" onClick={() => handleCta(c.kind)}>
                        {t(c.label)}
                      </GhostBtn>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </GlassSurface>

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

                  {secondaryCta ? (
                    <GhostBtn
                      type="button"
                      onClick={() => handleCta(secondaryCta.kind)}
                      className="text-sm py-2.5"
                    >
                      {t(secondaryCta.label)}
                    </GhostBtn>
                  ) : null}
                </div>
              </GlassSurface>

              <GlassSurface className="p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {isPT ? "Mais guias" : "More guides"}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {LIVING_GUIDES.filter((g: any) => g.key !== guide.key)
                    .slice(0, 6)
                    .map((g: any) => (
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
              </GlassSurface>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE STICKY CTA BAR */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-50 px-3 pb-3">
        <div className="rounded-3xl border border-white/35 bg-white/75 backdrop-blur-xl shadow-lg px-3 py-3 ring-1 ring-slate-900/10">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-700">
                {isPT ? "Próximo passo" : "Next step"}
              </div>
              <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                {t(guide.title)}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {secondaryCta ? (
                <GhostBtn
                  type="button"
                  onClick={() => handleCta(secondaryCta.kind)}
                >
                  {isPT ? "Ver" : "View"}
                </GhostBtn>
              ) : null}

              {primaryCta ? (
                <SuccessBtn
                  type="button"
                  onClick={() => handleCta(primaryCta.kind)}
                >
                  {isPT ? "Quero ajuda" : "Get help"}
                </SuccessBtn>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* MATCH MODAL (buyer/owner) */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white/88 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/35 ring-1 ring-slate-900/10"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/25 bg-white/45 backdrop-blur-lg">
              <div>
                <div className="text-[11px] font-semibold text-[#1F6FA6]">
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
                      ? "Quer destacar o seu imóvel em Cascais?"
                      : "Want to feature your home in Cascais?"
                    : isPT
                    ? "Diga-nos o que procura (resposta em 24h)"
                    : "Tell us what you need (reply in 24h)"}
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
                      ? "Obrigado! Vamos responder em 24h. Se preferir, pode falar connosco já:"
                      : "Thanks! We’ll reply within 24h. If you prefer, you can reach us directly:"}
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <a
                      href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                      className="block rounded-2xl border border-white/35 bg-white/60 backdrop-blur-md px-4 py-3 hover:bg-white/75 transition shadow-sm"
                    >
                      <div className="text-[11px] text-slate-700">
                        {isPT ? "Telefone" : "Phone"}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {CONTACT_PHONE}
                      </div>
                    </a>

                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="block rounded-2xl border border-white/35 bg-white/60 backdrop-blur-md px-4 py-3 hover:bg-white/75 transition shadow-sm"
                    >
                      <div className="text-[11px] text-slate-700">Email</div>
                      <div className="font-semibold text-slate-900">
                        {CONTACT_EMAIL}
                      </div>
                    </a>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                    <PrimaryBtn
                      type="button"
                      onClick={() => navigate("/real-estate")}
                    >
                      {isPT ? "Continuar no site" : "Continue on website"}
                    </PrimaryBtn>

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
                          ? "border-[#1F6FA6]/60 bg-blue-50/85 text-[#1F6FA6] shadow-sm"
                          : "border-white/35 bg-white/55 text-slate-800 hover:bg-white/70"
                      )}
                    >
                      {isPT ? "Sou proprietário" : "I'm an owner"}
                    </button>
                  </div>

                  {/* Quick selectors */}
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

                  <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="text-[11px] text-slate-700">
                      {isPT
                        ? "Ao enviar, o pedido é enviado automaticamente. Se falhar, abrimos o seu email como alternativa."
                        : "Submitting sends your request automatically. If it fails, we’ll open your email as a fallback."}
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
