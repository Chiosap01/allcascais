// src/content/livingGuides.ts

export type LivingGuideKey =
  | "areas"
  | "buying"
  | "renting"
  | "costs"
  | "moving"
  | "owners";

export type Localized = { pt: string; en: string };

export type LivingGuideSectionTone =
  | "default"
  | "tip"
  | "warning"
  | "checklist";

export type LivingGuideFAQ = {
  q: Localized;
  a: Localized;
};

export type LivingGuideTemplate = {
  title: Localized;
  description?: Localized;
  copyText: Localized; // what gets copied to clipboard
};

export type LivingGuide = {
  key: LivingGuideKey;
  title: Localized;
  subtitle: Localized;
  readTime: Localized;
  chips: Localized[];

  // Scan + share boosters
  audience?: Localized[];
  takeaways?: Localized[];
  updatedAt?: string;

  // NEW: FB-group magnets
  sharePost?: Localized; // a ready-to-post mini text
  faqs?: LivingGuideFAQ[];
  templates?: LivingGuideTemplate[];

  sections: Array<{
    heading: Localized;
    body?: Localized;
    bullets?: Localized[];
    tone?: LivingGuideSectionTone;
  }>;

  ctas: Array<
    | { kind: "browseHomes"; label: Localized }
    | { kind: "getMatched"; label: Localized }
    | { kind: "viewServices"; label: Localized }
    | { kind: "ownerHelp"; label: Localized }
  >;
};

const NOTE_LEGAL: Localized = {
  pt: "Nota: esta informação é prática e educativa. Regras e impostos podem mudar. Para decisões finais, confirme com solicitador/advogado e fontes oficiais.",
  en: "Note: this is practical, educational guidance. Rules and taxes can change. For final decisions, confirm with a solicitor/lawyer and official sources.",
};

