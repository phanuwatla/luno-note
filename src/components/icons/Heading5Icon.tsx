import React from "react";
export function Heading5Icon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 10h-4v4c.8-.6 1.8-1 3-1 1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.5 0-2.5-.6-3-1.5" />
    </svg>
  );
}
