/**
 * 五子棋音乐控制模块
 * 负责设置弹窗中的音乐 Tab 逻辑
 */

// ========== AudioManager ==========

/**
 * AudioManager - 背景音乐管理器
 * 单例模式，管理预设音乐、本地上传、播放控制
 */
class AudioManager {
  constructor() {
    // 预设音乐配置（使用 SoundHelix 免费样本）
    this.PRESET_MUSIC = {
      'preset-1': { name: '宁静森林', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      'preset-2': { name: '古典时光', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      'preset-3': { name: '东方禅意', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      'preset-4': { name: '暮光之城', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      'preset-5': { name: '夏日午后', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
    };

    // 存储键
    this.STORAGE_KEYS = {
      volume: 'gomoku_music_volume',
      muted: 'gomoku_music_muted',
      current: 'gomoku_music_current'
    };

    // 本地音乐最大 10MB
    this.MAX_FILE_SIZE = 10 * 1024 * 1024;

    // HTML Audio 元素
    this.audio = new Audio();
    this.audio.loop = true;

    // 状态
    this.currentTrack = null;
    this.customMusicData = null;
    this.isPlaying = false;

    // 回调
    this.onTrackChange = null;
    this.onPlayStateChange = null;

    this._init();
  }

  _init() {
    this._loadSettings();
    this.audio.addEventListener('ended', () => { this.isPlaying = false; });
    this.audio.addEventListener('error', (e) => console.warn('音频加载失败:', e));
  }

  play(trackId) {
    if (!trackId) return;
    if (trackId === 'custom') {
      if (!this.customMusicData) return;
      this.audio.src = this.customMusicData;
    } else if (this.PRESET_MUSIC[trackId]) {
      this.audio.src = this.PRESET_MUSIC[trackId].url;
    }
    this.currentTrack = trackId;
    this._saveCurrentTrack(trackId);
    this.audio.play().catch(e => console.warn('播放失败:', e));
    this.isPlaying = true;
    if (this.onTrackChange) this.onTrackChange(trackId);
    if (this.onPlayStateChange) this.onPlayStateChange(true);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    } else {
      if (!this.audio.src) return;
      this.audio.play().catch(e => console.warn('播放失败:', e));
      this.isPlaying = true;
    }
    if (this.onPlayStateChange) this.onPlayStateChange(this.isPlaying);
  }

  prev() {
    const keys = Object.keys(this.PRESET_MUSIC);
    const currentIndex = keys.indexOf(this.currentTrack);
    const prevIndex = currentIndex <= 0 ? keys.length - 1 : currentIndex - 1;
    this.play(keys[prevIndex]);
  }

  next() {
    const keys = Object.keys(this.PRESET_MUSIC);
    const currentIndex = keys.indexOf(this.currentTrack);
    const nextIndex = currentIndex >= keys.length - 1 ? 0 : currentIndex + 1;
    this.play(keys[nextIndex]);
  }

  setVolume(value) {
    this.audio.volume = Math.max(0, Math.min(1, value));
    this._saveVolume(value);
  }

  getVolume() {
    return this.audio.volume;
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    this._saveMuted(this.audio.muted);
    return this.audio.muted;
  }

  isMuted() {
    return this.audio.muted;
  }

  getCurrentTrackName() {
    if (this.currentTrack === 'custom') return '自定义音乐';
    if (this.currentTrack && this.PRESET_MUSIC[this.currentTrack]) {
      return this.PRESET_MUSIC[this.currentTrack].name;
    }
    return '未选择';
  }

  async loadCustomMusic(file) {
    const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'];
    return new Promise((resolve, reject) => {
      if (file.size > this.MAX_FILE_SIZE) {
        reject(new Error('文件大小不能超过 10MB'));
        return;
      }
      if (file.type && !ALLOWED_AUDIO_TYPES.includes(file.type)) {
        reject(new Error(`不支持的音频格式: ${file.type}`));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.customMusicData = e.target.result;
        resolve(e.target.result);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  getPresetList() {
    return Object.entries(this.PRESET_MUSIC).map(([id, data]) => ({
      id,
      name: data.name,
      url: data.url
    }));
  }

  restore() {
    this._loadSettings();
    if (this.currentTrack === 'custom' && this.customMusicData) {
      this.audio.src = this.customMusicData;
    } else if (this.currentTrack && this.PRESET_MUSIC[this.currentTrack]) {
      this.audio.src = this.PRESET_MUSIC[this.currentTrack].url;
    }
  }

  _saveVolume(value) {
    try { localStorage.setItem(this.STORAGE_KEYS.volume, String(value)); } catch (e) {}
  }

  _saveMuted(value) {
    try { localStorage.setItem(this.STORAGE_KEYS.muted, String(value)); } catch (e) {}
  }

  _saveCurrentTrack(trackId) {
    try { localStorage.setItem(this.STORAGE_KEYS.current, trackId); } catch (e) {}
  }

  _loadSettings() {
    try {
      const volume = localStorage.getItem(this.STORAGE_KEYS.volume);
      if (volume !== null) this.audio.volume = parseFloat(volume);
      const muted = localStorage.getItem(this.STORAGE_KEYS.muted);
      if (muted !== null) this.audio.muted = muted === 'true';
      const current = localStorage.getItem(this.STORAGE_KEYS.current);
      if (current) this.currentTrack = current;
    } catch (e) {}
  }
}

// 全局实例
window.audioManager = null;

function initAudioManager() {
  if (!window.audioManager) {
    window.audioManager = new AudioManager();
  }
  return window.audioManager;
}

// ========== 音乐 Tab ==========

function initMusicTab() {
  const audioManager = window.audioManager;
  if (!audioManager) return;

  const musicList = document.getElementById('music-list');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const muteBtn = document.getElementById('mute-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const trackName = document.getElementById('current-track-name');
  const uploadBtn = document.getElementById('upload-music-btn');
  const musicUpload = document.getElementById('music-upload');

  function updateUI() {
    trackName.textContent = audioManager.getCurrentTrackName();
    playBtn.textContent = audioManager.isPlaying ? '⏸' : '▶';
    playBtn.classList.toggle('playing', audioManager.isPlaying);
    muteBtn.textContent = audioManager.isMuted() ? '🔇' : '🔊';
    volumeSlider.value = audioManager.getVolume() * 100;
    renderMusicList();
  }

  function renderMusicList() {
    const presets = audioManager.getPresetList();
    const current = audioManager.currentTrack;
    const playing = audioManager.isPlaying;

    musicList.innerHTML = presets.map(preset => {
      const isSelected = preset.id === current;
      const isPlaying = isSelected && playing;
      return `<button class="music-item ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''}" data-track="${preset.id}" role="option" aria-selected="${isSelected}">
        <span class="music-item-name">${isPlaying ? '🎵 ' : ''}${preset.name}</span>
      </button>`;
    }).join('') + `<button class="music-item ${current === 'custom' ? 'selected' : ''}" data-track="custom" role="option" aria-selected="${current === 'custom'}">
      <span class="music-item-name">自定义音乐</span>
    </button>`;

    musicList.querySelectorAll('.music-item').forEach(item => {
      item.addEventListener('click', () => {
        audioManager.play(item.dataset.track);
        updateUI();
      });
    });
  }

  playBtn.addEventListener('click', () => {
    if (!audioManager.currentTrack && !audioManager.customMusicData) {
      audioManager.play('preset-1');
    } else {
      audioManager.togglePlay();
    }
    updateUI();
  });

  prevBtn.addEventListener('click', () => { audioManager.prev(); updateUI(); });
  nextBtn.addEventListener('click', () => { audioManager.next(); updateUI(); });

  muteBtn.addEventListener('click', () => {
    audioManager.toggleMute();
    updateUI();
  });

  volumeSlider.addEventListener('input', (e) => {
    audioManager.setVolume(e.target.value / 100);
  });

  uploadBtn.addEventListener('click', () => musicUpload.click());

  musicUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await audioManager.loadCustomMusic(file);
      audioManager.play('custom');
      updateUI();
    } catch (err) {
      alert(err.message);
    }
    musicUpload.value = '';
  });

  audioManager.onTrackChange = updateUI;
  audioManager.onPlayStateChange = updateUI;

  updateUI();
}
