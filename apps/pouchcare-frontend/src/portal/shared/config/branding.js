/**
 * Portal branding configuration.
 *
 * Provides titles, subtitles, taglines, and navigation labels for each
 * portal variant so layout components can stay portal-agnostic.
 */
export const portalBranding = {
  admin: {
    title: "PouchCare Admin",
    subtitle: "Platform operations",
    tagline: "Multi-company operations workspace",
    backLabel: "View Site",
    backTo: "/",
  },
  customer: {
    title: "PouchCare",
    subtitle: "Account dashboard",
    tagline: "Customer workspace",
    backLabel: "View Site",
    backTo: "/",
  },
};
