import React, { memo, ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { NotificationProvider } from './NotificationContext';
import { ProductProvider } from './ProductContext';
import { ErrorProvider } from './ErrorContext';
import { OrderProvider } from './OrderContext';
import { AddressProvider } from './AddressContext';
import { ThemeProvider } from './ThemeContext';
import { AuthModalProvider } from './AuthModalContext';
import { SettingsProvider } from './SettingsContext';

import { SecurityProvider } from '../components/Security/SecurityProvider';
import { NetworkStatusProvider } from '../components/Common/NetworkStatusProvider';

interface CombinedProviderProps {
    children: ReactNode;
}

/**
 * Combined provider that wraps all context providers in a single component
 * This reduces the nesting level and improves performance
 */
export const CombinedProvider = memo<CombinedProviderProps>(({ children }) => {
    return (
        <ErrorProvider>
            <ThemeProvider>
                <NotificationProvider>
                    <AuthProvider>
                        <SecurityProvider>
                            <AuthModalProvider>
                                <SettingsProvider>
                                    <ProductProvider>
                                        <CartProvider>
                                            <WishlistProvider>
                                                <OrderProvider>
                                                    <AddressProvider>
                                                        <NetworkStatusProvider>
                                                            {children}
                                                        </NetworkStatusProvider>
                                                    </AddressProvider>
                                                </OrderProvider>
                                            </WishlistProvider>
                                        </CartProvider>
                                    </ProductProvider>
                                </SettingsProvider>
                            </AuthModalProvider>
                        </SecurityProvider>
                    </AuthProvider>
                </NotificationProvider>
            </ThemeProvider>
        </ErrorProvider>
    );
});

CombinedProvider.displayName = 'CombinedProvider';