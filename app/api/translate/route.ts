import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text, targetLang } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[Gemini API] API key is missing in environment variables.");
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Translate the following text from English to ${targetLang}. Return ONLY the translated text, no other commentary.\n\nText: ${text}`;

        console.log(`[Gemini API] Translating to ${targetLang}...`);
        const result = await model.generateContent(prompt);

        if (!result.response) {
            throw new Error("No response from Gemini API");
        }

        const translatedText = result.response.text().trim();
        console.log(`[Gemini API] Translation successful.`);

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error("[Gemini API] Error during translation:", error?.message || error);
        return NextResponse.json({ error: "Translation failed", details: error?.message }, { status: 500 });
    }
}
