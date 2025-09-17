

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { GroundingChunk, SuggestedStop } from "../types";


const API_KEY = process.env.API_KEY;

// Only initialize 'ai' if the API_KEY is valid. This is crucial.
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  try {
      ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
      console.error("Failed to initialize GoogleGenAI, likely due to an invalid API Key format.", e);
      ai = null;
  }
} else {
  console.warn("API_KEY environment variable not found. Gemini API calls will be mocked.");
}

const parseGeminiResponse = <T>(textResponse: string): T | null => {
    if (!textResponse) return null;
    
    let jsonStr = textResponse.trim();
    const fenceRegex = /^```(?:\w+\s*)?\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    try {
        const parsedData = JSON.parse(jsonStr);
        return parsedData as T;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e, "Raw response:", textResponse);
        return null;
    }
};


export const getMaintenanceAdviceFromGemini = async (
  make: string,
  model: string,
  year: number,
  mileage: number
): Promise<{ advice: string[]; sources: GroundingChunk[] | null; error?: string }> => {
  if (!ai) {
    console.warn("Gemini service not available. Returning mock maintenance advice.");
    const mockAdvice = [
      `For a ${year} ${make} ${model}, it is recommended to change the oil and filter every 7,500 to 10,000 km to ensure engine longevity.`,
      `Given the vehicle has ${mileage.toLocaleString()} km, a thorough inspection of the tire tread and pressure is advised. Consider rotation if not done recently.`,
      `At this mileage, it is crucial to have the brake pads, rotors, and brake fluid checked for wear and effectiveness.`,
      `*(This is mock data. Configure API_KEY in your environment for live advice.)*`
    ];
    return { advice: mockAdvice, sources: null, error: undefined };
  }
  
  const prompt = `Provide common maintenance advice for a ${year} ${make} ${model} with ${mileage} miles. 
Focus on typical checks, fluid changes, and part replacements for a vehicle of this age and mileage. 
Use Google Search for up-to-date information if relevant.
Respond with a valid JSON object in the following format only. Do not include any introductory or concluding paragraphs or markdown formatting like \`\`\`json.
{
  "advice": ["string (first advice point in a full sentence)", "string (second advice point in a full sentence)", "string (third advice point, etc.)"]
}`;

  try {
    const response : GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        temperature: 0.5,
      }
    });
    
    const textResponse = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks || null;

    const parsedData = parseGeminiResponse<{advice: string[]}>(textResponse);
    
    if (!parsedData || !parsedData.advice) {
        throw new Error("Invalid or empty JSON structure in Gemini response.");
    }
    
    return { advice: parsedData.advice, sources };
  } catch (error) {
    console.error("Error fetching maintenance advice from Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with Gemini API.";
    return { advice: [], sources: null, error: `Failed to get maintenance advice: ${errorMessage}` };
  }
};


export const getTripSuggestionsFromGemini = async (
  origin: string,
  destination: string,
  waypoints: string[],
  vehicleType: string
): Promise<{ routeSuggestion?: string; suggestedStops?: SuggestedStop[]; estimatedDistance?: string; estimatedDuration?: string; error?: string; }> => {
  if (!ai) {
    console.warn("Gemini service not available. Returning mock trip suggestions.");
    const mockSuggestions = {
      routeSuggestion: `Mock route: Take NH48 for the fastest route. Watch for congestion near Delhi.`,
      suggestedStops: [
        { id: 'mock1', name: 'Food Plaza, midway', type: 'Rest Area' as const, notes: 'Good for lunch' },
        { id: 'mock2', name: 'Jaipur Toll', type: 'Toll' as const, estimatedCost: 250 },
      ],
      estimatedDistance: 'Approx. 280 km',
      estimatedDuration: 'Approx. 4-5 hours',
    };
    return mockSuggestions;
  }
  
  const prompt = `
  Generate a trip plan for a ${vehicleType} from ${origin} to ${destination}${waypoints.length > 0 ? `, via ${waypoints.join(", ")}` : ''}.
  Provide the following in a valid JSON object only. Do not include any introductory or concluding paragraphs or markdown formatting like \`\`\`json.
  {
    "routeSuggestion": "string (a concise, human-readable route suggestion, mentioning major highways)",
    "suggestedStops": [ { "id": "string (unique id for the stop)", "name": "string (name of the stop)", "type": "Toll|Fuel|Rest Area|Other", "locationHint": "string (brief location hint, e.g., 'near Jaipur')", "estimatedCost": number (for Toll type only, otherwise omit), "notes": "string (optional brief note)" } ],
    "estimatedDistance": "string (e.g., 'Approx. 550 km')",
    "estimatedDuration": "string (e.g., 'Approx. 9 hours 30 mins')"
  }`;

  try {
    const response : GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routeSuggestion: { type: Type.STRING },
            suggestedStops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Toll', 'Fuel', 'Rest Area', 'Other'] },
                  locationHint: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                },
                 required: ['id', 'name', 'type']
              }
            },
            estimatedDistance: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING }
          }
        }
      }
    });

    const parsedData = parseGeminiResponse<{
        routeSuggestion?: string; 
        suggestedStops?: SuggestedStop[]; 
        estimatedDistance?: string; 
        estimatedDuration?: string; 
    }>(response.text);

    if (!parsedData) {
      throw new Error("Invalid or empty JSON structure in Gemini response.");
    }
    return parsedData;

  } catch (error) {
    console.error("Error fetching trip suggestions from Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with Gemini API.";
    return { error: `Failed to get trip suggestions: ${errorMessage}` };
  }
};


export const getCostForecastFromGemini = async (
  historicalDataSummary: string
): Promise<{ forecast: string; savingsAdvice: string[]; error?: string }> => {
  if (!ai) {
    console.warn("Gemini service not available. Returning mock cost forecast.");
    return {
      forecast: "Mock forecast: Expect a 5% increase in fuel costs next quarter due to market trends.",
      savingsAdvice: [
        "Consolidate short trips to improve fuel efficiency.",
        "Negotiate bulk discounts on parts for scheduled maintenance.",
        "*(This is mock data. Configure API_KEY for live advice.)*",
      ],
    };
  }

  const prompt = `
  Based on the following fleet cost summary, provide a brief financial forecast and actionable advice for cost savings.
  Summary:
  ${historicalDataSummary}

  Respond with a valid JSON object in the following format only. Do not include any introductory or concluding paragraphs or markdown formatting like \`\`\`json.
  {
    "forecast": "string (a brief, one-sentence forecast for the next period)",
    "savingsAdvice": ["string (first actionable advice point)", "string (second actionable advice point)", "string (third, etc.)"]
  }`;

  try {
    const response : GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecast: { type: Type.STRING },
            savingsAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const parsedData = parseGeminiResponse<{ forecast: string; savingsAdvice: string[] }>(response.text);

    if (!parsedData) {
        throw new Error("Invalid or empty JSON structure in Gemini response.");
    }
    return { forecast: parsedData.forecast, savingsAdvice: parsedData.savingsAdvice };

  } catch (error) {
    console.error("Error fetching cost forecast from Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with Gemini API.";
    return { forecast: '', savingsAdvice: [], error: `Failed to get cost forecast: ${errorMessage}` };
  }
};