import React, { useState } from 'react';
import { FiUsers, FiBarChart2, FiTrendingUp, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import AuthModal from '../../components/common/modal/AuthModal';
import { useNavigate } from 'react-router-dom';
export default function AdminWelcome() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const navigate = useNavigate();

    const openAuthModal = (mode) => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const features = [
        {
            icon: <FiBarChart2 className="text-blue-500 text-3xl" />,
            title: "Advanced Analytics",
            description: "Comprehensive business insights and data visualization tools"
        },
        {
            icon: <FiUsers className="text-green-500 text-3xl" />,
            title: "Vendor Management", 
            description: "Complete vendor onboarding and management system"
        },
        {
            icon: <FiTrendingUp className="text-purple-500 text-3xl" />,
            title: "Revenue Optimization",
            description: "AI-powered recommendations to boost your business growth"
        },
        {
            icon: <FiShield className="text-orange-500 text-3xl" />,
            title: "Secure Platform",
            description: "Enterprise-grade security for all your business data"
        }
    ];

    const stats = [
        { number: "500+", label: "Active Vendors" },
        { number: "99.9%", label: "Uptime" },
        { number: "24/7", label: "Support" },
        { number: "150+", label: "Countries" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <img className="h-8 w-auto" src="/src/assets/appauralogos.png" alt="AppAura" />
                            </div>
                            <div className="ml-3">
                                <span className="text-xl font-bold text-gray-900">AppAura</span>
                                <span className="text-sm text-blue-600 ml-2">Analytics</span>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => openAuthModal('login')}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Welcome to <span className="text-blue-600">AppAura</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Empowering vendors with intelligent analytics, seamless management, and data-driven insights to grow your business exponentially.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center"
                        >
                            Get Started
                            <FiArrowRight className="ml-2" />
                        </button>
                        <button 
                            onClick={() => navigate('/profile')}
                            className="border-2 cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200"
                        >
                            Setup Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose AppAura?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Built specifically for vendors who want to scale their business with intelligent tools and insights.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Transform Your Business?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join hundreds of vendors who are already using AppAura to optimize their operations and increase revenue.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-white cursor-pointer text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                        >
                            Start Free Trial
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard/chatbot')}
                            className="border-2 cursor-pointer border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200"
                        >
                            Try AI Assistant
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center mb-4">
                                <img className="h-8 w-auto" src="/src/assets/AppauraLogo.png" alt="AppAura" />
                                <span className="ml-3 text-xl font-bold">AppAura Analytics</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Empowering businesses with intelligent analytics and vendor management solutions.
                            </p>
                            <div className="flex space-x-4">
                                <FiStar className="text-yellow-400" />
                                <FiStar className="text-yellow-400" />
                                <FiStar className="text-yellow-400" />
                                <FiStar className="text-yellow-400" />
                                <FiStar className="text-yellow-400" />
                                <span className="text-gray-400 ml-2">Trusted by 500+ vendors</span>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Features</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>Analytics Dashboard</li>
                                <li>Vendor Management</li>
                                <li>AI Assistant</li>
                                <li>Revenue Insights</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>Documentation</li>
                                <li>Contact Support</li>
                                <li>Training</li>
                                <li>Community</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 AppAura Analytics. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />
        </div>
    );
}
