import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "navbar": {
        "home": "Home",
        "shop": "Shop",
        "cart": "Cart",
        "profile": "Profile",
        "admin": "Admin",
        "login": "Login / Sign Up",
        "search_placeholder": "Search for games or services..."
      },
      "home": {
        "popular_services": "Popular Services",
        "all_products": "All Products",
        "drag_more": "Drag to see more",
        "verified_seller": "Verified Seller",
        "buy_now": "Buy Now"
      },
      "checkout": {
        "title": "Checkout",
        "secure_environment": "100% Secure Environment",
        "payment_method": "Payment Method",
        "total": "Total",
        "confirm": "Confirm Payment",
        "back": "Back"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "access_denied": "Access Denied"
      }
    }
  },
  pt: {
    translation: {
      "navbar": {
        "home": "Início",
        "shop": "Loja",
        "cart": "Carrinho",
        "profile": "Perfil",
        "admin": "Admin",
        "login": "Entrar / Cadastrar"
      },
      "home": {
        "popular_services": "Serviços Populares",
        "all_products": "Todos os Produtos",
        "drag_more": "Arraste para ver mais",
        "verified_seller": "Vendedor Verificado",
        "buy_now": "Comprar Agora"
      },
      "checkout": {
        "title": "Finalização",
        "secure_environment": "Ambiente 100% Seguro",
        "payment_method": "Forma de Pagamento",
        "total": "Total",
        "confirm": "Confirmar Pagamento",
        "back": "Voltar"
      },
      "common": {
        "loading": "Carregando...",
        "error": "Erro",
        "access_denied": "Acesso Negado"
      }
    }
  },
  es: {
    translation: {
      "navbar": {
        "home": "Inicio",
        "shop": "Tienda",
        "cart": "Carrito",
        "profile": "Perfil",
        "admin": "Admin",
        "login": "Ingresar / Registrarse"
      },
      "home": {
        "popular_services": "Servicios Populares",
        "all_products": "Todos los Productos",
        "drag_more": "Desliza para ver más",
        "verified_seller": "Vendedor Verificado",
        "buy_now": "Comprar Ahora"
      },
      "checkout": {
        "title": "Pago",
        "secure_environment": "Ambiente 100% Seguro",
        "payment_method": "Método de Pago",
        "total": "Total",
        "confirm": "Confirmar Pago",
        "back": "Volver"
      },
      "common": {
        "loading": "Cargando...",
        "error": "Error",
        "access_denied": "Acceso Denegado"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
