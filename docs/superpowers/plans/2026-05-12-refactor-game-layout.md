# Game Layout Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Gomoku interface into a compact, board-first game table layout that is cleaner, more intuitive, and responsive.

**Architecture:** Keep the current vanilla HTML/CSS/JS architecture. Preserve the existing DOM ids used by `js/ui-core.js` and tests, while reorganizing the page into header, game status rail, board stage, and action rail. Use CSS custom properties and scoped layout classes so the visual polish stays in `css/style.css` and game behavior remains in `js/ui-core.js`.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, QUnit browser tests.

---

## File Structure

- Modify: `index.html`
  - Reorder top-level game UI into `header`, `main.game-shell`, `section.game-status`, `section.board-stage`, and `section.game-actions`.
  - Preserve ids: `difficulty`, `settings`, `status-bar`, `status`, `status-actions`, `timer-black`, `timer-white`, `board`, `settings-modal`.
  - Fix visible Chinese copy in the touched HTML so the refactored page is readable.

- Modify: `css/style.css`
  - Replace the oversized top-bar and separated status/timer spacing with a board-first layout.
  - Add responsive rules for desktop and mobile.
  - Keep existing stone, board-grid, modal, replay, music, and timer behavior classes working.

- Modify: `tests/index.html`
  - Mirror only the required DOM skeleton changes needed for QUnit tests.
  - Preserve fixture ids expected by `js/ui-core.js`.

- Modify: `tests/ui-core-mode-selection.test.js`
  - Update assertions only if visible Chinese labels are corrected in `js/ui-core.js` during implementation.
  - Do not add new behavior expectations unless the layout change needs a stable DOM contract.

- Optional Modify: `js/ui-core.js`
  - Only fix user-visible Chinese strings and button labels if implementation confirms the current mojibake is in the file contents, not just terminal rendering.
  - Do not change game state, timer, AI, replay, or undo logic for this layout refactor.

---

### Task 1: Add Layout Contract Tests

**Files:**
- Modify: `tests/index.html`
- Create: `tests/ui-layout.test.js`

- [ ] **Step 1: Add the layout test script to the QUnit runner**

Add this line in `tests/index.html` after `ui-core-mode-selection.test.js`:

```html
  <script src="ui-layout.test.js"></script>
```

Expected relevant tail:

```html
  <script src="board.test.js"></script>
  <script src="ui-core-last-move.test.js"></script>
  <script src="audio-manager.test.js"></script>
  <script src="ui-core-mode-selection.test.js"></script>
  <script src="ui-layout.test.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write the failing layout contract tests**

Create `tests/ui-layout.test.js`:

```javascript
/**
 * Layout contract tests for the board-first Gomoku interface.
 */
QUnit.module('UI Layout Contract', function() {
  QUnit.test('main game regions exist in the page shell', function(assert) {
    assert.ok(document.querySelector('.game-container'), 'game container exists');
    assert.ok(document.querySelector('.header'), 'header exists');
    assert.ok(document.querySelector('.game-shell'), 'game shell exists');
    assert.ok(document.querySelector('.game-status'), 'status rail exists');
    assert.ok(document.querySelector('.board-stage'), 'board stage exists');
    assert.ok(document.querySelector('.game-actions'), 'action rail exists');
  });

  QUnit.test('existing JavaScript ids are preserved', function(assert) {
    ['difficulty', 'settings', 'status-bar', 'status', 'status-actions', 'timer-black', 'timer-white', 'board'].forEach(function(id) {
      assert.ok(document.getElementById(id), '#' + id + ' exists');
    });
  });

  QUnit.test('board remains a 15 by 15 grid after initialization', function(assert) {
    var board = document.getElementById('board');
    assert.ok(board, 'board exists');
    assert.equal(board.querySelectorAll('.cell').length, 225, 'board has 225 cells');
  });
});
```

- [ ] **Step 3: Run tests to verify the new layout contract fails before implementation**

Run:

```bash
npx playwright test
```

Expected: FAIL in the layout contract because `.game-shell`, `.game-status`, `.board-stage`, and `.game-actions` do not exist yet.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/index.html tests/ui-layout.test.js
git commit -m "test: add game layout contract"
```

---

### Task 2: Refactor HTML Into Board-First Regions

