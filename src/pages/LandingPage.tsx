import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck, Lock, Fingerprint, Zap, Globe, Brain,
  ChevronDown, ArrowRight, CheckCircle2, Eye, EyeOff,
  KeyRound, Sparkles, Shield, Mail, Github,
  Menu, X, ExternalLink, User as UserIcon, LogOut, Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { startProCheckout } from '../services/paymentService';
import { BrandLockup, BrandMark } from '../components/common/Brand';

// ─── Data ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'AES-256-GCM encryption ensures your data is locked before it ever leaves your device. Zero-knowledge architecture means we literally cannot read your passwords.',
    badge: 'Core',
  },
  {
    icon: Globe,
    title: 'Browser Extension',
    description: 'One-click autofill across every website. Smart form detection, credential saving prompts, and seamless sync with your vault — all from your browser toolbar.',
    badge: 'Extension',
  },
  {
    icon: Brain,
    title: 'AI Security Audit',
    description: 'Powered by AI analysis, get instant visibility into weak, reused, or compromised passwords. Actionable recommendations to harden your digital life.',
    badge: 'AI',
  },
  {
    icon: Zap,
    title: 'Cross-Device Sync',
    description: 'Your encrypted vault syncs instantly across all your devices. Add a password on your phone, access it on your laptop — encrypted end-to-end.',
    badge: 'Sync',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Unlock',
    description: 'Use your fingerprint or face to unlock your vault on supported devices. Fast, secure, and without the hassle of typing your master password every time.',
    badge: 'Security',
  },
  {
    icon: ShieldCheck,
    title: 'Security Dashboard',
    description: 'A real-time overview of your vault health: password strength scores, breach monitoring alerts, and an overall security posture rating.',
    badge: 'Monitor',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Vault',
    description: 'Sign up with your email or Google account. Set a strong master password — the only password you\'ll ever need to remember.',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Add Your Credentials',
    description: 'Import existing passwords or start fresh. Our browser extension automatically detects and saves new logins as you browse.',
    icon: KeyRound,
  },
  {
    step: '03',
    title: 'Stay Protected',
    description: 'Vestiga works silently in the background — autofilling credentials, alerting you to breaches, and keeping your digital life secure.',
    icon: Shield,
  },
];

const FAQS = [
  {
    q: 'Is Vestiga really free?',
    a: 'Vestiga offers a generous Free tier which includes the core extension and up to 16 passwords. For power users, Vestiga Pro unlocks unlimited passwords, cross-device sync, and AI security audits for just $3/month.',
  },
  {
    q: 'Can Vestiga see my passwords?',
    a: 'Absolutely not. Vestiga uses a zero-knowledge architecture with end-to-end encryption. Your passwords are encrypted on your device before they reach our servers. We physically cannot decrypt or access your data — only you can, with your master password.',
  },
  {
    q: 'What happens if I forget my master password?',
    a: 'Because of our zero-knowledge design, we cannot recover your master password. We strongly recommend writing it down and storing it in a physically secure location. This is the trade-off for true security — no backdoors, ever.',
  },
  {
    q: 'Is Vestiga open source?',
    a: 'Yes! Our codebase is publicly available on GitHub. We believe in transparency — anyone can audit our encryption implementation and security practices.',
  },
  {
    q: 'Which browsers does the extension support?',
    a: 'Vestiga\'s extension is built for Chromium-based browsers (Chrome, Edge, Brave, Arc) and Firefox. It supports autofill, credential saving, and one-click login across all your favorite websites.',
  },
  {
    q: 'How is Vestiga different from other password managers?',
    a: 'Vestiga combines the security of zero-knowledge encryption with the intelligence of AI-powered security audits. Unlike bloated alternatives, we\'re fast, minimal, and developer-friendly — with a public codebase you can verify yourself.',
  },
];

const TRUST_TICKER = [
  'AES-256-GCM Encryption',
  'Zero-Knowledge Architecture',
  'Open Source Codebase',
  'PBKDF2 Key Derivation',
  'End-to-End Encrypted',
  'No Plaintext Storage',
  'Cross-Device Sync',
  'AI-Powered Audits',
];

