export const transformation = [
  { number: "01", label: "Dispersión", title: "Todo empieza disperso.", copy: "Una tarea vive en un mensaje. Otra, en una hoja de cálculo. El contexto depende de quién tiene la última versión.", diagram: "--connection:0;--flow:0;--system:0;--dispersion:1" },
  { number: "02", label: "Conexión", title: "Conectamos la información.", copy: "Entendemos de dónde vienen los datos, quién los necesita y qué herramientas deben comunicarse. Cada pieza encuentra su lugar.", diagram: "--connection:1;--flow:0;--system:0;--dispersion:0" },
  { number: "03", label: "Automatización", title: "Automatizamos el proceso.", copy: "Definimos reglas para que la información avance sin copiarla una y otra vez. El equipo interviene donde hace falta criterio, no donde sobra trabajo repetido.", diagram: "--connection:1;--flow:1;--system:0;--dispersion:0" },
  { number: "04", label: "Sistema", title: "Construimos alrededor de tu operación.", copy: "Interfaces, datos y procesos dentro de una misma estructura. Software que responde a tu forma de trabajar, no al revés.", diagram: "--connection:1;--flow:1;--system:1;--dispersion:0" },
] as const;

export const method = [
  { title: "Entender", copy: "Revisamos el proceso actual con las personas que lo conocen. Identificamos fricción, dependencias y prioridades antes de proponer software." },
  { title: "Diseñar", copy: "Definimos el flujo, el alcance y la arquitectura. Acordamos qué debe resolver el sistema y cómo vamos a validarlo." },
  { title: "Construir", copy: "Implementamos por iteraciones, con avances que puedas revisar. Organizamos el código para facilitar el mantenimiento y los cambios." },
  { title: "Integrar", copy: "Conectamos las herramientas necesarias y probamos el recorrido completo: datos, permisos y tareas de quienes usarán el sistema." },
  { title: "Evolucionar", copy: "Acompañamos la puesta en marcha y definimos las mejoras que el proyecto requiere. La operación cambia; el software también." },
] as const;

export const engineering = [
  { title: "Interfaz", copy: "El punto de encuentro entre las personas y el proceso: catálogos, consultas y paneles de administración.", evidence: "React · Pug · Filament" },
  { title: "Lógica e integraciones", copy: "Reglas de negocio, servicios y comunicación entre las partes del sistema.", evidence: "Laravel · Java · Node.js / Express" },
  { title: "Datos", copy: "Información relacionada y organizada para consultarla, actualizarla y darle seguimiento.", evidence: "MySQL" },
  { title: "Operación del software", copy: "Accesos, validación y despliegue definidos según los datos, el alcance y el entorno de cada proyecto.", evidence: "Mantenimiento · Control de versiones · Integración" },
] as const;
