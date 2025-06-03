
// Modal functions
function openModal(modalId) {
    document
        .getElementById(modalId)
        .classList.remove("opacity-0", "pointer-events-none");
    document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
    document
        .getElementById(modalId)
        .classList.add("opacity-0", "pointer-events-none");
    document.body.style.overflow = "auto";
}

function openImageModal(imageSrc, caption = "") {
    document.getElementById("modalImage").src = imageSrc;
    document.getElementById("modalImageCaption").textContent = caption;
    openModal("imageModal");
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
        closeModal("imageModal");
    }
};

// Sample data structure that would be replaced with React props
const projectData = {
    title: "E-Commerce Platform",
    description:
        "Plataforma completa de comercio electrónico con sistema de recomendaciones",
    technologies: [
        "React",
        "Node.js",
        "MongoDB",
        "Python",
        "TensorFlow",
        "AWS",
        "Docker",
        "GraphQL",
    ],
    client: "RetailTech Solutions",
    duration: "6 meses",
    team: "5 desarrolladores, 2 diseñadores, 1 PM",
    status: "En producción",
    githubLink: "#",
    demoLink: "#",
    gallery: [
        {
            image:
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            caption: "Dashboard principal",
        },
        {
            image:
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1415&q=80",
            caption: "Sistema de recomendaciones",
        },
        {
            image:
                "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            caption: "Flujo de compra",
        },
        {
            image:
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
            caption: "Panel de administración",
        },
    ],
    challenges: [
        "Integración con múltiples proveedores de pago",
        "Sincronización de inventario en tiempo real entre tiendas físicas y online",
        "Creación de un sistema de recomendaciones personalizadas",
        "Optimización del rendimiento para manejar picos de tráfico",
    ],
    results: [
        "+35% en conversión de ventas",
        "-40% en tiempo de carga de páginas",
        "98.9% uptime durante eventos de alto tráfico",
        "20% aumento en tamaño promedio de carrito gracias al sistema de recomendaciones",
    ],
};
