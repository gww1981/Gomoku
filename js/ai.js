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
 * 简单难度：随机选择空位
 */
function getEasyMove(board) {
  const emptyPositions = board.getEmptyPositions();
  if (emptyPositions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  return emptyPositions[randomIndex];
}

/**
 * 中等难度：启发式评分
 */
function getMediumMove(board) {
  const emptyPositions = board.getEmptyPositions();
  if (emptyPositions.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = emptyPositions[0];

  for (const pos of emptyPositions) {
    const attackScore = board.evaluatePosition(pos.row, pos.col, AI_PLAYER);
    const defenseScore = board.evaluatePosition(pos.row, pos.col, PLAYER);
    const totalScore = attackScore + defenseScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = pos;
    }
  }

  return bestMove;
}

/**
 * 获取候选落子位置（减少搜索空间）
 */
function getCandidateMoves(board) {
  const candidates = new Set();
  const size = board.size;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board.getStone(r, c) !== EMPTY) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board.getStone(nr, nc) === EMPTY) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  if (candidates.size === 0) {
    const center = Math.floor(size / 2);
    return [{ row: center, col: center }];
  }

  return Array.from(candidates).map(key => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
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
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = candidates[0];

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

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAIMove };
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
