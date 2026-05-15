/**
 * 五子棋交互控制模块 —— 核心游戏逻辑
 * 负责模式切换、落子事件、重新开始、回合提示、胜负提示、悔棋、计时器
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
  isReplaying: false,   // 回放状态标志
  isStarted: false       // 游戏是否已开始
};

// 计时器常量 (已迁移到 TimerController.TIMER_LIMIT)
// 保留向后兼容常量
const TIMER_LIMIT = TimerController.TIMER_LIMIT;

// 全局计时器控制器实例（懒加载初始化）
var timerController;
var timerEventsBound = false;

function getTimerController() {
  if (!timerController) {
    timerController = new TimerController();
  }
  return timerController;
}

function bindTimerEventsIfNeeded() {
  if (timerEventsBound) return;

  getTimerController().on('timerExpired', function(data) {
    handleTimeout(data.player);
  });
  getTimerController().on('timerTick', function() {
    updateTimerDisplay();
  });

  timerEventsBound = true;
}

function clearLastMoveHighlight() {
  document.querySelectorAll('.cell.last-move').forEach((el) => {
    el.classList.remove('last-move');
  });
}

function markLastMove(row, col) {
  clearLastMoveHighlight();
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    cell.classList.add('last-move');
  }
}

function restoreLastMoveHighlightFromHistory() {
  const lastMove = GameState.moveHistory[GameState.moveHistory.length - 1];
  if (!lastMove) {
    clearLastMoveHighlight();
    return;
  }
  markLastMove(lastMove.row, lastMove.col);
}

/**
 * 初始化游戏
 */
function initGame() {
  // 初始化音频管理器
  initAudioManager();

  // 初始化录像管理器
  initReplayManager();

  // 初始化计时器事件
  bindTimerEventsIfNeeded();

  GameState.board = new Board(BOARD_SIZE);
  GameState.isGameOver = false;
  GameState.isAIThinking = false;
  GameState.isStarted = false;

  // 创建棋盘 DOM
  createBoardDOM();

  // 添加 waiting 状态
  document.getElementById('board').classList.add('waiting');

  // 绑定事件
  bindEvents();

  // 更新状态显示
  updateStatusBar();

  // 启动计时器
  resetTimers();
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
      GameState.isStarted = false;
      updateStatusBar();
    });
  });

  // 难度选择
  const difficultySelect = document.getElementById('difficulty');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      GameState.difficulty = e.target.value;
    });
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
  if (!GameState.isStarted) return;  // 未开始时拦截
  if (GameState.isGameOver || GameState.isAIThinking) return;
  if (GameState.isReplaying) return;

  const cell = e.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);

  if (placeStone(row, col)) {
    updateUndoButton();
    updateStatusBar();
  }
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
    return false;
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
    return true;
  }

  // 检查平局
  if (GameState.board.checkDraw()) {
    handleDraw();
    return true;
  }

  // 切换回合
  switchTimer();
  if (!GameState.isAIThinking) {
    updateStatusBar();
  }

  // 如果是人机模式且是 AI 回合
  if (GameState.mode === 'ai' && GameState.board.currentPlayer === 2) {
    triggerAIMove();
  }

  return true;
}

/**
 * 触发 AI 落子
 */
