# 悔棋 + 计时器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为五子棋增加悔棋 (Undo) 和每步30秒限时计时器功能

**Architecture:** Board 类增加 undoMove 方法；ui.js 增加计时器系统和悔棋逻辑；index.html + style.css 增加对应的 DOM 和样式。纯原生 JS，无框架。

**Tech Stack:** HTML5 + CSS3 + JavaScript

**设计文档:** `docs/superpowers/specs/2026-05-10-undo-timer-design.md`

---

### Task 1: Board.undoMove() — game.js

**文件:**
- Modify: `js/game.js`（Board 类中增加方法）
- Create: `tests/board.test.js`
- Modify: `tests/index.html`（引入新测试文件）

- [ ] **Step 1: 编写 Board.undoMove() 测试**

新建 `tests/board.test.js`:

```js
/**
 * Board 类单元测试
 */
QUnit.module('Board', function() {

  QUnit.test('undoMove should clear stone and revert state', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    assert.equal(board.grid[7][7], 1, 'Stone at (7,7)');
    assert.equal(board.currentPlayer, 2, 'currentPlayer = 2');
    assert.equal(board.moveCount, 1, 'moveCount = 1');

    board.undoMove(7, 7);
    assert.equal(board.grid[7][7], 0, 'Stone removed');
    assert.equal(board.currentPlayer, 1, 'currentPlayer reverted to 1');
    assert.equal(board.moveCount, 0, 'moveCount = 0');
  });

  QUnit.test('undoMove should revert correctly with multiple moves', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    board.placeStone(7, 8, 2);
    board.placeStone(8, 7, 1);
    assert.equal(board.moveCount, 3);

    board.undoMove(8, 7);
    assert.equal(board.grid[8][7], 0);
    assert.equal(board.currentPlayer, 2);
    assert.equal(board.moveCount, 2);

    board.undoMove(7, 8);
    assert.equal(board.currentPlayer, 1);
    assert.equal(board.moveCount, 1);
  });

  QUnit.test('undoMove on empty cell should not change state', function(assert) {
    const board = new Board(15);
    board.placeStone(7, 7, 1);
    const prevCount = board.moveCount;
    const prevPlayer = board.currentPlayer;

    board.undoMove(3, 3);
    assert.equal(board.moveCount, prevCount);
    assert.equal(board.currentPlayer, prevPlayer);
    assert.equal(board.grid[3][3], 0);
  });

});
```

- [ ] **Step 2: 在 tests/index.html 中引入测试文件**

在 `tests/index.html` 中，`<script src="../js/game.js"></script>` 之后添加：

```html
<script src="board.test.js"></script>
```

- [ ] **Step 3: 打开 tests/index.html 确认测试失败**

浏览器打开 `tests/index.html`，确认 Board 测试显示 RED（FAIL），因为 `undoMove` 尚未实现。

- [ ] **Step 4: 实现 Board.undoMove()**

在 `js/game.js` 的 Board 类中，`reset()` 方法之前添加：

```js
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
```

- [ ] **Step 5: 打开 tests/index.html 确认测试通过**

确认 Board 测试全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add js/game.js tests/board.test.js tests/index.html
git commit -m "feat: 添加 Board.undoMove() 方法及单元测试"
```

---

### Task 2: 计时器 DOM + 样式

**文件:**
- Modify: `index.html`
- Modify: `css/style.css`

- [ ] **Step 1: 在 index.html 中添加计时器 DOM**

状态栏 `<div id="status">` 和棋盘 `<div id="board">` 之间插入：

```html
    <!-- 计时器 -->
    <div id="timer-container">
      <span id="timer-black" class="timer-active">黑方 30s</span>
      <span class="timer-separator">|</span>
      <span id="timer-white">白方 30s</span>
    </div>
```

- [ ] **Step 2: 在 style.css 末尾添加计时器样式**

```css
/* ========== 计时器样式 ========== */
#timer-container {
  text-align: center;
  font-size: 1.1rem;
  padding: 8px 0;
  font-family: 'Georgia', serif;
  letter-spacing: 1px;
  user-select: none;
}

