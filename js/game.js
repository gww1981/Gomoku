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
   * 检测平局（棋盘满且无胜者）
   * @returns {boolean} 是否平局
   */
  checkDraw() {
    return this.isFull();
  }
}

// 全局常量，供其他模块使用
window.BOARD_SIZE = 15;

// 预设背景配置
const PRESET_BACKGROUNDS = {
    'preset-1': 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1920',
    'preset-2': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    'preset-3': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=1920',
    'preset-4': 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=1920'
};
const STORAGE_KEY = 'gomoku_background';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// 应用背景图片
function applyBackground(bgValue) {
    if (PRESET_BACKGROUNDS[bgValue]) {
        document.body.style.backgroundImage = `url('${PRESET_BACKGROUNDS[bgValue]}')`;
    } else if (bgValue.startsWith('data:')) {
        document.body.style.backgroundImage = `url('${bgValue}')`;
    }
}

// 保存背景设置到 localStorage
function saveBackgroundSetting(bgValue) {
    try {
        localStorage.setItem(STORAGE_KEY, bgValue);
    } catch (e) {
        console.warn('无法保存背景设置:', e);
    }
}

// 从 localStorage 加载背景设置
function loadBackgroundSetting() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            applyBackground(saved);
            return saved;
        }
        return null;
    } catch (e) {
        console.warn('无法加载背景设置:', e);
        return null;
    }
}

// 将文件转为 Base64 DataURL
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_FILE_SIZE) {
            reject(new Error('图片大小不能超过 2MB'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}