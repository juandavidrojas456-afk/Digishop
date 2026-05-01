import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is missing. Please add it to your environment variables in Settings.");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Crear una sesión de Stripe Checkout
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { items, successUrl, cancelUrl, customerEmail, paymentMethod } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No products in cart" });
      }

      // Convertir items al formato de Stripe
      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: "brl", // Reais brasileiros
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100), // Stripe usa centavos
        },
        quantity: item.quantity,
      }));

      // Configurar métodos de pago permitidos
      const paymentMethodTypes: any[] = [];
      if (paymentMethod === 'credit_card' || !paymentMethod) {
        paymentMethodTypes.push('card');
      }
      if (paymentMethod === 'pix') {
        paymentMethodTypes.push('pix');
      }

      const sessionParams: any = {
        payment_method_types: paymentMethodTypes,
        line_items: lineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        // Configuración específica de Pix si está presente
        ...(paymentMethod === 'pix' ? {
          payment_method_options: {
            pix: {
              expires_after_seconds: 3600 // 1 hora
            }
          }
        } : {})
      };

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API de salud
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Integración con Vite para desarrollo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
