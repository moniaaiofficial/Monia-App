'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen text-white" style={{ background: '#1a0d00' }}>
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(26,13,0,0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(198,255,51,0.10)',
        }}
      >
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition-colors"
            style={{ color: '#ff471a' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6" style={{ color: 'rgba(255,255,255,0.70)' }}>
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Privacy Policy for MONiA</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>1. Information We Collect</h3>
          <p>When you sign up for MONiA, we collect the following information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Mobile Number (mandatory)</li>
            <li>City</li>
            <li>Device information for security purposes</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>2. How We Use Your Information</h3>
          <p>We use your personal information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your account</li>
            <li>Provide communication services</li>
            <li>Improve our platform and user experience</li>
            <li>Send important updates and notifications</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>3. Data Storage and Security</h3>
          <p>Messages are stored on secure servers. We take reasonable measures to protect your data, but please note:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">MONiA does NOT use end-to-end encryption</strong></li>
            <li>Text messages may remain stored on our servers</li>
            <li>We implement industry-standard security practices</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>4. Media Files Auto-Deletion</h3>
          <p className="font-semibold text-white">
            Important: All media files are automatically deleted after 48 hours
          </p>
          <p>The following types of media are automatically deleted from both chats and our servers after 48 hours:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Images</li>
            <li>Videos</li>
            <li>Documents</li>
            <li>Voice notes</li>
          </ul>
          <p>Text messages are NOT automatically deleted and may remain stored.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>5. Data Sharing</h3>
          <p>We do NOT sell your personal data to third parties. We may share your information only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>6. Your Rights</h3>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your account</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>7. Account Deletion</h3>
          <p>
            To request account deletion, please email us at:{' '}
            <a
              href="mailto:moniaaiofficial@gmail.com"
              style={{ color: '#ff471a' }}
              className="hover:underline font-semibold"
            >
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>8. Changes to Privacy Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes through the app or via email.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>9. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:{' '}
            <a
              href="mailto:moniaaiofficial@gmail.com"
              style={{ color: '#ff471a' }}
              className="hover:underline font-semibold"
            >
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>10. Messaging &amp; Data Transmission</h3>
          <p>
            MONiA provides a real-time messaging service. Before using the messaging features, please read the following carefully:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">MONiA does NOT use end-to-end encryption.</strong> Messages you send
              are transmitted and may be stored on our servers in a readable format.
            </li>
            <li>
              All text messages are transmitted over TLS (Transport Layer Security) to protect data in transit,
              but are NOT encrypted at rest with end-to-end keys.
            </li>
            <li>
              Message content (text), sender and recipient identifiers, timestamps, and delivery status
              (sent / delivered / read) are stored in our database.
            </li>
            <li>
              Authorised MONiA staff may access message content for safety, abuse prevention, or legal compliance
              purposes.
            </li>
            <li>
              Do NOT share passwords, financial information, or highly sensitive personal data through MONiA
              messaging.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>11. Message Retention &amp; Deletion</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Text messages are retained until you request account deletion.</li>
            <li>Media files (images, videos, documents, voice notes) are automatically deleted after <strong className="text-white">48 hours</strong>.</li>
            <li>To request permanent deletion of your messages, contact us at moniaaiofficial@gmail.com.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>12. Realtime Data</h3>
          <p>
            MONiA uses Supabase Realtime to deliver messages instantly. This involves establishing a persistent
            WebSocket connection between your device and our servers. Metadata about active connections (such as
            session duration and IP address) may be temporarily logged for performance and security monitoring.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>13. Device Permissions</h3>
          <p>MONiA may request the following device permissions to enable specific features:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Camera</strong> — to take photos or record video and send them as media messages.</li>
            <li><strong className="text-white">Microphone</strong> — to record voice notes up to 15 minutes in length.</li>
            <li><strong className="text-white">Location</strong> — to share your current GPS coordinates in a chat. Location is only accessed when you explicitly tap &quot;Share Location&quot; and is never tracked in the background.</li>
            <li><strong className="text-white">Storage / Media Library</strong> — to select existing images, videos, and documents from your device for sharing.</li>
            <li><strong className="text-white">Notifications</strong> — to alert you to new messages when the app is in the background (requires installation as a PWA).</li>
          </ul>
          <p>
            Each permission is requested at the moment the relevant feature is first used. You may revoke permissions
            at any time through your browser or device settings. Revoking a permission disables the related feature
            but does not affect the rest of the app.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: '#ff471a' }}>14. Progressive Web App (PWA)</h3>
          <p>
            MONiA is available as a Progressive Web App that can be installed on your home screen for a near-native
            experience. When installed:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The app runs in a standalone window without browser chrome.</li>
            <li>A service worker caches assets for faster load times and limited offline access to previously viewed content.</li>
            <li>Push notifications may be delivered via your browser&apos;s push service (e.g. FCM for Chrome). No personal data is shared with push infrastructure providers beyond a device token.</li>
            <li>Cached data is stored locally on your device and can be cleared at any time through your browser&apos;s site data settings.</li>
          </ul>
          <p>MONiA does not use the PWA installation to collect additional data beyond what is described in this policy.</p>
        </section>
      </div>
    </main>
  );
}
