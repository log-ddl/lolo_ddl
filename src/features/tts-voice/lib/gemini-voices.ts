import type { GeminiVoice } from '../types';

export const GEMINI_VOICES: GeminiVoice[] = [
  { name: 'Zephyr', description: 'Tươi sáng', gender: 'F' },
  { name: 'Puck', description: 'Rộn ràng', gender: 'M' },
  { name: 'Charon', description: 'Giàu thông tin', gender: 'M' },
  { name: 'Kore', description: 'Vững chắc', gender: 'F' },
  { name: 'Fenrir', description: 'Hào hứng', gender: 'M' },
  { name: 'Leda', description: 'Trẻ trung', gender: 'F' },
  { name: 'Orus', description: 'Vững chắc', gender: 'M' },
  { name: 'Aoede', description: 'Nhẹ nhàng', gender: 'F' },
  { name: 'Callirrhoe', description: 'Dễ chịu', gender: 'F' },
  { name: 'Autonoe', description: 'Tươi sáng', gender: 'F' },
  { name: 'Enceladus', description: 'Hơi thở nhẹ', gender: 'M' },
  { name: 'Iapetus', description: 'Rõ ràng', gender: 'M' },
  { name: 'Umbriel', description: 'Thoải mái', gender: 'M' },
  { name: 'Algieba', description: 'Mượt mà', gender: 'M' },
  { name: 'Despina', description: 'Mượt mà', gender: 'F' },
  { name: 'Erinome', description: 'Trong trẻo', gender: 'F' },
  { name: 'Algenib', description: 'Khàn', gender: 'M' },
  { name: 'Rasalgethi', description: 'Giàu thông tin', gender: 'M' },
  { name: 'Laomedeia', description: 'Rộn ràng', gender: 'F' },
  { name: 'Achernar', description: 'Dịu êm', gender: 'F' },
  { name: 'Alnilam', description: 'Vững chắc', gender: 'M' },
  { name: 'Schedar', description: 'Bình ổn', gender: 'F' },
  { name: 'Gacrux', description: 'Trưởng thành', gender: 'M' },
  { name: 'Pulcherrima', description: 'Hướng ngoại', gender: 'F' },
  { name: 'Achird', description: 'Thân thiện', gender: 'M' },
  { name: 'Zubenelgenubi', description: 'Tự nhiên', gender: 'M' },
  { name: 'Vindemiatrix', description: 'Êm dịu', gender: 'F' },
  { name: 'Sadachbia', description: 'Sôi động', gender: 'M' },
  { name: 'Sadaltager', description: 'Hiểu biết', gender: 'M' },
  { name: 'Sulafat', description: 'Ấm áp', gender: 'F' },
];

export const GEMINI_LANGUAGES = [
  ['vi-VN', 'Tiếng Việt'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'],
  ['fr-FR', 'Français'], ['de-DE', 'Deutsch'], ['es-ES', 'Español'], ['pt-BR', 'Português'],
  ['id-ID', 'Bahasa Indonesia'], ['th-TH', 'ไทย'], ['ja-JP', '日本語'], ['ko-KR', '한국어'],
  ['cmn-CN', '中文'], ['it-IT', 'Italiano'], ['ru-RU', 'Русский'], ['tr-TR', 'Türkçe'],
] as const;

export const GEMINI_AUDIO_TAGS = [
  ['[excitedly]', 'Hào hứng'], ['[seriously]', 'Nghiêm túc'], ['[whispers]', 'Thì thầm'],
  ['[softly]', 'Nhẹ nhàng'], ['[curious]', 'Tò mò'], ['[dramatically]', 'Kịch tính'],
  ['[sarcastic]', 'Mỉa mai'], ['[laughs]', 'Cười'], ['[sighs]', 'Thở dài'],
  ['[very fast]', 'Rất nhanh'], ['[very slow]', 'Rất chậm'], ['[long pause]', 'Nghỉ lâu'],
] as const;

export function getGeminiVoice(name: string) {
  return GEMINI_VOICES.find((voice) => voice.name === name);
}
