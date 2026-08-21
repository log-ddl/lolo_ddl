
import type {
  DialogueLine,
  EpisodeRawScript,
  ProjectBackground,
  SceneRawContent,
} from "@/features/video-studio/types/script";

function cleanLocationString(location: string): string {
  if (!location) return "";
  return location
    .replace(/\s*characters?[：:].*/gi, "")
    .replace(/\s*roles?[：:].*/gi, "")
    .replace(/\s*time[：:].*/gi, "")
    .trim();
}

export function parseFullScript(fullText: string): {
  background: ProjectBackground;
  episodes: EpisodeRawScript[];
} {
  const titleMatch = fullText.match(/[《「]([^》」]+)[》」]/);
  const title = titleMatch ? titleMatch[1] : "Untitled Screenplay";
  const outlineMatch = fullText.match(/(?:\*{0,2}Outline[：:]?\*{0,2}|\[Outline\])([\s\S]*?)(?=(?:\*{0,2}Character Bios[：:]|\[Character|Episode\s*\d+|$))/i);
  const outline = outlineMatch ? outlineMatch[1].trim() : "";
  const characterBiosMatch = fullText.match(/(?:\*{0,2}Character Bios[：:]\*{0,2}|\[Character Bios\])([\s\S]*?)(?=\*{0,2}Episode\s*\d+|$)/i);
  const characterBios = characterBiosMatch ? characterBiosMatch[1].trim() : "";
  const episodes = parseEpisodes(fullText);

  return {
    background: {
      title,
      outline,
      characterBios,
      era: extractTimelineInfo(outline, characterBios).era,
      timelineSetting: extractTimelineInfo(outline, characterBios).timelineSetting,
      storyStartYear: extractTimelineInfo(outline, characterBios).storyStartYear,
      storyEndYear: extractTimelineInfo(outline, characterBios).storyEndYear,
      genre: detectGenre(outline, characterBios),
      worldSetting: extractWorldSetting(outline, characterBios),
      themes: extractThemes(outline, characterBios),
    },
    episodes,
  };
}

function extractTimelineInfo(outline: string, characterBios: string): {
  era: string;
  timelineSetting?: string;
  storyStartYear?: number;
  storyEndYear?: number;
} {
  const fullText = `${outline}\n${characterBios}`;
  const rangeMatch = fullText.match(/(\d{4})\s*(?:-|to|through|~)\s*(\d{4})/i);
  if (rangeMatch) {
    return {
      era: parseInt(rangeMatch[1], 10) >= 2000 ? "modern" : "period",
      timelineSetting: `${rangeMatch[1]} - ${rangeMatch[2]}`,
      storyStartYear: parseInt(rangeMatch[1], 10),
      storyEndYear: parseInt(rangeMatch[2], 10),
    };
  }

  const singleYearMatch = fullText.match(/(\d{4})\s*(spring|summer|autumn|fall|winter|early|late)?/i);
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1], 10);
    const season = singleYearMatch[2] || "";
    return {
      era: year >= 2000 ? "modern" : year >= 1900 ? "historical" : "period",
      timelineSetting: season ? `${season} ${year}` : `${year}`,
      storyStartYear: year,
    };
  }

  const eraMatch = fullText.match(/(modern|contemporary|historical|period|future|republican|ancient)/i);
  return { era: eraMatch ? eraMatch[1].toLowerCase() : "modern" };
}

function detectGenre(outline: string, characterBios: string): string {
  const fullText = `${outline}\n${characterBios}`.toLowerCase();
  const genrePatterns: Array<{ keywords: RegExp; genre: string }> = [
    { keywords: /wuxia|martial arts|jianghu/, genre: "wuxia" },
    { keywords: /fantasy|magic|myth|immortal/, genre: "fantasy" },
    { keywords: /science fiction|sci-fi|space|robot|future|alien/, genre: "science fiction" },
    { keywords: /mystery|detective|murder|investigation/, genre: "mystery" },
    { keywords: /horror|ghost|haunted|curse/, genre: "horror" },
    { keywords: /business|startup|corporate|finance/, genre: "business" },
    { keywords: /spy|espionage|agent|intelligence/, genre: "spy thriller" },
    { keywords: /military|war|battlefield|army/, genre: "military" },
    { keywords: /medical|hospital|surgery|doctor/, genre: "medical" },
    { keywords: /legal|lawyer|court|trial/, genre: "legal" },
    { keywords: /campus|school|college|teacher|student/, genre: "school" },
    { keywords: /romance|love|relationship/, genre: "romance" },
    { keywords: /family|parents|siblings/, genre: "family" },
    { keywords: /comedy|funny|humor|humour/, genre: "comedy" },
    { keywords: /history|dynasty|court politics/, genre: "historical" },
  ];

  for (const { keywords, genre } of genrePatterns) {
    if (keywords.test(fullText)) return genre;
  }

  return "";
}

