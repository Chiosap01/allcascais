import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Gavel,
  Info,
  Lock,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import { useLanguage } from "../../layouts/MainLayout";

type Lang = "pt" | "en";

type CalloutTone = "info" | "warning" | "success" | "privacy";
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
  success: {
    wrap: "border-emerald-200 bg-emerald-50/70",
    iconWrap: "bg-emerald-500/10 text-emerald-700",
    icon: <BadgeCheck className="h-4 w-4" />,
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

const Terms: React.FC = () => {
  const { language } = useLanguage();
  const lang: Lang = language === "pt" ? "pt" : "en";

  // Keep this date aligned with your production Terms content/versioning.
  const lastUpdated = { pt: "08/01/2026", en: "2026-01-08" };

  const sections: Section[] = useMemo(
    () => [
      {
        id: "platform",
        title: { pt: "1. O que é a plataforma", en: "1. What the platform is" },
        icon: <BookOpen className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              O <strong>AllCascais</strong> é uma plataforma digital de âmbito
              comunitário, orientada para <strong>Cascais</strong>, que facilita
              a divulgação de serviços, anúncios e informação local.
            </>
          ),
          en: (
            <>
              <strong>AllCascais</strong> is a community-oriented digital
              platform focused on <strong>Cascais</strong>, helping users
              discover local services, listings, and community information.
            </>
          ),
        },
        bullets: {
          pt: [
            <>Diretório de serviços e negócios locais.</>,
            <>
              Anúncios e listagens (ex.: serviços, oportunidades, imóveis,
              eventos).
            </>,
            <>Informação local e comunicações relevantes para a comunidade.</>,
          ],
          en: [
            <>A directory of local services and businesses.</>,
            <>Listings (e.g., services, opportunities, real estate, events).</>,
            <>Local information and community-relevant announcements.</>,
          ],
        },
        callouts: [
          {
            tone: "info",
            title: {
              pt: "Sem autoridade pública",
              en: "No public authority role",
            },
            body: {
              pt: (
                <>
                  A plataforma <strong>não</strong> atua como autoridade
                  pública, associação de moradores/condomínio, entidade
                  reguladora ou prestador direto dos serviços anunciados.
                </>
              ),
              en: (
                <>
                  The platform <strong>does not</strong> act as a public
                  authority, homeowners/condominium association, regulatory
                  body, or the direct provider of advertised services.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "identification",
        title: {
          pt: "2. Identificação do operador",
          en: "2. Operator identification",
        },
        icon: <Shield className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              A plataforma é operada por{" "}
              <strong>Chiosa &amp; Chiosa, Lda</strong>, com sede em{" "}
              <strong>
                Sala B, 1.º andar esquerdo, Avenida Costa Pinto, n.º 60, União
                das Freguesias de Cascais e Estoril, Concelho de Cascais,
                Portugal
              </strong>
              .
            </>
          ),
          en: (
            <>
              The platform is operated by{" "}
              <strong>Chiosa &amp; Chiosa, Lda</strong>, located at{" "}
              <strong>
                Sala B, 1.º andar esquerdo, Avenida Costa Pinto, n.º 60, União
                das Freguesias de Cascais e Estoril, Concelho de Cascais,
                Portugal
              </strong>
              .
            </>
          ),
        },
      },

      {
        id: "accounts",
        title: {
          pt: "3. Contas, perfis e responsabilidades",
          en: "3. Accounts, profiles & responsibilities",
        },
        icon: <Users className="h-5 w-5" />,
        intro: {
          pt: <>Ao criar uma conta ou publicar conteúdo, concorda em:</>,
          en: <>By creating an account or posting content, you agree to:</>,
        },
        bullets: {
          pt: [
            <>Fornecer informação verdadeira, atual e completa.</>,
            <>Manter a sua conta e credenciais seguras.</>,
            <>
              Ser responsável por todo o conteúdo que publica (texto, fotos,
              preços, disponibilidade, contactos).
            </>,
            <>
              Não publicar conteúdo ilegal, enganoso, ofensivo ou que viole
              direitos de terceiros.
            </>,
          ],
          en: [
            <>Provide accurate, current, and complete information.</>,
            <>Keep your account and credentials secure.</>,
            <>
              Be responsible for all content you publish (text, photos, pricing,
              availability, contact info).
            </>,
            <>
              Not post illegal, misleading, abusive content, or content that
              violates third-party rights.
            </>,
          ],
        },
        callouts: [
          {
            tone: "info",
            title: { pt: "Visibilidade pública", en: "Public visibility" },
            body: {
              pt: (
                <>
                  Perfis, anúncios e certas informações podem ser{" "}
                  <strong>publicamente visíveis</strong>, dependendo da
                  funcionalidade.
                </>
              ),
              en: (
                <>
                  Profiles, listings, and certain information may be{" "}
                  <strong>publicly visible</strong>, depending on the feature.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "moderation",
        title: {
          pt: "4. Moderação e remoção de conteúdo",
          en: "4. Moderation & content removal",
        },
        icon: <Gavel className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Para manter a segurança e qualidade da plataforma, podemos moderar
              conteúdos e tomar medidas quando necessário.
            </>
          ),
          en: (
            <>
              To keep the platform safe and useful, we may moderate content and
              take action when needed.
            </>
          ),
        },
        bullets: {
          pt: [
            <>Remover, ocultar ou editar conteúdos que violem estes termos.</>,
            <>
              Suspender ou encerrar contas em caso de abuso, fraude ou violação
              repetida.
            </>,
            <>
              Aplicar medidas para proteger utilizadores e a integridade do
              serviço.
            </>,
          ],
          en: [
            <>Remove, hide, or edit content that violates these terms.</>,
            <>
              Suspend or terminate accounts for abuse, fraud, or repeated
              violations.
            </>,
            <>
              Apply measures to protect users and the integrity of the service.
            </>,
          ],
        },
        callouts: [
          {
            tone: "warning",
            title: {
              pt: "Sem obrigação de aviso prévio",
              en: "No prior notice required",
            },
            body: {
              pt: (
                <>
                  Em casos urgentes (ex.: fraude, risco, abuso), podemos atuar
                  sem aviso prévio para prevenir danos.
                </>
              ),
              en: (
                <>
                  In urgent cases (e.g., fraud, risk, abuse), we may act without
                  prior notice to prevent harm.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "communications",
        title: { pt: "5. Comunicações", en: "5. Communications" },
        icon: <Mail className="h-5 w-5" />,
        intro: {
          pt: <>Podemos enviar comunicações relacionadas com a plataforma:</>,
          en: <>We may send platform-related communications:</>,
        },
        bullets: {
          pt: [
            <>
              Emails transacionais (necessários): segurança, suporte,
              confirmações e alterações relevantes.
            </>,
            <>Notificações na plataforma (quando aplicável).</>,
            <>
              Comunicações opcionais (marketing/novidades) apenas quando
              aplicável e de acordo com preferências/consentimento.
            </>,
          ],
          en: [
            <>
              Transactional emails (necessary): security, support,
              confirmations, and important changes.
            </>,
            <>In-app notifications (when available).</>,
            <>
              Optional communications (marketing/updates) only when applicable
              and aligned with preferences/consent.
            </>,
          ],
        },
      },

      {
        id: "prohibited",
        title: {
          pt: "6. Atividades proibidas",
          en: "6. Prohibited activities",
        },
        icon: <AlertTriangle className="h-5 w-5" />,
        bullets: {
          pt: [
            <>Publicar informação falsa, enganosa ou fraudulenta.</>,
            <>Fazer-se passar por terceiros ou criar perfis falsos.</>,
            <>Partilhar dados pessoais de outros sem autorização.</>,
            <>Raspar (scrape), recolher ou explorar dados sem permissão.</>,
            <>
              Assediar, ameaçar, discriminar ou praticar comportamento abusivo.
            </>,
            <>Violar leis e regulamentos aplicáveis.</>,
          ],
          en: [
            <>Post false, misleading, or fraudulent information.</>,
            <>Impersonate others or create fake profiles.</>,
            <>Share others’ personal data without authorization.</>,
            <>Scrape, collect, or exploit data without permission.</>,
            <>Harass, threaten, discriminate, or engage in abusive behavior.</>,
            <>Violate applicable laws and regulations.</>,
          ],
        },
      },

      {
        id: "liability",
        title: {
          pt: "7. Isenção e limitação de responsabilidade",
          en: "7. Disclaimers & limitation of liability",
        },
        icon: <Gavel className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              A plataforma fornece um espaço de ligação e informação.{" "}
              <strong>Não somos parte</strong> em acordos ou transações entre
              utilizadores.
            </>
          ),
          en: (
            <>
              The platform provides a space for connection and information. We
              are <strong>not a party</strong> to agreements or transactions
              between users.
            </>
          ),
        },
        bullets: {
          pt: [
            <>
              Não verificamos a identidade, credenciais, qualificações ou
              qualidade dos serviços prestados por terceiros.
            </>,
            <>
              Não garantimos resultados, disponibilidade ou adequação de
              anúncios/serviços.
            </>,
            <>
              Qualquer interação/contratação ocorre entre utilizadores, por sua
              conta e risco.
            </>,
            <>
              A plataforma é fornecida “tal como está”, dentro dos limites
              legais aplicáveis.
            </>,
          ],
          en: [
            <>
              We do not verify identity, credentials, qualifications, or service
              quality provided by third parties.
            </>,
            <>
              We do not guarantee outcomes, availability, or suitability of
              listings/services.
            </>,
            <>Any interaction/hiring occurs between users, at your own risk.</>,
            <>
              The platform is provided “as is”, within applicable legal limits.
            </>,
          ],
        },
        callouts: [
          {
            tone: "info",
            title: { pt: "Recomendação", en: "Recommendation" },
            body: {
              pt: (
                <>
                  Verifique referências, termos e condições do prestador antes
                  de contratar qualquer serviço.
                </>
              ),
              en: (
                <>
                  Check references and provider terms before engaging any
                  service.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "privacy",
        title: { pt: "8. Privacidade e dados", en: "8. Privacy & data" },
        icon: <Lock className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              O tratamento de dados pessoais é explicado na{" "}
              <strong>Política de Privacidade</strong>. O uso de cookies é
              explicado na <strong>Política de Cookies</strong>.
            </>
          ),
          en: (
            <>
              Personal data handling is described in the{" "}
              <strong>Privacy Policy</strong>. Cookie usage is described in the{" "}
              <strong>Cookie Policy</strong>.
            </>
          ),
        },
        callouts: [
          {
            tone: "privacy",
            title: { pt: "Dados sensíveis", en: "Sensitive data" },
            body: {
              pt: (
                <>
                  Não publique dados sensíveis (ex.: documentos oficiais,
                  informação médica) em áreas públicas da plataforma.
                </>
              ),
              en: (
                <>
                  Do not post sensitive data (e.g., official documents, medical
                  info) in public areas of the platform.
                </>
              ),
            },
          },
        ],
      },

      {
        id: "termination",
        title: {
          pt: "9. Suspensão e encerramento",
          en: "9. Suspension & termination",
        },
        icon: <Shield className="h-5 w-5" />,
        bullets: {
          pt: [
            <>
              Podemos suspender/encerrar contas em caso de violação destes
              termos, fraude ou abuso.
            </>,
            <>
              Pode pedir encerramento da conta através das definições (se
              disponível) ou por contacto com suporte.
            </>,
          ],
          en: [
            <>
              We may suspend/terminate accounts for violations, fraud, or abuse.
            </>,
            <>
              You may request account closure via settings (if available) or by
              contacting support.
            </>,
          ],
        },
      },

      {
        id: "changes",
        title: { pt: "10. Alterações aos termos", en: "10. Changes to terms" },
        icon: <Info className="h-5 w-5" />,
        bullets: {
          pt: [
            <>Podemos atualizar estes termos periodicamente.</>,
            <>
              Alterações significativas podem ser comunicadas por email ou
              notificação.
            </>,
            <>
              A continuação de utilização após alterações constitui aceitação
              dos termos atualizados.
            </>,
          ],
          en: [
            <>We may update these terms from time to time.</>,
            <>
              Material changes may be communicated by email or in-app
              notification.
            </>,
            <>
              Continued use after changes constitutes acceptance of the updated
              terms.
            </>,
          ],
        },
      },

      {
        id: "law",
        title: { pt: "11. Lei aplicável", en: "11. Governing law" },
        icon: <Gavel className="h-5 w-5" />,
        intro: {
          pt: <>Estes termos regem-se pela lei aplicável em Portugal.</>,
          en: <>These terms are governed by applicable Portuguese law.</>,
        },
      },

      {
        id: "contact",
        title: { pt: "12. Contacto", en: "12. Contact" },
        icon: <Mail className="h-5 w-5" />,
        intro: {
          pt: (
            <>
              Para questões sobre estes Termos:
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
              For questions about these Terms:
              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  info@allcascais.com
                </div>
              </div>
            </>
          ),
        },
        callouts: [
          {
            tone: "success",
            title: { pt: "Transparência", en: "Transparency" },
            body: {
              pt: (
                <>
                  Se encontrar conteúdo inadequado, pode reportar na plataforma
                  (quando disponível) ou por email.
                </>
              ),
              en: (
                <>
                  If you find inappropriate content, you can report it in-app
                  (when available) or by email.
                </>
              ),
            },
          },
        ],
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
                {lang === "pt" ? "Termos e Condições" : "Terms & Conditions"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {lang === "pt"
                  ? "Ao utilizar a plataforma, concorda com estes Termos. Leia com atenção."
                  : "By using the platform, you agree to these Terms. Please read carefully."}
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
                <Gavel className="h-5 w-5" />
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
                      ? "O AllCascais é uma plataforma comunitária e diretório digital para Cascais."
                      : "AllCascais is a community platform and digital directory for Cascais."}
                  </li>
                  <li>
                    {lang === "pt"
                      ? "Os anunciantes/utilizadores são responsáveis pela informação e conteúdos publicados."
                      : "Advertisers/users are responsible for the information and content they post."}
                  </li>
                  <li>
                    {lang === "pt"
                      ? "A plataforma não presta nem garante serviços de terceiros."
                      : "The platform does not provide or guarantee third-party services."}
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
                    ? "Se precisar de esclarecimentos sobre estes Termos, contacte-nos por email."
                    : "If you need clarification about these Terms, contact us by email."}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Terms;
