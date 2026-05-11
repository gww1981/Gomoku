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
    return true;
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
      if (line.length >= 5) {
        return line.slice(0, 5);
      }
    }
    return null;
  }

  /**
   * 获取指定方向的连续棋子
   */
  getLine(row, col, dr, dc, player) {
    const line = [{ row, col }];

    // 正向查找
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === player) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // 反向查找
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.grid[r][c] === player) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    return line;
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
    return true;
  }

  /**
   * 检测平局（棋盘满且无胜者）
   * @returns {boolean} 是否平局
   */
  checkDraw() {
    return this.isFull();
  }
}

// 全局常量，供其他模块使用
window.BOARD_SIZE = 15;

