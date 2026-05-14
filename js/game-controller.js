/**
 * GameController - 统一游戏状态管理
 * 继承 EventEmitter，管理所有游戏状态变更
 */

/**
 * GameController 构造函数
 * @param {TimerController} timerController - 计时器控制器实例
 */
function GameController(timerController) {
  EventEmitter.call(this);

  this.timerController = timerController;

  // 游戏状态
  this.state = {
    board: null,           // Board 实例
    mode: 'pvp',          // 'pvp' 双人或 'ai' 人机
    difficulty: 'medium',  // 'easy', 'medium', 'hard'
    isGameOver: false,    // 游戏是否结束
    isAIThinking: false,  // AI 是否正在思考
    moveHistory: [],      // 落子记录 [{row, col, player}, ...]
    isReplaying: false,   // 回放状态标志
    isStarted: false      // 游戏是否已开始
  };

  // AI 思考定时器
  this._aiTimer = null;

  // 回放状态
  this._replayId = null;
}

GameController.prototype = Object.create(EventEmitter.prototype);
GameController.prototype.constructor = GameController;

/**
 * 初始化游戏
 * @param {Board} board - 棋盘实例
 */
GameController.prototype.init = function(board) {
  this.state.board = board;
  this.state.isGameOver = false;
  this.state.isAIThinking = false;
  this.state.isStarted = false;
  this.state.moveHistory = [];
};

/**
 * 设置模式
 * @param {string} mode - 'pvp' 或 'ai'
 */
GameController.prototype.setMode = function(mode) {
  this.state.mode = mode;
};

/**
 * 设置难度
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 */
GameController.prototype.setDifficulty = function(difficulty) {
  this.state.difficulty = difficulty;
};

/**
 * 开始游戏
 */
GameController.prototype.startGame = function() {
  this.state.isStarted = true;
  this.timerController.reset();
  var firstPlayer = 'black';
  this.timerController.start(firstPlayer);
  this.emit('gameStarted', { mode: this.state.mode });
};

/**
 * 玩家落子
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @returns {boolean} 是否落子成功
 */
GameController.prototype.placeStone = function(row, col) {
  var currentPlayer = this.state.board.currentPlayer;

  if (!this.state.board.placeStone(row, col, currentPlayer)) {
    return false;
  }

  // 记录落子
  this.state.moveHistory.push({
    row: row,
    col: col,
    player: currentPlayer
  });

  // 检查胜负
  var winLine = this.state.board.checkWin(row, col);
  if (winLine) {
    this._handleWin(currentPlayer, winLine);
    return true;
  }

  // 检查平局
  if (this.state.board.checkDraw()) {
    this._handleDraw();
    return true;
  }

  // 切换计时器
  var nextPlayer = currentPlayer === 1 ? 'white' : 'black';
  this.timerController.switchTo(nextPlayer);

  // 触发落子事件
  this.emit('stonePlaced', { row: row, col: col, player: currentPlayer });

  // 如果是人机模式且是 AI 回合
  if (this.state.mode === 'ai' && this.state.board.currentPlayer === 2) {
    this._triggerAIMove();
  }

  return true;
};

/**
 * AI 落子
 */
GameController.prototype._triggerAIMove = function() {
  var self = this;
  this.state.isAIThinking = true;
  this.emit('aiThinkingStarted');

  if (this._aiTimer) {
    clearTimeout(this._aiTimer);
  }

  this._aiTimer = setTimeout(function() {
    var aiMove = getAIMove(self.state.board, self.state.difficulty);

    if (aiMove) {
      self.placeStone(aiMove.row, aiMove.col);
    }

    self.state.isAIThinking = false;
    self._aiTimer = null;
    self.emit('aiThinkingEnded');

  }, 500);
};

/**
 * 处理获胜
 * @param {number} player - 获胜玩家 1 或 2
 * @param {Array} winLine - 获胜连线
 */
GameController.prototype._handleWin = function(player, winLine) {
  this.state.isGameOver = true;
  this.timerController.stop();
  this._saveReplay();

  this.emit('gameOver', { winner: player, winLine: winLine });
};

