import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShoppingBag, CreditCard, Package, AlertCircle, Scale } from 'lucide-react';
import { ContactInfoSection } from '../components/Legal/ContactInfoSection';

const TermsOfServicePage: React.FC = () => {
  const sections = [
    {
      icon: ShoppingBag,
      title: 'Use of Our Service',
      content: [
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 18 years old to use our service and make purchases. By using our website, you represent that you meet this age requirement.'
        },
        {
          subtitle: 'Account Registration',
          text: 'You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'You agree not to use our website for any unlawful purpose, to violate any laws, or to interfere with the proper functioning of the website.'
        }
      ]
    },
    {
      icon: CreditCard,
      title: 'Orders and Payments',
      content: [
        {
          subtitle: 'Order Acceptance',
          text: 'All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including product availability, errors in pricing, or suspected fraud.'
        },
        {
          subtitle: 'Pricing',
          text: 'All prices are listed in Indian Rupees (₹) and include applicable taxes unless otherwise stated. We reserve the right to change prices at any time without prior notice.'
        },
        {
          subtitle: 'Payment',
          text: 'Payment must be made at the time of order placement. We accept payments through Razorpay (Credit/Debit Cards, UPI, Net Banking, Wallets). All transactions are secure and encrypted.'
        }
      ]
    },
    {
      icon: Package,
      title: 'Shipping and Delivery',
      content: [
        {
          subtitle: 'Shipping Areas',
          text: 'We ship across India and select international locations. Shipping charges and delivery times vary based on your location.'
        },
        {
          subtitle: 'Delivery Time',
          text: 'Estimated delivery times are provided at checkout. While we strive to meet these estimates, delays may occur due to circumstances beyond our control.'
        },
        {
          subtitle: 'Risk of Loss',
          text: 'All items purchased from our store are shipped pursuant to a shipment contract. Risk of loss and title for items pass to you upon delivery to the carrier.'
        }
      ]
    },
    {
      icon: AlertCircle,
      title: 'Product Information',
      content: [
        {
          subtitle: 'Accuracy',
          text: 'We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.'
        },
        {
          subtitle: 'Authenticity',
          text: 'All our perfumes and attars are 100% authentic and sourced directly from Kashmir. We guarantee the quality and authenticity of all products sold.'
        },
        {
          subtitle: 'Variations',
          text: 'Due to the natural ingredients used in our products, slight variations in color, scent, or appearance may occur. This does not affect the quality of the product.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block p-4 bg-white/10 rounded-full mb-6"
          >
            <FileText className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Terms of Service
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-blue-100"
          >
            Please read these terms carefully before using our service
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-blue-200 mt-4"
          >
            Last Updated: January 2025
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Welcome to HimalayanSpicesExports. These Terms of Service ("Terms") govern your use of our website and the purchase 
            of products from our online store. By accessing or using our website, you agree to be bound by these Terms.
          </p>
          <p className="text-gray-600 leading-relaxed">
            If you do not agree to these Terms, please do not use our website or purchase our products. We reserve the right 
            to modify these Terms at any time, and such modifications will be effective immediately upon posting.
          </p>
        </motion.div>

        {/* Main Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <section.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>
            
            {section.content.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.subtitle}</h3>
                <p className="text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </motion.div>
        ))}

        {/* Intellectual Property */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Intellectual Property</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            All content on this website, including text, graphics, logos, images, and software, is the property of 
            HimalayanSpicesExports or its content suppliers and is protected by Indian and international copyright laws.
          </p>
          <p className="text-gray-600 leading-relaxed">
            You may not reproduce, distribute, modify, or create derivative works from any content on our website 
            without our express written permission.
          </p>
        </motion.div>

        {/* Limitation of Liability */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            To the maximum extent permitted by law, HimalayanSpicesExports shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our total liability to you for any claim arising from or relating to these Terms or your use of our website 
            shall not exceed the amount you paid for products purchased through our website.
          </p>
        </motion.div>

        {/* Warranty Disclaimer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Warranty Disclaimer</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our website and products are provided "as is" and "as available" without any warranties of any kind, 
            either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, 
            or non-infringement.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We do not warrant that our website will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </motion.div>

        {/* Governing Law */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising 
            from these Terms or your use of our website shall be subject to the exclusive jurisdiction of the courts 
            located in Kashmir, India.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ContactInfoSection
            title="Questions About Terms?"
            description="If you have any questions about these Terms of Service, please contact us:"
            className="from-blue-600 to-indigo-600"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

