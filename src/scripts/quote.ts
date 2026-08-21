/**
 * Controlador del cotizador conversacional.
 * Presenta las preguntas de data/questionnaire.ts como un chat: el bot
 * pregunta, el usuario responde con opciones rápidas y al final se
 * recopilan sus datos para enviar el resumen por WhatsApp o correo.
 * Sin IA: el flujo es determinista.
 */

import {
  quoteSteps,
  type Integrations,
  type Objective,
  type ProjectType,
  type QuoteAnswers,
  type Timeline,
} from "../data/questionnaire";
import { site } from "../data/site";

/** Obtiene un elemento por id y falla explícitamente si el markup cambió. */
function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Cotizador: elemento #${id} no encontrado.`);
  return element as T;
}

interface QuoteState {
  stepIndex: number;
  projectType?: ProjectType;
  objective?: Objective;
  features: Set<string>;
  integrations?: Integrations;
  timeline?: Timeline;
  name: string;
  contact: string;
}

interface ChatMessage {
  from: "bot" | "user";
  html: string;
}

const panel = requireElement<HTMLDivElement>("quote-panel");
const overlay = requireElement<HTMLDivElement>("quote-overlay");
const chat = requireElement<HTMLDivElement>("quote-chat");
const inputArea = requireElement<HTMLDivElement>("quote-input-area");
const stepLabel = requireElement<HTMLSpanElement>("quote-step-label");
const progressLabel = requireElement<HTMLSpanElement>("quote-progress-label");
const progressBar = requireElement<HTMLDivElement>("quote-progress-bar");
const backButton = requireElement<HTMLButtonElement>("quote-back");
const closeButton = requireElement<HTMLButtonElement>("quote-close");
const actions = requireElement<HTMLDivElement>("quote-actions");
const whatsappLink = requireElement<HTMLAnchorElement>("quote-whatsapp");
const emailLink = requireElement<HTMLAnchorElement>("quote-email");
const persistentCta = document.getElementById("persistent-cta");

const state: QuoteState = { stepIndex: 0, features: new Set(), name: "", contact: "" };
let lastFocused: HTMLElement | null = null;

/** Historial de la conversación y marcadores por paso (para "atrás"). */
const messages: ChatMessage[] = [];
const stepStarts: number[] = [];

/** value -> label legible. */
const labelFor = new Map<string, string>();
for (const step of quoteSteps) {
  for (const option of step.options) {
    labelFor.set(option.value, option.label);
  }
}

// --- Chat ---