function extractWorldSetting(outline: string, characterBios: string): string {
  const fullText = `${outline}\n${characterBios}`;
  const patterns = [
    /(?:world setting|setting|background)[：:]?\s*([^\n]{10,200})/i,
    /(?:the story takes place in|story background is)\s*([^\n]{10,200})/i,
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) return match[1].trim();
  }

  return "";
}

function extractThemes(outline: string, characterBios: string): string[] {
  const fullText = `${outline}\n${characterBios}`.toLowerCase();
  const themes: string[] = [];
  const themePatterns: Array<{ keywords: RegExp; theme: string }> = [
    { keywords: /growth|struggle|rise/, theme: "growth" },
    { keywords: /revenge|vengeance/, theme: "revenge" },
    { keywords: /love|romance/, theme: "love" },
    { keywords: /family|kinship/, theme: "family" },
    { keywords: /friendship|loyalty/, theme: "friendship" },
    { keywords: /power|conspiracy|politics/, theme: "power" },
    { keywords: /justice|truth|fairness/, theme: "justice" },
    { keywords: /freedom|independence|liberation/, theme: "freedom" },
    { keywords: /redemption|forgiveness|reconciliation/, theme: "redemption" },
    { keywords: /betrayal|trust/, theme: "betrayal and trust" },
    { keywords: /destiny|fate/, theme: "destiny" },
    { keywords: /war|peace/, theme: "war and peace" },
    { keywords: /legacy|inheritance|mission/, theme: "legacy" },
    { keywords: /life|death|sacrifice/, theme: "life and death" },
  ];

  for (const { keywords, theme } of themePatterns) {
    if (keywords.test(fullText) && !themes.includes(theme)) themes.push(theme);
  }

  return themes.slice(0, 5);
}

export function parseEpisodes(text: string): EpisodeRawScript[] {
  const episodes: EpisodeRawScript[] = [];
  const episodeRegex = /\*{0,2}Episode\s+(\d+)(?:\s*[:\-]\s*([^\n*]*))?\*{0,2}(?=\n|$)/gi;
  const matches = [...text.matchAll(episodeRegex)];

  if (matches.length === 0) {
    return [{
      episodeIndex: 1,
      title: "Episode 1",
      rawContent: text,
      scenes: parseScenes(text),
      shotGenerationStatus: "idle",
    }];
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const episodeIndex = parseInt(match[1], 10) || i + 1;
    const rawTitle = match[2]?.trim().replace(/^\*+|\*+$/g, "").trim() || "";
    const title = rawTitle ? `Episode ${episodeIndex}: ${rawTitle}` : `Episode ${episodeIndex}`;
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : text.length;
    const rawContent = text.slice(startIndex, endIndex).trim();
    const scenes = parseScenes(rawContent);

    episodes.push({
      episodeIndex,
      title,
      rawContent,
      scenes,
      shotGenerationStatus: "idle",
      season: extractSeasonFromScenes(scenes),
    });
  }

  return episodes;
}

export function parseScenes(episodeText: string): SceneRawContent[] {
  const scenes: SceneRawContent[] = [];
  const sceneHeaderRegex = /^\*{0,2}(\d+-\d+)\s+(day|night|dawn|dusk|morning|evening)?\s*(interior|exterior|int\/ext)?\s*(.+)?\*{0,2}$/gim;
  const sceneMatches = [...episodeText.matchAll(sceneHeaderRegex)];

  if (sceneMatches.length === 0) {
    return parseAlternativeSceneFormat(episodeText);
  }

  for (let i = 0; i < sceneMatches.length; i++) {
    const match = sceneMatches[i];
    const sceneNumber = match[1];
    const timeOfDay = (match[2] || "day").toLowerCase();
    const interior = (match[3] || "").toLowerCase();
    const location = cleanLocationString(match[4]?.trim() || "Unknown location");
    const startIndex = match.index! + match[0].length;
    const endIndex = i < sceneMatches.length - 1 ? sceneMatches[i + 1].index! : episodeText.length;
    const content = episodeText.slice(startIndex, endIndex).trim();

    scenes.push({
      sceneHeader: [sceneNumber, timeOfDay, interior, location].filter(Boolean).join(" "),
      characters: parseCharacters(content),
      content,
      dialogues: parseDialogues(content),
      actions: parseActions(content),
      subtitles: parseSubtitles(content),
      weather: detectWeather(content, parseActions(content)),
      timeOfDay,
    });
  }

  return scenes;
}