// ─── Components ──────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group">
          <BrandLockup
            markClassName="h-8 w-8"
            textClassName="text-xl font-bold text-gray-900 tracking-tight"
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3 relative">
          {session ? (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <UserIcon size={12} className="text-white" />
                </div>
                <span>{user?.email?.split('@')[0] || 'Account'}</span>
                <ChevronDown size={14} className={`transition-transform text-gray-400 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-12 right-0 w-56 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 py-2 overflow-hidden"
                >
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <ShieldCheck size={16} className="text-teal-600" />
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <SettingsIcon size={16} />
                    Settings
                  </Link>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-lg transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-gray-100 px-6 py-6 shadow-xl shadow-gray-200/50 space-y-4 absolute left-0 right-0"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {session ? (
              <>
                <div className="px-2 pb-2 mb-2 border-b border-gray-50 text-sm font-medium text-gray-500">
                  {user?.email}
                </div>
                <Link to="/dashboard" className="block text-center text-sm font-semibold text-white bg-teal-600 py-2.5 rounded-lg mb-2">
                  Dashboard
                </Link>
                <Link to="/settings" className="block text-center text-sm font-medium text-gray-600 py-2.5 rounded-lg border border-gray-200 bg-gray-50 mb-2">
                  Settings
                </Link>
                <button onClick={handleLogout} className="w-full block text-center text-sm font-medium text-red-600 py-2.5 rounded-lg border border-red-200 bg-red-50">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-center text-sm font-medium text-gray-700 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                  Login
                </Link>
                <Link to="/signup" className="block text-center text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 py-2.5 rounded-lg">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const { session } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-white">
      <motion.div style={{ y, opacity }} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 mb-8"
        >
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Join 10,000+ Secure Users</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.15] tracking-tight mb-6"
        >
          Your passwords
          <br />
          deserve a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">fortress</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Vestiga is a zero-knowledge, end-to-end encrypted password manager
          with AI-powered security audits and a seamless browser extension.
          <span className="text-gray-700 font-medium"> We can't see your passwords — only you can.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {session ? (
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 px-8 py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 px-8 py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-base font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-8 py-3.5 rounded-xl transition-all shadow-sm"
          >
            See How It Works
            <ChevronDown size={18} />
          </a>
        </motion.div>

        {/* Security Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>E2E Encrypted</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-teal-600" />
            <span>Zero-Knowledge</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1.5">
            <Github size={14} className="text-gray-900" />
            <span>Open Source</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function TrustTicker() {
  return (
    <section className="relative py-8 bg-gray-50 border-y border-gray-200 overflow-hidden">
      <div className="animate-ticker flex items-center gap-12 whitespace-nowrap">
        {[...TRUST_TICKER, ...TRUST_TICKER].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-500">
            <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold text-teal-600 uppercase tracking-[0.2em] mb-3 block">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need.{' '}
            <span className="text-gray-400">Nothing you don't.</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            A lean, fast, and fiercely secure password manager built for people who care about their digital safety.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <feature.icon size={24} className="text-teal-600" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="py-24 sm:py-32 bg-gray-50 relative border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold text-teal-600 uppercase tracking-[0.2em] mb-3 block">Security</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Zero-knowledge means{' '}
            <span className="text-teal-600">zero compromise</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* What We Store */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <EyeOff size={20} className="text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">What We Store</h3>
            </div>
            <div className="space-y-4">
              {[
                'Encrypted binary blobs (unreadable)',
                'Your email address (for login)',
                'Encrypted vault metadata',
                'Timestamps for sync',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                  <Lock size={16} className="text-teal-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What We Can't See */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-red-100 rounded-2xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Eye size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">What We <span className="text-red-500">Cannot</span> See</h3>
            </div>
            <div className="space-y-4">
              {[
                'Your master password (never sent to us)',
                'Your actual passwords or credentials',
                'Your notes, card numbers, or secrets',
                'Any plaintext data — ever',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                  <X size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Encryption Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-6">Encryption Flow</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
            {[
              { label: 'Your Password', color: 'text-gray-900', bg: 'bg-gray-100' },
              { label: '→', color: 'text-gray-300', bg: 'transparent' },
              { label: 'PBKDF2 Key Derivation', color: 'text-yellow-700', bg: 'bg-yellow-50' },
              { label: '→', color: 'text-gray-300', bg: 'transparent' },
              { label: 'AES-256-GCM', color: 'text-teal-700', bg: 'bg-teal-50' },
              { label: '→', color: 'text-gray-300', bg: 'transparent' },
              { label: 'Encrypted Blob', color: 'text-gray-500', bg: 'bg-gray-50 border border-gray-200' },
            ].map((step, i) => (
              <span key={i} className={`font-mono font-medium px-3 py-1 rounded-lg ${step.color} ${step.bg}`}>
                {step.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { session } = useAuth();
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold text-teal-600 uppercase tracking-[0.2em] mb-3 block">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Secure in <span className="text-teal-600">three steps</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Connector Line (desktop only) */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-[40px] left-[60%] w-[80%] h-px border-t border-dashed border-gray-300" />
              )}

              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 mb-6 relative border border-teal-100 shadow-sm z-10">
                <step.icon size={32} className="text-teal-600" />
                <span className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 shadow-sm">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          {session ? (
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 px-8 py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 px-8 py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
            >
              Create Your Vault
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { user, tier, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    try {
      const result = await startProCheckout({
        email: user?.email,
        onSuccess: async (response) => {
          console.log('[Razorpay] Payment Success:', response);
          await refreshProfile();
          alert('Welcome to Vestiga Pro! Your account has been upgraded.');
          navigate('/dashboard');
        },
      });

      if (result.alreadyPro) {
        alert('You are already a Pro member!');
        return;
      }
    } catch (err: any) {
      console.error('[Pricing] Upgrade error:', err);
      alert(err?.message || 'Failed to start checkout. Please try again.');
    }
  };

  const handleAction = (planName: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    if (planName === 'Pro') {
      if (tier === 'pro') {
        navigate('/dashboard');
      } else {
        handleUpgrade();
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Start securing your digital life for free, or upgrade to Pro for absolute power. No hidden fees.
          </motion.p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-5xl mx-auto animate-in fade-in duration-500">
          
          {/* Free Tier */}
          <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col hover:border-teal-200 transition-colors">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
            <p className="text-gray-500 text-sm mb-6">Perfect for individuals just getting started with security.</p>
            <div className="text-4xl font-black text-gray-900 mb-6">$0<span className="text-lg font-medium text-gray-500">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Up to 16 Passwords
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Browser Extension Autofill
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Zero-Knowledge Encryption
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X size={18} className="text-gray-300 shrink-0" />
                Cross-Device Sync
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X size={18} className="text-gray-300 shrink-0" />
                AI Security Audits
              </li>
            </ul>
            <button
              onClick={() => handleAction('Basic')}
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="flex-1 bg-white border-2 border-teal-500 rounded-3xl p-8 shadow-xl shadow-teal-900/5 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="bg-teal-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Vestiga Pro</h3>
            <p className="text-gray-500 text-sm mb-6">For power users who need complete security across all devices.</p>
            <div className="text-4xl font-black text-gray-900 mb-6">$3<span className="text-lg font-medium text-gray-500">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Unlimited Passwords
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Browser Extension Autofill
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Zero-Knowledge Encryption
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Cross-Device Sync
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Advanced AI Security Audits
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-900 font-semibold">
                <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                Priority Support
              </li>
            </ul>
            <button
              onClick={() => handleAction('Pro')}
              className="block w-full text-center py-3 px-6 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all"
            >
              {!user ? 'Upgrade to Pro' : tier === 'pro' ? 'Go to Dashboard' : 'Upgrade to Pro'}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32 bg-gray-50 relative border-y border-gray-200">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold text-teal-600 uppercase tracking-[0.2em] mb-3 block">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Common questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-teal-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left bg-transparent border-none focus:outline-none"
              >
                <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180 text-teal-600' : ''
                  }`}
                />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96' : 'max-h-0'}`}>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { session } = useAuth();
  return (
    <section className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-900 rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 text-white">
            <BrandMark className="w-16 h-16 mx-auto mb-8" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to secure your digital life?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-10">
              Join thousands of security-conscious users who trust Vestiga to protect their most sensitive credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 text-base font-semibold text-gray-900 bg-teal-400 hover:bg-teal-300 px-8 py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                >
                  Go to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 text-base font-semibold text-gray-900 bg-teal-400 hover:bg-teal-300 px-8 py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <a
                href="https://github.com/Priyankkhatri/My-Vault"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-medium text-white hover:text-white px-8 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
              >
                <Github size={18} />
                View on GitHub
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <BrandLockup
              className="mb-4"
              markClassName="h-8 w-8"
              textClassName="text-lg font-bold text-gray-900"
            />
            <p className="text-sm text-gray-500 leading-relaxed">
              Zero-knowledge, end-to-end encrypted password manager. Your passwords deserve a fortress.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">Features</a></li>
              <li><a href="#security" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">Security</a></li>
              <li><a href="#faq" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">FAQ</a></li>
              <li>
                <a href="https://github.com/Priyankkhatri/My-Vault" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium inline-flex items-center gap-1">
                  GitHub <ExternalLink size={11} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li><Link to="/contact" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact Us</Link></li>
              <li>
                <a href="mailto:pktimepass01@gmail.com" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium inline-flex items-center gap-1.5">
                  <Mail size={14} /> Email
                </a>
              </li>
              <li>
                <a href="https://github.com/Priyankkhatri/My-Vault/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-teal-600 transition-colors font-medium inline-flex items-center gap-1.5">
                  <Github size={14} /> Report a Bug
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-gray-500">© {new Date().getFullYear()} Vestiga. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>Built with zero-knowledge security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="bg-white min-h-screen text-gray-900 selection:bg-teal-100 selection:text-teal-900">
      <Navbar />
      <HeroSection />
      <TrustTicker />
      <FeaturesSection />
      <SecuritySection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