export const LIVING_GUIDES: LivingGuide[] = [
  // 1) Areas
  {
    key: "areas",
    title: {
      pt: "Onde viver em Cascais: 9 micro-zonas + teste de 2 minutos",
      en: "Where to live in Cascais: 9 micro-areas + a 2-minute test",
    },
    subtitle: {
      pt: "Escolha sem arrependimento (3 testes práticos + checklist).",
      en: "Choose confidently (3 practical tests + a checklist).",
    },
    readTime: { pt: "3–4 min", en: "3–4 min" },
    updatedAt: "2026-01-10",
    chips: [{ pt: "✅ Checklist pronta", en: "✅ Ready checklist" }],
    audience: [
      {
        pt: "Está a mudar-se e não quer perder semanas em visitas inúteis.",
        en: "You’re relocating and don’t want to waste weeks on the wrong viewings.",
      },
      {
        pt: "Quer escolher zona pelo dia-a-dia (não só por fotos).",
        en: "You want to pick an area by daily life (not only photos).",
      },
    ],
    takeaways: [
      {
        pt: "Faça 2 visitas (dia útil 18–20h + fim-de-semana manhã).",
        en: "Visit twice (weekday 6–8pm + weekend morning).",
      },
      {
        pt: "Teste ruído/estacionamento 10 min (janelas abertas).",
        en: "Test noise/parking for 10 minutes (windows open).",
      },
      {
        pt: "Faça o trajeto real para trabalho/escola/saúde (sem assumir).",
        en: "Do the real commute to work/school/health (no guessing).",
      },
    ],

    // Updated: more specific + shareable (micro-areas)
    sharePost: {
      pt: `🏡 Cascais (micro-zonas) — guia rápido (2 min)

Cascais Centro = tudo a pé
Estoril / São João = residencial + acessos
Monte Estoril = vista + “premium”
São Pedro = surf/local vibe
Carcavelos = praia grande + mais perto de Lisboa
Parede = tranquila + autenticidade
Alcabideche / S. Domingos de Rana = mais espaço/garagem (carro)

Diz-me: budget + escola/trabalho + “carro ou comboio?” e eu devolvo 3 zonas recomendadas.`,
      en: `🏡 Cascais micro-areas — 2-minute cheat sheet

Cascais Center = walk-everywhere
Estoril / São João = residential + access
Monte Estoril = views + “premium”
São Pedro = surf/local vibe
Carcavelos = big beach + closer to Lisbon
Parede = quieter + authentic
Alcabideche / S. Domingos de Rana = more space/garage (car-friendly)

Tell me: budget + school/work + train vs car, and I’ll reply with 3 recommended areas.`,
    },

    templates: [
      {
        title: {
          pt: "Mensagem para pedir info antes da visita",
          en: "Message to ask key info before a viewing",
        },
        description: {
          pt: "Copie/cole para WhatsApp.",
          en: "Copy/paste for WhatsApp.",
        },
        copyText: {
          pt: `Olá! Antes de marcarmos visita, pode confirmar por favor:
1) Rua/zona exata (ou referência)
2) Condomínio (€/mês) e se há obras previstas
3) Estacionamento (garagem/lugar/rua)
4) Orientação solar + ruído (estrada/vizinhança)
5) Certificado energético + licença de utilização (se aplicável)
Obrigado!`,
          en: `Hi! Before we book a viewing, could you please confirm:
1) Exact street/area (or reference)
2) Condo fee (€/mo) and any planned works
3) Parking (garage/spot/street)
4) Sun orientation + noise (road/neighborhood)
5) Energy certificate + use permit (if applicable)
Thanks!`,
        },
      },
    ],
    faqs: [
      {
        q: {
          pt: "Como escolher a zona sem visitar 30 casas?",
          en: "How do I pick an area without viewing 30 homes?",
        },
        a: {
          pt: "Use o checklist de 2 minutos e faça os 3 testes (horários, ruído/estacionamento, rotas). Isso elimina 70% das opções erradas logo no início.",
          en: "Use the 2-minute checklist and the 3 tests (timing, noise/parking, routes). It eliminates most wrong options early.",
        },
      },
      {
        q: {
          pt: "Comboio é essencial?",
          en: "Is the train essential?",
        },
        a: {
          pt: "Se faz Lisboa com frequência, estar perto de comboio pode reduzir stress e custos. Se usa mais carro, priorize acessos e estacionamento real.",
          en: "If you commute to Lisbon often, being near the train can reduce stress and costs. If you mostly drive, prioritize access and real parking.",
        },
      },
      {
        q: {
          pt: "O que muda por estar perto do mar?",
          en: "What changes near the sea?",
        },
        a: {
          pt: "Humidade, vento e manutenção (caixilharia, ferragens, pinturas) tendem a ser mais relevantes. Visite em horários diferentes e observe cheiros/manchas.",
          en: "Humidity, wind, and maintenance (windows, metal parts, paint) matter more. Visit at different times and look for smells/stains.",
        },
      },
    ],

    sections: [
      {
        heading: {
          pt: "Checklist em 2 minutos (antes de abrir portais)",
          en: "2-minute checklist (before browsing portals)",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "O que é “vitória” para si? (praia | escolas | silêncio | vida social | espaço | vista | acessos)",
            en: "Define your win: beach | schools | quiet | social life | space | view | commute.",
          },
          {
            pt: "Qual é o seu limite real? (prestação/renda + condomínio + manutenção)",
            en: "Set your real limit: payment/rent + condo + upkeep.",
          },
          {
            pt: "Rotina: trabalha em Lisboa? quer comboio? precisa de A5/IC19? usa carro 1–2x/dia?",
            en: "Routine: Lisbon commute? need train? A5/IC19? driving 1–2x/day?",
          },
          {
            pt: "Estilo de vida: caminhável vs. carro; perto de comércio vs. mais residencial.",
            en: "Lifestyle: walkable vs car; near shops vs more residential.",
          },
        ],
      },

      {
        heading: {
          pt: "Como decidir sem arrependimento (o método dos 3 testes)",
          en: "How to decide with confidence (the 3-test method)",
        },
        bullets: [
          {
            pt: "Teste 1 — Horários: visite 2x (dia útil 18–20h + fim-de-semana manhã).",
            en: "Test #1 — Timing: visit twice (weekday 6–8pm + weekend morning).",
          },
          {
            pt: "Teste 2 — Ruído/estacionamento: pare 10 min com janelas abertas, procure estacionamento real.",
            en: "Test #2 — Noise/parking: stand 10 min with windows open, test real parking.",
          },
          {
            pt: "Teste 3 — Rotas: faça o trajeto real para trabalho/escola/saúde, sem “assumir”.",
            en: "Test #3 — Routes: do the real commute to work/school/health, no guessing.",
          },
        ],
      },

      // NEW: Fast pick by lifestyle (optional but very scannable)
      {
        heading: {
          pt: "Escolha rápida (por estilo de vida)",
          en: "Fast pick (by lifestyle)",
        },
        tone: "tip",
        bullets: [
          {
            pt: "Quero tudo a pé + restaurantes: Cascais (Centro/Marina).",
            en: "Walk-everywhere + restaurants: Cascais (Center/Marina).",
          },
          {
            pt: "Quero ‘clássico’ + calma + acessos: Estoril / São João do Estoril.",
            en: "Classic + calm + access: Estoril / São João do Estoril.",
          },
          {
            pt: "Quero vista + charme + ‘premium’: Monte Estoril.",
            en: "Views + charm + ‘premium’: Monte Estoril.",
          },
          {
            pt: "Quero praia grande + surf + mais perto de Lisboa: Carcavelos.",
            en: "Big beach + surf + closer to Lisbon: Carcavelos.",
          },
          {
            pt: "Quero vibe local + tranquila: Parede / São Pedro do Estoril.",
            en: "Local, quieter vibe: Parede / São Pedro do Estoril.",
          },
          {
            pt: "Quero mais espaço/garagem (e aceito carro): Alcabideche / São Domingos de Rana.",
            en: "More space/garage (OK with car): Alcabideche / São Domingos de Rana.",
          },
        ],
      },

      {
        heading: {
          pt: "Sinais de que a zona é a certa",
          en: "Signs the area is right",
        },
        tone: "tip",
        bullets: [
          {
            pt: "Consegue imaginar 7 dias completos ali (não só um domingo).",
            en: "You can picture 7 full days there (not just a Sunday).",
          },
          {
            pt: "Tem 3 serviços essenciais perto (supermercado + farmácia + ginásio/saúde/serviços).",
            en: "You have 3 essentials nearby (groceries + pharmacy + fitness/health/services).",
          },
          {
            pt: "O imóvel encaixa no seu “plano de 2 anos” (família, trabalho, escolas).",
            en: "The home fits your 2-year plan (family, work, schools).",
          },
        ],
      },

      {
        heading: {
          pt: "Erros comuns (que custam tempo e dinheiro)",
          en: "Common mistakes (that cost time and money)",
        },
        tone: "warning",
        bullets: [
          {
            pt: "Escolher por “vista” e depois sofrer com ruído/estacionamento.",
            en: "Choosing for the view, then suffering from noise/parking.",
          },
          {
            pt: "Subestimar trânsito/horários (especialmente em horas de ponta).",
            en: "Underestimating traffic/timing (especially peak hours).",
          },
          {
            pt: "Comprar/arrendar sem pensar em sol, vento e humidade (perto do mar).",
            en: "Ignoring sun/wind/humidity (coastal reality).",
          },
        ],
      },

      {
        heading: {
          pt: "Dica AllCascais (o teu diferencial)",
          en: "AllCascais tip (your advantage)",
        },
        tone: "tip",
        body: {
          pt: "Use os serviços locais como filtro de zona: se a vida é “correr/treino”, procure perto de estúdios/clubes; se é família, procure perto de escolas/atividades; se é mobilidade, avalie acessos e serviços de apoio.",
          en: "Use local services as an area filter: if you’re fitness-focused, stay near studios/clubs; if family-focused, stay near schools/activities; if mobility matters, evaluate access + support services.",
        },
      },

      { heading: { pt: "Nota", en: "Note" }, body: NOTE_LEGAL },
    ],

    ctas: [
      {
        kind: "getMatched",
        label: {
          pt: "Quero 3 zonas recomendadas",
          en: "Get 3 recommended areas",
        },
      },
      {
        kind: "browseHomes",
        label: { pt: "Ver opções agora", en: "See options now" },
      },
      {
        kind: "viewServices",
        label: { pt: "Encontrar ajuda local", en: "Find local help" },
      },
    ],
  },

  // 2) Buying
  {
    key: "buying",
    title: {
      pt: "Comprar em Cascais sem stress: passo-a-passo",
      en: "Buy in Cascais without stress: step-by-step",
    },
    subtitle: {
      pt: "Critérios, documentos, impostos e passos — para evitar erros caros.",
      en: "Criteria, documents, taxes, and steps — to avoid costly mistakes.",
    },
    readTime: { pt: "4–5 min", en: "4–5 min" },
    updatedAt: "2026-01-10",
    chips: [
      { pt: "✅ Passos claros", en: "✅ Clear steps" },
      { pt: "€ Erros caros", en: "€ Costly mistakes" },
      { pt: "📄 Docs", en: "📄 Docs" },
    ],
    audience: [
      {
        pt: "Quer comprar e precisa de um roteiro simples.",
        en: "You’re buying and want a simple roadmap.",
      },
      {
        pt: "Não quer perder negócios por falta de documentos.",
        en: "You don’t want to lose deals due to missing documents.",
      },
    ],
    takeaways: [
      {
        pt: "Defina 3 não-negociáveis (zona + tipologia + budget total).",
        en: "Set 3 non-negotiables (area + type + total budget).",
      },
      {
        pt: "Faça verificação documental antes da proposta séria.",
        en: "Check documents before making a serious offer.",
      },
      {
        pt: "Compare contexto + estado + €/m² (não só “preço”).",
        en: "Compare context + condition + €/m² (not only price).",
      },
    ],
    sections: [
      {
        heading: {
          pt: "Se só ler 1 coisa: a compra em 8 passos",
          en: "If you only read one thing: the 8-step path",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "1) Defina 3 não-negociáveis (zona, tipologia, budget total).",
            en: "1) Set 3 non-negotiables (area, type, total budget).",
          },
          {
            pt: "2) Financiamento: pré-aprovação ou plano claro (evita perder negócios).",
            en: "2) Financing: pre-approval or clear plan (avoids losing deals).",
          },
          {
            pt: "3) Shortlist (5–12 imóveis) + visitas com checklist.",
            en: "3) Shortlist (5–12 homes) + visits with a checklist.",
          },
          {
            pt: "4) Verificação documental (antes de proposta séria).",
            en: "4) Document checks (before a serious offer).",
          },
          {
            pt: "5) Proposta + negociação (€/m² + estado + contexto).",
            en: "5) Offer + negotiation (€/m² + condition + context).",
          },
          {
            pt: "6) CPCV (Contrato-Promessa) + sinal/condições.",
            en: "6) CPCV (promissory contract) + deposit/conditions.",
          },
          {
            pt: "7) Escritura/assinatura final + impostos.",
            en: "7) Closing/deed + taxes.",
          },
          {
            pt: "8) Pós-compra: utilities, IMI, seguros, manutenção.",
            en: "8) After purchase: utilities, IMI, insurance, maintenance.",
          },
        ],
      },
      {
        heading: {
          pt: "Documentos essenciais (checklist para pedir)",
          en: "Essential documents (request checklist)",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "Certificado energético (classe e validade).",
            en: "Energy certificate (rating + validity).",
          },
          {
            pt: "Licença de utilização (quando aplicável).",
            en: "Use permit / license (when applicable).",
          },
          {
            pt: "Caderneta predial (dados fiscais).",
            en: "Property tax registry (fiscal data).",
          },
          {
            pt: "Certidão permanente (registo e ónus/hipotecas).",
            en: "Land registry certificate (liens/charges).",
          },
          {
            pt: "Condomínio: valor mensal + atas (obras previstas).",
            en: "Condo: monthly fee + minutes (planned works).",
          },
          {
            pt: "Se houver obras: faturas/garantias e datas.",
            en: "If renovated: invoices/warranties and dates.",
          },
        ],
      },
      {
        heading: {
          pt: "Impostos e custos (o que geralmente existe)",
          en: "Taxes & costs (what usually applies)",
        },
        tone: "default",
        bullets: [
          {
            pt: "Imposto de Selo (compra): 0,8% sobre o valor mais alto entre preço e VPT.",
            en: "Stamp Duty (purchase): 0.8% on the higher of price vs tax value (VPT).",
          },
          {
            pt: "IMT: imposto de transmissão (taxas progressivas; depende do imóvel e uso).",
            en: "IMT: transfer tax (progressive; depends on property type and use).",
          },
          {
            pt: "Se houver crédito: pode existir Imposto de Selo sobre o montante do empréstimo (varia por prazo/estrutura).",
            en: "If financing: there may be stamp duty on the mortgage amount (varies by term/structure).",
          },
          {
            pt: "Anual: IMI (taxa municipal) + condomínio + seguros/manutenção.",
            en: "Annual: IMI (municipal tax) + condo + insurance/upkeep.",
          },
        ],
      },
      {
        heading: {
          pt: "Atenção: benefícios para jovens ≤35 (primeira habitação)",
          en: "Heads-up: benefits for young buyers ≤35 (first home)",
        },
        tone: "tip",
        bullets: [
          {
            pt: "Portugal tem medidas recentes com isenção/redução de IMT para jovens até 35 anos em primeira habitação, com limites por valor do imóvel.",
            en: "Portugal has recent measures with IMT exemption/reduction for first-home buyers up to age 35, with value thresholds.",
          },
          {
            pt: "Se é o seu caso, confirme elegibilidade antes de assinar CPCV.",
            en: "If that’s you, confirm eligibility before signing the CPCV.",
          },
        ],
      },
      {
        heading: {
          pt: "Red flags (evite perdas)",
          en: "Red flags (avoid losses)",
        },
        tone: "warning",
        bullets: [
          {
            pt: "Preço “bom demais” sem documentos prontos.",
            en: "Too-good-to-be-true price with missing docs.",
          },
          {
            pt: "Inconsistências entre áreas/descrição e documentos.",
            en: "Mismatch between stated areas and official docs.",
          },
          {
            pt: "Condomínio com obras grandes planeadas (custo extra).",
            en: "Condo with major planned works (extra cost).",
          },
          {
            pt: "Humidade/fissuras: peça inspeção técnica se tiver dúvidas.",
            en: "Humidity/cracks: request a technical inspection if unsure.",
          },
        ],
      },
      {
        heading: { pt: "Nota", en: "Note" },
        tone: "default",
        body: NOTE_LEGAL,
      },
    ],
    ctas: [
      {
        kind: "getMatched",
        label: { pt: "Envie-me opções", en: "Send me options" },
      },
      {
        kind: "browseHomes",
        label: { pt: "Ver imóveis à venda", en: "Browse homes for sale" },
      },
    ],
  },

  // 3) Renting
  {
    key: "renting",
    title: {
      pt: "Arrendar em Cascais: checklist anti-surpresas",
      en: "Renting in Cascais: the no-surprises checklist",
    },
    subtitle: {
      pt: "Contratos, cauções, inventário e prazos — para assinar com confiança.",
      en: "Contracts, deposits, inventory, timelines — sign with confidence.",
    },
    readTime: { pt: "3–4 min", en: "3–4 min" },
    updatedAt: "2026-01-10",
    chips: [
      { pt: "✅ Checklist", en: "✅ Checklist" },
      { pt: "📝 Contrato", en: "📝 Contract" },
    ],
    audience: [
      {
        pt: "Vai arrendar e quer evitar surpresas no contrato/caução.",
        en: "You’re renting and want to avoid contract/deposit surprises.",
      },
      {
        pt: "Precisa de uma lista rápida para usar nas visitas.",
        en: "You want a quick list to use during viewings.",
      },
    ],
    takeaways: [
      {
        pt: "Peça o contrato antes do dia da assinatura.",
        en: "Ask for the contract before signing day.",
      },
      {
        pt: "Faça inventário com fotos/vídeo datados ao entrar.",
        en: "Do dated photo/video inventory at move-in.",
      },
      {
        pt: "Confirme o que está incluído (condomínio, água, internet, parking).",
        en: "Confirm what’s included (condo, water, internet, parking).",
      },
    ],
    sections: [
      {
        heading: {
          pt: "Checklist antes de dizer “sim”",
          en: "Checklist before you say “yes”",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "Peça o contrato para ler antes (não no dia da assinatura).",
            en: "Ask for the contract in advance (not on signing day).",
          },
          {
            pt: "Confirme duração, renovação e condições de saída/denúncia.",
            en: "Confirm duration, renewal, and termination conditions.",
          },
          {
            pt: "Esclareça o que está incluído: condomínio, água, internet, estacionamento.",
            en: "Clarify what’s included: condo, water, internet, parking.",
          },
          {
            pt: "Faça inventário + fotos/vídeo (com data) ao entrar.",
            en: "Do inventory + dated photos/video on move-in.",
          },
        ],
      },
      {
        heading: {
          pt: "Caução e pagamentos (o que ver na prática)",
          en: "Deposits & payments (real-world checks)",
        },
        tone: "default",
        bullets: [
          {
            pt: "Peça tudo por escrito: valores, datas, IBAN, e condições de devolução da caução.",
            en: "Get everything in writing: amounts, dates, IBAN, and deposit return conditions.",
          },
          {
            pt: "Confirme se há fiador, adiantamentos, ou garantias adicionais.",
            en: "Confirm if a guarantor, advance rent, or extra guarantees are required.",
          },
          {
            pt: "Guarde recibos e comunicações (email/WhatsApp) organizados.",
            en: "Keep receipts and communications organized.",
          },
        ],
      },
      {
        heading: {
          pt: "Inspeção rápida (10 minutos na visita)",
          en: "Fast inspection (10 minutes during a viewing)",
        },
        tone: "tip",
        bullets: [
          {
            pt: "Humidade: cheiro, manchas, cantos frios, casas de banho e armários.",
            en: "Humidity: smell, stains, cold corners, bathrooms and wardrobes.",
          },
          {
            pt: "Água: pressão e escoamento (cozinha e WC).",
            en: "Water: pressure and drainage (kitchen and bathrooms).",
          },
          {
            pt: "Janelas: vedação e ruído da rua.",
            en: "Windows: sealing and street noise.",
          },
          {
            pt: "Orientação solar: luz real (não confie só em fotos).",
            en: "Sunlight: real light (don’t rely on photos).",
          },
        ],
      },
      {
        heading: {
          pt: "Timeline realista (para evitar stress)",
          en: "A realistic timeline (to reduce stress)",
        },
        tone: "default",
        bullets: [
          {
            pt: "1–2 dias: shortlist e visitas.",
            en: "1–2 days: shortlist + viewings.",
          },
          {
            pt: "1–3 dias: negociação + documentos + contrato.",
            en: "1–3 days: negotiation + documents + contract.",
          },
          {
            pt: "1 dia: inventário, fotos e mudanças.",
            en: "1 day: inventory, photos, move-in.",
          },
        ],
      },
      {
        heading: { pt: "Nota", en: "Note" },
        tone: "default",
        body: NOTE_LEGAL,
      },
    ],
    ctas: [
      {
        kind: "getMatched",
        label: { pt: "Quero recomendações", en: "Get recomendations" },
      },
      {
        kind: "browseHomes",
        label: { pt: "Ver arrendamentos", en: "Browse rentals" },
      },
      {
        kind: "viewServices",
        label: {
          pt: "Serviços úteis (mudança)",
          en: "Useful services (moving)",
        },
      },
    ],
  },

  // 4) Costs
  {
    key: "costs",
    title: {
      pt: "Quanto custa mesmo? (custo total no 1º ano)",
      en: "What it really costs (true first-year total)",
    },
    subtitle: {
      pt: "Planeie impostos, escritura, obras e manutenção — sem surpresas.",
      en: "Plan for taxes, closing, renovations, and upkeep — no surprises.",
    },
    readTime: { pt: "3–4 min", en: "3–4 min" },
    updatedAt: "2026-01-10",
    chips: [
      { pt: "€ Custo total", en: "€ Total cost" },
      { pt: "✅ Modelo", en: "✅ Model" },
    ],
    audience: [
      {
        pt: "Quer comparar 2–3 imóveis com calma e números reais.",
        en: "You want to compare 2–3 homes calmly with real numbers.",
      },
      {
        pt: "Não quer ‘surpresas’ depois de comprar.",
        en: "You don’t want surprises after you buy.",
      },
    ],
    takeaways: [
      {
        pt: "Compare sempre por custo total no 1º ano (não só preço).",
        en: "Always compare by total first-year cost (not only price).",
      },
      {
        pt: "Reserve margem para obras, mesmo em upgrades pequenos.",
        en: "Keep a buffer for renovations, even small upgrades.",
      },
      {
        pt: "Confirme obras previstas no condomínio (surpresas acontecem aí).",
        en: "Confirm planned condo works (surprises often live there).",
      },
    ],
    sections: [
      {
        heading: {
          pt: "O “custo total” (a forma certa de comparar imóveis)",
          en: "Total cost (the right way to compare homes)",
        },
        tone: "tip",
        body: {
          pt: "Dois imóveis com o mesmo preço podem ter custos muito diferentes. Compare sempre por custo total no primeiro ano.",
          en: "Two homes with the same price can have very different costs. Always compare by total first-year cost.",
        },
        bullets: [
          {
            pt: "Preço + impostos de compra + custos de escritura/serviços.",
            en: "Price + purchase taxes + closing/service costs.",
          },
          {
            pt: "Condomínio anual + seguros + manutenção base.",
            en: "Annual condo + insurance + baseline maintenance.",
          },
          {
            pt: "Obras/upgrade (mesmo pequenos: pintura, AC, caixilharia).",
            en: "Renovations/upgrades (even small: paint, AC, windows).",
          },
        ],
      },
      {
        heading: {
          pt: "Impostos: o que normalmente existe",
          en: "Taxes: what typically applies",
        },
        tone: "default",
        bullets: [
          {
            pt: "Compra: IMT (varia por escalões e tipo de uso).",
            en: "Purchase: IMT (varies by bands and intended use).",
          },
          {
            pt: "Compra: Imposto de Selo 0,8% (compra).",
            en: "Purchase: 0.8% Stamp Duty (purchase).",
          },
          {
            pt: "Anual: IMI (taxa municipal). Em Cascais, foi aprovada taxa geral de 0,35% para 2026 (com medidas para HPP).",
            en: "Annual: IMI (municipal tax). In Cascais, a 0.35% general rate was approved for 2026 (with measures for primary homes).",
          },
        ],
      },
      {
        heading: {
          pt: "Obras: reserve margem (regra prática)",
          en: "Renovations: keep a buffer (practical rule)",
        },
        tone: "warning",
        bullets: [
          {
            pt: "Se o imóvel está “habitável mas antigo”: reserve uma margem para melhorias nos primeiros 12 meses.",
            en: "If it’s livable but dated: keep a buffer for improvements in the first 12 months.",
          },
          {
            pt: "Se há humidade/caixilharia antiga: peça avaliação técnica antes de avançar.",
            en: "If there’s humidity/old windows: get a technical assessment before moving forward.",
          },
          {
            pt: "Condomínio: confirme se há obras previstas (pode virar “surpresa”).",
            en: "Condo: confirm planned works (surprises happen here).",
          },
        ],
      },
      {
        heading: {
          pt: "Mini-calculadora mental (em 30 segundos)",
          en: "30-second mental calculator",
        },
        tone: "checklist",
        bullets: [
          { pt: "Preço do imóvel", en: "Home price" },
          {
            pt: "+ impostos de compra (IMT + IS 0,8%)",
            en: "+ purchase taxes (IMT + 0.8% stamp duty)",
          },
          { pt: "+ custos de escritura/serviços", en: "+ closing/services" },
          {
            pt: "+ 12 meses de condomínio + seguros",
            en: "+ 12 months condo + insurance",
          },
          {
            pt: "+ margem de obras (se aplicável)",
            en: "+ renovation buffer (if needed)",
          },
        ],
      },
      {
        heading: { pt: "Nota", en: "Note" },
        tone: "default",
        body: NOTE_LEGAL,
      },
    ],
    ctas: [
      {
        kind: "getMatched",
        label: {
          pt: "Ajudar-me a comparar 2–3 imóveis",
          en: "Help me compare 2–3 homes",
        },
      },
      { kind: "browseHomes", label: { pt: "Ver imóveis", en: "Browse homes" } },
    ],
  },

  // 5) Moving
  {
    key: "moving",
    title: {
      pt: "Mudar-se para Cascais: checklist 7 dias + 30 dias",
      en: "Moving to Cascais: 7-day + 30-day checklist",
    },
    subtitle: {
      pt: "Tarefas e serviços essenciais — do básico ao dia-a-dia.",
      en: "Essential tasks and services — from basics to daily life.",
    },
    readTime: { pt: "4–5 min", en: "4–5 min" },
    updatedAt: "2026-01-10",
    chips: [
      { pt: "✅ 7 dias", en: "✅ 7 days" },
      { pt: "✅ 30 dias", en: "✅ 30 days" },
      { pt: "🧰 Serviços", en: "🧰 Services" },
    ],
    audience: [
      {
        pt: "Acabou de chegar e quer instalar-se sem stress.",
        en: "You just arrived and want to settle in without stress.",
      },
      {
        pt: "Quer um plano rápido para o ‘dia-a-dia’ funcionar.",
        en: "You want a quick plan to make daily life work.",
      },
    ],
    takeaways: [
      {
        pt: "Marque internet/energia/água logo (slots bons acabam).",
        en: "Book internet/energy/water early (good slots disappear).",
      },
      {
        pt: "Faça inventário com fotos e reporte problemas no dia 1.",
        en: "Do a photo inventory and report issues on day 1.",
      },
      {
        pt: "Defina mobilidade: carro vs comboio vs caminhável.",
        en: "Decide mobility: car vs train vs walkable.",
      },
    ],
    sections: [
      {
        heading: {
          pt: "Primeiros 7 dias (para se instalar sem stress)",
          en: "First 7 days (settle in with less stress)",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "Internet/energia/água: confirme prazos e agende instalação.",
            en: "Internet/energy/water: confirm timelines and book installation.",
          },
          {
            pt: "Mudanças + limpeza: marque com antecedência (bons slots acabam).",
            en: "Moving + cleaning: book early (good slots disappear).",
          },
          {
            pt: "Chaves/códigos/garagem: teste tudo no dia 1.",
            en: "Keys/codes/garage: test everything on day 1.",
          },
          {
            pt: "Inventário do imóvel (fotos) e reporte imediato de problemas.",
            en: "Inventory (photos) and report issues immediately.",
          },
        ],
      },
      {
        heading: {
          pt: "Primeiros 30 dias (vida real)",
          en: "First 30 days (real life)",
        },
        tone: "default",
        bullets: [
          {
            pt: "Saúde: escolha clínica/farmácia e serviços de bem-estar perto.",
            en: "Health: choose a clinic/pharmacy and nearby wellness services.",
          },
          {
            pt: "Mobilidade: defina o “plano” (carro vs comboio vs caminhável).",
            en: "Mobility: set your plan (car vs train vs walkable).",
          },
          {
            pt: "Rotinas: supermercado, ginásio, lavandaria, oficinas/apoio.",
            en: "Routines: groceries, gym, laundry, workshops/support.",
          },
        ],
      },
      {
        heading: {
          pt: "Se tem filhos (atalho para decidir bem)",
          en: "If you have kids (decision shortcut)",
        },
        tone: "tip",
        bullets: [
          {
            pt: "Teste rotas reais para escola + atividades (hora de ponta).",
            en: "Test real routes to school + activities (rush hour).",
          },
          {
            pt: "Escolha a zona pelo “dia-a-dia” e não só pelo imóvel.",
            en: "Pick the area by daily life, not only the home.",
          },
        ],
      },
      {
        heading: { pt: "Nota", en: "Note" },
        tone: "default",
        body: NOTE_LEGAL,
      },
    ],
    ctas: [
      {
        kind: "viewServices",
        label: { pt: "Encontrar ajuda local", en: "Find local help" },
      },
      {
        kind: "getMatched",
        label: {
          pt: "Ajudar-me a escolher zona",
          en: "Help me choose an area",
        },
      },
      { kind: "browseHomes", label: { pt: "Ver imóveis", en: "Browse homes" } },
    ],
  },

  // 6) Owners
  {
    key: "owners",
    title: {
      pt: "Vender em Cascais: anúncio que gera visitas",
      en: "Selling in Cascais: a listing that gets viewings",
    },
    subtitle: {
      pt: "Apresentação + narrativa local (sem “anúncios iguais”).",
      en: "Presentation + local narrative (no “same listing” vibe).",
    },
    readTime: { pt: "4–5 min", en: "4–5 min" },
    updatedAt: "2026-01-13",
    chips: [
      { pt: "📸 Fotos", en: "📸 Photos" },
      { pt: "🧠 Narrativa", en: "🧠 Story" },
      { pt: "✅ Leads", en: "✅ Leads" },
    ],
    audience: [
      {
        pt: "Quer vender mais rápido com leads melhores.",
        en: "You want to sell faster with better leads.",
      },
      {
        pt: "Está farto de anúncios genéricos que não convertem.",
        en: "You’re tired of generic listings that don’t convert.",
      },
    ],
    takeaways: [
      {
        pt: "Fotos + info clara = mais visitas e melhor proposta.",
        en: "Great photos + clear info = more viewings and better offers.",
      },
      {
        pt: "Venda “vida” (zona/rotina/serviços), não só paredes.",
        en: "Sell “life” (area/routine/services), not just walls.",
      },
      {
        pt: "CTA simples e rápido (slots de visita + resposta rápida).",
        en: "Keep CTAs simple (viewing slots + fast replies).",
      },
    ],
    sections: [
      {
        heading: {
          pt: "O que vende hoje (e o que já não funciona)",
          en: "What sells today (and what doesn’t anymore)",
        },
        tone: "default",
        bullets: [
          {
            pt: "Fotos fracas e texto genérico = menos visitas e pior proposta.",
            en: "Weak photos + generic copy = fewer visits and worse offers.",
          },
          {
            pt: "Boa apresentação + informação clara = leads mais qualificados.",
            en: "Great presentation + clear info = more qualified leads.",
          },
          {
            pt: "As pessoas compram “vida” (zona, rotina, serviços), não só paredes.",
            en: "People buy “life” (area, routine, services), not just walls.",
          },
        ],
      },
      {
        heading: {
          pt: "Checklist do anúncio que se destaca (sem gastar muito)",
          en: "A standout listing checklist (without spending a lot)",
        },
        tone: "checklist",
        bullets: [
          {
            pt: "1) Fotos: luz natural, ângulos certos, casa arrumada (sem excessos).",
            en: "1) Photos: natural light, correct angles, tidy home (no clutter).",
          },
          {
            pt: "2) Título: claro e específico (tipologia + zona + diferencial real).",
            en: "2) Title: clear and specific (type + area + real differentiator).",
          },
          {
            pt: "3) Descrição: curta, com bullets, e sem “palavras vazias”.",
            en: "3) Description: short, bullet-based, no empty words.",
          },
          {
            pt: "4) Info que reduz dúvidas: áreas, condomínio, CE, estacionamento, obras feitas.",
            en: "4) Info that reduces doubts: areas, condo, energy cert, parking, renovations.",
          },
          {
            pt: "5) Contexto: 5 pontos do “viver aqui” (praia, comércio, escolas, acessos, vibe).",
            en: "5) Context: 5 “living here” points (beach, shops, schools, access, vibe).",
          },
        ],
      },
      {
        heading: {
          pt: "A estratégia AllCascais (o ‘blue ocean’ local)",
          en: "The AllCascais strategy (your local ‘blue ocean’)",
        },
        tone: "tip",
        body: {
          pt: "No AllCascais, o seu imóvel não aparece sozinho — aparece com contexto local e serviços úteis. Isso aumenta confiança e diferencia do anúncio genérico.",
          en: "On AllCascais, your home doesn’t show up alone — it shows up with local context and useful services. This builds trust and differentiates from generic listings.",
        },
        bullets: [
          {
            pt: "Integre serviços relevantes (limpeza, obras, jardinagem, mudança, decoração).",
            en: "Connect relevant services (cleaning, renovations, gardening, moving, staging).",
          },
          {
            pt: "Conte a narrativa: “porque esta zona” + “como é o dia-a-dia”.",
            en: "Tell the narrative: “why this area” + “what daily life feels like”.",
          },
          {
            pt: "Chamada para ação clara: visitas em horários definidos + contacto simples.",
            en: "Clear CTA: defined viewing slots + simple contact.",
          },
        ],
      },
      {
        heading: {
          pt: "Erros que fazem o imóvel ficar parado",
          en: "Mistakes that keep a home stuck",
        },
        tone: "warning",
        bullets: [
          {
            pt: "Preço fora do mercado (sem justificar estado/qualidade/obra).",
            en: "Pricing outside market reality (without condition/quality justification).",
          },
          {
            pt: "Poucas fotos (ou escuras) e sem planta/medidas.",
            en: "Too few photos (or dark) and no floorplan/measurements.",
          },
          {
            pt: "Responder tarde aos contactos (perde o lead quente).",
            en: "Slow replies (you lose the hot lead).",
          },
        ],
      },
      {
        heading: { pt: "Nota", en: "Note" },
        tone: "default",
        body: NOTE_LEGAL,
      },
    ],
    ctas: [
      {
        kind: "ownerHelp",
        label: {
          pt: "Avaliação + plano de venda",
          en: "Valuation + selling plan",
        },
      },
      {
        kind: "browseHomes",
        label: { pt: "Ver mercado em Cascais", en: "See Cascais market" },
      },
      {
        kind: "viewServices",
        label: {
          pt: "Serviços para preparar a casa",
          en: "Services to prep your home",
        },
      },
    ],
  },
];

export const getLivingGuide = (key: string | undefined) =>
  LIVING_GUIDES.find((g) => g.key === key);
