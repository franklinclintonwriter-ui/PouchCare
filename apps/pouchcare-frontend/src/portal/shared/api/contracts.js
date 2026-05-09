function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumeric(value) {
  return typeof value === "number" || (typeof value === "string" && !Number.isNaN(Number(value)));
}

// --- Shared validators ---

export function validateEvent(event) {
  if (!isObject(event)) return { ok: false, reason: "Event must be an object" };
  if (!hasText(event.type)) return { ok: false, reason: "Event type is required" };
  return { ok: true };
}

export function validateWebsitePayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "Name must be non-empty" };
  if (payload.domain !== undefined && !hasText(payload.domain)) return { ok: false, reason: "Domain must be non-empty" };
  return { ok: true };
}

export function validateSubscriptionPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "Name must be non-empty" };
  return { ok: true };
}

export function validatePluginPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "Name must be non-empty" };
  return { ok: true };
}

export function validateProfilePayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.email !== undefined && !hasText(payload.email)) return { ok: false, reason: "Email must be non-empty" };
  return { ok: true };
}

export function validateTicketPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.subject !== undefined && !hasText(payload.subject)) return { ok: false, reason: "Subject must be non-empty" };
  return { ok: true };
}

export function validatePaymentMethodPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.label !== undefined && !hasText(payload.label)) return { ok: false, reason: "Label must be non-empty" };
  return { ok: true };
}

export function validateApiKeyPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "Name must be non-empty" };
  return { ok: true };
}

export function validateSettingsPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  return { ok: true };
}

// --- Admin validators (shared for backward compatibility) ---

export function validateCompanyPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.name !== undefined && !hasText(payload.name)) return { ok: false, reason: "Name must be non-empty" };
  if (payload.ownerEmail !== undefined && !hasText(payload.ownerEmail)) return { ok: false, reason: "Owner email must be non-empty" };
  return { ok: true };
}

export function validateTeamPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.email !== undefined && !hasText(payload.email)) return { ok: false, reason: "Email must be non-empty" };
  return { ok: true };
}

export function validateBillingPayload(payload) {
  if (!isObject(payload)) return { ok: false, reason: "Payload must be an object" };
  if (payload.amount !== undefined && !isNumeric(payload.amount)) return { ok: false, reason: "Amount must be numeric" };
  return { ok: true };
}
