/**
 * 五子棋交互控制模块
 * 负责模式切换、难度选择、落子事件、重新开始、回合提示、胜负提示
 */

// BOARD_SIZE from game.js

// 游戏状态对象
const GameState = {
  board: null,           // Board 实例
  mode: 'pvp',          // 'pvp' 双人或 'ai' 人机
  difficulty: 'medium',  // 'easy', 'medium', 'hard'
  isGameOver: false,    // 游戏是否结束
  isAIThinking: false,  // AI 是否正在思考
  moveHistory: [],      // 落子记录 [{row, col, player}, ...]
  isReplaying: false    // 回放状态标志
};

/**
 * 初始化游戏
 */
function initGame() {
  // 初始化音频管理器
  initAudioManager();

  // 初始化录像管理器
  initReplayManager();

  GameState.board = new Board(BOARD_SIZE);
  GameState.isGameOver = false;
  GameState.isAIThinking = false;

  // 创建棋盘 DOM
  createBoardDOM();

  // 绑定事件
  bindEvents();

  // 更新状态显示
  updateStatus();
  updateRestartButton();
}

/**
 * 创建棋盘 DOM 结构
 */
function createBoardDOM() {
  const boardElement = document.getElementById('board');
  if (!boardElement) return;

  boardElement.innerHTML = '';

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      boardElement.appendChild(cell);
    }
  }
}

/**
 * 绑定页面元素事件
 */
function bindEvents() {
  // 模式切换（使用 button）
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      GameState.mode = e.target.dataset.mode;

      // 切换难度选择器可见性
      const difficultySelect = document.getElementById('difficulty');
      if (difficultySelect) {
        difficultySelect.classList.toggle('hidden', GameState.mode !== 'ai');
      }

      restartGame();
    });
  });

  // 难度选择
  const difficultySelect = document.getElementById('difficulty');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      GameState.difficulty = e.target.value;
    });
  }

  // 重新开始按钮
  const restartBtn = document.getElementById('restart');
  if (restartBtn) {
    restartBtn.addEventListener('click', restartGame);
  }

  // 棋盘点击事件（事件委托）
  const boardElement = document.getElementById('board');
  if (boardElement) {
    boardElement.addEventListener('click', handleBoardClick);
  }

  // 初始化设置弹窗
  initSettingsModal();
}

/**
 * 处理棋盘点击
 * @param {Event} e - 点击事件
 */
function handleBoardClick(e) {
  // 游戏结束或 AI 正在思考时忽略点击
  if (GameState.isGameOver || GameState.isAIThinking) return;

  // 回放状态时忽略点击
  if (GameState.isReplaying) return;

  const cell = e.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);

  // 尝试落子
  placeStone(row, col);
}

/**
 * 玩家落子
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 */
function placeStone(row, col) {
  // 检查是否能落子
  const currentPlayer = GameState.board.currentPlayer;

  if (!GameState.board.placeStone(row, col, currentPlayer)) {
    return; // 落子失败（位置已有棋子或超出边界）
  }

  // 记录落子
  GameState.moveHistory.push({
    row,
    col,
    player: currentPlayer
  });

  // 更新棋盘显示
  updateCellDisplay(row, col, currentPlayer);

  // 检查胜负
  const winLine = GameState.board.checkWin(row, col);
  if (winLine) {
    handleWin(currentPlayer, winLine);
    return;
  }

  // 检查平局
  if (GameState.board.checkDraw()) {
    handleDraw();
    return;
  }

  // 切换回合
  updateStatus();

  // 如果是人机模式且是 AI 回合
  if (GameState.mode === 'ai' && GameState.board.currentPlayer === 2) {
    triggerAIMove();
  }
}

/**
 * 触发 AI 落子
 */
