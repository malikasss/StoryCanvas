import { GoogleGenAI } from "@google/genai";
import { AspectRatio, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key exists to avoid immediate errors
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Converts a File object to a Base64 string for the API.
 */
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes an image to suggest a caption and colors based on GEM-BOT specifications.
 * Uses gemini-3-pro-preview.
 */
export const analyzeImageForCover = async (imageFile: File): Promise<AnalysisResult> => {
  if (!ai) throw new Error("API Key is missing");

  const imagePart = await fileToPart(imageFile);
  const model = "gemini-3-pro-preview";

  const prompt = `
    You are GEM-bot, an AI design assistant. Analyze this image for a 9:16 social media story cover.

    Tasks:
    1. Provide a short, creative, engaging caption (max 8 words).
    2. Extract 2 dominant hex color codes:
       - One for a deep background gradient (darker tone).
       - One for an accent/highlight (vibrant tone).
    3. Determine if the overall image lighting is 'bright' or 'dark'.

    Return ONLY a JSON object with this structure:
    {
      "suggestedCaption": "Your caption here",
      "colorPalette": ["#darkHex", "#vibrantHex"],
      "imageBrightness": "bright" // or "dark"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates an image using Gemini.
 * Uses gemini-3-pro-image-preview.
 */
export const generateCreativeImage = async (
  prompt: string, 
  ratio: AspectRatio
): Promise<string> => {
  if (!ai) throw new Error("API Key is missing");

  const model = "gemini-3-pro-image-preview";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: ratio,
          imageSize: "1K"
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};
