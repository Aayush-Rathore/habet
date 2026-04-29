import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!)
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! })

export async function generateBlogPost(topic: string, keywords: string[]): Promise<string> {
  const keywordList = keywords.join(", ")

  const prompt = `You are an expert sports betting content writer targeting Indian audiences. Write a comprehensive, SEO-optimized blog post about: "${topic}"

Target keywords: ${keywordList}

STRICT REQUIREMENTS:

1. WORD COUNT & STRUCTURE:
   - Minimum 2500 words in the body content
   - One H1 (# Title) at the very top
   - 5-8 H2 sections (## Section Name)
   - 10-15 H3 sub-sections (### Sub-section Name) distributed within H2 sections
   - A FAQ section with heading "## FAQ" containing 4-6 question-answer pairs formatted as:
     **Q: Question here?**
     **A:** Answer here.
   - A conclusion section with heading "## Conclusion"

2. EEAT COMPLIANCE - DATA POINTS & STATISTICS:
   - Include at least 3 specific data points, statistics, or examples per major section
   - Use realistic cricket match statistics (e.g., "54% win rate in home matches", "847 T20I matches analyzed")
   - Include specific odds ranges (e.g., "odds ranging from 1.8x to 2.5x", "typical IPL match odds: 1.5x–3.2x")
   - Include payout percentages (e.g., "97.3% RTP on live cricket markets", "95-97% average RTP")
   - Reference specific tournaments, leagues, or matches (IPL 2026, T20 World Cup, India vs Australia series)
   - Include user statistics or growth figures where relevant (e.g., "10,000+ active users", "₹50 crore monthly betting volume")

3. ACTIONABLE ADVICE - STEP-BY-STEP INSTRUCTIONS:
   - Provide practical, step-by-step betting strategies with numbered lists
   - Include specific examples: "Step 1: Analyze team form over last 5 matches", "Step 2: Check pitch conditions and weather"
   - Offer actionable tips that demonstrate genuine expertise and first-hand experience
   - Include specific scenarios: "When betting on IPL matches, if the team batting first scores 180+, consider backing them with odds below 2.0x"

4. RESPONSIBLE GAMBLING DISCLAIMERS:
   - Include at least one disclaimer about responsible gambling in the introduction or early in the content
   - Add a disclaimer in the conclusion section
   - Use phrases like: "Always bet responsibly and within your means", "Gambling should be for entertainment only", "Never chase losses", "Set betting limits before you start"
   - Include legal compliance notes: "Ensure online betting is legal in your jurisdiction", "Only bet if you are 18+ years old"

5. FAQ SECTION (4-6 Q&A PAIRS):
   - Create 4-6 frequently asked questions that address common user concerns
   - Format each Q&A pair as:
     **Q: [Question addressing user concern]?**
     **A:** [Detailed answer with specific information]
   - Address topics like: legitimacy, safety, withdrawals, betting limits, app features, legal concerns
   - Example questions: "Is HABET app safe and secure?", "How long do withdrawals take?", "What is the minimum deposit amount?"

6. HABET APP FEATURE REFERENCES:
   - Reference actual HABET app functionality to demonstrate first-hand experience
   - Mention specific features: "HABET's live betting interface", "instant withdrawal system", "24/7 customer support", "secure payment gateway"
   - Include app-specific details: "HABET offers 50+ cricket betting markets", "live streaming available for IPL matches", "cash-out feature for in-play bets"
   - Reference the app naturally throughout the content, not just in promotional sections

7. HINDI PHRASE INTEGRATION:
   - Write in English with natural Hindi phrases sprinkled throughout (5-10 instances per 1000 words)
   - Use conversational Hindi phrases: "Yeh app bahut accha hai" (This app is very good), "Cricket betting mein" (In cricket betting), "Dosto," (Friends,)
   - Use Hindi terms for emphasis: "Zabardast" (Awesome), "Ekdum sahi" (Absolutely right), "Dhyan se" (Carefully)
   - Ensure Hindi phrases feel natural and resonate with Indian readers, not forced

8. MOBILE-FRIENDLY FORMATTING:
   - Use short paragraphs (3-5 sentences maximum, ideally 2-3 sentences)
   - Include bullet points or numbered lists in at least 4 sections
   - Ensure no heading section exceeds 400 words before the next heading
   - Use bold text to highlight key terms, statistics, or actionable advice (5-10 instances per post)
   - Include at least one blockquote or callout per 1000 words to break up text visually
   - Keep average sentence length below 20 words for readability
   - Use lists for: betting tips, step-by-step guides, feature comparisons, pros/cons

9. INTERNAL LINKING:
   - Include at least one internal link to the HABET home page using this exact markdown format: [HABET sports betting app](/)
   - Use natural anchor text for internal links that includes relevant keywords

10. CONTENT FRESHNESS:
    - Include year references (e.g., "2026") in the content where appropriate
    - Reference current or upcoming tournaments/seasons (IPL 2026, T20 World Cup 2026)

11. OUTPUT FORMAT:
    - Do NOT include any YAML frontmatter — output only the markdown body starting with the H1
    - Ensure all markdown formatting is correct (headings, bold text, lists, links, blockquotes)

Write the complete blog post now:`

  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}
