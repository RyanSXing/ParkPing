type ContactValue = string | null | undefined;

function trimContactValue(value: ContactValue): string {
  return value?.trim() ?? "";
}

function hasValidNorthAmericanPhoneShape(digits: string): boolean {
  return (
    digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))
  );
}

export function normalizeNorthAmericanPhone(value: ContactValue): string {
  const trimmed = trimContactValue(value);

  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return "";
}

export function maskPhone(value: ContactValue): string {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");

  if (!hasValidNorthAmericanPhoneShape(digits)) {
    return "";
  }

  const lastFour = digits.slice(-4).padStart(4, "*");

  return `(***) ***-${lastFour}`;
}

export function maskEmail(value: ContactValue): string {
  const trimmed = trimContactValue(value);
  const parts = trimmed.split("@");

  if (parts.length !== 2) {
    return "";
  }

  const [localPart, domain] = parts;

  if (!localPart || !domain) {
    return "";
  }

  return `${localPart.charAt(0)}***@${domain}`;
}
