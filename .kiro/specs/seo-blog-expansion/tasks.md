# Implementation Plan: SEO Blog Expansion

## Overview

This implementation plan breaks down the SEO Blog Expansion feature into discrete coding tasks. The feature extends the existing Next.js blog system to generate 5-10 new SEO-optimized blog posts (2500+ words each) with strategic internal linking (20-25 links per post), validate content quality, and update 3 existing posts with bidirectional links.

The implementation follows a bottom-up approach: build core validation and utility components first, then SEO optimization and link management, then orchestrate blog generation, and finally implement property-based tests for all 28 correctness properties.

## Tasks

- [x] 1. Set up project infrastructure and core utilities
  - Create directory structure for new components (lib/seo-optimizer.ts, lib/content-validator.ts, lib/internal-link-manager.ts, lib/blog-generator.ts, lib/content-inventory.ts)
  - Install fast-check library for property-based testing (already in package.json)
  - Create test fixtures directory (test/fixtures/) with sample GSC data and blog posts
  - Create types file (lib/types/seo-blog.ts) for shared interfaces
  - _Requirements: 1.1, 7.8, 9.1_

- [x] 2. Implement content validation component
  - [x] 2.1 Create ContentValidator class with validation rules
    - Implement word count validation (2500-4000 words)
    - Implement keyword density calculation and validation (0.8-1.2%)
    - Implement heading structure validation (1 H1, 5-8 H2, 10-15 H3)
    - Implement frontmatter completeness validation
    - Implement excerpt validation (150-160 chars, includes primary keyword)
    - Implement slug format validation (kebab-case, uniqueness)
    - Implement date format validation (ISO 8601)
    - _Requirements: 1.5, 1.6, 1.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.8_
  
  - [x] 2.2 Write property test for word count validation
    - **Property 3: Word Count Validation**
    - **Validates: Requirements 1.5**
  
  - [x] 2.3 Write property test for keyword density validation
    - **Property 1: Keyword Density Validation**
    - **Validates: Requirements 1.2, 7.3**
  
  - [x] 2.4 Write property test for heading structure validation
    - **Property 4: Heading Structure Validation**
    - **Validates: Requirements 1.6**
  
  - [x] 2.5 Write property test for frontmatter completeness
    - **Property 5: Frontmatter Completeness**
    - **Validates: Requirements 1.7, 3.3, 7.8, 9.1, 10.1**
  
  - [x] 2.6 Write property test for slug generation and uniqueness
    - **Property 2: Slug Generation and Uniqueness**
    - **Validates: Requirements 1.4, 7.2**

- [x] 3. Implement mobile readability and visual element validation
  - [x] 3.1 Add mobile readability validation rules to ContentValidator
    - Validate paragraph length (max 5 sentences)
    - Validate section length (max 400 words between headings)
    - Validate average sentence length (max 20 words)
    - Validate list count (minimum 4 lists per post)
    - Validate bold text count (5-10 instances)
    - Validate blockquote count (1 per 1000 words)
    - Validate TOC presence for posts >2000 words
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 3.2 Write property test for mobile readability validation
    - **Property 23: Mobile Readability Validation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.6**
  
  - [x] 3.3 Write property test for visual element validation
    - **Property 24: Visual Element Validation**
    - **Validates: Requirements 8.4, 8.5, 8.7**

- [x] 4. Implement FAQ section and metadata validation
  - [x] 4.1 Add FAQ section validation to ContentValidator
    - Validate FAQ section exists with ## FAQ heading
    - Validate FAQ contains 4-6 question-answer pairs
    - _Requirements: 3.5_
  
  - [x] 4.2 Add title uniqueness and excerpt validation
    - Implement title uniqueness check against existing posts
    - Implement excerpt length and keyword presence validation
    - _Requirements: 7.1, 7.4_
  
  - [x] 4.3 Add reading time calculation utility
    - Implement calculateReadingTime function (200 words/min, round up)
    - _Requirements: 7.5_
  
  - [x] 4.4 Write property test for FAQ section validation
    - **Property 10: FAQ Section Validation**
    - **Validates: Requirements 3.5**
  
  - [x] 4.5 Write property test for title uniqueness validation
    - **Property 20: Title Uniqueness Validation**
    - **Validates: Requirements 7.1**
  
  - [x] 4.6 Write property test for excerpt validation
    - **Property 21: Excerpt Validation**
    - **Validates: Requirements 7.4**
  
  - [x] 4.7 Write property test for reading time calculation
    - **Property 22: Reading Time Calculation**
    - **Validates: Requirements 7.5**

