// src/data/categories.ts

/* ---------- CATEGORY & SUBCATEGORY TYPES ---------- */

export type CategoryId =
  | "all"
  | "real-estate"
  | "home-services"
  | "hosting"
  | "food"
  | "legal-bureaucracy"
  | "relocation-expat"
  | "family-care"
  | "education-courses"
  | "wellness-beauty"
  | "sports-outdoors"
  | "medical"
  | "transportation"
  | "auto-services" // ✅ NEW (kept)
  | "pets"
  | "events-entertainment"
  | "professional";

export interface Category {
  id: CategoryId;
  label: string; // base EN label
  icon?: string;
}

export type Subcategory = {
  id: string;
  label: string; // base EN label
  icon: string;
};

export const CATEGORIES: Category[] = [
  { id: "all", label: "All" },
  { id: "real-estate", label: "Real Estate", icon: "🏠" },
  { id: "home-services", label: "Home Services", icon: "🛠️" },
  { id: "hosting", label: "Property Hosting", icon: "🔑" },
  { id: "food", label: "Food & Dining", icon: "🍽️" },
  { id: "legal-bureaucracy", label: "Legal & Tax", icon: "⚖️" },
  { id: "relocation-expat", label: "Relocation & Settling-in", icon: "🧳" },
  { id: "family-care", label: "Family & Care", icon: "👨‍👩‍👧" },
  { id: "education-courses", label: "Education & Courses", icon: "📚" },
  { id: "wellness-beauty", label: "Wellness & Beauty", icon: "💆‍♀️" },
  { id: "sports-outdoors", label: "Sports & Outdoors", icon: "🏃‍♂️" },
  { id: "medical", label: "Medical", icon: "🏥" },
  { id: "transportation", label: "Transportation", icon: "🚗" },
  { id: "auto-services", label: "Auto Services", icon: "🔧" }, // ✅ NEW
  { id: "pets", label: "Pets", icon: "🐾" },
  { id: "events-entertainment", label: "Events & Entertainment", icon: "🎉" },
  { id: "professional", label: "Professional Services", icon: "💼" },
];

