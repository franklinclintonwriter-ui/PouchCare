import { useState, useMemo } from "react";
import {
  Search,
  Menu,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { docsSidebar } from "../data/docs";

function renderContent(content) {
  const blocks = content.split("\n\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Heading h2
    if (block.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="font-heading text-2xl font-bold text-heading mt-8 mb-4"
        >
          {block.slice(3)}
        </h2>
      );
      continue;
    }

    // Heading h3
    if (block.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="font-heading text-xl font-semibold text-heading mt-6 mb-3"
        >
          {block.slice(4)}
        </h3>
      );
      continue;
    }

    const lines = block.split("\n");

    // Unordered list
    if (lines.every((l) => l.trimStart().startsWith("- "))) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 space-y-1 text-body mb-4">
          {lines.map((l, idx) => (
            <li key={idx}>{l.replace(/^\s*-\s*/, "")}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (lines.every((l) => /^\s*\d+\.\s/.test(l))) {
      elements.push(
        <ol
          key={key++}
          className="list-decimal pl-6 space-y-1 text-body mb-4"
        >
          {lines.map((l, idx) => (
            <li key={idx}>{l.replace(/^\s*\d+\.\s*/, "")}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Mixed block with headings inline — split per line
    if (lines.some((l) => l.startsWith("## ") || l.startsWith("### "))) {
      lines.forEach((l) => {
        const trimmed = l.trim();
        if (trimmed.startsWith("### ")) {
          elements.push(
            <h3
              key={key++}
              className="font-heading text-xl font-semibold text-heading mt-6 mb-3"
            >
              {trimmed.slice(4)}
            </h3>
          );
        } else if (trimmed.startsWith("## ")) {
          elements.push(
            <h2
              key={key++}
              className="font-heading text-2xl font-bold text-heading mt-8 mb-4"
            >
              {trimmed.slice(3)}
            </h2>
          );
        } else if (trimmed) {
          elements.push(
            <p key={key++} className="text-body leading-relaxed mb-4">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        }
      });
      continue;
    }

    // Paragraph
    elements.push(
      <p key={key++} className="text-body leading-relaxed mb-4">
        {renderInlineFormatting(block)}
      </p>
    );
  }

  return elements;
}

function renderInlineFormatting(text) {
  // Handle bold (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-heading">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function extractHeadings(content) {
  if (!content) return [];
  const lines = content.split("\n");
  const headings = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      headings.push({ level: 3, text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      headings.push({ level: 2, text: trimmed.slice(3) });
    }
  }
  return headings;
}

// Flatten all doc items into an ordered list for prev/next navigation
function getAllItems() {
  const items = [];
  for (const section of docsSidebar) {
    for (const item of section.items) {
      items.push(item);
    }
  }
  return items;
}

export default function Docs() {
  const [activeSlug, setActiveSlug] = useState("introduction");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({});

  const allItems = useMemo(() => getAllItems(), []);

  const activeItem = useMemo(
    () => allItems.find((item) => item.slug === activeSlug),
    [activeSlug, allItems]
  );

  const activeIndex = useMemo(
    () => allItems.findIndex((item) => item.slug === activeSlug),
    [activeSlug, allItems]
  );

  const prevItem = activeIndex > 0 ? allItems[activeIndex - 1] : null;
  const nextItem =
    activeIndex < allItems.length - 1 ? allItems[activeIndex + 1] : null;

  const headings = useMemo(
    () => extractHeadings(activeItem?.content || ""),
    [activeItem]
  );

  const filteredSidebar = useMemo(() => {
    if (!searchQuery.trim()) return docsSidebar;
    const q = searchQuery.toLowerCase();
    return docsSidebar
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  function toggleSection(title) {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  function handleNavClick(slug) {
    setActiveSlug(slug);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Find breadcrumb info
  const activeSectionTitle = useMemo(() => {
    for (const section of docsSidebar) {
      if (section.items.some((item) => item.slug === activeSlug)) {
        return section.title;
      }
    }
    return "";
  }, [activeSlug]);

  return (
    <div>
      {/* Page Header */}
      <div className="bg-surface-light py-12">
        <div className="max-w-container mx-auto px-6">
          <h1 className="font-heading text-3xl font-bold text-heading mb-6">
            Documentation
          </h1>

          {/* Search Bar */}
          <div className="flex items-center bg-white rounded-btn border border-gray-200 px-4 py-3 max-w-xl">
            <Search className="w-5 h-5 text-muted mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-body placeholder:text-muted text-sm"
            />
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-sm text-muted mt-4">
            <BookOpen className="w-4 h-4" />
            <span>Docs</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{activeSectionTitle}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-heading font-medium">
              {activeItem?.title}
            </span>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-btn shadow-card"
            aria-label="Toggle documentation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Sidebar */}
          <aside
            className={`
              w-64 shrink-0
              lg:block
              ${
                sidebarOpen
                  ? "fixed inset-0 z-40 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0"
                  : "hidden"
              }
            `}
          >
            {/* Mobile close */}
            {sidebarOpen && (
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <span className="font-heading font-bold text-heading">
                  Menu
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted hover:text-heading"
                >
                  &times;
                </button>
              </div>
            )}

            <nav>
              {filteredSidebar.map((section, sIdx) => {
                const isCollapsed = collapsedSections[section.title];
                return (
                  <div key={section.title}>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={`
                        flex items-center justify-between w-full
                        font-heading text-xs font-semibold uppercase tracking-wider text-muted
                        mb-2 ${sIdx === 0 ? "mt-0" : "mt-6"}
                      `}
                    >
                      <span>{section.title}</span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {!isCollapsed &&
                      section.items.map((item) => {
                        const isActive = item.slug === activeSlug;
                        return (
                          <button
                            key={item.slug}
                            onClick={() => handleNavClick(item.slug)}
                            className={`
                              block w-full text-left py-1.5 px-3 rounded-btn text-sm cursor-pointer
                              transition-colors duration-150
                              ${
                                isActive
                                  ? "bg-primary-light text-primary font-medium"
                                  : "text-body hover:text-heading hover:bg-gray-50"
                              }
                            `}
                          >
                            {item.title}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeItem ? (
              <>
                <div className="prose-custom">
                  {renderContent(activeItem.content)}
                </div>

                {/* Prev/Next Navigation */}
                <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
                  {prevItem ? (
                    <button
                      onClick={() => handleNavClick(prevItem.slug)}
                      className="group flex items-center gap-2 px-4 py-3 rounded-card border border-gray-200 hover:border-primary hover:shadow-card transition-all duration-200 text-left"
                    >
                      <ArrowLeft className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                      <div>
                        <span className="text-xs text-muted block">
                          Previous
                        </span>
                        <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">
                          {prevItem.title}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextItem ? (
                    <button
                      onClick={() => handleNavClick(nextItem.slug)}
                      className="group flex items-center gap-2 px-4 py-3 rounded-card border border-gray-200 hover:border-primary hover:shadow-card transition-all duration-200 text-right"
                    >
                      <div>
                        <span className="text-xs text-muted block">Next</span>
                        <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">
                          {nextItem.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-muted">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg">No documentation found.</p>
              </div>
            )}
          </div>

          {/* Table of Contents (right sidebar) */}
          {headings.length > 0 && (
            <div className="w-48 shrink-0 hidden xl:block">
              <div className="sticky top-24">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                  On this page
                </h4>
                <ul className="space-y-0.5">
                  {headings.map((heading, idx) => (
                    <li key={idx}>
                      <span
                        className={`
                          block text-sm py-1 text-body hover:text-primary cursor-pointer
                          transition-colors duration-150
                          ${heading.level === 3 ? "pl-3" : ""}
                        `}
                      >
                        {heading.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
