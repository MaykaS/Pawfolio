import { describe, expect, it } from "vitest";
import { cleanupAuthCallbackUrl, parseAuthCallbackUrl } from "./cloud";

describe("cloud auth callback helpers", () => {
  it("parses auth callback state from a signed-in return URL", () => {
    expect(
      parseAuthCallbackUrl("https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&code=abc123&state=xyz"),
    ).toEqual({
      requestedTab: "profile",
      authReturn: true,
      code: "abc123",
      error: "",
    });
  });

  it("keeps non-auth query params while cleaning auth callback URL noise", () => {
    expect(
      cleanupAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&code=abc123&state=xyz&view=compact",
      ),
    ).toBe("/?tab=profile&view=compact");
  });

  it("surfaces auth provider errors cleanly", () => {
    expect(
      parseAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&error=access_denied&error_description=Provider%20disabled",
      ),
    ).toEqual({
      requestedTab: "profile",
      authReturn: false,
      code: "",
      error: "Provider disabled",
    });
  });
});
