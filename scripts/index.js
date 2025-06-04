// Data for dynamic content

const testimonialsData = [
    {
        quote: "El software es una gran combinación entre arte e ingeniería.",
        author: "Bill Gates",
        role: "Cofundador de Microsoft",
        initials: "BG",
    },
    {
        quote:
            "La máquina analítica no tiene pretensiones de originar nada. Puede hacer cualquier cosa que sepamos ordenarle que realice.",
        author: "Ada Lovelace",
        role: "Primera programadora",
        initials: "AL",
    },
    {
        quote: "Hablar es barato. Muéstrame el código.",
        author: "Linus Torvalds",
        role: "Creador de Linux",
        initials: "LT",
    },
];

// Mobile menu toggle
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

mobileMenuButton.addEventListener("click", () => {
  if (mobileMenu.classList.contains("hidden")) {
    mobileMenu.classList.remove("hidden");
    // Forzar recálculo del layout para que la animación se aplique correctamente
    void mobileMenu.offsetWidth;
    mobileMenu.classList.remove("scale-y-0");
    mobileMenu.classList.add("scale-y-100");
  } else {
    mobileMenu.classList.remove("scale-y-100");
    mobileMenu.classList.add("scale-y-0");

    // Espera a que termine la animación para ocultar completamente
    setTimeout(() => {
      mobileMenu.classList.add("hidden");
    }, 300); // debe coincidir con duration-300
  }
});


document.addEventListener("click", (event) => {
  const isClickInside = mobileMenu.contains(event.target) || mobileMenuButton.contains(event.target);
  if (!isClickInside && !mobileMenu.classList.contains("hidden")) {
    mobileMenu.classList.add("hidden");
  }
});


// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: "smooth",
            });

            // Close mobile menu if open
            mobileMenu.classList.add("hidden");
        }
    });
});

// Scroll progress bar
const scrollProgress = document.getElementById("scroll-progress");

window.addEventListener("scroll", () => {
    const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    scrollProgress.style.width = scrollPercentage + "%";

    // Show/hide back to top button
    const backToTop = document.getElementById("back-to-top");
    if (scrollTop > 300) {
        backToTop.classList.add("visible");
    } else {
        backToTop.classList.remove("visible");
    }
});

// Back to top button
document.getElementById("back-to-top").addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
});



// Testimonial slider
const testimonialTrack = document.getElementById("testimonial-track");
const testimonialDots = document.getElementById("testimonial-dots");

let currentSlide = 0;
const slideCount = testimonialsData.length;

function updateSlider() {
    testimonialTrack.style.transform = `translateX(-${currentSlide * 100
        }%)`;

    // Update dots
    document.querySelectorAll(".dot").forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add("active");
            dot.classList.remove("bg-purple-300", "dark:bg-purple-700");
            dot.classList.add("bg-purple-500", "dark:bg-purple-500");
        } else {
            dot.classList.remove("active");
            dot.classList.add("bg-purple-300", "dark:bg-purple-700");
            dot.classList.remove("bg-purple-500", "dark:bg-purple-500");
        }
    });
}

// Dot navigation
document.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", () => {
        currentSlide = parseInt(dot.getAttribute("data-index"));
        updateSlider();
    });
});

// Auto slide
setInterval(() => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateSlider();
}, 5000);

// Initialize ScrollReveal - versiones más rápidas y uniformes
ScrollReveal().reveal("h1, h2, h3, h4, h5, h6", {
    delay: 50,
    distance: "8px",
    duration: 300,
    origin: "bottom",
    interval: 50,
});

ScrollReveal().reveal(".gradient-border, .gradient-bg", {
    delay: 80,
    distance: "10px",
    duration: 300,
    origin: "bottom",
    interval: 50,
});

ScrollReveal().reveal("p, li", {
    delay: 100,
    distance: "8px",
    duration: 300,
    origin: "bottom",
    interval: 50,
});

// Intersection Observer for counter animation
const experienceSection = document.querySelector(
    ".gradient-bg.text-white"
);

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

observer.observe(experienceSection);

const video = document.getElementById("logoVideo");
video.playbackRate = 1.0;