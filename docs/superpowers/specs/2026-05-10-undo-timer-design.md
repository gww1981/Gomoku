# 悔棋 + 计时器 功能设计

## 概述

为五子棋游戏增加悔棋（Undo）和每步限时计时器两项对局体验功能。

## 悔棋功能

### 按钮位置

在 index.html 的 header-controls 中，"重新开始"按钮右侧新增"悔棋"按钮。

### 逻辑规则

| 场景 | 撤回步数 | 说明 |
|------|---------|------|
| 双人模式 (PvP) | 撤回 1 步 | 撤销最后落子，恢复对手回合 |
| 人机模式 (AI) | 撤回 2 步 | 同时撤回玩家落子 + AI 回应，回到玩家回合 |
| 游戏结束/回放中/AI思考中 | 禁用 | 按钮置灰不可点击 |

### 边界处理

- 无可撤棋子时（moveHistory 为空）按钮禁用
- 撤回后清除获胜高亮（如果撤回前刚分出胜负）
- 撤回不影响已保存的录像数据

### 修改清单

**game.js** — `Board` 类新增 `undoMove(row, col)` 方法：
- 清除 grid[row][col] 恢复为 0
- 回退 currentPlayer
- 减少 moveCount

**ui.js** — 新增 `undoLastMove()` 函数：
- 从 GameState.moveHistory 弹出记录
- AI 模式弹出 2 条，PvP 模式弹出 1 条
- 调用 board.undoMove()
- 清除对应的 DOM cell stone 样式
- 重置计时器（切回正确玩家并开始倒计时）
- 清除 GameState.isGameOver 标志（如果撤回的是致胜/致负的那步）
- 绑定悔棋按钮 click 事件
- 每次落子/撤回/重新开始后更新按钮禁用状态

**index.html** — 新增悔棋按钮：
```html
<button type="button" id="undo-btn" disabled>悔棋</button>
```

## 计时器功能

### UI 位置

状态栏下方、棋盘上方。显示为一行：

```
黑方 30s | 白方 30s
```

当前走棋方高亮。

### 逻辑规则

- 游戏开始时双方计时器初始化为 30s
- 先手（黑方）开始倒计时，白方冻结
- 每秒减 1，对方计时冻结
- 落子后：当前方停止 → 对方开始倒计时
- 计时归零 → 该玩家判负，游戏结束
- AI 模式：仅玩家回合倒计时；AI 思考时暂停计时，AI 走完后恢复
- 回放模式：暂停所有计时
- 重新开始：重置双方为 30s

### 视觉规则

- 当前走棋方字体加粗/颜色高亮
- ≤5 秒时变红色
- ≤3 秒时红色闪烁动画

### 修改清单

**ui.js** — 新增计时器变量和函数：
```js
const timers = {
  black: TIMER_LIMIT,
  white: TIMER_LIMIT
};
let timerInterval = null;
```
新增函数：
- `startTimer()` / `stopTimer()` / `resetTimers()`
- `switchTimer()` — 停止当前，启动对方
- `updateTimerDisplay()` — 更新 DOM
- `handleTimeout(player)` — 超时判负

调用点：
- `initGame()` → 调用 `resetTimers()` + `startTimer()`
- `placeStone()` → 落子后调用 `switchTimer()`
- `triggerAIMove()` → AI 思考前 `stopTimer()`，AI 落子后 `startTimer()`
- `restartGame()` → `resetTimers()` + `startTimer()`
- `startReplay()` → `stopTimer()`
- `undoLastMove()` → `resetTimers()` + `startTimer()`（恢复正确玩家的计时）

**index.html** — 新增计时器 DOM：
```html
<div id="timer-container">
  <span id="timer-black" class="timer-active">黑方 30s</span>
  <span class="timer-separator">|</span>
  <span id="timer-white">白方 30s</span>
</div>
```

**style.css** — 计时器样式：
- `#timer-container` 居中布局
- `.timer-active` 高亮样式（加粗/主题色）
- `.timer-warning` 红色 (≤5s)
- `.timer-critical` 红色闪烁动画 (≤3s)

## 关键交互流程

### 正常对局 + 计时器
```
点击棋盘 → placeStone() → switchTimer() → checkWin/checkDraw → updateStatus()
```
### AI 模式 + 计时器

AI 模式只有人类玩家有计时器，AI 回合暂停计时。

```
玩家落子 → placeStone() 完毕，检测到 AI 回合
           → stopTimer() (暂停玩家计时)
           → triggerAIMove() → AI思考500ms → AI落子
           → AI 落子后 → startTimer() (恢复玩家倒计时)
```

AI 思考期间计时器完全停止，不计时间。

### 悔棋流程
```
点击悔棋 → undoLastMove()
  → 从 moveHistory 弹出 1 或 2 条
  → board.undoMove() 清除 grid
  → 清除 DOM 棋子样式
  → resetTimers() + startTimer() (回到正确玩家)
  → 如果是游戏结束后撤回，清除 isGameOver 和获胜高亮
```

## 常量

```js
const TIMER_LIMIT = 30; // 每步限时 30 秒
```
