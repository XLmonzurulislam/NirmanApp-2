import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Labor from "@/pages/Labor";
import Expenses from "@/pages/Expenses";
import Photos from "@/pages/Photos";
import Reports from "@/pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/materials" component={Materials} />
      <Route path="/labor" component={Labor} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/photos" component={Photos} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(1); // Default to first site

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex h-screen pt-16 md:pt-0 overflow-hidden">
              <Sidebar 
                open={sidebarOpen} 
                setOpen={setSidebarOpen} 
                currentSite={currentSite}
                setCurrentSite={setCurrentSite}
              />
              <div className="flex-1 overflow-auto">
                <Router />
              </div>
            </div>
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
