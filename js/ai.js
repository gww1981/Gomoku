/**
 * 五子棋 AI 模块
 * 三级难度：简单（随机）、中等（启发式评分）、困难（Minimax + Alpha-Beta）
 */

const AI_PLAYER = 2;
const PLAYER = 1;
const EMPTY = 0;

// 方向向量：水平、垂直、左斜、右斜
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 }
];

/**
 * 获取指定半径内的候选空位
 * @param {Board} board - 棋盘
 * @param {number} radius - 切比雪夫距离 (1=相邻格, 2=两格内)
 * @returns {Array<{row, col}>} 候选位置
 */
function getNearMoves(board, radius) {
  const size = board.size;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const candidates = [];
  let hasAny = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board.getStone(r, c) !== EMPTY) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size
                && board.getStone(nr, nc) === EMPTY && !visited[nr][nc]) {
              visited[nr][nc] = true;
              candidates.push({ row: nr, col: nc });
              hasAny = true;
            }
          }
        }
      }
    }
  }

  if (!hasAny) {
    const center = Math.floor(size / 2);
    return [{ row: center, col: center }];
  }
  return candidates;
}

/**
 * 简单难度：新手水平
 * - 会连五、会堵四连
 * - 50% 选 radius=1 内进攻分最高的，50% 纯随机
 * - 不主动防守三连及以下
 */
function getEasyMove(board) {
  const emptyPositions = board.getEmptyPositions();
  if (emptyPositions.length === 0) return null;

  const savedCP = board.currentPlayer;
  const savedMC = board.moveCount;

  // 1. 检查能否立刻获胜 → 100%
  for (const pos of emptyPositions) {
    board.placeStone(pos.row, pos.col, AI_PLAYER);
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    if (winLine) { board.currentPlayer = savedCP; board.moveCount = savedMC; return pos; }
  }

  // 2. 阻挡对手连五 → 100%
  for (const pos of emptyPositions) {
    board.placeStone(pos.row, pos.col, PLAYER);
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    if (winLine) { board.currentPlayer = savedCP; board.moveCount = savedMC; return pos; }
  }

  // 3. 50% 从 radius=1 候选选进攻分最高, 50% 纯随机
  if (Math.random() < 0.5) {
    let candidates = getNearMoves(board, 1);
    if (candidates.length === 0) {
      board.currentPlayer = savedCP; board.moveCount = savedMC;
      return { row: Math.floor(board.size / 2), col: Math.floor(board.size / 2) };
    }
    let best = candidates[0];
    let bestScore = board.evaluatePosition(best.row, best.col, AI_PLAYER);
    for (const pos of candidates) {
      const score = board.evaluatePosition(pos.row, pos.col, AI_PLAYER);
      if (score > bestScore) { bestScore = score; best = pos; }
    }
    board.currentPlayer = savedCP; board.moveCount = savedMC;
    return best;
  }

  // 纯随机
  board.currentPlayer = savedCP; board.moveCount = savedMC;
  return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
}

/**
 * 中等难度：业余玩家水平
 * - 会连五、会堵四连和三连
 * - radius=2 候选 + 进攻+防守评分，绝对最优
 */
function getMediumMove(board) {
  const emptyPositions = board.getEmptyPositions();
  if (emptyPositions.length === 0) return null;

  const savedCP = board.currentPlayer;
  const savedMC = board.moveCount;

  // 1. 获胜
  for (const pos of emptyPositions) {
    board.placeStone(pos.row, pos.col, AI_PLAYER);
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    if (winLine) { board.currentPlayer = savedCP; board.moveCount = savedMC; return pos; }
  }

  // 2. 阻挡对手连五
  for (const pos of emptyPositions) {
    board.placeStone(pos.row, pos.col, PLAYER);
    const winLine = board.checkWin(pos.row, pos.col);
    board.undoMove(pos.row, pos.col);
    if (winLine) { board.currentPlayer = savedCP; board.moveCount = savedMC; return pos; }
  }

  // 3. radius=2 候选 + 进攻+防守评分
  let candidates = getNearMoves(board, 2);
  if (candidates.length === 0) {
    board.currentPlayer = savedCP; board.moveCount = savedMC;
    return { row: Math.floor(board.size / 2), col: Math.floor(board.size / 2) };
  }

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const pos of candidates) {
    const score = board.evaluatePosition(pos.row, pos.col, AI_PLAYER)
                + board.evaluatePosition(pos.row, pos.col, PLAYER);
    if (score > bestScore) { bestScore = score; best = pos; }
  }

  board.currentPlayer = savedCP; board.moveCount = savedMC;
  return best;
}

/**
 * 获取候选落子位置（减少搜索空间）
 */
function getCandidateMoves(board) {
  return getNearMoves(board, 2);
}

/**
 * Minimax + Alpha-Beta 剪枝
 */
function minimax(board, depth, alpha, beta, isMaximizing, player) {
  if (depth === 0) {
    return { score: evaluateBoardScore(board, AI_PLAYER), move: null };
  }

  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) {
    return { score: evaluateBoardScore(board, AI_PLAYER), move: null };
  }

  let bestMove = candidates[0];

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of candidates) {
      const newBoard = board.simulateMove(move.row, move.col, AI_PLAYER);

      if (newBoard.checkWinner(move.row, move.col) === AI_PLAYER) {
        return { score: 1000000 + depth * 1000, move };
      }

      const result = minimax(newBoard, depth - 1, alpha, beta, false, PLAYER);
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of candidates) {
      const newBoard = board.simulateMove(move.row, move.col, PLAYER);

      if (newBoard.checkWinner(move.row, move.col) === PLAYER) {
        return { score: -1000000 - depth * 1000, move };
      }

      const result = minimax(newBoard, depth - 1, alpha, beta, true, AI_PLAYER);
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
}