/**
 * 处理平局
 */
GameController.prototype._handleDraw = function() {
  this.state.isGameOver = true;
  this.timerController.stop();
  this._saveReplay();

  this.emit('draw');
};

/**
 * 保存录像
 */
GameController.prototype._saveReplay = function() {
  if (window.replayManager) {
    window.replayManager.saveReplay(
      this.state.mode,
      this.state.difficulty,
      this.state.moveHistory
    );
  }
};

/**
 * 处理超时
 * @param {string} player - 超时玩家 'black' | 'white'
 */
GameController.prototype.handleTimeout = function(player) {
  this.state.isGameOver = true;
  var winner = player === 'black' ? 2 : 1;
  this.emit('timeout', { player: player, winner: winner });
};

/**
 * 悔棋
 */
GameController.prototype.undoMove = function() {
  if (this.state.isAIThinking || this.state.isReplaying) return;
  if (this.state.moveHistory.length === 0) return;

  // AI 模式撤回两步，PvP 模式撤回一步
  var stepsToUndo = this.state.mode === 'ai' ? 2 : 1;

  var undoneMoves = [];
  for (var i = 0; i < stepsToUndo; i++) {
    if (this.state.moveHistory.length === 0) break;

    var move = this.state.moveHistory.pop();
    this.state.board.undoMove(move.row, move.col);
    undoneMoves.push(move);
  }

  // 如果游戏已结束，清除结束状态
  if (this.state.isGameOver) {
    this.state.isGameOver = false;
    this.emit('gameResumed');
  }

  this.emit('movesUndone', { moves: undoneMoves });

  // 重新启动计时器
  if (this.state.isStarted) {
    var currentPlayer = this.state.board.currentPlayer;
    var timerPlayer = currentPlayer === 1 ? 'black' : 'white';
    this.timerController.start(timerPlayer);
  }
};

/**
 * 重新开始游戏
 */
GameController.prototype.restartGame = function() {
  // 停止回放
  if (this.state.isReplaying) {
    this.stopReplay();
  }

  // 清除 AI 计时器
  if (this._aiTimer) {
    clearTimeout(this._aiTimer);
    this._aiTimer = null;
  }

  this.state.board.reset();
  this.state.isGameOver = false;
  this.state.isAIThinking = false;
  this.state.moveHistory = [];

  // 重置计时器
  if (this.state.isStarted) {
    this.timerController.reset();
    var firstPlayer = 'black';
    this.timerController.start(firstPlayer);
  }

  this.emit('gameRestarted');
};

/**
 * 开始回放
 * @param {string} replayId - 录像 ID
 */
GameController.prototype.startReplay = function(replayId) {
  var self = this;
  var replayManager = window.replayManager;

  if (!replayManager) return;

  this._replayId = replayId;
  this.state.isReplaying = true;
  this.timerController.stop();

  this.emit('replayStarted');

  replayManager.startReplay(
    replayId,
    // onStep
    function(move) {
      self.emit('replayStep', move);
    },
    // onComplete
    function() {
      self.state.isReplaying = false;
      self.state.moveHistory = [];
      self._replayId = null;
      self.emit('replayEnded');
    }
  );
};

/**
 * 停止回放
 */
GameController.prototype.stopReplay = function() {
  if (window.replayManager) {
    window.replayManager.stopReplay();
  }
  this.state.isReplaying = false;
  this.state.moveHistory = [];
  this._replayId = null;
};

/**
 * 获取当前状态快照
 * @returns {Object} 状态副本
 */
GameController.prototype.getState = function() {
  return {
    board: this.state.board,
    mode: this.state.mode,
    difficulty: this.state.difficulty,
    isGameOver: this.state.isGameOver,
    isAIThinking: this.state.isAIThinking,
    moveHistory: this.state.moveHistory.slice(),
    isReplaying: this.state.isReplaying,
    isStarted: this.state.isStarted
  };
};

// 导出 GameController（支持 CommonJS 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameController;
}
