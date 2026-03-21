import { useGetTransactions } from "@/lib/api-client";
import { ChevronRight } from "lucide-react";

export default function RecentActivity(){
        const { data: transactions, isLoading } = useGetTransactions();
        const recent = (transactions || []).slice(0, 3);

    return(
        <div>
            {/* Recent Activity */}
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
    )
}