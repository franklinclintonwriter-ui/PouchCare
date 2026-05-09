import { useState } from "react";
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  Shield,
  ArrowRight,
  Users,
  Star,
} from "lucide-react";
import { plans, faqs } from "../data/pricing";

/* ── Design Tokens ── */
const tokens = {
  primary: "#0A7AFF",
  primaryDark: "#0062D6",
  primaryLight: "#EBF4FF",
  accentCyan: "#00C6FF",
  accentGold: "#FFB800",
  accentOrange: "#FF8C00",
  surfaceLight: "#F5F7FA",
  heading: "#1A1A2E",
  body: "#6B7280",
  muted: "#9CA3AF",
  fontHeading: "'Inter', sans-serif",
  fontBody: "'Inter', sans-serif",
  shadowCard: "0 2px 8px rgba(0,0,0,0.06)",
  shadowCardHover: "0 8px 24px rgba(0,0,0,0.12)",
  roundedCard: "16px",
  roundedBtn: "12px",
};

/* ── Avatar colours for trust bar ── */
const avatarColors = ["#0A7AFF", "#00C6FF", "#FFB800", "#FF8C00", "#6366F1"];

/* ── Comparison Features ── */
const comparisonFeatures = [
  { name: "Templates", starter: "5", pro: "50+", agency: "Unlimited" },
  { name: "Websites", starter: "1", pro: "10", agency: "Unlimited" },
  { name: "Builder Access", starter: "Basic", pro: "Advanced", agency: "Full Suite" },
  { name: "Design System", starter: false, pro: true, agency: true },
  { name: "Premium Templates", starter: false, pro: true, agency: true },
  { name: "Priority Support", starter: false, pro: true, agency: true },
  { name: "White Label", starter: false, pro: false, agency: true },
  { name: "Custom Branding", starter: false, pro: false, agency: true },
  { name: "Team Members", starter: "1", pro: "5", agency: "Unlimited" },
  { name: "API Access", starter: false, pro: true, agency: true },
  { name: "Analytics", starter: "Basic", pro: "Advanced", agency: "Advanced" },
  { name: "Export Options", starter: "HTML", pro: "HTML, CSS, JSON", agency: "All Formats" },
  { name: "Version History", starter: "7 days", pro: "30 days", agency: "Unlimited" },
  { name: "Dedicated Account Manager", starter: false, pro: false, agency: true },
  { name: "SLA Guarantee", starter: false, pro: false, agency: true },
];

/* ── FAQ Item Sub-component ── */
function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: tokens.heading,
            fontFamily: tokens.fontHeading,
          }}
        >
          {faq.q}
        </span>
        <ChevronDown
          className="w-5 h-5 flex-shrink-0"
          style={{
            color: tokens.muted,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? "200px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <p
          style={{
            paddingBottom: "20px",
            fontSize: "15px",
            lineHeight: 1.7,
            color: tokens.body,
            fontFamily: tokens.fontBody,
          }}
        >
          {faq.a}
        </p>
      </div>
    </div>
  );
}

