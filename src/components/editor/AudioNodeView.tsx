import React from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { AudioPlayer } from "./AudioPlayer";

const AudioNodeViewComponent: React.FC<NodeViewProps> = ({
  node,
  deleteNode,
  selected,
}) => {
  const { src, title } = node.attrs;

  return (
    <NodeViewWrapper className="audio-node-wrapper my-2.5">
      <AudioPlayer
        src={src}
        title={title}
        className={
          selected
            ? "border-primary/70 ring-1 ring-primary/50 bg-muted/60"
            : "border-border/70 bg-muted/40 hover:bg-muted/60"
        }
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
};

export const AudioNodeView = React.memo(AudioNodeViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.attrs.src === nextProps.node.attrs.src &&
    prevProps.node.attrs.title === nextProps.node.attrs.title &&
    prevProps.selected === nextProps.selected
  );
});

export default AudioNodeView;