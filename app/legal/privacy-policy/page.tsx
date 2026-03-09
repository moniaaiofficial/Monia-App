'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0f0102] text-white">
      <div className="sticky top-0 bg-[#0f0102] border-b border-[#fc2857] z-10">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#fc2857]/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6 text-[#e0e0e0]">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Privacy Policy for MONiA</h2>
          <p className="text-sm text-[#e0e0e0]">Last Updated: {new Date().toLocaleDateString()}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">1. Information We Collect</h3>
          <p>
            When you sign up for MONiA, we collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Mobile Number (mandatory)</li>
            <li>City</li>
            <li>Device information for security purposes</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">2. How We Use Your Information</h3>
          <p>
            We use your personal information to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your account</li>
            <li>Provide communication services</li>
            <li>Improve our platform and user experience</li>
            <li>Send important updates and notifications</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">3. Data Storage and Security</h3>
          <p>
            Messages are stored on secure servers. We take reasonable measures to protect your data, but please note:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">MONiA does NOT use end-to-end encryption</strong></li>
            <li>Text messages may remain stored on our servers</li>
            <li>We implement industry-standard security practices</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">4. Media Files Auto-Deletion</h3>
          <p className="font-semibold text-white">
            Important: All media files are automatically deleted after 48 hours
          </p>
          <p>
            The following types of media are automatically deleted from both chats and our servers after 48 hours:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Images</li>
            <li>Videos</li>
            <li>Documents</li>
            <li>Voice notes</li>
          </ul>
          <p>
            Text messages are NOT automatically deleted and may remain stored.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">5. Data Sharing</h3>
          <p>
            We do NOT sell your personal data to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">6. Your Rights</h3>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your account</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">7. Account Deletion</h3>
          <p>
            To request account deletion, please email us at:{' '}
            <a href="mailto:moniaaiofficial@gmail.com" className="text-[#fc2857] hover:underline">
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">8. Changes to Privacy Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes through the app or via email.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">9. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:moniaaiofficial@gmail.com" className="text-[#fc2857] hover:underline">
              moniaaiofficial@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
