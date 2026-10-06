/** Contact channels and helpers. The single place these values live. */
export const contact = {
  email: "hiqnet.web@gmail.com",
  whatsapp: "523325689263",
  whatsappMessage:
    "Hola, encontré HiQNet y me gustaría conversar sobre cómo funciona la operación de mi empresa.",
} as const;

export function whatsappUrl(message: string = contact.whatsappMessage): string {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(subject?: string): string {
  const base = `mailto:${contact.email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
