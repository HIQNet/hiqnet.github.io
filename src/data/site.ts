export const site = {
  name: "HiQNet",
  title: "HiQNet | Software y automatización para empresas",
  description:
    "Desarrollamos software, automatizaciones y sitios web para PyMEs que quieren operar con procesos más simples y claros.",
  url: "https://hiqnet.github.io",
  email: "hiqnet.web@gmail.com",
  whatsapp: "523325689263",
  whatsappMessage:
    "Hola, encontré HiQNet desde su sitio web y me gustaría platicarles sobre un proyecto.",
  foundedYear: 2023,
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61577480559100",
    instagram: "https://www.instagram.com/hiqnet_solutions/",
  },
} as const;

export const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const serviceLinks = [
  { label: "HiQNet Web", href: "#soluciones" },
  { label: "HiQNet Automate", href: "#soluciones" },
  { label: "HiQNet Business", href: "#soluciones" },
] as const;

export const whatsappUrl = (message: string = site.whatsappMessage) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

export const yearsOperating = Math.max(1, new Date().getFullYear() - site.foundedYear);