function triggerAIMove() {
  GameState.isAIThinking = true;
  updateStatus(); // 显示 AI 正在思考

  // 清除之前的 AI 计时器，防止竞态
  if (GameState._aiTimer) {
    clearTimeout(GameState._aiTimer);
  }

  // 使用 setTimeout 模拟思考过程，避免阻塞 UI
  GameState._aiTimer = setTimeout(() => {
    const aiMove = getAIMove(GameState.board.grid, GameState.difficulty);

    if (aiMove) {
      placeStone(aiMove.row, aiMove.col);
    }

    GameState.isAIThinking = false;
    GameState._aiTimer = null;
  }, 500);
}

/**
 * 更新单个格子的显示
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} player - 玩家 1 或 2
 */
function updateCellDisplay(row, col, player) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  // 添加棋子样式
  cell.classList.add('occupied');
  cell.classList.add(player === 1 ? 'stone-black' : 'stone-white');
}

/**
 * 处理获胜
 * @param {number} player - 获胜玩家
 * @param {Array} winLine - 获胜连线
 */
function handleWin(player, winLine) {
  GameState.isGameOver = true;

  // 高亮获胜连线
  winLine.forEach(pos => {
    const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
    if (cell) {
      cell.classList.add('stone-winning');
    }
  });

  // 更新状态提示
  const status = document.getElementById('status');
  if (status) {
    const playerName = player === 1 ? '黑方' : '白方';
    const modeText = GameState.mode === 'ai' ? (player === 1 ? '你' : 'AI') : playerName;
    status.textContent = `游戏结束，${modeText}获胜！`;
    status.className = 'status win';
  }

  // 保存录像
  if (window.replayManager) {
    window.replayManager.saveReplay(
      GameState.mode,
      GameState.difficulty,
      GameState.moveHistory
    );
  }

  updateRestartButton();
}

/**
 * 处理平局
 */
function handleDraw() {
  GameState.isGameOver = true;

  const status = document.getElementById('status');
  if (status) {
    status.textContent = '游戏结束，平局！';
    status.className = 'status draw';
  }

  // 保存录像
  if (window.replayManager) {
    window.replayManager.saveReplay(
      GameState.mode,
      GameState.difficulty,
      GameState.moveHistory
    );
  }

  updateRestartButton();
}

/**
 * 更新回合提示
 */
function updateStatus() {
  const status = document.getElementById('status');
  if (!status) return;

  if (GameState.isGameOver) return;

  if (GameState.isAIThinking) {
    status.textContent = 'AI 正在思考...';
    status.className = 'status thinking';
    return;
  }

  const currentPlayer = GameState.board.currentPlayer;
  const playerName = currentPlayer === 1 ? '黑方' : '白方';

  if (GameState.mode === 'ai') {
    const playerText = currentPlayer === 1 ? '你' : 'AI';
    status.textContent = `${playerText}的回合（${playerName}）`;
  } else {
    status.textContent = `${playerName}的回合`;
  }

  status.className = 'status';
}

/**
 * 更新重新开始按钮状态
 */
function updateRestartButton() {
  const restartBtn = document.getElementById('restart');
  if (restartBtn) {
    restartBtn.textContent = GameState.isGameOver ? '再来一局' : '重新开始';
  }
}

/**
 * 重新开始游戏
 */
function restartGame() {
  // 停止回放（如果正在进行）
  if (GameState.isReplaying && window.replayManager) {
    window.replayManager.stopReplay();
    GameState.isReplaying = false;
  }

  // 清除 AI 计时器，防止竞态
  if (GameState._aiTimer) {
    clearTimeout(GameState._aiTimer);
    GameState._aiTimer = null;
  }

  GameState.board.reset();
  GameState.isGameOver = false;
  GameState.isAIThinking = false;
  GameState.moveHistory = [];

  // 清空棋盘显示
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.className = 'cell';
  });

  // 更新状态
  updateStatus();
  updateRestartButton();
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);

