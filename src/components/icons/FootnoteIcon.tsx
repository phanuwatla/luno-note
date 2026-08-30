import React from "react";

export function FootnoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 18h16" />
      <path d="M4 14h9" />
      <path d="M4 10h7" />
      <path d="M4 6h7" />
      <path d="m18 4 2-1v6" />
    </svg>
  );
}