#timer-container .timer-separator {
  margin: 0 16px;
  color: #8b7355;
  opacity: 0.6;
}

#timer-container span {
  transition: color 0.3s ease;
}

.timer-active {
  font-weight: bold;
  color: #4a3728;
}

.timer-warning {
  color: #d32f2f !important;
}

.timer-critical {
  color: #d32f2f !important;
  animation: timer-blink 0.5s ease-in-out infinite;
}

@keyframes timer-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 3: 提交**

```bash
git add index.html css/style.css
git commit -m "feat: 添加计时器 DOM 元素和样式"
```

---

### Task 3: 计时器逻辑 — ui.js

**文件:**
- Modify: `js/ui.js`

- [ ] **Step 1: 添加计时器常量和变量**

`GameState` 对象之后添加：

```js
// 计时器常量
const TIMER_LIMIT = 30;

// 计时器状态
const TimerState = {
  black: TIMER_LIMIT,
  white: TIMER_LIMIT,
  interval: null,
  active: null // 'black' | 'white' | null
};
```

- [ ] **Step 2: 实现计时器核心函数集合**

`updateRestartButton()` 之后添加以下全部函数：

```js
function startTimer() {
  if (GameState.isGameOver || GameState.isReplaying) return;
  if (GameState.mode === 'ai' && GameState.board.currentPlayer !== 1) return;

  const player = GameState.board.currentPlayer === 1 ? 'black' : 'white';
  TimerState.active = player;
  updateTimerDisplay();

  if (TimerState.interval) clearInterval(TimerState.interval);
  TimerState.interval = setInterval(() => {
    TimerState[player]--;
    updateTimerDisplay();

    if (TimerState[player] <= 0) {
      clearInterval(TimerState.interval);
      TimerState.interval = null;
      handleTimeout(player);
    }
  }, 1000);
}

function stopTimer() {
  if (TimerState.interval) {
    clearInterval(TimerState.interval);
    TimerState.interval = null;
  }
  TimerState.active = null;
  updateTimerDisplay();
}

function switchTimer() {
  stopTimer();
  startTimer();
}

function resetTimers() {
  stopTimer();
  TimerState.black = TIMER_LIMIT;
  TimerState.white = TIMER_LIMIT;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const blackEl = document.getElementById('timer-black');
  const whiteEl = document.getElementById('timer-white');
  if (!blackEl || !whiteEl) return;

  blackEl.textContent = `黑方 ${TimerState.black}s`;
  whiteEl.textContent = `白方 ${TimerState.white}s`;

  blackEl.classList.toggle('timer-active', TimerState.active === 'black');
  whiteEl.classList.toggle('timer-active', TimerState.active === 'white');

  [blackEl, whiteEl].forEach((el, i) => {
    const time = i === 0 ? TimerState.black : TimerState.white;
    el.classList.remove('timer-warning', 'timer-critical');
    if (time <= 3) {
      el.classList.add('timer-critical');
    } else if (time <= 5) {
      el.classList.add('timer-warning');
    }
  });
}

function handleTimeout(player) {
  GameState.isGameOver = true;
  const winner = player === 'black' ? 2 : 1;
  const winnerName = winner === 1 ? '黑方' : '白方';
  const loserName = player === 'black' ? '黑方' : '白方';

  const status = document.getElementById('status');
  if (status) {
    const modeText = GameState.mode === 'ai'
      ? (winner === 2 ? 'AI' : '你')
      : winnerName;
    status.textContent = `${loserName}超时，${modeText}获胜！`;
    status.className = 'status win';
  }

  updateRestartButton();
}
```

- [ ] **Step 3: 集成到 initGame()**

`initGame()` 末尾，`createBoardDOM()` 和 `bindEvents()` 之后添加：

```js
  // 启动计时器
  resetTimers();
  startTimer();
```

- [ ] **Step 4: 修改 placeStone() — AI 回合暂停计时**

`placeStone()` 中，在 `updateStatus()` 之后、`if (GameState.mode === 'ai' && GameState.board.currentPlayer === 2)` 之前插入：

