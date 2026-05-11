/**
 * 五子棋录像回放 UI 模块
 * 负责设置弹窗中的录像 Tab 逻辑和回放控制
 */

// ========== 录像 Tab ==========

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
  stopTimer();

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
