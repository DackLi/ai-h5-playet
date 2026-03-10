import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getSiteByHostname } from '@/lib/siteConfig';
import { getPolicyAndContact } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'BeiDou Terms of Use and Service Agreement',
};

function detectLang(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en';
  if (acceptLanguage.includes('ja')) return 'ja';
  if (acceptLanguage.includes('es')) return 'es';
  return 'en';
}

export default async function TermsOfUsePage() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const siteId = await getSiteByHostname(hostname);
  const lang = detectLang(headersList.get('accept-language'));
  const data = await getPolicyAndContact(siteId, lang, 'terms_of_us');
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
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Use</h1>
          <p className="text-sm text-white/40 mb-10">Last updated: March 2026</p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            By accessing or using the <strong className="text-white/80">BeiDou</strong> platform,
            website, mobile applications, or any related services (collectively, the{' '}
            <strong className="text-white/80">&quot;Service&quot;</strong>), you agree to be bound by these
            Terms of Use (<strong className="text-white/80">&quot;Terms&quot;</strong>). If you do not agree
            to all of these Terms, you must not access or use the Service. These Terms constitute a
            legally binding agreement between you and BeiDou. Your continued use of the Service
            following any updates to these Terms constitutes your acceptance of the revised Terms.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">2. Use of Service</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            The Service is intended solely for users who are{' '}
            <strong className="text-white/80">18 years of age or older</strong>. By using the
            Service, you represent and warrant that you meet this age requirement. Users under the
            age of 18 are strictly prohibited from registering an account or accessing any content
            on the platform.
          </p>
          <p className="text-sm text-white/60 leading-relaxed mt-3">
            You agree to use the Service only for lawful purposes and in accordance with these
            Terms. You must not use the Service in any manner that could damage, disable,
            overburden, or impair the platform, or interfere with any other party&apos;s use of the
            Service. <strong className="text-white/80">Unauthorized or illegal use of the Service
            is strictly forbidden</strong> and may result in immediate termination of your account
            and referral to relevant law enforcement authorities.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">3. User Accounts</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            To access certain features of the Service, you may be required to create an account.
            You are responsible for maintaining the{' '}
            <strong className="text-white/80">confidentiality of your account credentials</strong>{' '}
            and for all activities that occur under your account. You agree to notify us immediately
            of any unauthorized use of your account. BeiDou will not be liable for any loss or
            damage arising from your failure to safeguard your login information. Each user may only
            maintain one active account, and accounts are non-transferable.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">4. Content and Intellectual Property</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            All content available through the Service, including but not limited to videos, text,
            graphics, logos, images, audio clips, and software, is the property of{' '}
            <strong className="text-white/80">BeiDou or its content licensors</strong> and is
            protected by applicable intellectual property laws. You are granted a limited,
            non-exclusive, non-transferable license to access and view content solely for your
            personal, non-commercial use.
          </p>
          <p className="text-sm text-white/60 leading-relaxed mt-3">
            You must not reproduce, distribute, modify, create derivative works of, publicly
            display, publicly perform, republish, download, store, or transmit any content obtained
            through the Service without prior written permission from BeiDou. Any unauthorized use
            of the content may violate copyright, trademark, and other applicable laws.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">5. VIP Membership and Payments</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            BeiDou offers <strong className="text-white/80">VIP membership plans</strong> that
            provide access to premium content and enhanced features. By subscribing to a VIP plan,
            you authorize BeiDou to charge your selected payment method on a recurring basis
            according to the billing cycle you choose. All fees are stated in the applicable
            currency and are{' '}
            <strong className="text-white/80">non-refundable except as required by law</strong> or
            as explicitly stated in our Refund Policy.
          </p>
          <p className="text-sm text-white/60 leading-relaxed mt-3">
            BeiDou reserves the right to modify subscription pricing at any time. Any price changes
            will be communicated to you in advance and will take effect at the start of your next
            billing cycle. You may cancel your subscription at any time; cancellation will take
            effect at the end of the current billing period.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">6. Prohibited Activities</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            When using the Service, you agree not to engage in any of the following prohibited
            activities:
          </p>
          <ul className="text-sm text-white/60 leading-relaxed mt-3 list-disc list-inside space-y-2">
            <li>Using any automated tool, bot, spider, or scraper to access or collect data from the Service without express written consent.</li>
            <li>Attempting to <strong className="text-white/80">circumvent, disable, or interfere</strong> with security-related features of the Service.</li>
            <li>Uploading, transmitting, or distributing any malware, viruses, or other harmful code.</li>
            <li>Impersonating any person or entity or misrepresenting your affiliation with any person or entity.</li>
            <li>Using the Service to engage in any form of harassment, abuse, or discrimination.</li>
            <li>Reverse engineering, decompiling, or disassembling any portion of the Service.</li>
            <li>Sharing, re-selling, or sublicensing your account or VIP access to third parties.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            THE SERVICE IS PROVIDED ON AN{' '}
            <strong className="text-white/80">&quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;</strong>{' '}
            BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
            LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            AND NON-INFRINGEMENT. BEIDOU DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
            ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE SERVICE IS
            SOLELY AT YOUR OWN RISK.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">8. Limitation of Liability</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BEIDOU AND ITS AFFILIATES,
            OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY{' '}
            <strong className="text-white/80">INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES</strong>, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA,
            GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR
            INABILITY TO ACCESS OR USE) THE SERVICE. IN NO EVENT SHALL BEIDOU&apos;S TOTAL
            LIABILITY TO YOU EXCEED THE AMOUNTS YOU HAVE PAID TO BEIDOU IN THE TWELVE (12) MONTHS
            PRECEDING THE CLAIM.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">9. Changes to Terms</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            BeiDou reserves the right to modify these Terms at any time at its sole discretion. We
            will notify you of material changes by updating the{' '}
            <strong className="text-white/80">&quot;Last updated&quot;</strong> date at the top of this
            page and, where appropriate, by sending a notification to the email address associated
            with your account. It is your responsibility to review these Terms periodically.
            Continued use of the Service after any changes become effective constitutes your
            acceptance of the new Terms.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">10. Governing Law</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles. Any disputes arising out of or relating
            to these Terms or the Service shall be subject to the exclusive jurisdiction of the
            competent courts. If any provision of these Terms is found to be invalid or
            unenforceable, the remaining provisions shall continue in full force and effect.
          </p>

          <h2 className="text-lg font-semibold text-white mt-8 mb-3">11. Contact</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            If you have any questions, concerns, or feedback regarding these Terms of Use, please
            do not hesitate to contact us. Our support team is available to assist you and will
            respond to your inquiry as promptly as possible.
          </p>
          <p className="text-sm text-white/60 leading-relaxed mt-3">
            Email:{' '}
            <a
              href="mailto:support@beidou.com"
              className="text-white/80 hover:text-white underline underline-offset-2 transition-colors duration-200"
            >
              support@beidou.com
            </a>
          </p>
        </>
      )}
    </div>
  );
}
