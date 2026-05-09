import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  BookOpen,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { blogPosts, blogAuthors } from "../data/blog";

/* ── helpers ─────────────────────────────────────────────────── */

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractHeadings(content) {
  if (!content) return [];
  return content
    .split("\n")
    .filter((l) => /^#{2,3}\s/.test(l))
    .map((l) => {
      const level = l.startsWith("### ") ? 3 : 2;
      const text = l.replace(/^#{2,3}\s+/, "");
      return { level, text };
    });
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-heading">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return p;
  });
}

function renderContent(content) {
  if (!content) return null;
  const blocks = content.split("\n\n");
  const elements = [];
  let isFirst = true;

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i].trim();
    if (!block) {
      i++;
      continue;
    }

    /* headings */
    if (block.startsWith("### ")) {
      const text = block.replace(/^###\s+/, "");
      elements.push(
        <h3
          key={i}
          id={text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          className="font-heading text-xl font-semibold text-heading mt-8 mb-3"
        >
          {text}
        </h3>
      );
      i++;
      continue;
    }
    if (block.startsWith("## ")) {
      const text = block.replace(/^##\s+/, "");
      elements.push(
        <h2
          key={i}
          id={text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          className="font-heading text-2xl font-bold text-heading mt-10 mb-4 pb-2 border-b border-gray-100"
        >
          {text}
        </h2>
      );
      i++;
      continue;
    }

    /* unordered list */
    const lines = block.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      elements.push(
        <ul key={i} className="list-disc pl-6 space-y-2 text-body mb-4">
          {lines.map((l, li) => (
            <li key={li} className="leading-relaxed">
              {renderInline(l.trim().replace(/^-\s+/, ""))}
            </li>
          ))}
        </ul>
      );
      i++;
      continue;
    }

    /* ordered list */
    if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      elements.push(
        <ol key={i} className="list-decimal pl-6 space-y-2 text-body mb-4">
          {lines.map((l, li) => (
            <li key={li} className="leading-relaxed">
              {renderInline(l.trim().replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
      i++;
      continue;
    }

    /* paragraph */
    if (isFirst) {
      elements.push(
        <p key={i} className="text-lg text-heading leading-relaxed mb-6">
          {renderInline(block)}
        </p>
      );
      isFirst = false;
    } else {
      elements.push(
        <p key={i} className="text-body leading-relaxed mb-6 text-[17px]">
          {renderInline(block)}
        </p>
      );
    }
    i++;
  }
  return elements;
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ── mock comments ───────────────────────────────────────────── */

const mockComments = [
  {
    name: "Jordan Lee",
    date: "2 days ago",
    text: "Great article! The section about caching strategies was especially helpful for my client projects.",
    likes: 12,
  },
  {
    name: "Priya Patel",
    date: "1 day ago",
    text: "This is exactly what I needed. Would love to see a follow-up post about advanced optimization techniques.",
    likes: 8,
  },
  {
    name: "Chris Anderson",
    date: "5 hours ago",
    text: "Been using PouchCare for 6 months now and these tips made a noticeable difference in my site performance.",
    likes: 15,
  },
];

/* ── component ───────────────────────────────────────────────── */

export default function BlogPost() {
  const { slug } = useParams();
  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const post = blogPosts[postIndex];
  const [linkCopied, setLinkCopied] = useState(false);

  /* ── 404 ── */
  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Post Not Found
          </h1>
          <p className="text-body mb-6">
            The blog post you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-btn font-semibold hover:bg-primary-dark transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const author = blogAuthors[post.author] || {
    name: "PouchCare Team",
    role: "Contributor",
    bio: "",
  };
  const headings = extractHeadings(post.content);

  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);
  const fallbackRelated =
    relatedPosts.length < 3
      ? [
          ...relatedPosts,
          ...blogPosts
            .filter(
              (p) =>
                p.slug !== post.slug &&
                !relatedPosts.find((r) => r.slug === p.slug)
            )
            .slice(0, 3 - relatedPosts.length),
        ]
      : relatedPosts;

  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost =
    postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── 1. Breadcrumbs ── */}
      <div className="bg-surface-light py-4">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-body">
            <Link to="/blog" className="hover:text-primary transition">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className="text-muted">{post.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className="text-heading font-medium truncate max-w-[240px]">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* ── 2. Article Header ── */}
      <div className="bg-surface-light pb-12 pt-4">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
            {post.category}
          </span>

          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-heading leading-tight mt-4">
            {post.title}
          </h1>

          {/* meta row */}
          <div className="flex items-center justify-center flex-wrap gap-4 mt-6 text-sm text-body">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white text-sm font-bold">
                {getInitials(author.name)}
              </div>
              <div className="text-left">
                <span className="font-semibold text-heading block leading-tight">
                  {author.name}
                </span>
                <span className="text-xs text-muted">{author.role}</span>
              </div>
            </div>
            <span className="hidden sm:block text-gray-300">|</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted" />
              {formatDate(post.date)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted" />
              {post.readTime}
            </div>
          </div>

          {/* tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white border border-gray-200 text-body rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Hero Image Area ── */}
      <div className="max-w-4xl mx-auto px-6 -mt-2">
        <div
          className="h-64 md:h-80 rounded-card relative overflow-hidden flex items-center justify-center"
          style={{ background: `linear-gradient(to bottom right, ${post.color}, ${post.color}99)` }}
        >
          {/* circuit pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <h2 className="relative z-10 text-white text-2xl md:text-3xl lg:text-4xl font-heading font-extrabold text-center px-8 max-w-2xl leading-snug drop-shadow-lg">
            {post.title}
          </h2>
        </div>
      </div>

      {/* ── 4. Article Content Layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-8">
          {/* main article */}
          <article className="flex-1 max-w-3xl">
            {renderContent(post.content)}

            {/* ── 5. Share Bar ── */}
            <div className="border-t border-gray-100 pt-8 mt-10">
              <span className="text-sm font-semibold text-heading block mb-4">
                Share this article
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:text-primary hover:border-primary transition"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:text-primary hover:border-primary transition"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:text-primary hover:border-primary transition"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-body hover:text-primary hover:border-primary transition"
                  aria-label="Copy link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {linkCopied && (
                  <span className="text-xs text-primary font-medium ml-1">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* ── 6. Author Bio Card ── */}
            <div className="mt-12 bg-surface-light rounded-card p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {getInitials(author.name)}
                </div>
                <div>
                  <span className="text-xs text-muted uppercase tracking-wider">
                    Written by
                  </span>
                  <h3 className="font-heading text-xl font-bold text-heading mt-1">
                    {author.name}
                  </h3>
                  <p className="text-sm text-primary">{author.role}</p>
                  {author.bio && (
                    <p className="text-body mt-2 leading-relaxed">
                      {author.bio}
                    </p>
                  )}
                  <Link
                    to="/blog"
                    className="inline-block text-primary text-sm font-semibold mt-3 hover:underline"
                  >
                    View all posts &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* ── 7. Related Posts ── */}
            <div className="mt-16">
              <h2 className="font-heading text-2xl font-bold text-heading">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {fallbackRelated.map((rp) => {
                  const rAuthor = blogAuthors[rp.author] || {
                    name: "PouchCare Team",
                  };
                  return (
                    <Link
                      key={rp.slug}
                      to={`/blog/${rp.slug}`}
                      className="bg-white rounded-card shadow-card hover:shadow-card-hover overflow-hidden transition group"
                    >
                      <div
                        className="h-40 flex items-center justify-center p-4"
                        style={{ background: `linear-gradient(to bottom right, ${rp.color}, ${rp.color}99)` }}
                      >
                        <span className="text-white font-heading font-bold text-center text-sm leading-snug">
                          {rp.title}
                        </span>
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-semibold text-primary">
                          {rp.category}
                        </span>
                        <h3 className="font-heading text-base font-bold text-heading mt-1 line-clamp-2 group-hover:text-primary transition">
                          {rp.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                          <span>{rAuthor.name}</span>
                          <span>&middot;</span>
                          <span>{formatDate(rp.date)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── 8. Comments Section ── */}
            <div className="mt-16">
              <h2 className="font-heading text-2xl font-bold text-heading flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Comments ({mockComments.length})
              </h2>

              <div className="mt-6">
                {mockComments.map((c, ci) => (
                  <div
                    key={ci}
                    className="flex gap-4 border-b border-gray-100 py-6"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-heading text-sm">
                          {c.name}
                        </span>
                        <span className="text-xs text-muted">{c.date}</span>
                      </div>
                      <p className="text-body text-sm mt-1 leading-relaxed">
                        {c.text}
                      </p>
                      <button className="flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-primary transition">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {c.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave a Comment form */}
              <div className="mt-8">
                <h3 className="font-heading text-lg font-semibold text-heading mb-4">
                  Leave a Comment
                </h3>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-4"
                >
                  <textarea
                    placeholder="Write your comment..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-btn px-4 py-3 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your name"
                      className="border border-gray-200 rounded-btn px-4 py-3 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                    <input
                      type="email"
                      placeholder="Your email"
                      className="border border-gray-200 rounded-btn px-4 py-3 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-3 rounded-btn font-semibold text-sm hover:bg-primary-dark transition"
                  >
                    Post Comment
                  </button>
                </form>
              </div>
            </div>

            {/* ── 9. Previous / Next Navigation ── */}
            <div className="mt-12 border-t border-gray-100 pt-8 flex justify-between">
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="hover:bg-surface-light rounded-btn p-4 transition group max-w-[45%]"
                >
                  <span className="flex items-center gap-1 text-xs text-muted mb-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous Article
                  </span>
                  <span className="font-heading font-semibold text-heading text-sm group-hover:text-primary transition line-clamp-2">
                    {prevPost.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="hover:bg-surface-light rounded-btn p-4 transition group text-right max-w-[45%]"
                >
                  <span className="flex items-center justify-end gap-1 text-xs text-muted mb-1">
                    Next Article
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-heading font-semibold text-heading text-sm group-hover:text-primary transition line-clamp-2">
                    {nextPost.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>

          {/* ── Table of Contents sidebar ── */}
          <aside className="w-56 hidden xl:block">
            <div className="sticky top-24">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
                Table of Contents
              </h4>
              <div className="border-l-2 border-gray-100">
                {headings.map((h, hi) => (
                  <a
                    key={hi}
                    href={`#${h.text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={`block text-sm py-1.5 text-body hover:text-primary cursor-pointer transition ${
                      h.level === 3 ? "pl-6" : "pl-4"
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
