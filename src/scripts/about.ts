interface ModalWindow extends Window {
  closeModal: (modalId: string) => void;
  openImageModal: (imageSrc: string, caption?: string) => void;
}

const modalWindow = window as ModalWindow;

function openModal(modalId: string) {
  document.getElementById(modalId)?.classList.remove("opacity-0", "pointer-events-none");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId: string) {
  document.getElementById(modalId)?.classList.add("opacity-0", "pointer-events-none");
  document.body.style.overflow = "auto";
}

function openImageModal(imageSrc: string, caption = "") {
  const image = document.getElementById("modalImage") as HTMLImageElement | null;
  const captionElement = document.getElementById("modalImageCaption");

  if (image) image.src = imageSrc;
  if (captionElement) captionElement.textContent = caption;
  openModal("imageModal");
}

modalWindow.closeModal = closeModal;
modalWindow.openImageModal = openImageModal;

window.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof Element && target.classList.contains("modal")) {
    closeModal("imageModal");
  }
});
