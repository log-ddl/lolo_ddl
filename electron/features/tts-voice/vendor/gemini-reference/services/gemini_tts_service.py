"""
Gemini TTS Service — Text-to-Speech bằng Gemini 3.1 Flash TTS Preview
Hỗ trợ 30 giọng đọc, audio tags, director's notes, và multi-key rotation.
Model: gemini-3.1-flash-tts-preview (phiên bản mới nhất)
"""
import os
import io
import wave
import struct
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Callable

from google import genai
from google.genai import types

from services.api_key_manager import key_manager
from config import BASE_DIR

# ═══════════════════════════════════════════════════════════════
# 30 VOICES — Gemini TTS
# ═══════════════════════════════════════════════════════════════

GEMINI_TTS_VOICES = [
    {"name": "Zephyr", "desc": "Bright — Tươi sáng", "gender": "F"},
    {"name": "Puck", "desc": "Upbeat — Rộn ràng", "gender": "M"},
    {"name": "Charon", "desc": "Informative — Cung cấp thông tin", "gender": "M"},
    {"name": "Kore", "desc": "Firm — Vững chắc", "gender": "F"},
    {"name": "Fenrir", "desc": "Excitable — Dễ kích động", "gender": "M"},
    {"name": "Leda", "desc": "Youthful — Trẻ trung", "gender": "F"},
    {"name": "Orus", "desc": "Firm — Vững chắc", "gender": "M"},
    {"name": "Aoede", "desc": "Breezy — Nhẹ nhàng", "gender": "F"},
    {"name": "Callirrhoe", "desc": "Easy-going — Dễ chịu", "gender": "F"},
    {"name": "Autonoe", "desc": "Bright — Tươi sáng", "gender": "F"},
    {"name": "Enceladus", "desc": "Breathy — Hơi thở nhẹ", "gender": "M"},
    {"name": "Iapetus", "desc": "Clear — Rõ ràng", "gender": "M"},
    {"name": "Umbriel", "desc": "Easy-going — Dễ tính", "gender": "M"},
    {"name": "Algieba", "desc": "Smooth — Làm mịn", "gender": "M"},
    {"name": "Despina", "desc": "Smooth — Mượt mà", "gender": "F"},
    {"name": "Erinome", "desc": "Clear — Trong trẻo", "gender": "F"},
    {"name": "Algenib", "desc": "Raspy — Khàn", "gender": "M"},
    {"name": "Rasalgethi", "desc": "Informative — Cung cấp thông tin", "gender": "M"},
    {"name": "Laomedeia", "desc": "Upbeat — Rộn ràng", "gender": "F"},
    {"name": "Achernar", "desc": "Soft — Dịu êm", "gender": "F"},
    {"name": "Alnilam", "desc": "Firm — Vững chắc", "gender": "M"},
    {"name": "Schedar", "desc": "Even — Bình ổn", "gender": "F"},
    {"name": "Gacrux", "desc": "Mature — Trưởng thành", "gender": "M"},
    {"name": "Pulcherrima", "desc": "Forward — Chuyển tiếp", "gender": "F"},
    {"name": "Achird", "desc": "Friendly — Thân thiện", "gender": "M"},
    {"name": "Zubenelgenubi", "desc": "Casual — Bình thường", "gender": "M"},
    {"name": "Vindemiatrix", "desc": "Gentle — Êm dịu", "gender": "F"},
    {"name": "Sadachbia", "desc": "Lively — Sôi động", "gender": "M"},
    {"name": "Sadaltager", "desc": "Knowledgeable — Hiểu biết", "gender": "M"},
    {"name": "Sulafat", "desc": "Warm — Ấm áp", "gender": "F"},
]

# ═══════════════════════════════════════════════════════════════
# TTS MODEL — phiên bản mới nhất
# ═══════════════════════════════════════════════════════════════

TTS_MODELS = {
    "gemini-3.1-flash-tts-preview": "Gemini 3.1 Flash TTS (Mới nhất)",
    "gemini-2.5-flash-preview-tts": "Gemini 2.5 Flash TTS",
}

DEFAULT_TTS_MODEL = "gemini-3.1-flash-tts-preview"

# ═══════════════════════════════════════════════════════════════
# AUDIO TAG REFERENCE
# ═══════════════════════════════════════════════════════════════

