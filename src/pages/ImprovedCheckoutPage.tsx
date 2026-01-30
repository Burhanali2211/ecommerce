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
import { supabase } from '../lib/supabase';

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
      if (orderId) {
        setOrderComplete(true);
        setShowPaymentModal(false);
        await clearCart();

        showNotification({
          type: 'success',
          title: 'Order Confirmed!',
          message: `Your order #${orderId.slice(0, 8)} has been confirmed.`
        });
        return;
      }

      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetAddress: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone
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
        shippingAddress as any,
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
      setIsProcessing(true);
      try {
        const shippingAddress = {
          fullName: `${formData.firstName} ${formData.lastName}`,
          streetAddress: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        };

        if (!user) {
          showNotification({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to place an order'
          });
          return;
        }

        const { data: razorpayData, error: functionError } = await supabase.functions.invoke('payment-process', {
          method: 'POST',
          body: {
            amount: finalTotal,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
              customer_name: `${formData.firstName} ${formData.lastName}`,
              customer_email: formData.email,
              items_count: items.length
            }
          },
          queryParams: { action: 'create-order' }
        });

        if (functionError) throw functionError;
        if (!razorpayData?.success || !razorpayData.data?.id) {
          throw new Error('Failed to create payment order');
        }

        const razorpayOrderId = razorpayData.data.id;

        const newOrderId = await createOrder(
          items,
          shippingAddress as any,
          'Razorpay',
          finalTotal,
          razorpayOrderId
        );

        if (newOrderId) {
          setOrderId(newOrderId);
          setRazorpayOrderId(razorpayOrderId);
          setShowPaymentModal(true);
        } else {
          throw new Error('Failed to create database order');
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
              <div className="text-sm text-gray-600">Step {step}/3</div>
            </div>
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
                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} className="input-field" />
                        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} className="input-field" />
                      </div>
                      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="input-field" />
                      <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} className="input-field" />
                      <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} className="input-field" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="input-field" />
                        <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="input-field" />
                        <input type="text" name="zipCode" placeholder="ZIP Code" value={formData.zipCode} onChange={handleInputChange} className="input-field" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <button onClick={() => validateStep(1) && setStep(2)} className="btn-primary w-full">Continue to Payment</button>
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
                    <div className="space-y-3">
                      <button onClick={() => setSelectedPaymentMethod('razorpay')} className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between ${selectedPaymentMethod === 'razorpay' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-indigo-600" />
                          <div>
                            <div className="font-medium">Online Payment</div>
                            <div className="text-sm text-gray-500">Secure via Razorpay</div>
                          </div>
                        </div>
                        {selectedPaymentMethod === 'razorpay' && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                      </button>
                      <button onClick={() => setSelectedPaymentMethod('cod')} className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between ${selectedPaymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <Banknote className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Cash on Delivery</div>
                            <div className="text-sm text-gray-500">Pay at delivery</div>
                          </div>
                        </div>
                        {selectedPaymentMethod === 'cod' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </button>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                      <button onClick={() => setStep(3)} className="btn-primary flex-1">Review Order</button>
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
                    <div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium">{item.product.name}</h3>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-indigo-600">₹{finalTotal.toLocaleString()}</span></div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
                      <button onClick={handlePlaceOrder} disabled={isProcessing} className="btn-primary flex-1">
                        {isProcessing ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600"><span>Items ({itemCount})</span><span>₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>GST</span><span>₹{gst.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                  <div className="pt-3 border-t flex justify-between font-bold text-lg"><span>Total</span><span className="text-indigo-600">₹{finalTotal.toLocaleString()}</span></div>
                </div>
                <div className="mt-6 space-y-3 pt-6 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Shield className="h-4 w-4" /> Secure Checkout</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Truck className="h-4 w-4" /> Fast Shipping</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <RazorpayPayment
            amount={subtotal}
            items={items}
            customerInfo={{ name: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone }}
            shippingAddress={{ street: formData.address, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: formData.country }}
            razorpayOrderId={razorpayOrderId || undefined}
            onSuccess={handlePaymentSuccess}
            onError={(err) => { showNotification({ type: 'error', title: 'Payment Failed', message: err }); setShowPaymentModal(false); }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </>
  );
};

export default ImprovedCheckoutPage;
