import React, { useRef } from "react";

interface SplitResizerProps {
  onResize: (delta: number) => void;
}

export default function SplitResizer({ onResize }: SplitResizerProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onResize(delta);
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      style={{ width: 4, cursor: "col-resize", background: "transparent", zIndex: 10 }}
      className="group flex-shrink-0 flex-grow-0 hover:bg-border transition-colors duration-100"
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      <div className="mx-auto h-full w-px rounded bg-border group-hover:bg-primary/40 transition-colors duration-100" />
    </div>
  );
}
