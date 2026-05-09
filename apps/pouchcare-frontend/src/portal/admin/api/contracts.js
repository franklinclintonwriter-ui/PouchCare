function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCompanyPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "name must be a non-empty string" };
  if (payload.ownerEmail !== undefined && !hasText(payload.ownerEmail)) return { ok: false, reason: "ownerEmail must be a non-empty string" };
  return { ok: true };
}

export function validateTeamPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "payload must be an object" };
  if (payload.email !== undefined && !hasText(payload.email)) return { ok: false, reason: "email must be a non-empty string" };
  return { ok: true };
}

export function validateBillingPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "payload must be an object" };
  if (payload.amount !== undefined && Number.isNaN(Number(payload.amount))) return { ok: false, reason: "amount must be numeric" };
  return { ok: true };
}

export function validateEvent(event) {
  if (!isObject(event)) return { ok: false, reason: "event must be an object" };
  if (!hasText(event.type)) return { ok: false, reason: "event.type is required" };
  return { ok: true };
}