```js
  // 切换回合
  updateStatus();

  // AI 回合暂停玩家计时
  if (GameState.mode === 'ai' && GameState.board.currentPlayer === 2) {
    stopTimer();
  }

  // 如果是人机模式且是 AI 回合
  if (GameState.mode === 'ai' && GameState.board.currentPlayer === 2) {
```

- [ ] **Step 5: 修改 handleBoardClick() — PvP 切换计时**

将 `handleBoardClick()` 改为：

```js
function handleBoardClick(e) {
  if (GameState.isGameOver || GameState.isAIThinking) return;
  if (GameState.isReplaying) return;

  const cell = e.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);

  placeStone(row, col);

  // PvP 模式落子后切换计时器
  if (GameState.mode === 'pvp' && !GameState.isGameOver) {
    switchTimer();
  }
}
```

- [ ] **Step 6: 修改 triggerAIMove() — AI 落子后恢复计时**

将 `triggerAIMove()` 改为：

```js
function triggerAIMove() {
  GameState.isAIThinking = true;
  updateStatus();

  if (GameState._aiTimer) {
    clearTimeout(GameState._aiTimer);
  }

  GameState._aiTimer = setTimeout(() => {
    const aiMove = getAIMove(GameState.board.grid, GameState.difficulty);

    if (aiMove) {
      placeStone(aiMove.row, aiMove.col);
    }

    GameState.isAIThinking = false;
    GameState._aiTimer = null;

    // AI 完成后恢复玩家计时
    if (!GameState.isGameOver && GameState.board.currentPlayer === 1) {
      startTimer();
    }
  }, 500);
}
```

- [ ] **Step 7: 修改 restartGame() — 重置计时**

在 `GameState.moveHistory = [];` 之后添加：

```js
  // 重置计时器
  resetTimers();
  startTimer();
```

- [ ] **Step 8: 修改 startReplay() — 暂停计时**

在 `GameState.isReplaying = true;` 之后添加：

```js
  stopTimer();
```

- [ ] **Step 9: 提交**

```bash
git add js/ui.js
git commit -m "feat: 添加计时器逻辑并集成到对局流程"
```

---

### Task 4: 悔棋按钮 + 逻辑 — ui.js + index.html

**文件:**
- Modify: `index.html`
- Modify: `js/ui.js`

- [ ] **Step 1: 在 index.html 中添加悔棋按钮**

在 header-controls 中，"重新开始"按钮之后添加：

```html
        <button type="button" id="restart">重新开始</button>
        <button type="button" id="undo-btn" disabled>悔棋</button>
        <button type="button" id="settings" aria-label="设置">⚙️</button>
```

- [ ] **Step 2: 实现 undoLastMove() 和按钮绑定**

在 `updateRestartButton()` 之后添加：

```js
/**
 * 悔棋逻辑
 */
function undoLastMove() {
  if (GameState.isAIThinking || GameState.isReplaying) return;
  if (GameState.moveHistory.length === 0) return;

  // 先停止计时器（游戏结束后可能没有活跃计时器，但 stopTimer 安全可重入）
  stopTimer();

  // 清除获胜高亮（如果游戏已结束）
  if (GameState.isGameOver) {
    document.querySelectorAll('.stone-winning').forEach(el => {
      el.classList.remove('stone-winning');
    });
    GameState.isGameOver = false;
  }

  // AI 模式撤回两步，PvP 模式撤回一步
  const stepsToUndo = GameState.mode === 'ai' ? 2 : 1;

  for (let i = 0; i < stepsToUndo; i++) {
    if (GameState.moveHistory.length === 0) break;

    const move = GameState.moveHistory.pop();
    GameState.board.undoMove(move.row, move.col);

    // 清除 DOM 棋子样式
    const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
    if (cell) {
      cell.classList.remove('occupied', 'stone-black', 'stone-white');
    }
  }

  // 更新状态
  updateStatus();
  updateUndoButton();

  // 重新启动计时器
  startTimer();
}

/**
 * 更新悔棋按钮禁用状态
 */
function updateUndoButton() {
  const btn = document.getElementById('undo-btn');
  if (!btn) return;

  // AI 思考中或回放中禁用（游戏结束后不禁用，允许撤回致胜/致负步）
  if (GameState.isAIThinking || GameState.isReplaying) {
    btn.disabled = true;
    return;
  }

  if (GameState.moveHistory.length === 0) {
    btn.disabled = true;
    return;
  }

  // AI 模式：需要至少 2 步才能撤回（玩家+AI）
  if (GameState.mode === 'ai' && GameState.moveHistory.length < 2) {
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}
```

