/**
 * 五子棋游戏核心模块
 * 棋盘数据模型 + 胜负判定
 */

class Board {
  constructor(size = 15) {
    this.size = size;
    this.grid = Array.from({ length: size }, () => Array(size).fill(0));
    this.currentPlayer = 1; // 1: 黑方, 2: 白方
    this.moveCount = 0;
    this._cacheVersion = 0;
    this._evalCache = new Map();
  }

  /**
   * 落子
   * @param {number} row - 行索引 (0-14)
   * @param {number} col - 列索引 (0-14)
   * @param {number} player - 玩家 (1: 黑方, 2: 白方)
   * @returns {boolean} 落子是否成功
   */
  placeStone(row, col, player = this.currentPlayer) {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return false;
    }
    if (this.grid[row][col] !== 0) {
      return false; // 位置已有棋子
    }
    this.grid[row][col] = player;
    this.currentPlayer = player === 1 ? 2 : 1;
    this.moveCount++;
    this._invalidateCache();
    return true;
  }

  /** 使评价缓存失效 */
  _invalidateCache() {
    this._cacheVersion++;
    this._evalCache.clear();
  }

  /**
   * 获取棋子
   * @param {number} row
   * @param {number} col
   * @returns {number} 0: 空, 1: 黑方, 2: 白方
   */
  getStone(row, col) {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return -1;
    }
    return this.grid[row][col];
  }

  /**
   * 检测胜负
   * @param {number} row - 最后落子位置
   * @param {number} col - 最后落子位置
   * @returns {Array|null} 获胜连线 [{row, col}, ...] 或 null
   */
  checkWin(row, col) {
    const player = this.grid[row][col];
    if (player === 0) return null;

    // 四个方向: 水平、垂直、左斜、右斜
    const directions = [
      { dr: 0, dc: 1 },  // 水平
      { dr: 1, dc: 0 },  // 垂直
      { dr: 1, dc: 1 },  // 左斜
      { dr: 1, dc: -1 }  // 右斜
    ];

    for (const { dr, dc } of directions) {
      const line = this.getLine(row, col, dr, dc, player);
      if (line.positions.length >= 5) {
        return line.positions.slice(0, 5);
      }
    }
    return null;
  }

  /**
   * 获取指定方向的连续棋子（扩展版）
   * @returns {{positions: Array<{row, col}>, openEnds: [boolean, boolean]}}
   */
  getLine(row, col, dr, dc, player) {
    const positions = [];

    // Only include starting position if it's the player's stone
    let r, c;
    if (this.grid[row][col] === player) {
      positions.push({ row, col });
    }

    // 正向查找
    r = row + dr;
    c = col + dc;
    while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === player) {
      positions.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    const forwardOpen = r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === 0;

    // 反向查找
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

  /**
   * 棋盘是否已满
   */
  isFull() {
    return this.moveCount >= this.size * this.size;
  }

  /**
   * 重置棋盘
   */
  reset() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.currentPlayer = 1;
    this.moveCount = 0;
    this._invalidateCache();
  }

  /**
   * 撤销落子
   * @param {number} row
   * @param {number} col
   * @returns {boolean} 是否成功
   */
  undoMove(row, col) {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return false;
    }
    if (this.grid[row][col] === 0) {
      return false;
    }
    this.grid[row][col] = 0;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.moveCount--;
    this._invalidateCache();
    return true;
  }

  /**
   * 检测平局（棋盘满且无胜者）
   * @returns {boolean} 是否平局
   */
  checkDraw() {
    return this.isFull();
  }

  /**
   * 检测胜负（返回获胜玩家）
   * @param {number} row - 最后落子位置
   * @param {number} col - 最后落子位置
   * @returns {number} 0: 无胜者, 1: 玩家1获胜, 2: 玩家2获胜
   */
  checkWinner(row, col) {
    const player = this.grid[row][col];
    if (player === 0) return 0;

    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];

    for (const { dr, dc } of directions) {
      const line = this.getLine(row, col, dr, dc, player);
      if (line.positions.length >= 5) {
        return player;
      }
    }
    return 0;
  }

  /**
   * 获取所有空位
   * @returns {Array<{row, col}>} 空位数组
   */
  getEmptyPositions() {
    const positions = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          positions.push({ row: r, col: c });
        }
      }
    }
    return positions;
  }

  /**
   * 复制棋盘（内部使用）
   * @returns {Board} 新的棋盘副本
   */
  copy() {
    const newBoard = new Board(this.size);
    newBoard.grid = this.grid.map(row => [...row]);
    newBoard.currentPlayer = this.currentPlayer;
    newBoard.moveCount = this.moveCount;
    return newBoard;
  }

  /**
   * 模拟落子（不修改原棋盘）
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {number} player - 玩家
   * @returns {Board} 落子后的新棋盘副本
   */
  simulateMove(row, col, player) {
    const newBoard = this.copy();
    newBoard.grid[row][col] = player;
    return newBoard;
  }

  /**
   * 评估某位置的攻防价值
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {number} player - 评估方
   * @returns {number} 攻防总分
   */
  evaluatePosition(row, col, player) {
    const key = `${row},${col},${player},${this._cacheVersion}`;
    if (this._evalCache.has(key)) return this._evalCache.get(key);

    const opponent = player === 1 ? 2 : 1;

    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];

    let totalScore = 0;

    for (const { dr, dc } of directions) {
      const line = this.getLine(row, col, dr, dc, player);

      // 己方评分
      const count = line.positions.length;
      const [fwd, bwd] = line.openEnds;
      const openEnds = (fwd ? 1 : 0) + (bwd ? 1 : 0);

      if (count >= 5) {
        totalScore += 100000;
      } else if (count === 4) {
        totalScore += openEnds === 2 ? 10000 : (openEnds === 1 ? 1000 : 0);
      } else if (count === 3) {
        totalScore += openEnds === 2 ? 1000 : (openEnds === 1 ? 100 : 0);
      } else if (count === 2) {
        totalScore += openEnds === 2 ? 100 : (openEnds === 1 ? 10 : 0);
      } else if (count === 1 && openEnds > 0) {
        totalScore += 1;
      }

      // 对手评分（防守考虑）
      const oppLine = this.getLine(row, col, dr, dc, opponent);
      const oppCount = oppLine.positions.length;
      const [oppFwd, oppBwd] = oppLine.openEnds;
      const oppOpenEnds = (oppFwd ? 1 : 0) + (oppBwd ? 1 : 0);

      if (oppCount >= 5) {
        totalScore += 100000;
      } else if (oppCount === 4) {
        totalScore += oppOpenEnds === 2 ? 10000 : (oppOpenEnds === 1 ? 1000 : 0);
      } else if (oppCount === 3) {
        totalScore += oppOpenEnds === 2 ? 1000 : (oppOpenEnds === 1 ? 100 : 0);
      } else if (oppCount === 2) {
        totalScore += oppOpenEnds === 2 ? 100 : (oppOpenEnds === 1 ? 10 : 0);
      }
}

    this._evalCache.set(key, totalScore);
    return totalScore;
  }
}

// 全局常量，供其他模块使用
window.BOARD_SIZE = 15;

