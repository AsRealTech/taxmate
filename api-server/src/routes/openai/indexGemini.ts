import { Router, type IRouter } from "express";
import { db, conversations, messages } from "../../db/index.js";
import { eq, asc } from "drizzle-orm";
import { ai } from "../../lib/gemini.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are TaxMate AI, a friendly Nigerian tax assistant helping small business owners, market traders, and informal workers understand taxation in Nigeria.

You specialise in:
- Personal Income Tax (PIT) under the Personal Income Tax Act (PITA)
- Value Added Tax (VAT) — currently 7.5% in Nigeria
- Withholding Tax (WHT)
- Company Income Tax (CIT)
- FIRS (Federal Inland Revenue Service) compliance, TIN registration, and filing deadlines
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
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
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
    const id = parseInt(req.params.id, 10);
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    const body = { content };

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
      content: body.content,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    // const stream = await openai.chat.completions.create({
    //   model: "gpt-5.2",
    //   max_completion_tokens: 8192,
    //   messages: chatMessages,
    //   stream: true,
    // });

    const stream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: chatMessages,
      });

    for await (const chunk of stream) {
      const content = chunk;
      // const content = chunk.choices[0]?.delta?.content;
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
    res.end();
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
