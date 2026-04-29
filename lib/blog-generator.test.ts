/**
 * Unit tests for BlogGenerator
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the Gemini module before importing BlogGenerator
vi.mock("./gemini", () => ({
  generateBlogPost: vi.fn(),
}));

import { BlogGenerator } from "./blog-generator";
import type { BlogGeneratorConfig, BlogGenerationRequest } from "./types/seo-blog";

describe("BlogGenerator", () => {
  let config: BlogGeneratorConfig;
  let generator: BlogGenerator;

  beforeEach(() => {
    config = {
      minWordCount: 2500,
      maxWordCount: 4000,
      targetKeywordDensity: { min: 0.008, max: 0.012 },
      author: "HABET Sports Team",
      outputDir: "content/blogs",
    };
    generator = new BlogGenerator(config);
  });

  describe("constructor", () => {
    it("should create a BlogGenerator instance with valid config", () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(BlogGenerator);
    });
  });

  describe("generateBlogPost", () => {
    it("should have generateBlogPost method", () => {
      expect(typeof generator.generateBlogPost).toBe("function");
    });

    it("should accept a BlogGenerationRequest", () => {
      const request: BlogGenerationRequest = {
        topic: "HABET App Download Guide",
        primaryKeyword: "habet app download",
        secondaryKeywords: ["habet apk", "habet install"],
        searchIntent: "informational",
      };

      // Just verify the method signature accepts the request
      expect(() => {
        generator.generateBlogPost(request);
      }).not.toThrow();
    });
  });

  describe("generateMultiplePosts", () => {
    it("should have generateMultiplePosts method", () => {
      expect(typeof generator.generateMultiplePosts).toBe("function");
    });

    it("should accept an array of BlogGenerationRequest", () => {
      const requests: BlogGenerationRequest[] = [
        {
          topic: "HABET App Download Guide",
          primaryKeyword: "habet app download",
          secondaryKeywords: ["habet apk"],
          searchIntent: "informational",
        },
        {
          topic: "HABET Betting Tips",
          primaryKeyword: "habet betting tips",
          secondaryKeywords: ["cricket betting"],
          searchIntent: "informational",
        },
      ];

      // Just verify the method signature accepts the requests
      expect(() => {
        generator.generateMultiplePosts(requests);
      }).not.toThrow();
    });
  });
});
