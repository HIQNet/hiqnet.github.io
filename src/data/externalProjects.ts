/**
 * Proyectos del portafolio que no tienen página de detalle:
 * enlazan directamente a una URL externa.
 */
export interface ExternalProject {
  cardTitle: string;
  cardDescription: string;
  cover: string;
  tech: string[];
  href: string;
}

export const externalProjects: ExternalProject[] = [
  {
    cardTitle: "Polarizados Cold Front",
    cardDescription:
      "Sitio web para la empresa de Polarizados Cold Front, que ofrece servicios de polarizado de alta calidad para residencias, edificios y automóviles.",
    cover: "/img/polarizadosCold.webp",
    tech: ["HTML", "CSS"],
    href: "https://polarizadoscoldfront.com/",
  },
  {
    cardTitle: "Vlock Constructora",
    cardDescription:
      "Sitio web para la empresa de construcción Vlock, que ofrece servicios de construcción y remodelación de alta calidad.",
    cover: "/img/vlockConstructora.webp",
    tech: ["HTML", "CSS"],
    href: "#",
  },
  {
    cardTitle: "Generador QR",
    cardDescription: "Herramienta para generar códigos QR personalizados.",
    cover: "/img/blog/GeneradorQR.webp",
    tech: ["Python", "HTML", "CSS"],
    href: "https://github.com/Grxson/qr-generator",
  },
];
