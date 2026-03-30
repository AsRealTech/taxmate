/// <reference types="vite/client" />
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Transactions from "@/pages/Transactions";
import Receipts from "@/pages/Receipts";
import Tax from "@/pages/Tax";
import FAQ from "@/pages/FAQ";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider, RequireAuth } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/receipts" component={Receipts} />
      <Route path="/tax" component={Tax} />
      <Route path="/faq" component={FAQ} />
      <Route path="/login" component={Login} />
      <Route path="/account" component={() => (
        // <RequireAuth>
          <Dashboard />
        // </RequireAuth>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