AUDIO_TAG_DEFS = [
    # Cảm xúc cơ bản
    ("[excitedly]", "Hào hứng"),
    ("[seriously]", "Nghiêm túc"),
    ("[whispers]", "Thì thầm"),
    ("[softly]", "Nhẹ nhàng"),
    ("[curious]", "Tò mò"),
    ("[amazed]", "Kinh ngạc"),
    ("[panicked]", "Hoảng loạn"),
    ("[dramatically]", "Kịch tính"),
    ("[sarcastic]", "Mỉa mai"),
    ("[bored]", "Chán nản"),
    ("[tired]", "Mệt mỏi"),
    ("[mischievously]", "Lém lỉnh"),
    # Hành động
    ("[sighs]", "Thở dài"),
    ("[gasp]", "Thở gấp"),
    ("[laughs]", "Cười lớn"),
    ("[giggles]", "Cười khúc khích"),
    ("[cough]", "Ho"),
    ("[crying]", "Khóc"),
    ("[trembling]", "Run rẩy"),
    ("[clears throat]", "Rằng giọng"),
    # Tốc độ
    ("[very fast]", "Rất nhanh"),
    ("[very slow]", "Rất chậm"),
    ("[one word at a time]", "Đọc từng từ"),
    ("[Speed: -20%]", "Chậm -20%"),
    ("[Speed: +30%]", "Nhanh +30%"),
    # Nâng cao — Pause
    ("[beat]", "Ngắt nhịp"),
    ("[long pause]", "Nghỉ lâu"),
    ("[Pause: 0.5s]", "Nghỉ 0.5s"),
    ("[Pause: dramatic 1s]", "Nghỉ kịch tính 1s"),
    # Nâng cao — Voice direction
    ("[voice rises with emotion]", "Giọng cao trào"),
    ("[voice drops to near whisper]", "Hạ giọng thì thầm"),
    ("[voice breaks with emotion]", "Giọng nghẹn ngào"),
    ("[building intensity]", "Tăng cường độ"),
    ("[crescendo]", "Mạnh dần lên"),
    ("[voice steadies]", "Bình ổn lại"),
    # Nâng cao — Emphasis
    ("[Emphasis: strong on keywords]", "Nhấn mạnh từ khóa"),
    ("[Emphasis: gentle stress]", "Nhấn nhẹ"),
    # Kết hợp
    ("[softly, Speed: -15%]", "Nhẹ & Chậm 15%"),
    ("[excitedly, very fast]", "Hào hứng & Nhanh"),
]

COMMON_AUDIO_TAGS = [item[0] for item in AUDIO_TAG_DEFS]

# ═══════════════════════════════════════════════════════════════
# DEFAULT DIRECTOR'S NOTES TEMPLATE
# ═══════════════════════════════════════════════════════════════

DEFAULT_DIRECTOR_TEMPLATE = """# AUDIO PROFILE: {character_name}
## "{role_title}"

## THE SCENE: {scene_name}
{scene_description}

### DIRECTOR'S NOTES
Style: {style_notes}

Pacing: {pacing_notes}

Accent: {accent_notes}

### SAMPLE CONTEXT
{sample_context}

#### TRANSCRIPT
{transcript}"""

# ═══════════════════════════════════════════════════════════════
# TTS SERVICE
# ═══════════════════════════════════════════════════════════════

