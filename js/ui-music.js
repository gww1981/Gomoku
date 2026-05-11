/**
 * 五子棋音乐控制模块
 * 负责设置弹窗中的音乐 Tab 逻辑
 */

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
