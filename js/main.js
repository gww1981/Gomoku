/**
 * 五子棋游戏 — 主入口模块
 * 作为 ES Module 入口，导入所有模块初始化游戏
 */

// 按依赖顺序导入（side-effect imports：每个模块自行注册自身到全局）
import './game.js';
import './ai.js';
import './event-emitter.js';
import './timer-controller.js';
import './replay.js';
import './game-controller.js';
import './ui-music.js';
import './ui-replay.js';
import './ui-settings.js';
import './ui-core.js';  // 最后加载 — 触发 DOMContentLoaded 初始化
