# 录像回放功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为五子棋游戏增加录像回放功能，对局结束后自动保存录像到 localStorage，在设置弹窗中查看历史录像并回放。

**Architecture:** 新增 `ReplayManager` 类管理录像的保存/读取/删除/回放；在 `ui.js` 中集成录像 Tab 和游戏结束自动保存逻辑；回放时重放落子序列（每步 800ms）。

**Tech Stack:** 原生 HTML5 + CSS3 + JavaScript（无框架依赖），localStorage 持久化

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `js/replay.js` | 新增：ReplayManager 类，录像的 CRUD 和回放控制 |
| `js/ui.js` | 修改：集成录像 Tab、落子记录、游戏结束自动保存 |
| `index.html` | 修改：添加录像 Tab DOM |
| `css/style.css` | 修改：录像 Tab 样式 |

---

## 任务清单

### Task 1: 创建 ReplayManager 类

**Files:**
- Create: `js/replay.js`

- [ ] **Step 1: 编写 ReplayManager 类骨架**

```javascript
/**
 * ReplayManager - 录像管理器
 * 负责录像的保存、读取、删除、回放控制
 */
class ReplayManager {
  STORAGE_KEY = 'gomoku_replays';
  MAX_REPLAYS = 20;
  REPLAY_INTERVAL = 800; // 每步间隔 800ms

  constructor() {
    this._replayData = null;  // 当前回放的录像数据
    this._replayTimer = null; // 回放定时器
    this._replayIndex = 0;    // 当前回放步索引
  }

  // 保存录像
  saveReplay(gameMode, difficulty, moves) {}

  // 获取所有录像
  getReplays() {}

  // 删除指定录像
  deleteReplay(id) {}

  // 清空所有录像
  clearReplays() {}

  // 回放指定录像
  startReplay(id, onStep, onComplete) {}

  // 停止回放
  stopReplay() {}

  // 私有：读取录像数据
  _loadReplays() {}

  // 私有：保存录像数据
  _saveReplays(replays) {}
}

window.replayManager = null;

function initReplayManager() {
  if (!window.replayManager) {
    window.replayManager = new ReplayManager();
  }
  return window.replayManager;
}
```

- [ ] **Step 2: 实现 saveReplay 方法**

```javascript
saveReplay(gameMode, difficulty, moves) {
  if (!moves || moves.length === 0) return;

  const replays = this._loadReplays();

  const newReplay = {
    id: Date.now().toString(),
    gameMode,
    difficulty,
    moves,
    timestamp: Date.now()
  };

  replays.unshift(newReplay); // 新录像插入最前

  // 限制最多 20 条
  if (replays.length > this.MAX_REPLAYS) {
    replays.splice(this.MAX_REPLAYS);
  }

  this._saveReplays(replays);
}
```

- [ ] **Step 3: 实现 getReplays / deleteReplay / clearReplays 方法**

```javascript
getReplays() {
  return this._loadReplays();
}

deleteReplay(id) {
  const replays = this._loadReplays();
  const filtered = replays.filter(r => r.id !== id);
  this._saveReplays(filtered);
}

clearReplays() {
  this._saveReplays([]);
}

_loadReplays() {
  try {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

_saveReplays(replays) {
  try {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(replays));
  } catch (e) {
    console.warn('保存录像失败:', e);
  }
}
```

- [ ] **Step 4: 实现 startReplay / stopReplay 方法**

```javascript
startReplay(id, onStep, onComplete) {
  const replays = this._loadReplays();
  const replay = replays.find(r => r.id === id);
  if (!replay) return;

  this.stopReplay(); // 停止当前回放

  this._replayData = replay;
  this._replayIndex = 0;
  this._onStep = onStep;
  this._onComplete = onComplete;

  this._playNextStep();
}

stopReplay() {
  if (this._replayTimer) {
    clearTimeout(this._replayTimer);
    this._replayTimer = null;
  }
  this._replayData = null;
  this._replayIndex = 0;
}

_playNextStep() {
  if (!this._replayData) return;

  const { moves } = this._replayData;

  if (this._replayIndex >= moves.length) {
    // 回放完成
    if (this._onComplete) this._onComplete();
    this.stopReplay();
    return;
  }

  const move = moves[this._replayIndex];
  if (this._onStep) this._onStep(move);

  this._replayIndex++;

  this._replayTimer = setTimeout(() => {
    this._playNextStep();
  }, this.REPLAY_INTERVAL);
}
```

