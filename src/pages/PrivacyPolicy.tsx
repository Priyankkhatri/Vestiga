import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BrandLockup } from '../components/common/Brand';

export function PrivacyPolicy() {
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

      <div className="pt-28 pb-20 max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-[0.2em] mb-3 block">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-sm max-w-none space-y-8">
            <Section title="1. Introduction">
              <p>Vestiga ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our password manager service, browser extension, and website (collectively, the "Service").</p>
              <p>By using Vestiga, you agree to the collection and use of information in accordance with this policy.</p>
            </Section>

            <Section title="2. Zero-Knowledge Architecture">
              <p>Vestiga is built on a <strong>zero-knowledge architecture</strong>. This means:</p>
              <ul>
                <li>Your master password is <strong>never transmitted</strong> to our servers.</li>
                <li>All vault data is encrypted on your device using <strong>AES-256-GCM</strong> before being stored.</li>
                <li>We <strong>cannot access, read, or decrypt</strong> your passwords, notes, or any stored credentials.</li>
                <li>Encryption keys are derived locally using <strong>PBKDF2</strong> from your master password.</li>
              </ul>
            </Section>

            <Section title="3. Information We Collect">
              <p><strong>Account Information:</strong> When you create an account, we collect your email address and authentication credentials (hashed password). If you sign in with Google OAuth, we receive your email and profile name from Google.</p>
              <p><strong>Encrypted Vault Data:</strong> Your vault entries are stored as encrypted binary blobs. We cannot read this data.</p>
              <p><strong>Usage Metadata:</strong> We may collect basic usage data such as login timestamps, device information, and IP addresses for security monitoring and abuse prevention.</p>
              <p><strong>We do NOT collect:</strong> Your master password, your decrypted vault contents, your browsing history, or any plaintext credentials.</p>
            </Section>

            <Section title="4. How We Use Your Information">
              <ul>
                <li>To provide and maintain the Service</li>
                <li>To authenticate your identity and secure your account</li>
                <li>To sync your encrypted vault across devices</li>
                <li>To prevent abuse, fraud, and unauthorized access</li>
                <li>To respond to support requests</li>
              </ul>
            </Section>

            <Section title="5. Third-Party Services">
              <p>We use the following third-party services:</p>
              <ul>
                <li><strong>Supabase:</strong> For authentication and encrypted data storage (hosted in secure cloud infrastructure).</li>
                <li><strong>Google OAuth:</strong> Optional sign-in method. We only receive your email and display name.</li>
                <li><strong>Groq AI:</strong> For AI-powered security audit features. No vault data is sent — only anonymized password strength metrics.</li>
              </ul>
            </Section>

            <Section title="6. Data Retention">
              <p>We retain your account and encrypted vault data for as long as your account is active. If you delete your account, all associated data (including encrypted vault entries) will be permanently deleted within 30 days.</p>
            </Section>

            <Section title="7. Data Security">
              <p>We implement industry-standard security measures including:</p>
              <ul>
                <li>End-to-end encryption (AES-256-GCM)</li>
                <li>HTTPS/TLS for all data in transit</li>
                <li>Rate limiting and brute-force protection</li>
                <li>Regular security audits</li>
                <li>Zero-knowledge architecture ensuring we cannot access your data</li>
              </ul>
            </Section>

            <Section title="8. Your Rights">
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access</strong> your personal data (email, account info)</li>
                <li><strong>Export</strong> your vault data</li>
                <li><strong>Delete</strong> your account and all associated data</li>
                <li><strong>Opt out</strong> of optional features like AI security audits</li>
              </ul>
              <p>For EU/EEA residents: You have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.</p>
            </Section>

            <Section title="9. Children's Privacy">
              <p>Vestiga is not intended for children under the age of 13. We do not knowingly collect personal information from children.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
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
