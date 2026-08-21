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
  customProjectType?: string;
  objective?: Objective;
  customObjective?: string;
  features: Set<string>;
  customFeatures: Set<string>;
  integrations?: Integrations;
  customIntegrations?: string;
  timeline?: Timeline;
  customTimeline?: string;
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

const state: QuoteState = {
  stepIndex: 0,
  features: new Set(),
  customFeatures: new Set(),
  name: "",
  contact: "",
};
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

function scrollChat(behavior: ScrollBehavior = "smooth") {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const resolvedBehavior = reducedMotion ? "auto" : behavior;

  // Espera al siguiente frame para que el alto nuevo del historial ya esté calculado.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      chat.scrollTo({ top: chat.scrollHeight, behavior: resolvedBehavior });
    });
  });
}

function renderChat(smooth = false) {
  chat.classList.add("rebuilding");
  chat.innerHTML = messages.map(bubbleHtml).join("");
  chat.classList.remove("rebuilding");
  scrollChat(smooth ? "smooth" : "auto");
}

/** Agrega una burbuja sin reconstruir el historial y fija la vista abajo. */
function appendMessage(message: ChatMessage) {
  chat.insertAdjacentHTML("beforeend", bubbleHtml(message));
  scrollChat("smooth");
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
    scrollChat("smooth");
    window.setTimeout(() => {
      typing.remove();
      scrollChat("smooth");
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
    features: [...state.features, ...state.customFeatures],
    integrations: state.integrations,
    timeline: state.timeline,
    custom: {
      projectType: state.customProjectType,
      objective: state.customObjective,
      features: [...state.customFeatures],
      integrations: state.customIntegrations,
      timeline: state.customTimeline,
    },
  };
}

function answerLabel(value: string | undefined, customValue?: string): string {
  if (value === "otro") return customValue || "Otra opción";
  return labelFor.get(value ?? "") ?? value ?? "";
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function customAnswerFor(stepId: string): string {
  switch (stepId) {
    case "projectType":
      return state.customProjectType ?? "";
    case "objective":
      return state.customObjective ?? "";
    case "integrations":
      return state.customIntegrations ?? "";
    case "timeline":
      return state.customTimeline ?? "";
    default:
      return "";
  }
}

function customPlaceholder(stepId: string): string {
  switch (stepId) {
    case "projectType":
      return "Ej. una plataforma de reservas...";
    case "objective":
      return "Ej. conectar sucursales y proveedores...";
    case "integrations":
      return "Ej. conectar mi ERP y WhatsApp...";
    default:
      return "Cuéntanos qué necesitas...";
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
        disabled>Confirmar</button>
      <div class="mt-3 pt-3 border-t border-slate-700/50">
        <p class="text-xs text-slate-400 mb-2">¿Falta alguna funcionalidad? Agrégala a tu idea.</p>
        <div class="grid grid-cols-[1fr_auto] gap-2">
          <input id="quote-custom-feature" type="text" maxlength="120" placeholder="Ej. agenda de citas"
            class="min-w-0 bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400" />
          <button type="button" id="quote-add-feature" class="px-3 rounded-xl border border-cyan-400/50 text-cyan-200 hover:bg-cyan-400/10 transition-colors" aria-label="Agregar funcionalidad">
            <i class="fas fa-plus" aria-hidden="true"></i>
          </button>
        </div>
        <div id="quote-custom-features" class="flex flex-wrap gap-1.5 mt-2"></div>
      </div>`;
    renderCustomFeatures();
    updateFeaturesConfirm();
  } else {
    inputArea.innerHTML = `
      <div class="scroll-slim grid gap-2 max-h-64 overflow-y-auto pr-1">${buttonsHtml}</div>
      <div class="mt-3 pt-3 border-t border-slate-700/50">
        <p class="text-xs text-slate-400 mb-2">¿No encuentras una opción? Descríbela y la tomamos en cuenta.</p>
        <div class="grid grid-cols-[1fr_auto] gap-2">
          <input id="quote-custom-answer" type="text" maxlength="160" value="${escapeAttribute(customAnswerFor(step.id))}" placeholder="${customPlaceholder(step.id)}"
            class="min-w-0 bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400" />
          <button type="button" id="quote-custom-submit" class="px-3 rounded-xl gradient-bg text-white hover:brightness-110 transition" aria-label="Usar respuesta escrita">
            <i class="fas fa-arrow-up" aria-hidden="true"></i>
          </button>
        </div>
        <p id="quote-custom-error" class="hidden text-xs text-rose-300 mt-1.5">Escribe un poco más para poder cotizarlo.</p>
      </div>`;
  }
}

function renderCustomFeatures() {
  const container = document.getElementById("quote-custom-features");
  if (!container) return;
  container.innerHTML = [...state.customFeatures]
    .map(
      (feature) => `
        <span class="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2.5 py-1 text-xs text-cyan-100">
          ${feature.replace(/&/g, "&amp;").replace(/</g, "&lt;")}
          <button type="button" class="quote-remove-feature text-cyan-300 hover:text-white" data-feature="${escapeAttribute(feature)}" aria-label="Quitar ${escapeAttribute(feature)}">
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </span>`
    )
    .join("");
}

function updateFeaturesConfirm() {
  const confirm = document.getElementById("quote-confirm") as HTMLButtonElement | null;
  if (!confirm) return;
  const count = state.features.size + state.customFeatures.size;
  confirm.disabled = count === 0;
  confirm.textContent = count === 0 ? "Confirmar" : `Confirmar (${count})`;
}

function addCustomFeature() {
  const input = document.getElementById("quote-custom-feature") as HTMLInputElement | null;
  const value = input?.value.trim() ?? "";
  if (!value) {
    input?.focus();
    return;
  }
  state.customFeatures.add(value);
  if (input) input.value = "";
  renderCustomFeatures();
  updateFeaturesConfirm();
  input?.focus();
}

function submitCustomAnswer() {
  const step = currentStep();
  const input = document.getElementById("quote-custom-answer") as HTMLInputElement | null;
  if (!step || !input) return;
  const value = input.value.trim();
  if (!value) {
    document.getElementById("quote-custom-error")?.classList.remove("hidden");
    input.focus();
    return;
  }

  switch (step.id) {
    case "projectType":
      state.projectType = "otro";
      state.customProjectType = value;
      break;
    case "objective":
      state.objective = "otro";
      state.customObjective = value;
      break;
    case "integrations":
      state.integrations = "otro";
      state.customIntegrations = value;
      break;
    case "timeline":
      state.timeline = "otro";
      state.customTimeline = value;
      break;
  }

  pushUser(value);
  inputArea.innerHTML = "";
  void advance();
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
  scrollChat("smooth");
}

function back() {
  if (state.stepIndex === 0) return;
  const target = state.stepIndex - 1;
  // Descarta los mensajes de los pasos posteriores y replantea el paso anterior.
  messages.length = stepStarts[target];
  actions.classList.add("hidden");
  inputArea.classList.remove("hidden");
  renderChat(true);
  void enterStep(target);
}

// --- Resumen y envío ---

function summaryRowsHtml(): string {
  const featureLabels = [...state.features, ...state.customFeatures]
    .map((f) => labelFor.get(f) ?? f)
    .join(", ");
  const rows: Array<[string, string]> = [
    ["Tipo", answerLabel(state.projectType, state.customProjectType)],
    ["Objetivo", answerLabel(state.objective, state.customObjective)],
    ["Funcionalidades", featureLabels],
    ["Integraciones", answerLabel(state.integrations, state.customIntegrations)],
    ["Plazo", answerLabel(state.timeline, state.customTimeline)],
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
    `- Tipo: ${answerLabel(state.projectType, state.customProjectType)}`,
    `- Objetivo: ${answerLabel(state.objective, state.customObjective)}`,
    `- Funcionalidades: ${[...state.features, ...state.customFeatures].map((f) => labelFor.get(f) ?? f).join(", ")}`,
    `- Integraciones: ${answerLabel(state.integrations, state.customIntegrations)}`,
    `- Plazo deseado: ${answerLabel(state.timeline, state.customTimeline)}`,
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
  state.customProjectType = undefined;
  state.objective = undefined;
  state.customObjective = undefined;
  state.features.clear();
  state.customFeatures.clear();
  state.integrations = undefined;
  state.customIntegrations = undefined;
  state.timeline = undefined;
  state.customTimeline = undefined;
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
  const addFeatureButton = (event.target as HTMLElement).closest("#quote-add-feature");
  if (addFeatureButton) {
    addCustomFeature();
    return;
  }

  const removeFeatureButton = (event.target as HTMLElement).closest<HTMLElement>(".quote-remove-feature");
  if (removeFeatureButton) {
    const feature = removeFeatureButton.dataset.feature;
    if (feature) state.customFeatures.delete(feature);
    renderCustomFeatures();
    updateFeaturesConfirm();
    return;
  }

  const customSubmit = (event.target as HTMLElement).closest("#quote-custom-submit");
  if (customSubmit) {
    submitCustomAnswer();
    return;
  }

  const confirmButton = (event.target as HTMLElement).closest("#quote-confirm");
  if (confirmButton) {
    const labels = [...state.features, ...state.customFeatures]
      .map((f) => labelFor.get(f) ?? f)
      .join(", ");
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
      updateFeaturesConfirm();
    }
    return;
  }

  // Selección única: registra la respuesta como mensaje del usuario y avanza.
  switch (step.id) {
    case "projectType":
      state.projectType = option.dataset.value as ProjectType;
      state.customProjectType = undefined;
      break;
    case "objective":
      state.objective = option.dataset.value as Objective;
      state.customObjective = undefined;
      break;
    case "integrations":
      state.integrations = option.dataset.value as Integrations;
      state.customIntegrations = undefined;
      break;
    case "timeline":
      state.timeline = option.dataset.value as Timeline;
      state.customTimeline = undefined;
      break;
  }
  pushUser(labelFor.get(option.dataset.value ?? "") ?? "");
  inputArea.innerHTML = "";
  void advance();
});

inputArea.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  const target = event.target as HTMLElement;
  if (target.id === "quote-custom-answer") {
    event.preventDefault();
    submitCustomAnswer();
  } else if (target.id === "quote-custom-feature") {
    event.preventDefault();
    addCustomFeature();
  }
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
