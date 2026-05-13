# 模式选择与开始按钮 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 页面加载后进入"未开始"状态，用户选择模式后点击"开始"才启动游戏，游戏结束"再来一局"直接重启

**Architecture:** 采用 `isStarted` + `isGameOver` 两个标志正交组合控制三种页面状态（未开始/进行中/已结束），状态栏根据状态动态渲染不同内容

**Tech Stack:** 纯 HTML5 + CSS3 + JavaScript（无框架依赖）

---

## 文件变更总览

| 文件 | 变更内容 |
|------|---------|
| `index.html` | 状态栏区域改造；移除顶部栏的 `#restart` 和 `#undo-btn` 按钮 |
| `css/style.css` | 新增 `.start-btn`（开始按钮）、`.status-actions`（状态栏按钮组）样式 |
| `js/ui-core.js` | 新增 `isStarted` 标志；重构状态栏渲染；调整初始化和交互逻辑 |

---

## Task 1: HTML 布局改造

**文件:**
- Modify: `index.html:27-30`（移除顶部栏的重新开始和悔棋按钮）
- Modify: `index.html:33-41`（改造状态栏区域）

- [ ] **Step 1: 修改 index.html 顶部栏**

移除 `<button id="restart">` 和 `<button id="undo-btn">` 按钮（第 27-28 行）

原代码（第 27-28 行）:
```html
<button type="button" id="restart">重新开始</button>
<button type="button" id="undo-btn" disabled>悔棋</button>
```

删除这两行。

- [ ] **Step 2: 修改 index.html 状态栏区域**

原代码（第 33-41 行）:
```html
<!-- 状态提示 -->
<div id="status">黑方的回合</div>

<!-- 计时器 -->
<div id="timer-container">
  <span id="timer-black" class="timer-active">黑方 30s</span>
  <span class="timer-separator">|</span>
  <span id="timer-white">白方 30s</span>
</div>
```

替换为:
```html
<!-- 状态提示 + 操作按钮（动态内容） -->
<div id="status-bar">
  <span id="status">选择模式后点击开始</span>
  <span id="status-actions"></span>
</div>

<!-- 计时器 -->
<div id="timer-container">
  <span id="timer-black" class="timer-active">黑方 30s</span>
  <span class="timer-separator">|</span>
  <span id="timer-white">白方 30s</span>
</div>
```

---

## Task 2: CSS 样式新增

**文件:**
- Modify: `css/style.css`（在文件末尾添加新样式）

- [ ] **Step 1: 添加开始按钮和状态栏按钮组样式**

在 `css/style.css` 末尾添加:

```css
/* ==================== 状态栏区域 ==================== */
#status-bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px;
  text-align: center;
  font-size: 1.1rem;
  color: #5D4037;
  font-weight: bold;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

#status.black-turn {
  color: var(--black-stone);
}

#status.white-turn {
  color: #666;
}

#status.thinking {
  color: #8B4513;
  font-style: italic;
}

/* 状态栏操作按钮组 */
#status-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

#status-actions button {
  padding: 6px 16px;
  background: #5D4037;
  color: var(--text-light);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

#status-actions button:hover {
  background: #6D4C41;
}

#status-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 开始按钮 */
.start-btn {
  padding: 6px 20px !important;
  background: #4CAF50 !important;
  font-weight: bold !important;
}

.start-btn:hover {
  background: #45a049 !important;
}

/* 棋盘禁用态（未开始时） */
.board.waiting {
  opacity: 0.7;
  pointer-events: none;
}
```

---

## Task 3: GameState 和初始化逻辑改造

**文件:**
- Modify: `js/ui-core.js:9-17`（GameState 新增 isStarted）
- Modify: `js/ui-core.js:56-80`（initGame 调整）
- Modify: `js/ui-core.js:331-354`（updateStatus 重构为 updateStatusBar）

- [ ] **Step 1: GameState 新增 isStarted 字段**

