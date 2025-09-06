"use client";

import { useState, useEffect } from "react";
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  PaintBrushIcon,
  ArrowRightIcon,
  SparklesIcon,
  HeartIcon,
  BoltIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import AuthModal from '@/components/AuthModal';

export default function SplashPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Real-time Messaging",
      description: "Instant messaging with beautiful chat bubbles and typing indicators",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: UserGroupIcon,
      title: "Friends & Contacts",
      description: "Connect with friends and manage your social network effortlessly",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: ShieldCheckIcon,
      title: "Privacy & Security",
      description: "Your conversations are secure with end-to-end encryption",
      color: "from-green-500 to-blue-600"
    },
    {
      icon: PaintBrushIcon,
      title: "Beautiful Interface",
      description: "Dark and light themes with a modern, clean design",
      color: "from-orange-500 to-red-600"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+", icon: UserGroupIcon },
    { label: "Messages Sent", value: "1M+", icon: ChatBubbleLeftRightIcon },
    { label: "Countries", value: "50+", icon: GlobeAltIcon },
    { label: "Uptime", value: "99.9%", icon: BoltIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full opacity-20 animate-pulse-soft"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-accent-200 to-primary-200 rounded-full opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-10 animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                <ChatBubbleLeftRightIcon className="w-7 h-7 text-black" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-black">
                Moreno
              </h1>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <button 
                onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-semibold transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-black font-semibold rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
                <SparklesIcon className="w-5 h-5 text-primary-500 mr-2" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Connect with friends worldwide
                </span>
              </div>
              
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Chat, Connect,{" "}
                <br className="sm:hidden" />
                <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-black font-extrabold">
                  Create
                </span>
              </h2>
              
              <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Experience the future of messaging with Moreno Chat. Beautiful, secure, and designed for modern communication.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
                  className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-primary-600 to-accent-600 text-black font-bold text-lg rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-3 border-2 border-primary-600 hover:border-primary-700"
                >
                  <span>Get Started</span>
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}
                  className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Features Showcase */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-10'}`}>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
                  Why Choose Moreno?
                </h3>
                <div className="space-y-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = index === currentFeature;
                    return (
                      <div
                        key={index}
                        className={`p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
                          isActive 
                            ? 'bg-white dark:bg-gray-800 border-primary-300 dark:border-primary-600 shadow-xl' 
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700'
                        }`}
                        onClick={() => setCurrentFeature(index)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              {feature.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10'}`}>
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="mx-auto w-80 h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-3 shadow-2xl border-8 border-gray-700">
                    <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                      {/* Phone Screen Content */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50">
                        {/* Status Bar */}
                        <div className="h-12 bg-white flex items-center justify-center border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
                            <span className="text-sm font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                              Moreno
                            </span>
                          </div>
                        </div>
                        
                        {/* Chat Interface */}
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                          {/* Contact Header */}
                          <div className="flex items-center space-x-3 pb-2 border-b border-gray-100">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">S</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">Sarah</p>
                              <p className="text-xs text-green-600">Online</p>
                            </div>
                          </div>
                          
                          {/* Messages */}
                          <div className="space-y-3">
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-2xl rounded-tl-md max-w-[180px] shadow-sm">
                                <p className="text-xs">Hey! Welcome to Moreno 👋</p>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <div className="bg-primary-600 text-black px-3 py-2 rounded-2xl rounded-tr-md max-w-[180px] shadow-sm">
                                <p className="text-xs">Thanks! This looks amazing</p>
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-2xl rounded-tl-md max-w-[180px] shadow-sm">
                                <p className="text-xs">The design is so clean! ✨</p>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <div className="bg-primary-600 text-black px-3 py-2 rounded-2xl rounded-tr-md max-w-[180px] shadow-sm">
                                <p className="text-xs">I love the features! 🎉</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Feature Icons */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                            <UserGroupIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center shadow-xl animate-pulse-soft">
                    <HeartIcon className="w-8 h-8 text-black" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full flex items-center justify-center shadow-xl animate-pulse-soft" style={{ animationDelay: '1s' }}>
                    <SparklesIcon className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className={`text-center mb-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-12">
                Trusted by Users Worldwide
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Icon className="w-8 h-8 text-black" />
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-black mb-2">
                        {stat.value}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 font-semibold">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className={`text-center bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 shadow-2xl transition-all duration-1000 delay-900 border border-primary-300 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
              <h3 className="text-3xl sm:text-4xl font-bold text-black mb-6">
                Ready to Start Chatting?
              </h3>
              <p className="text-xl text-black/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of users who have already discovered the joy of modern messaging with Moreno Chat.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-primary-600 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-3 border-2 border-white"
                >
                  <span>Create Account</span>
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => { setAuthMode('signin'); setAuthModalOpen(true); }}
                  className="w-full sm:w-auto px-10 py-5 bg-transparent text-black font-bold text-lg rounded-xl border-2 border-white/50 hover:border-white hover:bg-white/20 transition-all shadow-lg"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 mt-16 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-black">
                Moreno Chat
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              © 2024 Moreno Chat. Connect with friends and share experiences.
            </p>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeSwitch={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    </div>
  );
}
