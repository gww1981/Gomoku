# 五子棋 - 模式选择与开始按钮功能设计

**日期：** 2026-05-12
**状态：** 已确认

---

## 1. 背景与目标

当前页面加载后直接以双人对战模式开始游戏，无任何前置选择。本次改版目标：

- 页面打开后先显示"未开始"状态
- 用户选择"双人"或"人机"模式后，点击"开始"按钮才启动游戏
- 游戏结束后"再来一局"直接重启，不退回模式选择

---

## 2. 页面状态

游戏存在三种互斥状态，通过 `isStarted` + `isGameOver` 两个标志组合控制：

| 状态 | isStarted | isGameOver | 状态栏内容 | 棋盘 |
|------|-----------|------------|-----------|------|
| **未开始** | false | false | "选择模式后点击开始" + ▶开始按钮 | 可见但不可落子 |
| **进行中** | true | false | 回合提示 + 重新开始 + 悔棋 | 可落子 |
| **已结束** | true | true | 胜负提示 + 再来一局 + 悔棋 | 显示获胜连线 |

---

## 3. 交互流程

### 3.1 页面加载
1. 页面加载 → `isStarted = false`，`isGameOver = false`，默认选中"双人"模式
2. 状态栏显示："选择模式后点击开始" + ▶开始按钮
3. 计时器、棋盘均不启动

### 3.2 模式切换（双人 ↔ 人机）
- 无论当前处于何种状态，切换模式 → 棋盘重置为空，`isStarted = false`，`isGameOver = false`
- 状态栏回到"未开始"状态
- 人机模式下难度下拉框显示；双人模式下隐藏

### 3.3 点击"开始"按钮
- `isStarted = true`，计时器启动，棋盘可交互
- 状态栏切换为："黑方的回合 + 重新开始 + 悔棋"

### 3.4 游戏中点击"重新开始"
- 棋盘重置，`isGameOver = false`，直接进入"进行中"状态（不回"未开始"）
- 不改变当前选中的模式和难度

### 3.5 游戏结束
- `isGameOver = true`，状态栏显示胜负/平局提示 + "再来一局" + 悔棋

### 3.6 点击"再来一局"
- 棋盘重置，`isGameOver = false`，直接进入"进行中"状态
- 保持当前模式和难度不变

---

## 4. 布局变更

### 4.1 顶部栏（不变）
保留现有顶部栏结构：标题 + 模式按钮组 + 难度选择 + ⚙️设置按钮

### 4.2 状态栏区域（改造重点）
**未开始状态：**
```
[状态文字：选择模式后点击开始]  [▶开始按钮]
```

**进行中/已结束状态：**
```
[状态文字：回合提示/胜负提示]  [重新开始/再来一局]  [悔棋]
```

### 4.3 顶部栏按钮迁移
从顶部栏移除"重新开始"和"悔棋"按钮，它们转移至状态栏区域。

---

## 5. 技术实现

### 5.1 文件变更

| 文件 | 变更内容 |
|------|---------|
| `index.html` | 状态栏区域改造；移除顶部栏的重新开始、悔棋按钮 |
| `css/style.css` | 新增 `.status-bar` 容器样式、`.start-btn` 开始按钮样式、`.status-actions` 按钮组样式 |
| `js/ui-core.js` | 新增 `isStarted` 标志；重构状态栏渲染逻辑；调整初始化流程 |

### 5.2 GameState 字段变更

```javascript
const GameState = {
  board: null,
  mode: 'pvp',           // 'pvp' | 'ai'
  difficulty: 'medium',   // 'easy' | 'medium' | 'hard'
  isGameOver: false,
  isAIThinking: false,
  moveHistory: [],
  isReplaying: false,
  isStarted: false        // 新增：控制"未开始/进行中"状态
};
```

### 5.3 状态栏渲染逻辑

```javascript
function updateStatusBar() {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;

  if (!GameState.isStarted) {
    // 未开始：显示开始提示 + 开始按钮
    statusEl.innerHTML = '选择模式后点击开始 <button id="start-btn" class="start-btn">▶开始</button>';
    bindStartButton();
  } else if (GameState.isGameOver) {
    // 已结束：显示胜负 + 再来一局 + 悔棋
    statusEl.innerHTML = `${getResultText()} <button id="restart-btn">再来一局</button> <button id="undo-btn">悔棋</button>`;
  } else {
    // 进行中：显示回合 + 重新开始 + 悔棋
    statusEl.innerHTML = `${getTurnText()} <button id="restart-btn">重新开始</button> <button id="undo-btn">悔棋</button>`;
  }
}
```

### 5.4 棋盘点击拦截

```javascript
function handleBoardClick(e) {
  if (!GameState.isStarted) return;  // 未开始时拦截
  if (GameState.isGameOver || GameState.isAIThinking || GameState.isReplaying) return;
  // ... 落子逻辑
}
```

---

## 6. 设计原则

- **最小改动**：复用现有状态栏区域，不引入额外 DOM 元素
- **状态隔离**：`isStarted` 与 `isGameOver` 正交组合，清晰区分三种页面状态
- **符合直觉**：切换模式回到选择态；再来一局直接重启
