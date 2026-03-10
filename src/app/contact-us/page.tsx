import { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getSiteByHostname } from '@/lib/siteConfig';
import { getPolicyAndContact } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact BeiDou support team',
};

function detectLang(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en';
  if (acceptLanguage.includes('ja')) return 'ja';
  if (acceptLanguage.includes('es')) return 'es';
  return 'en';
}

const contactCards = [
  {
    title: 'General Inquiries',
    email: 'support@beidou.com',
    description: 'For general questions, account issues, and technical support.',
  },
  {
    title: 'Business & Partnerships',
    email: 'business@beidou.com',
    description: 'For collaboration opportunities, advertising, and business proposals.',
  },
  {
    title: 'Content Removal',
    email: 'dmca@beidou.com',
    description: 'For DMCA notices, copyright claims, and content takedown requests.',
  },
];

export default async function ContactUsPage() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const siteId = await getSiteByHostname(hostname);
  const lang = detectLang(headersList.get('accept-language'));
  const data = await getPolicyAndContact(siteId, lang, 'contact_us');
  const hasContent = false && data.txt;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {hasContent ? (
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.txt }}
        />
      ) : (
        <>
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-white mb-4">Contact Us</h1>

          {/* Subtitle */}
          <p className="text-white/50 mb-10 text-base leading-relaxed">
            Have a question, concern, or just want to say hello? We are here to help. Reach out to
            the BeiDou support team through any of the channels below and we will get back to you
            as soon as possible.
          </p>

          {/* Contact Cards Section */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">Get in Touch</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contactCards.map((card) => (
              <div
                key={card.title}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6"
              >
                <p className="text-white/80 font-medium mb-1">{card.title}</p>
                <a
                  href={`mailto:${card.email}`}
                  className="text-red-400 text-sm hover:text-red-300 transition-colors duration-200 block mb-3"
                >
                  {card.email}
                </a>
                <p className="text-white/40 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Response Time */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">Response Time</h2>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6">
            <p className="text-white/50 text-base leading-relaxed">
              We typically respond within{' '}
              <span className="text-white/80 font-medium">24-48 hours</span>. Response times may
              vary during holidays or periods of high volume. We appreciate your patience.
            </p>
          </div>

          {/* FAQ Link */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-3">Looking for Quick Answers?</h2>
          <p className="text-white/50 text-base leading-relaxed">
            Before reaching out, you may find a solution in our{' '}
            <Link
              href="/about-us"
              className="text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              About Us
            </Link>{' '}
            page, or review our{' '}
            <Link
              href="/terms-of-use"
              className="text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              Privacy Policy
            </Link>{' '}
            for common questions about how we operate.
          </p>
        </>
      )}
    </div>
  );
}
