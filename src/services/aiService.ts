import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// The platform automatically injects GEMINI_API_KEY into the environment
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateText = async (prompt: string, modelName = "gemini-3-flash-preview") => {
  try {
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt
    });
    return result.text;
  } catch (error) {
    console.error("AI Text Generation failed:", error);
    throw error;
  }
};

export const analyzeMedia = async (media: string, mediaType: 'image' | 'video', prompt: string, modelName = "gemini-3-flash-preview") => {
  try {
    const base64Data = media.split(",")[1] || media;
    // For Gemini 3 series, mimeType should be part of inlineData
    const mimeType = mediaType === "video" ? "video/mp4" : "image/jpeg";

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });

    return result.text;
  } catch (error) {
    console.error("AI Media Analysis failed:", error);
    throw error;
  }
};

export const transformImage = async (media: string, prompt: string, modelName = "gemini-3-flash-preview") => {
  try {
    const base64Data = media.split(",")[1] || media;

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                }
            ]
        }
      ]
    });
    
    // Check for image in response
    const candidate = result.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

    if (imagePart) {
      return {
        image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      };
    } else {
      return {
        text: result.text
      };
    }
  } catch (error) {
    console.error("AI Image Transformation failed:", error);
    throw error;
  }
};