- [ ] **Step 3: 绑定悔棋按钮事件**

在 `bindEvents()` 中，"重新开始"按钮事件绑定之后添加：

```js
  // 悔棋按钮
  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undoLastMove);
  }
```

- [ ] **Step 4: 在关键流程中更新按钮状态**

**4a. 在 `handleBoardClick()` 的末尾（placeStone 调用之后）添加：**

```js
  // 落子后更新悔棋按钮
  updateUndoButton();
```

所以要再改一下 handleBoardClick，加上这行。现在的 `handleBoardClick` 应该是：

```js
function handleBoardClick(e) {
  if (GameState.isGameOver || GameState.isAIThinking) return;
  if (GameState.isReplaying) return;

  const cell = e.target.closest('.cell');
  if (!cell) return;

  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);

  placeStone(row, col);

  // PvP 模式落子后切换计时器
  if (GameState.mode === 'pvp' && !GameState.isGameOver) {
    switchTimer();
  }

  updateUndoButton();
}
```

**4b. 在 `handleWin()` 和 `handleDraw()` 末尾添加：**

```js
  updateUndoButton();
```

**4c. 在 `restartGame()` 中添加：**

```js
  updateUndoButton();
```

- [ ] **Step 5: 提交**

```bash
git add index.html js/ui.js
git commit -m "feat: 添加悔棋功能"
```

---

### Task 5: 集成验证

**方式:** 在浏览器中手动测试

- [ ] **Step 1: 启动本地服务器并打开页面**

```bash
cd "D:/AI-IDE/Gomoku"
python -m http.server 8080
```
浏览器访问 `http://localhost:8080`

- [ ] **Step 2: 测试计时器 - PvP 模式**

- 选择"双人"模式 → 黑方计时器开始倒计时
- 黑方落子 → 黑方计时停止，白方计时开始
- 白方落子 → 白方计时停止，黑方计时重新开始（30s）
- 等待计时 ≤5s → 数字变红；≤3s → 红色闪烁
- 等待计时归零 → 显示"X方超时，Y方获胜！"

- [ ] **Step 3: 测试计时器 - AI 模式**

- 选择"人机"模式 → 玩家（黑方）计时器开始
- 玩家落子 → 计时暂停，AI 思考
- AI 落子 → 玩家计时器从 30s 重新开始
- 等待计时超时 → 显示"黑方超时，AI获胜！"

- [ ] **Step 4: 测试计时器 - 回放模式**

- 完成一局后，进入回放 → 计时器停止显示
- 回放结束或点击重新开始 → 计时器恢复

- [ ] **Step 5: 测试悔棋 - PvP 模式**

- 双人模式落 3 步 → 点击悔棋 → 最后一步被撤销，回合回到上一玩家
- 连续悔棋直到无棋可撤 → 按钮变灰禁用
- 游戏结束后点击悔棋 → 游戏状态恢复，可继续落子

- [ ] **Step 6: 测试悔棋 - AI 模式**

- 人机模式落 1 步（玩家+AI回应）→ 点击悔棋 → 同时撤销玩家和 AI 的棋子
- 落 1 步（AI 还没回应时）→ 悔棋按钮应禁用（不足2步不能撤）
- 悔棋后计时器归零重新倒计时（30s）

- [ ] **Step 7: 测试边界情况**

- 悔棋后获胜高亮被清除
- 重新开始后计时器重置为 30s
- 快速连续点击悔棋不崩溃
- 计时器超时后不能悔棋
