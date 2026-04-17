import { useState } from "react";
import { ArrowRight, Clock, User, Tag, Search, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  SectionLabel,
  SectionHeading,
  SectionSub,
} from "@/components/ui/SectionLabel";
import { PageSEO } from "@/components/seo/PageSEO";
import { BLOG_POSTS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  "All",
  "Link Building",
  "Case Study",
  "Technical SEO",
  "On-Page SEO",
  "Local SEO",
  "Content",
  "Paid Ads",
  "Web Development",
];

const CATEGORY_VARIANT: Record<
  string,
  "sky" | "indigo" | "green" | "yellow" | "red" | "slate"
> = {
  "Link Building": "sky",
  "Case Study": "green",
  "Technical SEO": "indigo",
  "On-Page SEO": "sky",
  "Local SEO": "yellow",
  Content: "green",
  "Paid Ads": "red",
  "Web Development": "indigo",
};

const ALL_TAGS = Array.from(new Set(BLOG_POSTS.flatMap((p) => p.tags)));

export default function Blog() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filtered = BLOG_POSTS.filter((p) => {
    const matchesCat = category === "All" || p.category === category;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <PageSEO
        title="SEO Blog — Expert Guides, Case Studies & Link Building Tips"
        description="Read actionable SEO guides, link building strategies, and real case studies from PouchCare's specialist team. Updated weekly with tactics that drive measurable results."
        canonical="/blog"
        keywords="SEO blog, SEO guides, link building tips, SEO case studies, SEO strategies, digital marketing blog, PouchCare blog"
      />

      {/* Sub-header */}
      <div className="border-b border-gray-200 bg-white pt-[68px] pb-12">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <SectionLabel>PouchCare Blog</SectionLabel>
            <SectionHeading className="mb-4">
              SEO insights that{" "}
              <span className="text-gradient">actually work</span>
            </SectionHeading>
            <SectionSub className="max-w-2xl mx-auto mb-6">
              Practical, no-fluff guides from our team of active SEO
              specialists. Every article is written by someone running live
              campaigns for real clients — not a content writer paid per word.
            </SectionSub>
            {/* Inline search */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search
                size={15}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500/60 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[68px] z-30 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0",
                category === cat
                  ? "bg-sky-500 text-white"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="section-pad">
        <div className="container-max">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="mx-auto mb-4 text-gray-500" />
              <p className="mb-3 text-gray-600">
                No articles match your search.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="text-sm text-primary-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Featured post — large card */}
              {featured && (
                <ScrollReveal>
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="group mb-8 block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft transition-all duration-300 hover:border-primary-300 hover:shadow-elevated"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image */}
                      <div className="relative h-56 sm:h-72 lg:h-auto overflow-hidden">
                        <img
                          src={featured.image}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 lg:from-transparent lg:to-white/75" />
                      </div>
                      {/* Content */}
                      <div className="p-7 sm:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <Badge
                            variant={
                              CATEGORY_VARIANT[featured.category] ?? "slate"
                            }
                          >
                            {featured.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={11} />
                            {featured.readTime}
                          </span>
                          <span className="text-xs text-gray-500">
                            {featured.date}
                          </span>
                        </div>
                        <h2 className="mb-4 font-sora text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-primary-700 sm:text-2xl lg:text-3xl">
                          {featured.title}
                        </h2>
                        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold font-sora">
                              {featured.authorAvatar}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {featured.author}
                              </div>
                              <div className="text-xs text-gray-500">
                                {featured.authorRole}
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-sky-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                            Read article <ArrowRight size={14} />
                          </span>
                        </div>
                        {/* Tags */}
                        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-gray-200 pt-5">
                          {featured.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="cursor-default rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:text-primary-700"
                            >
                              # {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              )}

              {/* Rest of posts grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((post, i) => (
                    <ScrollReveal key={post.slug} delay={i * 60}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft transition-all duration-300 hover:border-primary-300 hover:shadow-elevated"
                      >
                        {/* Cover image */}
                        <div className="relative h-44 sm:h-48 overflow-hidden shrink-0">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <Badge
                              variant={
                                CATEGORY_VARIANT[post.category] ?? "slate"
                              }
                            >
                              {post.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6 flex flex-col flex-1">
                          <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {post.readTime}
                            </span>
                            <span>{post.date}</span>
                          </div>

                          <h2 className="mb-3 flex-1 font-sora text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-700">
                            {post.title}
                          </h2>

                          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500/70 to-indigo-500/70 flex items-center justify-center text-white text-xs font-bold font-sora">
                                {post.authorAvatar}
                              </div>
                              <span className="text-xs text-gray-600">
                                {post.author}
                              </span>
                            </div>
                            <span className="text-sky-400/70 group-hover:text-sky-400 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
                              Read <ArrowRight size={10} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* About this blog */}
      <section className="pb-10 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <ScrollReveal>
            <div className="rounded-2xl border border-navy-600/60 bg-navy-800/50 p-7 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <SectionLabel>About this blog</SectionLabel>
                  <h2 className="font-sora font-bold text-xl sm:text-2xl text-slate-50 mb-4 leading-tight">
                    Written by practitioners,{" "}
                    <span className="text-gradient">not content farms</span>
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Every article on the PouchCare blog is written by a member
                    of our active specialist team — the same people running live
                    campaigns for 500+ clients every day. That means the
                    strategies, tools, and tactics we document are things we are
                    actually using right now, not recycled information from 3
                    years ago.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    We publish in-depth guides on link building, technical SEO,
                    content strategy, and Google algorithm analysis. You will
                    also find honest case studies from our own client campaigns
                    — with real data, not just directional charts.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    No email gate, no upsells buried in the content. Just free,
                    genuinely useful SEO education to help you grow — whether
                    you work with us or not.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      emoji: "✍️",
                      title: "Written by active SEOs",
                      desc: "Our authors run live campaigns daily — not content writers paid per word.",
                    },
                    {
                      emoji: "📊",
                      title: "Real data & case studies",
                      desc: "Every claim is backed by actual campaign data, not theoretical advice.",
                    },
                    {
                      emoji: "🔄",
                      title: "Regularly updated",
                      desc: "Algorithm changes fast. We update old guides when tactics change.",
                    },
                    {
                      emoji: "🆓",
                      title: "100% free, no gate",
                      desc: "No email required, no paywalls. All content is freely accessible.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="p-4 rounded-xl border border-navy-600/40 bg-navy-700/20 hover:border-sky-500/20 transition-colors group"
                    >
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <div className="font-semibold text-slate-100 text-sm mb-1 group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-slate-400 text-xs leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Newsletter + Tags */}
      <section className="pb-20 pt-4 px-4 sm:px-6 lg:px-8 bg-navy-800">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Newsletter */}
            <ScrollReveal direction="left">
              <div className="glass-card p-7 sm:p-8">
                <div className="text-3xl mb-4">📬</div>
                <h3 className="font-sora font-bold text-lg text-slate-50 mb-2">
                  Get SEO tips in your inbox
                </h3>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Join 3,000+ SEO professionals who receive our weekly digest of
                  what is working right now in search. No spam, unsubscribe
                  anytime.
                </p>
                {subscribed ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <span>✓</span> You are subscribed — thank you!
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (emailInput.includes("@")) setSubscribed(true);
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 bg-navy-700 border border-navy-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition-colors"
                    />
                    <Button type="submit" size="md">
                      Subscribe
                    </Button>
                  </form>
                )}
              </div>
            </ScrollReveal>

            {/* All topics */}
            <ScrollReveal direction="right">
              <div className="glass-card p-7 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-sky-400" />
                  <h3 className="font-semibold text-slate-200">
                    Browse by topic
                  </h3>
                </div>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Every article is tagged with relevant topics. Click any tag to
                  discover related articles across our full library of SEO and
                  digital marketing guides.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearch(tag);
                        setCategory("All");
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-navy-700 border border-navy-500 text-slate-400 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/5 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Authors */}
          <ScrollReveal>
            <div className="mt-8 glass-card p-7 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <User size={16} className="text-sky-400" />
                <h3 className="font-semibold text-slate-200">Our authors</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Our editorial team comprises active specialists with years of
                hands-on campaign experience. Every author has a verifiable
                track record in their area — not a content brief and a deadline.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    name: "Arif Rahman",
                    role: "CEO & Founder",
                    avatar: "A",
                    articles: 1,
                  },
                  {
                    name: "Nadia Chowdhury",
                    role: "Head of SEO",
                    avatar: "N",
                    articles: 3,
                  },
                  {
                    name: "Omar Sheikh",
                    role: "Link Building Lead",
                    avatar: "O",
                    articles: 1,
                  },
                  {
                    name: "Priya Singh",
                    role: "Dev Lead",
                    avatar: "P",
                    articles: 2,
                  },
                  {
                    name: "Emma Clarke",
                    role: "Content",
                    avatar: "E",
                    articles: 1,
                  },
                ].map((author) => (
                  <div
                    key={author.name}
                    className="text-center group p-4 rounded-xl border border-navy-600/40 hover:border-sky-500/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold font-sora text-lg mx-auto mb-3 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-shadow">
                      {author.avatar}
                    </div>
                    <div className="font-semibold text-slate-100 text-xs mb-0.5 group-hover:text-sky-300 transition-colors">
                      {author.name}
                    </div>
                    <div className="text-slate-500 text-xs mb-1">
                      {author.role}
                    </div>
                    <div className="text-sky-400 text-xs">
                      {author.articles} article
                      {author.articles !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
