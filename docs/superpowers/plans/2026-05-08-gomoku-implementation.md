# 五子棋游戏实现计划

**Goal:** 实现经典木纹风格五子棋网页游戏，支持双人/人机模式及三级 AI 难度

**Architecture:** 纯前端项目，模块化划分：game.js 处理棋盘状态与胜负逻辑，ai.js 封装 AI 算法，ui.js 管理 DOM 交互，style.css 实现木纹视觉

**Tech Stack:** HTML5 + CSS3 + Vanilla JavaScript（无框架依赖）

---

## 文件结构

```
index.html          # 入口页面
css/
  style.css         # 木纹主题样式
js/
  game.js           # 棋盘数据模型 + 胜负判定
  ai.js             # 三级难度 AI 算法
  ui.js             # 交互控制逻辑
```

---

## 任务 1: game.js（棋盘数据模型 + 胜负判定）

**创建:** `js/game.js`

**实现:**
- `Board` 类：15×15 棋盘状态（二维数组）
- `placeStone(row, col, player)`：落子
- `checkWin(row, col)`：检测胜负，返回获胜连线或 null
- `isFull()`：棋盘是否已满

---

## 任务 2: ai.js（三级难度 AI）

**创建:** `js/ai.js`

**AI 算法:**
- **简单**：随机选择空位落子
- **中等**：启发式评分，评估每个空位的攻防价值
- **困难**：Minimax + Alpha-Beta 剪枝，搜索深度 4 层

**接口:**
```javascript
function getAIMove(board, difficulty) // 返回 {row, col}
```

---

## 任务 3: ui.js（交互控制）

**创建:** `js/ui.js`

**功能:**
- 模式切换（双人/人机）
- 难度选择（简单/中等/困难）
- 落子事件处理
- 重新开始
- 回合提示更新
- 胜负提示显示

---

## 任务 4: style.css（木纹视觉）

**创建:** `css/style.css`

**样式:**
- 木纹背景
- 棋盘网格线
- 黑白棋子（圆形 + 阴影）
- 获胜五子连线亮显
- 顶部控制栏
- 响应式（最小宽度 400px）

---

## 任务 5: index.html（入口页面）

**创建:** `index.html`

**结构:**
- 顶部：标题 + 模式切换 + 难度选择
- 中部：15×15 棋盘
- 底部：回合提示 + 重新开始按钮

---

## 实施顺序

1. game.js → 2. ai.js → 3. ui.js → 4. style.css → 5. index.html

---

## 验证

浏览器打开 `index.html` 测试：
- 双人模式落子、胜负判定
- 人机模式三级 AI 差异
- 木纹视觉和连线亮显
