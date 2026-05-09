import { describe, expect, it } from "vitest";
import {
  validateBillingPayload,
  validateCompanyPayload,
  validateEvent,
  validateTeamPayload,
} from "./contracts";

describe("admin api contracts", () => {
  it("validates company payload", () => {
    expect(validateCompanyPayload({ name: "Acme", ownerEmail: "owner@acme.com" }).ok).toBe(true);
    expect(validateCompanyPayload({ name: "" }).ok).toBe(false);
  });

  it("validates team payload", () => {
    expect(validateTeamPayload({ email: "user@acme.com" }).ok).toBe(true);
    expect(validateTeamPayload({ email: " " }).ok).toBe(false);
  });

  it("validates billing payload", () => {
    expect(validateBillingPayload({ amount: 100 }).ok).toBe(true);
    expect(validateBillingPayload({ amount: "abc" }).ok).toBe(false);
  });

  it("validates event payload", () => {
    expect(validateEvent({ type: "company.create", payload: {} }).ok).toBe(true);
    expect(validateEvent({ type: "" }).ok).toBe(false);
  });
});

