import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// For testing locally without a key, we'll provide a mock fallback if key is missing.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateBlogDescription(topic: string, wordCount: number): Promise<string> {
  if (!API_KEY) {
    console.warn("No Gemini API Key found. Returning mock description.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`This is a beautifully generated mock description for "${topic}". Since you don't have a Gemini API key configured yet, this placeholder text is shown. Once you add your VITE_GEMINI_API_KEY to the .env file, this will be magically replaced by AI-generated content tailored to your topic, strictly keeping it under ${wordCount} words as requested. Enjoy the premium aesthetic!`);
      }, 1500); // Simulate network latency
    });
  }

  try {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Write an engaging, well-formatted blog description for the topic: "${topic}". The description MUST be completely under ${wordCount} words. Format it beautifully with clear sentences.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    throw new Error("Failed to generate description. Please check your API key and try again.");
  }
}
