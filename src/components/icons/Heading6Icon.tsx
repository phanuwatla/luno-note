import React from "react";
export function Heading6Icon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 10c-2 0-3.5 2-3.5 5.5" />
      <circle cx="19" cy="15.5" r="2.5" />
    </svg>
  );
}
