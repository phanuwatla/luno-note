export function DeleteColumnIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="8" y1="7" x2="8" y2="17" strokeWidth="2.5" />
    </svg>
  );
}
