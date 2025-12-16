import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UnifiedScreening from "./pages/UnifiedScreening";
import Analytics from "./pages/Analytics";
import Interview from "./pages/Interview";
import Skills from "./pages/Skills";
import Shortlisted from "./pages/Shortlisted";
import Settings from "./pages/Settings";
import InterviewResults from "./pages/InterviewResults";
import ResumeBuilder from "./pages/ResumeBuilder";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Simple auth check - in production, use proper auth context
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="screening" element={<UnifiedScreening />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="interview" element={<Interview />} />
            <Route path="skills" element={<Skills />} />
            <Route path="shortlisted" element={<Shortlisted />} />
            <Route path="resume-builder" element={<ResumeBuilder />} />
            <Route path="settings" element={<Settings />} />
            <Route path="interview-results" element={<InterviewResults />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
