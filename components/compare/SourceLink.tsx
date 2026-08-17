export function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block min-h-11 py-1 text-xs font-medium text-pine underline decoration-pine/30 underline-offset-4 hover:decoration-pine sm:min-h-0 sm:py-0"
    >
      {label}
    </a>
  );
}
