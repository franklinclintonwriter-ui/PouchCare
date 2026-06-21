import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface-light px-6 py-16">
      <div className="max-w-xl text-center">
        <p className="font-heading text-7xl font-bold text-primary sm:text-8xl">
          404
        </p>
        <h1 className="mt-6 font-heading text-3xl font-bold text-heading sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-body">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center rounded-btn bg-primary px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Go Home
          </Link>
          <Link
            to="/templates"
            className="inline-flex items-center rounded-btn border border-slate-300 px-5 py-3 text-sm font-semibold text-heading transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            Browse Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