- [ ] **Step 5: 提交**

```bash
git add js/replay.js
git commit -m "feat: 添加 ReplayManager 类管理录像"
```

---

### Task 2: 修改 ui.js 集成录像功能

**Files:**
- Modify: `js/ui.js`

- [ ] **Step 1: 在 initGame 中初始化 ReplayManager 并记录落子**

在 `initGame` 函数开头添加录像管理器初始化：
```javascript
// 初始化录像管理器
initReplayManager();
```

在 `GameState` 中添加落子记录数组：
```javascript
const GameState = {
  // ... 现有字段
  moveHistory: [], // 落子记录 [{row, col, player}, ...]
};
```

- [ ] **Step 2: 在 placeStone 中记录每一步落子**

在 `placeStone` 函数落子成功后添加记录：
```javascript
// 记录落子
GameState.moveHistory.push({
  row,
  col,
  player: currentPlayer
});
```

- [ ] **Step 3: 修改 handleWin 和 handleDraw 在游戏结束时保存录像**

在 `handleWin` 函数末尾（`updateRestartButton();` 之前）添加：
```javascript
// 保存录像
if (window.replayManager) {
  window.replayManager.saveReplay(
    GameState.mode,
    GameState.difficulty,
    GameState.moveHistory
  );
}
```

在 `handleDraw` 函数中同样添加保存逻辑。

- [ ] **Step 4: 修改 restartGame 重置落子记录**

在 `restartGame` 函数中重置 moveHistory：
```javascript
GameState.moveHistory = [];
```

- [ ] **Step 5: 添加回放状态标志和回放处理函数**

在 `GameState` 中添加：
```javascript
isReplaying: false,
```

添加回放相关函数：
```javascript
/**
 * 开始录像回放
 */
function startReplay(replayId) {
  const replayManager = window.replayManager;
  if (!replayManager) return;

  // 重置棋盘
  GameState.board.reset();
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => { cell.className = 'cell'; });

  GameState.isReplaying = true;

  const status = document.getElementById('status');
  if (status) {
    status.textContent = '录像回放中...';
    status.className = 'status';
  }

  replayManager.startReplay(
    replayId,
    // onStep
    (move) => {
      updateCellDisplay(move.row, move.col, move.player);
    },
    // onComplete
    () => {
      GameState.isReplaying = false;
      GameState.moveHistory = [];
      const status = document.getElementById('status');
      if (status) {
        status.textContent = '回放结束';
        status.className = 'status';
      }
    }
  );
}
```

- [ ] **Step 6: 在 handleBoardClick 中忽略回放状态的点击**

在 `handleBoardClick` 函数开头添加：
```javascript
// 回放状态时忽略点击
if (GameState.isReplaying) return;
```

- [ ] **Step 7: 提交**

```bash
git add js/ui.js
git commit -m "feat: 集成录像功能到游戏逻辑"
```

---

### Task 3: 添加录像 Tab UI

**Files:**
- Modify: `index.html`
- Modify: `css/style.css`

- [ ] **Step 1: 在 index.html 添加录像 Tab**

在设置弹窗的 Tab 切换器中添加录像按钮：
```html
<button type="button" class="tab-btn" data-tab="replay">录像</button>
```

在 modal-body 中添加录像面板：
```html
<div class="tab-panel hidden" data-panel="replay">
  <h3>历史录像</h3>
  <div id="replay-list" class="replay-list">
    <p class="replay-empty">暂无录像</p>
  </div>
  <button type="button" id="clear-replays" class="btn-danger">清空录像</button>
</div>
```

- [ ] **Step 2: 在 css/style.css 添加录像 Tab 样式**

