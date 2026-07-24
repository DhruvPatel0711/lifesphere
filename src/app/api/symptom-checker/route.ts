import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}

const MEDICAL_DISCLAIMER = "IMPORTANT NOTICE: This AI Symptom Assessment is generated for informational purposes only and DOES NOT constitute a professional medical diagnosis, clinical advice, or treatment plan. If you are experiencing a life-threatening emergency or severe symptoms, please immediately call Emergency Services or consult a licensed physician.";

// Rule-Based Intelligent Clinical Triage Engine
function generateRuleBasedTriage(symptoms: string) {
  const text = symptoms.toLowerCase();
  
  let urgency = "Medium";
  let recommendedSpecialist = "General Physician / Primary Care";
  const possibleCauses: string[] = [];
  const nextSteps: string[] = [];

  const emergencyKeywords = ["chest pain", "shortness of breath", "stroke", "unconscious", "numbness", "paralysis", "severe bleeding", "anaphylaxis"];
  const highKeywords = ["abdominal pain", "high fever", "vomiting", "stiff neck", "blood", "fainting", "severe headache", "migraine"];
  const lowKeywords = ["mild cough", "runny nose", "sneezing", "fatigue", "mild headache", "sore muscle", "dry skin"];

  if (emergencyKeywords.some(k => text.includes(k))) {
    urgency = "Emergency";
    recommendedSpecialist = "Emergency Department / Cardiologist";
    possibleCauses.push("Acute Cardiovascular / Respiratory Event", "Emergency Internal Illness");
    nextSteps.push("Call local Emergency Services (911/112) immediately", "Do not drive yourself to the hospital; await medical transport");
  } else if (highKeywords.some(k => text.includes(k))) {
    urgency = "High";
    if (text.includes("abdominal")) {
      recommendedSpecialist = "Gastroenterologist / General Surgeon";
      possibleCauses.push("Acute Appendicitis", "Gastroenteritis", "Gallbladder Inflammation");
      nextSteps.push("Visit an urgent care center or emergency physician today", "Avoid solid foods until examined by a doctor");
    } else {
      recommendedSpecialist = "Internal Medicine Specialist";
      possibleCauses.push("Acute Systemic Infection", "Severe Inflammatory Response");
      nextSteps.push("Schedule an urgent same-day medical appointment", "Monitor temperature and hydration closely");
    }
  } else if (lowKeywords.some(k => text.includes(k))) {
    urgency = "Low";
    recommendedSpecialist = "General Practitioner / Family Physician";
    possibleCauses.push("Viral Upper Respiratory Infection", "Mild Physical Strain / Tension");
    nextSteps.push("Rest and maintain adequate hydration", "Schedule a routine clinic consultation if symptoms persist > 3 days");
  } else {
    urgency = "Medium";
    recommendedSpecialist = "Primary Care Physician";
    possibleCauses.push("General Inflammatory / Metabolic Symptom Pattern", "Requires In-Person Clinical Assessment");
    nextSteps.push("Consult a primary care doctor for comprehensive evaluation", "Log symptom frequency and intensity daily");
  }

  const summary = `Patient reports: "${symptoms}". Clinical triage suggests a **${urgency.toUpperCase()}** priority evaluation focused on **${recommendedSpecialist}**.`;

  return {
    urgency,
    summary,
    possibleCauses,
    recommendedSpecialist,
    nextSteps,
    medicalDisclaimer: MEDICAL_DISCLAIMER,
    disclaimer: MEDICAL_DISCLAIMER,
    assessmentCompleted: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many symptom evaluation requests. Please wait a minute." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { symptoms } = body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return NextResponse.json({ error: "Symptom description is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey && !apiKey.includes("your_")) {
      try {
        const systemPrompt = `You are an AI Clinical Triage Assistant. Analyze the user's reported symptoms and return a structured assessment in STRICT JSON format with the following keys:
        - urgency: "Low" | "Medium" | "High" | "Emergency"
        - summary: string (2 sentence overview of symptoms in clean Markdown)
        - possibleCauses: string[] (array of 2-4 potential non-conclusive conditions)
        - recommendedSpecialist: string (e.g. "Cardiologist", "General Physician", "Neurologist")
        - nextSteps: string[] (array of 2-3 safe next action steps)
        - medicalDisclaimer: string (must state this is not a diagnosis)

        Return ONLY a valid JSON object matching this schema.`;

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LifeOS AI Health Platform",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openrouter/auto",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: symptoms },
            ],
            temperature: 0.2,
          }),
        });

        const openRouterData = await openRouterRes.json();
        const content = openRouterData?.choices?.[0]?.message?.content;

        if (openRouterRes.ok && content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            parsed.disclaimer = MEDICAL_DISCLAIMER;
            return NextResponse.json({ success: true, assessment: parsed });
          }
        }
      } catch (llmErr) {
        console.warn("[Symptom Checker] OpenRouter API call failed, using intelligent clinical fallback:", llmErr);
      }
    }

    // Fallback: Intelligent Rule-Based Clinical Triage Engine
    const ruleBasedAssessment = generateRuleBasedTriage(symptoms);
    return NextResponse.json({
      success: true,
      assessment: ruleBasedAssessment,
    });
  } catch (error) {
    console.error("Symptom Checker API Error:", error);
    return NextResponse.json({ error: "Failed to evaluate symptoms." }, { status: 500 });
  }
}
