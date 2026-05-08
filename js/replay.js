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
    this._onStep = null;      // 步回调
    this._onComplete = null;  // 完成回调
  }

  // 保存录像
  // 参数: gameMode (string), difficulty (string), moves (Array of {row, col, player})
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

  // 获取所有录像
  getReplays() {
    return this._loadReplays();
  }

  // 删除指定录像
  deleteReplay(id) {
    const replays = this._loadReplays();
    const filtered = replays.filter(r => r.id !== id);
    this._saveReplays(filtered);
  }

  // 清空所有录像
  clearReplays() {
    this._saveReplays([]);
  }

  // 回放指定录像
  // 参数: id (string), onStep (function: move对象 -> void), onComplete (function: () -> void)
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

  // 停止回放
  stopReplay() {
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayData = null;
    this._replayIndex = 0;
    this._onStep = null;
    this._onComplete = null;
  }

  // 私有：读取录像数据
  _loadReplays() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // 私有：保存录像数据
  _saveReplays(replays) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(replays));
    } catch (e) {
      console.warn('保存录像失败:', e);
    }
  }

  // 私有：播放下一步
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
}

window.replayManager = null;

function initReplayManager() {
  if (!window.replayManager) {
    window.replayManager = new ReplayManager();
  }
  return window.replayManager;
}
