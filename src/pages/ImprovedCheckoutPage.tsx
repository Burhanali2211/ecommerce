import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  MapPin,
  CreditCard,
  ShoppingBag,
  Truck,
  Shield,
  Banknote,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { useNotification } from '../contexts/NotificationContext';
import { RazorpayPayment } from '../components/Payment/RazorpayPayment';
import { supabase } from '../lib/supabase';

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

// Reusable labeled field
const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full px-3.5 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white';

export const ImprovedCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSavedShippingInfo = (): ShippingInfo => {
    try {
      const saved = localStorage.getItem(SHIPPING_INFO_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      firstName: '', lastName: '', email: user?.email || '',
      phone: '', address: '', city: '', state: '', zipCode: '', country: 'India',
    };
  };

  const [formData, setFormData] = useState<ShippingInfo>(loadSavedShippingInfo());

  useEffect(() => {
    if (formData.firstName || formData.address) {
      try { localStorage.setItem(SHIPPING_INFO_KEY, JSON.stringify(formData)); } catch {}
    }
  }, [formData]);

  const subtotal = total;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const freeShippingThreshold = 2000;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 5;
  const finalTotal = subtotal + gst + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missing = required.filter(field => !formData[field as keyof ShippingInfo]);
      if (missing.length > 0) {
        showNotification({ type: 'error', title: 'Missing Information', message: 'Please fill in all required fields.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
        return false;
      }
    }
    return true;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setIsProcessing(true);
    try {
      if (orderId) {
        setShowPaymentModal(false);
        await clearCart();
        localStorage.removeItem(SHIPPING_INFO_KEY);
        navigate(`/order-confirmation/${orderId}`, { replace: true });
        return;
      }
      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetAddress: formData.address,
        city: formData.city, state: formData.state,
        postalCode: formData.zipCode, country: formData.country, phone: formData.phone
      };
      if (!user) {
        showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
        return;
      }
      const newOrderId = await createOrder(items, shippingAddress as any,
        selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay', finalTotal);
      if (newOrderId) {
        setShowPaymentModal(false);
        await clearCart();
        localStorage.removeItem(SHIPPING_INFO_KEY);
        navigate(`/order-confirmation/${newOrderId}`, { replace: true });
      }
    } catch (error) {
      showNotification({ type: 'error', title: 'Order Failed', message: 'Failed to create order. Please try again.' });
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
          city: formData.city, state: formData.state,
          postalCode: formData.zipCode, country: formData.country, phone: formData.phone
        };
        if (!user) {
          showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
          return;
        }
        const { data: razorpayData, error: functionError } = await supabase.functions.invoke('payment-process', {
          method: 'POST',
          body: {
            amount: finalTotal, currency: 'INR', receipt: `receipt_${Date.now()}`,
            notes: { customer_name: `${formData.firstName} ${formData.lastName}`, customer_email: formData.email, items_count: items.length }
          },
          queryParams: { action: 'create-order' }
        });
        if (functionError) throw functionError;
        if (!razorpayData?.success || !razorpayData.data?.id) throw new Error('Failed to create payment order');
        const rzpOrderId = razorpayData.data.id;
        const newOrderId = await createOrder(items, shippingAddress as any, 'Razorpay', finalTotal, rzpOrderId);
        if (newOrderId) {
          setOrderId(newOrderId);
          setRazorpayOrderId(rzpOrderId);
          setShowPaymentModal(true);
        } else {
          throw new Error('Failed to create database order');
        }
      } catch (error: any) {
        showNotification({ type: 'error', title: 'Order Failed', message: error.message || 'Failed to create order. Please try again.' });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/products')} className="btn-primary">Continue Shopping</button>
        </div>
      </div>
    );
  }

  const stepLabels = ['Shipping', 'Payment', 'Review'];

  return (
    <>
      {/* ── Fixed top header ── */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors py-1"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-base font-bold text-gray-900">Checkout</h1>
            <span className="text-sm text-gray-500 font-medium">Step {step}/3</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const isActive = num === step;
              const isDone = num < step;
              return (
                <React.Fragment key={num}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                      isDone ? 'bg-indigo-600 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isDone ? <CheckCircle className="w-3 h-3" /> : num}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-indigo-600' : isDone ? 'text-indigo-400' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-colors ${num < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Scrollable content (padded for header + bottom bar) ── */}
      <div className="min-h-screen bg-gray-50 pt-[108px] pb-[88px]">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Shipping Information ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Shipping Information</h2>
                    <p className="text-xs text-gray-500">Where should we deliver your order?</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" required>
                      <input
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleInputChange} className={inputClass}
                        placeholder="Rahul"
                      />
                    </Field>
                    <Field label="Last Name" required>
                      <input
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleInputChange} className={inputClass}
                        placeholder="Sharma"
                      />
                    </Field>
                  </div>

                  <Field label="Email Address" required>
                    <input
                      type="email" name="email" value={formData.email}
                      onChange={handleInputChange} className={inputClass}
                      placeholder="rahul@example.com"
                    />
                  </Field>

                  <Field label="Phone Number" required>
                    <input
                      type="tel" name="phone" value={formData.phone}
                      onChange={handleInputChange} className={inputClass}
                      placeholder="+91 98765 43210"
                    />
                  </Field>

                  <Field label="Street Address" required>
                    <input
                      type="text" name="address" value={formData.address}
                      onChange={handleInputChange} className={inputClass}
                      placeholder="House no., Street, Area"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" required>
                      <input
                        type="text" name="city" value={formData.city}
                        onChange={handleInputChange} className={inputClass}
                        placeholder="Mumbai"
                      />
                    </Field>
                    <Field label="State" required>
                      <input
                        type="text" name="state" value={formData.state}
                        onChange={handleInputChange} className={inputClass}
                        placeholder="Maharashtra"
                      />
                    </Field>
                  </div>

                  <Field label="PIN Code" required>
                    <input
                      type="text" name="zipCode" value={formData.zipCode}
                      onChange={handleInputChange} className={inputClass}
                      placeholder="400001"
                    />
                  </Field>

                  <p className="text-xs text-gray-400">
                    Fields marked <span className="text-red-500 font-medium">*</span> are required
                  </p>
                </div>

                {/* Order summary card (collapsed view on mobile) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Items ({itemCount})</span><span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${shipping}`}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 text-gray-900">
                      <span>Total</span><span className="text-indigo-600">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400"><Shield className="h-3.5 w-3.5" /> Secure Checkout</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400"><Truck className="h-3.5 w-3.5" /> Fast Shipping</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Payment Method ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Payment Method</h2>
                    <p className="text-xs text-gray-500">How would you like to pay?</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <button
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-colors ${
                      selectedPaymentMethod === 'razorpay' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Online Payment</div>
                        <div className="text-xs text-gray-500 mt-0.5">UPI, Cards, Net Banking via Razorpay</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPaymentMethod === 'razorpay' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'razorpay' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-colors ${
                      selectedPaymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Banknote className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">Cash on Delivery</div>
                        <div className="text-xs text-gray-500 mt-0.5">Pay when your order arrives</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPaymentMethod === 'cod' ? 'border-green-600 bg-green-600' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                </div>

                {/* Delivery address recap */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Delivering to</span>
                    <button onClick={() => setStep(1)} className="text-xs text-indigo-600 font-medium">Edit</button>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
                  <p className="text-xs text-gray-500">{formData.phone}</p>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Total</h3>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Items ({itemCount})</span><span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${shipping}`}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 text-gray-900">
                      <span>Total</span><span className="text-indigo-600">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Review Order ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Review Your Order</h2>
                    <p className="text-xs text-gray-500">Check everything before placing</p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Items ({itemCount})</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping recap */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Shipping Address</span>
                    <button onClick={() => setStep(1)} className="text-xs text-indigo-600 font-medium">Edit</button>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formData.address}</p>
                  <p className="text-xs text-gray-500">{formData.city}, {formData.state} {formData.zipCode}</p>
                  <p className="text-xs text-gray-500">{formData.phone}</p>
                </div>

                {/* Payment recap */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Payment</span>
                    <button onClick={() => setStep(2)} className="text-xs text-indigo-600 font-medium">Edit</button>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPaymentMethod === 'cod'
                      ? <><Banknote className="h-4 w-4 text-green-600" /><span className="text-sm text-gray-900">Cash on Delivery</span></>
                      : <><CreditCard className="h-4 w-4 text-indigo-600" /><span className="text-sm text-gray-900">Online Payment (Razorpay)</span></>
                    }
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h3>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Items ({itemCount})</span><span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${shipping}`}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 text-gray-900">
                      <span>Total</span><span className="text-indigo-600">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 px-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400"><Shield className="h-3.5 w-3.5" /> Secure Checkout</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400"><Truck className="h-3.5 w-3.5" /> Fast Shipping</div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Fixed bottom action bar (all steps) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Primary action */}
          {step === 1 && (
            <button
              onClick={() => validateStep(1) && setStep(2)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              Continue to Payment
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              Review Order
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm transition-colors"
            >
              {isProcessing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : (
                <><CheckCircle className="h-4 w-4" />Place Order — ₹{finalTotal.toLocaleString()}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Razorpay modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <RazorpayPayment
            amount={finalTotal}
            subtotal={subtotal}
            gstAmount={gst}
            shippingAmount={shipping}
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
