import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  MapPin,
  CreditCard,
  Wallet,
  ShoppingBag,
  Truck,
  Shield,
  Banknote
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { useNotification } from '../contexts/NotificationContext';
import { RazorpayPayment } from '../components/Payment/RazorpayPayment';
import { apiClient } from '../lib/apiClient';

// Local storage keys
const SHIPPING_INFO_KEY = 'checkout_shipping_info';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const ImprovedCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved shipping info from localStorage
  const loadSavedShippingInfo = (): ShippingInfo => {
    try {
      const saved = localStorage.getItem(SHIPPING_INFO_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load shipping info:', error);
    }
    return {
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    };
  };

  const [formData, setFormData] = useState<ShippingInfo>(loadSavedShippingInfo());

  // Save shipping info to localStorage whenever it changes
  useEffect(() => {
    if (formData.firstName || formData.address) {
      try {
        localStorage.setItem(SHIPPING_INFO_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Failed to save shipping info:', error);
      }
    }
  }, [formData]);

  // Calculate pricing
  const subtotal = total;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const freeShippingThreshold = 2000;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 5;
  const finalTotal = subtotal + gst + shipping;

  // Debug cart items
  useEffect(() => {
  }, [items, itemCount, subtotal, finalTotal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missing = required.filter(field => !formData[field as keyof ShippingInfo]);

      if (missing.length > 0) {
        showNotification({
          type: 'error',
          title: 'Missing Information',
          message: `Please fill in: ${missing.join(', ')}`
        });
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification({
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.'
        });
        return false;
      }
    }
    return true;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setIsProcessing(true);
    try {
      // If order was already created (for Razorpay), verify payment status was updated
      if (orderId) {
        // Give payment verification a moment to update the database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Optionally verify payment status was updated (but don't block on it)
        try {
          const orderResponse = await apiClient.get(`/orders/${orderId}`);
          if (orderResponse.success && orderResponse.data) {
            const orderStatus = orderResponse.data.paymentStatus || orderResponse.data.payment_status;
            if (orderStatus === 'paid') {
              console.log('Payment status confirmed as paid');
            } else {
              console.warn('Payment status not yet updated, but payment was verified');
            }
          }
        } catch (err) {
          // Don't fail if we can't verify - payment was already verified
          console.warn('Could not verify payment status update:', err);
        }
        
        setOrderComplete(true);
        setShowPaymentModal(false);
        await clearCart();

        showNotification({
          type: 'success',
          title: 'Payment Successful!',
          message: `Your order #${orderId.slice(0, 8)} has been confirmed. Payment received.`
        });
        return;
      }

      // For COD or if order wasn't created yet, create it now
      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetAddress: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
        street: formData.address,
        zipCode: formData.zipCode
      };

      if (!user) {
        showNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to place an order'
        });
        return;
      }

      const newOrderId = await createOrder(
        items,
        shippingAddress,
        selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay',
        finalTotal
      );

      if (newOrderId) {
        setOrderId(newOrderId);
        setOrderComplete(true);
        setShowPaymentModal(false);
        await clearCart();

        showNotification({
          type: 'success',
          title: 'Order Placed!',
          message: `Your order #${newOrderId.slice(0, 8)} has been placed successfully.`
        });
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'Failed to create order. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(step)) return;

    if (selectedPaymentMethod === 'cod') {
      await handlePaymentSuccess('cod_' + Date.now());
    } else {
      // For Razorpay: Create order first, then open payment modal
      setIsProcessing(true);
      try {
        const shippingAddress = {
          fullName: `${formData.firstName} ${formData.lastName}`,
          streetAddress: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
          street: formData.address,
          zipCode: formData.zipCode
        };

        if (!user) {
          showNotification({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to place an order'
          });
          return;
        }

        // First, create Razorpay order to get razorpay_order_id
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Please login to continue with payment');
        }

        const createRazorpayOrderResponse = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/razorpay/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: finalTotal,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
              customer_name: `${formData.firstName} ${formData.lastName}`,
              customer_email: formData.email,
              items_count: items.length
            }
          })
        });

        if (!createRazorpayOrderResponse.ok) {
          let errorMessage = 'Failed to create payment order';
          try {
            const errorData = await createRazorpayOrderResponse.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }

        const razorpayOrderData = await createRazorpayOrderResponse.json();
        const razorpayOrderId = razorpayOrderData.data?.orderId;

        if (!razorpayOrderId) {
          throw new Error('Invalid response from payment service');
        }

        // Now create the database order with razorpay_order_id
        const newOrderId = await createOrder(
          items,
          shippingAddress,
          'Razorpay',
          finalTotal,
          razorpayOrderId
        );

        if (newOrderId) {
          setOrderId(newOrderId);
          // Store razorpay_order_id for the payment component
          setRazorpayOrderId(razorpayOrderId);
          // Now open payment modal
          setShowPaymentModal(true);
        } else {
          throw new Error('Failed to create order');
        }
      } catch (error: any) {
        console.error('Order creation failed:', error);
        showNotification({
          type: 'error',
          title: 'Order Failed',
          message: error.message || 'Failed to create order. Please try again.'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <button
            onClick={() => navigate('/products')}
            className="btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Thank you for your purchase. Your order <span className="font-mono font-medium">#{orderId?.slice(0, 8)}</span> has been placed successfully.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">✓</div>
                <div className="text-xs text-gray-600">Secure Payment</div>
              </div>
              <div>
                <div className="text-2xl mb-1">📦</div>
                <div className="text-xs text-gray-600">Fast Shipping</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🔄</div>
                <div className="text-xs text-gray-600">Easy Returns</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/track-order/${orderId}`)}
              className="w-full btn-primary"
            >
              Track Your Order
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full btn-secondary"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile-optimized Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Checkout</h1>
              <div className="text-sm text-gray-600">
                Step {step}/3
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl shadow-sm border p-4 sm:p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Shipping Information
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            required
                          >
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          if (validateStep(1)) setStep(2);
                        }}
                        className="btn-primary w-full sm:w-auto"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl shadow-sm border p-4 sm:p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Method
                    </h2>

                    {/* Simplified Payment Method Selection */}
                    <div className="space-y-3 mb-6">
                      <button
                        onClick={() => setSelectedPaymentMethod('razorpay')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                          selectedPaymentMethod === 'razorpay'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-100">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Online Payment</div>
                            <div className="text-sm text-gray-500">Secure payment via Razorpay</div>
                          </div>
                        </div>
                        {selectedPaymentMethod === 'razorpay' && (
                          <CheckCircle className="w-5 h-5 text-indigo-500" />
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('cod')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                          selectedPaymentMethod === 'cod'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100">
                            <Banknote className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Cash on Delivery</div>
                            <div className="text-sm text-gray-500">Pay when your order is delivered</div>
                          </div>
                        </div>
                        {selectedPaymentMethod === 'cod' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </button>
                    </div>

                    {/* Payment Method Description */}
                    {selectedPaymentMethod === 'razorpay' && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-6 border border-blue-100">
                        <p className="text-sm text-blue-800 text-center">
                          You'll be redirected to Razorpay's secure payment page where you can choose from Cards, UPI, Net Banking, and Wallets
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="btn-secondary w-full sm:w-auto"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="btn-primary w-full sm:flex-1"
                      >
                        Review Order
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl shadow-sm border p-4 sm:p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Review Your Order
                    </h2>

                    {/* Cart Items */}
                    <div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <div key={item.id || item.product?.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          {item.product?.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h3>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{item.product?.price ? (item.product.price * item.quantity).toLocaleString('en-IN') : '0.00'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                          <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST (18%)</span>
                          <span>₹{gst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping</span>
                          <span>
                            {shipping === 0 ? (
                              <span className="text-green-600 font-medium">FREE</span>
                            ) : (
                              `₹${shipping.toLocaleString('en-IN')}`
                            )}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-base">
                          <span>Total</span>
                          <span className="text-indigo-600">₹{finalTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="btn-secondary w-full sm:w-auto"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className={`btn-primary w-full sm:flex-1 ${selectedPaymentMethod === 'cod' ? '!bg-green-600 !hover:bg-green-700' : ''
                          }`}
                      >
                        {isProcessing ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items ({itemCount})</span>
                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-medium">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${shipping.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-indigo-600">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Free Shipping on ₹2,000+</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPaymentMethod !== 'cod' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <RazorpayPayment
              amount={subtotal}
              items={items}
              customerInfo={{
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone
              }}
              shippingAddress={{
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country
              }}
              razorpayOrderId={razorpayOrderId || undefined}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                showNotification({ type: 'error', title: 'Payment Failed', message: error });
                setShowPaymentModal(false);
              }}
              onCancel={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImprovedCheckoutPage;

