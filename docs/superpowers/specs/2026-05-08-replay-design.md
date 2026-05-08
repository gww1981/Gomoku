# 五子棋录像回放功能设计

## 概述

为五子棋游戏增加录像回放功能，对局结束后自动保存录像，本地管理并回放。

## 功能需求

### 1. 录像数据结构

每条录像（Replay）包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识（时间戳） |
| `gameMode` | string | 'pvp' 双人或 'ai' 人机 |
| `difficulty` | string | 'easy'/'medium'/'hard' |
| `moves` | Array | 落子序列 `[{row, col, player}, ...]` |
| `timestamp` | number | 保存时间戳 |

### 2. 录像管理

- **自动保存**：每局游戏结束后自动保存一条录像到 localStorage
- **容量限制**：最多保存 20 条，超出则删除最早的录像
- **手动删除**：支持从录像列表中删除单条录像
- **存储键**：`gomoku_replays`

### 3. 回放交互

- **入口**：设置弹窗新增"录像" Tab，显示历史录像列表
- **列表展示**：每条显示模式（双人/人机）、难度、步数、保存时间
- **回放流程**：点击录像后关闭弹窗，棋盘进入回放模式
- **回放控制**：自动逐帧播放，播放完自动停止
- **回放状态**：回放中棋盘不可点击，状态栏显示"录像回放中"
- **退出回放**：点击"重新开始"或结束回放后恢复操作

### 4. 新增模块

#### ReplayManager 类（位于 `js/replay.js`）

```javascript
class ReplayManager {
  STORAGE_KEY = 'gomoku_replays';
  MAX_REPLAYS = 20;

  // 保存录像
  saveReplay(gameMode, difficulty, moves);

  // 获取所有录像
  getReplays();

  // 删除指定录像
  deleteReplay(id);

  // 清空所有录像
  clearReplays();

  // 回放指定录像
  startReplay(id, board, onStep, onComplete);

  // 停止回放
  stopReplay();
}
```

#### 回放时序

1. `startReplay(id)` 启动回放
2. 每 800ms 调用一次 `onStep({row, col, player})` 显示下一步
3. 所有步完成后调用 `onComplete()`
4. 回放期间 `stopReplay()` 可随时停止

### 5. UI 变更

#### 设置弹窗录像 Tab

```html
<div class="tab-panel hidden" data-panel="replay">
  <h3>历史录像</h3>
  <div id="replay-list">
    <!-- 动态生成 -->
  </div>
  <button type="button" id="clear-replays">清空录像</button>
</div>
```

#### 录像列表项

每条显示：模式标签、难度、步数、时间、删除按钮

### 6. 游戏逻辑变更

- 对局结束（胜负或平局）时自动调用 `ReplayManager.saveReplay()`
- 回放模式标志：`GameState.isReplaying`
- 回放中忽略棋盘点击事件

## 变更文件

| 文件 | 变更内容 |
|------|----------|
| `js/replay.js` | 新增 ReplayManager 类 |
| `js/ui.js` | 集成录像 Tab、修改对局结束逻辑 |
| `index.html` | 增加录像 Tab DOM |
| `css/style.css` | 录像 Tab 样式 |

## 测试要点

1. 双人/AI 模式结束后录像自动保存
2. 录像列表正确显示所有历史录像
3. 点击录像后棋盘正确重放每一步
4. 回放结束后棋盘恢复可点击
5. 删除录像后列表更新
6. 超过 20 条后自动删除最早的
