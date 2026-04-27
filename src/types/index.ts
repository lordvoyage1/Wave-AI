export interface Message {
  id: string;
  role: "user" | "assistant";
  type: "text" | "code" | "image-result" | "video-result" | "audio-result" | "vision-result" | "file-result" | "error";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  codeLanguage?: string;
  error?: boolean;
  files?: FileAttachment[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  url?: string;
  content?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: string;
}
