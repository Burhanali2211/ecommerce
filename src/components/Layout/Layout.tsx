import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartSidebar } from '../Cart/CartSidebar';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background-primary">

      {!isDashboardPage && !isAuthPage && (
        <Header
          onAuthClick={() => { }}
          onCartClick={() => setIsCartOpen(true)}
        />
      )}

      <main className={`${!isHomePage && !isDashboardPage && !isAuthPage ? "pt-24" : ""} relative`}>
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>

      {!isDashboardPage && !isAuthPage && <Footer />}

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};