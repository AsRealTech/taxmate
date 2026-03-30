import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, ScanLine, HelpCircle, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/account", label: "Account", icon: User},
  { path: "/receipts", label: "Scan", icon: ScanLine, isPrimary: true },
  { path: "/login", label: "Login", icon: LogIn },
  { path: "/faq", label: "Help", icon: HelpCircle },
];

export function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col mb-4 min-h-[100dvh] bg-background w-full mx-auto px-4 sm:max-w-[540px] md:max-w-[720px] 
    lg:max-w-[960px] xl:max-w-[1140px] 2xl:max-w-[1320px] relative overflow-hidden md:rounded-[2.5rem] md:my-8 md:h-[90vh]">
      
      {/* Top Header */}
      {title && (
        <header className="px-6 pt-12 pb-4 glass-panel sticky top-0 z-40">
          <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 overflow-y-auto no-scrollbar pb-28",
        !title && "pt-0"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
            <br/><br/><br/><br/>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed md:absolute bottom-0 left-0 right-0 z-50 px-6 py-4 pb-safe bg-background/90 backdrop-blur-xl border-t border-border/50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <ul className="flex items-center justify-between max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            
            if (item.isPrimary) {
              return (
                <li key={item.path} className="relative -top-6">
                  <Link href={item.path} className="block group">
                    <div className={cn(
                      "flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-transform duration-300 active:scale-95",
                      isActive ? "bg-accent shadow-accent/40" : "bg-primary shadow-primary/30"
                    )}>
                      <item.icon className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className={cn(
                    "flex flex-col items-center justify-center w-16 gap-1.5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/10" : "bg-transparent"
                  )}>
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium tracking-wide transition-all",
                    isActive ? "opacity-100" : "opacity-70"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
