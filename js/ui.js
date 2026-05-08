/**
 * 五子棋交互控制模块
 * 负责模式切换、难度选择、落子事件、重新开始、回合提示、胜负提示
 */

// 棋盘大小常量
const BOARD_SIZE = 15;

// 游戏状态对象
const GameState = {
  board: null,           // Board 实例
  mode: 'pvp',          // 'pvp' 双人或 'ai' 人机
  difficulty: 'medium',  // 'easy', 'medium', 'hard'
  isGameOver: false,    // 游戏是否结束
  isAIThinking: false   // AI 是否正在思考
};

/**
 * 初始化游戏
 */
function initGame() {
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
  // 模式切换
  const modeSelect = document.getElementById('mode');
  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      GameState.mode = e.target.value;
      restartGame();
    });
  }

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
}

/**
 * 处理棋盘点击
 * @param {Event} e - 点击事件
 */
function handleBoardClick(e) {
  // 游戏结束或 AI 正在思考时忽略点击
  if (GameState.isGameOver || GameState.isAIThinking) return;

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

  // 使用 setTimeout 模拟思考过程，避免阻塞 UI
  setTimeout(() => {
    const aiMove = getAIMove(GameState.board.grid, GameState.difficulty);

    if (aiMove) {
      placeStone(aiMove.row, aiMove.col);
    }

    GameState.isAIThinking = false;
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
  cell.classList.add(player === 1 ? 'black' : 'white');
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
      cell.classList.add('win');
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
  GameState.board.reset();
  GameState.isGameOver = false;
  GameState.isAIThinking = false;

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
