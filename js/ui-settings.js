/**
 * 五子棋设置弹窗模块
 * 负责背景设置、Tab 切换
 */

// 预设背景配置
const PRESET_BACKGROUNDS = {
    'preset-1': 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1920',
    'preset-2': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    'preset-3': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=1920',
    'preset-4': 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=1920'
};
const STORAGE_KEY = 'gomoku_background';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// 应用背景图片
function applyBackground(bgValue) {
    if (PRESET_BACKGROUNDS[bgValue]) {
        document.body.style.backgroundImage = `url('${PRESET_BACKGROUNDS[bgValue]}')`;
    } else if (bgValue.startsWith('data:')) {
        document.body.style.backgroundImage = `url('${bgValue}')`;
    }
}

// 保存背景设置到 localStorage
function saveBackgroundSetting(bgValue) {
    try {
        localStorage.setItem(STORAGE_KEY, bgValue);
    } catch (e) {
        console.warn('无法保存背景设置:', e);
    }
}

// 从 localStorage 加载背景设置
function loadBackgroundSetting() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            applyBackground(saved);
            return saved;
        }
        return null;
    } catch (e) {
        console.warn('无法加载背景设置:', e);
        return null;
    }
}

// 允许的图片 MIME 类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 将文件转为 Base64 DataURL
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_FILE_SIZE) {
            reject(new Error('图片大小不能超过 2MB'));
            return;
        }
        if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
            reject(new Error(`不支持的图片格式: ${file.type || '未知'}`));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

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
