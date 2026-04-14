import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Badge } from '@/components/ui/Badge';
import { PageSEO } from '@/components/seo/PageSEO';
import { BLOG_POSTS } from '@/lib/constants';
import { cn } from '@/lib/cn';

const CATEGORY_VARIANT: Record<string, 'sky' | 'indigo' | 'green' | 'yellow' | 'red' | 'slate'> = {
  'Link Building': 'sky',
  'Case Study': 'green',
  'Technical SEO': 'indigo',
  'On-Page SEO': 'sky',
  'Local SEO': 'yellow',
  'Content': 'green',
  'Paid Ads': 'red',
  'Web Development': 'indigo',
};

const BASE_URL = 'https://pouchcare.com';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const others = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  /* ── Article JSON-LD ───────────────────────────────────────────────────── */
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: {
      '@type': 'ImageObject',
      url: `${BASE_URL}${post.image}`,
    },
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    author: {
      '@type': 'Person',
      name: post.author,
      worksFor: {
        '@id': `${BASE_URL}/#organization`,
      },
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'PouchCare',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/pouchcare-logo-main.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <PageSEO
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        ogImage={post.image}
        keywords={post.tags.join(', ')}
        schema={articleSchema}
      />

      {/* Hero */}
      <div className="pt-[68px] pb-0 bg-navy-800 border-b border-navy-600">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            {/* Back link */}
            <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 text-sm mb-8 transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Blog
            </Link>

            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant={CATEGORY_VARIANT[post.category] ?? 'slate'}>{post.category}</Badge>
                <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={11} />{post.readTime}</span>
                <span className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={11} />{post.date}</span>
              </div>

              <h1 className="font-sora font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-50 leading-tight mb-6">
                {post.title}
              </h1>

              <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8">{post.excerpt}</p>

              {/* Author */}
              <div className="flex items-center gap-3 pb-8">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold font-sora text-lg shrink-0">
                  {post.authorAvatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">{post.author}</div>
                  <div className="text-slate-400 text-xs">{post.authorRole} · PouchCare</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Cover image */}
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="rounded-t-2xl overflow-hidden max-w-5xl h-56 sm:h-72 lg:h-96">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Body */}
      <section className="section-pad">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Article body */}
            <article className="lg:col-span-2">
              <ScrollReveal>
                <div className="prose-custom space-y-6">
                  {post.body.map((paragraph, i) => {
                    const isBold = paragraph.startsWith('**');
                    if (isBold) {
                      const parts = paragraph.split('**');
                      return (
                        <div key={i} className="rounded-xl border-l-2 border-sky-500/60 pl-5 py-1">
                          <p className="text-slate-300 leading-relaxed text-base">
                            <strong className="text-slate-100 font-semibold">{parts[1]}</strong>
                            {parts[2] && <span className="text-slate-400">{parts[2]}</span>}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className={cn('leading-relaxed text-base', i === 0 ? 'text-slate-300 text-lg' : 'text-slate-400')}>
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </ScrollReveal>

              {/* Tags */}
              <ScrollReveal>
                <div className="mt-10 pt-8 border-t border-navy-600/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} className="text-sky-400" />
                    <span className="text-slate-400 text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        to="/blog"
                        className="text-xs px-3 py-1.5 rounded-full bg-navy-700 border border-navy-500 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Author card */}
              <ScrollReveal>
                <div className="mt-8 rounded-2xl border border-navy-600/60 bg-navy-800/50 p-6 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold font-sora text-xl shrink-0">
                    {post.authorAvatar}
                  </div>
                  <div>
                    <div className="font-sora font-semibold text-slate-100 mb-0.5">{post.author}</div>
                    <div className="text-sky-400 text-xs font-medium mb-2">{post.authorRole} · PouchCare</div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      A specialist at PouchCare with hands-on experience running active SEO campaigns for clients across 30+ countries.
                      The insights in this article come directly from live campaign data.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* CTA */}
              <ScrollReveal>
                <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/8 to-indigo-500/5 p-6 text-center sticky top-[88px]">
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="font-sora font-bold text-slate-50 text-base mb-2">Want us to do this for you?</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5">
                    Get a free site audit and a custom growth strategy from the same team that wrote this article.
                  </p>
                  <Link
                    to="/contact"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                  >
                    Get Free Audit <ArrowRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>

              {/* Related posts */}
              <ScrollReveal>
                <div className="rounded-2xl border border-navy-600/60 bg-navy-700/30 p-6">
                  <h3 className="font-semibold text-slate-200 text-sm mb-4">More articles</h3>
                  <div className="space-y-4">
                    {others.map((p) => (
                      <Link key={p.slug} to={`/blog/${p.slug}`} className="flex gap-3 group">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-16 h-12 rounded-lg object-cover shrink-0 group-hover:opacity-80 transition-opacity"
                        />
                        <div>
                          <div className="text-slate-300 text-xs font-medium leading-snug group-hover:text-sky-300 transition-colors line-clamp-2">{p.title}</div>
                          <div className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Clock size={10} />{p.readTime}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
