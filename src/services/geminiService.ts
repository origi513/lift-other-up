import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getCheckInFeedback(mood: string, reason: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a compassionate mentor and therapeutic coach for a 14-16 year old student.
      The student is currently feeling "${mood}" because: "${reason}".
      
      Provide a response that:
      1. Validates their feeling without judgment.
      2. Offers a small, actionable piece of "micro-advice" or a gentle perspective shift.
      3. Ends with a warm, encouraging closing.
      
      Keep the tone supportive, informal but respectful, and concise (max 3 sentences). Avoid generic platitudes.`,
    });
    return response.text || "I'm here for you. Thank you for sharing that with me.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thank you for sharing your feelings. Remember that it's okay to feel exactly how you do right now.";
  }
}

export async function getReflectionFeedback(category: string, content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user reflected on their ${category} growth: "${content}". 
      Provide a warm, supportive, and age-appropriate (14-16 years old) therapeutic response. 
      Encourage their self-awareness and growth. Keep it concise (2-3 sentences).`,
    });
    return response.text || "That's a great reflection. Keep growing!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Great reflection! Self-awareness is the first step to growth.";
  }
}
