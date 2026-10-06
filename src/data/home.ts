/**
 * Editorial content for the home page. Typed data, not documents: it is the
 * copy that carries the commercial narrative of HiQNet.
 */

export interface ApproachStep {
  title: string;
  copy: string;
}

export const approach: readonly ApproachStep[] = [
  {
    title: "Entendemos",
    copy: "Revisamos cómo trabajas hoy, qué se atora y qué información importa. Con las personas que conocen el proceso a fondo.",
  },
  {
    title: "Diseñamos",
    copy: "Definimos las pantallas, los flujos y el alcance. Acordamos qué se va a construir antes de construir nada.",
  },
  {
    title: "Construimos",
    copy: "Entregamos software confiable por etapas que puedes probar, y seguimos cerca después de lanzarlo.",
  },
] as const;

export const homeScenario =
  "Cuando la información queda repartida entre hojas, chats y memoria, el trabajo se vuelve más lento. Diseñamos la herramienta que vuelve a conectar esas piezas.";

export interface Capability {
  id: string;
  name: string;
  copy: string;
  meta: string;
}

export const capabilities: readonly Capability[] = [
  {
    id: "hiqnet-web",
    name: "HiQNet Web",
    copy: "Sitios y plataformas web para que tus clientes encuentren lo que ofreces y hagan lo que necesitan: cotizar, agendar, comprar o consultar.",
    meta: "Sitios corporativos · Catálogos · Plataformas",
  },
  {
    id: "hiqnet-automate",
    name: "HiQNet Automate",
    copy: "Conectamos las herramientas que ya usas para que la información viaje sola. Lo que se hacía a mano, ahora se hace a tiempo.",
    meta: "Integraciones · APIs · Sincronización",
  },
  {
    id: "hiqnet-business",
    name: "HiQNet Business",
    copy: "Sistemas internos para que pedidos, inventarios, clientes y seguimiento vivan en un mismo lugar, con reglas claras de quién hace qué.",
    meta: "Sistemas de gestión · Software a medida",
  },
] as const;

export interface EngineeringLayer {
  icon: "layers" | "plug" | "database" | "shield-check";
  title: string;
  copy: string;
  evidence: string;
}

export const engineeringLayers: readonly EngineeringLayer[] = [
  {
    icon: "layers",
    title: "Interfaz",
    copy: "Pantallas claras y rápidas para las personas que van a usarlas todos los días.",
    evidence: "React · Filament",
  },
  {
    icon: "plug",
    title: "Integraciones",
    copy: "Comunicación entre sistemas: reglas de negocio, APIs y sincronización de datos.",
    evidence: "Laravel · Java · Node.js / Express",
  },
  {
    icon: "database",
    title: "Datos",
    copy: "Información confiable y consultable, ordenada para usarla en las decisiones del día a día.",
    evidence: "MySQL",
  },
  {
    icon: "shield-check",
    title: "Entrega",
    copy: "Accesos, validación y despliegue definidos por proyecto. Y acompañamiento después de entregar.",
    evidence: "Mantenimiento · Control de versiones",
  },
] as const;

export const engineeringNote =
  "Las tecnologías citadas aparecen en nuestros proyectos. Las medidas de operación se definen para el alcance de cada solución.";
