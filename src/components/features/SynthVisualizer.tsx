import { cn } from "@/lib/utils";

interface SynthVisualizerProps {
  isActive?: boolean;
  barCount?: number;
  className?: string;
}

export default function SynthVisualizer({ isActive = false, barCount = 8, className }: SynthVisualizerProps) {
  const delays = [0, 0.15, 0.3, 0.1, 0.25, 0.05, 0.35, 0.2, 0.4, 0.12, 0.28, 0.18, 0.08, 0.32, 0.22, 0.42, 0.07, 0.38];
  const durations = [0.7, 0.55, 0.85, 0.65, 0.45, 0.9, 0.6, 0.75, 0.5, 0.8, 0.4, 0.7, 0.6, 0.5, 0.85, 0.65, 0.55, 0.75];

  return (
    <div className={cn("flex items-end gap-[2.5px]", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn("synth-bar", isActive && "synth-bar-active")}
          style={{
            "--bar-delay": `${delays[i % delays.length]}s`,
            "--delay": `${durations[i % durations.length]}s`,
            minHeight: 4,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
