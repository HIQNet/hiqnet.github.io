---
name: NumerIQ
title: La estructura detrás de una tutoría
subtitle: Webservice y backend para organizar usuarios, sesiones de matemáticas y seguimiento académico.
client: NumerIQ
sector: Educación en línea
summary: Webservice y backend para organizar usuarios, tutorías de matemáticas y seguimiento académico.
featured: false
order: 4
cover: ../../assets/cases/numeriq/portada.webp
coverAlt: Captura de la portada de NumerIQ con navegación a cursos y tutorías
problem: Una tutoría personalizada necesita una estructura que relacione usuarios, sesiones y progreso, sin perder el contexto de cada estudiante.
intervention: Gestión de usuarios, sesiones de tutoría y registro del progreso académico, con una base preparada para integrar nuevas herramientas educativas.
outcome: La cuenta del usuario conecta sus sesiones con el seguimiento de su avance, y la plataforma queda lista para crecer sobre esa misma base.
context: Desarrollo backend para NumerIQ, una plataforma de tutorías de matemáticas centrada en el seguimiento de cada estudiante.
scope: El alcance backend procede de la descripción del proyecto. El material disponible incluye una portada y un diseño en Figma, no una demo funcional del sistema.
flow:
  - Usuario
  - Tutoría
  - Seguimiento
stack:
  - React
  - Laravel
  - MySQL
duration: 3 meses
status: Finalizado
links:
  - href: https://www.figma.com/design/AwmmX1VbFcE7R22dKCmZi3/DesignWebservices?node-id=0-1&m=dev&t=0QQFAuLR7wt5l0Bx-1
    label: Diseño en Figma
---

El proyecto se concentró en el backend de una plataforma de tutorías de matemáticas. La estructura relaciona tres piezas: la cuenta del usuario, las sesiones de tutoría y el registro del progreso académico.

Esa relación es la que sostiene la tutoría personalizada: cada sesión queda asociada a un estudiante y a su avance, de modo que el seguimiento no depende de notas externas al sistema. La arquitectura se planteó para admitir nuevas funcionalidades e integraciones sin rehacer la base.

El énfasis fue la diferenciación por especialización: una plataforma enfocada en matemáticas, no un catálogo generalista de cursos.
