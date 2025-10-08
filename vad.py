import numpy as np
import torch
import torchaudio

class VoiceActivityDetector:
    def __init__(self):
        """Silero VADモデルを初期化"""
        self.model, _ = torch.hub.load(
            repo_or_dir='snakers4/silero-vad',
            model='silero_vad',
            force_reload=False
        )
        self.model.eval()
        
    def detect(self, audio_data: bytes, threshold: float = 0.5) -> bool:
        """
        音声データから発話区間を検出
        
        Args:
            audio_data: 16-bit PCM音声データ
            threshold: VAD検出の閾値 (0.0 - 1.0)
            
        Returns:
            bool: 発話が検出されたかどうか
        """
        # バイトデータをnumpy配列に変換
        audio_np = np.frombuffer(audio_data, dtype=np.int16)
        audio_float = audio_np.astype(np.float32) / 32768.0
        
        # PyTorchテンソルに変換
        audio_tensor = torch.from_numpy(audio_float)
        
        # VAD推論実行
        speech_prob = self.model(audio_tensor, 8000)
        
        return speech_prob.item() > threshold