**Files:**
- Modify: `index.html`
- Modify: `tests/index.html`

- [ ] **Step 1: Replace the visible game layout skeleton in `index.html`**

Replace the top-level visible game markup inside `<div class="game-container">` before the settings modal with this structure. Keep the existing settings modal after this block.

```html
    <header class="header">
      <h1>五子棋</h1>
      <div class="header-controls">
        <div class="mode-selector" aria-label="游戏模式">
          <button type="button" class="mode-btn active" data-mode="pvp">双人</button>
          <button type="button" class="mode-btn" data-mode="ai">人机</button>
        </div>
        <select id="difficulty" class="difficulty-select hidden" aria-label="AI 难度">
          <option value="easy">简单</option>
          <option value="medium" selected>中等</option>
          <option value="hard">困难</option>
        </select>
        <button type="button" id="settings" class="icon-btn" aria-label="设置">⚙</button>
      </div>
    </header>

    <main class="game-shell">
      <section id="status-bar" class="game-status" aria-live="polite">
        <span id="timer-black" class="timer-chip timer-active">黑方 30s</span>
        <div class="status-center">
          <span id="status">选择模式后点击开始</span>
          <span id="status-actions"></span>
        </div>
        <span id="timer-white" class="timer-chip">白方 30s</span>
      </section>

      <section class="board-stage" aria-label="棋盘">
        <div id="board" class="board"></div>
      </section>

      <section class="game-actions" aria-label="对局工具">
        <span class="action-hint">黑方先手</span>
        <span class="action-hint">30 秒一步</span>
      </section>
    </main>
```

- [ ] **Step 2: Update `tests/index.html` with the same structural shell**

Replace the current loose test fixture elements from `<div id="board"></div>` through `<span id="timer-white"></span>` with:

```html
  <div class="game-container">
    <header class="header">
      <h1>五子棋</h1>
      <div class="header-controls">
        <div class="mode-selector">
          <button type="button" class="mode-btn active" data-mode="pvp">双人</button>
          <button type="button" class="mode-btn" data-mode="ai">人机</button>
        </div>
        <select id="difficulty"></select>
        <button id="settings"></button>
      </div>
    </header>
    <main class="game-shell">
      <section id="status-bar" class="game-status">
        <span id="timer-black" class="timer-chip"></span>
        <div class="status-center">
          <span id="status">选择模式后点击开始</span>
          <span id="status-actions"></span>
        </div>
        <span id="timer-white" class="timer-chip"></span>
      </section>
      <section class="board-stage">
        <div id="board"></div>
      </section>
      <section class="game-actions">
        <span class="action-hint">黑方先手</span>
        <span class="action-hint">30 秒一步</span>
      </section>
    </main>
  </div>
```

- [ ] **Step 3: Run the layout tests**

Run:

```bash
npx playwright test
```

Expected: Layout contract tests pass or fail only because CSS is not complete. Existing UI behavior tests should still find all preserved ids.

- [ ] **Step 4: Commit the HTML structure**

```bash
git add index.html tests/index.html
git commit -m "refactor: introduce board-first game layout shell"
```

---

### Task 3: Restyle The Header, Status Rail, And Board Stage

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Replace the page container and header layout styles**

Update the base variables and `.game-container`, `.header`, `.header-controls`, `.mode-selector`, `.mode-btn`, `.difficulty-select`, and `.icon-btn` styles with:

