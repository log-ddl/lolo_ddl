"""
API Key Manager - Quản lý nhiều API key với tự động chuyển đổi khi rate limit
"""
import os
import json
import time
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from config import BASE_DIR


@dataclass
class APIKeyStatus:
    """Trạng thái của một API key"""
    key: str
    is_active: bool = True
    last_used: Optional[datetime] = None
    error_count: int = 0
    rate_limit_until: Optional[datetime] = None
    
    def is_available(self) -> bool:
        """Kiểm tra key có sẵn sàng sử dụng không"""
        if not self.is_active:
            return False
        if self.rate_limit_until and datetime.now() < self.rate_limit_until:
            return False
        return True
    
    def mark_rate_limited(self, cooldown_seconds: int = 60):
        """Đánh dấu key bị rate limit"""
        self.rate_limit_until = datetime.now() + timedelta(seconds=cooldown_seconds)
        self.error_count += 1
    
    def mark_used(self):
        """Đánh dấu key vừa được sử dụng"""
        self.last_used = datetime.now()
    
    def reset_rate_limit(self):
        """Reset trạng thái rate limit"""
        self.rate_limit_until = None


class APIKeyManager:
    """Quản lý pool các API key với tự động rotate"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self._keys: List[APIKeyStatus] = []
        self._current_index = 0
        self._cooldown_seconds = 60  # Thời gian chờ khi bị rate limit
        
        # Load keys từ config
        self._load_keys()
    
    def _load_keys(self):
        """Load keys từ biến môi trường và file config"""
        # Từ biến môi trường
        env_key = os.environ.get("GEMINI_API_KEY", "")
        if env_key:
            self.add_key(env_key)
        
        # Từ biến môi trường nhiều keys (GEMINI_API_KEYS, phân tách bằng dấu phẩy)
        env_keys = os.environ.get("GEMINI_API_KEYS", "")
        if env_keys:
            for key in env_keys.split(","):
                key = key.strip()
                if key and not self._key_exists(key):
                    self.add_key(key)
        
        # Từ file config
        config_path = BASE_DIR / "api_keys.json"
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for key in data.get("gemini_keys", []):
                        if key and not self._key_exists(key):
                            self.add_key(key)
            except (json.JSONDecodeError, Exception):
                pass
    
    def _key_exists(self, key: str) -> bool:
        """Kiểm tra key đã tồn tại chưa"""
        return any(k.key == key for k in self._keys)
    
    def add_key(self, key: str):
        """Thêm API key mới"""
        if key and not self._key_exists(key):
            self._keys.append(APIKeyStatus(key=key))
            return True
        return False
    
    def remove_key(self, key: str):
        """Xóa API key"""
        self._keys = [k for k in self._keys if k.key != key]
    
    def get_current_key(self) -> Optional[str]:
        """Lấy key hiện tại đang sử dụng"""
        available_keys = [k for k in self._keys if k.is_available()]
        
        if not available_keys:
            # Nếu tất cả đều bị rate limit, trả về key có thời gian chờ ngắn nhất
            if self._keys:
                best_key = min(self._keys, key=lambda k: k.rate_limit_until or datetime.min)
                
                # Tính thời gian cần chờ
                if best_key.rate_limit_until:
                    wait_seconds = (best_key.rate_limit_until - datetime.now()).total_seconds()
                    if wait_seconds > 0:
                        print(f"⏳ Tất cả keys bị limit. Đợi {wait_seconds:.1f}s cho key {best_key.key[:8]}...")
                        time.sleep(min(wait_seconds + 1, 60)) # Đợi tối đa 60s
                
                best_key.reset_rate_limit()
                return best_key.key
            return None
        
        # Round-robin giữa các key khả dụng
        if self._current_index >= len(available_keys):
            self._current_index = 0
        
        key_status = available_keys[self._current_index]
        key_status.mark_used()
        return key_status.key
    
    def rotate_key(self) -> Optional[str]:
        """Chuyển sang key tiếp theo"""
        self._current_index += 1
        return self.get_current_key()
    
    def mark_rate_limited(self, key: str):
        """Đánh dấu key bị rate limit"""
        for k in self._keys:
            if k.key == key:
                k.mark_rate_limited(self._cooldown_seconds)
                break
    
    def mark_error(self, key: str):
        """Đánh dấu key có lỗi"""
        for k in self._keys:
            if k.key == key:
                k.error_count += 1
                # Nếu lỗi quá nhiều, tạm vô hiệu hóa
                if k.error_count >= 5:
                    k.is_active = False
                break
    
    def get_all_keys(self) -> List[dict]:
        """Lấy danh sách tất cả keys và trạng thái"""
        return [
            {
                "key": k.key[:8] + "..." + k.key[-4:] if len(k.key) > 12 else k.key,
                "full_key": k.key,
                "is_active": k.is_active,
                "is_available": k.is_available(),
                "error_count": k.error_count,
                "rate_limit_until": k.rate_limit_until.isoformat() if k.rate_limit_until else None
            }
            for k in self._keys
        ]
    
    def save_keys(self, path: Optional[Path] = None):
        """Lưu danh sách keys vào file"""
        if path is None:
            path = BASE_DIR / "api_keys.json"
        
        data = {
            "gemini_keys": [k.key for k in self._keys if k.is_active]
        }
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    
    @property
    def key_count(self) -> int:
        """Số lượng keys"""
        return len(self._keys)
    
    @property
    def available_count(self) -> int:
        """Số lượng keys khả dụng"""
        return len([k for k in self._keys if k.is_available()])
    
    def set_cooldown(self, seconds: int):
        """Đặt thời gian cooldown khi rate limit"""
        self._cooldown_seconds = seconds


# Singleton instance
key_manager = APIKeyManager()
