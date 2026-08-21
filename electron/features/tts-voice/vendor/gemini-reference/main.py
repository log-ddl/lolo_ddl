import sys
import os
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QTabWidget
from gui.voice_ai_tab import VoiceAITab
from gui.settings_tab import SettingsTab

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Voice Gemini Studio - Vũ Mạnh Hùng")
        self.resize(1200, 800)
        
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        layout = QVBoxLayout(self.central_widget)
        layout.setContentsMargins(5, 5, 5, 5)
        
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)
        
        self.voice_tab = VoiceAITab()
        self.settings_tab = SettingsTab()
        
        self.tabs.addTab(self.voice_tab, "🎙️ Tạo Giọng Nói")
        self.tabs.addTab(self.settings_tab, "⚙️ Cài đặt (API Keys)")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
