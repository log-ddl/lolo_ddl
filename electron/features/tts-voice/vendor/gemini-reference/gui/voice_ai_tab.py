"""
Voice Gemini Pro - Vũ Mạnh Hùng
Giao diện Premium Dark Theme sang trọng.
"""
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QScrollArea, QSplitter, QComboBox, QLineEdit,
    QTextEdit, QGroupBox, QGridLayout, QListWidget,
    QListWidgetItem, QMessageBox, QSlider, QApplication
)
from PyQt6.QtCore import Qt, pyqtSignal, QThread, QObject, QUrl
from PyQt6.QtGui import QCursor, QFont
from PyQt6.QtMultimedia import QMediaPlayer, QAudioOutput

from config import BASE_DIR

# --- Bảng màu Premium Dark UI ---
PRIMARY = "#0ea5e9"      # Xanh Azure sang trọng
PRIMARY_HOVER = "#0284c7"
BG_MAIN = "#0f172a"      # Nền xanh đen tối (Slate 900)
BG_CARD = "#1e293b"      # Nền panel nổi bật (Slate 800)
TEXT_MAIN = "#f8fafc"    # Chữ trắng sáng (Slate 50)
TEXT_MUTED = "#94a3b8"   # Chữ xám nhạt (Slate 400)
BORDER = "#334155"       # Viền xám tối
ACCENT_GOLD = "#fbbf24"  # Vàng gold tạo điểm nhấn cao cấp


class TTSWorker(QObject):
    """Worker thread for TTS generation."""
    progress = pyqtSignal(str)
    result = pyqtSignal(str)
    error = pyqtSignal(str)
    finished = pyqtSignal()

    def __init__(self, text, voice_name, model, output_path=None):
        super().__init__()
        self.text = text
        self.voice_name = voice_name
        self.model = model
        self.output_path = output_path

    def run(self):
        try:
            from services.gemini_tts_service import GeminiTTSService
            svc = GeminiTTSService()
            path = svc.generate_speech(
                text=self.text,
                voice_name=self.voice_name,
                model=self.model,
                output_path=self.output_path,
                on_progress=lambda msg: self.progress.emit(msg),
            )
            self.result.emit(path)
        except Exception as e:
            self.error.emit(str(e))
        finally:
            self.finished.emit()