在 `const GameState = { ... }` 对象中添加:
```javascript
isStarted: false      // 游戏是否已开始（未开始/进行中控制）
```

- [ ] **Step 2: 修改 initGame() 初始化逻辑**

`initGame()` 函数中，做以下调整:
- 在函数体开头设置 `GameState.isStarted = false`
- 删除 `startTimer()` 调用
- 将 `updateStatus()` 调用替换为 `updateStatusBar()`
- 将 `updateRestartButton()` 调用删除
- 在创建棋盘 DOM 后添加 `document.getElementById('board').classList.add('waiting')`

- [ ] **Step 3: 新增 updateStatusBar() 函数**

将原 `updateStatus()` 函数（第 331-354 行）整体替换为 `updateStatusBar()`:

```javascript
/**
 * 更新状态栏（统一处理三种页面状态）
 */
function updateStatusBar() {
  const statusEl = document.getElementById('status');
  const actionsEl = document.getElementById('status-actions');
  const boardEl = document.getElementById('board');
  if (!statusEl || !actionsEl) return;

  if (!GameState.isStarted) {
    // === 未开始状态 ===
    boardEl.classList.add('waiting');
    statusEl.textContent = '选择模式后点击开始';
    statusEl.className = '';
    actionsEl.innerHTML = '<button id="start-btn" class="start-btn">▶开始</button>';
    bindStartButton();
    return;
  }

  boardEl.classList.remove('waiting');

  if (GameState.isGameOver) {
    // === 已结束状态 ===
    actionsEl.innerHTML = '<button id="restart-btn">再来一局</button><button id="undo-btn">悔棋</button>';
    bindStatusBarButtons();
    return;
  }

  // === 进行中状态 ===
  if (GameState.isAIThinking) {
    statusEl.textContent = 'AI 正在思考...';
    statusEl.className = 'thinking';
    actionsEl.innerHTML = '';
    return;
  }

  const currentPlayer = GameState.board.currentPlayer;
  const playerName = currentPlayer === 1 ? '黑方' : '白方';

  if (GameState.mode === 'ai') {
    const playerText = currentPlayer === 1 ? '你' : 'AI';
    statusEl.textContent = `${playerText}的回合（${playerName}）`;
  } else {
    statusEl.textContent = `${playerName}的回合`;
  }
  statusEl.className = currentPlayer === 1 ? 'black-turn' : 'white-turn';

  actionsEl.innerHTML = '<button id="restart-btn">重新开始</button><button id="undo-btn">悔棋</button>';
  bindStatusBarButtons();
  updateUndoButton();
}
```

---

## Task 4: 绑定事件调整

**文件:**
- Modify: `js/ui-core.js:105-151`（bindEvents 函数改造）

- [ ] **Step 1: 移除顶部栏按钮的事件绑定**

删除 `bindEvents()` 中的:
```javascript
const restartBtn = document.getElementById('restart');
if (restartBtn) {
  restartBtn.addEventListener('click', restartGame);
}

const undoBtn = document.getElementById('undo-btn');
if (undoBtn) {
  undoBtn.addEventListener('click', undoLastMove);
}
```

- [ ] **Step 2: 修改 handleBoardClick 添加 isStarted 检查**

在 `handleBoardClick()` 函数体开头添加:
```javascript
if (!GameState.isStarted) return;  // 未开始时拦截
```

并在 `placeStone()` 调用成功后添加 `updateStatusBar()` 调用。

- [ ] **Step 3: 新增 bindStartButton() 和 bindStatusBarButtons() 函数**

在文件末尾（`document.addEventListener` 之前）添加:

```javascript
/**
 * 绑定开始按钮
 */
function bindStartButton() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
}

/**
 * 绑定状态栏内的重新开始/再来一局和悔棋按钮
 */
function bindStatusBarButtons() {
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      restartGame();
    });
  }

  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undoLastMove);
  }
}

/**
 * 开始游戏
 */
function startGame() {
  GameState.isStarted = true;
  resetTimers();
  startTimer();
  updateStatusBar();
}
```

