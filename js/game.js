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
   * 打印棋盘（调试用）
   */
  print() {
    const symbols = { 0: '.', 1: 'X', 2: 'O' };
    console.log('  0 1 2 3 4 5 6 7 8 9 A B C D E');
    for (let i = 0; i < this.size; i++) {
      const row = this.grid[i].map(v => symbols[v]).join(' ');
      console.log(`${i.toString(16).toUpperCase()} ${row}`);
    }
  }
}

// ============ 测试代码 ============
function runTests() {
  console.log('=== 五子棋核心模块测试 ===\n');

  // 测试1: 棋盘创建
  console.log('【测试1】棋盘创建');
  const board = new Board();
  console.log(`棋盘尺寸: ${board.size}x${board.size}`);
  console.log(`初始棋子数: ${board.moveCount}`);
  board.print();
  console.log('');

  // 测试2: 落子
  console.log('【测试2】落子功能');
  board.placeStone(7, 7, 1); // 黑方落子中心
  board.placeStone(6, 7, 2); // 白方落子
  board.placeStone(7, 6, 1); // 黑方落子
  board.print();
  console.log('');

  // 测试3: 胜负检测 - 水平方向
  console.log('【测试3】胜负检测 - 水平方向');
  const board2 = new Board();
  board2.placeStone(0, 0, 1);
  board2.placeStone(0, 1, 1);
  board2.placeStone(0, 2, 1);
  board2.placeStone(0, 3, 1);
  board2.placeStone(0, 4, 1); // 连五
  const win1 = board2.checkWin(0, 4);
  console.log('水平连五:', win1 ? JSON.stringify(win1) : '无');
  console.log('');

  // 测试4: 胜负检测 - 垂直方向
  console.log('【测试4】胜负检测 - 垂直方向');
  const board3 = new Board();
  board3.placeStone(0, 0, 1);
  board3.placeStone(1, 0, 1);
  board3.placeStone(2, 0, 1);
  board3.placeStone(3, 0, 1);
  board3.placeStone(4, 0, 1); // 连五
  const win2 = board3.checkWin(4, 0);
  console.log('垂直连五:', win2 ? JSON.stringify(win2) : '无');
  console.log('');

  // 测试5: 胜负检测 - 左斜方向
  console.log('【测试5】胜负检测 - 左斜方向');
  const board4 = new Board();
  board4.placeStone(4, 0, 1);
  board4.placeStone(3, 1, 1);
  board4.placeStone(2, 2, 1);
  board4.placeStone(1, 3, 1);
  board4.placeStone(0, 4, 1); // 连五
  const win3 = board4.checkWin(0, 4);
  console.log('左斜连五:', win3 ? JSON.stringify(win3) : '无');
  console.log('');

  // 测试6: 胜负检测 - 右斜方向
  console.log('【测试6】胜负检测 - 右斜方向');
  const board5 = new Board();
  board5.placeStone(0, 0, 1);
  board5.placeStone(1, 1, 1);
  board5.placeStone(2, 2, 1);
  board5.placeStone(3, 3, 1);
  board5.placeStone(4, 4, 1); // 连五
  const win4 = board5.checkWin(4, 4);
  console.log('右斜连五:', win4 ? JSON.stringify(win4) : '无');
  console.log('');

  // 测试7: 未获胜检测
  console.log('【测试7】未获胜检测');
  const board6 = new Board();
  board6.placeStone(0, 0, 1);
  board6.placeStone(0, 1, 1);
  board6.placeStone(0, 2, 1);
  const noWin = board6.checkWin(0, 2);
  console.log('仅三子:', noWin ? JSON.stringify(noWin) : '无 (正确)');
  console.log('');

  // 测试8: 棋盘满检测
  console.log('【测试8】棋盘满检测');
  const board7 = new Board(3);
  console.log(`3x3空棋盘已满: ${board7.isFull()}`);
  board7.placeStone(0, 0, 1);
  board7.placeStone(0, 1, 2);
  board7.placeStone(0, 2, 1);
  board7.placeStone(1, 0, 2);
  board7.placeStone(1, 1, 1);
  board7.placeStone(1, 2, 2);
  board7.placeStone(2, 0, 1);
  board7.placeStone(2, 1, 2);
  board7.placeStone(2, 2, 1);
  console.log(`3x3棋盘落9子后已满: ${board7.isFull()}`);
  console.log('');

  // 测试9: 重置功能
  console.log('【测试9】重置功能');
  board.reset();
  console.log(`重置后棋子数: ${board.moveCount}`);
  board.print();

  console.log('\n=== 所有测试完成 ===');
}

// 运行测试
runTests();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Board };
}