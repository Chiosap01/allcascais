import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Lock,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import { useLanguage } from "../../layouts/MainLayout";

type Lang = "pt" | "en";

type CalloutTone = "info" | "warning" | "privacy";
type Callout = {
  tone: CalloutTone;
  title: { pt: string; en: string };
  body: { pt: React.ReactNode; en: React.ReactNode };
};

type Section = {
  id: string;
  title: { pt: string; en: string };
  icon?: React.ReactNode;
  intro?: { pt: React.ReactNode; en: React.ReactNode };
  bullets?: { pt: React.ReactNode[]; en: React.ReactNode[] };
  callouts?: Callout[];
};

const toneStyles: Record<
  CalloutTone,
  { wrap: string; iconWrap: string; icon: React.ReactNode }
> = {
  info: {
    wrap: "border-slate-200 bg-slate-50/70",
    iconWrap: "bg-slate-900/5 text-slate-700",
    icon: <Info className="h-4 w-4" />,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50/70",
    iconWrap: "bg-amber-500/10 text-amber-700",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  privacy: {
    wrap: "border-indigo-200 bg-indigo-50/70",
    iconWrap: "bg-indigo-500/10 text-indigo-700",
    icon: <Lock className="h-4 w-4" />,
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const CalloutCard: React.FC<{ callout: Callout; lang: Lang }> = ({
  callout,
  lang,
}) => {
  const styles = toneStyles[callout.tone];
  return (
    <div className={cx("rounded-2xl border p-4", styles.wrap)}>
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl",
            styles.iconWrap
          )}
        >
          {styles.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            {callout.title[lang]}
          </div>
          <div className="mt-1 text-sm leading-6 text-slate-700">
            {callout.body[lang]}
          </div>
        </div>
      </div>
    </div>
  );
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
      aria-label={section.title[lang]}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700">
            {section.icon ?? <FileText className="h-5 w-5" />}
          </div>
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
        </div>

        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
          {open ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {section.intro && (
            <div className="text-sm leading-6 text-slate-700">
              {section.intro[lang]}
            </div>
          )}

          {section.bullets && (
            <ul className="space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {section.bullets[lang].map((b, idx) => (
                <li key={idx} className="list-disc">
                  {b}
                </li>
              ))}
            </ul>
          )}

          {section.callouts?.length ? (
            <div className="space-y-3">
              {section.callouts.map((c, idx) => (
                <CalloutCard key={idx} callout={c} lang={lang} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

const PrivacyPolicy: React.FC = () => {
  const { language } = useLanguage();
  const lang: Lang = language === "pt" ? "pt" : "en";

  // Keep this aligned with your production policy versioning.
  const lastUpdated = { pt: "08/01/2026", en: "2026-01-08" };

  const sections: Section[] = useMemo(
    () => [
      {
        id: "who",
        title: { pt: "1. Quem somos", en: "1. Who we are" },
        icon: <Users className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              O website <strong>AllCascais</strong> é um projeto detido e
              explorado por <strong>Chiosa &amp; Chiosa, Lda</strong>, com
              morada em{" "}
              <strong>
                Sala B, 1.º andar esquerdo, Avenida Costa Pinto, n.º 60, União
                das Freguesias de Cascais e Estoril, Concelho de Cascais,
                Portugal.
              </strong>{" "}
              (“nós”, “AllCascais”).
            </>
          ),
          en: (
            <>
              The <strong>AllCascais</strong> website is owned and operated by{" "}
              <strong>Chiosa &amp; Chiosa, Lda</strong>, located at{" "}
              <strong>
                Sala B, 1.º andar esquerdo, Avenida Costa Pinto, n.º 60, União
                das Freguesias de Cascais e Estoril, Concelho de Cascais,
                Portugal.
              </strong>{" "}
              (“we”, “AllCascais”).
            </>
          ),
        },
        callouts: [
          {
            tone: "privacy",
            title: { pt: "Contacto de privacidade", en: "Privacy contact" },
            body: {
              pt: (
                <>
                  Email: <strong>info@allcascais.com</strong>
                </>
              ),
              en: (
                <>
                  Email: <strong>info@allcascais.com</strong>
                </>
              ),
            },
          },
        ],
      },

      {
        id: "collect",
        title: { pt: "2. Que dados recolhemos", en: "2. What data we collect" },
        icon: <FileText className="h-5 w-5" />,
        bullets: {
          pt: [
            <>Dados de conta: nome, email e informação de perfil.</>,
            <>
              Conteúdo submetido: anúncios/listagens, descrições, fotos e
              contactos indicados pelo utilizador.
            </>,
            <>
              Dados técnicos: IP (em certas situações), logs de segurança, tipo
              de dispositivo/navegador.
            </>,
            <>
              Cookies e analytics (se ativados) — ver{" "}
              <strong>Política de Cookies</strong>.
            </>,
          ],
          en: [
            <>Account data: name, email and profile information.</>,
            <>
              Submitted content: listings, descriptions, photos and contact
              details provided by the user.
            </>,
            <>
              Technical data: IP (in some cases), security logs, device/browser
              type.
            </>,
            <>
              Cookies and analytics (if enabled) — see the{" "}
              <strong>Cookie Policy</strong>.
            </>,
          ],
        },
        callouts: [
          {
            tone: "warning",
            title: { pt: "Evite dados sensíveis", en: "Avoid sensitive data" },
            body: {
              pt: (
                <>
                  Não publique em áreas públicas dados sensíveis (ex.:
                  documentos oficiais, dados financeiros, informação médica).
                </>
              ),
              en: (
                <>
                  Do not post sensitive data in public areas (e.g., official
                  documents, financial data, medical information).
                </>
              ),
            },
          },
        ],
      },

      {
        id: "use",
        title: {
          pt: "3. Para que usamos os dados",
          en: "3. Why we use your data",
        },
        icon: <Shield className="h-5 w-5" />,
        bullets: {
          pt: [
            <>Criar e gerir contas.</>,
            <>Publicar e moderar conteúdos/listagens.</>,
            <>Segurança, prevenção de abuso e fraude.</>,
            <>
              Comunicações de serviço (ex.: emails de confirmação/recuperação de
              password).
            </>,
            <>
              Melhorar a plataforma e a experiência do utilizador (quando
              aplicável).
            </>,
          ],
          en: [
            <>Create and manage accounts.</>,
            <>Publish and moderate listings/content.</>,
            <>Security, abuse and fraud prevention.</>,
            <>
              Service communications (e.g., confirmation/password reset emails).
            </>,
            <>Improve the platform and user experience (where applicable).</>,
          ],
        },
        callouts: [
          {
            tone: "info",
            title: { pt: "Conteúdo público", en: "Public content" },
            body: {
              pt: (
                <>
                  Se publicar anúncios/listagens, parte do conteúdo (ex.:
                  título, descrição, fotos e contactos escolhidos) pode ser
                  visível publicamente.
                </>
              ),
              en: (
                <>
                  If you publish listings, some content (e.g., title,
                  description, photos, and chosen contact details) may be
                  publicly visible.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "legal",
        title: { pt: "4. Base legal", en: "4. Legal basis" },
        icon: <Lock className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Tratamos dados com base na execução do contrato (criação/gestão de
              conta), interesse legítimo (segurança e melhoria do serviço),
              consentimento (quando aplicável, ex.: cookies opcionais/marketing)
              e cumprimento de obrigações legais.
            </>
          ),
          en: (
            <>
              We process data based on contract performance (account
              management), legitimate interests (security and service
              improvement), consent (when applicable, e.g., optional
              cookies/marketing), and legal obligations.
            </>
          ),
        },
      },

      {
        id: "sharing",
        title: { pt: "5. Partilha de dados", en: "5. Data sharing" },
        icon: <Users className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Podemos partilhar dados com fornecedores necessários para operar o
              serviço (ex.: alojamento, email, autenticação, proteção contra
              abuso). <strong>Não vendemos</strong> os seus dados.
            </>
          ),
          en: (
            <>
              We may share data with providers needed to operate the service
              (e.g., hosting, email, authentication, abuse protection). We{" "}
              <strong>do not sell</strong> your data.
            </>
          ),
        },
        callouts: [
          {
            tone: "info",
            title: { pt: "Prestadores de serviços", en: "Service providers" },
            body: {
              pt: (
                <>
                  Estes fornecedores tratam dados apenas conforme as nossas
                  instruções e para finalidades de prestação do serviço.
                </>
              ),
              en: (
                <>
                  These providers process data only under our instructions and
                  for service delivery purposes.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "retention",
        title: { pt: "6. Conservação", en: "6. Retention" },
        icon: <FileText className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Conservamos dados apenas pelo tempo necessário para as finalidades
              descritas nesta política, ou para cumprir obrigações legais.
              Quando possível, apagamos ou anonimizado os dados após deixarem de
              ser necessários.
            </>
          ),
          en: (
            <>
              We retain data only as long as needed for the purposes described
              in this policy, or to comply with legal obligations. Where
              possible, we delete or anonymize data when it is no longer needed.
            </>
          ),
        },
      },

      {
        id: "rights",
        title: { pt: "7. Os seus direitos", en: "7. Your rights" },
        icon: <Lock className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Pode solicitar acesso, retificação, apagamento, limitação e
              portabilidade dos seus dados, bem como opor-se a certos
              tratamentos. Para exercer os seus direitos, contacte:{" "}
              <strong>info@allcascais.com</strong>
            </>
          ),
          en: (
            <>
              You may request access, rectification, deletion, restriction and
              portability of your data, and object to certain processing. To
              exercise your rights, contact:{" "}
              <strong>info@allcascais.com</strong>
            </>
          ),
        },
        callouts: [
          {
            tone: "info",
            title: { pt: "Resposta a pedidos", en: "Requests handling" },
            body: {
              pt: (
                <>
                  Podemos solicitar informação adicional para confirmar a sua
                  identidade antes de processar o pedido.
                </>
              ),
              en: (
                <>
                  We may request additional information to verify your identity
                  before processing your request.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "security",
        title: { pt: "8. Segurança", en: "8. Security" },
        icon: <Shield className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Implementamos medidas técnicas e organizativas razoáveis para
              proteger os dados. No entanto, nenhum sistema é 100% seguro.
              Recomendamos que utilize uma password forte e não a partilhe.
            </>
          ),
          en: (
            <>
              We implement reasonable technical and organizational measures to
              protect data. However, no system is 100% secure. Use a strong
              password and do not share it.
            </>
          ),
        },
      },

      {
        id: "changes",
        title: {
          pt: "9. Alterações a esta política",
          en: "9. Changes to this policy",
        },
        icon: <Info className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Podemos atualizar esta política. A data de atualização será sempre
              indicada no topo desta página.
            </>
          ),
          en: (
            <>
              We may update this policy. The update date will always be shown at
              the top of this page.
            </>
          ),
        },
      },

      {
        id: "contact",
        title: { pt: "10. Contacto", en: "10. Contact" },
        icon: <Mail className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Para questões sobre privacidade:
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  info@allcascais.com
                </div>
              </div>
            </>
          ),
          en: (
            <>
              For privacy questions:
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  info@allcascais.com
                </div>
              </div>
            </>
          ),
        },
      },
    ],
    []
  );

  const toc = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        title: s.title[lang],
      })),
    [sections, lang]
  );

  const [tocOpenMobile, setTocOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <FileText className="h-3.5 w-3.5" />
                {lang === "pt" ? "Documentação Legal" : "Legal documentation"}
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {lang === "pt" ? "Política de Privacidade" : "Privacy Policy"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {lang === "pt"
                  ? "Explica que dados recolhemos, porque os usamos e quais os seus direitos."
                  : "Explains what data we collect, why we use it, and your rights."}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                {lang === "pt" ? "Última atualização:" : "Last updated:"}{" "}
                <span className="font-medium text-slate-700">
                  {lastUpdated[lang]}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4" />
                {lang === "pt" ? "Imprimir" : "Print"}
              </button>

              <div className="text-xs text-slate-500">
                {lang === "pt"
                  ? "Dica: guarde uma cópia em PDF para referência."
                  : "Tip: save a PDF copy for reference."}
              </div>
            </div>
          </div>

          {/* Mobile TOC */}
          <div className="mt-6 md:hidden">
            <button
              type="button"
              onClick={() => setTocOpenMobile((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">
                {lang === "pt" ? "Índice" : "On this page"}
              </span>
              {tocOpenMobile ? (
                <ChevronUp className="h-5 w-5 text-slate-700" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-700" />
              )}
            </button>

            {tocOpenMobile && (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                <ul className="space-y-1">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setTocOpenMobile(false)}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
        {/* Desktop sticky TOC */}
        <aside className="hidden md:block">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-slate-700" />
              {lang === "pt" ? "Índice" : "On this page"}
            </div>
            <div className="mt-3 space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.title}
                </a>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-slate-700" />
                <div>
                  <div className="font-medium text-slate-800">
                    {lang === "pt" ? "Leitura rápida" : "Quick read"}
                  </div>
                  <div className="mt-1">
                    {lang === "pt"
                      ? "Use o índice e as secções expansíveis para navegar rapidamente."
                      : "Use the index and collapsible sections to navigate quickly."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          {/* Top summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {lang === "pt"
                    ? "Resumo (não substitui o texto completo)"
                    : "Summary (doesn’t replace full text)"}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  <li>
                    {lang === "pt"
                      ? "Recolhemos dados de conta, conteúdos submetidos e alguns dados técnicos."
                      : "We collect account data, user-submitted content, and some technical data."}
                  </li>
                  <li>
                    {lang === "pt"
                      ? "Usamos dados para gerir contas, publicar/moderar conteúdos e segurança."
                      : "We use data to manage accounts, publish/moderate content, and for security."}
                  </li>
                  <li>
                    {lang === "pt"
                      ? "Não vendemos os seus dados."
                      : "We do not sell your data."}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((s, idx) => (
              <SectionCard
                key={s.id}
                section={s}
                lang={lang}
                defaultOpen={idx < 2}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {lang === "pt" ? "Dúvidas?" : "Questions?"}
                </div>
                <div className="mt-1 leading-6">
                  {lang === "pt"
                    ? "Se precisar de esclarecimentos sobre privacidade, contacte-nos por email."
                    : "If you need privacy clarification, contact us by email."}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
