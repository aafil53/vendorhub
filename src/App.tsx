import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProfile from "./pages/VendorProfile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

import { VendorLayout } from "./components/vendor/VendorLayout";
import RFQInbox from "./pages/vendor/RFQInbox";
import Quotations from "./pages/vendor/Quotations";
import Orders from "./pages/vendor/Orders";
import Invoices from "./pages/vendor/Invoices";
import Documents from "./pages/vendor/Documents";
import CompanyProfile from "./pages/vendor/CompanyProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor" 
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="rfq-inbox" element={<RFQInbox />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="orders" element={<Orders />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="documents" element={<Documents />} />
              <Route path="profile" element={<CompanyProfile />} />
            </Route>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
