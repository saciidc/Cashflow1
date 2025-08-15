import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, SearchFilters } from "../types";

export const generateReportSummary = async (transactions: Transaction[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    if (transactions.length === 0) {
        return "There are no transactions to analyze in the selected period.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
You are a financial analyst assistant for a tool called Cashflow. Based on the following list of transactions, provide a concise summary and analysis. The transactions are provided in a JSON format.

Data:
${JSON.stringify({ transactions }, null, 2)}

Your analysis should include:
1.  **Overall Summary**: A brief overview of the financial activity, including total income, total expenses, and the net cash flow (income - expenses).
2.  **Key Insights**: Analyze transaction descriptions to identify the largest sources of income and biggest areas of expense. Mention the top 2-3 examples and their values.
3.  **Observations or Recommendations**: Point out any notable patterns, trends, or potential areas for financial improvement (e.g., high spending in a specific area, inconsistent income). Keep it brief and actionable.

Present the report in clear, easy-to-read markdown format. Start with a top-level heading '# Financial Summary'. Use bullet points for lists.
Do not include the raw JSON data in your response.
Be friendly and encouraging.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to generate AI summary. The API call was unsuccessful.");
    }
};

export const generateTransactionDescription = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const fullPrompt = `Expand the following brief note into a clear, concise transaction description. Keep it under 100 characters. Note: "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        return response.text.trim().replace(/^"|"$/g, '');
    } catch (error) {
        console.error("Gemini description generation failed:", error);
        throw new Error("Failed to generate description.");
    }
};

export const parseNaturalLanguageSearchQuery = async (query: string): Promise<SearchFilters> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
Parse the user's natural language query to filter a list of financial transactions.
The current date is ${today}.

Query: "${query}"

Extract the following information and return it as a JSON object:
- text: Any general search terms for the description.
- startDate: The start of the date range in YYYY-MM-DD format.
- endDate: The end of the date range in YYYY-MM-DD format.
- type: The transaction type, which must be either 'income' or 'expense'.
- minAmount: The minimum transaction amount.
- maxAmount: The maximum transaction amount.

Interpret relative dates like "last week", "this month", "yesterday" based on the current date.
If a field is not mentioned in the query, do not include it in the JSON object.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, nullable: true, description: "General search term for description." },
                        startDate: { type: Type.STRING, nullable: true, description: "Start date in YYYY-MM-DD format." },
                        endDate: { type: Type.STRING, nullable: true, description: "End date in YYYY-MM-DD format." },
                        type: { type: Type.STRING, enum: ['income', 'expense'], nullable: true, description: "Transaction type." },
                        minAmount: { type: Type.NUMBER, nullable: true, description: "Minimum amount." },
                        maxAmount: { type: Type.NUMBER, nullable: true, description: "Maximum amount." }
                    },
                }
            }
        });

        return JSON.parse(response.text) as SearchFilters;

    } catch (error) {
        console.error("Gemini search query parsing failed:", error);
        // Fallback to simple text search
        return { text: query };
    }
};