```css
:root {
    --wood-light: #DEB887;
    --wood-medium: #CD853F;
    --wood-dark: #8B4513;
    --wood-shadow: rgba(92, 52, 24, 0.22);
    --grid-line: #5D4037;
    --board-bg: #F5DEB3;
    --black-stone: #1a1a1a;
    --black-stone-highlight: #333;
    --white-stone: #f5f5f5;
    --white-stone-highlight: #fff;
    --stone-shadow: rgba(0, 0, 0, 0.4);
    --win-glow: #FFD700;
    --win-glow-shadow: rgba(255, 215, 0, 0.6);
    --surface: #f7f1e8;
    --surface-raised: #fffaf1;
    --ink: #3f2c22;
    --ink-muted: #7f6857;
    --header-bg: linear-gradient(180deg, #815027 0%, #67401f 100%);
    --btn-bg: #67401f;
    --btn-hover: #7a4b24;
    --text-light: #f6e7c6;
    --accent: #5d9b62;
    --accent-hover: #4f8a54;
    --replay-speed: 800;
    --search-depth: 4;
}

body {
    min-height: 100vh;
    background:
        radial-gradient(circle at top, rgba(222, 184, 135, 0.22), transparent 34rem),
        var(--surface);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    color: var(--ink);
}

.game-container {
    width: min(100%, 760px);
    min-width: 320px;
    margin: 0 auto;
    padding: 18px 18px 28px;
    font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.header {
    width: 100%;
    min-height: 76px;
    padding: 14px 18px;
    background: var(--header-bg);
    border-radius: 8px;
    box-shadow: 0 10px 26px var(--wood-shadow);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
}

.header h1 {
    color: var(--text-light);
    font-size: clamp(1.7rem, 4vw, 2.45rem);
    line-height: 1;
    letter-spacing: 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.28);
}

.header-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.mode-selector {
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    background: rgba(64, 38, 18, 0.36);
    border-radius: 8px;
}

.mode-btn {
    min-width: 72px;
    min-height: 42px;
    padding: 8px 14px;
    background: transparent;
    color: var(--text-light);
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.mode-btn:hover {
    background: rgba(255, 255, 255, 0.08);
}

.mode-btn.active {
    border-color: var(--win-glow);
    background: rgba(255, 215, 0, 0.08);
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.18);
}

.difficulty-select {
    min-height: 42px;
    padding: 0 12px;
    color: var(--text-light);
    background: rgba(64, 38, 18, 0.36);
    border: 1px solid rgba(246, 231, 198, 0.26);
    border-radius: 6px;
}

.difficulty-select.hidden {
    display: none;
}

.icon-btn {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid rgba(246, 231, 198, 0.32);
    background: rgba(255, 250, 241, 0.12);
    color: var(--text-light);
    cursor: pointer;
    font-size: 1.2rem;
}
```

- [ ] **Step 2: Replace status and timer styles**

Replace the current `#status`, `#status-bar`, `#timer-container`, `.timer-*`, `#status-actions`, and `.start-btn` layout styles with:

```css
.game-shell {
    width: 100%;
    display: grid;
    gap: 14px;
    padding-top: 18px;
}

#status-bar,
.game-status {
    width: 100%;
    min-height: 72px;
    display: grid;
    grid-template-columns: minmax(110px, 1fr) minmax(220px, 1.4fr) minmax(110px, 1fr);
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--surface-raised);
    border: 1px solid rgba(103, 64, 31, 0.12);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(92, 52, 24, 0.1);
}

.status-center {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    text-align: center;
}

#status {
    width: auto;
    padding: 0;
    margin: 0;
    text-align: center;
    font-size: 1.05rem;
    color: var(--ink);
    font-weight: 800;
}

.timer-chip {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(93, 64, 55, 0.07);
    color: var(--ink-muted);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.05rem;
    user-select: none;
}

.timer-active {
    color: var(--ink);
    background: rgba(255, 215, 0, 0.14);
    box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.4);
    font-weight: 800;
}

.timer-warning {
    color: #b94b27 !important;
}

.timer-critical {
    color: #b62920 !important;
    animation: timer-blink 0.5s ease-in-out infinite;
}

#status-actions {
    display: inline-flex;
    gap: 8px;
    align-items: center;
}

#status-actions button {
    min-height: 38px;
    padding: 7px 14px;
    background: var(--btn-bg);
    color: var(--text-light);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 700;
    transition: background 0.18s ease, transform 0.18s ease;
}

#status-actions button:hover {
    background: var(--btn-hover);
    transform: translateY(-1px);
}

#status-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.start-btn {
    background: var(--accent) !important;
}

.start-btn:hover {
    background: var(--accent-hover) !important;
}
```

- [ ] **Step 3: Add board stage and action rail styles**

Add these styles near the board section:

```css
.board-stage {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 0 4px;
}

.board {
    width: min(92vw, 620px);
    aspect-ratio: 1;
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    gap: 0;
}

.cell {
    width: auto;
    height: auto;
    aspect-ratio: 1;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stone-black,
.stone-white {
    width: 78%;
    height: 78%;
}

.game-actions {
    min-height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    color: var(--ink-muted);
    font-size: 0.9rem;
}

.action-hint {
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(103, 64, 31, 0.08);
}
```

