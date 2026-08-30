import React, { useState } from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

const LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
];

const CodeBlockNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  const [copied, setCopied] = useState(false);
  const { settings } = useAppSettings();

  const showLineNumbers = settings.showCodeLineNumbers;
  const codeText = node.textContent || "";
  const linesCount = Math.max(1, codeText.split("\n").length);

  const rawLang = node.attrs.language || "";
  const foundLang = LANGUAGES.find(
    (l) =>
      l.value === rawLang.toLowerCase() ||
      (l.value === "plaintext" && (rawLang.toLowerCase() === "text" || !rawLang))
  );
  const displayLabel = foundLang
    ? foundLang.label
    : rawLang
    ? rawLang.charAt(0).toUpperCase() + rawLang.slice(1)
    : "Plain Text";

  const handleCopy = () => {
    const textContent = node.textContent || "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Code block content copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <NodeViewWrapper className="code-block-wrapper my-5 md:my-6 rounded-xl border border-border/50 bg-muted/70 overflow-hidden shadow-2xs transition-all">
      {/* Seamless Header Bar with System Select & Tooltip UI */}
      <div className="flex items-center justify-between px-3.5 pt-2 pb-1 text-[11px] select-none border-b border-border/30">
        <Select
          value={rawLang ? rawLang.toLowerCase() : "plaintext"}
          onValueChange={(val) => updateAttributes({ language: val })}
        >
          <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 gap-1 font-medium text-muted-foreground/80 hover:text-foreground outline-none shadow-none focus:ring-0 focus:ring-offset-0 text-[11px]">
            <span className="font-semibold text-muted-foreground/90">{displayLabel}</span>
          </SelectTrigger>
          <SelectContent align="start" className="w-36 max-h-56 p-1 text-xs z-50">
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value} className="text-xs py-1.5 cursor-pointer">
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/40 transition-all cursor-pointer outline-none"
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] px-2 py-1">
              {copied ? "Copied!" : "Copy code"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Code Content Area with Line Numbers */}
      <div className="flex px-3.5 py-2.5 overflow-x-auto text-[13.5px] text-foreground items-start">
        {showLineNumbers && (
          <div
            aria-hidden="true"
            className="flex flex-col select-none pr-3 text-right text-muted-foreground/40 border-r border-border/30 mr-3.5 shrink-0"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "13.5px",
              lineHeight: "22px",
            }}
          >
            {Array.from({ length: linesCount }, (_, i) => (
              <span
                key={i + 1}
                className="block select-none"
                style={{
                  height: "22px",
                  lineHeight: "22px",
                  margin: 0,
                  padding: 0,
                }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex-1 min-w-0"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "13.5px",
            lineHeight: "22px",
          }}
        >
          <NodeViewContent
            as={("pre" as any)}
            className="outline-none focus:outline-none bg-transparent p-0 m-0 border-0 block"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "22px",
              whiteSpace: "pre",
              margin: 0,
              padding: 0,
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const CodeBlockNodeView = React.memo(CodeBlockNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.language === nextProps.node.attrs.language &&
    prevProps.node.textContent === nextProps.node.textContent &&
    prevProps.selected === nextProps.selected
  );
});

export default CodeBlockNodeView;
