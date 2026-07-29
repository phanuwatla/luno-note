import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ToggleNodeViewProps {
  node: any;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

export default function ToggleNodeView({ node, updateAttributes }: ToggleNodeViewProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(node.attrs.open ?? false);
  const [title, setTitle] = useState<string>(node.attrs.title ?? "");
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  useEffect(() => {
    setIsOpen(node.attrs.open ?? false);
  }, [node.attrs.open]);

  useEffect(() => {
    if (!isTitleEditing) {
      setTitle(node.attrs.title ?? "");
    }
  }, [node.attrs.title, isTitleEditing]);

  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const currentOpen = (event.target as HTMLDetailsElement).open;
    setIsOpen(currentOpen);
    updateAttributes({ open: currentOpen });
  };

  const getEventTargetElement = (target: EventTarget | null): HTMLElement | null => {
    if (!target) return null;
    if (target instanceof HTMLElement) return target;
    if (target instanceof Text) return target.parentElement;
    return null;
  };

  const handleIconClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    updateAttributes({ open: nextOpen });
  };

  const handleTitleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    setTitle(event.currentTarget.textContent ?? "");
  };

  const commitTitle = () => {
    const nextTitle = title.trim();
    setTitle(nextTitle);
    updateAttributes({ title: nextTitle });
    setIsTitleEditing(false);
  };

  const handleTitleFocus = () => {
    setIsTitleEditing(true);
  };

  const handleTitleBlur = () => {
    commitTitle();
  };

  return (
    <NodeViewWrapper as="details" className="group" open={isOpen} onToggle={handleToggle}>
      <summary
        style={{ listStyleType: "none" }}
        className="flex items-center gap-1.5 pl-2 pr-0 py-1 font-normal text-foreground transition-colors duration-150"
      >
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={handleIconClick}
          data-state={isOpen ? "checked" : "unchecked"}
          className="-ml-0.5 h-4 w-4 shrink-0 rounded-sm bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center transition-transform duration-150 text-primary"
          aria-label={isOpen ? t("editor.toggleCollapse") : t("editor.toggleExpand")}
        >
          <span className={`${isOpen ? "rotate-90" : ""} inline-block h-5 w-5 text-current`}>
            <svg viewBox="0 0 10 10" className="h-full w-full fill-current" aria-hidden>
              <path d="M3 2.5 L7 5 L3 7.5 Z" />
            </svg>
          </span>
        </button>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={handleTitleFocus}
          onBlur={handleTitleBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTitle();
              (event.target as HTMLInputElement).blur();
            }
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => event.stopPropagation()}
          placeholder={title ? undefined : t("editor.startWriting")}
          className="flex-1 min-w-0 bg-transparent border-none p-0 text-left text-inherit outline-none focus:outline-none placeholder:text-muted-foreground/40 font-normal"
          spellCheck={false}
          autoComplete="off"
        />
      </summary>
      <div className="py-2 pl-7">
        <NodeViewContent as="div" className="min-h-[2rem]" />
      </div>
    </NodeViewWrapper>
  );
}
