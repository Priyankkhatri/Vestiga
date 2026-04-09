import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Github, Send, MessageSquare, Bug, HelpCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLockup } from '../components/common/Brand';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);

    // Build mailto link
    const mailtoSubject = encodeURIComponent(subject || `Vestiga Contact: ${name}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:pktimepass01@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    setTimeout(() => {
      setSending(false);
      toast.success('Email client opened! Send the email to reach us.');
    }, 500);
  };

  const inputClasses = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all";

  return (
    <div className="bg-[#0A0F1C] min-h-screen">
      {/* Navbar Mini */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="group">
            <BrandLockup
              markClassName="h-8 w-8"
              textClassName="text-lg font-bold text-white tracking-tight"
            />
          </Link>
          <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-20 max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-[0.2em] mb-3 block">Support</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Have a question, feedback, or found a bug? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Contact Form */}
            <div className="md:col-span-3">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <MessageSquare size={18} className="text-teal-400" />
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className={inputClasses}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your question, feedback, or issue..."
                      rows={5}
                      className={`${inputClasses} resize-none`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-900 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 px-6 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        Send Message
                        <Send size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-2 space-y-5">
              {/* Direct Email */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Mail size={18} className="text-teal-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Email Us Directly</h3>
                </div>
                <a href="mailto:pktimepass01@gmail.com" className="text-sm text-teal-400 hover:text-teal-300 underline transition-colors">
                  pktimepass01@gmail.com
                </a>
                <p className="text-xs text-slate-600 mt-2">We typically respond within 24-48 hours.</p>
              </div>

              {/* Bug Report */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Bug size={18} className="text-red-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Report a Bug</h3>
                </div>
                <p className="text-sm text-slate-400 mb-3">Found something broken? Open an issue on our public GitHub repo.</p>
                <a
                  href="https://github.com/Priyankkhatri/My-Vault/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Github size={14} /> Open GitHub Issue
                </a>
              </div>

              {/* FAQ */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HelpCircle size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Check the FAQ</h3>
                </div>
                <p className="text-sm text-slate-400 mb-3">Many common questions are already answered on our landing page.</p>
                <Link
                  to="/#faq"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  View FAQ →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
