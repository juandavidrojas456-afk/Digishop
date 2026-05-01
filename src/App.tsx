/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import SellerProfile from './pages/SellerProfile';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/Checkout';
import Navbar from './components/Navbar';
import Chat from './components/Chat';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <div className="min-h-screen bg-steam-dark text-steam-accent">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/seller/:id" element={<SellerProfile />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                </Routes>
              </main>
              <Chat />
            </div>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
