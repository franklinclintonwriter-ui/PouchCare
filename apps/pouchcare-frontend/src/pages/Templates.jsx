import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  Download,
  Eye,
  Search,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  categories as staticCategories,
  templates as staticTemplates,
} from "../data/templates";
import { getNodeApiBase } from "../config/apiBase";

function formatDownloads(num) {
  if (num >= 1000) {
    const val = num / 1000;
    return val % 1 === 0 ? `${val}k` : `${val.toFixed(1)}k`;
  }
  return num.toString();
}

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star
          key={i}
          className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
        />
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star className="w-3.5 h-3.5 text-gray-300 absolute inset-0" />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star key={i} className="w-3.5 h-3.5 text-gray-300" />
      );
    }
  }
  return <span className="flex items-center gap-0.5">{stars}</span>;
}

export default function Templates() {
  const navigate = useNavigate();
  const filtersRef = useRef(null);
  const [templates, setTemplates] = useState(staticTemplates);
  const [categories, setCategories] = useState(staticCategories);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const base = getNodeApiBase();
    if (!base) return;
    const ctl = new AbortController();
    fetch(`${base}/catalog/templates`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (Array.isArray(data.templates) && data.templates.length) {
          setTemplates(data.templates);
        }
        if (Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  const featuredTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 3);
  }, [templates]);

  const filtered = useMemo(() => {
    let result = [...templates];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((t) => t.category === activeCategory);
    }

    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case "newest":
        result.sort(
          (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "downloads":
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      default:
        break;
    }

    return result;
  }, [search, activeCategory, sortBy, templates]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );

  function handleCategoryChange(cat) {
    setActiveCategory(cat);
    setCurrentPage(1);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setCurrentPage(1);
  }

  function clearSearch() {
    setSearch("");
    setCurrentPage(1);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToFilters() {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleUseTemplate(templateName) {
    navigate("/customer/register", {
      state: { template: templateName },
    });
  }

  function pageNumbers() {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── Featured Templates Banner ── */}
      <section className="bg-gradient-to-br from-[#0A7AFF] via-[#0062D6] to-[#003F8A] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3 font-heading">
            WordPress Templates
          </h1>
          <p className="text-blue-100 text-center mb-10 max-w-2xl mx-auto">
            Launch faster with professionally crafted templates. Each one is
            fully customizable and optimized for performance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTemplates.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                {/* Preview area */}
                <div
                  className="h-64 relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${t.color}44, ${t.color}AA)`,
                  }}
                >
                  <span className="text-white/30 text-6xl font-bold font-heading select-none">
                    {t.name.charAt(0)}
                  </span>
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                    {t.category}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-lg font-bold mb-2">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-3 text-white/80 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {t.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {formatDownloads(t.downloads)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(t.name)}
                      className="bg-white text-[#0A7AFF] font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Filters ── */}
      <section
        ref={filtersRef}
        className="max-w-6xl mx-auto px-4 -mt-6 relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search templates by name, description, or tag..."
              className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-200 focus:border-[#0A7AFF] focus:ring-2 focus:ring-[#0A7AFF]/20 outline-none transition-all text-[#1A1A2E] placeholder-[#9CA3AF]"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category pills + Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-[#0A7AFF] text-white shadow-md"
                      : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#9CA3AF]" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] outline-none focus:border-[#0A7AFF] focus:ring-2 focus:ring-[#0A7AFF]/20 bg-white cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="downloads">Most Downloads</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results Count ── */}
      <section className="max-w-6xl mx-auto px-4 mb-4">
        <p className="text-sm text-[#6B7280]">
          Showing{" "}
          <span className="font-semibold text-[#1A1A2E]">
            {filtered.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#1A1A2E]">
            {templates.length}
          </span>{" "}
          templates
        </p>
      </section>

      {/* ── Template Grid ── */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col"
              >
                {/* Card preview area */}
                <div
                  className="h-48 relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${t.color}33, ${t.color}99)`,
                  }}
                >
                  <span className="text-white/25 text-5xl font-bold font-heading select-none group-hover:scale-110 transition-transform duration-300">
                    {t.name}
                  </span>
                  {t.popular && (
                    <span className="absolute top-3 right-3 bg-[#FFB800] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Popular
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-[#1A1A2E] font-heading">
                      {t.name}
                    </h3>
                    <span className="text-xs font-medium bg-[#EBF4FF] text-[#0A7AFF] px-2.5 py-0.5 rounded-full">
                      {t.category}
                    </span>
                  </div>

                  <p className="text-sm text-[#6B7280] mb-3 leading-relaxed">
                    {t.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-[#6B7280] rounded-full px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm text-[#6B7280] mb-4 mt-auto">
                    <span className="flex items-center gap-1.5">
                      <StarRating rating={t.rating} />
                      <span className="font-medium text-[#1A1A2E]">
                        {t.rating}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {formatDownloads(t.downloads)}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      v{t.version}
                    </span>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={scrollToTop}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-gray-200 text-[#6B7280] hover:border-[#0A7AFF] hover:text-[#0A7AFF] transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(t.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#0A7AFF] text-white hover:bg-[#0062D6] transition-all text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#EBF4FF] rounded-full flex items-center justify-center mb-5">
              <Search className="w-8 h-8 text-[#0A7AFF]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2 font-heading">
              No templates found
            </h3>
            <p className="text-[#6B7280] text-center max-w-md mb-6">
              We couldn&apos;t find any templates matching your search. Try
              adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setCurrentPage(1);
              }}
              className="px-6 py-2.5 bg-[#0A7AFF] text-white rounded-lg hover:bg-[#0062D6] transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > perPage && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] hover:border-[#0A7AFF] hover:text-[#0A7AFF] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-[#6B7280]"
            >
              <ArrowLeft className="w-4 h-4" />
              Prev
            </button>

            {pageNumbers().map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  safePage === num
                    ? "bg-[#0A7AFF] text-white shadow-md"
                    : "border border-gray-200 text-[#6B7280] hover:border-[#0A7AFF] hover:text-[#0A7AFF]"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={safePage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#6B7280] hover:border-[#0A7AFF] hover:text-[#0A7AFF] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-[#6B7280]"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-[#0A7AFF] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            Pick a template, customize it to your brand, and launch your
            WordPress site in minutes — no coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToFilters}
              className="px-8 py-3.5 bg-white text-[#0A7AFF] font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg text-sm"
            >
              Browse All Templates
            </button>
            <Link
              to="/contact"
              className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Request a Custom Template
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
