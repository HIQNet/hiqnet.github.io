export const site = {
  name: "HiQNet",
  title: "HiQNet | Software y automatización para empresas",
  description:
    "Software construido alrededor de tu operación. Conectamos información, automatizamos procesos y desarrollamos plataformas web y sistemas para empresas y PyMEs.",
  url: "https://hiqnet.github.io",
  email: "hiqnet.web@gmail.com",
  whatsapp: "523325689263",
  whatsappMessage:
    "Hola, encontré HiQNet y me gustaría conversar sobre cómo funciona la operación de mi empresa.",
  foundedYear: 2023,
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61577480559100",
    instagram: "https://www.instagram.com/hiqnet_solutions/",
  },
} as const;

export const navLinks = [
  { label: "Soluciones", href: "#soluciones" },
  { label: "Cómo trabajamos", href: "#nosotros" },
  { label: "Trabajo", href: "#proyectos" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const serviceLinks = [
  { label: "HiQNet Web", href: "#hiqnet-web" },
  { label: "HiQNet Automate", href: "#hiqnet-automate" },
  { label: "HiQNet Business", href: "#hiqnet-business" },
] as const;

export const whatsappUrl = (message: string = site.whatsappMessage) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

export const yearsOperating = Math.max(1, new Date().getFullYear() - site.foundedYear);
