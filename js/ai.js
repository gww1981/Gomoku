/**
 * 五子棋 AI 模块
 * 三级难度：简单（随机）、中等（启发式评分）、困难（Minimax + Alpha-Beta）
 */

const AI_PLAYER = 2;
const PLAYER = 1;
const EMPTY = 0;

// BOARD_SIZE from game.js

// 方向向量：水平、垂直、左斜、右斜
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 }
];

/**
 * 获取所有空位
 */
function getEmptyPositions(board) {
  const positions = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === EMPTY) {
        positions.push({ row: r, col: c });
      }
    }
  }
  return positions;
}

/**
 * 简单难度：随机选择空位
 */
function getEasyMove(board) {
  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  const move = emptyPositions[randomIndex];
  console.log(`[AI Easy] 随机选择: (${move.row}, ${move.col})`);
  return move;
}

/**
 * 评估某位置的连子模式
 * 返回分数，反映该位置的攻防价值
 */
function evaluatePattern(board, row, col, player) {
  const opponent = player === AI_PLAYER ? PLAYER : AI_PLAYER;
  let score = 0;

  for (const { dr, dc } of DIRECTIONS) {
    // 收集该方向上的连续棋子
    let count = 1;
    let openEnds = 0; // 开放端点数量

    // 正向
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
      openEnds++;
    }

    // 反向
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
      openEnds++;
    }

    // 根据连子数和时间评分
    if (count >= 5) {
      score += 100000; // 活四/冲四，能赢
    } else if (count === 4) {
      if (openEnds === 2) {
        score += 10000; // 活四
      } else if (openEnds === 1) {
        score += 1000; // 冲四
      }
    } else if (count === 3) {
      if (openEnds === 2) {
        score += 1000; // 活三
      } else if (openEnds === 1) {
        score += 100; // 眠三
      }
    } else if (count === 2) {
      if (openEnds === 2) {
        score += 100; // 活二
      } else if (openEnds === 1) {
        score += 10; // 眠二
      }
    } else if (count === 1 && openEnds > 0) {
      score += 1;
    }
  }

  return score;
}

/**
 * 中等难度：启发式评分
 */
function getMediumMove(board) {
  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = emptyPositions[0];

  for (const pos of emptyPositions) {
    // 评估进攻分数（AI 落子）
    const attackScore = evaluatePattern(board, pos.row, pos.col, AI_PLAYER);

    // 评估防守分数（阻止玩家）
    const defenseScore = evaluatePattern(board, pos.row, pos.col, PLAYER);

    const totalScore = attackScore + defenseScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = pos;
    }
  }

  console.log(`[AI Medium] 最佳位置: (${bestMove.row}, ${bestMove.col}), 评分: ${bestScore}`);
  return bestMove;
}

/**
 * 检查是否有人获胜
 */
function checkWinner(board, row, col, player) {
  for (const { dr, dc } of DIRECTIONS) {
    let count = 1;

    // 正向查找
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }

    // 反向查找
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 5) {
      return player;
    }
  }
  return null;
}

/**
 * 复制棋盘
 */
function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * 模拟落子
 */
function simulateMove(board, row, col, player) {
  const newBoard = copyBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

/**
 * 评估棋盘整体分数（用于 Minimax）
 */
function evaluateBoard(board, player) {
  let score = 0;

  // 遍历所有非空位，评估其价值
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        const piecePlayer = board[r][c];
        const pieceScore = evaluatePattern(board, r, c, piecePlayer);

        if (piecePlayer === player) {
          score += pieceScore;
        } else {
          score -= pieceScore * 1.1; // 对手威胁加权（略高于己方以优先防守）
        }
      }
    }
  }

  return score;
}

/**
 * 获取候选落子位置（减少搜索空间）
 */
function getCandidateMoves(board) {
  const candidates = new Set();

  // 只考虑已有棋子周围的位置
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  // 如果棋盘为空，返回中心点
  if (candidates.size === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
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
  // 终止条件
  if (depth === 0) {
    return { score: evaluateBoard(board, AI_PLAYER), move: null };
  }

  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) {
    return { score: evaluateBoard(board, AI_PLAYER), move: null };
  }

  let bestMove = candidates[0];

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of candidates) {
      const newBoard = simulateMove(board, move.row, move.col, AI_PLAYER);

      // 检查是否 AI 获胜
      if (checkWinner(newBoard, move.row, move.col, AI_PLAYER)) {
        return { score: 1000000 + depth * 1000, move };
      }

      const result = minimax(newBoard, depth - 1, alpha, beta, false, PLAYER);
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break; // 剪枝
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of candidates) {
      const newBoard = simulateMove(board, move.row, move.col, PLAYER);

      // 检查是否玩家获胜
      if (checkWinner(newBoard, move.row, move.col, PLAYER)) {
        return { score: -1000000 - depth * 1000, move };
      }

      const result = minimax(newBoard, depth - 1, alpha, beta, true, AI_PLAYER);
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break; // 剪枝
    }
    return { score: minScore, move: bestMove };
  }
}

/**
 * 困难难度：Minimax + Alpha-Beta 剪枝，深度 4
 */
function getHardMove(board) {
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return null;

  // 第一层使用更有限的搜索以提高性能
  let bestScore = -Infinity;
  let bestMove = candidates[0];

  const depth = 4;

  for (const move of candidates) {
    const newBoard = simulateMove(board, move.row, move.col, AI_PLAYER);

    // 快速检查：如果能赢，直接选择
    if (checkWinner(newBoard, move.row, move.col, AI_PLAYER)) {
      console.log(`[AI Hard] 发现必胜点: (${move.row}, ${move.col})`);
      return move;
    }

    const result = minimax(newBoard, depth - 1, -Infinity, Infinity, false, PLAYER);

    if (result.score > bestScore) {
      bestScore = result.score;
      bestMove = move;
    }
  }

  console.log(`[AI Hard] 最佳位置: (${bestMove.row}, ${bestMove.col}), 评分: ${bestScore}`);
  return bestMove;
}

/**
 * 主入口：根据难度获取 AI 落子位置
 * @param {number[][]} board - 15x15 棋盘，0=空，1=玩家，2=AI
 * @param {string} difficulty - 难度 "easy" | "medium" | "hard"
 * @returns {{row: number, col: number}} 落子位置
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
  module.exports = { getAIMove, getEmptyPositions, getCandidateMoves };
}

// 测试代码
if (typeof require !== 'undefined' && require.main === module) {
  // 创建测试棋盘
  const testBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

  // 放置一些测试棋子
  testBoard[7][7] = PLAYER;
  testBoard[7][8] = PLAYER;
  testBoard[7][9] = PLAYER;

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