import React from "react";
import { cn } from "@/lib/utils";

export interface VolumeHoverSliderProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  /** Uses narrower slider width (`w-12`) for mini/compact players. */
  compact?: boolean;
}

/**
 * Hover-revealed volume slider matching the media scrubber track and thumb styling.
 */
export const VolumeHoverSlider: React.FC<VolumeHoverSliderProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  compact = false,
}) => {
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = effectiveVolume * 100;

  return (
    <div
      className={cn(
        "w-0 transition-all duration-200 overflow-hidden flex items-center",
        compact ? "group-hover/vol:w-12" : "group-hover/vol:w-16"
      )}
    >
      <div
        className={cn(
          "group/volbar relative h-4 flex items-center cursor-pointer",
          compact ? "w-12" : "w-16"
        )}
      >
        {/* Volume Background Track */}
        <div className="relative w-full rounded-full bg-muted-foreground/20 dark:bg-white/20 overflow-hidden transition-all duration-150 h-1 group-hover/volbar:h-1.5">
          {/* Match buffered track tint of progress bar */}
          <div className="absolute inset-0 bg-muted-foreground/35 dark:bg-white/30" />
          {/* Filled Volume */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary rounded-full"
            style={{ width: `${volumePercent}%` }}
          />
        </div>
        {/* Volume Thumb */}
        <div
          className="pointer-events-none absolute rounded-full bg-primary border-2 border-background dark:border-card shadow-md scale-0 group-hover/volbar:scale-100 transition-transform duration-150 h-2.5 w-2.5"
          style={{
            left: `calc(${volumePercent}% - ${effectiveVolume * 10}px)`,
          }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={effectiveVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
    </div>
  );
};