function parseAlternativeSceneFormat(text: string): SceneRawContent[] {
  const scenes: SceneRawContent[] = [];
  const altRegex = /(?:Scene\s*(\d+)|\[Scene\s*:?\s*([^\]]+)\])/gi;
  const matches = [...text.matchAll(altRegex)];

  if (matches.length === 0) {
    return [{
      sceneHeader: "Main Scene",
      characters: parseCharacters(text),
      content: text,
      dialogues: parseDialogues(text),
      actions: parseActions(text),
      subtitles: parseSubtitles(text),
    }];
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : text.length;
    const content = text.slice(startIndex, endIndex).trim();
    scenes.push({
      sceneHeader: match[0].replace(/[\[\]]/g, "").trim(),
      characters: parseCharacters(content),
      content,
      dialogues: parseDialogues(content),
      actions: parseActions(content),
      subtitles: parseSubtitles(content),
    });
  }

  return scenes;
}

function detectWeather(content: string, actions: string[]): string | undefined {
  const fullText = `${content} ${actions.join(" ")}`.toLowerCase();
  if (/storm|thunderstorm|downpour/.test(fullText)) return "Storm";
  if (/light rain|drizzle/.test(fullText)) return "Light rain";
  if (/rain|wet/.test(fullText)) return "Rain";
  if (/blizzard/.test(fullText)) return "Blizzard";
  if (/snow/.test(fullText)) return "Snow";
  if (/heavy fog/.test(fullText)) return "Heavy fog";
  if (/fog|mist/.test(fullText)) return "Fog";
  if (/strong wind|gale/.test(fullText)) return "Strong wind";
  if (/wind|breeze/.test(fullText)) return "Breeze";
  if (/overcast|cloudy/.test(fullText)) return "Overcast";
  if (/sunny|clear sky/.test(fullText)) return "Sunny";
  return undefined;
}

function extractSeasonFromScenes(scenes: SceneRawContent[]): string | undefined {
  for (const scene of scenes) {
    for (const subtitle of scene.subtitles) {
      const match = subtitle.match(/\b(spring|summer|autumn|fall|winter)\b/i);
      if (match) return match[1].toLowerCase();
    }
  }
  return undefined;
}

function parseCharacters(text: string): string[] {
  const characters = new Set<string>();
  const charLineMatch = text.match(/Characters?[：:]\s*([^\n]+)/i);
  if (charLineMatch) {
    charLineMatch[1].split(/[;,，、]/).map((item) => item.trim()).filter(Boolean).forEach((name) => characters.add(name));
  }

  const dialogueRegex = /^([^:\(\[\n\-*]{1,40})[:](?:\s*\([^\)]+\))?/gm;
  for (const match of text.matchAll(dialogueRegex)) {
    const name = match[1].trim();
    if (name && !/^(subtitle|voiceover|narration|scene|characters?)$/i.test(name)) characters.add(name);
  }

  return Array.from(characters);
}

function parseDialogues(text: string): DialogueLine[] {
  const dialogues: DialogueLine[] = [];
  const dialogueRegex = /^([^:\(\[\n\-*]{1,40})[:]\s*(?:\(([^\)]+)\))?\s*(.+)$/gm;
  for (const match of text.matchAll(dialogueRegex)) {
    const character = match[1].trim();
    const parenthetical = match[2]?.trim();
    const line = match[3]?.trim();
    if (character && line && !/^(subtitle|voiceover|narration|scene|characters?)$/i.test(character)) {
      dialogues.push({ character, parenthetical, line });
    }
  }
  return dialogues;
}

function parseActions(text: string): string[] {
  const actions: string[] = [];
  const actionRegex = /^(?:[-*•]|Action\s*:)\s*(.+)$/gim;
  for (const match of text.matchAll(actionRegex)) {
    const action = match[1].trim();
    if (action) actions.push(action);
  }
  return actions;
}

function parseSubtitles(text: string): string[] {
  return [...text.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
}
