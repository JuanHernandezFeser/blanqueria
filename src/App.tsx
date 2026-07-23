import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
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
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/NotFound";
import ProductDetail from "@/components/ProductDetail";
import VerifyEmail from "@/pages/VerifyEmail";
import CompleteProfile from "@/pages/CompleteProfile";
import { useProductStore } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAmbienteStore } from "@/stores/ambienteStore";
import { useHeroStore } from "@/stores/heroStore";
import { useBankConfigStore } from "@/stores/bankConfigStore";
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
};

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchAmbientes = useAmbienteStore((s) => s.fetchAmbientes);
  const fetchSlides = useHeroStore((s) => s.fetchSlides);
  const fetchConfig = useBankConfigStore((s) => s.fetchConfig);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAmbientes();
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
          <main className="min-h-[calc(100vh-4rem)] pb-14 md:pb-0">
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
              <Route path="/faq" element={<FAQ />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/verificar-email/:token" element={<VerifyEmail />} />
              <Route path="/completar-perfil" element={<CompleteProfile />} />
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
