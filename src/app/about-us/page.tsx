import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getSiteByHostname } from '@/lib/siteConfig';
import { getPolicyAndContact } from '@/lib/api';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About BeiDou - Your premier destination for short drama series',
};

function detectLang(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'en';
  if (acceptLanguage.includes('ja')) return 'ja';
  if (acceptLanguage.includes('es')) return 'es';
  return 'en';
}

export default async function AboutUsPage() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const siteId = await getSiteByHostname(hostname);
  const lang = detectLang(headersList.get('accept-language'));
  const data = await getPolicyAndContact(siteId, lang, 'about_us');
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
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-white mb-4">About Us</h1>
          <p className="text-white/50 mb-10 text-base leading-relaxed">
            BeiDou is your premier destination for short drama series — delivering
            bite-sized, high-quality storytelling to audiences around the world.
            Whether you are looking for romance, thriller, fantasy, or slice-of-life,
            BeiDou brings you the best of short-form drama, anytime and anywhere.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="text-red-400 font-bold text-2xl">10,000+</div>
              <div className="text-sm text-white/60 mt-1">Episodes Available</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-2xl">50+</div>
              <div className="text-sm text-white/60 mt-1">Languages Supported</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-2xl">5M+</div>
              <div className="text-sm text-white/60 mt-1">Global Viewers</div>
            </div>
          </div>

          {/* Our Story */}
          <section>
            <h2 className="text-lg font-semibold text-white mt-8 mb-3">Our Story</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              BeiDou was founded with a simple belief: great stories do not need to be
              long. Inspired by the rising popularity of short drama content across
              Asia and beyond, our team set out to build a platform that celebrates the
              art of concise, compelling narratives. Named after the BeiDou navigation
              system — a constellation guiding the way — our platform is designed to
              guide viewers to the stories that matter most to them.
            </p>
            <p className="text-sm text-white/60 leading-relaxed mt-3">
              From a small content library, we have grown into a global streaming
              service, working with independent creators and major studios alike to
              bring fresh, diverse, and emotionally resonant short dramas to screens
              worldwide.
            </p>
          </section>

          {/* What We Offer */}
          <section>
            <h2 className="text-lg font-semibold text-white mt-8 mb-3">What We Offer</h2>
            <ul className="space-y-3">
              <li className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">Multi-language Content</span>
                &nbsp;— Browse dramas in English, Chinese, Korean, Spanish, and
                many more languages, with subtitles available across all major titles.
              </li>
              <li className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">Diverse Genres</span>
                &nbsp;— From heartwarming romance and edge-of-your-seat thrillers to
                fantasy epics and everyday slice-of-life stories, there is something
                for every mood and moment.
              </li>
              <li className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">Free to Watch</span>
                &nbsp;— Enjoy a vast selection of episodes at no cost. Premium
                memberships unlock exclusive early-access content and ad-free viewing.
              </li>
              <li className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">High-Definition Streaming</span>
                &nbsp;— Every episode is delivered in crisp HD quality, optimised for
                mobile, tablet, and desktop devices.
              </li>
              <li className="text-sm text-white/60 leading-relaxed">
                <span className="text-white font-medium">New Releases Weekly</span>
                &nbsp;— Our catalogue is updated regularly so there is always
                something new to discover.
              </li>
            </ul>
          </section>

          {/* Our Mission */}
          <section>
            <h2 className="text-lg font-semibold text-white mt-8 mb-3">Our Mission</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Our mission is simple: connecting global audiences with compelling
              short-form stories. We believe entertainment should be accessible,
              inclusive, and boundary-free. By supporting creators from all
              backgrounds and distributing their work to viewers in every corner of
              the world, BeiDou hopes to foster empathy, spark conversations, and
              prove that a great story can unfold in just a few minutes.
            </p>
            <p className="text-sm text-white/60 leading-relaxed mt-3">
              We are committed to championing diverse voices, investing in
              emerging talent, and continuously improving the viewing experience
              for our community. The story of BeiDou is still being written — and
              we are glad you are a part of it.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