// 背景设置弹窗逻辑
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const settingsBtn = document.getElementById('settings');
  const closeBtn = document.getElementById('close-modal');
  const bgOptions = document.querySelectorAll('.bg-option');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('bg-upload');

  // 打开弹窗
  settingsBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    updateSelectedBg();
    if (window.refreshReplayList) window.refreshReplayList();
  });

  // 关闭弹窗
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // 点击遮罩关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // 选择预设背景
  bgOptions.forEach(option => {
    option.addEventListener('click', () => {
      const bgValue = option.dataset.bg;
      applyBackground(bgValue);
      saveBackgroundSetting(bgValue);
      updateSelectedBg();
    });
  });

  // 上传背景
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataURL(file);
      applyBackground(dataUrl);
      saveBackgroundSetting(dataUrl);
      updateSelectedBg();
    } catch (err) {
      alert(err.message);
    }
    // 清空 input 以允许重新选择同一文件
    fileInput.value = '';
  });

  // 更新选中状态
  function updateSelectedBg() {
    const currentBg = localStorage.getItem(STORAGE_KEY);
    bgOptions.forEach(option => {
      option.classList.toggle('selected', option.dataset.bg === currentBg);
    });
  }

  // 初始化 Tab 切换和音乐
  initSettingsModalTabs();
  initMusicTab();
  initReplayTab();
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

// ========== 录像 Tab ==========

function initReplayTab() {
  const replayList = document.getElementById('replay-list');
  const clearBtn = document.getElementById('clear-replays');

  if (!replayList || !clearBtn) return;

  function renderReplayList() {
    const replays = window.replayManager ? window.replayManager.getReplays() : [];

    if (replays.length === 0) {
      replayList.innerHTML = '<p class="replay-empty">暂无录像</p>';
      return;
    }

    replayList.innerHTML = replays.map(replay => {
      const modeText = replay.gameMode === 'ai' ? '人机' : '双人';
      const diffText = { easy: '简单', medium: '中等', hard: '困难' }[replay.difficulty] || '';
      const date = new Date(replay.timestamp);
      const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

      return `<div class="replay-item" data-id="${replay.id}">
        <div class="replay-info">
          <span class="replay-mode ${replay.gameMode}">${modeText} ${diffText}</span>
          <span class="replay-meta">${replay.moves.length} 步 | ${timeStr}</span>
        </div>
        <button class="replay-delete" data-id="${replay.id}">删除</button>
      </div>`;
    }).join('');

    // 点击录像开始回放
    replayList.querySelectorAll('.replay-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('replay-delete')) {
          e.stopPropagation();
          const id = e.target.dataset.id;
          window.replayManager.deleteReplay(id);
          renderReplayList();
          return;
        }
        const id = item.dataset.id;
        // 关闭设置弹窗
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.add('hidden');
        // 开始回放
        startReplay(id);
      });
    });
  }

  // 清空录像
  clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有录像吗？')) {
      window.replayManager.clearReplays();
      renderReplayList();
    }
  });

  // 暴露刷新函数
  window.refreshReplayList = renderReplayList;

  renderReplayList();
}

// ========== 设置弹窗 Tab 切换 ==========

function initSettingsModalTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn, index) => {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', `panel-${btn.dataset.tab}`);
    btn.setAttribute('aria-selected', btn.classList.contains('active'));
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tabName);
      });
    });
  });

  panels.forEach(panel => {
    panel.id = `panel-${panel.dataset.panel}`;
    panel.setAttribute('role', 'tabpanel');
  });
}

/**
 * 开始录像回放
 */
function startReplay(replayId) {
  const replayManager = window.replayManager;
  if (!replayManager) return;

  // 重置棋盘
  GameState.board.reset();
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => { cell.className = 'cell'; });

  GameState.isReplaying = true;

  const status = document.getElementById('status');
  if (status) {
    status.textContent = '录像回放中...';
    status.className = 'status';
  }

  replayManager.startReplay(
    replayId,
    // onStep
    (move) => {
      updateCellDisplay(move.row, move.col, move.player);
    },
    // onComplete
    () => {
      GameState.isReplaying = false;
      GameState.moveHistory = [];
      const status = document.getElementById('status');
      if (status) {
        status.textContent = '回放结束';
        status.className = 'status';
      }
    }
  );
}
