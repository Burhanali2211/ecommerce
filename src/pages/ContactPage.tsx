import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { apiClient } from '../config/api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();
  const { contactInfo, businessHours } = settings;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  // Get contact information
  const emailContact = contactInfo.find(c => c.contact_type === 'email' && c.is_primary) || 
                       contactInfo.find(c => c.contact_type === 'email');
  const phoneContact = contactInfo.find(c => c.contact_type === 'phone' && c.is_primary) || 
                       contactInfo.find(c => c.contact_type === 'phone');
  const addressContact = contactInfo.find(c => c.contact_type === 'address' && c.is_primary) || 
                         contactInfo.find(c => c.contact_type === 'address');
  
  const email = emailContact?.value || 'info@himalayanspicesexports.com';
  const phone = phoneContact?.value || '+91-1234567890';
  const address = addressContact?.value || 'Gaw Kadal, Srinagar, Kashmir';

  // Get business hours
  const formatBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return 'Monday - Sunday: 10:00 AM - 9:00 PM';
    }
    
    const openDays = businessHours
      .filter(bh => bh.is_open)
      .map(bh => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[bh.day_of_week];
      });
    
    if (openDays.length === 7) {
      const firstDay = businessHours.find(bh => bh.is_open);
      if (firstDay?.is_24_hours) {
        return 'Open 24/7';
      }
      if (firstDay?.open_time && firstDay?.close_time) {
        return `Monday - Sunday: ${firstDay.open_time} - ${firstDay.close_time}`;
      }
    }
    
    return 'Monday - Sunday: 10:00 AM - 9:00 PM';
  };

  const hours = formatBusinessHours();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await apiClient.post('/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (response.data.success) {
        setSubmitStatus('success');
        setSubmitMessage(response.data.message || 'Thank you for contacting us! We will get back to you soon.');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      }
    } catch (error: any) {
      setSubmitStatus('error');
      setSubmitMessage(
        error.response?.data?.error?.userMessage || 
        error.response?.data?.error?.message || 
        'Failed to send message. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-amber-900 to-amber-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Contact Us
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-amber-100"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              We'd love to hear from you. Get in touch with us!
            </motion.p>
          </div>
        </div>
      </div>

      {/* Contact Form and Info Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Contact Form */}
            <motion.div variants={itemVariants}>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-green-800">{submitMessage}</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800">{submitMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="+91-1234567890"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        errors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What is this regarding?"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none ${
                        errors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Tell us how we can help you..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={itemVariants}>
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                  <p className="text-lg text-gray-700 mb-8">
                    Have a question or need assistance? We're here to help! Reach out to us through 
                    any of the following methods, and we'll get back to you as soon as possible.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <MapPin className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Address</h3>
                        <p className="text-gray-700 whitespace-pre-line">{address}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Phone className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Phone</h3>
                        <a href={`tel:${phone}`} className="text-gray-700 hover:text-amber-600 transition">
                          {phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Mail className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                        <a href={`mailto:${email}`} className="text-gray-700 hover:text-amber-600 transition">
                          {email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Hours</h3>
                        <p className="text-gray-700">{hours}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Find Us</h3>
                  <div className="rounded-lg overflow-hidden shadow-md h-64">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1678.619686587766!2d74.80939694133554!3d34.074094840072654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38e18fc85ae61ca9%3A0xb805ebeabf647fd4!2shimalayanspicesexports%20Attar%20House%20best%20perfume%20shop!5e0!3m2!1sen!2sin!4v1761361063055!5m2!1sen!2sin" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                      title="HimalayanSpicesExports Location"
                    ></iframe>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;

