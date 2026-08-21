
export interface TimelineClip {
  id: string;
  mediaId?: string;
  start: number;
  end: number;
  trimStart?: number;
  trimEnd?: number;
}

export interface TimelineTrack {
  id: string;
  name?: string;
  type?: "video" | "audio" | "image" | "text";
  clips: TimelineClip[];
}

export interface DragData {
  id?: string;
  type?: string;
  [key: string]: unknown;
}

