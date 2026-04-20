import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { densityMap } = await req.json();

    const prompt = `
      As a Stadium Intelligence AI, analyze the following crowd density data (0 to 1 scale):
      ${JSON.stringify(densityMap)}

      Based on this, estimate:
      1. Restroom Wait Times (Zone A and B).
      2. Concession Stall Wait Times (Zone C and D).
      3. Predicted Crowd Flow for the next 15 minutes.

      Return ONLY a JSON object with this structure:
      {
        "restroomWait": "string description",
        "stallWait": "string description",
        "prediction": "string description"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from markdown if necessary
    const jsonStr = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("AI Bridge Error:", error);
    return NextResponse.json(
      {
        restroomWait: "Service unavailable",
        stallWait: "Service unavailable",
        prediction: "Unable to calculate flow"
      },
      { status: 500 }
    );
  }
}
