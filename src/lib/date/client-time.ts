export function getClientTimezoneOffsetMinutes(date = new Date()) {
  const offsetMinutes = date.getTimezoneOffset();

  if (Number.isFinite(offsetMinutes)) {
    return offsetMinutes;
  }

  // Fallback for browsers that return an unexpected non-finite offset.
  const utcEquivalent = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
  const derivedOffset = Math.round((utcEquivalent - date.getTime()) / 60000);

  return Number.isFinite(derivedOffset) ? derivedOffset : 0;
}

export function buildLocalDateTimeIso(dateString: string, time24h: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = time24h.split(":").map(Number);

  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(localDate.getTime())) {
    throw new Error("Nao foi possivel montar o horario local do lembrete.");
  }

  return localDate.toISOString();
}
