/**
 * AI Web Worker — 在独立线程中计算 AI 落子
 * 通过 postMessage 接收棋盘数据，返回落子结果
 */

// ====== 棋盘常量 ======
const EMPTY = 0;
const AI_PLAYER = 2;
const PLAYER = 1;

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 }
];

// ====== 轻量级 Board 实现（Worker 内独立） ======
class WorkerBoard {
  constructor(grid, currentPlayer) {
    this.grid = grid.map(row => [...row]);
    this.size = grid.length;
    this.currentPlayer = currentPlayer;
  }

  getStone(row, col) {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) return -1;
    return this.grid[row][col];
  }

  getLine(row, col, dr, dc, player) {
    const positions = [];
    let r, c;
    if (this.grid[row][col] === player) {
      positions.push({ row, col });
    }
    r = row + dr;
    c = col + dc;
    while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === player) {
      positions.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    const forwardOpen = r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === 0;
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === player) {
      positions.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }
    const backwardOpen = r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === 0;
    return { positions, openEnds: [forwardOpen, backwardOpen] };
  }

  checkWinner(row, col) {
    const player = this.grid[row][col];
    if (player === 0) return 0;
    for (const { dr, dc } of DIRECTIONS) {
      const line = this.getLine(row, col, dr, dc, player);
      if (line.positions.length >= 5) return player;
    }
    return 0;
  }

  evaluatePosition(row, col, player) {
    const opponent = player === 1 ? 2 : 1;
    let totalScore = 0;
    for (const { dr, dc } of DIRECTIONS) {
      const line = this.getLine(row, col, dr, dc, player);
      const count = line.positions.length;
      const openEnds = (line.openEnds[0] ? 1 : 0) + (line.openEnds[1] ? 1 : 0);
      if (count >= 5) totalScore += 100000;
      else if (count === 4) totalScore += openEnds === 2 ? 10000 : (openEnds === 1 ? 1000 : 0);
      else if (count === 3) totalScore += openEnds === 2 ? 1000 : (openEnds === 1 ? 100 : 0);
      else if (count === 2) totalScore += openEnds === 2 ? 100 : (openEnds === 1 ? 10 : 0);
      else if (count === 1 && openEnds > 0) totalScore += 1;

      const oppLine = this.getLine(row, col, dr, dc, opponent);
      const oppCount = oppLine.positions.length;
      const oppOpenEnds = (oppLine.openEnds[0] ? 1 : 0) + (oppLine.openEnds[1] ? 1 : 0);
      if (oppCount >= 5) totalScore += 100000;
      else if (oppCount === 4) totalScore += oppOpenEnds === 2 ? 10000 : (oppOpenEnds === 1 ? 1000 : 0);
      else if (oppCount === 3) totalScore += oppOpenEnds === 2 ? 1000 : (oppOpenEnds === 1 ? 100 : 0);
      else if (oppCount === 2) totalScore += oppOpenEnds === 2 ? 100 : (oppOpenEnds === 1 ? 10 : 0);
    }
    return totalScore;
  }

  getEmptyPositions() {
    const positions = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) positions.push({ row: r, col: c });
      }
    }
    return positions;
  }

  getCandidateMoves() {
    const size = this.size;
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const candidates = [];
    let hasAny = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c] !== EMPTY) {
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size
                  && this.grid[nr][nc] === EMPTY && !visited[nr][nc]) {
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

  simulateMove(row, col, player) {
    const newGrid = this.grid.map(r => [...r]);
    newGrid[row][col] = player;
    const nextPlayer = player === 1 ? 2 : 1;
    const newBoard = new WorkerBoard(newGrid, nextPlayer);
    return newBoard;
  }
}

// ====== AI 算法 ======
function getEasyMove(board) {
  const empty = board.getEmptyPositions();
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function getMediumMove(board) {
  const empty = board.getEmptyPositions();
  if (empty.length === 0) return null;
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const pos of empty) {
    const score = board.evaluatePosition(pos.row, pos.col, AI_PLAYER)
               + board.evaluatePosition(pos.row, pos.col, PLAYER);
    if (score > bestScore) { bestScore = score; bestMove = pos; }
  }
  return bestMove;
}

function evaluateBoardScore(board, player) {
  let score = 0;
  const size = board.size;
  const opponent = player === AI_PLAYER ? PLAYER : AI_PLAYER;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const stone = board.grid[r][c];
      if (stone !== EMPTY) {
        const ps = board.evaluatePosition(r, c, stone);
        score += (stone === player) ? ps : -ps * 1.1;
      }
    }
  }
  return score;
}

const MAX_SEARCH_DEPTH = 4;

function minimax(board, depth, alpha, beta, isMaximizing, player) {
  if (depth === 0) return { score: evaluateBoardScore(board, AI_PLAYER), move: null };
  const candidates = board.getCandidateMoves();
  if (candidates.length === 0) return { score: evaluateBoardScore(board, AI_PLAYER), move: null };
  let bestMove = candidates[0];
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of candidates) {
      const nb = board.simulateMove(move.row, move.col, AI_PLAYER);
      if (nb.checkWinner(move.row, move.col) === AI_PLAYER)
        return { score: 1000000 + depth * 1000, move };
      const r = minimax(nb, depth - 1, alpha, beta, false, PLAYER);
      if (r.score > maxScore) { maxScore = r.score; bestMove = move; }
      alpha = Math.max(alpha, r.score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of candidates) {
      const nb = board.simulateMove(move.row, move.col, PLAYER);
      if (nb.checkWinner(move.row, move.col) === PLAYER)
        return { score: -1000000 - depth * 1000, move };
      const r = minimax(nb, depth - 1, alpha, beta, true, AI_PLAYER);
      if (r.score < minScore) { minScore = r.score; bestMove = move; }
      beta = Math.min(beta, r.score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
}

function getHardMove(board) {
  let candidates = board.getCandidateMoves();
  if (candidates.length === 0) return null;
  // Move Ordering
  candidates = candidates.map(pos => ({
    row: pos.row, col: pos.col,
    score: board.evaluatePosition(pos.row, pos.col, AI_PLAYER)
          + board.evaluatePosition(pos.row, pos.col, PLAYER)
  })).sort((a, b) => b.score - a.score);
  let bestScore = -Infinity;
  let bestMove = { row: candidates[0].row, col: candidates[0].col };
  for (const move of candidates) {
    const nb = board.simulateMove(move.row, move.col, AI_PLAYER);
    if (nb.checkWinner(move.row, move.col) === AI_PLAYER) return move;
    const r = minimax(nb, MAX_SEARCH_DEPTH - 1, -Infinity, Infinity, false, PLAYER);
    if (r.score > bestScore) { bestScore = r.score; bestMove = move; }
  }
  return bestMove;
}

function getAIMoveWorker(board, difficulty) {
  switch (difficulty) {
    case 'easy': return getEasyMove(board);
    case 'medium': return getMediumMove(board);
    case 'hard': return getHardMove(board);
    default: return getEasyMove(board);
  }
}

// ====== 消息处理器 ======
self.onmessage = function(e) {
  const { type, grid, currentPlayer, difficulty, id } = e.data;
  if (type !== 'getMove') return;

  const board = new WorkerBoard(grid, currentPlayer);
  const move = getAIMoveWorker(board, difficulty);

  self.postMessage({ id, move });
};
