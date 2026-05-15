# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.



## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `gww1981/Gomoku`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo using `docs/CONTEXT.md` for domain language and `docs/adr/` for architecture decisions. See `docs/agents/domain.md`.


## 项目概述

五子棋网页游戏 —— 经典木纹风格，支持双人/单人（AI）模式。

**技术栈：** 纯 HTML5 + CSS3 + JavaScript（无框架依赖）

## 架构

```
index.html          # 入口页面
css/
  style.css         # 样式（含木纹主题）
js/
  game.js           # 核心游戏模型（Board 类：棋盘数据、落子、胜负判定）
  ai.js             # AI 算法（简单/中等/困难三级难度）
  replay.js         # ReplayManager（录像保存、读取、回放控制）
  ui-core.js        # 游戏核心交互（落子事件、胜负提示、悔棋、计时器）
  ui-settings.js    # 设置弹窗框架、背景设置、Tab 切换
  ui-music.js       # AudioManager + 音乐播放控制
  ui-replay.js      # 录像列表 UI、回放触发
```

## 开发命令

本项目为纯静态页面，直接用浏览器打开 `index.html` 即可运行。

如需本地服务器：
```bash
npx serve .
# 或
python -m http.server 8080
```

## AI 算法设计

| 难度 | 算法 |
|------|------|
| 简单 | 随机落子 |
| 中等 | 启发式评分（威胁识别） |
| 困难 | Minimax + Alpha-Beta 剪枝（深度 4 层） |

## 胜负判定

横/竖/左斜/右斜方向连五即胜。获胜时亮显五子连线。

