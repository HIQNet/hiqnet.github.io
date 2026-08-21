export const site = {
  name: "HiQNet",
  title: "HiQNet | Consultoría de Software",
  description:
    "Consultoría y desarrollo de software: aplicaciones web, APIs, UI/UX, e-commerce y hospedaje.",
  email: "hiqnet.web@gmail.com",
  /** Número WhatsApp en formato internacional sin "+" ni espacios. */
  whatsapp: "523325689263",
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61577480559100",
    instagram: "https://www.instagram.com/hiqnet_solutions/",
  },
  schedule: "Lunes a Viernes: 9am - 8pm",
} as const;

export const navLinks = [
  { label: "Inicio", hash: "#home" },
  { label: "Nosotros", hash: "#about" },
  { label: "Servicios", hash: "#services" },
  { label: "Portafolio", hash: "#portfolio" },
  { label: "Contacto", hash: "#contact" },
] as const;

/** Enlaces del footer que apuntan a secciones del home */
export const footerSectionLinks = [
  { label: "Inicio", hash: "#home" },
  { label: "Servicios", hash: "#services" },
  { label: "Nosotros", hash: "#about" },
  { label: "Portafolio", hash: "#portfolio" },
  { label: "Contacto", hash: "#contact" },
] as const;