function triggerAIMove() {
  GameState.isAIThinking = true;

  if (GameState._aiTimer) {
    clearTimeout(GameState._aiTimer);
  }

  GameState._aiTimer = setTimeout(() => {
    const aiMove = getAIMove(GameState.board, GameState.difficulty);

    if (aiMove) {
      placeStone(aiMove.row, aiMove.col);
    }

    GameState.isAIThinking = false;
    GameState._aiTimer = null;
    updateUndoButton();
    updateStatusBar();

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
  markLastMove(row, col);
}

/**
 * 处理获胜
 * @param {number} player - 获胜玩家
 * @param {Array} winLine - 获胜连线
 */
function handleWin(player, winLine) {
  GameState.isGameOver = true;
  stopTimer();

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

  updateStatusBar();
}

/**
 * 处理平局
 */
function handleDraw() {
  GameState.isGameOver = true;
  stopTimer();

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

  updateStatusBar();
}

/**
 * 更新状态栏（统一处理三种页面状态）
 */
function updateStatusBar() {
  const statusEl = document.getElementById('status');
  const actionsEl = document.getElementById('status-actions');
  const boardEl = document.getElementById('board');
  if (!statusEl || !actionsEl) return;

  if (!GameState.isStarted) {
    // === 未开始状态 ===
    boardEl.classList.add('waiting');
    statusEl.textContent = '选择模式后点击开始';
    statusEl.className = '';
    actionsEl.innerHTML = '<button id="start-btn" class="start-btn">▶开始</button>';
    bindStartButton();
    return;
  }

  boardEl.classList.remove('waiting');
  const currentPlayer = GameState.board.currentPlayer;
  boardEl.classList.toggle('turn-black', currentPlayer === 1);
  boardEl.classList.toggle('turn-white', currentPlayer === 2);

  if (GameState.isGameOver) {
    // === 已结束状态 ===
    actionsEl.innerHTML = '<button id="restart-btn">再来一局</button><button id="undo-btn">悔棋</button>';
    bindStatusBarButtons();
    return;
  }

  // === 进行中状态 ===
  if (GameState.isAIThinking) {
    statusEl.textContent = 'AI 正在思考...';
    statusEl.className = 'thinking';
    // 保持按钮但禁用，避免状态栏高度变化导致棋盘抖动
    actionsEl.innerHTML = '<button id="restart-btn" disabled>重新开始</button><button id="undo-btn" disabled>悔棋</button>';
    bindStatusBarButtons();
    return;
  }

  const playerName = currentPlayer === 1 ? '黑方' : '白方';

  if (GameState.mode === 'ai') {
    const playerText = currentPlayer === 1 ? '你' : 'AI';
    statusEl.textContent = `${playerText}的回合（${playerName}）`;
  } else {
    statusEl.textContent = `${playerName}的回合`;
  }
  statusEl.className = currentPlayer === 1 ? 'black-turn' : 'white-turn';

  actionsEl.innerHTML = '<button id="restart-btn">重新开始</button><button id="undo-btn">悔棋</button>';
  bindStatusBarButtons();
  updateUndoButton();
}

/**
 * 悔棋逻辑
 */
function undoLastMove() {
  if (GameState.isAIThinking || GameState.isReplaying) return;
  if (GameState.moveHistory.length === 0) return;

  // 先停止计时器（游戏结束后可能没有活跃计时器，但 stopTimer 安全可重入）
  stopTimer();

  // 清除获胜高亮（如果游戏已结束）
  if (GameState.isGameOver) {
    document.querySelectorAll('.stone-winning').forEach(el => {
      el.classList.remove('stone-winning');
    });
    GameState.isGameOver = false;
  }

  // AI 模式撤回两步，PvP 模式撤回一步
  const stepsToUndo = GameState.mode === 'ai' ? 2 : 1;

  for (let i = 0; i < stepsToUndo; i++) {
    if (GameState.moveHistory.length === 0) break;

    const move = GameState.moveHistory.pop();
    GameState.board.undoMove(move.row, move.col);

    // 清除 DOM 棋子样式
    const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
    if (cell) {
      cell.classList.remove('occupied', 'stone-black', 'stone-white', 'last-move');
    }
  }

  restoreLastMoveHighlightFromHistory();

  // 更新状态
  updateStatusBar();
  updateUndoButton();

  // 重新启动计时器
  if (GameState.isStarted) {
    startTimer();
  }
}

/**
 * 更新悔棋按钮禁用状态
 */
function updateUndoButton() {
  const btn = document.getElementById('undo-btn');
  if (!btn) return;

  // AI 思考中或回放中禁用（游戏结束后不禁用，允许撤回致胜/致负步）
  if (GameState.isAIThinking || GameState.isReplaying) {
    btn.disabled = true;
    return;
  }

  if (GameState.moveHistory.length === 0) {
    btn.disabled = true;
    return;
  }

  // AI 模式：需要至少 2 步才能撤回（玩家+AI）
  if (GameState.mode === 'ai' && GameState.moveHistory.length < 2) {
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}

function startTimer() {
  if (GameState.isGameOver || GameState.isReplaying) return;
  bindTimerEventsIfNeeded();

  const player = GameState.board.currentPlayer === 1 ? 'black' : 'white';
  getTimerController().start(player);
  updateTimerDisplay();
}

function stopTimer() {
  getTimerController().stop();
  updateTimerDisplay();
}

function switchTimer() {
  const previousPlayer = getTimerController().state.active;
  stopTimer();
  startTimer();
  const currentPlayer = getTimerController().state.active;

  if (previousPlayer && previousPlayer !== currentPlayer) {
    getTimerController().state[previousPlayer] = TIMER_LIMIT;
  }

  updateTimerDisplay();
}

function resetTimers() {
  getTimerController().reset();
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const blackEl = document.getElementById('timer-black');
  const whiteEl = document.getElementById('timer-white');
  if (!blackEl || !whiteEl) return;

  const blackTime = getTimerController().getRemainingTime('black');
  const whiteTime = getTimerController().getRemainingTime('white');
  const active = getTimerController().state.active;

  blackEl.textContent = `黑方 ${blackTime}s`;
  whiteEl.textContent = `白方 ${whiteTime}s`;

  blackEl.classList.toggle('timer-active', active === 'black');
  whiteEl.classList.toggle('timer-active', active === 'white');

  [blackEl, whiteEl].forEach((el, i) => {
    const time = i === 0 ? blackTime : whiteTime;
    el.classList.remove('timer-warning', 'timer-critical');
    if (time <= 3) {
      el.classList.add('timer-critical');
    } else if (time <= 5) {
      el.classList.add('timer-warning');
    }
  });
}

function handleTimeout(player) {
  GameState.isGameOver = true;
  const winner = player === 'black' ? 2 : 1;
  const winnerName = winner === 1 ? '黑方' : '白方';
  const loserName = player === 'black' ? '黑方' : '白方';

  const status = document.getElementById('status');
  if (status) {
    const modeText = GameState.mode === 'ai'
      ? (winner === 2 ? 'AI' : '你')
      : winnerName;
    status.textContent = `${loserName}超时，${modeText}获胜！`;
    status.className = 'status win';
  }

  updateStatusBar();
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

  // 重置计时器
  if (GameState.isStarted) {
    resetTimers();
    startTimer();
  }

  // 清空棋盘显示
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.className = 'cell';
  });

  // 更新状态
  updateStatusBar();
  updateUndoButton();
}

/**
 * 绑定开始按钮
 */
function bindStartButton() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
}

/**
 * 绑定状态栏内的重新开始/再来一局和悔棋按钮
 */
function bindStatusBarButtons() {
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      restartGame();
    });
  }

  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undoLastMove);
  }
}

/**
 * 开始游戏
 */
function startGame() {
  GameState.isStarted = true;
  resetTimers();
  startTimer();
  updateStatusBar();
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);
