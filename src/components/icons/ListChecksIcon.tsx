import * as React from "react";

export const ListChecksIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="lucide lucide-list-checks"
      {...props}
    >
      <path d="M3 6h3m0 0l2 2m-2-2l-2 2M3 12h3m0 0l2 2m-2-2l-2 2M3 18h3m0 0l2 2m-2-2l-2 2M9 6h12M9 12h12M9 18h12" />
    </svg>
  )
);
ListChecksIcon.displayName = "ListChecksIcon";
