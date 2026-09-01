import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import Catalog from "@/pages/catalog";
import Console from "@/pages/console";
import ToolPage from "@/pages/tool-page";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <AppShell>
            <Catalog />
          </AppShell>
        )}
      </Route>
      <Route path="/console">
        {() => (
          <AppShell>
            <Console />
          </AppShell>
        )}
      </Route>
      <Route path="/tools/:slug">
        {({ slug }) => (
          <AppShell key={slug}>
            <ToolPage />
          </AppShell>
        )}
      </Route>
      <Route>
        {() => (
          <AppShell>
            <NotFound />
          </AppShell>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
