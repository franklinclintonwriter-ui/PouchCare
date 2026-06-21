import { KeyRound, ShieldCheck, Workflow } from "lucide-react";

const endpointGroups = [
  {
    name: "Auth",
    endpoints: ["POST /v1/auth/login", "POST /v1/auth/refresh", "POST /v1/auth/logout"],
  },
  {
    name: "Templates",
    endpoints: ["GET /v1/templates", "GET /v1/templates/:id", "POST /v1/templates/import"],
  },
  {
    name: "Licenses",
    endpoints: ["GET /v1/licenses", "POST /v1/licenses/activate", "POST /v1/licenses/deactivate"],
  },
  {
    name: "Sites",
    endpoints: ["GET /v1/sites", "POST /v1/sites", "PATCH /v1/sites/:id"],
  },
];

const codeExample = `curl -X GET https://api.pouchcare.com/v1/templates \\
  -H "Authorization: Bearer <token>" \\
  -H "Accept: application/json"`;

export default function ApiReference() {
  return (
    <div className="bg-white">
      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fadeUp">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Developer Docs
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold text-heading sm:text-5xl">
              PouchCare API
            </h1>
            <p className="mt-6 text-lg leading-8 text-body">
              Use the PouchCare API to connect authentication, templates,
              licenses, and WordPress site workflows into your own systems.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-container mx-auto grid gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <article className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-heading">
              Authentication
            </h2>
            <p className="mt-3 text-sm leading-7 text-body">
              Authenticate requests using bearer tokens obtained from the auth
              endpoints. Tokens should be stored securely and refreshed before
              expiration in long-running integrations.
            </p>
          </article>

          <article className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-heading">
              Rate limits
            </h2>
            <p className="mt-3 text-sm leading-7 text-body">
              Standard plans support up to 120 requests per minute. Enterprise
              plans can request higher throughput for high-volume license and
              site management workflows.
            </p>
          </article>
        </div>

        <div className="rounded-card bg-slate-950 p-6 text-white shadow-card sm:p-8">
          <div className="flex items-center gap-3 text-primary">
            <Workflow className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Example request
            </span>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-card bg-black/30 p-4 text-sm leading-7 text-slate-100">
            <code>{codeExample}</code>
          </pre>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            All endpoints return JSON responses and standard HTTP status codes.
            Include an Authorization header on protected routes.
          </p>
        </div>
      </section>

      <section className="bg-surface-light">
        <div className="max-w-container mx-auto px-6 py-16 sm:py-20">
          <h2 className="font-heading text-3xl font-bold text-heading">
            Endpoints overview
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {endpointGroups.map((group) => (
              <article
                key={group.name}
                className="rounded-card bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
              >
                <h3 className="font-heading text-2xl font-semibold text-heading">
                  {group.name}
                </h3>
                <ul className="mt-5 space-y-3">
                  {group.endpoints.map((endpoint) => (
                    <li
                      key={endpoint}
                      className="rounded-btn bg-surface-light px-4 py-3 font-mono text-sm text-heading"
                    >
                      {endpoint}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