/**
 * 评估棋盘整体分数（用于 Minimax）
 */
function evaluateBoardScore(board, player) {
  let score = 0;
  const size = board.size;
  const opponent = player === AI_PLAYER ? PLAYER : AI_PLAYER;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const stone = board.getStone(r, c);
      if (stone !== EMPTY) {
        const piecePlayer = stone;
        const pieceScore = board.evaluatePosition(r, c, piecePlayer);

        if (piecePlayer === player) {
          score += pieceScore;
        } else {
          score -= pieceScore * 1.1;
        }
      }
    }
  }

  return score;
}

/**
 * 困难难度：Minimax + Alpha-Beta 剪枝
 */
const MAX_SEARCH_DEPTH = 4;

function getHardMove(board) {
  let candidates = getCandidateMoves(board);
  if (candidates.length === 0) return null;

  // Move Ordering: 按启发式评分降序排序（好的走法先搜 → 剪枝更多）
  candidates = candidates.map(pos => ({
    row: pos.row,
    col: pos.col,
    score: board.evaluatePosition(pos.row, pos.col, AI_PLAYER)
          + board.evaluatePosition(pos.row, pos.col, PLAYER)
  })).sort((a, b) => b.score - a.score);

  let bestScore = -Infinity;
  let bestMove = { row: candidates[0].row, col: candidates[0].col };

  for (const move of candidates) {
    const newBoard = board.simulateMove(move.row, move.col, AI_PLAYER);

    if (newBoard.checkWinner(move.row, move.col) === AI_PLAYER) {
      return move;
    }

    const result = minimax(newBoard, MAX_SEARCH_DEPTH - 1, -Infinity, Infinity, false, PLAYER);

    if (result.score > bestScore) {
      bestScore = result.score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * 主入口：根据难度获取 AI 落子位置
 * @param {Board} board - 棋盘对象
 * @param {string} difficulty - 难度 "easy" | "medium" | "hard"
 * @returns {{row: number, col: number} | null} 落子位置
 */
function getAIMove(board, difficulty) {
  switch (difficulty) {
    case 'easy':
      return getEasyMove(board);
    case 'medium':
      return getMediumMove(board);
    case 'hard':
      return getHardMove(board);
    default:
      console.warn(`未知难度: ${difficulty}，使用简单难度`);
      return getEasyMove(board);
  }
}

// AI Worker 管理
let _aiWorker = null;
let _aiWorkerCallbacks = new Map();
let _aiRequestId = 0;

function _createAIWorker() {
  try {
    _aiWorker = new Worker('js/ai-worker.js');
    _aiWorker.onmessage = function(e) {
      const { id, move } = e.data;
      const resolve = _aiWorkerCallbacks.get(id);
      if (resolve) {
        _aiWorkerCallbacks.delete(id);
        resolve(move);
      }
    };
    _aiWorker.onerror = function() {
      _aiWorker = null; // 回退到同步模式
    };
  } catch (e) {
    _aiWorker = null; // Worker 不可用
  }
}

/**
 * 异步 AI 入口 — 在 Worker 中运行（浏览器）或同步回退（Node.js）
 * @param {Board} board - 棋盘对象
 * @param {string} difficulty - 难度
 * @returns {Promise<{row: number, col: number} | null>}
 */
function getAIMoveAsync(board, difficulty) {
  // Worker 不可用（Node.js）：同步回退
  if (typeof Worker === 'undefined') {
    return Promise.resolve(getAIMove(board, difficulty));
  }

  // 懒初始化 Worker（仅在浏览器中执行一次）
  if (!_aiWorker) {
    _createAIWorker();
    if (!_aiWorker) {
      // Worker 创建失败（如 file:// 协议），同步回退
      return Promise.resolve(getAIMove(board, difficulty));
    }
  }

  return new Promise(function(resolve) {
    const id = ++_aiRequestId;
    _aiWorkerCallbacks.set(id, resolve);
    _aiWorker.postMessage({
      type: 'getMove',
      grid: board.grid,
      currentPlayer: board.currentPlayer,
      difficulty: difficulty,
      id: id
    });
  });
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAIMove, getAIMoveAsync };
}

// 测试代码
if (typeof require !== 'undefined' && require.main === module) {
  const Board = require('./game.js').Board;
  const testBoard = new Board(15);

  testBoard.placeStone(7, 7, PLAYER);
  testBoard.placeStone(7, 8, PLAYER);
  testBoard.placeStone(7, 9, PLAYER);

  console.log('=== AI 测试 ===');
  console.log('测试简单难度:');
  const easyMove = getAIMove(testBoard, 'easy');
  console.log('简单难度结果:', easyMove);

  console.log('\n测试中等难度:');
  const mediumMove = getAIMove(testBoard, 'medium');
  console.log('中等难度结果:', mediumMove);

  console.log('\n测试困难难度:');
  const hardMove = getAIMove(testBoard, 'hard');
  console.log('困难难度结果:', hardMove);
}
