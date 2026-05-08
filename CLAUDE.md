# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

五子棋网页游戏 —— 经典木纹风格，支持双人/单人（AI）模式。

**技术栈：** 纯 HTML5 + CSS3 + JavaScript（无框架依赖）

## 架构

```
index.html          # 入口页面
css/
  style.css         # 样式（含木纹主题）
js/
  game.js           # 核心游戏逻辑（棋盘、落子、胜负判定）
  ai.js             # AI 算法（简单/中等/困难三级难度）
  ui.js             # UI 交互（模式切换、重新开始等）
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
