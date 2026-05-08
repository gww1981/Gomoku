# 背景切换功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 为五子棋游戏添加背景切换功能，支持 4 张预设木质纹理背景和本地上传

**架构：** 通过 CSS 变量切换背景图片，localStorage 持久化用户选择，FileReader API 处理本地上传

**技术栈：** 纯 HTML5 + CSS3 + JavaScript（无框架依赖）

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `index.html` | 添加设置按钮和模态弹窗结构 |
| `css/style.css` | 添加弹窗样式、背景网格、选中态 |
| `js/game.js` | 添加背景管理函数（应用背景、保存/加载设置） |
| `js/ui.js` | 添加弹窗交互逻辑（打开/关闭、选择事件） |

---

## 预设背景 URL

使用 Unsplash 木质纹理图片：
1. `https://images.unsplash.com/photo-1549490349-8643362247b5?w=800` - 深棕木质
2. `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800` - 浅棕木质
3. `https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800` - 红木质感
4. `https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=800` - 竹色/浅木色

---

## 任务清单

### Task 1: 修改 index.html - 添加设置按钮和模态框

**文件：**
- 修改: `index.html`

- [ ] **Step 1: 添加设置按钮到控制栏**

在 `header-controls` 的 `#restart` 按钮后添加设置按钮：
```html
<button type="button" id="settings" title="背景设置">⚙️</button>
```

- [ ] **Step 2: 添加模态弹窗结构**

在 `</div>` (game-container 闭合标签) 前添加：
```html
<!-- 背景设置弹窗 -->
<div id="settings-modal" class="modal hidden">
  <div class="modal-content">
    <div class="modal-header">
      <h2>背景设置</h2>
      <button type="button" id="close-modal" class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <h3>预设背景</h3>
      <div class="bg-grid">
        <div class="bg-option" data-bg="preset-1" style="background-image: url('https://images.unsplash.com/photo-1549490349-8643362247b5?w=800')"></div>
        <div class="bg-option" data-bg="preset-2" style="background-image: url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800')"></div>
        <div class="bg-option" data-bg="preset-3" style="background-image: url('https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800')"></div>
        <div class="bg-option" data-bg="preset-4" style="background-image: url('https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=800')"></div>
      </div>
      <h3>自定义背景</h3>
      <div class="upload-area">
        <input type="file" id="bg-upload" accept="image/jpeg,image/png,image/webp" hidden>
        <button type="button" id="upload-btn" class="upload-btn">📁 选择图片</button>
        <p class="upload-hint">支持 JPG、PNG、WebP，最大 2MB</p>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: 提交**

```bash
git add index.html
git commit -m "feat: 添加设置按钮和背景选择模态框"
```

---

### Task 2: 修改 css/style.css - 添加弹窗和选择器样式

**文件：**
- 修改: `css/style.css`

- [ ] **Step 1: 添加模态框基础样式**

在文件末尾添加：
```css
/* ==================== 模态框 ==================== */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background: linear-gradient(180deg, #8B4513 0%, #654321 100%);
    border-radius: 12px;
    padding: 0;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
    color: var(--text-light);
    font-size: 1.2rem;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-light);
    font-size: 1.8rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.close-btn:hover {
    opacity: 1;
}

.modal-body {
    padding: 20px;
}

.modal-body h3 {
    color: var(--text-light);
    font-size: 1rem;
    margin: 0 0 12px 0;
    opacity: 0.9;
}

/* ==================== 背景网格 ==================== */
.bg-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.bg-option {
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    cursor: pointer;
    background-size: cover;
    background-position: center;
    border: 3px solid transparent;
    transition: all 0.2s ease;
    position: relative;
}

.bg-option:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.bg-option.selected {
    border-color: var(--win-glow);
    box-shadow: 0 0 12px var(--win-glow-shadow);
}

.bg-option.selected::after {
    content: '✓';
    position: absolute;
    top: 5px;
    right: 8px;
    color: var(--win-glow);
    font-size: 1.2rem;
    font-weight: bold;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* ==================== 上传区域 ==================== */
.upload-area {
    text-align: center;
}

.upload-btn {
    padding: 10px 24px;
    background: var(--btn-bg);
    color: var(--text-light);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
}

.upload-btn:hover {
    background: var(--btn-hover);
}

.upload-hint {
    color: var(--text-light);
    font-size: 0.8rem;
    opacity: 0.7;
    margin-top: 8px;
}

/* ==================== 游戏区域背景 ==================== */
body {
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
```

- [ ] **Step 2: 提交**

```bash
git add css/style.css
git commit -m "feat: 添加模态框和背景选择器样式"
```

---

### Task 3: 修改 js/game.js - 添加背景管理功能

**文件：**
- 修改: `js/game.js`

- [ ] **Step 1: 添加背景管理配置和常量**

在文件开头（BOARD_SIZE 常量附近）添加：
```javascript
// 预设背景配置
const PRESET_BACKGROUNDS = {
    'preset-1': 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1920',
    'preset-2': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    'preset-3': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=1920',
    'preset-4': 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=1920'
};
const STORAGE_KEY = 'gomoku_background';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
```

- [ ] **Step 2: 添加背景应用函数**

在文件末尾添加：
```javascript
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
    localStorage.setItem(STORAGE_KEY, bgValue);
}

// 从 localStorage 加载背景设置
function loadBackgroundSetting() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        applyBackground(saved);
        return saved;
    }
    return null;
}

// 将文件转为 Base64 DataURL
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_FILE_SIZE) {
            reject(new Error('图片大小不能超过 2MB'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

- [ ] **Step 3: 在游戏初始化时加载背景**

找到 `initGame()` 函数调用，在其后添加：
```javascript
// 页面加载时恢复背景设置
loadBackgroundSetting();
```

- [ ] **Step 4: 提交**

```bash
git add js/game.js
git commit -m "feat: 添加背景管理功能（应用、保存、加载）"
```

---

### Task 4: 修改 js/ui.js - 添加弹窗交互逻辑

**文件：**
- 修改: `js/ui.js`

- [ ] **Step 1: 添加弹窗事件绑定代码**

在文件末尾添加：
```javascript
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
        option.addEventListener('click', async () => {
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
            if (option.dataset.bg === currentBg) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
}

// 页面加载时初始化设置弹窗
document.addEventListener('DOMContentLoaded', initSettingsModal);
```

- [ ] **Step 2: 提交**

```bash
git add js/ui.js
git commit -m "feat: 添加背景设置弹窗交互逻辑"
```

---

### Task 5: 手动验证功能

**验证步骤：**

- [ ] **Step 1: 打开 index.html**

用浏览器打开文件，确认页面正常加载

- [ ] **Step 2: 点击设置按钮 ⚙️**

确认模态弹窗正常弹出

- [ ] **Step 3: 点击预设背景**

确认背景切换生效，刷新页面后背景保持

- [ ] **Step 4: 测试本地上传**

上传一张图片，确认背景切换生效

- [ ] **Step 5: 刷新页面**

确认所有设置被正确记住

---

## 验收检查清单

- [ ] 设置按钮可见且可点击
- [ ] 模态弹窗可正常打开/关闭
- [ ] 4 张预设木质纹理背景可选择
- [ ] 本地图片可上传并应用
- [ ] 刷新页面后背景选择被记住
- [ ] 棋盘和游戏功能不受背景影响
- [ ] 无控制台错误
