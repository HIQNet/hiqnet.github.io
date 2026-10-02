export interface ProjectImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface ProjectPresentation {
  name: string;
  title: string;
  sector: string;
  summary: string;
  preview?: {
    problem: string;
    intervention: string;
    system: string;
    image?: ProjectImage;
  };
  context: string;
  problem: string;
  intervention: string;
  system: string;
  flow: readonly string[];
  scope: string;
  image: ProjectImage;
  gallery: readonly ProjectImage[];
}

export const featuredProjectIds = [
  "about-laTerraza",
  "about-bienesRaices",
  "about-SWI",
] as const;

// Capa editorial de las fichas originales: las capturas documentan interfaces,
// no acreditan despliegues, adopción ni resultados operativos medidos.
export const projectPresentations: Record<string, ProjectPresentation> = {
  "about-laTerraza": {
    name: "La Terraza",
    title: "Un catálogo, dos lados de la operación.",
    sector: "Restauración",
    summary: "Administración de productos, menú digital y cuenta de usuario para una cafetería.",
    preview: {
      problem: "Menús impresos difíciles de actualizar y poca claridad sobre la disponibilidad de productos.",
      intervention: "Administración de productos con precio, categoría, imagen, estado y puntos.",
      system: "Un catálogo que conecta la gestión del negocio con el menú digital y la cuenta del usuario.",
      image: {
        src: "/img/LaTerraza/admin/Captura4.PNG",
        alt: "Listado administrativo de La Terraza con precios, estados, categorías y puntos de los productos",
        caption: "Administración del catálogo de productos.",
        width: 1360,
        height: 643,
      },
    },
    context: "La Terraza necesitaba mantener su menú actualizado y comunicar la disponibilidad de los productos. El proyecto reúne la administración del catálogo y la consulta desde el menú digital.",
    problem: "Los menús impresos dificultaban actualizar la oferta. Los pedidos manuales y la falta de información sobre disponibilidad complicaban la atención.",
    intervention: "Administración de productos con precio, categoría, estado e imágenes, junto con un menú digital y un perfil de usuario con puntos.",
    system: "El catálogo vincula la administración con la consulta del menú. El usuario navega por categorías, consulta productos y accede a su cuenta y a las secciones de cupones.",
    flow: ["Administración", "Catálogo", "Menú", "Cuenta y puntos"],
    scope: "La presentación abarca catálogo, administración y cuenta de usuario, con datos de prueba en algunas pantallas. El flujo de cocina no forma parte del recorrido mostrado.",
    image: {
      src: "/img/LaTerraza/laterraza.webp",
      alt: "Mostrador y zona de atención del establecimiento La Terraza",
      caption: "El entorno de atención de La Terraza. Fotografía de contexto del proyecto.",
      width: 1600,
      height: 956,
    },
    gallery: [
      { src: "/img/LaTerraza/admin/Captura.PNG", alt: "Formulario de edición de empleado en la administración de La Terraza", caption: "Edición de empleado: datos de contacto, tipo y estado.", width: 1361, height: 639 },
      { src: "/img/LaTerraza/admin/Captura2.PNG", alt: "Formulario de producto con imagen, precio, categoría, puntos y estado", caption: "Edición de los datos y la disponibilidad de un producto.", width: 1350, height: 630 },
      { src: "/img/LaTerraza/admin/Captura3.PNG", alt: "Herramienta de recorte de la imagen de un producto", caption: "Ajuste de imágenes dentro de la edición del catálogo.", width: 1364, height: 647 },
      { src: "/img/LaTerraza/admin/Captura4.PNG", alt: "Listado administrativo de productos con precios, estados, categorías y puntos", caption: "Consulta y acceso a la edición de productos.", width: 1360, height: 643 },
      { src: "/img/LaTerraza/cliente/Captura1.png", alt: "Menú digital de La Terraza con categorías y listado de platillos", caption: "Consulta del menú por categoría: platillos.", width: 1902, height: 909 },
      { src: "/img/LaTerraza/cliente/Captura4.png", alt: "Categoría de bebidas del menú digital de La Terraza", caption: "Listado de bebidas con imagen, descripción y precio.", width: 1901, height: 910 },
      { src: "/img/LaTerraza/cliente/Captura5.png", alt: "Categoría Otros con productos del menú digital de La Terraza", caption: "Productos de la categoría Otros.", width: 1906, height: 908 },
      { src: "/img/LaTerraza/cliente/Captura2.png", alt: "Perfil de una cuenta de prueba con identificador y saldo de puntos", caption: "Perfil de usuario y puntos, con datos de prueba.", width: 1911, height: 906 },
      { src: "/img/LaTerraza/cliente/Captura3.png", alt: "Detalle de chilaquiles verdes con fotografía, descripción y valor en puntos", caption: "Consulta del detalle de un platillo.", width: 1906, height: 908 },
    ],
  },
  "about-bienesRaices": {
    name: "Bienes Raíces",
    title: "De encontrar una propiedad a iniciar contacto.",
    sector: "Inmobiliario",
    summary: "Catálogo web con búsqueda geográfica, filtros y contacto con el vendedor.",
    preview: {
      problem: "Relacionar ubicación, tipo y precio para encontrar una propiedad y contactar a quien la publica.",
      intervention: "Catálogo con filtros, mapa, fichas de propiedad y mensajería.",
      system: "Del mapa al detalle de la propiedad; del detalle al mensaje al vendedor.",
    },
    context: "Una plataforma web para explorar propiedades y contactar al vendedor desde el mismo recorrido de consulta.",
    problem: "Buscar una propiedad requiere relacionar ubicación, tipo y precio, y encontrar cómo contactar a quien publica.",
    intervention: "Catálogo con filtros, mapa con marcadores, fichas de propiedad y formulario de contacto, acompañado de una bandeja de mensajes.",
    system: "La búsqueda lleva del mapa o el listado al detalle de una propiedad. Desde ahí, el visitante puede redactar un mensaje que aparece en la consulta de mensajes del vendedor.",
    flow: ["Catálogo y mapa", "Filtros", "Propiedad", "Mensaje"],
    scope: "Proyecto sin cliente identificado. Las interfaces web incluyen datos de prueba y se centran en búsqueda y contacto, no en el cierre de transacciones.",
    image: {
      src: "/img/BienesRaices/bienesRaices.webp",
      alt: "Mapa de propiedades en la zona de Guadalajara con filtros de categoría y precio",
      caption: "La ubicación como punto de entrada a la consulta de propiedades.",
      width: 1913,
      height: 911,
    },
    gallery: [
      { src: "/img/BienesRaices/2.webp", alt: "Selector de categorías de propiedad sobre un mapa", caption: "Filtro por tipo de propiedad, con Departamento seleccionado.", width: 1906, height: 905 },
      { src: "/img/BienesRaices/3.webp", alt: "Selector de rangos de precio para filtrar propiedades en el mapa", caption: "Filtro por rango de precio.", width: 1913, height: 912 },
      { src: "/img/BienesRaices/4.webp", alt: "Ficha emergente de un departamento con fotografía y precio sobre el mapa", caption: "Vista previa de una propiedad desde su marcador.", width: 1916, height: 913 },
      { src: "/img/BienesRaices/5.webp", alt: "Listado de casas y departamentos con fotografías, características y precios", caption: "Catálogo de propiedades organizado por tipo.", width: 1916, height: 909 },
      { src: "/img/BienesRaices/6.webp", alt: "Detalle de un departamento con características, ubicación y formulario de mensaje", caption: "Información de la propiedad y contacto con el vendedor.", width: 1907, height: 912 },
      { src: "/img/BienesRaices/7.webp", alt: "Bandeja de mensajes con una consulta enviada por un usuario de prueba", caption: "Consulta de mensajes; los datos visibles son de prueba.", width: 1310, height: 442 },
    ],
  },
  "about-SWI": {
    name: "Servicios Web Icono",
    title: "Ordenar la información para abrir la conversación.",
    sector: "Servicios empresariales",
    summary: "Rediseño corporativo para presentar servicios, explorar proyectos y facilitar el contacto.",
    preview: {
      problem: "Información desactualizada y navegación poco clara para consultar los servicios de la empresa.",
      intervention: "Reorganización de servicios, portafolio y contacto, con formulario y mapa.",
      system: "Un recorrido desde la oferta de la empresa hasta sus canales de contacto.",
    },
    context: "Rediseño del sitio corporativo de Servicios Web Icono, con una estructura que reúne presentación de la empresa, servicios, portafolio y contacto.",
    problem: "La información desactualizada y una navegación poco intuitiva dificultaban la consulta de los servicios de la empresa.",
    intervention: "Se reorganizó la presentación del sitio, con secciones de servicios y portafolio, detalles de proyectos y un área de contacto con formulario y mapa.",
    system: "La estructura conecta la presentación de la empresa con su oferta y sus proyectos. El recorrido termina en canales de contacto visibles para iniciar una conversación.",
    flow: ["Empresa", "Servicios", "Portafolio", "Contacto"],
    scope: "Las capturas corresponden al diseño del sitio e incluyen algunos textos de prueba. Los proyectos que aparecen dentro de su portafolio pertenecen a Servicios Web Icono.",
    image: {
      src: "/img/SWI/SWI-1.png",
      alt: "Inicio del sitio de Servicios Web Icono presentado en un mockup de portátil",
      caption: "Presentación de servicios en la página de inicio.",
      width: 907,
      height: 611,
    },
    gallery: [
      { src: "/img/SWI/SWI-2.png", alt: "Sección Nosotros de Servicios Web Icono en un mockup de portátil", caption: "Presentación de la empresa y su misión.", width: 1345, height: 774 },
      { src: "/img/SWI/SWI-3.png", alt: "Sección de servicios web de Servicios Web Icono", caption: "Organización de la oferta de servicios del sitio rediseñado.", width: 1346, height: 774 },
      { src: "/img/SWI/SWI-4.png", alt: "Portafolio de Servicios Web Icono agrupado en web, aplicaciones y marketing", caption: "Acceso a proyectos por área de servicio.", width: 1344, height: 768 },
      { src: "/img/SWI/SWI-5.png", alt: "Modal de un proyecto del portafolio de Servicios Web Icono con texto de relleno", caption: "Detalle de un proyecto del portafolio en un modal.", width: 1340, height: 791 },
      { src: "/img/SWI/SWI-6.png", alt: "Sección de contacto de Servicios Web Icono con teléfono, correo, ubicación y formulario", caption: "Información de contacto de Servicios Web Icono.", width: 1346, height: 785 },
      { src: "/img/SWI/SWI-7.png", alt: "Formulario de contacto, mapa y pie de página de Servicios Web Icono", caption: "Formulario y cierre del recorrido de contacto.", width: 1342, height: 772 },
    ],
  },
  "about-gestion-medica": {
    name: "Gestión Médica",
    title: "Un catálogo común para una red médica.",
    sector: "Gestión de servicios médicos",
    summary: "Catálogos de médicos, hospitales y servicios con responsables de actualización y consulta por entidad.",
    context: "Un proyecto de gestión de información para una red médica, organizado alrededor de catálogos y responsabilidades de actualización.",
    problem: "La coordinación por correo y hojas de cálculo dificultaba mantener los catálogos al día y consultar la información.",
    intervention: "Captura y consulta de médicos, hospitales y servicios, con características, costos, roles de usuario y supervisión administrativa.",
    system: "La actualización corresponde a responsables regionales y la supervisión a una administración central. La consulta organiza la información por entidad, hospital y servicio.",
    flow: ["Captura", "Catálogo", "Supervisión", "Consulta"],
    scope: "La documentación menciona al Instituto de Servicios Médicos Mexicanos, pero identifica a UTJ como cliente; la relación entre ambos no está aclarada. Se presenta el alcance descrito, sin confirmar despliegue en producción. La fotografía es contextual y no representa a un cliente.",
    image: {
      src: "/img/blog/hospital.webp",
      alt: "Fotografía del Hospital La Fe de la Generalitat Valenciana, utilizada como imagen de contexto",
      caption: "Fotografía de contexto: Hospital La Fe, Valencia.",
      width: 768,
      height: 510,
    },
    gallery: [],
  },
  "about-webService": {
    name: "NumerIQ",
    title: "La estructura detrás de una tutoría.",
    sector: "Educación en línea",
    summary: "Webservice y backend para organizar usuarios, tutorías de matemáticas y seguimiento académico.",
    context: "Desarrollo backend para NumerIQ, una plataforma de tutorías de matemáticas centrada en el seguimiento de cada estudiante.",
    problem: "Las tutorías personalizadas necesitan una estructura para relacionar usuarios, sesiones y progreso académico, sin perder el contexto de cada estudiante.",
    intervention: "Gestión de usuarios, sesiones de tutoría y registro del progreso académico.",
    system: "La cuenta del usuario conecta sus sesiones de tutoría con el seguimiento de su progreso académico.",
    flow: ["Usuario", "Tutoría", "Seguimiento"],
    scope: "El alcance backend procede de la descripción del proyecto. El material disponible incluye una portada y un diseño en Figma, no una demo funcional del sistema.",
    image: {
      src: "/img/blog/designWebServices.webp",
      alt: "Captura de la portada de NumerIQ con navegación a cursos y tutorías",
      caption: "Portada de NumerIQ incluida en la documentación del proyecto.",
      width: 1100,
      height: 547,
    },
    gallery: [],
  },
};

export function getProjectPresentation(id: string): ProjectPresentation {
  const presentation = projectPresentations[id];
  if (!presentation) {
    throw new Error(`Falta la presentación editorial del proyecto: ${id}`);
  }
  return presentation;
}
