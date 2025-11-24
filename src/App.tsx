import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Personnel from "./pages/Personnel";
import Applications from "./pages/Applications";
import HelpDesk from "./pages/HelpDesk";
import UserPortal from "./pages/UserPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Ruta raíz redirige al dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Autenticación */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Portal público de usuarios (sin autenticación) */}
            <Route path="/user-portal" element={<UserPortal />} />
            
            {/* Rutas protegidas del administrador */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Companies />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/personnel"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Personnel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Applications />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help-desk"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HelpDesk />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
