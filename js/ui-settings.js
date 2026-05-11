/**
 * 五子棋设置弹窗模块
 * 负责背景设置、Tab 切换
 */

// 背景设置弹窗逻辑
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const settingsBtn = document.getElementById('settings');
  const closeBtn = document.getElementById('close-modal');
  const bgOptions = document.querySelectorAll('.bg-option');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('bg-upload');

  // 打开弹窗
  settingsBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    updateSelectedBg();
    if (window.refreshReplayList) window.refreshReplayList();
  });

  // 关闭弹窗
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // 点击遮罩关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // 选择预设背景
  bgOptions.forEach(option => {
    option.addEventListener('click', () => {
      const bgValue = option.dataset.bg;
      applyBackground(bgValue);
      saveBackgroundSetting(bgValue);
      updateSelectedBg();
    });
  });

  // 上传背景
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataURL(file);
      applyBackground(dataUrl);
      saveBackgroundSetting(dataUrl);
      updateSelectedBg();
    } catch (err) {
      alert(err.message);
    }
    // 清空 input 以允许重新选择同一文件
    fileInput.value = '';
  });

  // 更新选中状态
  function updateSelectedBg() {
    const currentBg = localStorage.getItem(STORAGE_KEY);
    bgOptions.forEach(option => {
      option.classList.toggle('selected', option.dataset.bg === currentBg);
    });
  }

  // 初始化 Tab 切换和音乐
  initSettingsModalTabs();
  initMusicTab();
  initReplayTab();
}

// ========== 设置弹窗 Tab 切换 ==========

function initSettingsModalTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn, index) => {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', `panel-${btn.dataset.tab}`);
    btn.setAttribute('aria-selected', btn.classList.contains('active'));
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      panels.forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tabName);
      });
    });
  });

  panels.forEach(panel => {
    panel.id = `panel-${panel.dataset.panel}`;
    panel.setAttribute('role', 'tabpanel');
  });
}