- [x] 5. Checkpoint - Ensure all validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement SEO Optimizer component
  - [x] 6.1 Create SEOOptimizer class with GSC data analysis
    - Implement CSV parsing for GSC query data
    - Implement keyword filtering (10+ impressions, 0 clicks)
    - Implement keyword prioritization algorithm
    - Implement search intent classification (informational, navigational, transactional)
    - Implement topic recommendation generation
    - Implement keyword cannibalization detection
    - _Requirements: 4.1, 4.4, 4.5, 6.6, 9.6_
  
  - [x] 6.2 Write property test for GSC keyword filtering
    - **Property 11: GSC Keyword Filtering**
    - **Validates: Requirements 4.1**
  
  - [x] 6.3 Write property test for keyword assignment validation
    - **Property 12: Keyword Assignment Validation**
    - **Validates: Requirements 4.4**
  
  - [x] 6.4 Write property test for search intent classification
    - **Property 13: Search Intent Classification**
    - **Validates: Requirements 4.5**
  
  - [x] 6.5 Write property test for keyword cannibalization prevention
    - **Property 26: Keyword Cannibalization Prevention**
    - **Validates: Requirements 9.6**

- [x] 7. Implement Internal Link Manager component
  - [x] 7.1 Create InternalLinkManager class with link insertion logic
    - Implement link target registry (blogs and pages)
    - Implement link insertion point identification algorithm
    - Implement link distribution strategy (2 intro, 15-18 body, 3-5 conclusion)
    - Implement links-per-paragraph limit enforcement (max 3)
    - Implement relative URL format validation
    - Implement homepage link insertion for "HABET APK" mentions
    - Implement link target existence validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.5, 7.6_
  
  - [x] 7.2 Write property test for internal link count and distribution
    - **Property 6: Internal Link Count and Distribution**
    - **Validates: Requirements 2.1, 2.2, 2.6, 5.2**
  
  - [x] 7.3 Write property test for relative URL format
    - **Property 7: Relative URL Format**
    - **Validates: Requirements 2.5**
  
  - [x] 7.4 Write property test for links per paragraph limit
    - **Property 8: Links Per Paragraph Limit**
    - **Validates: Requirements 2.4**
  
  - [x] 7.5 Write property test for homepage link insertion
    - **Property 9: Homepage Link Insertion**
    - **Validates: Requirements 2.7**
  
  - [x] 7.6 Write property test for link target validation
    - **Property 19: Link Target Validation**
    - **Validates: Requirements 5.5, 7.6**

- [x] 8. Implement existing post update functionality
  - [x] 8.1 Add updateExistingPost method to InternalLinkManager
    - Implement existing post reading and parsing
    - Implement link insertion point identification in existing content
    - Implement content structure preservation (heading/paragraph count)
    - Implement frontmatter preservation with lastUpdated field addition
    - Implement file writing with updated content
    - _Requirements: 5.1, 5.3, 5.4, 5.6, 5.7, 10.2_
  
  - [x] 8.2 Write property test for link insertion point identification
    - **Property 16: Link Insertion Point Identification**
    - **Validates: Requirements 5.1**
  
  - [x] 8.3 Write property test for content structure preservation
    - **Property 17: Content Structure Preservation**
    - **Validates: Requirements 5.3**
  
  - [x] 8.4 Write property test for frontmatter preservation on update
    - **Property 18: Frontmatter Preservation on Update**
    - **Validates: Requirements 5.4**

- [x] 9. Checkpoint - Ensure link management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Content Inventory Tracker component
  - [x] 10.1 Create ContentInventoryTracker class with logging and reporting
    - Implement ContentInventoryEntry interface and database schema
    - Implement logPost method to record new post metadata
    - Implement updatePost method to update existing post metadata
    - Implement generateSummary method for aggregate statistics
    - Implement exportKeywordMapping method
    - Implement checkKeywordConflict method
    - Implement schema type assignment logic (Article, HowTo, FAQPage)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 10.2 Write property test for content inventory summary calculation
    - **Property 25: Content Inventory Summary Calculation**
    - **Validates: Requirements 9.3, 9.4**
  
  - [x] 10.3 Write property test for schema type assignment
    - **Property 27: Schema Type Assignment**
    - **Validates: Requirements 9.7**

- [x] 11. Implement Blog Generator component
  - [x] 11.1 Create BlogGenerator class with content generation orchestration
    - Implement BlogGeneratorConfig interface
    - Implement generateBlogPost method (orchestrates Gemini AI, validation, linking, file creation)
    - Implement generateMultiplePosts method for batch generation
    - Implement frontmatter construction logic
    - Implement title extraction from markdown
    - Implement excerpt extraction from markdown
    - Implement file writing to content/blogs/ directory
    - Implement error handling for Gemini API failures
    - Implement error handling for validation failures
    - Implement error handling for file system errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 4.6, 4.7, 10.1, 10.3, 10.4, 10.6_
  
  - [x] 11.2 Write property test for primary keyword placement
    - **Property 14: Primary Keyword Placement**
    - **Validates: Requirements 4.6**
  
  - [x] 11.3 Write property test for call-to-action validation
    - **Property 15: Call-to-Action Validation**
    - **Validates: Requirements 4.7**
  
  - [x] 11.4 Write property test for date consistency validation
    - **Property 28: Date Consistency Validation**
    - **Validates: Requirements 10.5**