- [ ] **Step 4: 修改 restartGame() 函数**

调整 `restartGame()` 函数:
- 删除 `startTimer()` 调用，替换为 `if (GameState.isStarted) { resetTimers(); startTimer(); }`
- 将 `updateStatus()` 和 `updateRestartButton()` 调用替换为 `updateStatusBar()`
- `updateUndoButton()` 保留

- [ ] **Step 5: 修改悔棋函数末尾**

在 `undoLastMove()` 函数末尾:
- 将 `updateStatus()` 替换为 `updateStatusBar()`
- 将 `startTimer()` 调用包装为 `if (GameState.isStarted) { startTimer(); }`

- [ ] **Step 6: 修改 handleWin() 和 handleDraw() 函数末尾**

在 `handleWin()` 和 `handleDraw()` 函数末尾:
- 删除 `updateRestartButton()` 调用
- 将 `updateUndoButton()` 调用替换为 `updateStatusBar()`

---

## Task 5: 模式切换逻辑调整

**文件:**
- Modify: `js/ui-core.js:107-121`（bindEvents 中的模式切换处理）

- [ ] **Step 1: 修改模式切换逻辑**

在模式切换的 `click` 事件处理中，在 `restartGame()` 调用后添加:
```javascript
GameState.isStarted = false;
updateStatusBar();
```

---

## Task 6: triggerAIMove 和 placeStone 后续更新

**文件:**
- Modify: `js/ui-core.js:224-245`（triggerAIMove 回调）
- Modify: `js/ui-core.js:177-219`（placeStone 函数）

- [ ] **Step 1: 修改 triggerAIMove() 回调**

在 `triggerAIMove()` 的 `setTimeout` 回调中，`placeStone()` 成功后:
- 在 `GameState.isAIThinking = false` 之后添加 `updateStatusBar()` 调用

- [ ] **Step 2: 修改 placeStone() 函数**

在 `placeStone()` 函数末尾:
- 在 `triggerAIMove()` 调用前添加 `updateStatusBar()` 调用
- 在 `return true;` 之前，在非 AI 回合添加 `updateStatusBar()` 调用

---

## Task 7: 收尾 - 删除废弃函数

**文件:**
- Modify: `js/ui-core.js`（删除 updateRestartButton 函数）

- [ ] **Step 1: 删除 updateRestartButton 函数**

删除整个 `updateRestartButton()` 函数（原第 356-364 行区域）。

---

## Task 8: 手动验证清单

- [ ] **验证 1：页面加载后显示"选择模式后点击开始"**
  - 打开页面，状态栏应显示"选择模式后点击开始 ▶开始"
  - 棋盘应半透明不可点击

- [ ] **验证 2：点击开始按钮后游戏启动**
  - 点击"开始"按钮后，状态栏变为"黑方的回合 重新开始 悔棋"
  - 计时器开始倒计时
  - 棋盘可落子

- [ ] **验证 3：双人/人机模式切换回到未开始状态**
  - 在任意状态下点击"人机"或"双人"按钮
  - 棋盘重置，状态栏回到"选择模式后点击开始 ▶开始"

- [ ] **验证 4：游戏结束后"再来一局"直接重启**
  - 游戏结束后状态栏显示胜负提示 + "再来一局" + "悔棋"
  - 点击"再来一局"直接进入"黑方的回合"，不显示开始按钮

- [ ] **验证 5：人机模式下难度下拉框正确显示/隐藏**
  - 选择"人机"模式，难度下拉框显示
  - 选择"双人"模式，难度下拉框隐藏

---

## 实施顺序

1. Task 1 → HTML 布局改造
2. Task 2 → CSS 样式新增
3. Task 3 → GameState 和初始化逻辑
4. Task 4 → 绑定事件调整
5. Task 5 → 模式切换逻辑
6. Task 6 → triggerAIMove 和 placeStone 后续
7. Task 7 → 清理废弃函数
8. Task 8 → 手动验证
