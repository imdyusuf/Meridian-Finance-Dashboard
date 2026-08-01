import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-brand shadow-card">
        <FileQuestion size={26} aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The page you're looking for doesn't exist or may have moved. Check the address or head back
        to your dashboard.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
