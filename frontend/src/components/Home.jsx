
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap,
  Brain,
  Shield,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Globe,
  MessageSquare,
  DollarSign,
  Star,
  ChevronRight,
  Play,
  Menu,
  X,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Navigate to dashboard based on role
      switch (user?.role) {
        case 'super_admin':
          navigate('/super-admin/dashboard');
          break;
        case 'school_admin':
          navigate('/school-admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'parent':
          navigate('/parent/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  const features = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI-Powered Insights",
      description: "Smart analytics and predictions for better decision making",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Blockchain Security",
      description: "Immutable records and secure transactions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Globe className="w-12 h-12" />,
      title: "Multi-Tenant Platform",
      description: "Manage multiple schools from one centralized system",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const stats = [
    {
      number: "1000+",
      label: "Schools",
      icon: <GraduationCap className="w-6 h-6" />,
    },
    { number: "500K+", label: "Students", icon: <Users className="w-6 h-6" /> },
    {
      number: "50K+",
      label: "Teachers",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      number: "99.9%",
      label: "Uptime",
      icon: <TrendingUp className="w-6 h-6" />,
    },
  ];

  const coreModules = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Student Management",
      description: "Complete enrollment, attendance, and performance tracking",
      features: [
        "Enrollment System",
        "Attendance Tracking",
        "Performance Analytics",
      ],
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Curriculum Management",
      description: "Plan, organize, and track academic activities",
      features: ["Lesson Planning", "Activity Tracking", "Academic Calendar"],
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Results & Exams",
      description: "Comprehensive result management with AI insights",
      features: ["Grade Management", "Report Cards", "Performance Predictions"],
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Fee Management",
      description: "Blockchain-secured payment processing",
      features: ["Online Payments", "Fee Structure", "Transaction History"],
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Real-time insights and predictive analytics",
      features: ["Performance Metrics", "Attendance Trends", "AI Predictions"],
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Communication Hub",
      description: "Seamless communication between all stakeholders",
      features: ["Instant Messaging", "Notifications", "Parent Portal"],
    },
  ];

  const aiFeatures = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Performance Prediction",
      description: "AI predicts student performance trends",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Attendance Forecasting",
      description: "Identify at-risk students early",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Recommendations",
      description: "Personalized learning suggestions",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI Chatbot",
      description: "24/7 intelligent support assistant",
    },
  ];

  const blockchainFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payments",
      description: "Tamper-proof fee transactions",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Digital Certificates",
      description: "Verifiable blockchain certificates",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Immutable Records",
      description: "Permanent audit trail",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Smart Contracts",
      description: "Automated payment processing",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrollY > 50 ? "bg-white shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <GraduationCap className="w-10 h-10 text-purple-600 animate-bounce" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AcademySphere
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#modules"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Modules
              </a>
              <a
                href="#technology"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Technology
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Pricing
              </a>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <UserCircle className="w-5 h-5 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all transform hover:scale-105"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all transform hover:scale-105"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Login</span>
                </button>
              )}
              
              <button 
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block text-gray-700 hover:text-purple-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#modules"
                className="block text-gray-700 hover:text-purple-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Modules
              </a>
              <a
                href="#technology"
                className="block text-gray-700 hover:text-purple-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Technology
              </a>
              <a
                href="#pricing"
                className="block text-gray-700 hover:text-purple-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              
              {isAuthenticated ? (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center space-x-2 text-gray-700 px-2">
                    <UserCircle className="w-5 h-5 text-purple-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </button>
              )}
              
              <button 
                onClick={handleGetStarted}
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </nav>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">
                AI-Powered • Blockchain-Secured
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              The Future of
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                School Management
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Empower your educational institution with cutting-edge AI
              analytics, blockchain security, and comprehensive management
              tools. One platform for everything.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up animation-delay-400">
              <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-2xl transform hover:scale-105 transition-all flex items-center space-x-2">
                <span className="font-semibold">Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-all flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span className="font-semibold">Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all animate-fade-in-up"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 text-white">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-gray-600">
              Three pillars that make AcademySphere exceptional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl bg-gradient-to-br ${feature.color} text-white overflow-hidden group cursor-pointer transform hover:scale-105 transition-all duration-300`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-white/90">{feature.description}</p>
                  <div className="mt-6 flex items-center space-x-2 text-white/80">
                    <span className="text-sm">Learn more</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Modules */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive Core Modules
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to run a modern educational institution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreModules.map((module, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white transform group-hover:rotate-12 transition-transform duration-300">
                    {module.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {module.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{module.description}</p>
                <ul className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center space-x-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI & Blockchain Features */}
      <section
        id="technology"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* AI Features */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Brain className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  AI-Powered Intelligence
                </h2>
              </div>
              <div className="space-y-4">
                {aiFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Features */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Shield className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Blockchain Security
                </h2>
              </div>
              <div className="space-y-4">
                {blockchainFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <Star className="absolute top-10 left-10 w-8 h-8 animate-pulse opacity-50" />
            <Star className="absolute top-20 right-20 w-6 h-6 animate-pulse opacity-30 animation-delay-1000" />
            <Star className="absolute bottom-20 left-1/4 w-10 h-10 animate-pulse opacity-40 animation-delay-2000" />
            <Sparkles className="absolute bottom-10 right-1/3 w-8 h-8 animate-pulse opacity-50 animation-delay-1500" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Join thousands of schools already using AcademySphere to
            revolutionize education
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-lg hover:shadow-2xl transform hover:scale-105 transition-all font-semibold flex items-center space-x-2">
              <span>Start Free 30-Day Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all font-semibold">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-8 h-8 text-purple-400" />
                <span className="text-xl font-bold">AcademySphere</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering education with AI and blockchain technology
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} AcademySphere. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: backwards;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          animation-fill-mode: backwards;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
};

export default Home;
