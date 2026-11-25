import { NodeViewContent, NodeViewWrapper, type Editor as TiptapEditor } from "@tiptap/react";
import { Selection } from "@tiptap/pm/state";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  blurFocusedToggleTitle,
  clearFocusedToggleTitle,
  clearPendingToggleTitleFocus,
  isPendingToggleTitleFocus,
  isToggleBodyEmptySingleParagraph,
  registerFocusedToggleTitle,
  unwrapToggleAtPos,
} from "@/components/editor/extensions/editorExtensions";

interface ToggleNodeViewProps {
  editor?: TiptapEditor;
  getPos?: () => number | undefined;
  node: {
    attrs: { open?: boolean; title?: string };
    nodeSize?: number;
    textContent?: string;
    childCount?: number;
    content?: unknown;
    firstChild?: { type?: { name?: string }; content?: { size?: number } } | null;
  };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  selected?: boolean;
}

function isToolbarOrMenuTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      '[data-editor-toolbar="true"], [role="menu"], [data-radix-popper-content-wrapper]'
    )
  );
}

function ToggleNodeViewComponent({ editor, getPos, node, updateAttributes }: ToggleNodeViewProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const isUnwrappingRef = useRef(false);
  const [isOpen, setIsOpen] = useState<boolean>(node.attrs.open ?? false);
  const [title, setTitle] = useState<string>(node.attrs.title ?? "");
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  useEffect(() => {
    const inputEl = inputRef.current;
    return () => {
      clearFocusedToggleTitle(editor, inputEl);
    };
  }, [editor]);

  useEffect(() => {
    if (!isPendingToggleTitleFocus()) return;

    const focusInput = () => {
      const input = inputRef.current;
      if (!input) return;
      const active = document.activeElement;
      if (active === input) return;
      if (
        active &&
        active !== document.body &&
        !active.classList.contains("ProseMirror") &&
        !active.closest?.(".ProseMirror") &&
        !active.closest?.("[role='menu']") &&
        active.tagName !== "BUTTON"
      ) {
        return;
      }
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    };

    const rafId = requestAnimationFrame(focusInput);
    const t1 = window.setTimeout(focusInput, 50);
    const t2 = window.setTimeout(() => {
      focusInput();
      clearPendingToggleTitleFocus();
    }, 180);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    setIsOpen(node.attrs.open ?? false);
  }, [node.attrs.open]);

  useEffect(() => {
    if (!isTitleEditing) {
      setTitle(node.attrs.title ?? "");
    }
  }, [node.attrs.title, isTitleEditing]);

  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (event.target !== event.currentTarget) return;
    const currentOpen = (event.target as HTMLDetailsElement).open;
    if (currentOpen === isOpen) return;
    setIsOpen(currentOpen);
    updateAttributes({ open: currentOpen });
  };

  const handleIconClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    updateAttributes({ open: nextOpen });
  };

  const commitTitle = () => {
    setIsTitleEditing(false);
    if (isUnwrappingRef.current) return;
    const nextTitle = title.trim();
    if (nextTitle !== title) {
      setTitle(nextTitle);
    }
    if (editor && !editor.isDestroyed && typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos !== "number" || pos < 0 || pos >= editor.state.doc.content.size) return;
      const currentNode = editor.state.doc.nodeAt(pos);
      if (!currentNode || currentNode.type.name !== "toggle") return;
      if ((currentNode.attrs?.title ?? "") === nextTitle) return;
    }
    updateAttributes({ title: nextTitle });
  };

  const focusToggleBody = () => {
    if (!editor || editor.isDestroyed || typeof getPos !== "function") return;
    const pos = getPos();
    if (typeof pos !== "number") return;
    requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      const doc = editor.state.doc;
      const currentNode = pos >= 0 && pos < doc.content.size ? doc.nodeAt(pos) : null;
      if (!currentNode || currentNode.type.name !== "toggle") return;
      const innerStart = Math.min(pos + 1, doc.content.size);
      const selection = Selection.near(doc.resolve(innerStart), 1);
      editor.view.dispatch(editor.state.tr.setSelection(selection).scrollIntoView());
      editor.view.focus();
    });
  };

  const focusAfterToggle = () => {
    if (!editor || editor.isDestroyed || typeof getPos !== "function") return;
    const pos = getPos();
    if (typeof pos !== "number") return;
    const doc = editor.state.doc;
    const currentNode = pos >= 0 && pos < doc.content.size ? doc.nodeAt(pos) : null;
    const size = currentNode?.nodeSize ?? node.nodeSize;
    if (typeof size !== "number") return;
    const afterPos = pos + size;
    const nextNode = afterPos < doc.content.size ? doc.nodeAt(afterPos) : null;
    if (nextNode && nextNode.isTextblock) {
      editor.chain().focus(afterPos + 1).run();
    } else {
      editor
        .chain()
        .insertContentAt(afterPos, { type: "paragraph" })
        .focus(afterPos + 1)
        .run();
    }
  };

  const handleTitleFocus = () => {
    isUnwrappingRef.current = false;
    setIsTitleEditing(true);
    registerFocusedToggleTitle(editor, getPos, inputRef.current);
  };

  const handleTitleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    commitTitle();
    if (isUnwrappingRef.current) {
      clearFocusedToggleTitle(editor, inputRef.current);
      return;
    }
    const keepPendingForToolbar = isToolbarOrMenuTarget(event.relatedTarget);
    blurFocusedToggleTitle(editor, inputRef.current, keepPendingForToolbar);
  };

  return (
    <NodeViewWrapper as="details" className="group my-0 py-0" open={isOpen} onToggle={handleToggle}>
      <summary
        contentEditable={false}
        style={{ listStyleType: "none" }}
        onClick={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        className="relative flex items-center pl-0 pr-0 py-0 min-h-[28px] max-w-full font-normal text-foreground transition-colors duration-150 cursor-text"
      >
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={handleIconClick}
          data-state={isOpen ? "checked" : "unchecked"}
          data-folded={isOpen ? "false" : "true"}
          className="luno-toggle-fold-btn ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isOpen ? t("editor.toggleCollapse") : t("editor.toggleExpand")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`luno-heading-fold-icon ${isOpen ? "is-open" : "is-folded"}`}
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div className="inline-grid items-center max-w-full min-w-0 overflow-hidden">
          <span
            aria-hidden="true"
            className="col-start-1 row-start-1 invisible whitespace-pre overflow-hidden px-0 font-normal leading-7 pointer-events-none"
          >
            {title || t("editor.toggle")}
          </span>
          <input
            ref={inputRef}
            type="text"
            size={1}
            value={title}
            onChange={(event) => {
              const nextVal = event.target.value;
              setTitle(nextVal);
              updateAttributes({ title: nextVal });
            }}
            onFocus={handleTitleFocus}
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;

              if (
                (event.ctrlKey || event.metaKey) &&
                event.shiftKey &&
                (event.key.toLowerCase() === "t" || event.code === "KeyT")
              ) {
                if (editor && typeof getPos === "function") {
                  const pos = getPos();
                  if (typeof pos === "number") {
                    event.preventDefault();
                    event.stopPropagation();
                    isUnwrappingRef.current = true;
                    unwrapToggleAtPos(editor, pos, {
                      liveTitle: title,
                      cursorPlacement: "titleEnd",
                    });
                  }
                }
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                commitTitle();
                if (isOpen) {
                  focusToggleBody();
                } else {
                  focusAfterToggle();
                }
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (isOpen) {
                  focusToggleBody();
                } else {
                  focusAfterToggle();
                }
              } else if (event.key === "Backspace" && editor && typeof getPos === "function") {
                const inputEl = event.currentTarget;
                const atStart = inputEl.selectionStart === 0 && inputEl.selectionEnd === 0;
                if (atStart) {
                  const pos = getPos();
                  if (typeof pos === "number") {
                    event.preventDefault();
                    isUnwrappingRef.current = true;
                    unwrapToggleAtPos(editor, pos, {
                      liveTitle: title,
                      cursorPlacement: "start",
                    });
                  }
                }
              }
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => event.stopPropagation()}
            placeholder={title ? undefined : t("editor.toggle")}
            className="col-start-1 row-start-1 w-full min-w-0 bg-transparent border-none p-0 text-left text-inherit outline-none focus:outline-none placeholder:text-muted-foreground/40 font-normal h-7 leading-7"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {!isOpen && (
          <span
            role="button"
            tabIndex={-1}
            onPointerDown={(event) => event.preventDefault()}
            onClick={handleIconClick}
            className="luno-heading-folded-badge shrink-0"
            aria-label={t("editor.toggleExpand")}
          >
            ···
          </span>
        )}
      </summary>
      <div className={`relative pl-0 py-0 ${isOpen ? "luno-tree-reveal" : ""}`}>
        {isOpen && isToggleBodyEmptySingleParagraph(node) && (
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-0 top-0 text-muted-foreground/40 leading-normal"
          >
            {t("editor.startWriting")}
          </span>
        )}
        <NodeViewContent as="div" className="min-h-[1.75rem]" />
      </div>
    </NodeViewWrapper>
  );
}

export const ToggleNodeView = React.memo(ToggleNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.open === nextProps.node.attrs.open &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.node.content === nextProps.node.content &&
    prevProps.node.nodeSize === nextProps.node.nodeSize &&
    (prevProps.node.textContent ?? "") === (nextProps.node.textContent ?? "") &&
    prevProps.node.childCount === nextProps.node.childCount &&
    prevProps.selected === nextProps.selected
  );
});

export default ToggleNodeView;
