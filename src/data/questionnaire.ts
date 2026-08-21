/**
 * Definición declarativa del flujo de cotización.
 * El panel (QuotePanel + scripts/quote.ts) renderiza estos datos;
 * agregar o quitar pasos no requiere tocar la lógica del panel.
 */

export type ProjectType = "web" | "sistema" | "automatizacion";
export type Objective = "presencia" | "ventas" | "gestion";
export type Integrations = "ninguna" | "pocas" | "muchas";
export type Timeline = "normal" | "rapido" | "urgente";

/** Respuestas completas del cuestionario. */
export interface QuoteAnswers {
  projectType: ProjectType;
  objective: Objective;
  features: string[];
  integrations: Integrations;
  timeline: Timeline;
}

export interface QuoteOption {
  value: ProjectType | Objective | Integrations | Timeline | string;
  label: string;
  description?: string;
  icon: string;
}

export interface QuoteStep {
  id: "projectType" | "objective" | "features" | "integrations" | "timeline";
  title: string;
  hint?: string;
  /** Selección múltiple de opciones. */
  multi?: boolean;
  options: QuoteOption[];
}

export const quoteSteps: QuoteStep[] = [
  {
    id: "projectType",
    title: "¿Qué quieres construir?",
    options: [
      {
        value: "web",
        label: "Sitio web",
        description: "Presencia digital, landing o sitio corporativo.",
        icon: "fas fa-globe",
      },
      {
        value: "sistema",
        label: "Sistema empresarial",
        description: "Aplicación web para operar y gestionar tu negocio.",
        icon: "fas fa-laptop-code",
      },
      {
        value: "automatizacion",
        label: "Automatización / API",
        description: "Integrar sistemas y automatizar procesos manuales.",
        icon: "fas fa-code-branch",
      },
    ],
  },
  {
    id: "objective",
    title: "¿Cuál es el objetivo principal?",
    options: [
      {
        value: "presencia",
        label: "Presencia en línea",
        description: "Que encuentren mi negocio y muestre mis servicios.",
        icon: "fas fa-bullhorn",
      },
      {
        value: "ventas",
        label: "Vender en línea",
        description: "Tienda, pagos o generación de clientes.",
        icon: "fas fa-cart-shopping",
      },
      {
        value: "gestion",
        label: "Gestión interna",
        description: "Controlar procesos, inventario, usuarios u operaciones.",
        icon: "fas fa-diagram-project",
      },
    ],
  },
  {
    id: "features",
    title: "¿Qué funcionalidades necesitas?",
    hint: "Selecciona todas las que apliquen.",
    multi: true,
    options: [
      { value: "auth", label: "Usuarios y roles", icon: "fas fa-users" },
      { value: "pagos", label: "Pasarela de pago", icon: "fas fa-credit-card" },
      { value: "panel-admin", label: "Panel administrativo", icon: "fas fa-sliders" },
      { value: "blog", label: "Blog / noticias", icon: "fas fa-newspaper" },
      { value: "galeria", label: "Galería / portafolio", icon: "fas fa-images" },
      { value: "multi-idioma", label: "Multi-idioma", icon: "fas fa-language" },
      { value: "notificaciones", label: "Notificaciones", icon: "fas fa-bell" },
      { value: "reportes", label: "Reportes / dashboard", icon: "fas fa-chart-line" },
    ],
  },
  {
    id: "integrations",
    title: "¿Necesita conectarse con otros sistemas?",
    options: [
      { value: "ninguna", label: "No", description: "Todo vive en un solo sistema.", icon: "fas fa-circle-check" },
      { value: "pocas", label: "1–2 integraciones", description: "Ej. pagos, WhatsApp, correo.", icon: "fas fa-plug" },
      { value: "muchas", label: "3 o más", description: "ERP, CRM, APIs externas, legacy.", icon: "fas fa-network-wired" },
    ],
  },
  {
    id: "timeline",
    title: "¿Cuándo lo necesitas?",
    options: [
      { value: "normal", label: "Sin prisa", description: "2–4 meses, plan estándar.", icon: "fas fa-calendar" },
      { value: "rapido", label: "Rápido", description: "2–3 meses, prioridad media.", icon: "fas fa-clock" },
      { value: "urgente", label: "Urgente", description: "Menos de 6 semanas.", icon: "fas fa-bolt" },
    ],
  },
];
