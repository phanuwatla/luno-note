import React from "react";

// Custom Editor Checkbox - Matches Editor TaskList Checkbox exactly (14px, 1.5px border, rounded-[3px], checkmark/minus)
export function EditorCheckbox({
  checked,
  onChange,
  className = "",
}: {
  checked: boolean | "indeterminate";
  onChange?: () => void;
  className?: string;
}) {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      className={`relative inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] transition-colors cursor-pointer select-none outline-none ${
        isChecked || isIndeterminate
          ? "bg-primary border border-primary text-primary-foreground"
          : "bg-transparent border-[1.5px] border-muted-foreground/50 hover:border-primary"
      } ${className}`}
    >
      {isChecked && (
        <svg
          className="w-2.5 h-2.5 text-white"
          viewBox="0 0 16 16"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      )}
      {isIndeterminate && (
        <svg
          className="w-2.5 h-2.5 text-white"
          viewBox="0 0 16 16"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="3.5" y1="8" x2="12.5" y2="8" />
        </svg>
      )}
    </button>
  );
}

export default EditorCheckbox;
