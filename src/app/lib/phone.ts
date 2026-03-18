export function normalizePhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length > 10 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return digits.slice(1, 11);
  }

  return digits.slice(0, 10);
}

export function formatPhoneMask(value: string) {
  const digits = normalizePhoneDigits(value);

  if (!digits.length) {
    return "";
  }

  const area = digits.slice(0, 3);
  const first = digits.slice(3, 6);
  const second = digits.slice(6, 8);
  const third = digits.slice(8, 10);

  let result = "";

  if (area) {
    result += `(${area}`;
    if (area.length === 3) {
      result += ")";
    }
  }

  if (first) {
    result += ` ${first}`;
  }

  if (second) {
    result += ` ${second}`;
  }

  if (third) {
    result += `-${third}`;
  }

  return result;
}

export function isPhoneComplete(value: string) {
  return normalizePhoneDigits(value).length === 10;
}
