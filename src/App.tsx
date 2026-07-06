import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MyAccount from "@/pages/MyAccount";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import PaymentReturn from "@/pages/PaymentReturn";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import { useProductStore } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useHeroStore } from "@/stores/heroStore";
import { useBankConfigStore } from "@/stores/bankConfigStore";
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchSlides = useHeroStore((s) => s.fetchSlides);
  const fetchConfig = useBankConfigStore((s) => s.fetchConfig);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSlides();
    fetchConfig();
    restoreSession();
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" toastOptions={{ className: 'font-body' }} />
      <BrowserRouter>
        <AppInitializer>
          <ScrollToTop />
          <Navbar />
          <WhatsAppButton />
          <main className="min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/mi-cuenta" element={<MyAccount />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pago/retorno" element={<PaymentReturn />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </AppInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
