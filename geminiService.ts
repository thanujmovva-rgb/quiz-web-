
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateQuiz(topic: string): Promise<Question[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 5 multiple-choice questions about "${topic}". 
               Each question should be fun and informative. 
               Return the data in the specified JSON schema.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct answer" }
          },
          required: ["text", "options", "correctIndex"]
        }
      }
    }
  });

  const json = JSON.parse(response.text.trim());
  return json.map((q: any, idx: number) => ({
    ...q,
    id: `q-${idx}-${Date.now()}`
  }));
}
