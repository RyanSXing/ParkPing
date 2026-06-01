export function normalizeNorthAmericanPhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return trimmed;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const lastFour = digits.slice(-4).padStart(4, "*");

  return `(***) ***-${lastFour}`;
}

export function maskEmail(value: string): string {
  const trimmed = value.trim();
  const [localPart, domain] = trimmed.split("@");

  if (!localPart || !domain) {
    return trimmed;
  }

  return `${localPart.charAt(0)}***@${domain}`;
}
