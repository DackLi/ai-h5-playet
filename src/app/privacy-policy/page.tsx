import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getSiteByHostname } from '@/lib/siteConfig';
import { getPolicyAndContact } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BeiDou Privacy Policy — learn how we collect, use, and protect your information.',
};

function detectLang(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en';
  if (acceptLanguage.includes('ja')) return 'ja';
  if (acceptLanguage.includes('es')) return 'es';
  return 'en';
}

export default async function PrivacyPolicyPage() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const siteId = await getSiteByHostname(hostname);
  const lang = detectLang(headersList.get('accept-language'));
  const data = await getPolicyAndContact(siteId, lang, 'custom_privacy');
  const hasContent = data && data.txt;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {hasContent ? (
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.txt }}
        />
      ) : (
        <>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-white/40 mb-10">Last updated: March 2026</p>

          <p className="text-sm text-white/60 leading-relaxed mb-6">
            Welcome to BeiDou. Your privacy is important to us. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you visit our website and use
            our streaming services. Please read this policy carefully. If you disagree with its terms,
            please discontinue use of the site.
          </p>

          {/* 1 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-3">
            We may collect information about you in a variety of ways, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/60 leading-relaxed">
            <li>
              <strong className="text-white/80">Personal Data:</strong> Personally identifiable
              information such as your name and email address that you voluntarily provide when
              registering or contacting us.
            </li>
            <li>
              <strong className="text-white/80">Usage Data:</strong> Information about how you interact
              with the service, including pages visited, time spent, and referring URLs.
            </li>
            <li>
              <strong className="text-white/80">Device Information:</strong> Browser type, IP address,
              operating system, and unique device identifiers.
            </li>
          </ul>

          {/* 2 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. How We Use Your Information</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/60 leading-relaxed">
            <li>Provide, operate, and maintain our streaming services.</li>
            <li>Personalize and improve your viewing experience.</li>
            <li>Communicate with you about account updates, promotions, or support requests.</li>
            <li>Monitor usage for security and fraud prevention purposes.</li>
            <li>Analyze trends to improve platform performance and content offerings.</li>
          </ul>

          {/* 3 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. Cookies</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            We use cookies and similar tracking technologies to enhance your experience on our platform.
            Cookies are small data files stored on your device. You may configure your browser to refuse
            all cookies or to alert you when a cookie is being sent. However, some features of the
            service may not function properly if cookies are disabled.
          </p>

          {/* 4 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Third-Party Services</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            We may share your information with trusted third-party service providers who assist us in
            operating our website — including analytics, advertising networks, and payment processors —
            subject to strict confidentiality obligations. We do not sell your personal data to
            third parties.
          </p>

          {/* 5 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. Data Security</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            We implement reasonable administrative, technical, and physical security measures to protect
            your personal information. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          {/* 6 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Children&apos;s Privacy</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Our service is not directed to individuals under the age of 13. We do not knowingly collect
            personal information from children under 13. If you believe a child has provided us with
            personal information, please contact us and we will promptly remove such data from our systems.
          </p>

          {/* 7 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Changes to This Policy</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page
            with an updated &quot;Last updated&quot; date. We encourage you to review this policy
            periodically. Continued use of the service after changes are posted constitutes your
            acceptance of the revised policy.
          </p>

          {/* 8 */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">8. Contact Us</h2>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            If you have any questions or concerns about this Privacy Policy, please reach out to us:
          </p>
          <div className="p-5 bg-white/[0.04] border border-white/[0.08] rounded-xl inline-block">
            <p className="text-sm text-white/70 font-medium mb-1">Privacy Inquiries</p>
            <a
              href="mailto:privacy@beidou.com"
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              privacy@beidou.com
            </a>
          </div>
        </>
      )}
    </div>
  );
}