class VoiceAITab(QWidget):
    """Voice Synthesis Application - Premium Redesign."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._selected_voice = "Puck"
        self._selected_model = "gemini-3.1-flash-tts-preview"
        self._output_path: Optional[str] = None
        self._tts_worker = None
        self._tts_thread = None
        self._history = []

        # Audio playback
        self._player = QMediaPlayer()
        self._audio_output = QAudioOutput()
        self._player.setAudioOutput(self._audio_output)
        self._player.positionChanged.connect(self._on_position_changed)
        self._player.durationChanged.connect(self._on_duration_changed)

        self._setup_ui()

    def _setup_ui(self):
        self.setStyleSheet(f"""
            QWidget {{
                background-color: {BG_MAIN};
                color: {TEXT_MAIN};
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 13px;
            }}
            QGroupBox {{
                font-weight: bold;
                border: 1px solid {BORDER};
                border-radius: 8px;
                margin-top: 14px;
                background-color: {BG_CARD};
            }}
            QGroupBox::title {{
                subcontrol-origin: margin;
                left: 14px;
                padding: 0 4px;
                color: {ACCENT_GOLD};
            }}
            QLineEdit, QTextEdit {{
                border: 1px solid {BORDER};
                border-radius: 6px;
                padding: 8px;
                background: #0b1120;
                color: {TEXT_MAIN};
            }}
            QLineEdit:focus, QTextEdit:focus {{
                border: 1px solid {PRIMARY};
            }}
            QPushButton {{
                border-radius: 6px;
                padding: 6px 12px;
                font-weight: 500;
            }}
        """)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)

        # Header
        main_layout.addWidget(self._create_header())

        # Main 3-column Splitter
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setStyleSheet(f"""
            QSplitter::handle {{ background: {BORDER}; width: 2px; margin: 0 5px; }}
        """)
        
        # Col 1: Voice Library
        splitter.addWidget(self._create_voice_panel())
        
        # Col 2: Editor & Settings
        splitter.addWidget(self._create_studio_panel())
        
        # Col 3: Output History
        splitter.addWidget(self._create_history_panel())

        splitter.setSizes([260, 650, 260])
        main_layout.addWidget(splitter, stretch=1)

        # Bottom Player
        main_layout.addWidget(self._create_player_bar())

    # ═══════════════════ HEADER ═══════════════════

    def _create_header(self) -> QWidget:
        header = QFrame()
        header.setFixedHeight(60)
        header.setStyleSheet(f"""
            QFrame {{
                background-color: {BG_CARD};
                border: 1px solid {BORDER};
                border-radius: 8px;
            }}
        """)
        layout = QHBoxLayout(header)
        layout.setContentsMargins(20, 0, 20, 0)

        title = QLabel("✦ Premium Voice Studio")
        title.setStyleSheet(f"font-size: 18px; font-weight: 800; color: {ACCENT_GOLD};")
        layout.addWidget(title)

        subtitle = QLabel("  |  AI Speech Synthesis")
        subtitle.setStyleSheet(f"color: {TEXT_MUTED}; font-size: 14px;")
        layout.addWidget(subtitle)

        layout.addStretch()

        model_label = QLabel("AI Engine:")
        model_label.setStyleSheet(f"color: {TEXT_MUTED}; font-weight: bold;")
        layout.addWidget(model_label)

        self._model_combo = QComboBox()
        self._model_combo.setStyleSheet(f"""
            QComboBox {{
                border: 1px solid {BORDER}; border-radius: 4px;
                padding: 4px 10px; background: #0b1120; color: {TEXT_MAIN};
            }}
        """)
        from services.gemini_tts_service import TTS_MODELS
        for model_id, label in TTS_MODELS.items():
            self._model_combo.addItem(label, model_id)
        self._model_combo.currentIndexChanged.connect(
            lambda i: setattr(self, '_selected_model', self._model_combo.currentData())
        )
        layout.addWidget(self._model_combo)

        return header

    # ═══════════════════ LEFT: VOICE LIBRARY ═══════════════════

    def _create_voice_panel(self) -> QGroupBox:
        panel = QGroupBox("Danh Sách Giọng Đọc")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(10, 25, 10, 10)

        search = QLineEdit()
        search.setPlaceholderText("🔍 Tìm giọng đọc...")
        search.setStyleSheet(f"border: 1px solid {BORDER}; border-radius: 15px; padding: 6px 15px; background: #0b1120;")
        layout.addWidget(search)

        self._voice_list = QListWidget()
        self._voice_list.setStyleSheet(f"""
            QListWidget {{ border: none; background: transparent; outline: none; }}
            QListWidget::item {{
                padding: 10px; margin-bottom: 5px; border-radius: 6px;
                border: 1px solid {BG_CARD};
            }}
            QListWidget::item:hover {{ background: #334155; border: 1px solid {BORDER}; }}
            QListWidget::item:selected {{
                background: {PRIMARY}; color: #ffffff;
                font-weight: bold; border: 1px solid {PRIMARY_HOVER};
            }}
        """)

        from services.gemini_tts_service import GEMINI_TTS_VOICES
        for v in GEMINI_TTS_VOICES:
            gender_str = "Nam" if v['gender'] == 'M' else "Nữ"
            # Hiển thị Tên + Giới tính + Mô tả cực rõ ràng
            item = QListWidgetItem(f"{v['name']}\n{gender_str}  |  {v['desc']}")
            item.setData(Qt.ItemDataRole.UserRole, v["name"])
            self._voice_list.addItem(item)
            if v["name"] == self._selected_voice:
                item.setSelected(True)

        self._voice_list.itemSelectionChanged.connect(self._on_voice_selected)
        layout.addWidget(self._voice_list)
        return panel

    def _on_voice_selected(self):
        items = self._voice_list.selectedItems()
        if items:
            self._selected_voice = items[0].data(Qt.ItemDataRole.UserRole)

    # ═══════════════════ CENTER: STUDIO EDITOR ═══════════════════

    def _create_studio_panel(self) -> QGroupBox:
        panel = QGroupBox("Phòng Thu AI (Studio)")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(15, 20, 15, 15)

        # Tags Grid - Hiện đầy đủ như bản cũ nhưng sang trọng hơn
        tags_group = QGroupBox("🎭 Thẻ Cảm Xúc (Click để chèn vào kịch bản)")
        tags_group.setStyleSheet(f"""
            QGroupBox {{ margin-top: 5px; border-radius: 6px; border: 1px solid {BORDER}; background: #0b1120; }}
            QGroupBox::title {{ left: 10px; color: {PRIMARY}; font-size: 12px; font-weight: bold; }}
        """)
        tags_layout = QGridLayout(tags_group)
        tags_layout.setContentsMargins(10, 25, 10, 10)
        tags_layout.setSpacing(6)
        
        from services.gemini_tts_service import AUDIO_TAG_DEFS
        cols = 5
        for i, (tag, desc) in enumerate(AUDIO_TAG_DEFS):
            btn = QPushButton(desc)  # Nút hiển thị tiếng Việt
            btn.setToolTip(f"Sẽ chèn: {tag}")
            btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: #334155; border: 1px solid {BORDER};
                    color: {TEXT_MAIN}; font-size: 11px; border-radius: 4px;
                    padding: 5px 2px;
                }}
                QPushButton:hover {{ background: #475569; color: {ACCENT_GOLD}; border-color: {ACCENT_GOLD}; }}
            """)
            btn.clicked.connect(lambda _, t=tag: self._insert_tag(t)) # Khi click chèn tiếng Anh
            tags_layout.addWidget(btn, i // cols, i % cols)
            
        layout.addWidget(tags_group)

        # Editor
        self._script_input = QTextEdit()
        self._script_input.setPlaceholderText("✍️ Nhập kịch bản văn bản tại đây...\n(Ví dụ: [excitedly] Xin chào các bạn!)")
        self._script_input.setStyleSheet("font-size: 14px; line-height: 1.5; margin-top: 10px;")
        layout.addWidget(self._script_input, stretch=1)

        # Advanced Settings (Director)
        self._dir_group = QGroupBox("🛠️(Tùy chọn nâng cao)")
        self._dir_group.setCheckable(True)
        self._dir_group.setChecked(False)
        self._dir_group.setStyleSheet(f"""
            QGroupBox {{ margin-top: 15px; border-radius: 6px; background: #0b1120; }}
            QGroupBox::title {{ left: 10px; color: {TEXT_MUTED}; font-size: 12px; }}
        """)
        dir_layout = QGridLayout(self._dir_group)
        dir_layout.setContentsMargins(15, 25, 15, 15)
        
        self._char_name_input = QLineEdit()
        self._char_name_input.setPlaceholderText("Ví dụ: MC Thảo Vân")
        
        self._role_input = QLineEdit()
        self._role_input.setPlaceholderText("Ví dụ: Người dẫn chương trình")
        
        self._scene_input = QLineEdit()
        self._scene_input.setPlaceholderText("Ví dụ: Trong một buổi giao lưu trực tiếp tại trường quay")
        
        self._style_input = QLineEdit()
        self._style_input.setPlaceholderText("Ví dụ: Tươi vui, hào hứng")
        
        self._pacing_input = QLineEdit()
        self._pacing_input.setPlaceholderText("Ví dụ: Nói vừa phải, nhấn nhá rõ ràng")
        
        self._accent_input = QLineEdit()
        self._accent_input.setPlaceholderText("tiếng việt, miền nam")

        dir_layout.addWidget(QLabel("Nhân Vật:"), 0, 0)
        dir_layout.addWidget(self._char_name_input, 0, 1)
        dir_layout.addWidget(QLabel("Vai Trò:"), 0, 2)
        dir_layout.addWidget(self._role_input, 0, 3)

        dir_layout.addWidget(QLabel("Cảm Xúc:"), 1, 0)
        dir_layout.addWidget(self._style_input, 1, 1)
        dir_layout.addWidget(QLabel("Nhịp Độ:"), 1, 2)
        dir_layout.addWidget(self._pacing_input, 1, 3)

        dir_layout.addWidget(QLabel("Bối Cảnh:"), 2, 0)
        dir_layout.addWidget(self._scene_input, 2, 1, 1, 3)

        dir_layout.addWidget(QLabel("Ngôn Ngữ:"), 3, 0)
        dir_layout.addWidget(self._accent_input, 3, 1, 1, 3)
        
        layout.addWidget(self._dir_group)

        # Generate Button
        self._gen_btn = QPushButton("✨ SẢN XUẤT AUDIO")
        self._gen_btn.setFixedHeight(50)
        self._gen_btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self._gen_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {PRIMARY}; color: white;
                font-size: 15px; font-weight: 900; letter-spacing: 1px;
                border-radius: 8px; margin-top: 10px; border: 1px solid {PRIMARY_HOVER};
            }}
            QPushButton:hover {{ background-color: {PRIMARY_HOVER}; border: 1px solid {PRIMARY}; }}
            QPushButton:disabled {{ background-color: #475569; color: #94a3b8; border: none; }}
        """)
        self._gen_btn.clicked.connect(self._on_generate)
        layout.addWidget(self._gen_btn)

        return panel

    def _insert_tag(self, tag: str):
        cursor = self._script_input.textCursor()
        cursor.insertText(f"{tag} ")
        self._script_input.setFocus()

    # ═══════════════════ RIGHT: HISTORY ═══════════════════

    def _create_history_panel(self) -> QGroupBox:
        panel = QGroupBox("Kết Quả & Lịch Sử")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(10, 25, 10, 10)

        open_btn = QPushButton("📂 Mở Thư Mục Chứa")
        open_btn.setStyleSheet(f"background: #334155; border: 1px solid {BORDER}; color: {TEXT_MAIN}; font-weight: bold;")
        open_btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        open_btn.clicked.connect(self._open_output_folder)
        layout.addWidget(open_btn)

        self._output_list = QListWidget()
        self._output_list.setStyleSheet(f"""
            QListWidget {{ border: none; background: transparent; outline: none; }}
            QListWidget::item {{
                padding: 10px; border-bottom: 1px solid {BORDER};
                margin-top: 2px;
            }}
            QListWidget::item:hover {{ background: #334155; border-radius: 6px; }}
            QListWidget::item:selected {{
                background: {PRIMARY}; color: white; border-radius: 6px; font-weight: bold;
            }}
        """)
        self._output_list.itemDoubleClicked.connect(self._play_from_list)
        layout.addWidget(self._output_list)

        return panel

    # ═══════════════════ BOTTOM: PLAYER ═══════════════════

    def _create_player_bar(self) -> QWidget:
        bar = QFrame()
        bar.setFixedHeight(60)
        bar.setStyleSheet(f"""
            QFrame {{
                background-color: #0b1120;
                border: 1px solid {BORDER};
                border-radius: 8px;
            }}
        """)
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(20, 0, 20, 0)
        layout.setSpacing(15)

        # Controls
        self._play_btn = QPushButton("▶ Phát")
        self._play_btn.setFixedSize(85, 36)
        self._play_btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self._play_btn.setStyleSheet(f"""
            QPushButton {{
                background: {PRIMARY}; border: none;
                border-radius: 18px; font-weight: bold; color: white;
            }}
            QPushButton:hover {{ background: {PRIMARY_HOVER}; }}
            QPushButton:disabled {{ background: #334155; color: {TEXT_MUTED}; }}
        """)
        self._play_btn.clicked.connect(self._toggle_play)
        self._play_btn.setEnabled(False)
        layout.addWidget(self._play_btn)

        self._stop_btn = QPushButton("⏹ Dừng")
        self._stop_btn.setFixedSize(85, 36)
        self._stop_btn.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self._stop_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; border: 1px solid {BORDER}; color: {TEXT_MUTED};
                border-radius: 18px; font-weight: bold;
            }}
            QPushButton:hover {{ background: #334155; color: white; }}
        """)
        self._stop_btn.clicked.connect(self._stop_play)
        layout.addWidget(self._stop_btn)

        self._now_playing = QLabel("Chưa có bản ghi")
        self._now_playing.setStyleSheet(f"color: {ACCENT_GOLD}; font-size: 12px; font-weight: bold;")
        self._now_playing.setFixedWidth(200)
        layout.addWidget(self._now_playing)

        # Slider
        self._position_slider = QSlider(Qt.Orientation.Horizontal)
        self._position_slider.setStyleSheet(f"""
            QSlider::groove:horizontal {{ background: {BORDER}; height: 4px; border-radius: 2px; }}
            QSlider::handle:horizontal {{
                background: {PRIMARY}; width: 14px; height: 14px;
                margin: -5px 0; border-radius: 7px;
            }}
            QSlider::sub-page:horizontal {{ background: {ACCENT_GOLD}; border-radius: 2px; }}
        """)
        self._position_slider.sliderMoved.connect(self._seek)
        layout.addWidget(self._position_slider, stretch=1)

        self._time_label = QLabel("0:00 / 0:00")
        self._time_label.setStyleSheet("font-family: Consolas, monospace; font-size: 12px; color: #cbd5e1;")
        layout.addWidget(self._time_label)

        # Status indicator
        self._status_label = QLabel("🟢 Sẵn sàng")
        self._status_label.setStyleSheet(f"color: #10b981; font-weight: bold; padding-left: 10px;")
        layout.addWidget(self._status_label)

        return bar

    # ═══════════════════ LOGIC (KHÔNG ĐỔI) ═══════════════════

    def _on_generate(self):
        script = self._script_input.toPlainText().strip()
        if not script:
            QMessageBox.warning(self, "Lỗi", "Vui lòng nhập kịch bản cần đọc!")
            return

        from services.gemini_tts_service import GeminiTTSService
        svc = GeminiTTSService()

        full_text = svc.build_full_prompt(
            transcript=script,
            character_name=self._char_name_input.text().strip(),
            role_title=self._role_input.text().strip(),
            scene_description=self._scene_input.text().strip(),
            style_notes=self._style_input.text().strip(),
            pacing_notes=self._pacing_input.text().strip(),
            accent_notes=self._accent_input.text().strip(),
        )

        self._gen_btn.setEnabled(False)
        self._gen_btn.setText("⏳ ĐANG XỬ LÝ...")
        self._status_label.setText("🟡 Đang tạo audio...")
        self._status_label.setStyleSheet(f"color: #f59e0b; font-weight: bold; padding-left: 10px;")

        worker = TTSWorker(
            text=full_text,
            voice_name=self._selected_voice,
            model=self._selected_model,
        )

        thread = QThread()
        worker.moveToThread(thread)

        worker.progress.connect(lambda msg: self._status_label.setText(f"🟡 {msg}"))
        worker.result.connect(self._on_tts_done)
        worker.error.connect(self._on_tts_error)
        worker.finished.connect(thread.quit)
        worker.finished.connect(worker.deleteLater)
        thread.finished.connect(thread.deleteLater)
        thread.finished.connect(lambda: self._gen_btn.setEnabled(True))
        thread.finished.connect(lambda: self._gen_btn.setText("✨ SẢN XUẤT AUDIO"))

        thread.started.connect(worker.run)
        thread.start()
        
        self._tts_worker = worker
        self._tts_thread = thread

    def _on_tts_done(self, path: str):
        self._output_path = path
        self._tts_worker = None
        self._status_label.setText("🟢 Hoàn tất")
        self._status_label.setStyleSheet(f"color: #10b981; font-weight: bold; padding-left: 10px;")

        filename = os.path.basename(path)
        item = QListWidgetItem(f"🎵 {filename}")
        item.setData(Qt.ItemDataRole.UserRole, path)
        self._output_list.insertItem(0, item)
        self._output_list.setCurrentItem(item)

        self._load_audio(path)

    def _on_tts_error(self, error: str):
        self._status_label.setText("🔴 Lỗi")
        self._status_label.setStyleSheet(f"color: #ef4444; font-weight: bold; padding-left: 10px;")
        self._tts_worker = None
        QMessageBox.critical(self, "Lỗi TTS", f"Không thể tạo giọng nói:\n\n{error}")

    def _load_audio(self, path: str):
        self._player.setSource(QUrl.fromLocalFile(path))
        self._play_btn.setEnabled(True)
        self._now_playing.setText(os.path.basename(path))
        self._player.play()
        self._play_btn.setText("⏸ Tạm dừng")

    def _toggle_play(self):
        if self._player.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
            self._player.pause()
            self._play_btn.setText("▶ Phát")
        else:
            self._player.play()
            self._play_btn.setText("⏸ Tạm dừng")

    def _stop_play(self):
        self._player.stop()
        self._play_btn.setText("▶ Phát")

    def _seek(self, position: int):
        self._player.setPosition(position)

    def _on_position_changed(self, position: int):
        self._position_slider.blockSignals(True)
        self._position_slider.setValue(position)
        self._position_slider.blockSignals(False)
        self._update_time_label()

    def _on_duration_changed(self, duration: int):
        self._position_slider.setMaximum(duration)
        self._update_time_label()

    def _update_time_label(self):
        pos = self._player.position() // 1000
        dur = self._player.duration() // 1000
        self._time_label.setText(f"{pos // 60}:{pos % 60:02d} / {dur // 60}:{dur % 60:02d}")

    def _play_from_list(self, item: QListWidgetItem):
        path = item.data(Qt.ItemDataRole.UserRole)
        if path and os.path.exists(path):
            self._load_audio(path)

    def _open_output_folder(self):
        folder = str(BASE_DIR / "outputs" / "voice_ai")
        Path(folder).mkdir(parents=True, exist_ok=True)
        os.startfile(folder)
