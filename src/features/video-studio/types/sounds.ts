
export interface SoundEffect {
  id: number;
  name: string;
  username?: string;
  previewUrl: string;
  downloadUrl?: string;
  duration?: number;
  tags?: string[];
  license?: string;
}

export interface SavedSound {
  id: number;
  name: string;
  username?: string;
  previewUrl: string;
  downloadUrl?: string;
  duration?: number;
  tags?: string[];
  license?: string;
  savedAt: string;
}

export interface SavedSoundsData {
  sounds: SavedSound[];
  lastModified: string;
}

