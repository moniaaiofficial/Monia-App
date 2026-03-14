'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen text-white" style={{ background: '#06000c' }}>
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(6,0,12,0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(198,255,51,0.10)',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition-colors"
            style={{ color: '#c6ff33' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Terms &amp; Conditions</h1>
        </div>
      </div>

      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6" style={{ color: 'rgba(255,255,255,0.70)' }}>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Terms &amp; Conditions for MONiA</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>1. Acceptance of Terms</h3>
          <p>
            By accessing and using MONiA, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>2. Age Requirement</h3>
          <p className="font-semibold text-white">Users must be 13 years or older to use MONiA.</p>
          <p>If you are under 13 years of age, you are not permitted to use this platform.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>3. Prohibited Activities</h3>
          <p>Users must NOT use MONiA for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Any illegal activities</li>
            <li>Spam or unsolicited messages</li>
            <li>Harassment, bullying, or abuse of other users</li>
            <li>Fraud or deceptive practices</li>
            <li>Sharing harmful, offensive, or inappropriate content</li>
            <li>Impersonating others</li>
            <li>Violating intellectual property rights</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>4. Account Suspension</h3>
          <p>
            MONiA reserves the right to suspend or terminate accounts that violate these terms without prior notice. Violations include but are not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Engaging in prohibited activities</li>
            <li>Violating community guidelines</li>
            <li>Causing harm to other users or the platform</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>5. Media Auto-Deletion Policy</h3>
          <p className="font-semibold text-white">All media files automatically expire and are deleted after 48 hours.</p>
          <p>This includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Images</li>
            <li>Videos</li>
            <li>Documents</li>
            <li>Voice notes</li>
          </ul>
          <p>
            By using MONiA, you acknowledge and accept this auto-deletion policy. Please save important media files to your device before they expire.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>6. User-Generated Content</h3>
          <p>
            MONiA is NOT responsible for user-generated content shared on the platform. Users are solely responsible for the content they share.
          </p>
          <p>
            You retain ownership of your content, but by using MONiA, you grant us the right to store, process, and transmit your content as necessary to provide our services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>7. Payments and Transactions</h3>
          <p>
            Any payments or transactions conducted through MONiA follow Indian UPI rules and regulations. We are not responsible for payment failures or disputes arising from third-party payment services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>8. Limitation of Liability</h3>
          <p>MONiA is provided &quot;as is&quot; without warranties of any kind. We are not liable for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Loss of data or content</li>
            <li>Interruption of service</li>
            <li>Unauthorized access to your account</li>
            <li>Damages arising from use or inability to use the platform</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>9. Privacy and Data Security</h3>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
          </p>
          <p className="font-semibold text-white">Note: MONiA does NOT use end-to-end encryption.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>10. Modifications to Terms</h3>
          <p>
            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Continued use of MONiA after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>11. Intellectual Property</h3>
          <p>
            All intellectual property rights in MONiA, including but not limited to logos, design, and software, belong to MONiA. You may not copy, modify, or distribute our intellectual property without permission.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>12. Governing Law</h3>
          <p>
            These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#c6ff33' }}>13. Contact Information</h3>
          <p>
            For questions, concerns, or support, please contact us at:{' '}
            <a
              href="mailto:moniaaiofficial@gmail.com"
              style={{ color: '#c6ff33' }}
              className="hover:underline font-semibold"
            >
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>

        <section
          className="space-y-3 mt-8 p-4 rounded-2xl"
          style={{ border: '1px solid rgba(198,255,51,0.25)', background: 'rgba(198,255,51,0.04)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
            By using MONiA, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </section>
      </div>
    </main>
  );
}
