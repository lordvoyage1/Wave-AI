import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const m: Record<string, string> = {
    js: "javascript", ts: "typescript", tsx: "tsx", jsx: "jsx",
    py: "python", go: "go", rs: "rust", java: "java",
    rb: "ruby", php: "php", cs: "csharp", cpp: "cpp", c: "c",
    html: "html", css: "css", scss: "scss", json: "json",
    md: "markdown", sh: "bash", yaml: "yaml", yml: "yaml",
    sql: "sql", xml: "xml", swift: "swift", kt: "kotlin",
  };
  return m[ext || ""] || "text";
}