/* ── Pricing Card Sub-component ── */
function PricingCard({ plan, isAnnual }) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const period = isAnnual ? "/year" : "/mo";

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: tokens.roundedCard,
        padding: "32px",
        boxShadow: tokens.shadowCard,
        border: plan.featured
          ? `2px solid ${tokens.primary}`
          : "1px solid #E5E7EB",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadowCardHover;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadowCard;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: "-14px",
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accentCyan})`,
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            padding: "4px 16px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
          }}
        >
          {plan.badge}
        </div>
      )}

      <h3
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: tokens.heading,
          fontFamily: tokens.fontHeading,
          marginBottom: "4px",
        }}
      >
        {plan.name}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: tokens.body,
          marginBottom: "24px",
          fontFamily: tokens.fontBody,
        }}
      >
        {plan.description}
      </p>

      <div style={{ marginBottom: "24px" }}>
        <span
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: tokens.heading,
            fontFamily: tokens.fontHeading,
            lineHeight: 1,
          }}
        >
          {price === 0 ? "Free" : `$${price}`}
        </span>
        {price !== 0 && (
          <span
            style={{
              fontSize: "16px",
              color: tokens.muted,
              fontFamily: tokens.fontBody,
            }}
          >
            {period}
          </span>
        )}
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          marginBottom: "32px",
          flex: 1,
        }}
      >
        {plan.features.map((feature, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
            }}
          >
            {feature.included ? (
              <Check
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#10B981" }}
              />
            ) : (
              <X
                className="w-4 h-4 flex-shrink-0"
                style={{ color: tokens.muted }}
              />
            )}
            <span
              style={{
                fontSize: "14px",
                color: feature.included ? tokens.heading : tokens.muted,
                fontFamily: tokens.fontBody,
              }}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        style={{
          width: "100%",
          padding: "14px 24px",
          borderRadius: tokens.roundedBtn,
          border: plan.featured ? "none" : `1px solid ${tokens.primary}`,
          background: plan.featured ? tokens.primary : "#fff",
          color: plan.featured ? "#fff" : tokens.primary,
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: tokens.fontBody,
          transition: "background 0.2s ease, transform 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          if (plan.featured) {
            e.currentTarget.style.background = tokens.primaryDark;
          } else {
            e.currentTarget.style.background = tokens.primaryLight;
          }
        }}
        onMouseLeave={(e) => {
          if (plan.featured) {
            e.currentTarget.style.background = tokens.primary;
          } else {
            e.currentTarget.style.background = "#fff";
          }
        }}
      >
        {plan.cta}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Main Pricing Page ── */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ fontFamily: tokens.fontBody }}>
      {/* ─── A. Header ─── */}
      <section
        style={{
          background: tokens.surfaceLight,
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            color: tokens.heading,
            fontFamily: tokens.fontHeading,
            marginBottom: "16px",
          }}
        >
          Simple, Transparent Pricing
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: tokens.body,
            maxWidth: "600px",
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          Choose the perfect plan for your needs. No hidden fees, no surprises.
          Start free and scale as you grow.
        </p>

        {/* Trust line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {avatarColors.map((color, i) => (
              <div
                key={i}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid #fff",
                  marginLeft: i === 0 ? 0 : "-10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users className="w-4 h-4" style={{ color: "#fff" }} />
              </div>
            ))}
          </div>
          <span
            style={{
              fontSize: "14px",
              color: tokens.body,
              fontWeight: 500,
            }}
          >
            Trusted by 10,000+ agencies
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4"
                style={{ color: tokens.accentGold, fill: tokens.accentGold }}
              />
            ))}
            <span
              style={{
                fontSize: "14px",
                color: tokens.body,
                fontWeight: 500,
                marginLeft: "4px",
              }}
            >
              4.9/5 from 2,000+ reviews
            </span>
          </div>
        </div>
      </section>

      {/* ─── B. Billing Toggle ─── */}
      <section style={{ padding: "48px 24px 0", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: tokens.surfaceLight,
            borderRadius: "999px",
            padding: "4px",
          }}
        >
          <button
            onClick={() => setIsAnnual(false)}
            style={{
              padding: "10px 24px",
              borderRadius: "999px",
              border: "none",
              background: !isAnnual ? tokens.primary : "transparent",
              color: !isAnnual ? "#fff" : tokens.body,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: tokens.fontBody,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            style={{
              padding: "10px 24px",
              borderRadius: "999px",
              border: "none",
              background: isAnnual ? tokens.primary : "transparent",
              color: isAnnual ? "#fff" : tokens.body,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: tokens.fontBody,
            }}
          >
            Annual
          </button>
          <span
            style={{
              background: `linear-gradient(135deg, ${tokens.accentGold}, ${tokens.accentOrange})`,
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            Save 20%
          </span>
        </div>
      </section>

      {/* ─── C. Pricing Cards ─── */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>
      </section>

      {/* ─── D. Feature Comparison Table ─── */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: tokens.heading,
            fontFamily: tokens.fontHeading,
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          Feature Comparison
        </h2>

        {/* Desktop table */}
        <div
          className="hidden md:block"
          style={{
            background: "#fff",
            borderRadius: tokens.roundedCard,
            boxShadow: tokens.shadowCard,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              fontFamily: tokens.fontBody,
            }}
          >
            <thead>
              <tr
                style={{
                  background: tokens.surfaceLight,
                  borderBottom: "2px solid #E5E7EB",
                }}
              >
                <th
                  style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: tokens.heading,
                  }}
                >
                  Feature
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: tokens.heading,
                  }}
                >
                  Starter
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: tokens.primary,
                  }}
                >
                  Pro
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: tokens.heading,
                  }}
                >
                  Agency
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feat, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#fff" : tokens.surfaceLight,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <td
                    style={{
                      padding: "14px 20px",
                      color: tokens.heading,
                      fontWeight: 500,
                    }}
                  >
                    {feat.name}
                  </td>
                  {["starter", "pro", "agency"].map((tier) => (
                    <td
                      key={tier}
                      style={{
                        padding: "14px 20px",
                        textAlign: "center",
                        color:
                          feat[tier] === true
                            ? "#10B981"
                            : feat[tier] === false
                            ? tokens.muted
                            : tokens.heading,
                      }}
                    >
                      {feat[tier] === true ? (
                        <Check
                          className="w-4 h-4 inline-block"
                          style={{ color: "#10B981" }}
                        />
                      ) : feat[tier] === false ? (
                        <X
                          className="w-4 h-4 inline-block"
                          style={{ color: tokens.muted }}
                        />
                      ) : (
                        feat[tier]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {comparisonFeatures.map((feat, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: tokens.shadowCard,
              }}
            >
              <h4
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: tokens.heading,
                  marginBottom: "12px",
                }}
              >
                {feat.name}
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                  textAlign: "center",
                  fontSize: "13px",
                }}
              >
                {["starter", "pro", "agency"].map((tier) => (
                  <div key={tier}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: tokens.muted,
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {tier}
                    </div>
                    <div style={{ color: feat[tier] === false ? tokens.muted : tokens.heading }}>
                      {feat[tier] === true ? (
                        <Check className="w-4 h-4 inline-block" style={{ color: "#10B981" }} />
                      ) : feat[tier] === false ? (
                        <X className="w-4 h-4 inline-block" style={{ color: tokens.muted }} />
                      ) : (
                        feat[tier]
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── E. FAQ Accordion ─── */}
      <section
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: tokens.heading,
            fontFamily: tokens.fontHeading,
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          Frequently Asked Questions
        </h2>
        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ─── F. Money-Back Guarantee ─── */}
      <section style={{ padding: "48px 24px" }}>
        <div
          style={{
            background: tokens.surfaceLight,
            padding: "48px 32px",
            borderRadius: tokens.roundedCard,
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Shield className="w-7 h-7" style={{ color: "#10B981" }} />
          </div>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: tokens.heading,
              fontFamily: tokens.fontHeading,
              marginBottom: "12px",
            }}
          >
            30-Day Money-Back Guarantee
          </h3>
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: tokens.body,
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Try any paid plan risk-free for 30 days. If you are not completely
            satisfied, contact us for a full refund. No questions asked, no
            hassle.
          </p>
        </div>
      </section>

      {/* ─── G. Enterprise Section ─── */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left */}
          <div>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: tokens.heading,
                fontFamily: tokens.fontHeading,
                marginBottom: "16px",
              }}
            >
              Need a Custom Solution?
            </h2>
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.7,
                color: tokens.body,
                marginBottom: "24px",
              }}
            >
              We work with enterprise teams to create tailored solutions that
              fit your exact workflow, security, and scaling needs.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 32px 0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {[
                "Custom integrations & API access",
                "Dedicated account manager",
                "Custom SLA & uptime guarantee",
                "On-premise deployment options",
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "15px",
                    color: tokens.heading,
                  }}
                >
                  <Check
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#10B981" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                style={{
                  padding: "14px 28px",
                  borderRadius: tokens.roundedBtn,
                  border: "none",
                  background: tokens.primary,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: tokens.fontBody,
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = tokens.primaryDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = tokens.primary)
                }
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                style={{
                  padding: "14px 28px",
                  borderRadius: tokens.roundedBtn,
                  border: `1px solid ${tokens.primary}`,
                  background: "#fff",
                  color: tokens.primary,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: tokens.fontBody,
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = tokens.primaryLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                Schedule a Demo
              </button>
            </div>
          </div>

          {/* Right — placeholder illustration */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {[
              { icon: <Users className="w-8 h-8" />, color: tokens.primary },
              { icon: <Shield className="w-8 h-8" />, color: tokens.accentCyan },
              { icon: <Star className="w-8 h-8" />, color: tokens.accentGold },
              { icon: <Sparkles className="w-8 h-8" />, color: tokens.accentOrange },
              { icon: <Check className="w-8 h-8" />, color: "#10B981" },
              { icon: <ArrowRight className="w-8 h-8" />, color: "#6366F1" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: tokens.surfaceLight,
                  borderRadius: tokens.roundedCard,
                  padding: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: "1",
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── H. CTA Banner ─── */}
      <section
        style={{
          background: tokens.primary,
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <Sparkles
          className="w-10 h-10"
          style={{ color: tokens.accentGold, margin: "0 auto 16px" }}
        />
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800,
            color: "#fff",
            fontFamily: tokens.fontHeading,
            marginBottom: "16px",
          }}
        >
          Start Building Today
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.85)",
            maxWidth: "500px",
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          Join thousands of agencies building beautiful WordPress sites with
          PouchCare. Get started in minutes.
        </p>
        <button
          style={{
            padding: "14px 32px",
            borderRadius: tokens.roundedBtn,
            border: "none",
            background: "#fff",
            color: tokens.primary,
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: tokens.fontBody,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
