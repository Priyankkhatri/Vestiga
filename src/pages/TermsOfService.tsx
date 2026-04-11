import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BrandLockup } from '../components/common/Brand';

export function TermsOfService() {
  return (
    <div className="bg-[#0A0F1C] min-h-screen">
      <Helmet>
        <title>Terms of Service | Vestiga</title>
        <meta name="description" content="Read our Terms of Service. Learn about your rights and responsibilities when using Vestiga's zero-knowledge password manager." />
        <link rel="canonical" href="https://vestiga.vercel.app/terms" />
      </Helmet>
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

      <div className="pt-28 pb-20 max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-[0.2em] mb-3 block">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-sm max-w-none space-y-8">
            <Section title="1. Acceptance of Terms">
              <p>By accessing or using Vestiga (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.</p>
              <p>These Terms apply to all visitors, users, and others who access or use the Service.</p>
            </Section>

            <Section title="2. Description of Service">
              <p>Vestiga is a zero-knowledge, end-to-end encrypted password management service. The Service includes:</p>
              <ul>
                <li>A web application for managing encrypted credentials</li>
                <li>A browser extension for autofill and credential capture</li>
                <li>Cross-device sync of encrypted vault data</li>
                <li>AI-powered security audit features</li>
              </ul>
            </Section>

            <Section title="3. Account Registration">
              <p>To use the Service, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your master password</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activity under your account</li>
              </ul>
              <p><strong>Important:</strong> Due to our zero-knowledge architecture, we cannot recover your master password. You are solely responsible for remembering it.</p>
            </Section>

            <Section title="4. Acceptable Use">
              <p>You agree NOT to:</p>
              <ul>
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to other users' vaults or our systems</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to store content that violates the rights of others</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Create multiple accounts for abusive purposes</li>
              </ul>
            </Section>

            <Section title="5. Intellectual Property">
              <p>The Service and its original content (excluding user-generated content) remain the property of Vestiga. The Service is protected by copyright, trademark, and other laws.</p>
              <p>Your stored data belongs to you. We claim no rights over the content you store in your vault.</p>
            </Section>

            <Section title="6. Data and Privacy">
              <p>Your use of the Service is also governed by our <Link to="/privacy" className="text-teal-400 hover:text-teal-300 underline">Privacy Policy</Link>. Key points:</p>
              <ul>
                <li>We cannot access your encrypted vault data</li>
                <li>We do not sell or share your personal information</li>
                <li>You can export or delete your data at any time</li>
              </ul>
            </Section>

            <Section title="7. Service Availability">
              <p>We strive to keep the Service available 24/7, but we do not guarantee uninterrupted access. We may:</p>
              <ul>
                <li>Temporarily suspend the Service for maintenance</li>
                <li>Modify or discontinue features with reasonable notice</li>
                <li>Restrict access to prevent abuse or security threats</li>
              </ul>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>To the maximum extent permitted by law, Vestiga shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:</p>
              <ul>
                <li>Your use or inability to use the Service</li>
                <li>Loss of data due to forgotten master passwords</li>
                <li>Unauthorized access to your account due to your negligence</li>
                <li>Any third-party actions or services</li>
              </ul>
            </Section>

            <Section title="9. Account Termination">
              <p>We may terminate or suspend your account if you violate these Terms or engage in abusive behavior. You may delete your account at any time through the Settings page.</p>
              <p>Upon termination, your encrypted vault data will be permanently deleted within 30 days.</p>
            </Section>

            <Section title="10. Changes to Terms">
              <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
            </Section>

            <Section title="11. Governing Law">
              <p>These Terms shall be governed by the laws of India, without regard to conflict of law principles.</p>
            </Section>

            <Section title="12. Contact">
              <p>For questions about these Terms, contact us at:</p>
              <p><a href="mailto:pktimepass01@gmail.com" className="text-teal-400 hover:text-teal-300 underline">pktimepass01@gmail.com</a></p>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-slate-400 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-slate-300 [&_li]:text-slate-400">
        {children}
      </div>
    </div>
  );
}
