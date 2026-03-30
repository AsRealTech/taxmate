import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send, Bot, User, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL;

const FAQ_ITEMS = [
  {
    question: "What is FIRS and what does it do?",
    answer:
      "The Federal Inland Revenue Service (FIRS) is Nigeria’s federal tax authority. It collects and manages taxes like Company Income Tax (CIT), Value Added Tax (VAT), Withholding Tax (WHT), and Capital Gains Tax. You can reach them at www.firs.gov.ng or call 0800-FIRS-TIN. FIRS ensures taxes are paid correctly and helps fund government services.",
  },
  {
    question: "Do I need a Tax Identification Number (TIN)?",
    answer:
      "Yes. Every person earning income and every registered business must have a TIN. You can get it free from FIRS, the Joint Tax Board (JTB), or online at www.jtb.gov.ng. Without a TIN, you cannot open a corporate bank account, bid for government contracts, or renew certain licenses.",
  },
  {
    question: "How is Personal Income Tax (PIT) calculated?",
    answer:
      "Nigeria uses a progressive tax system: 0 – ₦800,000: 0%; ₦800,001 – ₦3,000,000: 15%; ₦3,000,001 – ₦12,000,000: 18%; ₦12,000,001 – ₦25,000,000: 21%; ₦25,000,001 – ₦50,000,000: 23%; Above ₦50,000,000: 25%. You also get a Consolidated Relief Allowance (CRA) of ₦200,000 + 20% of your gross income before calculating tax.",
  },
  {
    question: "What is VAT and who should charge it?",
    answer:
      "Value Added Tax (VAT) is currently 7.5%. Businesses with annual turnover above ₦25 million must register for VAT and file monthly returns. Small businesses below that threshold usually don’t charge VAT, but still pay VAT on goods and services they purchase.",
  },
  {
    question: "When are tax returns due?",
    answer:
      "Individuals must file annual self-assessment returns by 31 March of the following year. Companies must file CIT returns within 6 months of their accounting year-end. VAT returns are due by the 21st of the following month. Late filing attracts penalties: ₦25,000 for the first month and ₦5,000 for each subsequent month.",
  },
  {
    question: "What records should I keep as a business owner?",
    answer:
      "Keep receipts, invoices, bank statements, and cash books for at least 6 years. FIRS can audit records at any time. Tools like TaxMate can help digitize receipts, track expenses, and generate reports for filing season.",
  },
  {
    question: "What is Withholding Tax (WHT)?",
    answer:
      "Withholding Tax is an advance tax deducted at source. For example, if a company pays you for a service, it may deduct 5–10% as WHT before paying you. The deducted amount is sent to FIRS and credited against your final tax bill.",
  },
  {
    question: "Can I get a Tax Clearance Certificate (TCC)?",
    answer:
      "Yes. A Tax Clearance Certificate (TCC) proves you have no outstanding taxes. It is required for government contracts, bank loans, travel documents, or operating licenses. You must have filed and paid all taxes for the last 3 years.",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function initConversation() {
    try {
      const res = await fetch(`${BASE}/api/openai/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Tax Questions" }),
      });
      const data = await res.json();
      setConversationId(data.id);
      setChatReady(true);
    } catch (err) {
      console.error("Failed to init conversation", err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming || !conversationId) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(
        `${BASE}/api/openai/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.content) {
                assistantContent += payload.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Stream error", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <AppLayout title="FAQ & Tax Help">
      <div className="px-4 pb-6 space-y-6">

        {/* FIRS Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r mt-4 from-green-600 to-green-700 p-4 text-white shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">🇳🇬</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Nigeria Revenue Service (FIRS)</p>
              <p className="text-xs text-green-100 mt-0.5">
                Nigeria's official tax authority — responsible for all federal taxes.
              </p>
              <a
                href="https://www.nrs.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-white underline decoration-white/50 mt-1.5 hover:text-green-100"
              >
                www.nrs.gov.ng <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
                >
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      openIndex === index && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="h-px bg-border/50 mb-3" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Chat Box */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Ask TaxMate AI</h2>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[320px]" style={{ whiteSpace: "pre-wrap" }}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full py-8 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Ask me anything about Nigerian tax</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    VAT, PAYE, TIN, NRS deadlines, and more
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {["How do I get a TIN?", "When is VAT due?", "What tax reliefs can I claim?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/20"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Thinking…
                      </span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-foreground/10 flex items-center justify-center mt-0.5">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3">
              <form onSubmit={sendMessage} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={chatReady ? "Ask a tax question…" : "Loading…"}
                  disabled={!chatReady || streaming}
                  className="flex-1 text-sm bg-muted rounded-xl px-4 py-2.5 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatReady || streaming || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {streaming ? (
                    <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                AI answers are for guidance only. Consult a tax professional for formal advice.
              </p>
            </div>
          </div>
        </div>

        {/* Contact FIRS */}
        <div className="rounded-2xl bg-muted/60 p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Contact FIRS directly</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>📞 Toll-free: <span className="font-medium text-foreground">0800-FIRS-TIN (0800-3477-846)</span></p>
            <p>🌐 Website: <a href="https://www.nrs.gov.ng" target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/40">www.nrs.gov.ng</a></p>
            <p>📧 Email: <a href="mailto:info@nrs.gov.ng" className="text-primary underline decoration-primary/40">info@nrs.gov.ng</a></p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
