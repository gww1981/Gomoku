# 领域词汇表

本文档定义五子棋项目的领域概念，为架构重构提供统一语言。

## 核心概念

| 术语 | 定义 | 示例/备注 |
|------|------|----------|
| **Position** | 棋盘上的一个交叉点 `{row, col}` | `(7, 7)` 表示第8行第8列 |
| **Player** | 下棋方 | `1` = 黑方（先手），`2` = 白方（后手/AI） |
| **Stone** | 落在棋盘上的棋子 | 由 Player 标识 |
| **Empty** | 未落子的空位 | `0` |
| **Line** | 同一方向上连续排列的棋子 | `{ positions: [{row,col},...], openEnds: [forward, backward] }` |
| **WinLine** | 连成五子的获胜组合 | 5 个连续同色棋子 |
| **Score** | 位置价值评分（攻防总分） | 用于 AI 决策 |

## 棋盘相关

| 术语 | 定义 |
|------|------|
| **Board** | 15×15 棋盘数据模型 |
| **Grid** | 棋盘的二维数组表示 `number[][]` |
| **Move** | 一次落子动作，包含 position 和 player |
| **PlayerMove** | 玩家在可交互状态下提交的一次落子尝试，由游戏流程决定是否接受 |

## AI 相关

| 术语 | 定义 |
|------|------|
| **Difficulty** | AI 难度等级：`'easy'` / `'medium'` / `'hard'` |
| **AIMove** | AI 的落子决策 `{row, col}` |
| **CandidateMoves** | Minimax 搜索时的候选落子位置 |
| **Simulation** | 模拟落子，用于 AI 搜索树推演 |

## 接口设计原则

- **Board** 是深度模块，封装所有棋盘操作
- **AI** 通过 Board 接口操作棋盘，不直接访问 grid
- **Score** 由 `Board.evaluatePosition()` 计算，体现攻防价值