- [ ] **Step 4: Remove conflicting old responsive cell width rules**

Delete or override these old rules so the board size is controlled by the board container:

```css
@media (max-width: 500px) {
    .cell {
        width: 22px;
        height: 22px;
    }
}

@media (min-width: 600px) {
    .cell {
        width: 40px;
        height: 40px;
    }
}
```

Keep responsive stone ring sizes by replacing them with percentage-based rules:

```css
.cell.last-move.stone-black::after,
.cell.last-move.stone-white::after {
    width: 96%;
    height: 96%;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npx playwright test
```

Expected: QUnit and layout contract tests pass.

- [ ] **Step 6: Commit the CSS layout**

```bash
git add css/style.css
git commit -m "style: restyle game layout around board"
```

---

### Task 4: Add Responsive Polish

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add mobile layout rules**

Add this media query near the existing responsive section:

```css
@media (max-width: 560px) {
    .game-container {
        padding: 10px;
    }

    .header {
        min-height: 0;
        align-items: stretch;
        flex-direction: column;
        padding: 12px;
    }

    .header h1 {
        font-size: 1.65rem;
        text-align: center;
    }

    .header-controls {
        justify-content: center;
    }

    .mode-selector {
        width: 100%;
    }

    .mode-btn {
        flex: 1;
        min-width: 0;
    }

    #status-bar,
    .game-status {
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
            "black white"
            "status status";
        gap: 8px;
        padding: 10px;
    }

    #timer-black {
        grid-area: black;
    }

    #timer-white {
        grid-area: white;
    }

    .status-center {
        grid-area: status;
    }

    #status {
        font-size: 0.98rem;
    }

    .board {
        width: min(94vw, 620px);
        border-width: 6px;
        padding: 6px;
    }

    .game-actions {
        flex-wrap: wrap;
    }
}
```

- [ ] **Step 2: Add reduced motion support for interactive hover shifts**

Extend the existing `prefers-reduced-motion` block:

```css
@media (prefers-reduced-motion: reduce) {
    .cell.last-move.stone-black::after,
    .cell.last-move.stone-white::after,
    .timer-critical {
        animation: none;
    }

    .mode-btn,
    #status-actions button,
    .upload-btn,
    .control-btn {
        transition: none;
    }
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npx playwright test
```

Expected: all tests pass.

- [ ] **Step 4: Commit responsive polish**

```bash
git add css/style.css
git commit -m "style: add responsive game layout polish"
```

---

### Task 5: Manual Browser Verification

**Files:**
- No required source edits.

- [ ] **Step 1: Start a local static server**

Run:

```bash
npx serve . -l 8080
```

Expected: server prints a local URL at `http://localhost:8080`.

- [ ] **Step 2: Verify desktop layout**

Open `http://localhost:8080` at approximately `1366 x 768`.

Check:
- Header is compact and does not dominate the first viewport.
- Status rail shows black timer, status/start controls, and white timer in one row.
- Board is visible without excessive empty space above it.
- Start, restart, undo, mode switching, difficulty visibility, and settings button still work.
- No text overlaps or escapes button boundaries.

- [ ] **Step 3: Verify mobile layout**

Resize to approximately `390 x 844`.

Check:
- Header stacks cleanly.
- Mode buttons fit in one row.
- Timers appear side by side above the status text.
- Board fits within the viewport width.
- Settings modal still opens and stays usable.

- [ ] **Step 4: Capture final status**

Run:

```bash
git status --short --branch
```

Expected: working tree is clean except for pre-existing unrelated untracked files that were present before this plan.

---

## Self-Review

**Spec coverage:** The plan covers the requested layout refactor, keeps the interface美观、直观、简洁, preserves JavaScript ids, adds test coverage, and stops before implementation until confirmed.

**Placeholder scan:** No TBD/TODO/fill-in placeholders remain. Each task includes exact files, code snippets, commands, and expected outcomes.

**Type and contract consistency:** The plan consistently uses existing ids `status-bar`, `status`, `status-actions`, `timer-black`, `timer-white`, `board`, `difficulty`, and `settings`, so `js/ui-core.js` can continue to bind behavior without a logic rewrite.
