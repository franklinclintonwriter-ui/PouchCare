import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Tag,
  X,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { blogCategories, blogPosts, blogAuthors } from "../data/blog";

const POSTS_PER_PAGE = 6;

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAuthor(authorKey) {
  return blogAuthors[authorKey] || Object.values(blogAuthors)[0];
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function AuthorAvatar({ author, size = "w-8 h-8", textSize = "text-xs" }) {
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-white font-semibold ${textSize} shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${author.color}, ${author.color}cc)`,
      }}
    >
      {getInitials(author.name)}
    </div>
  );
}

/* ─── Featured Post Hero ─── */
function FeaturedPostHero({ post }) {
  const author = getAuthor(post.author);
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <Link
        to={`/blog/${post.slug}`}
        className="block bg-white rounded-card shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-300"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left: colored gradient preview */}
          <div
            className="lg:w-[55%] h-64 lg:h-80 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${post.color}, ${post.color}99, ${post.color}55)`,
            }}
          >
            <div className="absolute top-4 left-4">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                {blogCategories.find((c) => c.slug === post.category)?.label ||
                  post.category}
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                {post.title}
              </h2>
            </div>
          </div>

          {/* Right: details */}
          <div className="lg:w-[45%] p-6 lg:p-8 flex flex-col justify-center">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold w-fit mb-3">
              {blogCategories.find((c) => c.slug === post.category)?.label ||
                post.category}
            </span>
            <h3 className="font-heading text-xl lg:text-2xl font-bold text-heading">
              {post.title}
            </h3>
            <p className="text-body mt-3 leading-relaxed">{post.excerpt}</p>

            <div className="flex items-center gap-3 mt-5">
              <AuthorAvatar author={author} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-heading">
                  {author.name}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 group">
              <span className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:underline">
                Read Article
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

/* ─── Blog Card ─── */
function BlogCard({ post }) {
  const author = getAuthor(post.author);
  const categoryName =
    blogCategories.find((c) => c.slug === post.category)?.label || post.category;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      {/* Colored preview area */}
      <div
        className="h-48 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${post.color}, ${post.color}88, ${post.color}44)`,
        }}
      >
        <div className="absolute top-3 left-3">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            {categoryName}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3
            className="font-heading text-lg font-bold text-white drop-shadow-lg line-clamp-2"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          >
            {post.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-muted rounded-full px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h4 className="font-heading text-lg font-semibold text-heading group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h4>

        {/* Excerpt */}
        <p className="text-sm text-body mt-2 line-clamp-2">{post.excerpt}</p>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <AuthorAvatar author={author} size="w-7 h-7" textSize="text-[10px]" />
            <span className="text-xs text-body">{author.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ categories, tagCounts, onCategoryClick }) {
  const topTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [tagCounts]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    blogPosts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <aside className="w-72 hidden lg:block shrink-0">
      <div className="sticky top-24 space-y-8">
        {/* Trending Topics */}
        <div>
          <h3 className="font-heading text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending Topics
          </h3>
          <div className="space-y-0">
            {topTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onCategoryClick("all")}
                className="flex items-center gap-2 py-2 text-sm text-body hover:text-primary transition-colors w-full text-left"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="flex-1">{tag}</span>
                <span className="text-xs text-muted bg-gray-100 rounded-full px-2 py-0.5">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-primary rounded-card p-6">
          <BookOpen className="w-8 h-8 text-white/80 mb-3" />
          <h3 className="font-heading text-lg font-bold text-white mb-2">
            Subscribe to our newsletter
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Get the latest articles and updates delivered to your inbox.
          </p>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-btn px-3 py-2 text-sm text-heading bg-white placeholder:text-muted outline-none focus:ring-2 focus:ring-accent-cyan mb-3"
          />
          <button className="w-full bg-white text-primary font-semibold text-sm py-2 rounded-btn hover:bg-primary-light transition-colors">
            Subscribe
          </button>
          <p className="text-white/50 text-xs mt-2 text-center">
            No spam. Unsubscribe anytime.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-heading text-lg font-bold text-heading mb-4">
            Categories
          </h3>
          <div className="space-y-0">
            {categories
              .filter((c) => c.slug !== "all")
              .map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => onCategoryClick(cat.slug)}
                  className="flex justify-between items-center py-2 border-b border-gray-50 text-sm w-full text-left hover:text-primary transition-colors"
                >
                  <span className="text-body">{cat.label}</span>
                  <span className="bg-gray-100 rounded-full px-2 py-0.5 text-xs text-muted">
                    {categoryCounts[cat.slug] || 0}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Pagination ─── */
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-btn border border-gray-200 text-body hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-btn transition-colors ${
            page === currentPage
              ? "bg-primary text-white"
              : "border border-gray-200 text-body hover:border-primary hover:text-primary"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-btn border border-gray-200 text-body hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        Next
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Main Blog Page ─── */
export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Compute tag counts across all posts
  const tagCounts = useMemo(() => {
    const counts = {};
    blogPosts.forEach((p) => {
      p.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, []);

  // Featured post
  const featuredPost = useMemo(
    () => blogPosts.find((p) => p.featured),
    []
  );

  // Filtered & sorted posts (exclude featured from grid)
  const filteredPosts = useMemo(() => {
    let posts = blogPosts.filter((p) => !p.featured);

    if (activeCategory !== "all") {
      posts = posts.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter((p) => {
        const author = getAuthor(p.author);
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          author.name.toLowerCase().includes(q)
        );
      });
    }

    // Sort by date newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return posts;
  }, [activeCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Reset page when filters change
  function handleCategoryChange(cat) {
    setActiveCategory(cat);
    setCurrentPage(1);
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  return (
    <>
      {/* ── Page Header ── */}
      <section className="bg-surface-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-heading">
            PouchCare Blog
          </h1>
          <p className="text-body text-lg mt-4 max-w-2xl mx-auto">
            Insights, tutorials, and updates for WordPress creators
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <div className="flex items-center bg-white rounded-full shadow-card overflow-hidden">
              <Search className="w-5 h-5 text-muted ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search articles..."
                className="flex-1 px-3 py-3 text-sm text-heading placeholder:text-muted outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Post ── */}
      {featuredPost && !searchQuery && activeCategory === "all" && (
        <div className="mt-10">
          <FeaturedPostHero post={featuredPost} />
        </div>
      )}

      {/* ── Category Filter Bar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {blogCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                activeCategory === cat.slug
                  ? "bg-primary text-white"
                  : "bg-white text-body border border-gray-200 hover:border-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Blog Grid + Sidebar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex gap-8">
          {/* Main grid */}
          <div className="flex-1 min-w-0">
            {paginatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold text-heading mb-2">
                  No articles found
                </h3>
                <p className="text-body text-sm">
                  Try adjusting your search or filter to find what you&apos;re
                  looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setCurrentPage(1);
                  }}
                  className="mt-4 text-primary font-semibold text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Sidebar */}
          <Sidebar
            categories={blogCategories}
            tagCounts={tagCounts}
            onCategoryClick={handleCategoryChange}
          />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-primary py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Start Building with PouchCare
          </h2>
          <p className="text-white/80 text-lg mt-4 max-w-2xl mx-auto">
            Join thousands of WordPress creators using PouchCare to build
            faster, more reliable websites.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 mt-8 bg-white text-primary font-semibold px-8 py-3 rounded-btn hover:bg-primary-light transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
