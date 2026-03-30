import { Router, type IRouter } from "express";
import { db, conversations, messages } from "../../db/index.js";
import { eq, asc } from "drizzle-orm";
import { together } from "../../lib/together.js";
import { fallbackResponses } from "../../lib/fallbackResp.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are TaxMate AI, a friendly Nigerian tax assistant helping small business owners, market traders, and informal workers understand taxation in Nigeria.

You specialise in:
- Personal Income Tax (PIT) under the Personal Income Tax Act (PITA)
- Value Added Tax (VAT) — currently 7.5% in Nigeria
- Withholding Tax (WHT)
- Company Income Tax (CIT)
- NRS (Nigeria Revenue Service) compliance, TIN registration, and filing deadlines
- LIRS (Lagos Internal Revenue Service) and other state revenue boards
- Simple bookkeeping, expense tracking, and record-keeping for small businesses
- Tax reliefs and allowances available to individual taxpayers in Nigeria

Always explain things in plain, simple English. Use Nigerian Naira (₦) for amounts. Be concise, practical, and empathetic. If a question is outside your expertise, recommend the user contact FIRS directly at www.firs.gov.ng or call 0800-FIRS-TIN (0800-3477-846).`;

router.get("/conversations", async (_req, res) => {
  try {
    const list = await db
      .select()
      .from(conversations)
      .orderBy(asc(conversations.createdAt));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(conv);
  } catch (err) {
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    // const id = parseInt(req.params.id, 10);
    const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "Invalid conversation ID" });
        return;
      }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {

  try {
    const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "Invalid conversation ID" });
        return;
      }
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    // const body = { content };

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: content,
    });

    const histor = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

      const history = histor.slice(-8);


// const chatMessages = [
//   { role: "system", content: SYSTEM_PROMPT },
//   ...history
//     .filter((m) => m.content && m.content.trim().length > 0)
//     .map((m) => ({
//       role: m.role,
//       content: m.content.trim(),
//     })),
// ];



const safeMessages = [
  { role: "system", content: SYSTEM_PROMPT },
  ...history
    .filter((m) => m?.content && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.trim(),
    })),
];


 res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

res.flushHeaders?.();

res.write(`data: ${JSON.stringify({ start: true })}\n\n`);

let fullResponse = "";
let responseEnded = false;

try {
  const stream = await together.chat.completions.create({
    model: "meta-llama/Llama-3-8b-chat-hf",
    messages: safeMessages as {
      role: "system" | "user" | "assistant";
      content: string;
    }[],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk?.choices?.[0]?.delta?.content;

    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

  if (!responseEnded) {
    res.end();
    responseEnded = true;
  }

} catch (err: any) {
  console.error("Together AI error:", err);

  const isCreditLimitError =
    err?.status === 429 ||
    err?.message?.includes("quota") ||
    err?.message?.includes("Credit limit exceeded");

  if (isCreditLimitError) {
    const fallbackMessage =
      fallbackResponses[content] ??
      "Sorry, I'm having trouble generating a response at the moment due to temporary AI service limits.. Please try again later or contact FIRS directly at www.firs.gov.ng or call 0800-FIRS-TIN (0800-3477-846) for urgent tax inquiries.";

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fallbackMessage,
    });

    res.write(`data: ${JSON.stringify({ content: fallbackMessage })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

    if (!responseEnded) {
      res.end();
      responseEnded = true;
    }
  } else {
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      if (!responseEnded) {
        res.end();
        responseEnded = true;
      }
    }
  }
}

  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
