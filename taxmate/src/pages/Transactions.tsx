import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetTransactions, Transaction, GetTransactionsType } from "@/lib/api-client";
import { formatNaira, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export default function Transactions() {
  const [filter, setFilter] = useState<"all" | GetTransactionsType>("all");
  const [search, setSearch] = useState("");
  
  const { data: transactions, isLoading } = useGetTransactions({
    type: filter === "all" ? undefined : filter
  });

  const transactionList = Array.isArray(transactions) ? transactions : [];
  if (transactions && !Array.isArray(transactions)) {
    console.warn("Unexpected transactions response shape:", transactions);
  }

  const filteredData = transactionList.filter(tx => 
    tx.description.toLowerCase().includes(search.toLowerCase()) ||
    tx.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const grouped = filteredData.reduce((acc, tx) => {
    const d = tx.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <AppLayout title="History">
      <div className="px-6 pb-6 space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="flex gap-3 sticky top-0 bg-background/95 backdrop-blur-md py-2 z-10 -mx-2 px-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-11 bg-white border-border/50 rounded-xl focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="w-11 h-11 bg-white border border-border/50 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-secondary rounded-2xl w-full">
          {(['all', 'income', 'expense'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 capitalize py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                filter === tab 
                  ? "bg-white text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-border/50" />
              ))}
            </div>
          ) : sortedDates.length > 0 ? (
            sortedDates.map(date => (
              <div key={date} className="animate-in slide-in-from-bottom-2 duration-500 fade-in">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-3">
                  {grouped[date].map(tx => (
                    <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner",
                          tx.type === 'income' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        )}>
                          {tx.category?.icon || (tx.type === 'income' ? <ArrowUpRight className="w-6 h-6"/> : <ArrowDownRight className="w-6 h-6"/>)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-base">{tx.description}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{tx.category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "font-bold font-display text-lg block",
                          tx.type === 'income' ? "text-primary" : "text-foreground"
                        )}>
                          {tx.type === 'income' ? '+' : '-'}{formatNaira(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h4 className="font-semibold text-lg text-foreground">No transactions found</h4>
              <p className="text-muted-foreground mt-2">Try changing your filters or add a new transaction.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-28 right-6 z-40 md:absolute md:bottom-24 md:right-6">
        <TransactionForm 
          trigger={
            <button className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
              <ArrowUpRight className="w-6 h-6 absolute ml-3 -mt-3 opacity-50" />
              <ArrowDownRight className="w-6 h-6 absolute -ml-3 mt-3 opacity-50" />
              <span className="text-3xl font-light mb-1">+</span>
            </button>
          }
        />
      </div>
    </AppLayout>
  );
}
