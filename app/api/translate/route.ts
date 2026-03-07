import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

export async function POST(req: Request) {
    try {
        const { text, targetLang } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const prompt = `Translate the following text from English to ${targetLang}. Return ONLY the translated text, no other commentary.\n\nText: ${text}`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        return NextResponse.json({ translatedText });
    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
}
