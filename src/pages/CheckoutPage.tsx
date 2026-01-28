import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Package, ArrowLeft, CheckCircle, Wallet, CreditCard, 
  Banknote, Truck, Shield, Clock, ChevronRight, Edit2, 
  Phone, Mail, ShoppingBag, Sparkles, Gift, Lock, AlertCircle,
  Home, Building, Plus
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { useNotification } from '../contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import { RazorpayPayment } from '../components/Payment/RazorpayPayment';
import { useShipping } from '../hooks/useShipping';
import { apiClient } from '../lib/apiClient';

// Indian states for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu and Kashmir', 'Ladakh', 'Delhi', 'Puducherry', 'Chandigarh'
];

// Form input component
const FormInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ label, name, type = 'text', value, onChange, placeholder, required, icon: Icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 ${Icon ? 'pl-11' : ''}`}
      />
    </div>
  </div>
);

// Step indicator component
const StepIndicator: React.FC<{
  currentStep: number;
  steps: { number: number; title: string; icon: React.ComponentType<{ className?: string }> }[];
}> = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center gap-0">
    {steps.map((step, index) => {
      const Icon = step.icon;
      const isActive = currentStep === step.number;
      const isCompleted = currentStep > step.number;
      
      return (
        <React.Fragment key={step.number}>
          <div className="flex items-center">
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
              ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 
                isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
            `}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-sm font-medium hidden sm:block">{step.title}</span>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-0.5 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// Order item card
