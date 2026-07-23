import { NextRequest, NextResponse } from "next/server";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { auth } from "@/auth";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

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

const systemPrompt = `You are a Medical assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, say that you don't know. Use three sentences maximum and keep the answer concise.

{context}`;

// Singleton instances for performance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pineconeIndex: any = null;
let embeddings: HuggingFaceTransformersEmbeddings | null = null;
let chatModel: ChatOpenAI | null = null;
let prompt: ChatPromptTemplate | null = null;

async function getServices() {
  if (!embeddings) {
    embeddings = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2",
    });
  }

  if (!pineconeIndex) {
    const pinecone = new Pinecone();
    pineconeIndex = pinecone.Index("medical-chatbot");
  }

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  const retriever = vectorStore.asRetriever({ k: 3 });

  if (!chatModel) {
    chatModel = new ChatOpenAI({
      modelName: "llama-3.3-70b-versatile",
      openAIApiKey: process.env.GROQ_API_KEY, 
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
    });
  }
  
  if (!prompt) {
    prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "{input}"],
    ]);
  }

  return { retriever, chatModel, prompt };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const { retriever, chatModel, prompt } = await getServices();

    // Custom retrieval execution
    const docs = await retriever.invoke(message);
    const context = docs.map(d => d.pageContent).join("\\n\\n");
    
    // Parameterized invocation (prevents prompt injection)
    const formattedPrompt = await prompt.formatMessages({ context, input: message });
    const response = await chatModel.invoke(formattedPrompt);

    return NextResponse.json({ answer: response.content });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
