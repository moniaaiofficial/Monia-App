'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen text-white" style={{ background: '#14141f' }}>
      <div
        className="sticky top-0 z-10 neon-shining-line"
        style={{
          background: '#14141f',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(255,0,102,0.20)',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition-colors"
            style={{ color: '#ff0066' }}
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
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>1. Acceptance of Terms</h3>
          <p>
            By accessing and using MONiA, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>2. Age Requirement</h3>
          <p className="font-semibold text-white">Users must be 13 years or older to use MONiA.</p>
          <p>If you are under 13 years of age, you are not permitted to use this platform.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>3. Prohibited Activities</h3>
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
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>4. Account Suspension</h3>
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
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>5. Media Auto-Deletion Policy</h3>
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
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>6. User-Generated Content</h3>
          <p>
            MONiA is NOT responsible for user-generated content shared on the platform. Users are solely responsible for the content they share.
          </p>
          <p>
            You retain ownership of your content, but by using MONiA, you grant us the right to store, process, and transmit your content as necessary to provide our services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>7. Payments and Transactions</h3>
          <p>
            Any payments or transactions conducted through MONiA follow Indian UPI rules and regulations. We are not responsible for payment failures or disputes arising from third-party payment services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>8. Limitation of Liability</h3>
          <p>MONiA is provided &quot;as is&quot; without warranties of any kind. We are not liable for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Loss of data or content</li>
            <li>Interruption of service</li>
            <li>Unauthorized access to your account</li>
            <li>Damages arising from use or inability to use the platform</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>9. Privacy and Data Security</h3>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
          </p>
          <p className="font-semibold text-white">Note: MONiA does NOT use end-to-end encryption.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>10. Modifications to Terms</h3>
          <p>
            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Continued use of MONiA after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>11. Intellectual Property</h3>
          <p>
            All intellectual property rights in MONiA, including but not limited to logos, design, and software, belong to MONiA. You may not copy, modify, or distribute our intellectual property without permission.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>12. Governing Law</h3>
          <p>
            These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>13. Contact Information</h3>
          <p>
            For questions, concerns, or support, please contact us at:{' '}
            <a
              href="mailto:moniaaiofficial@gmail.com"
              style={{ color: '#ff0066' }}
              className="hover:underline font-semibold"
            >
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>14. Messaging Service – Important Disclosure</h3>
          <p className="font-semibold text-white">
            MONiA messaging is NOT end-to-end encrypted.
          </p>
          <p>
            By using MONiA's messaging features, you acknowledge and agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Messages are transmitted using TLS encryption in transit but are stored in a readable format on MONiA
              servers. They are <strong className="text-white">not</strong> end-to-end encrypted.
            </li>
            <li>
              You must not transmit passwords, financial credentials, government ID numbers, or other highly
              sensitive data through MONiA messaging.
            </li>
            <li>
              MONiA reserves the right to review message content to enforce these Terms, prevent abuse, or comply
              with applicable law.
            </li>
            <li>
              Delivery and read-receipt statuses (sent / delivered / read) are tracked and stored.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>15. Messaging Conduct</h3>
          <p>When using MONiA messaging you must NOT:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Send unsolicited bulk messages (spam).</li>
            <li>Transmit malware, phishing links, or harmful content.</li>
            <li>Use automated bots or scripts to send messages without prior approval.</li>
            <li>Harass, threaten, or abuse other users.</li>
          </ul>
          <p>
            Violations may result in immediate account suspension without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>16. Data Security Disclaimer</h3>
          <p>
            While MONiA implements industry-standard security measures (TLS, RLS, secure key storage), no
            system is completely secure. MONiA is not liable for unauthorised access to messages resulting from
            factors outside our reasonable control, including breaches of your device or account credentials.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>17. Device Permissions &amp; Feature Access</h3>
          <p>
            To use all features of MONiA, your device may prompt you to grant the following permissions. These are
            optional — denying a permission only disables the related feature and does not prevent general app use.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Camera</strong> — Required for in-app photo and video capture for messages.</li>
            <li><strong className="text-white">Microphone</strong> — Required for voice note recording.</li>
            <li><strong className="text-white">Location</strong> — Accessed only when you explicitly share your location in a chat. Not tracked in the background at any time.</li>
            <li><strong className="text-white">Media / Storage</strong> — Required to select files (photos, videos, documents) from your device library for sharing.</li>
            <li><strong className="text-white">Notifications</strong> — Optional. Enables push notifications for new messages when the app is installed as a PWA.</li>
          </ul>
          <p>
            You may manage or revoke permissions at any time through your browser settings (&quot;Site Settings&quot; or equivalent).
            MONiA will never request permissions beyond those listed above.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff0066' }}>18. Progressive Web App (PWA) Usage</h3>
          <p>
            MONiA may be installed on your device as a Progressive Web App via your browser&apos;s &quot;Add to Home Screen&quot;
            feature. By installing the PWA you agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The app icon and launch experience are provided for convenience and do not grant MONiA any additional access to your device.</li>
            <li>Service worker caching is used to improve performance. Cached data can be cleared through your browser&apos;s site data settings.</li>
            <li>Push notifications, if enabled, are delivered through your browser&apos;s native push infrastructure. You can disable these at any time from your device&apos;s notification settings.</li>
            <li>MONiA is not responsible for compatibility issues arising from unsupported browsers or operating systems.</li>
          </ul>
        </section>

        <section
          className="space-y-3 mt-8 p-4 rounded-2xl"
          style={{ border: '1px solid rgba(255,0,102,0.25)', background: 'rgba(255,0,102,0.04)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
            By using MONiA, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </section>
      </div>
    </main>
  );
}
