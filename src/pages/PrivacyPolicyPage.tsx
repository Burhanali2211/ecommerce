import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { ContactInfoSection } from '../components/Legal/ContactInfoSection';

const PrivacyPolicyPage: React.FC = () => {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account or place an order, we collect your name, email address, phone number, shipping address, and billing information.'
        },
        {
          subtitle: 'Payment Information',
          text: 'Payment details are processed securely through Razorpay. We do not store your complete credit card information on our servers.'
        },
        {
          subtitle: 'Usage Data',
          text: 'We collect information about how you interact with our website, including pages visited, products viewed, and search queries.'
        }
      ]
    },
    {
      icon: Lock,
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Order Processing',
          text: 'We use your information to process and fulfill your orders, send order confirmations, and provide customer support.'
        },
        {
          subtitle: 'Communication',
          text: 'We may send you emails about your orders, new products, special offers, and updates. You can opt-out of marketing emails at any time.'
        },
        {
          subtitle: 'Improvement',
          text: 'We analyze usage data to improve our website, products, and services.'
        }
      ]
    },
    {
      icon: Shield,
      title: 'Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data transmitted between your browser and our servers is encrypted using SSL/TLS technology.'
        },
        {
          subtitle: 'Secure Storage',
          text: 'Your personal information is stored on secure servers with restricted access and regular security audits.'
        },
        {
          subtitle: 'Payment Security',
          text: 'All payment transactions are processed through PCI-DSS compliant payment gateways (Razorpay).'
        }
      ]
    },
    {
      icon: Eye,
      title: 'Information Sharing',
      content: [
        {
          subtitle: 'Third-Party Services',
          text: 'We share information with trusted third-party service providers who help us operate our business (payment processors, shipping partners, email services).'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by law or to protect our rights and safety.'
        },
        {
          subtitle: 'No Selling',
          text: 'We do not sell, rent, or trade your personal information to third parties for marketing purposes.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block p-4 bg-white/10 rounded-full mb-6"
          >
            <Shield className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-purple-100"
          >
            Your privacy is important to us. Learn how we protect your data.
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-purple-200 mt-4"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Welcome to HimalayanSpicesExports. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
            and make purchases from our online store.
          </p>
          <p className="text-gray-600 leading-relaxed">
            By using our website, you agree to the collection and use of information in accordance with this policy. 
            If you do not agree with our policies and practices, please do not use our website.
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
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <section.icon className="w-6 h-6 text-purple-600" />
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

        {/* Your Rights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Rights</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Access:</strong> You have the right to request copies of your personal data.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Correction:</strong> You have the right to request correction of inaccurate or incomplete data.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Deletion:</strong> You have the right to request deletion of your personal data, subject to legal obligations.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Opt-Out:</strong> You can opt-out of marketing communications at any time.</p>
            </div>
          </div>
        </motion.div>

        {/* Cookies */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use cookies and similar tracking technologies to track activity on our website and store certain information. 
            Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.
          </p>
          <p className="text-gray-600 leading-relaxed">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
            if you do not accept cookies, you may not be able to use some portions of our website.
          </p>
        </motion.div>

        {/* Children's Privacy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            Our website is not intended for children under 18 years of age. We do not knowingly collect personal information 
            from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, 
            please contact us so we can delete such information.
          </p>
        </motion.div>

        {/* Changes to Policy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ContactInfoSection
            title="Contact Us"
            description="If you have any questions about this Privacy Policy or our data practices, please contact us:"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

