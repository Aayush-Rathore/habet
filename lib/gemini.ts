import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!)
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! })

export async function generateBlogPost(topic: string, keywords: string[]): Promise<string> {
  const keywordList = keywords.join(", ")

  const prompt = `You are an expert sports betting content writer targeting Indian audiences. Write a comprehensive, SEO-optimized blog post about: "${topic}"

Target keywords: ${keywordList}

STRICT REQUIREMENTS:
1. Write in English with natural Hindi phrases sprinkled throughout where appropriate (e.g., "Yeh app bahut accha hai", "Cricket betting mein", "Dosto,") — this resonates with Indian readers.
2. Minimum 1500 words in the body content.
3. Follow EEAT principles: include specific data points (match statistics, odds ranges like 1.5x–3.2x, payout percentages like 95–97% RTP), expert-sounding analysis, and actionable advice.
4. Structure the post with EXACTLY this heading hierarchy:
   - One H1 (# Title) at the very top
   - At least 4 H2 sections (## Section Name)
   - At least 2 H3 sub-sections (### Sub-section Name) within the H2 sections
   - A FAQ section with heading "## FAQ" containing at least 3 question-answer pairs formatted as:
     **Q: Question here?**
     **A:** Answer here.
   - A conclusion section with heading "## Conclusion"
5. Include at least one internal link to the HABET home page using this exact markdown format: [HABET sports betting app](/)
6. Include specific, realistic data points such as:
   - Cricket match win rates or odds (e.g., "odds ranging from 1.8x to 2.5x")
   - Payout percentages (e.g., "97.3% RTP on live cricket markets")
   - User statistics or growth figures
   - Specific tournament or league names (IPL, T20 World Cup, etc.)
7. Provide actionable betting strategies and tips that demonstrate genuine expertise.
8. Do NOT include any YAML frontmatter — output only the markdown body starting with the H1.

Write the complete blog post now:`

  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}