export const SUBCATEGORIES: Partial<Record<CategoryId, Subcategory[]>> = {
  "real-estate": [
    { id: "real-estate-agent", label: "Real Estate Agent", icon: "🔑" },
    { id: "property-management", label: "Property Management", icon: "🏢" },
    { id: "architect", label: "Architect", icon: "🏗️" },
    { id: "contractor", label: "Contractor", icon: "👷‍♂️" },
    { id: "notary", label: "Notary", icon: "📜" },
    { id: "home-staging", label: "Home Staging", icon: "🛋️" },
    { id: "renovation", label: "Renovation", icon: "🧱" },
  ],

  "home-services": [
    { id: "cleaning", label: "Cleaning", icon: "🧹" },
    { id: "handyman", label: "Handyman", icon: "🔧" },
    { id: "plumber", label: "Plumber", icon: "🚰" },
    { id: "electrician", label: "Electrician", icon: "⚡" },
    { id: "carpenter", label: "Carpenter", icon: "🔨" },
    { id: "gardener", label: "Gardener", icon: "🌱" },
    { id: "pest-control", label: "Pest Control", icon: "🐜" },
    { id: "roofer", label: "Roofer", icon: "🏠" },
    { id: "painter", label: "Painter", icon: "🎨" },
    { id: "glazier", label: "Glazier / Windows", icon: "🪟" },
    { id: "pool-service", label: "Pool Service", icon: "🏊" },
    { id: "appliance-repair", label: "Appliance Repair", icon: "🧺" },
    { id: "solar-photovoltaics", label: "Solar / Photovoltaics", icon: "☀️" },
    { id: "security-systems", label: "Security Systems", icon: "🔒" },
    { id: "locksmith", label: "Locksmith", icon: "🔐" },
    { id: "aircon-hvac", label: "Air Conditioning / HVAC", icon: "❄️" },
    { id: "moving-company", label: "Moving & Relocation", icon: "🚚" },

    // ✅ NEW (kept only the truly hireable ones)
    { id: "window-cleaning", label: "Window Cleaning", icon: "🧽" },
    {
      id: "sofa-upholstery-cleaning",
      label: "Sofa & Upholstery Cleaning",
      icon: "🛋️",
    },
    {
      id: "waterproofing-mold",
      label: "Waterproofing / Damp & Mold",
      icon: "🧱",
    },
    { id: "interior-designer", label: "Interior Designer", icon: "🪑" },
  ],

  hosting: [
    { id: "airbnb-management", label: "Airbnb Management", icon: "🏡" },
    { id: "key-holding", label: "Key Holding", icon: "🔑" },
    { id: "guest-reception", label: "Guest Reception", icon: "🤝" },
    { id: "laundry-rentals", label: "Laundry for Rentals", icon: "🧺" },
    { id: "home-checks", label: "Home Check-ins", icon: "👀" },
  ],

  food: [
    { id: "restaurant", label: "Restaurant", icon: "🍽️" },
    { id: "cafe", label: "Café", icon: "☕" },
    { id: "private-chef", label: "Private Chef", icon: "👨‍🍳" },
    { id: "catering", label: "Catering", icon: "🥂" },
    { id: "meal-prep", label: "Meal Prep / Delivery", icon: "🍱" },
    { id: "bakery", label: "Bakery", icon: "🥖" },
    { id: "wine-spirits", label: "Wine & Spirits", icon: "🍷" },
  ],

  "legal-bureaucracy": [
    { id: "lawyer", label: "Lawyer", icon: "⚖️" },
    { id: "tax-advisor", label: "Tax Advisor", icon: "📊" },
  ],

  "relocation-expat": [
    {
      id: "immigration-residency",
      label: "Immigration / Residency",
      icon: "🛂",
    },
    { id: "nif-bank", label: "NIF & Bank Setup", icon: "🏦" },
    { id: "documentation-help", label: "Documentation Help", icon: "📄" },
    { id: "relocation-agency", label: "Relocation Agency", icon: "📦" },
    { id: "settling-in-services", label: "Settling-in Services", icon: "🧭" },
  ],

  "family-care": [
    { id: "babysitting", label: "Babysitting", icon: "🧸" },
    { id: "nanny", label: "Nanny", icon: "👶" },
    { id: "elderly-care", label: "Elderly Care", icon: "🧓" },
    { id: "kindergarten-daycare", label: "Daycare", icon: "🧒" },
    { id: "summer-camp", label: "Summer Camp", icon: "🏕️" },
    { id: "special-needs", label: "Special Needs Support", icon: "🧩" },
    // ✅ NEW
    { id: "after-school", label: "After-school / Activities", icon: "🎒" },
  ],

  "education-courses": [
    { id: "language-school", label: "Language School", icon: "📘" },
    { id: "tutoring", label: "Tutoring", icon: "✏️" },
    { id: "school-advice", label: "School Advice", icon: "🏫" },
    { id: "music-school", label: "Music School", icon: "🎵" },
    { id: "dance-school", label: "Dance School", icon: "💃" },
  ],

  "wellness-beauty": [
    { id: "massage", label: "Massage", icon: "💆‍♀️" },
    { id: "yoga", label: "Yoga", icon: "🧘‍♀️" },
    { id: "pilates", label: "Pilates", icon: "🤸‍♀️" },
    { id: "spa", label: "Spa", icon: "🧖‍♀️" },
    { id: "hair-salon", label: "Hair Salon", icon: "💇‍♀️" },
    { id: "barber", label: "Barber", icon: "💈" },
    {
      id: "dermatology-botox",
      label: "Aesthetic Medicine & Botox",
      icon: "💉",
    },
    { id: "nutritionist", label: "Nutritionist", icon: "🥗" },
    { id: "physiotherapy", label: "Physiotherapy", icon: "🦵" },
    { id: "osteopath", label: "Osteopath", icon: "🦴" },
    { id: "psychologist", label: "Psychologist", icon: "🧠" },
    { id: "acupuncture", label: "Acupuncture", icon: "🪡" },
    { id: "personal-training", label: "Personal Training", icon: "🏋️" },
  ],

  "sports-outdoors": [
    { id: "surf-school", label: "Surf School", icon: "🏄‍♂️" },
    { id: "padel", label: "Padel", icon: "🏓" },
    { id: "gym-fitness", label: "Gym & Fitness", icon: "💪" },
    { id: "running-club", label: "Running Club", icon: "🏃‍♂️" },
    { id: "swimming", label: "Swimming & Aquatics", icon: "🏊‍♂️" },
    { id: "golf", label: "Golf", icon: "⛳" },
    { id: "tennis", label: "Tennis", icon: "🎾" },
    { id: "cycling", label: "Cycling", icon: "🚴‍♂️" },
    { id: "martial-arts", label: "Martial Arts", icon: "🥋" },
    { id: "sailing-school", label: "Sailing School", icon: "⛵" },
    { id: "boat-tours", label: "Boat Tours & Charters", icon: "🛥️" },
    { id: "horse-riding", label: "Horse Riding", icon: "🐎" },
  ],

  medical: [
    { id: "gp", label: "General Practitioner", icon: "👨‍⚕️" },
    { id: "clinic-urgent-care", label: "Clinic / Urgent Care", icon: "🏥" },
    { id: "laboratory", label: "Laboratory / Analysis", icon: "🧪" },
    { id: "imaging", label: "Imaging", icon: "🩻" },
    { id: "dentist", label: "Dentist", icon: "🦷" },
    { id: "pediatrics", label: "Pediatrics", icon: "🍼" },
    { id: "gynecology", label: "Gynecology", icon: "👩‍⚕️" },
    { id: "orthopedist", label: "Orthopedist", icon: "🦴" },
    { id: "dermatologist", label: "Dermatologist", icon: "🧴" },
    { id: "vaccinations-travel", label: "Vaccinations / Travel", icon: "💉" },
  ],

  transportation: [
    { id: "airport-transfer", label: "Airport Transfer", icon: "✈️" },
    { id: "taxi", label: "Taxi", icon: "🚕" },
    { id: "private-driver", label: "Private Driver", icon: "🚘" },
    { id: "shuttle-service", label: "Shuttle Service", icon: "🚐" },
    { id: "car-rental", label: "Car Rental", icon: "🚗" },
    { id: "scooter-rental", label: "Scooter Rental", icon: "🛵" },
    { id: "bike-rental", label: "Bike Rental", icon: "🚲" },
    { id: "bike-repair", label: "Bike Repair", icon: "🛠️" },
    { id: "scooter-repair", label: "Scooter Repair", icon: "🛠️" },
  ],

  // ✅ NEW CATEGORY: Auto Services (kept minimal & service-focused)
  "auto-services": [
    { id: "mechanic", label: "Mechanic / Auto Repair", icon: "🔧" },
    { id: "inspection-ipo", label: "Inspection (IPO) Help", icon: "✅" },
    { id: "tires", label: "Tires", icon: "🛞" },
    { id: "car-detailing", label: "Car Detailing", icon: "✨" },
    { id: "auto-electrician", label: "Auto Electrician", icon: "⚡" },
  ],

  pets: [
    { id: "veterinarian", label: "Veterinarian", icon: "🐾" },
    { id: "grooming", label: "Grooming", icon: "✂️" },
    { id: "dog-walker", label: "Dog Walker", icon: "🚶‍♂️" },
    { id: "pet-sitting", label: "Pet Sitting", icon: "🐕" },
    { id: "pet-boarding", label: "Pet Boarding / Hotel", icon: "🏨" },
    { id: "pet-taxi", label: "Pet Taxi", icon: "🚕" },
    { id: "pet-supplies", label: "Pet Supplies", icon: "🦴" },
    { id: "pet-training", label: "Dog Training", icon: "🦮" },
  ],

  "events-entertainment": [
    { id: "dj", label: "DJ / Music", icon: "🎧" },
    { id: "live-music", label: "Live Music", icon: "🎤" },
    { id: "event-planner", label: "Event Planner", icon: "🎪" },
    { id: "kids-parties", label: "Kids Parties", icon: "🥳" },
    { id: "event-decoration", label: "Event Decoration", icon: "🎈" },
    { id: "party-rental", label: "Party Rentals", icon: "🪑" },
    { id: "wedding-planner", label: "Wedding Planner", icon: "💍" },
  ],

  professional: [
    { id: "photography", label: "Photographer", icon: "📸" },
    { id: "video-maker", label: "Video Maker", icon: "🎥" },
    { id: "it-service", label: "IT Services", icon: "💻" },
    { id: "translation", label: "Translation", icon: "🌐" },
    { id: "consulting", label: "Business Consulting", icon: "📈" },
    { id: "insurance-broker", label: "Insurance Broker", icon: "📋" },
    { id: "accountant", label: "Accountant", icon: "📊" },
    { id: "coworking", label: "Coworking Space", icon: "🏢" },
    { id: "web-design", label: "Web Design & Dev", icon: "🖥️" },
    { id: "digital-marketing", label: "Digital Marketing", icon: "📣" },
    { id: "hr-recruitment", label: "HR & Recruitment", icon: "👥" },

    // ✅ NEW (kept)
    { id: "mortgage-broker", label: "Mortgage Broker", icon: "🏦" },
    { id: "financial-advisor", label: "Financial Advisor", icon: "💶" },
  ],
};

