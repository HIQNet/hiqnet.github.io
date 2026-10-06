---
name: Bienes Raíces
title: De encontrar una propiedad a iniciar contacto
subtitle: Catálogo web con búsqueda geográfica, filtros por tipo y precio, y mensajería con el vendedor.
client: No identificado
sector: Inmobiliario
summary: Catálogo web con búsqueda geográfica, filtros y contacto con el vendedor.
featured: true
order: 5
cover: ../../assets/cases/bienes-raices/mapa.webp
coverAlt: Mapa de propiedades en la zona de Guadalajara con filtros de categoría y precio
problem: Buscar una propiedad exige relacionar ubicación, tipo y precio, y encontrar cómo contactar a quien la publica.
intervention: Catálogo con filtros, mapa con marcadores, fichas de propiedad y formulario de contacto, acompañado de una bandeja de mensajes.
outcome: La búsqueda lleva del mapa o el listado al detalle de una propiedad; desde ahí, el visitante redacta un mensaje que aparece en la consulta del vendedor.
context: Una plataforma web para explorar propiedades y contactar al vendedor dentro del mismo recorrido de consulta, sin salir a otros canales.
scope: Proyecto sin cliente identificado. Las interfaces incluyen datos de prueba y se centran en búsqueda y contacto, no en el cierre de transacciones.
flow:
  - Catálogo y mapa
  - Filtros
  - Propiedad
  - Mensaje
stack:
  - Pug
  - Node.js
  - Express.js
  - MySQL
duration: 3 meses
status: Finalizado
gallery:
  - image: ../../assets/cases/bienes-raices/filtro-tipo.webp
    alt: Selector de categorías de propiedad sobre un mapa
    caption: Filtro por tipo de propiedad, con Departamento seleccionado.
  - image: ../../assets/cases/bienes-raices/filtro-precio.webp
    alt: Selector de rangos de precio para filtrar propiedades en el mapa
    caption: Filtro por rango de precio.
  - image: ../../assets/cases/bienes-raices/marcador.webp
    alt: Ficha emergente de un departamento con fotografía y precio sobre el mapa
    caption: Vista previa de una propiedad desde su marcador.
  - image: ../../assets/cases/bienes-raices/catalogo.webp
    alt: Listado de casas y departamentos con fotografías, características y precios
    caption: Catálogo de propiedades organizado por tipo.
  - image: ../../assets/cases/bienes-raices/detalle.webp
    alt: Detalle de un departamento con características, ubicación y formulario de mensaje
    caption: Información de la propiedad y contacto con el vendedor.
  - image: ../../assets/cases/bienes-raices/mensajes.webp
    alt: Bandeja de mensajes con una consulta enviada por un usuario de prueba
    caption: Consulta de mensajes; los datos visibles son de prueba.
---

La plataforma parte de la ubicación como criterio principal. El mapa y el listado comparten los mismos filtros de tipo y precio, de modo que acotar la búsqueda no obliga a cambiar de herramienta.

Cada propiedad tiene su ficha con características, ubicación y precio, y desde ahí se redacta el mensaje al vendedor. Esa consulta aparece después en la bandeja de mensajes, que cierra el recorrido entre quien busca y quien publica.

El alcance mostrado es búsqueda y contacto. Los datos visibles en las capturas son de prueba.
