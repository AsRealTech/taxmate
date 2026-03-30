import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatNaira, cn } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, ScanLine, ListOrdered,
  Calculator, ChevronRight, CheckCircle2, Download,
  UserPlus, Sparkles, Star, X, Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useGetTransactions } from "@/lib/api-client";
import { format, parseISO } from "date-fns";

function calcTaxRate(taxable: number) {
  if (taxable <= 800_000) return 0;
  if (taxable <= 3_000_000) return 0.15;
  if (taxable <= 12_000_000) return 0.18;
  if (taxable <= 25_000_000) return 0.21;
  if (taxable <= 50_000_000) return 0.23;
  return 0.25;
}


function SignUpModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Unlock More Features</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-foreground text-lg">You're on the list!</h4>
            <p className="text-sm text-muted-foreground mt-2">We'll notify you when your account is ready. Keep tracking your business!</p>
            <button onClick={onClose} className="mt-5 w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm">Done</button>
          </div>
        ) : (
          <>
            <ul className="space-y-3 mb-6">
              {[
                "Automatic receipt scanning with AI",
                "Monthly tax reports & reminders",
                "Multi-business tracking",
                "WhatsApp tax alerts",
                "Export to Excel & PDF anytime",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => email && setSubmitted(true)}
              className="w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm active:scale-95 transition-transform"
            >
              Sign Me Up — It's Free
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  );
}