- [x] 12. Enhance Gemini AI prompt for EEAT compliance
  - [x] 12.1 Update generateBlogPost function in lib/gemini.ts
    - Add prompt instructions for including specific data points and statistics
    - Add prompt instructions for step-by-step actionable advice
    - Add prompt instructions for responsible gambling disclaimers
    - Add prompt instructions for FAQ section generation (4-6 Q&A pairs)
    - Add prompt instructions for HABET app feature references
    - Add prompt instructions for Hindi phrase integration
    - Add prompt instructions for mobile-friendly formatting (short paragraphs, lists, bold text)
    - _Requirements: 1.3, 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 13. Checkpoint - Ensure blog generation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create blog generation workflow script
  - [x] 14.1 Create scripts/generate-seo-blogs.ts script
    - Implement CLI script that orchestrates the full workflow
    - Load GSC data from gsc/ directory
    - Call SEOOptimizer to analyze keywords and generate topic recommendations
    - Call BlogGenerator to generate 5-10 new blog posts
    - Call InternalLinkManager to update 3 existing blog posts
    - Call ContentInventoryTracker to log all posts and generate summary report
    - Implement error handling and progress logging
    - Output summary report with generated slugs, word counts, link counts
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 9.2, 9.3, 9.4, 9.5_

- [x] 15. Write integration tests for end-to-end workflows
  - [x] 15.1 Write integration test for blog generation workflow
    - Test complete blog generation from topic to file creation
    - Verify Gemini AI integration with real API calls
    - Verify file system operations create valid markdown files
    - Test error handling with invalid API responses
  
  - [x] 15.2 Write integration test for existing post update workflow
    - Test reading existing blog posts from file system
    - Test link insertion into real markdown content
    - Test frontmatter preservation and lastUpdated field addition
    - Verify updated files are valid and parseable
  
  - [x] 15.3 Write integration test for GSC data analysis workflow
    - Test CSV parsing with real GSC export files
    - Test keyword filtering and prioritization with real data
    - Test topic recommendation generation
  
  - [x] 15.4 Write integration test for content inventory workflow
    - Test inventory file creation and updates
    - Verify JSON serialization/deserialization
    - Test summary report generation with real post data

- [x] 16. Generate 5-10 new blog posts targeting GSC keywords
  - [x] 16.1 Run generate-seo-blogs.ts script to create new posts
    - Generate blog post: "Is HABET App Real or Fake? Legitimacy Verification 2026"
    - Generate blog post: "HABET Betting App Download Guide - Android & iOS 2026"
    - Generate blog post: "HABET vs Other Betting Apps - Complete Comparison 2026"
    - Generate blog post: "How to Withdraw Money from HABET - Step-by-Step Guide"
    - Generate blog post: "HABET Cricket Betting Markets Explained - Complete Guide"
    - Generate blog post: "HABET IPL Betting Bonus and Promotions 2026"
    - Generate 2-4 additional posts based on GSC keyword analysis
    - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_   
  
  - [x] 16.2 Validate all generated posts meet quality standards
    - Run ContentValidator on all generated posts
    - Verify word count (2500-4000 words)
    - Verify internal link count (20-25 links)
    - Verify keyword density (0.8-1.2%)
    - Verify heading structure (1 H1, 5-8 H2, 10-15 H3)
    - Verify EEAT elements (data points, disclaimers, FAQ)
    - _Requirements: 1.5, 1.6, 2.1, 3.5, 3.6, 7.3_

- [x] 17. Update 3 existing blog posts with internal links
  - [x] 17.1 Update cricket-betting-tips-india-2026.md
    - Add 8-12 internal links to new blog posts
    - Add lastUpdated field to frontmatter
    - Verify content structure preservation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_
  
  - [x] 17.2 Update ipl-betting-predictions-2026.md
    - Add 8-12 internal links to new blog posts
    - Add lastUpdated field to frontmatter
    - Verify content structure preservation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_
  
  - [x] 17.3 Update habet-app-download-guide.md
    - Add 8-12 internal links to new blog posts
    - Add lastUpdated field to frontmatter
    - Verify content structure preservation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

- [x] 18. Generate content inventory and keyword mapping reports
  - [x] 18.1 Generate content inventory summary report
    - Output total posts, total word count, total internal links
    - Output average word count and average links per post
    - Output keyword coverage map (keyword -> slug)
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 18.2 Generate keyword mapping document
    - Output primary and secondary keyword assignments per post
    - Verify no keyword cannibalization
    - Output schema markup recommendations per post
    - _Requirements: 9.4, 9.6, 9.7_

- [x] 19. Final checkpoint - Verify all requirements met
  - Ensure all tests pass, ask the user if questions arise.
  - Verify 5-10 new blog posts created with 2500+ words each
  - Verify 20-25 internal links per new post
  - Verify 8-12 new links added to each existing post
  - Verify all posts pass content validation
  - Verify zero keyword cannibalization
  - Verify all posts include EEAT elements

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Integration tests validate end-to-end workflows with real dependencies
- The implementation follows a bottom-up approach: utilities → validation → SEO → linking → generation → orchestration
- All code examples use TypeScript for the Next.js application
- The Gemini AI integration already exists in lib/gemini.ts and will be enhanced with EEAT-focused prompts
- GSC data is available in CSV format in the gsc/ directory
- Existing blog posts are in content/blogs/ directory
