# SEO Blog Expansion - Type Definitions

This directory contains shared TypeScript type definitions for the SEO Blog Expansion feature.

## Overview

The `seo-blog.ts` file defines all interfaces and types used across the SEO blog expansion components:

- **Blog Post Types**: `BlogFrontmatter`, `BlogPost`
- **Blog Generator Types**: `BlogGeneratorConfig`, `BlogGenerationRequest`, `BlogGenerationResult`
- **Content Validator Types**: `ValidationRule`, `ValidationResult`, `ContentValidationSchema`
- **Internal Link Manager Types**: `LinkInsertionPoint`, `LinkDistributionStrategy`, `InternalLinkConfig`, `LinkTarget`, `LinkTargetRegistry`
- **SEO Optimizer Types**: `GSCKeywordData`, `KeywordAnalysis`, `TopicRecommendation`, `GSCQueryData`, `GSCPageData`
- **Content Inventory Types**: `ContentInventoryEntry`, `ContentInventorySummary`, `ContentInventoryDatabase`

## Usage

Import types in your components:

```typescript
import type {
  BlogPost,
  BlogFrontmatter,
  ValidationResult,
  GSCKeywordData,
} from "./types/seo-blog";
```

## Validation Standards

### BlogFrontmatter Requirements

- **title**: Unique, includes target keyword
- **slug**: Unique, kebab-case format
- **date**: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- **excerpt**: 150-160 characters, includes primary keyword
- **keywords**: 8-12 keywords array
- **author**: "HABET Sports Team"
- **readingTime**: Format: "X min read"
- **lastUpdated** (optional): ISO 8601 format, added when posts are updated
- **id** (optional): UUID for tracking

### Content Validation Schema

- **Word Count**: 2500-4000 words
- **Keyword Density**: 0.8-1.2% (0.008-0.012)
- **Internal Links**: 20-25 links per post
  - Max 3 links per paragraph
  - Distribution: 2 intro, 15-18 body, 3-5 conclusion
- **Heading Structure**:
  - H1: exactly 1
  - H2: 5-8
  - H3: 10-15
- **Required Sections**: FAQ, Conclusion
- **Excerpt Length**: 150-160 characters
- **Keywords Count**: 8-12 keywords

## Testing

Run type verification tests:

```bash
npm test -- lib/types/seo-blog.test.ts
```
