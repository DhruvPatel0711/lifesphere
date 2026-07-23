import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractTextFromPdfBuffer } from "@/lib/pdf-parser";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let textContent = formData.get("text") as string | null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        textContent = await extractTextFromPdfBuffer(buffer);
      }
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: "No extractable text found in uploaded report." },
        { status: 400 }
      );
    }

    // Call Groq LLM with report parsing prompt
    const chatModel = new ChatOpenAI({
      modelName: "llama-3.3-70b-versatile",
      openAIApiKey: process.env.GROQ_API_KEY,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
      temperature: 0.1,
    });

    const systemPrompt = `You are a medical laboratory report parser. Your job is to extract specific key health metrics from the provided medical report text and return them in a strict JSON format.

    Extract the following metrics if present in the text:
    - hemoglobin (e.g. 13.5 g/dL)
    - fasting_blood_glucose (e.g. 95 mg/dL)
    - total_cholesterol (e.g. 185 mg/dL)
    - hdl (e.g. 50 mg/dL)
    - ldl (e.g. 110 mg/dL)
    - triglycerides (e.g. 140 mg/dL)
    - blood_pressure (e.g. 120/80 mmHg)
    - thyroid_tsh (e.g. 2.4 mIU/L)
    - summary_findings (2 sentence summary of overall results)
    - abnormal_flags (array of strings for any out-of-range values)

    Return ONLY a valid JSON object with these keys. If a metric is not mentioned, use null for its value.`;

    const response = await chatModel.invoke([
      ["system", systemPrompt],
      ["human", textContent],
    ]);

    let parsedData = {};
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(response.content.toString());
      }
    } catch {
      console.warn("Failed to parse LLM JSON output", response.content);
      parsedData = { raw_output: response.content.toString() };
    }

    return NextResponse.json({
      success: true,
      extractedText: textContent.substring(0, 500) + "...",
      parsedMetrics: parsedData,
    });
  } catch (error) {
    console.error("Report parse API error:", error);
    return NextResponse.json({ error: "Failed to parse medical report." }, { status: 500 });
  }
}
