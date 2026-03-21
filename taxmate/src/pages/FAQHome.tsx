import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send, Bot, User, ExternalLink, Loader2, MessageCircle, User2Icon, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

const FAQ_ITEMS = [
  {
    question: "What is FIRS and what does it do?",
    answer:
      "The Federal Inland Revenue Service (FIRS) is Nigeria's apex tax authority. It is responsible for assessing, collecting, and accounting for taxes due to the Federal Government. FIRS administers taxes like Company Income Tax (CIT), Value Added Tax (VAT), Withholding Tax (WHT), Capital Gains Tax, and more. You can reach them at www.firs.gov.ng or call 0800-FIRS-TIN.",
  },
  {
    question: "Do I need a Tax Identification Number (TIN)?",
    answer:
      "Yes. Every individual earning income and every registered business in Nigeria must have a TIN. You can get your TIN free of charge from any FIRS office, through Joint Tax Board (JTB) or online at www.jtb.gov.ng. Without a TIN you cannot open a corporate bank account, access government contracts, or renew certain licences.",
  },
  {
    question: "What is the Personal Income Tax (PIT) rate in Nigeria?",
    answer:
      "Nigeria uses a progressive tax scale: First ₦300,000 — 7%; Next ₦300,000 — 11%; Next ₦500,000 — 15%; Next ₦500,000 — 19%; Next ₦1,600,000 — 21%; Above ₦3,200,000 — 24%. You are entitled to a Consolidated Relief Allowance (CRA) of ₦200,000 + 20% of gross income before applying these rates.",
  },
  {
    question: "What is VAT and do I need to charge it?",
    answer:
      "Value Added Tax (VAT) in Nigeria is currently 7.5%. If your annual turnover exceeds ₦25 million, you must register for VAT with FIRS and file monthly VAT returns. Market traders and small businesses below this threshold are typically exempt, but must still account for VAT they pay on goods and services they purchase.",
  },
  {
    question: "When are tax returns due?",
    answer:
      "Individuals must file annual self-assessment returns by 31 March of the following year. Companies must file CIT returns within 6 months of their accounting year-end. VAT returns are due by the 21st of the following month. Late filing attracts penalties — ₦25,000 for the first month and ₦5,000 for each subsequent month.",
  },
  {
    question: "What records should I keep as a small business owner?",
    answer:
      "Keep all receipts, invoices, bank statements, and cash books for at least 6 years. FIRS can audit your records at any time. TaxMate helps you digitise receipts instantly using your phone camera, categorise expenses, and generate a summary report when filing season arrives.",
  },
  {
    question: "What is Withholding Tax (WHT)?",
    answer:
      "Withholding Tax is an advance payment of income tax deducted at source. For example, when a company pays you for a service, they deduct WHT (typically 5–10% depending on the transaction type) before paying you. The deducted amount is remitted to FIRS and credited against your final tax liability.",
  },
  {
    question: "Can I get a tax clearance certificate?",
    answer:
      "Yes. A Tax Clearance Certificate (TCC) is issued by FIRS or your State Revenue Authority to confirm you have no outstanding tax liabilities. It is required for government contracts, bank loans, travel documents, and operating licences. You must have filed and paid all taxes for the preceding 3 years.",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FAQHome() {
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
    <>
    <div className="grid grid-cols-12 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="col-span-12 bg-primary/5 px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Help Center</h3>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="col-span-12 shadow-md md:col-span-6 p-4 ">
          <div className="col-span-12 bg-primary/5 px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 pb-4 ">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <User2Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm"> Frequently Asked Questions</h3>
              </div>
            </div>
          </div>
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
        <div className="col-span-12 shadow-md md:col-span-6 p-4">
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
                    VAT, PAYE, TIN, FIRS deadlines, and more
                  </p>
                </motion.div>
              )}
              <div className="flex flex-wrap gap-2 pb-3 justify-center mt-3">
                {["How do I get a TIN?", "Taxable Annual Income?", "When is VAT due?", "What tax reliefs can I claim?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
        <div className="col-span-12 bg-muted/60 px-5 py-4 border-b border-border/30">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Contact FIRS directly</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>📞 Toll-free: <span className="font-medium text-foreground">0800-FIRS-TIN (0800-3477-846)</span></p>
            <p>🌐 Website: <a href="https://www.firs.gov.ng" target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/40">www.firs.gov.ng</a></p>
            <p>📧 Email: <a href="mailto:info@firs.gov.ng" className="text-primary underline decoration-primary/40">info@firs.gov.ng</a></p>
          </div>
        </div>

      </div>
    </>
  );
}
