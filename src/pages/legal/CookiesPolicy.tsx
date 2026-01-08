import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Lock, Mail } from "lucide-react";
import { useLanguage } from "../../layouts/MainLayout";

type Lang = "pt" | "en";

type Section = {
  id: string;
  title: { pt: string; en: string };
  intro?: { pt: React.ReactNode; en: React.ReactNode };
  bullets?: { pt: React.ReactNode[]; en: React.ReactNode[] };
};

const SectionCard: React.FC<{
  section: Section;
  lang: Lang;
  defaultOpen?: boolean;
}> = ({ section, lang, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={section.id}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {section.title[lang]}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {lang === "pt"
              ? "Clique para expandir/fechar esta secção."
              : "Click to expand/collapse this section."}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
          {open ? (
            <ChevronUp className="h-5 w-5 text-slate-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-700" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          {section.intro && <div>{section.intro[lang]}</div>}

          {section.bullets && (
            <ul className="list-disc space-y-2 pl-5">
              {section.bullets[lang].map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

const CookiesPolicy: React.FC = () => {
  const { language } = useLanguage();
  const lang: Lang = language === "pt" ? "pt" : "en";

  const lastUpdated = { pt: "08/01/2026", en: "2026-01-08" };

  const sections: Section[] = useMemo(
    () => [
      {
        id: "what",
        title: { pt: "1. O que são cookies", en: "1. What cookies are" },
        intro: {
          pt: (
            <>
              Cookies são pequenos ficheiros de texto armazenados no seu
              dispositivo quando visita um website. São utilizados para garantir
              o funcionamento básico do site e melhorar a experiência do
              utilizador.
            </>
          ),
          en: (
            <>
              Cookies are small text files stored on your device when you visit
              a website. They are used to ensure basic site functionality and
              improve user experience.
            </>
          ),
        },
      },
      {
        id: "use",
        title: { pt: "2. Que cookies usamos", en: "2. Cookies we use" },
        bullets: {
          pt: [
            <>
              <strong>Cookies essenciais:</strong> necessários para
              autenticação, segurança e funcionamento da plataforma.
            </>,
            <>
              <strong>Cookies de preferências:</strong> por exemplo, guardar o
              idioma selecionado (quando aplicável).
            </>,
            <>
              <strong>Não utilizamos</strong> cookies de marketing, publicidade
              ou analytics.
            </>,
          ],
          en: [
            <>
              <strong>Essential cookies:</strong> required for authentication,
              security, and platform functionality.
            </>,
            <>
              <strong>Preference cookies:</strong> for example, storing selected
              language (when applicable).
            </>,
            <>
              We <strong>do not use</strong> marketing, advertising, or
              analytics cookies.
            </>,
          ],
        },
      },
      {
        id: "consent",
        title: {
          pt: "3. Consentimento",
          en: "3. Consent",
        },
        intro: {
          pt: (
            <>
              Como utilizamos apenas cookies estritamente necessários, não é
              exigido consentimento prévio através de banner, de acordo com a
              legislação aplicável.
            </>
          ),
          en: (
            <>
              Since we only use strictly necessary cookies, prior consent via a
              cookie banner is not required under applicable law.
            </>
          ),
        },
      },
      {
        id: "manage",
        title: {
          pt: "4. Como gerir cookies",
          en: "4. How to manage cookies",
        },
        intro: {
          pt: (
            <>
              Pode apagar ou bloquear cookies através das definições do seu
              navegador. Note que a desativação de cookies essenciais pode
              afetar o funcionamento do site.
            </>
          ),
          en: (
            <>
              You can delete or block cookies through your browser settings.
              Please note that disabling essential cookies may affect site
              functionality.
            </>
          ),
        },
      },
      {
        id: "contact",
        title: { pt: "5. Contacto", en: "5. Contact" },
        intro: {
          pt: (
            <>
              Para questões relacionadas com cookies ou privacidade:
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                <span className="font-semibold">Email:</span>{" "}
                info@allcascais.com
              </div>
            </>
          ),
          en: (
            <>
              For questions related to cookies or privacy:
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                <span className="font-semibold">Email:</span>{" "}
                info@allcascais.com
              </div>
            </>
          ),
        },
      },
    ],
    []
  );

  const toc = sections.map((s) => ({
    id: s.id,
    title: s.title[lang],
  }));

  const [tocOpenMobile, setTocOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              <FileText className="h-3.5 w-3.5" />
              {lang === "pt" ? "Documentação Legal" : "Legal documentation"}
            </div>

            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              {lang === "pt" ? "Política de Cookies" : "Cookie Policy"}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {lang === "pt"
                ? "Explica que cookies usamos e como funcionam."
                : "Explains which cookies we use and how they work."}
            </p>

            <p className="mt-3 text-xs text-slate-500">
              {lang === "pt" ? "Última atualização:" : "Last updated:"}{" "}
              <span className="font-medium text-slate-700">
                {lastUpdated[lang]}
              </span>
            </p>
          </div>

          {/* Mobile TOC */}
          <div className="mt-6 md:hidden">
            <button
              type="button"
              onClick={() => setTocOpenMobile((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-semibold">
                {lang === "pt" ? "Índice" : "On this page"}
              </span>
              {tocOpenMobile ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {tocOpenMobile && (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setTocOpenMobile(false)}
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
        {/* Desktop TOC */}
        <aside className="hidden md:block">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">
              {lang === "pt" ? "Índice" : "On this page"}
            </div>
            <div className="mt-3 space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5">
                <Lock className="h-5 w-5 text-slate-700" />
              </div>
              <ul className="list-disc pl-5 text-sm leading-6 text-slate-700">
                <li>
                  {lang === "pt"
                    ? "Utilizamos apenas cookies essenciais."
                    : "We use only essential cookies."}
                </li>
                <li>
                  {lang === "pt"
                    ? "Não utilizamos cookies de tracking, marketing ou analytics."
                    : "We do not use tracking, marketing, or analytics cookies."}
                </li>
                <li>
                  {lang === "pt"
                    ? "Não é necessário consentimento por banner."
                    : "No cookie banner consent is required."}
                </li>
              </ul>
            </div>
          </div>

          {/* Sections */}
          {sections.map((s, i) => (
            <SectionCard
              key={s.id}
              section={s}
              lang={lang}
              defaultOpen={i < 2}
            />
          ))}

          {/* Footer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-700" />
              <div>
                {lang === "pt"
                  ? "Se tiver dúvidas sobre cookies, contacte-nos."
                  : "If you have questions about cookies, contact us."}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CookiesPolicy;
