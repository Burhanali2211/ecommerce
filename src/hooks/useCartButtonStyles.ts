import { useSettings } from '../contexts/SettingsContext';

export const useCartButtonStyles = () => {
  const { getSiteSetting } = useSettings();

  // Get dynamic cart button settings
  const cartButtonText = getSiteSetting('cart_button_text') || 'Add to Cart';
    const cartButtonColor = getSiteSetting('cart_button_color') || '#f59e0b'; // Premium Amber 500
    const cartButtonTextColor = getSiteSetting('cart_button_text_color') || '#ffffff'; // Default white

    // Generate dynamic styles
    const cartButtonStyle = {
      backgroundColor: cartButtonColor,
      color: cartButtonTextColor,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontWeight: '700',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    };

    const cartButtonHoverStyle = {
      backgroundColor: getSiteSetting('cart_button_hover_color') || '#d97706', // Amber 600
      filter: 'brightness(1.1)',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
    };

  return {
    cartButtonText,
    cartButtonStyle,
    cartButtonHoverStyle,
  };
};