class GeminiTTSService:
    """Service for Gemini Text-to-Speech generation.
    
    Sử dụng gemini-3.1-flash-tts-preview — phiên bản mới nhất.
    Tự động đổi API key khi rate limit.
    """

    MAX_RETRIES = 8  # Nhiều lần để tận dụng key rotation
    SAMPLE_RATE = 24000  # Gemini TTS outputs 24kHz PCM
    CHANNELS = 1
    SAMPLE_WIDTH = 2  # 16-bit

    def __init__(self):
        self._current_key: Optional[str] = None
        self._client: Optional[genai.Client] = None

    def _get_client(self, force_new: bool = False) -> genai.Client:
        if force_new or self._client is None:
            key = key_manager.get_current_key()
            if not key:
                raise ValueError(
                    "Không có Gemini API key.\n"
                    "Thêm key trong Cài Đặt → Gemini API (hoặc thêm api_keys.json)."
                )
            self._current_key = key
            self._client = genai.Client(api_key=key)
        return self._client

    def _rotate_key(self):
        """Đánh dấu key hiện tại rate-limited và chuyển sang key tiếp theo."""
        if self._current_key:
            key_manager.mark_rate_limited(self._current_key)
            print(f"⚠️ Key {self._current_key[:8]}... bị rate limit, đang chuyển...")
        new_key = key_manager.rotate_key()
        if new_key:
            self._current_key = new_key
            self._client = genai.Client(api_key=new_key)
            print(f"🔄 Đã chuyển sang key: {new_key[:8]}...")
            return self._client
        raise ValueError("Tất cả API key đều bị rate limit. Vui lòng thử lại sau.")

    def _is_rate_limit_error(self, error: Exception) -> bool:
        error_str = str(error).lower()
        return any(kw in error_str for kw in [
            'rate limit', 'quota', '429', 'resource exhausted',
            'too many requests', 'ratelimit', '503', 'unavailable',
            'high demand', 'overloaded',
        ])

    def generate_speech(
        self,
        text: str,
        voice_name: str = "Puck",
        model: str = DEFAULT_TTS_MODEL,
        output_path: Optional[str] = None,
        on_progress: Callable[[str], None] = None,
    ) -> str:
        """
        Generate speech from text using Gemini TTS.
        Tự động đổi key khi rate limit.
        
        Args:
            text: The transcript/script text (có thể bao gồm audio tags + director's notes)
            voice_name: One of the 30 supported voice names
            model: TTS model to use (default: gemini-3.1-flash-tts-preview)
            output_path: Where to save the WAV file. Auto-generated if None.
            on_progress: Progress callback
            
        Returns:
            Path to the generated WAV file
        """
        if not output_path:
            session_folder = datetime.now().strftime("%Y-%m-%d_%H%M%S")
            output_dir = BASE_DIR / "outputs" / "voice_ai" / session_folder
            output_dir.mkdir(parents=True, exist_ok=True)
            timestamp = int(time.time())
            output_path = str(output_dir / f"tts_{voice_name}_{timestamp}.wav")

        config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            )
        )

        retries = 0
        last_error = None

        while retries < self.MAX_RETRIES:
            try:
                if on_progress:
                    key_display = f"({self._current_key[:8]}...)" if self._current_key else ""
                    on_progress(f"🎤 Đang tạo giọng nói ({voice_name}) {key_display}...")

                client = self._get_client(force_new=(retries > 0))
                key_display = f"({self._current_key[:8]}...)" if self._current_key else ""
                print(f"[TTS] Gọi API {key_display} model={model} voice={voice_name}")

                # Use streaming mode for more reliable audio extraction
                audio_chunks = []
                for chunk in client.models.generate_content_stream(
                    model=model,
                    contents=text,
                    config=config,
                ):
                    if chunk.parts is None:
                        continue
                    if chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
                        audio_chunks.append(chunk.parts[0].inline_data.data)

                # Combine all audio chunks
                if not audio_chunks:
                    raise ValueError("Không nhận được dữ liệu âm thanh từ Gemini TTS.")

                audio_data = b''.join(audio_chunks)
                print(f"[TTS] Nhận được {len(audio_data)} bytes audio data")

                # Save as WAV file (convert raw PCM to WAV with proper header)
                self._save_wav(audio_data, output_path)

                if on_progress:
                    on_progress(f"Đã tạo: {os.path.basename(output_path)}")
                print(f"[TTS] Saved: {output_path}")

                return output_path

            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                if self._is_rate_limit_error(e):
                    # Rate limit → đổi key ngay
                    retries += 1
                    if on_progress:
                        on_progress(f"⚠️ Rate limit! Đang đổi key... ({retries}/{self.MAX_RETRIES})")
                    if retries < self.MAX_RETRIES:
                        try:
                            self._rotate_key()
                        except ValueError:
                            break
                elif "500" in str(e) or "server" in error_str or "prohibited_content" in error_str:
                    # Random text token errors / server errors → retry cùng key
                    retries += 1
                    if on_progress:
                        on_progress(f"⚠️ Server error, thử lại... ({retries}/{self.MAX_RETRIES})")
                    time.sleep(2)
                else:
                    raise

        raise last_error or ValueError("Không thể tạo giọng nói sau nhiều lần thử.")

    def _save_wav(self, raw_pcm: bytes, output_path: str):
        """Save raw PCM data as a WAV file."""
        with wave.open(output_path, 'wb') as wf:
            wf.setnchannels(self.CHANNELS)
            wf.setsampwidth(self.SAMPLE_WIDTH)
            wf.setframerate(self.SAMPLE_RATE)
            wf.writeframes(raw_pcm)

    def build_full_prompt(
        self,
        transcript: str,
        character_name: str = "",
        role_title: str = "",
        scene_name: str = "",
        scene_description: str = "",
        style_notes: str = "",
        pacing_notes: str = "",
        accent_notes: str = "",
        sample_context: str = "",
    ) -> str:
        """Build a full TTS prompt with director's notes and audio profile."""
        if not any([character_name, style_notes, scene_description]):
            # Simple mode — just return transcript
            return transcript

        prompt = DEFAULT_DIRECTOR_TEMPLATE.format(
            character_name=character_name or "Voice Actor",
            role_title=role_title or "Content Creator",
            scene_name=scene_name or "Studio",
            scene_description=scene_description or "A professional recording studio with warm lighting.",
            style_notes=style_notes or "Natural, engaging, and confident.",
            pacing_notes=pacing_notes or "Medium pace, natural cadence.",
            accent_notes=accent_notes or "Vietnamese native speaker.",
            sample_context=sample_context or "Professional content creator recording for social media.",
            transcript=transcript,
        )
        return prompt