/* ---------- LOCALIZATION HELPERS ---------- */

export const getCategoryLabel = (id: CategoryId, isPT: boolean): string => {
  if (!isPT) return CATEGORIES.find((c) => c.id === id)?.label ?? id;

  switch (id) {
    case "all":
      return "Todos";
    case "real-estate":
      return "Imobiliário";
    case "home-services":
      return "Serviços para Casa";
    case "hosting":
      return "Gestão de Alojamento";
    case "food":
      return "Comida & Restauração";
    case "legal-bureaucracy":
      return "Legal & Fiscal";
    case "relocation-expat":
      return "Relocação & Integração";
    case "family-care":
      return "Família & Cuidados";
    case "education-courses":
      return "Educação & Cursos";
    case "wellness-beauty":
      return "Bem-estar & Beleza";
    case "sports-outdoors":
      return "Desporto & Ar Livre";
    case "medical":
      return "Saúde";
    case "transportation":
      return "Transportes";
    case "auto-services":
      return "Serviços Auto";
    case "pets":
      return "Animais de Estimação";
    case "events-entertainment":
      return "Eventos & Entretenimento";
    case "professional":
      return "Serviços Profissionais";
    default:
      return CATEGORIES.find((c) => c.id === id)?.label ?? id;
  }
};

export const getSubcategoryLabel = (
  categoryId: CategoryId,
  subId: string,
  isPT: boolean
): string => {
  if (!isPT) {
    return (
      SUBCATEGORIES[categoryId]?.find((s) => s.id === subId)?.label ?? subId
    );
  }

  switch (categoryId) {
    case "real-estate":
      switch (subId) {
        case "real-estate-agent":
          return "Agente Imobiliário";
        case "property-management":
          return "Gestão de Propriedades";
        case "architect":
          return "Arquiteto";
        case "contractor":
          return "Empreiteiro";
        case "notary":
          return "Notário";
        case "home-staging":
          return "Home Staging";
        case "renovation":
          return "Renovações";
      }
      break;

    case "home-services":
      switch (subId) {
        case "cleaning":
          return "Limpezas";
        case "handyman":
          return "Faz-tudo";
        case "plumber":
          return "Canalizador";
        case "electrician":
          return "Electricista";
        case "carpenter":
          return "Carpinteiro";
        case "gardener":
          return "Jardineiro";
        case "pest-control":
          return "Desinfestação";
        case "roofer":
          return "Coberturas / Telhados";
        case "painter":
          return "Pintor";
        case "glazier":
          return "Vidros / Janelas";
        case "pool-service":
          return "Manutenção de Piscinas";
        case "appliance-repair":
          return "Reparação de Eletrodomésticos";
        case "solar-photovoltaics":
          return "Painéis Solares";
        case "security-systems":
          return "Sistemas de Segurança";
        case "locksmith":
          return "Serralheiro";
        case "aircon-hvac":
          return "Ar Condicionado / AVAC";
        case "moving-company":
          return "Empresa de Mudanças";

        // ✅ NEW
        case "window-cleaning":
          return "Limpeza de Janelas";
        case "sofa-upholstery-cleaning":
          return "Limpeza de Sofás & Estofos (tecido/pele)";
        case "waterproofing-mold":
          return "Impermeabilização / Humidades & Bolor";
        case "interior-designer":
          return "Designer de Interiores";
      }
      break;

    case "hosting":
      switch (subId) {
        case "airbnb-management":
          return "Gestão Airbnb";
        case "key-holding":
          return "Guarda de Chaves";
        case "guest-reception":
          return "Receção de Hóspedes";
        case "laundry-rentals":
          return "Lavandaria para Alojamento";
        case "home-checks":
          return "Vistorias à Casa";
      }
      break;

    case "food":
      switch (subId) {
        case "restaurant":
          return "Restaurante";
        case "cafe":
          return "Café";
        case "private-chef":
          return "Chef Privado";
        case "catering":
          return "Catering";
        case "meal-prep":
          return "Refeições / Entrega";
        case "bakery":
          return "Padaria";
        case "wine-spirits":
          return "Vinhos & Bebidas";
      }
      break;

    case "legal-bureaucracy":
      switch (subId) {
        case "lawyer":
          return "Advogado";
        case "tax-advisor":
          return "Consultor Fiscal";
      }
      break;

    case "relocation-expat":
      switch (subId) {
        case "immigration-residency":
          return "Imigração / Residência";
        case "nif-bank":
          return "NIF & Conta Bancária";
        case "documentation-help":
          return "Apoio Administrativo";
        case "relocation-agency":
          return "Agência de Relocation";
        case "settling-in-services":
          return "Serviços de Integração";
      }
      break;

    case "family-care":
      switch (subId) {
        case "babysitting":
          return "Babysitting";
        case "nanny":
          return "Ama / Nanny";
        case "elderly-care":
          return "Cuidados a Idosos";
        case "kindergarten-daycare":
          return "Infantário / Creche";
        case "summer-camp":
          return "Campo de Férias";
        case "special-needs":
          return "Apoio Necessidades Especiais";
        // ✅ NEW
        case "after-school":
          return "ATL / Atividades Pós-Aulas";
      }
      break;

    case "education-courses":
      switch (subId) {
        case "language-school":
          return "Escola de Línguas";
        case "tutoring":
          return "Explicações";
        case "school-advice":
          return "Apoio na Escolha de Escola";
        case "music-school":
          return "Escola de Música";
        case "dance-school":
          return "Escola de Dança";
      }
      break;

    case "wellness-beauty":
      switch (subId) {
        case "massage":
          return "Massagem";
        case "yoga":
          return "Yoga";
        case "pilates":
          return "Pilates";
        case "spa":
          return "Spa";
        case "hair-salon":
          return "Cabeleireiro";
        case "barber":
          return "Barbeiro";
        case "dermatology-botox":
          return "Medicina Estética / Botox";
        case "nutritionist":
          return "Nutricionista";
        case "physiotherapy":
          return "Fisioterapia";
        case "osteopath":
          return "Osteopata";
        case "psychologist":
          return "Psicólogo";
        case "acupuncture":
          return "Acupunctura";
        case "personal-training":
          return "Treino Personalizado";
      }
      break;

    case "sports-outdoors":
      switch (subId) {
        case "surf-school":
          return "Escola de Surf";
        case "padel":
          return "Pádel";
        case "gym-fitness":
          return "Ginásio & Fitness";
        case "running-club":
          return "Clube de Corrida";
        case "swimming":
          return "Natação & Aquáticos";
        case "golf":
          return "Golfe";
        case "tennis":
          return "Ténis";
        case "cycling":
          return "Ciclismo";
        case "martial-arts":
          return "Artes Marciais";
        case "sailing-school":
          return "Escola de Vela";
        case "boat-tours":
          return "Passeios de Barco";
        case "horse-riding":
          return "Equitação";
      }
      break;

    case "medical":
      switch (subId) {
        case "gp":
          return "Clínico Geral";
        case "clinic-urgent-care":
          return "Clínica / Urgências";
        case "laboratory":
          return "Análises Clínicas";
        case "imaging":
          return "Imagiologia";
        case "dentist":
          return "Dentista";
        case "pediatrics":
          return "Pediatria";
        case "gynecology":
          return "Ginecologia";
        case "orthopedist":
          return "Ortopedista";
        case "dermatologist":
          return "Dermatologista";
        case "vaccinations-travel":
          return "Vacinas / Viagem";
      }
      break;

    case "transportation":
      switch (subId) {
        case "airport-transfer":
          return "Transfer Aeroporto";
        case "taxi":
          return "Táxi";
        case "private-driver":
          return "Motorista Privado";
        case "shuttle-service":
          return "Shuttle";
        case "car-rental":
          return "Aluguer de Carro";
        case "scooter-rental":
          return "Aluguer de Scooter";
        case "bike-rental":
          return "Aluguer de Bicicleta";
        case "bike-repair":
          return "Reparação de Bicicleta";
        case "scooter-repair":
          return "Reparação de Scooter";
      }
      break;

    case "auto-services":
      switch (subId) {
        case "mechanic":
          return "Mecânico / Reparação Auto";
        case "inspection-ipo":
          return "Inspeção (IPO)";
        case "tires":
          return "Pneus";
        case "car-detailing":
          return "Detailing Auto";
        case "auto-electrician":
          return "Eletricista Auto";
      }
      break;

    case "pets":
      switch (subId) {
        case "veterinarian":
          return "Veterinário";
        case "grooming":
          return "Grooming / Tosquia";
        case "dog-walker":
          return "Dog Walker";
        case "pet-sitting":
          return "Pet Sitting";
        case "pet-boarding":
          return "Hotel para Animais";
        case "pet-taxi":
          return "Táxi para Animais";
        case "pet-supplies":
          return "Loja de Animais";
        case "pet-training":
          return "Treino Canino";
      }
      break;

    case "events-entertainment":
      switch (subId) {
        case "dj":
          return "DJ / Música";
        case "live-music":
          return "Música ao Vivo";
        case "event-planner":
          return "Organização de Eventos";
        case "kids-parties":
          return "Festas Infantis";
        case "event-decoration":
          return "Decoração de Eventos";
        case "party-rental":
          return "Aluguer para Festas";
        case "wedding-planner":
          return "Wedding Planner";
      }
      break;

    case "professional":
      switch (subId) {
        case "photography":
          return "Fotógrafo";
        case "video-maker":
          return "Video Maker";
        case "it-service":
          return "Serviços de TI";
        case "translation":
          return "Tradução";
        case "consulting":
          return "Consultoria";
        case "insurance-broker":
          return "Mediador de Seguros";
        case "accountant":
          return "Contabilista";
        case "coworking":
          return "Coworking";
        case "web-design":
          return "Web Design & Desenvolvimento";
        case "digital-marketing":
          return "Marketing Digital";
        case "hr-recruitment":
          return "RH & Recrutamento";
        // ✅ NEW
        case "mortgage-broker":
          return "Intermediário de Crédito";
        case "financial-advisor":
          return "Consultor Financeiro";
      }
      break;
  }

  return SUBCATEGORIES[categoryId]?.find((s) => s.id === subId)?.label ?? subId;
};
