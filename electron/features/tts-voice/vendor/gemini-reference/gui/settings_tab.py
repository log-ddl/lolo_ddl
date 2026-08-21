import json
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QPlainTextEdit, QMessageBox, QGroupBox
)
from PyQt6.QtCore import Qt
from services.api_key_manager import key_manager

class SettingsTab(QWidget):
    def __init__(self):
        super().__init__()
        self._setup_ui()
        self._load_keys()
        self.is_hidden = False
        self._update_visibility()
        
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(15)
        
        # API Keys Group
        api_group = QGroupBox("Quản lý Gemini API Keys")
        api_layout = QVBoxLayout(api_group)
        
        info_label = QLabel("Dán các API Key vào đây (mỗi key 1 dòng). Các key sẽ tự động lưu và load lại.")
        info_label.setStyleSheet("color: #666;")
        api_layout.addWidget(info_label)
        
        self.key_edit = QPlainTextEdit()
        self.key_edit.setPlaceholderText("AIzaSyB...\nAIzaSyC...\nAIzaSyD...")
        api_layout.addWidget(self.key_edit)
        
        btn_layout = QHBoxLayout()
        
        self.toggle_btn = QPushButton("👁️ Hiện Keys")
        self.toggle_btn.clicked.connect(self._toggle_visibility)
        btn_layout.addWidget(self.toggle_btn)
        
        self.save_btn = QPushButton("💾 Lưu Keys")
        self.save_btn.clicked.connect(self._save_keys)
        self.save_btn.setStyleSheet("background-color: #2196F3; color: white; font-weight: bold;")
        btn_layout.addWidget(self.save_btn)
        
        api_layout.addLayout(btn_layout)
        layout.addWidget(api_group)
        
        layout.addStretch()
        
    def _load_keys(self):
        keys = [k['full_key'] for k in key_manager.get_all_keys()]
        self.raw_keys_text = "\n".join(keys)
        
    def _update_visibility(self):
        if self.is_hidden:
            self.toggle_btn.setText("👁️ Hiện Keys")
            keys = [k.strip() for k in self.raw_keys_text.split('\n') if k.strip()]
            masked = []
            for k in keys:
                if len(k) > 12:
                    masked.append(f"{k[:8]}...{k[-4:]}")
                else:
                    masked.append("***")
            self.key_edit.setPlainText("\n".join(masked))
            self.key_edit.setReadOnly(True)
            self.key_edit.setStyleSheet("background-color: #f0f0f0;")
        else:
            self.toggle_btn.setText("🙈 Ẩn Keys")
            self.key_edit.setPlainText(self.raw_keys_text)
            self.key_edit.setReadOnly(False)
            self.key_edit.setStyleSheet("")
            
    def _toggle_visibility(self):
        if self.is_hidden:
            self.is_hidden = False
            self._update_visibility()
        else:
            self.raw_keys_text = self.key_edit.toPlainText()
            self.is_hidden = True
            self._update_visibility()
            
    def _save_keys(self):
        # Update raw keys if currently visible
        if not self.is_hidden:
            self.raw_keys_text = self.key_edit.toPlainText()
            
        keys = [k.strip() for k in self.raw_keys_text.split('\n') if k.strip()]
        
        # Clear existing keys from manager and add new ones
        key_manager._keys.clear()
        for k in keys:
            key_manager.add_key(k)
            
        key_manager.save_keys()
        
        QMessageBox.information(self, "Thành công", f"Đã lưu {len(keys)} API keys thành công!")
        
        # Reset visibility to hidden after saving
        self.is_hidden = True
        self._update_visibility()
