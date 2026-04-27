import { cn } from "@/lib/utils";

interface AlvaIconProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

export default function AlvaIcon({ size = 32, isActive = false, className }: AlvaIconProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center rounded-full flex-shrink-0", isActive ? "ring-active" : "ring-idle", className)}
      style={{ width: size, height: size }}
    >
      {/* Gradient ring */}
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id={`ag-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f7fff" />
            <stop offset="50%" stopColor="#9b5cff" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={`url(#ag-${size})`} strokeWidth="2"
          strokeDasharray={`${Math.PI * (size - 4) * 0.75} ${Math.PI * (size - 4) * 0.25}`}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ opacity: 0.7 }} />
      </svg>
      {/* Inner */}
      <div className="absolute rounded-full flex items-center justify-center"
        style={{ inset: size * 0.18, background: "linear-gradient(135deg,#4f7fff22,#9b5cff22)" }}>
        <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.8 10.2L22 12L13.8 13.8L12 22L10.2 13.8L2 12L10.2 10.2Z"
            fill="url(#starGrad)" />
          <circle cx="12" cy="12" r="1.1" fill="white" opacity="0.9" />
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f7fff" />
              <stop offset="60%" stopColor="#9b5cff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