function TaxCalculatorSection() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [result, setResult] = useState<null | { income: number; expenses: number; taxable: number; tax: number; rate: number }>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data: transactions } = useGetTransactions();

  function calculate() {
    const inc = parseFloat(income.replace(/,/g, "")) || 0;
    const exp = parseFloat(expenses.replace(/,/g, "")) || 0;
    const taxable = Math.max(0, inc - exp);
    const rate = calcTaxRate(taxable);
    const tax = Math.round(taxable * rate * 100) / 100;
    setResult({ income: inc, expenses: exp, taxable, tax, rate });
  }

  async function downloadPdf() {
    if (!result) return;
    setDownloading(true);
    try {
      const txList = (transactions || []).slice(0, 20).map((tx) => ({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        category: tx.category?.name,
      }));
      const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/tax/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: result.income,
          expenses: result.expenses,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          businessName: "My Business",
          transactions: txList,
        }),
      });
      const blob = await res.blob();
      if (!res.ok) {
        const errorText = await blob.text();
        console.error("Failed to generate PDF:", res.status, errorText);
        throw new Error(errorText || `PDF request failed with status ${res.status}`);
      }
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-estimate-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const month = new Date().toLocaleString("en-NG", { month: "long" });

  return (
    <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
      <div className="bg-primary/5 px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Quick Tax Estimate</h3>
            <p className="text-xs text-muted-foreground">Enter your numbers for {month}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Income (₦)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 150000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Expenses (₦)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 45000"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
          />
        </div>
        <button
          onClick={calculate}
          disabled={!income}
          className="w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Calculate My Tax
        </button>
      </div>

      {result && (
        <div className="border-t border-border/30">
          {/* Result Summary */}
          <div className="px-5 py-4 bg-gradient-to-br from-primary/5 to-transparent space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Income</span>
              <span className="font-semibold text-foreground">{formatNaira(result.income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-semibold text-foreground">- {formatNaira(result.expenses)}</span>
            </div>
            <div className="h-px bg-border/50 my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxable Income</span>
              <span className="font-semibold text-foreground">{formatNaira(result.taxable)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax Rate</span>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{(result.rate * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Friendly Tax Message */}
          <div className="mx-5 mb-4 bg-primary rounded-2xl p-4 text-white">
            <p className="text-xs text-white/70 font-medium mb-0.5">Estimated Tax for {month}</p>
            <p className="text-3xl font-bold">{formatNaira(result.tax)}</p>
            <p className="text-xs text-white/80 mt-2 leading-relaxed">
              {result.tax === 0
                ? "Your expenses covered your income — no tax owed! Keep recording expenses to reduce your tax bill."
                : `Set aside about ${formatNaira(result.tax)} this month. Every expense you track reduces this amount!`}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="px-5 pb-5 space-y-3">
            <p className="text-xs text-center text-muted-foreground font-medium">What would you like to do?</p>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full border border-primary/30 bg-primary/5 text-primary font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-all hover:bg-primary/10"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Generating PDF…" : "Download Tax Summary (PDF)"}
            </button>
            <button
              onClick={() => setShowSignUp(true)}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-transform"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up for More Features
            </button>
            <p className="text-[10px] text-center text-muted-foreground leading-snug">
              Sign up to get monthly reports, WhatsApp reminders, and AI-powered receipt scanning.
            </p>
          </div>
        </div>
      )}

      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
    </div>
  );
}

export default function Dashboard() {
  const { data: transactions, isLoading } = useGetTransactions();
  const recent = (transactions || []).slice(0, 3);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const transactionCount = transactions?.length ?? 0;
  const totalIncome = transactions?.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : 0), 0) ?? 0;
  const totalExpenses = transactions?.reduce((sum, tx) => sum + (tx.type === "expense" ? tx.amount : 0), 0) ?? 0;


  function handleSignOut() {
    logout();
    setLocation("/login");
  }

  return (
    <AppLayout>
      <div className="px-5 pt-8 pb-6 space-y-6">

        {/* Hero */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-primary text-sm font-medium mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Welcome to TaxMate</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Your secure<br />personal dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[260px]">
              Track income, scan receipts, and understand your taxes — now protected behind your login.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Signed in as {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-border px-3 py-1 text-primary text-[11px] font-semibold transition hover:bg-primary/5"
              >
                Log out
              </button>
            </div>
          </div>
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-2xl font-black text-white">₦</span>
          </div>
        </div>

        {/* Action Cards */}
        <div>

        <div className="grid gap-3 mb-4 sm:grid-cols-3">
            {[
              { label: "Transactions", value: transactionCount || 0, accent: "text-primary" },
              { label: "Income", value: formatNaira(totalIncome), accent: "text-emerald-600" },
              { label: "Expenses", value: formatNaira(totalExpenses), accent: "text-destructive" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-border/50 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{card.label}</p>
                <p className={`text-xl font-semibold ${card.accent}`}>{card.value}</p>
              </div>
            ))}
          </div>


          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">

            {/* Add Income */}
            <TransactionForm
              initialData={{ type: "income" }}
              trigger={
                <button className="flex flex-col items-start p-4 bg-white rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition-all active:scale-95 text-left w-full">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-semibold text-sm text-foreground leading-tight">Add Income</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Record a sale or payment</p>
                </button>
              }
            />

            {/* Add Expense */}
            <TransactionForm
              initialData={{ type: "expense" }}
              trigger={
                <button className="flex flex-col items-start p-4 bg-white rounded-2xl border border-border/50 shadow-sm hover:border-red-200 hover:shadow-md transition-all active:scale-95 text-left w-full">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="font-semibold text-sm text-foreground leading-tight">Add Expense</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Log a business cost</p>
                </button>
              }
            />

            {/* Scan Receipt */}
            <Link href="/receipts" className="flex flex-col items-start p-4 bg-white rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <ScanLine className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-sm text-foreground leading-tight">Scan Receipt</p>
              <p className="text-xs text-muted-foreground mt-0.5">Photo → auto-extract</p>
            </Link>

            {/* View Transactions */}
            <Link href="/transactions" className="flex flex-col items-start p-4 bg-white rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 hover:shadow-md transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <ListOrdered className="w-5 h-5 text-purple-500" />
              </div>
              <p className="font-semibold text-sm text-foreground leading-tight">Transactions</p>
              <p className="text-xs text-muted-foreground mt-0.5">View all records</p>
            </Link>
          </div>
        </div>

        {/* Tax Calculator */}
        <TaxCalculatorSection />

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
            <Link href="/transactions" className="flex items-center gap-0.5 text-xs text-primary font-medium">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white rounded-2xl animate-pulse border border-border/50" />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((tx) => (
                <div key={tx.id} className="bg-white p-3.5 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0",
                      tx.type === "income" ? "bg-green-50" : "bg-red-50"
                    )}>
                      {tx.category?.icon || (tx.type === "income" ? "💰" : "💸")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(tx.date), "MMM d")} · {tx.category?.name || "Uncategorized"}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold shrink-0", tx.type === "income" ? "text-green-600" : "text-red-500")}>
                    {tx.type === "income" ? "+" : "-"}{formatNaira(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-border/70">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-medium text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the quick actions above to get started.</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
