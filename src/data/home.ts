export interface Service {
  icon: string;
  title: string;
  description: string;
  /** Objetivos de negocio que cubre el servicio (para filtros). */
  objectives: Array<"presencia" | "ventas" | "gestion">;
}

export const services: Service[] = [
  {
    icon: "fas fa-globe",
    title: "Hospedaje y Dominio",
    description:
      "Asegura tu presencia en internet con un dominio personalizado y un hosting confiable.",
    objectives: ["presencia"],
  },
  {
    icon: "fas fa-code-branch",
    title: "Integración de APIs",
    description:
      "Conectamos tus sistemas mediante APIs REST o SOAP para automatizar procesos y mejorar la conectividad.",
    objectives: ["gestion", "ventas"],
  },
  {
    icon: "fas fa-object-group",
    title: "UI/UX Design",
    description:
      "Creamos interfaces atractivas y fáciles de usar que brindan una mejor experiencia para el usuario.",
    objectives: ["presencia", "gestion", "ventas"],
  },
  {
    icon: "fas fa-laptop-code",
    title: "Aplicaciones Web",
    description:
      "Administra tus negocios con nuestras aplicaciones diseñadas a medida.",
    objectives: ["gestion"],
  },
  {
    icon: "fas fa-code",
    title: "Diseño de Páginas",
    description:
      "Diseñamos páginas web atractivas y funcionales adaptadas a tu negocio.",
    objectives: ["presencia", "ventas"],
  },
  {
    icon: "fas fa-store",
    title: "E-Commerce",
    description: "Vende tus productos con una tienda online fácil de usar.",
    objectives: ["ventas"],
  },
];

/** Etiquetas legibles para los objetivos de los servicios. */
export const objectiveLabels: Record<Service["objectives"][number], string> = {
  presencia: "Presencia",
  ventas: "Ventas",
  gestion: "Gestión",
};

export interface ProcessStep {
  number: string;
  icon: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    icon: "fas fa-magnifying-glass-chart",
    title: "Diagnóstico",
    description:
      "Escuchamos tu problema, analizamos procesos actuales y definimos el alcance real del proyecto.",
  },
  {
    number: "02",
    icon: "fas fa-file-signature",
    title: "Propuesta",
    description:
      "Entregamos un plan claro: funcionalidades, tecnologías, tiempos y presupuesto sin sorpresas.",
  },
  {
    number: "03",
    icon: "fas fa-code",
    title: "Desarrollo",
    description:
      "Construimos por iteraciones con entregas visibles; participas y validas durante todo el camino.",
  },
  {
    number: "04",
    icon: "fas fa-rocket",
    title: "Lanzamiento",
    description:
      "Publicamos, capacitamos a tu equipo y damos seguimiento para que el sistema crezca contigo.",
  },
];

export interface Client {
  name: string;
  /** URL de imagen del logo; si se omite se usa `icon` */
  logo?: string;
  icon?: string;
}

export const clients: Client[] = [
  { name: "ColdFront", icon: "fas fa-water" },
  { name: "Vlock Constructora", logo: "/img/clientes/vlock-logo.webp" },
  { name: "La Terraza", logo: "/img/clientes/La-terraza-White-Logo.webp" },
  {
    name: "Icono Asesores",
    logo: "https://iconoasesores.com.mx/src/img/productos/icono200.png",
  },
];

export interface Stat {
  value: number;
  label: string;
}

export const stats: Stat[] = [
  { value: 2, label: "Años de Experiencia" },
  { value: 12, label: "Proyectos Completados" },
  { value: 8, label: "Empresas Atendidas" },
];

export interface ValueItem {
  term: string;
  description: string;
}

export interface EssenceCard {
  id: string;
  icon: string;
  title: string;
  paragraphs?: string[];
  values?: ValueItem[];
}

export const essenceCards: EssenceCard[] = [
  {
    id: "mision",
    icon: "fas fa-bullseye",
    title: "Misión",
    paragraphs: [
      "En HiQNet, nuestra misión es diseñar y desarrollar soluciones de software innovadoras que impulsen la transformación digital de las empresas. Creamos sistemas eficientes, personalizados y escalables que optimicen procesos y mejoren la experiencia de los usuarios.",
    ],
  },
  {
    id: "vision",
    icon: "fas fa-eye",
    title: "Visión",
    paragraphs: [
      "Ser una empresa líder en desarrollo de software a nivel nacional, reconocida por calidad, innovación y compromiso. Aspiramos a ser aliados estratégicos de empresas que buscan evolucionar tecnológicamente.",
    ],
  },
  {
    id: "valores",
    icon: "fas fa-heart",
    title: "Valores",
    values: [
      { term: "Innovación", description: "Soluciones creativas, modernas y útiles." },
      { term: "Transparencia", description: "Comunicación clara y honesta." },
      { term: "Compromiso", description: "Excelencia y cumplimiento." },
      { term: "Calidad", description: "Resultados sólidos y eficientes." },
      { term: "Trabajo en equipo", description: "Colaboración para lograr objetivos." },
    ],
  },
];

export interface Testimonial {
  quote: string;
  initials: string;
  author: string;
  role: string;
}

export const testimonials: Testimonial[] = [
  {
    quote: "El software es una gran combinación entre arte e ingeniería.",
    initials: "BG",
    author: "Bill Gates",
    role: "Cofundador de Microsoft",
  },
  {
    quote:
      "La máquina analítica no tiene pretensiones de originar nada. Puede hacer cualquier cosa que sepamos ordenarle que realice.",
    initials: "AL",
    author: "Ada Lovelace",
    role: "Primera programadora",
  },
  {
    quote: "Hablar es barato. Muéstrame el código.",
    initials: "LT",
    author: "Linus Torvalds",
    role: "Creador de Linux",
  },
];
