// src/constants/locations.ts

export const CASCAIS_AREAS: string[] = [
  "Cascais",
  "Estoril",
  "Monte Estoril",
  "São João do Estoril",
  "São Pedro do Estoril",
  "Carcavelos",
  "Parede",
  "Alcabideche",
  "São Domingos de Rana",
];

// A bit more complete + consistent across the app.
// Keep names human-friendly (matching your UI labels).
export const NEIGHBORHOODS_BY_AREA: Record<string, string[]> = {
  Cascais: [
    "Centro Histórico",
    "Cidadela",
    "Gandarinha",
    "Guia",
    "Quinta da Marinha",
    "Birre",
    "Cobre",
    "Torre",
    "Abuxarda",
    "Bairro do Rosário",
    "Murches",
    "Malveira da Serra",
  ],

  Estoril: [
    "Tamariz",
    "Casino",
    "Estoril Centro",
    "Conceição / Monte Leite",
    "Atibá",
    "São João (Estoril)",
    "São Pedro (Estoril)",
  ],

  "Monte Estoril": [
    "Avenida Sabóia",
    "Jardim dos Passarinhos",
    "Praia da Poça",
    "Monte Estoril Centro",
  ],

  "São João do Estoril": ["Junqueiro", "Poça", "Azarujinha", "Zona Estação"],

  "São Pedro do Estoril": ["Praia", "Zona Estação", "Marginal"],

  Carcavelos: [
    "Centro",
    "Nova Carcavelos",
    "Quinta da Alagoa",
    "Zona Praia",
    "Sassoeiros",
  ],

  Parede: ["Centro", "Junqueiro", "Av. Marginal", "Buzano", "Madorna"],

  Alcabideche: [
    "Manique",
    "Bicesse",
    "Pai do Vento",
    "Amoreira",
    "Zambujal",
    "Alcabideche Centro",
  ],

  "São Domingos de Rana": [
    "Caparide",
    "Tires",
    "Abóboda",
    "Bairro do Limoeiro",
    "Matarraque",
  ],
};
