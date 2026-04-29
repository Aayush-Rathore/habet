/**
 * Unit tests for Call-to-Action validation functions
 */

import { describe, it, expect } from "vitest";
import {
  isDownloadIntentKeyword,
  validateCallToAction,
} from "./blog-validation";

describe("isDownloadIntentKeyword", () => {
  it("returns true for keywords with 'download'", () => {
    expect(isDownloadIntentKeyword("habet app download")).toBe(true);
    expect(isDownloadIntentKeyword("download habet")).toBe(true);
    expect(isDownloadIntentKeyword("DOWNLOAD HABET APP")).toBe(true);
  });

  it("returns true for keywords with 'apk'", () => {
    expect(isDownloadIntentKeyword("habet apk")).toBe(true);
    expect(isDownloadIntentKeyword("APK habet")).toBe(true);
    expect(isDownloadIntentKeyword("habet betting apk")).toBe(true);
  });

  it("returns true for keywords with 'install'", () => {
    expect(isDownloadIntentKeyword("install habet")).toBe(true);
    expect(isDownloadIntentKeyword("habet install guide")).toBe(true);
    expect(isDownloadIntentKeyword("INSTALL HABET APP")).toBe(true);
  });

  it("returns true for keywords with 'get app'", () => {
    expect(isDownloadIntentKeyword("get app habet")).toBe(true);
    expect(isDownloadIntentKeyword("GET APP for betting")).toBe(true);
  });

  it("returns false for non-download-intent keywords", () => {
    expect(isDownloadIntentKeyword("habet betting tips")).toBe(false);
    expect(isDownloadIntentKeyword("cricket betting guide")).toBe(false);
    expect(isDownloadIntentKeyword("ipl predictions")).toBe(false);
    expect(isDownloadIntentKeyword("sports betting strategy")).toBe(false);
  });

  it("returns false for empty or invalid input", () => {
    expect(isDownloadIntentKeyword("")).toBe(false);
    expect(isDownloadIntentKeyword("   ")).toBe(false);
  });
});

describe("validateCallToAction", () => {
  const contentWithCTA = "Some intro text [Download HABET](/) more content";
  const contentWithAbsoluteCTA =
    "Some intro text [Download HABET](https://habetapk.com/) more content";
  const contentWithoutCTA = "Some intro text without any links";

  describe("for download-intent keywords", () => {
    it("returns true when CTA link is present (relative URL)", () => {
      expect(validateCallToAction(contentWithCTA, "habet app download")).toBe(
        true
      );
      expect(validateCallToAction(contentWithCTA, "habet apk")).toBe(true);
      expect(validateCallToAction(contentWithCTA, "install habet")).toBe(true);
    });

    it("returns true when CTA link is present (absolute URL)", () => {
      expect(
        validateCallToAction(contentWithAbsoluteCTA, "habet app download")
      ).toBe(true);
      expect(validateCallToAction(contentWithAbsoluteCTA, "habet apk")).toBe(
        true
      );
    });

    it("returns false when CTA link is missing", () => {
      expect(
        validateCallToAction(contentWithoutCTA, "habet app download")
      ).toBe(false);
      expect(validateCallToAction(contentWithoutCTA, "habet apk")).toBe(false);
      expect(validateCallToAction(contentWithoutCTA, "install habet")).toBe(
        false
      );
    });

    it("is case-insensitive for keyword detection", () => {
      expect(
        validateCallToAction(contentWithCTA, "HABET APP DOWNLOAD")
      ).toBe(true);
      expect(validateCallToAction(contentWithCTA, "Habet Apk")).toBe(true);
      expect(validateCallToAction(contentWithoutCTA, "INSTALL HABET")).toBe(
        false
      );
    });
  });

  describe("for non-download-intent keywords", () => {
    it("returns true regardless of CTA link presence", () => {
      expect(validateCallToAction(contentWithCTA, "betting tips")).toBe(true);
      expect(validateCallToAction(contentWithoutCTA, "betting tips")).toBe(
        true
      );
      expect(validateCallToAction(contentWithCTA, "cricket guide")).toBe(true);
      expect(validateCallToAction(contentWithoutCTA, "cricket guide")).toBe(
        true
      );
    });
  });

  describe("edge cases", () => {
    it("returns false for empty content", () => {
      expect(validateCallToAction("", "habet app download")).toBe(false);
      expect(validateCallToAction("   ", "habet apk")).toBe(false);
    });

    it("returns false for empty keyword", () => {
      expect(validateCallToAction(contentWithCTA, "")).toBe(false);
      expect(validateCallToAction(contentWithoutCTA, "")).toBe(false);
    });

    it("handles multiple CTA links", () => {
      const contentWithMultipleCTAs = `
        Intro text [Download](/)
        Middle text [Get HABET](/)
        End text [Install Now](/)
      `;
      expect(
        validateCallToAction(contentWithMultipleCTAs, "habet app download")
      ).toBe(true);
    });
  });
});