const OrderItemCard: React.FC<{ item: any }> = ({ item }) => (
  <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
    <div className="relative w-20 h-20 flex-shrink-0">
      {item.product?.images?.[0] ? (
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-amber-100 rounded-lg flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <span className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {item.quantity}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h4>
      <p className="text-sm text-gray-500 mt-0.5">Qty: {item.quantity}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900">
        ₹{item.product?.price ? (Number(item.product.price) * item.quantity).toLocaleString('en-IN') : '0'}
      </p>
    </div>
  </div>
);

interface SavedAddress {
  id: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  type: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { showNotification } = useNotification();
  const { calculateShippingByState } = useShipping();
  
  const [step, setStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true); // Auto-enabled by default
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Pre-fill form with user profile data
  const getInitialFormData = () => {
    const fullName = user?.fullName || '';
    const nameParts = fullName.split(' ');
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Fetch saved addresses when user is logged in
  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
      // Pre-fill form with user profile data
      const initialData = getInitialFormData();
      setFormData(prev => {
        // Only update if fields are empty
        return {
          firstName: prev.firstName || initialData.firstName,
          lastName: prev.lastName || initialData.lastName,
          email: prev.email || initialData.email,
          phone: prev.phone || initialData.phone,
          address: prev.address,
          city: prev.city,
          state: prev.state,
          zipCode: prev.zipCode,
          country: prev.country || 'India',
        };
      });
    } else {
      // Reset addresses if user logs out
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setShowNewAddressForm(false);
    }
  }, [user]);

  // Fetch addresses when component mounts and when step changes to 1 (shipping step)
  useEffect(() => {
    if (user && step === 1) {
      fetchSavedAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

  const fetchSavedAddresses = async () => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    try {
      const response = await apiClient.getAddresses();
      console.log('🔍 Checkout - Full API response:', response);
      console.log('🔍 Checkout - Response type:', typeof response);
      console.log('🔍 Checkout - Is array?', Array.isArray(response));
      console.log('🔍 Checkout - Has data?', !!response?.data);
      console.log('🔍 Checkout - Response.data:', response?.data);
      
      // Use same approach as CustomerAddressesPage: response.data || []
      // API returns { success: true, data: [...] }
      let addresses: SavedAddress[] = response?.data || [];
      
      // Fallback: if response is directly an array
      if (Array.isArray(response) && addresses.length === 0) {
        addresses = response;
      }
      
      console.log('🔍 Checkout - Extracted addresses:', addresses);
      console.log('🔍 Checkout - Addresses count:', addresses.length);
      
      // Ensure each address has required fields and normalize the type field
      addresses = addresses.map((addr: any) => {
        const normalized = {
          id: addr.id,
          fullName: addr.fullName || addr.full_name || '',
          phone: addr.phone || '',
          streetAddress: addr.streetAddress || addr.street_address || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || addr.postal_code || '',
          country: addr.country || 'India',
          type: addr.type || addr.address_type || 'home',
          isDefault: addr.isDefault !== undefined ? addr.isDefault : (addr.is_default !== undefined ? addr.is_default : false),
        };
        console.log('🔍 Checkout - Normalized address:', normalized);
        return normalized;
      });
      
      console.log('🔍 Checkout - Final addresses to set:', addresses);
      setSavedAddresses(addresses);
      
      // Auto-select default address if available
      const defaultAddress = addresses.find((addr: SavedAddress) => addr.isDefault);
      if (defaultAddress && !selectedAddressId) {
        console.log('🔍 Checkout - Auto-selecting default address:', defaultAddress.id);
        setSelectedAddressId(defaultAddress.id);
        fillFormFromAddress(defaultAddress);
      } else if (addresses.length > 0 && !selectedAddressId && !showNewAddressForm) {
        // If no default but addresses exist, select the first one
        console.log('🔍 Checkout - Auto-selecting first address:', addresses[0].id);
        setSelectedAddressId(addresses[0].id);
        fillFormFromAddress(addresses[0]);
      }
    } catch (error: any) {
      console.error('❌ Checkout - Failed to fetch addresses:', error);
      console.error('❌ Checkout - Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });
      // Only show error if it's not a 401 (unauthorized) - that's expected for logged out users
      if (error?.status !== 401) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load saved addresses. Please try again.'
        });
      }
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fillFormFromAddress = (address: SavedAddress) => {
    const nameParts = address.fullName.split(' ');
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || formData.email,
      phone: address.phone || user?.phone || '',
      address: address.streetAddress,
      city: address.city,
      state: address.state,
      zipCode: address.postalCode,
      country: address.country || 'India',
    });
    setShowNewAddressForm(false);
  };

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    fillFormFromAddress(address);
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
    // Reset form but keep user's basic info
    setFormData(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: '',
    }));
  };

  // Load saved form data from localStorage (for non-logged-in users)
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('checkout_shipping_info');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved shipping info');
        }
      }
    }
  }, [user]);

  // Save form data
  useEffect(() => {
    if (formData.firstName || formData.address) {
      localStorage.setItem('checkout_shipping_info', JSON.stringify(formData));
    }
  }, [formData]);

  // Calculate pricing
  const subtotal = total;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const shippingCalc = calculateShippingByState(formData.state || '', subtotal);
  const shipping = shippingCalc.cost;
  const finalTotal = subtotal + gst + shipping;
  const savings = items.reduce((acc, item) => {
    const original = Number(item.product?.originalPrice) || Number(item.product?.price) || 0;
    const current = Number(item.product?.price) || 0;
    return acc + ((original - current) * item.quantity);
  }, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missing = required.filter(field => !formData[field as keyof typeof formData]);
      if (missing.length > 0) {
        showNotification({
          type: 'error',
          title: 'Missing Information',
          message: `Please fill in all required fields`
        });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address' });
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
        showNotification({ type: 'error', title: 'Invalid Phone', message: 'Please enter a valid 10-digit phone number' });
        return false;
      }
    }
    return true;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
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

      // Save address for future if checkbox is checked and user is logged in
      if (saveForFuture && user && !selectedAddressId) {
        try {
          await apiClient.createAddress({
            fullName: shippingAddress.fullName,
            streetAddress: shippingAddress.streetAddress,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            isDefault: savedAddresses.length === 0, // Set as default if it's the first address
            type: 'home'
          });
          // Refresh addresses list
          await fetchSavedAddresses();
          showNotification({
            type: 'success',
            title: 'Address Saved',
            message: 'Your address has been saved for future orders'
          });
        } catch (error) {
          console.error('Failed to save address:', error);
          // Don't block order creation if address save fails
        }
      }

      if (!user) {
        showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
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
        localStorage.removeItem('checkout_shipping_info');
        
        // Show notification about order history
        showNotification({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: 'Your order has been saved. You can view all your orders in your dashboard.',
          duration: 6000
        });
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
      setShowPaymentModal(true);
    }
  };

  // Empty cart state
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any fragrances yet. Explore our collection!</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center">
            {/* Success Animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
            <p className="text-gray-600 mb-2">Thank you for your purchase</p>
            <p className="text-sm text-gray-500 mb-2">
              Order ID: <span className="font-mono font-semibold text-gray-900">#{orderId?.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm text-gray-600 mb-8">
              Your order has been saved and will appear in your order history. You can track its status anytime from your dashboard.
            </p>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600">Payment Received</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">Processing</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-600">Ships Soon</p>
                </div>
              </div>
            </div>

            {/* Confirmation Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-amber-800">
                <Mail className="w-4 h-4 inline mr-2" />
                A confirmation email has been sent to <strong>{formData.email}</strong>
              </p>
            </div>

            {/* Order History Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Your order has been saved!</strong> You can view all your orders, track their status, and see order history in your dashboard.
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/track-order/${orderId}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Track Your Order
              </button>
              <button
                onClick={() => navigate('/dashboard/orders')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                View My Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Shipping', icon: MapPin },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/cart')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
          <StepIndicator currentStep={step} steps={steps} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                    <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                  </div>
                </div>

                {/* Loading State */}
                {user && loadingAddresses && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Loading saved addresses...</p>
                  </div>
                )}

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && user && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p><strong>Debug Info:</strong></p>
                    <p>User: {user ? 'logged in' : 'not logged in'}</p>
                    <p>Loading: {loadingAddresses ? 'true' : 'false'}</p>
                    <p>Saved Addresses Count: {savedAddresses.length}</p>
                    <p>Show New Form: {showNewAddressForm ? 'true' : 'false'}</p>
                    <p>Selected Address ID: {selectedAddressId || 'none'}</p>
                    {savedAddresses.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Address IDs:</strong></p>
                        {savedAddresses.map(addr => (
                          <p key={addr.id}>- {addr.id}: {addr.fullName} ({addr.city})</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Addresses Section */}
                {user && !loadingAddresses && savedAddresses.length > 0 && !showNewAddressForm && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Your Saved Addresses</h3>
                        <p className="text-xs text-gray-500">Select an address or add a new one</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={fetchSavedAddresses}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 hover:bg-gray-100 rounded"
                          title="Refresh addresses from profile"
                        >
                          🔄 Refresh
                        </button>
                        <button
                          onClick={handleAddNewAddress}
                          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add New
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedAddresses.map((address) => {
                        const isSelected = selectedAddressId === address.id;
                        const AddressIcon = (address.type === 'home' || !address.type || address.type === 'shipping') ? Home : Building;
                        return (
                          <div
                            key={address.id}
                            onClick={() => handleSelectAddress(address)}
                            className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-purple-600' : 'bg-gray-100'
                              }`}>
                                <AddressIcon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-bold text-gray-900 text-base">{address.fullName}</p>
                                  {address.isDefault && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-700 font-medium">{address.streetAddress}</p>
                                  <p className="text-sm text-gray-600">
                                    {address.city}, {address.state} {address.postalCode}
                                  </p>
                                  <p className="text-sm text-gray-600">{address.country}</p>
                                  {address.phone && (
                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5" />
                                      {address.phone}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="mt-3 pt-3 border-t border-purple-200">
                                    <p className="text-xs font-semibold text-purple-700">✓ Selected for delivery</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selectedAddressId && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-800 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Address selected. You can proceed to payment or add a new address.</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Address Form - Show if no saved addresses, or if "Add New" is clicked, or if not logged in */}
                {/* Show form when:
                    1. User is not logged in (always show form)
                    2. User is logged in but has no saved addresses (and not loading)
                    3. User clicked "Add New Address" button
                */}
                {(!user || (savedAddresses.length === 0 && !loadingAddresses) || (showNewAddressForm && savedAddresses.length > 0)) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="John" />
                      <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Doe" />
                      <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="john@example.com" icon={Mail} />
                      <FormInput label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="9876543210" icon={Phone} />
                      <div className="md:col-span-2">
                        <FormInput label="Street Address" name="address" value={formData.address} onChange={handleInputChange} required placeholder="123, Main Street, Apartment 4B" icon={MapPin} />
                      </div>
                      <FormInput label="City" name="city" value={formData.city} onChange={handleInputChange} required placeholder="Mumbai" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-200"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      <FormInput label="PIN Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required placeholder="400001" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value="India"
                          disabled
                          className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Save for future checkbox - Auto-enabled by default, only show if user is logged in and adding new address */}
                    {user && (showNewAddressForm || savedAddresses.length === 0) && (
                      <div className="mt-6 flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <input
                          type="checkbox"
                          id="saveForFuture"
                          checked={saveForFuture}
                          onChange={(e) => setSaveForFuture(e.target.checked)}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <label htmlFor="saveForFuture" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          <span className="font-semibold text-purple-700">Save this address for future orders</span>
                          <span className="block text-xs text-gray-500 mt-0.5">This address will be saved to your profile</span>
                        </label>
                      </div>
                    )}

                    {/* Back to saved addresses button */}
                    {user && savedAddresses.length > 0 && showNewAddressForm && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setShowNewAddressForm(false);
                            const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
                            if (defaultAddress) {
                              handleSelectAddress(defaultAddress);
                            }
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          ← Use saved address instead
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => validateStep(1) && setStep(2)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-purple-500/25"
                  >
                    Continue to Payment
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                    <p className="text-sm text-gray-500">Choose how you'd like to pay</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Online Payment */}
                  <button
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                      selectedPaymentMethod === 'razorpay'
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {selectedPaymentMethod === 'razorpay' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'razorpay' ? 'bg-purple-600' : 'bg-gray-100'
                      }`}>
                        <CreditCard className={`w-7 h-7 ${selectedPaymentMethod === 'razorpay' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Online Payment</h3>
                        <p className="text-sm text-gray-500">Cards, UPI, Net Banking, Wallets</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">Visa</span>
                      <span className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">Mastercard</span>
                      <span className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">UPI</span>
                      <span className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">Paytm</span>
                    </div>
                  </button>

                  {/* COD */}
                  <button
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                      selectedPaymentMethod === 'cod'
                        ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {selectedPaymentMethod === 'cod' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'cod' ? 'bg-green-600' : 'bg-gray-100'
                      }`}>
                        <Banknote className={`w-7 h-7 ${selectedPaymentMethod === 'cod' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                        <p className="text-sm text-gray-500">Pay when you receive</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-500">Available for orders under ₹10,000</span>
                    </div>
                  </button>
                </div>

                {/* Security Badge */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ← Back to Shipping
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-purple-500/25"
                  >
                    Review Order
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Shipping Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    </div>
                    <button onClick={() => setStep(1)} className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
                    <p className="text-gray-600 text-sm mt-1">{formData.address}</p>
                    <p className="text-gray-600 text-sm">{formData.city}, {formData.state} - {formData.zipCode}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{formData.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{formData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Payment Method</h3>
                    </div>
                    <button onClick={() => setStep(2)} className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedPaymentMethod === 'cod' ? 'bg-green-100' : 'bg-purple-100'}`}>
                      {selectedPaymentMethod === 'cod' ? (
                        <Banknote className="w-6 h-6 text-green-600" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedPaymentMethod === 'cod' ? 'Pay when you receive your order' : 'Cards, UPI, Net Banking, Wallets'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Order Items ({items.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <OrderItemCard key={item.product?.id || item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Place Order */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ← Back to Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-10 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                      selectedPaymentMethod === 'cod'
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/25'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        {selectedPaymentMethod === 'cod' ? 'Place Order' : `Pay ₹${finalTotal.toLocaleString('en-IN')}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

              {/* Items Preview */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {items.slice(0, 3).map((item) => (
                  <div key={item.product?.id || item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{(Number(item.product?.price) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">+{items.length - 3} more items</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>You Save</span>
                    <span className="font-medium">-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-purple-600">₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Secure checkout with SSL encryption</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Free shipping on orders ₹2,000+</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>30-day easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      {showPaymentModal && selectedPaymentMethod !== 'cod' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            onSuccess={handlePaymentSuccess}
            onError={(error) => {
              showNotification({ type: 'error', title: 'Payment Failed', message: error });
              setShowPaymentModal(false);
            }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
