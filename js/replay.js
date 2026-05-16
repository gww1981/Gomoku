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
    this._onClear = null;     // 清空棋盘回调
    this._replayPaused = false; // 是否暂停
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
  // 参数: id (string), onStep (function), onComplete (function), onClear (function)
  startReplay(id, onStep, onComplete, onClear) {
    const replays = this._loadReplays();
    const replay = replays.find(r => r.id === id);
    if (!replay) return;

    this.stopReplay();

    this._replayData = replay;
    this._replayIndex = 0;
    this._replayPaused = false;
    this._onStep = onStep;
    this._onComplete = onComplete;
    this._onClear = onClear;

    this._playNextStep();
  }

  // 暂停回放
  pauseReplay() {
    if (!this._replayData) return;
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayPaused = true;
  }

  // 继续回放
  resumeReplay() {
    if (!this._replayData || !this._replayPaused) return;
    this._replayPaused = false;
    this._playNextStep();
  }

  // 前进一步
  stepForward() {
    if (!this._replayData) return;
    // 停止自动播放
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayPaused = true;

    const { moves } = this._replayData;
    if (this._replayIndex >= moves.length) return;

    const move = moves[this._replayIndex];
    if (this._onStep) this._onStep(move);
    this._replayIndex++;

    if (this._replayIndex >= moves.length) {
      if (this._onComplete) this._onComplete();
    }
  }

  // 后退一步（清空棋盘，重播到当前位置-1）
  stepBackward() {
    if (!this._replayData || this._replayIndex <= 0) return;
    // 停止自动播放
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayPaused = true;

    this._replayIndex--;

    // 清空并重播
    if (this._onClear) this._onClear();
    const { moves } = this._replayData;
    for (let i = 0; i < this._replayIndex; i++) {
      if (this._onStep) this._onStep(moves[i]);
    }
  }

  // 跳到开头
  goToStart() {
    if (!this._replayData) return;
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayPaused = true;
    this._replayIndex = 0;
    if (this._onClear) this._onClear();
  }

  // 跳到结尾
  goToEnd() {
    if (!this._replayData) return;
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayPaused = true;

    const { moves } = this._replayData;
    this._replayIndex = moves.length;
    if (this._onClear) this._onClear();
    moves.forEach(move => { if (this._onStep) this._onStep(move); });
    if (this._onComplete) this._onComplete();
  }

  // 获取回放进度
  getReplayProgress() {
    if (!this._replayData) return { current: 0, total: 0 };
    return {
      current: this._replayIndex,
      total: this._replayData.moves.length
    };
  }

  // 是否暂停
  isPaused() {
    return this._replayPaused;
  }

  // 停止回放
  stopReplay() {
    if (this._replayTimer) {
      clearTimeout(this._replayTimer);
      this._replayTimer = null;
    }
    this._replayData = null;
    this._replayIndex = 0;
    this._replayPaused = false;
    this._onStep = null;
    this._onComplete = null;
    this._onClear = null;
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
    if (!this._replayData || this._replayPaused) return;

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