function nowTime(): string {
  return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function bubbleHtml(message: ChatMessage): string {
  const time = `<span class="chat-time">${nowTime()}</span>`;
  if (message.from === "user") {
    return `
      <div class="flex justify-end">
        <div class="chat-bubble gradient-bg text-sm text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] shadow-md">${message.html}${time}</div>
      </div>`;
  }
  return `
    <div class="flex items-end gap-2">
      <div class="w-7 h-7 gradient-bg rounded-full flex items-center justify-center flex-shrink-0 shadow" aria-hidden="true">
        <i class="fas fa-comment-dollar text-white text-xs"></i>
      </div>
      <div class="chat-bubble bg-slate-800/95 border border-slate-700/60 text-slate-100 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">${message.html}${time}</div>
    </div>`;
}

function renderChat(smooth = false) {
  chat.classList.add("rebuilding");
  chat.innerHTML = messages.map(bubbleHtml).join("");
  chat.classList.remove("rebuilding");
  chat.scrollTo({ top: chat.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

/** Agrega una burbuja sin reconstruir el historial y fija la vista abajo. */
function appendMessage(message: ChatMessage) {
  chat.insertAdjacentHTML("beforeend", bubbleHtml(message));
  chat.scrollTo({ top: chat.scrollHeight, behavior: "auto" });
}

function pushBot(html: string) {
  const message: ChatMessage = { from: "bot", html };
  messages.push(message);
  appendMessage(message);
}

function pushUser(text: string) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const message: ChatMessage = { from: "user", html: safe };
  messages.push(message);
  appendMessage(message);
}

/** Muestra el indicador «escribiendo…» durante un breve instante. */
const TYPING_MS = 500;

function showTyping(): Promise<void> {
  return new Promise((resolve) => {
    const typing = document.createElement("div");
    typing.id = "quote-typing";
    typing.className = "flex items-end gap-2";
    typing.innerHTML = `
      <div class="w-7 h-7 gradient-bg rounded-full flex items-center justify-center flex-shrink-0 shadow" aria-hidden="true">
        <i class="fas fa-comment-dollar text-white text-xs"></i>
      </div>
      <div class="bg-slate-800/95 border border-slate-700/60 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center" aria-label="HiQNet está escribiendo">
        <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
      </div>`;
    chat.appendChild(typing);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "auto" });
    window.setTimeout(() => {
      typing.remove();
      resolve();
    }, TYPING_MS);
  });
}

// --- Flujo ---

function currentStep() {
  return quoteSteps[state.stepIndex];
}

/** Respuestas completas; null si falta alguna (no debería ocurrir en el resumen). */
function collectAnswers(): QuoteAnswers | null {
  if (!state.projectType || !state.objective || !state.integrations || !state.timeline) {
    return null;
  }
  return {
    projectType: state.projectType,
    objective: state.objective,
    features: [...state.features],
    integrations: state.integrations,
    timeline: state.timeline,
  };
}

function isStepAnswered(): boolean {
  const step = currentStep();
  if (!step) return true;
  switch (step.id) {
    case "projectType":
      return Boolean(state.projectType);
    case "objective":
      return Boolean(state.objective);
    case "features":
      return state.features.size > 0;
    case "integrations":
      return Boolean(state.integrations);
    case "timeline":
      return Boolean(state.timeline);
  }
}

function updateProgress() {
  const total = quoteSteps.length;
  const onSummary = state.stepIndex >= total;
  const index = Math.min(state.stepIndex + 1, total);
  stepLabel.textContent = onSummary ? "Resumen" : `Paso ${index} de ${total}`;
  const percent = Math.round((index / total) * 100);
  progressLabel.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  backButton.disabled = state.stepIndex === 0;
}

function advance(): Promise<void> {
  if (state.stepIndex + 1 < quoteSteps.length) {
    return enterStep(state.stepIndex + 1);
  }
  return showSummary();
}

/** Renderiza las opciones del paso actual como respuestas rápidas. */
function renderInputArea() {
  const step = currentStep();
  if (!step) return;

  const buttonsHtml = step.options
    .map(
      (option) => `
      <button type="button"
        class="quote-option w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 hover:border-cyan-400/60 hover:bg-cyan-400/5 text-left transition-all duration-200 cursor-pointer"
        data-value="${option.value}" aria-pressed="false">
        ${option.icon ? `<i class="${option.icon} text-cyan-300 w-5 text-center"></i>` : ""}
        <span class="flex-1">
          <span class="block text-sm font-medium text-white">${option.label}</span>
          ${option.description ? `<span class="block text-xs text-slate-400 mt-0.5">${option.description}</span>` : ""}
        </span>
        <i class="fas fa-check text-cyan-300 invisible"></i>
      </button>`
    )
    .join("");

  if (step.multi) {
    inputArea.innerHTML = `
      ${step.hint ? `<p class="text-xs text-slate-400 mb-2">${step.hint}</p>` : ""}
      <div class="scroll-slim grid gap-2 max-h-56 overflow-y-auto pr-1">${buttonsHtml}</div>
      <button type="button" id="quote-confirm"
        class="mt-3 w-full gradient-bg text-white font-medium py-2.5 rounded-xl cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition"
        disabled>Confirmar</button>`;
  } else {
    inputArea.innerHTML = `<div class="scroll-slim grid gap-2 max-h-64 overflow-y-auto pr-1">${buttonsHtml}</div>`;
  }
}

async function enterStep(index: number): Promise<void> {
  state.stepIndex = index;
  stepStarts[index] = messages.length;

  const step = quoteSteps[index];
  if (step) {
    await showTyping();
    pushBot(`<strong>${step.title}</strong>${step.hint ? `<br><span class="text-slate-300 text-xs">${step.hint}</span>` : ""}`);
    renderInputArea();
  }
  updateProgress();
}

function back() {
  if (state.stepIndex === 0) return;
  const target = state.stepIndex - 1;
  // Descarta los mensajes de los pasos posteriores y replantea el paso anterior.
  messages.length = stepStarts[target];
  actions.classList.add("hidden");
  inputArea.classList.remove("hidden");
  renderChat();
  void enterStep(target);
}

// --- Resumen y envío ---

function summaryRowsHtml(): string {
  const featureLabels = [...state.features].map((f) => labelFor.get(f) ?? f).join(", ");
  const rows: Array<[string, string]> = [
    ["Tipo", labelFor.get(state.projectType ?? "") ?? ""],
    ["Objetivo", labelFor.get(state.objective ?? "") ?? ""],
    ["Funcionalidades", featureLabels],
    ["Integraciones", labelFor.get(state.integrations ?? "") ?? ""],
    ["Plazo", labelFor.get(state.timeline ?? "") ?? ""],
  ];
  return rows
    .map(
      ([term, detail]) => `
      <div class="flex justify-between gap-3 text-xs">
        <dt class="text-slate-400 flex-shrink-0">${term}</dt>
        <dd class="text-slate-100 text-right">${detail}</dd>
      </div>`
    )
    .join("");
}

async function showSummary(): Promise<void> {
  const answers = collectAnswers();
  if (!answers) return;

  state.stepIndex = quoteSteps.length;
  inputArea.innerHTML = "";
  inputArea.classList.add("hidden");

  await showTyping();
  pushBot("Perfecto, con eso es suficiente. Este es el resumen de tu proyecto:");
  pushBot(`
    <dl class="grid gap-1.5">${summaryRowsHtml()}</dl>
    <p class="text-xs text-slate-400 mt-3">El presupuesto final se define en la propuesta, sin costo ni compromiso.</p>`);
  await showTyping();
  pushBot("Para enviarte la propuesta, ¿cómo te llamas y cómo te contactamos?");

  inputArea.classList.remove("hidden");
  inputArea.innerHTML = `
    <div class="grid gap-2">
      <input id="quote-name" type="text" autocomplete="name" placeholder="Tu nombre"
        class="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400" />
      <input id="quote-contact" type="text" autocomplete="tel" placeholder="Teléfono o correo"
        class="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400" />
      <p class="text-xs text-slate-500">Tus datos solo se usan para responderte.</p>
    </div>`;

  actions.classList.remove("hidden");
  bindContactInputs();
  updateActionLinks();
  updateProgress();
}

function bindContactInputs() {
  const nameInput = document.getElementById("quote-name") as HTMLInputElement | null;
  const contactInput = document.getElementById("quote-contact") as HTMLInputElement | null;
  if (!nameInput || !contactInput) return;

  nameInput.value = state.name;
  contactInput.value = state.contact;

  nameInput.addEventListener("input", () => {
    state.name = nameInput.value;
    updateActionLinks();
  });
  contactInput.addEventListener("input", () => {
    state.contact = contactInput.value;
    updateActionLinks();
  });
}

function buildMessage(): string {
  const answers = collectAnswers();
  if (!answers) return "";
  const lines = [
    "Hola HiQNet, quiero cotizar un proyecto:",
    `- Tipo: ${labelFor.get(state.projectType ?? "")}`,
    `- Objetivo: ${labelFor.get(state.objective ?? "")}`,
    `- Funcionalidades: ${[...state.features].map((f) => labelFor.get(f) ?? f).join(", ")}`,
    `- Integraciones: ${labelFor.get(state.integrations ?? "")}`,
    `- Plazo deseado: ${labelFor.get(state.timeline ?? "")}`,
  ];
  if (state.name) lines.push(`- Nombre: ${state.name}`);
  if (state.contact) lines.push(`- Contacto: ${state.contact}`);
  return lines.join("\n");
}

function updateActionLinks() {
  const message = encodeURIComponent(buildMessage());
  whatsappLink.href = `https://wa.me/${site.whatsapp}?text=${message}`;
  emailLink.href = `mailto:${site.email}?subject=${encodeURIComponent("Cotización de proyecto")}&body=${message}`;
}

// --- Apertura / cierre ---

function isOpen(): boolean {
  return panel.classList.contains("open");
}

function resetState() {
  state.stepIndex = 0;
  state.projectType = undefined;
  state.objective = undefined;
  state.features.clear();
  state.integrations = undefined;
  state.timeline = undefined;
  state.name = "";
  state.contact = "";
  messages.length = 0;
  stepStarts.length = 0;
}

async function open(presetType?: string): Promise<void> {
  if (isOpen()) return;
  lastFocused = document.activeElement as HTMLElement | null;
  resetState();

  // Limpieza visual inmediata: nunca mostrar la conversación anterior.
  renderChat();
  inputArea.innerHTML = "";
  inputArea.classList.remove("hidden");
  actions.classList.add("hidden");

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  persistentCta?.classList.add("hidden");
  document.body.style.overflow = "hidden";
  closeButton.focus();

  if (presetType) {
    // El usuario llegó desde una tarjeta del hero: se responde el primer paso solo.
    state.projectType = presetType as ProjectType;
    await enterStep(0);
    pushUser(labelFor.get(presetType) ?? presetType);
    await enterStep(1);
  } else {
    await enterStep(0);
  }
}

function close() {
  if (!isOpen()) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  persistentCta?.classList.remove("hidden");
  document.body.style.overflow = "";
  lastFocused?.focus();
}

// --- Eventos ---

inputArea.addEventListener("click", (event) => {
  const confirmButton = (event.target as HTMLElement).closest("#quote-confirm");
  if (confirmButton) {
    const labels = [...state.features].map((f) => labelFor.get(f) ?? f).join(", ");
    pushUser(labels);
    inputArea.innerHTML = "";
    void advance();
    return;
  }

  const option = (event.target as HTMLElement).closest<HTMLElement>(".quote-option");
  if (!option) return;
  const step = currentStep();
  if (!step) return;

  if (step.multi) {
    // Selección múltiple: marca/desmarca hasta confirmar.
    const value = option.dataset.value!;
    if (state.features.has(value)) {
      state.features.delete(value);
    } else {
      state.features.add(value);
    }
    option.setAttribute("aria-pressed", String(state.features.has(value)));
    option.querySelector(".fa-check")?.classList.toggle("invisible", !state.features.has(value));
    option.classList.toggle("border-cyan-400/60", state.features.has(value));
    option.classList.toggle("bg-cyan-400/10", state.features.has(value));
    const confirm = document.getElementById("quote-confirm") as HTMLButtonElement | null;
    if (confirm) {
      confirm.disabled = state.features.size === 0;
      confirm.textContent =
        state.features.size === 0 ? "Confirmar" : `Confirmar (${state.features.size})`;
    }
    return;
  }

  // Selección única: registra la respuesta como mensaje del usuario y avanza.
  switch (step.id) {
    case "projectType":
      state.projectType = option.dataset.value as ProjectType;
      break;
    case "objective":
      state.objective = option.dataset.value as Objective;
      break;
    case "integrations":
      state.integrations = option.dataset.value as Integrations;
      break;
    case "timeline":
      state.timeline = option.dataset.value as Timeline;
      break;
  }
  pushUser(labelFor.get(option.dataset.value ?? "") ?? "");
  inputArea.innerHTML = "";
  void advance();
});

backButton.addEventListener("click", back);
closeButton.addEventListener("click", close);
overlay.addEventListener("click", close);

document.addEventListener("keydown", (event) => {
  if (!isOpen()) return;
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key !== "Tab") return;
  // Trampa de foco simple dentro del panel.
  const focusables = panel.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// Apertura desde cualquier elemento [data-quote-open] (hero, navbar, CTA flotante).
document.addEventListener("click", (event) => {
  const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-quote-open]");
  if (!trigger) return;
  event.preventDefault();
  open(trigger.dataset.projectType);
});