```css
/* 录像列表 */
.replay-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.replay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255,255,255,0.5);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.replay-item:hover {
  background: rgba(255,255,255,0.8);
}

.replay-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.replay-mode {
  font-size: 12px;
  font-weight: bold;
}

.replay-mode.ai {
  color: #e67e22;
}

.replay-mode.pvp {
  color: #3498db;
}

.replay-meta {
  font-size: 11px;
  color: #666;
}

.replay-delete {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.replay-delete:hover {
  background: #e74c3c;
  color: white;
}

.replay-empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.btn-danger {
  width: 100%;
  padding: 8px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger:hover {
  background: #c0392b;
}
```

- [ ] **Step 3: 在 ui.js 中添加渲染录像列表的函数**

在 `initMusicTab` 函数后添加：
```javascript
function initReplayTab() {
  const replayList = document.getElementById('replay-list');
  const clearBtn = document.getElementById('clear-replays');

  if (!replayList || !clearBtn) return;

  function renderReplayList() {
    const replays = window.replayManager ? window.replayManager.getReplays() : [];

    if (replays.length === 0) {
      replayList.innerHTML = '<p class="replay-empty">暂无录像</p>';
      return;
    }

    replayList.innerHTML = replays.map(replay => {
      const modeText = replay.gameMode === 'ai' ? '人机' : '双人';
      const diffText = { easy: '简单', medium: '中等', hard: '困难' }[replay.difficulty] || '';
      const date = new Date(replay.timestamp);
      const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

      return `<div class="replay-item" data-id="${replay.id}">
        <div class="replay-info">
          <span class="replay-mode ${replay.gameMode}">${modeText} ${diffText}</span>
          <span class="replay-meta">${replay.moves.length} 步 | ${timeStr}</span>
        </div>
        <button class="replay-delete" data-id="${replay.id}">删除</button>
      </div>`;
    }).join('');

    // 点击录像开始回放
    replayList.querySelectorAll('.replay-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('replay-delete')) {
          e.stopPropagation();
          const id = e.target.dataset.id;
          window.replayManager.deleteReplay(id);
          renderReplayList();
          return;
        }
        const id = item.dataset.id;
        // 关闭设置弹窗
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.add('hidden');
        // 开始回放
        startReplay(id);
      });
    });
  }

  // 清空录像
  clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有录像吗？')) {
      window.replayManager.clearReplays();
      renderReplayList();
    }
  });

  // 暴露刷新函数
  window.refreshReplayList = renderReplayList;

  renderReplayList();
}
```

- [ ] **Step 4: 在 initSettingsModal 中调用 initReplayTab**

在 `initSettingsModal` 函数末尾添加：
```javascript
initReplayTab();
```

在 `initSettingsModalTabs` 函数中添加录像 Tab 切换（不需要特殊处理，Tab 逻辑已经是通用的）。

- [ ] **Step 5: 在设置弹窗打开时刷新录像列表**

找到打开弹窗的事件处理，添加刷新调用：
```javascript
settingsBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  updateSelectedBg();
  if (window.refreshReplayList) window.refreshReplayList();
});
```

- [ ] **Step 6: 提交**

```bash
git add index.html css/style.css js/ui.js
git commit -m "feat: 添加录像 Tab UI 和样式"
```

---

## 自检清单

**Spec 覆盖检查：**
- [x] 录像数据结构（id, gameMode, difficulty, moves, timestamp）
- [x] 自动保存（handleWin/handleDraw 中调用 saveReplay）
- [x] 容量限制 20 条（MAX_REPLAYS）
- [x] 删除单条录像（deleteReplay）
- [x] 清空录像（clearReplays）
- [x] 录像 Tab UI
- [x] 回放控制（startReplay/stopReplay，800ms 间隔）
- [x] 回放状态标志（isReplaying）
- [x] 回放中棋盘不可点击（handleBoardClick 检查）

**类型一致性检查：**
- ReplayManager 方法名与 spec 一致
- startReplay 回调参数与 spec 一致
- move 对象结构 `{row, col, player}` 与 spec 一致

**占位符检查：**
- 无 TBD/TODO
- 无 "类似 Task N" 的引用
- 所有代码块完整
