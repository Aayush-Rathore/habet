# Test Fixtures - SEO Blog Expansion

This directory contains test fixtures for the SEO Blog Expansion feature.

## Files

### GSC Data Files

**gsc-queries.csv**
- Sample Google Search Console query data
- Contains 15 sample queries with clicks, impressions, CTR, and position
- Includes high-priority keywords like "habet", "habet app download", "habet app real or fake"
- Used for testing SEO optimizer keyword analysis and prioritization

**gsc-pages.csv**
- Sample Google Search Console page performance data
- Contains 6 sample pages with clicks, impressions, CTR, and position
- Includes homepage, existing blog posts, and site pages
- Used for testing page performance analysis

### Sample Content

**sample-blog-post.md**
- Complete sample blog post with valid frontmatter and content
- Demonstrates proper structure with:
  - Valid frontmatter (title, slug, date, excerpt, keywords, author, readingTime)
  - Proper heading hierarchy (H1, H2, H3)
  - Multiple sections including FAQ and Conclusion
  - Approximately 1000 words of content
- Used for testing content validation, link insertion, and parsing

### Verification Tests

**fast-check-verification.test.ts**
- Verifies fast-check library is properly installed and configured
- Tests basic property-based testing functionality
- Demonstrates custom arbitraries for blog-specific data structures
- Run with: `npm test -- test/fixtures/fast-check-verification.test.ts`

## Usage in Tests

### Loading GSC Data

```typescript
import fs from "fs";
import path from "path";

const gscQueriesPath = path.join(__dirname, "../test/fixtures/gsc-queries.csv");
const gscData = fs.readFileSync(gscQueriesPath, "utf-8");
```

### Loading Sample Blog Post

```typescript
import fs from "fs";
import path from "path";

const samplePostPath = path.join(__dirname, "../test/fixtures/sample-blog-post.md");
const samplePost = fs.readFileSync(samplePostPath, "utf-8");
```

### Using in Property Tests

```typescript
import fc from "fast-check";

// Generate blog posts based on sample structure
const blogPostArbitrary = fc.record({
  frontmatter: fc.record({
    title: fc.string({ minLength: 10, maxLength: 100 }),
    slug: fc.stringMatching(/^[a-z0-9-]+$/),
    keywords: fc.array(fc.string(), { minLength: 8, maxLength: 12 }),
    // ... other fields
  }),
  content: fc.lorem({ maxCount: 4000 }),
});
```

## GSC Data Format

### Query Data Columns

- **query**: Search query string
- **clicks**: Number of clicks from search results
- **impressions**: Number of times page appeared in search results
- **ctr**: Click-through rate (clicks/impressions)
- **position**: Average position in search results

### Page Data Columns

- **page**: Full URL of the page
- **clicks**: Number of clicks to the page
- **impressions**: Number of times page appeared in search results
- **ctr**: Click-through rate
- **position**: Average position in search results

## Adding New Fixtures

When adding new test fixtures:

1. Follow the existing CSV format for GSC data
2. Use valid markdown with frontmatter for blog posts
3. Ensure data is realistic and representative of production scenarios
4. Document the fixture purpose in this README
5. Add corresponding test cases that use the fixture
