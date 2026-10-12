<div align="center">

<img src="docs/assets/logo.svg" width="76" height="76" alt="Game Design Agents 标识" />

<h1>Game Design Agents</h1>

**你的 AI 游戏策划团队。把想法变成能玩的系统。**

设计规则、调整数值、运行原型；修改需求时，让它们一起更新。

[![版本](https://img.shields.io/badge/version-0.1.0-176b61?style=flat-square)](package.json) [![检查](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml) [![MIT](https://img.shields.io/badge/license-MIT-176b61?style=flat-square)](LICENSE)

[**直接试玩**](https://yiyiwahmo28-hue.github.io/game-design-agents/?lang=zh) · [快速开始](#快速开始) · [协作方式](docs/workflow.zh-CN.md) · [English](README.md)

</div>

## 看一次设计修改如何变成可玩结果

> “第一次升级等得太久。让它提前，但保持完整升级路线的总成本不变。”

<div align="center">
<img src="docs/assets/demo-zh-CN.gif" width="1000" alt="在灯塔远征原型中切换原版与调整版，实际采集、升级，并比较模拟结果" />
</div>

*由实际浏览器画面剪辑成的短演示。示例是可运行的确定性游戏，画面不代表 AI 正在实时执行。[证据与复现](docs/demo.md) · [静态预览](docs/assets/demo-zh-CN.png)。*

可以直接玩两个版本、自己选择行动，也可以比较两种明确策略的模拟结果。浏览器与模拟程序使用**同一套游戏逻辑**。[已提交的模拟报告](docs/evidence/simulation.md)列出了假设、计算结果与取舍。

## 它解决什么问题？

AI 写出的策划案、数值表和原型，可能各自合理，却没有实现同一套规则。一次修改改善了前期体验，也可能意外改变后面的节奏。

Game Design Agents 帮助你的助手把设计决定落实到产物，并检查修改后的结果。适合需要策划与数值搭档的独立开发者，以及快速验证玩法的小团队。

| 你提出的需求 | 团队跟进到哪里 |
| --- | --- |
| “把这个玩法做成能玩的循环。” | 体验目标 → 规则 → 参数 → 原型 → 可观察的验收 |
| “这段成长太慢了。” | 玩家行为假设 → 方案选择 → 计算 → 可玩对照 |
| “修改这个奖励规则。” | 确认决定 → 追踪影响 → 实现 → 回归验证证据 |

示例足够小，可以完整检查。协作方法也可以用于自己的项目；具体引擎和数据链路的接入，需要在目标项目中实现并验证。

## 快速开始

**先试玩：**[打开浏览器 Demo](https://yiyiwahmo28-hue.github.io/game-design-agents/?lang=zh)，无需账号或 API Key。

**让助手使用这套团队：**通过 [Skills CLI](https://github.com/vercel-labs/skills) 安装。

```sh
npx skills add yiyiwahmo28-hue/game-design-agents --skill game-design-team
```

然后告诉助手：

```text
使用 $game-design-team 设计一个小型探索游戏。
我希望采集、升级和探索围绕同一种资源形成选择。
帮我确定第一版可玩循环，再在当前工作区实现并验证。
```

Skill 使用你已有助手的模型和工具。宿主支持委派时，由协调者分派独立工作；否则明确按角色顺序处理。它没有额外运行一个 Agent 服务。

<details>
<summary>在本地运行并修改示例</summary>

需要 Node.js 22 或更新版本，无需安装依赖。

```sh
git clone https://github.com/yiyiwahmo28-hue/game-design-agents.git
cd game-design-agents
npm start
```

打开 `http://127.0.0.1:4173`。`npm test` 检查游戏逻辑，`npm run simulate` 重新生成模拟报告，`npm run verify` 检查报告是否与当前配置一致。

`package.json` 中的 `private: true` 用于防止误发布到 npm；本仓库源码仍按 MIT 协议开放。

</details>

<details>
<summary>手动安装与 Claude Code 角色</summary>

将完整的 [`skills/game-design-team`](skills/game-design-team) 文件夹放入助手支持的 Skill 目录，保留引用文档和元数据。具体调用语法取决于宿主。

仓库还提供五个可选的 [Claude Code 原生子代理定义](.claude/agents/)。可以在完整克隆的仓库中使用，或复制到自己项目的 `.claude/agents/`，注意保留已有文件。协调指令位于可移植 Skill 中。详见[安装与兼容性](docs/workflow.zh-CN.md)。

这些角色文件作为宿主适配提供，本次发布尚未在 Claude Code 中做端到端运行验证。

</details>

## 五个角色，明确交接

| 角色 | 交付内容 |
| --- | --- |
| 设计负责人 | 体验目标、约束、已确认选择与接受的副作用 |
| 系统策划 | 规则、状态变化、边界情况与验收场景 |
| 数值策划 | 可编辑参数、公式或模拟结果、调参影响 |
| 原型开发 | 实现已确认规则的可玩版本 |
| 试玩审查 | 预期与实际的对照、复现步骤和待验证问题 |

每次交接说明任务基线、设计决定、产物与证据。协调者负责整合共享改动，有依赖的工作等待输入。阅读[协作方式](docs/workflow.zh-CN.md)与[角色指令](skills/game-design-team/references/roles.md)。

## v0.1 包含什么

- 可移植的 **game-design-team Skill**，以及可选的 Claude Code 角色文件。
- 原创可玩的浏览器示例 **Lantern Expedition / 灯塔远征**。
- 两份规则配置、一套共用逻辑和可复现的修改前后模拟。
- 自动行为检查、双语说明与可视化演示。

浏览器示例没有模型后端。模拟验证明确策略下的结果，好不好玩需要实际试玩。本版本尚无多 Agent 优于单助手的量化结论。

## 文档与参与

- [协作方式与安装](docs/workflow.zh-CN.md)
- [体验审查：目标、选择、反馈与节奏](skills/game-design-team/references/experience-review.md)
- [原创需求与设计选择](docs/example.md)
- [模拟证据](docs/evidence/simulation.md) · [画面证据](docs/demo.md)
- [一次真实的隔离 Skill 试用](docs/evidence/skill-forward-test.zh-CN.md)
- [贡献指南](CONTRIBUTING.md) · [反馈问题](https://github.com/yiyiwahmo28-hue/game-design-agents/issues)

源于游戏系统策划的工作方法。公开指令与案例均独立编写，不含雇主文档或内部游戏数据。通用需求写作可搭配 [Write Clear Spec](https://github.com/yiyiwahmo28-hue/write-clear-spec)。

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) 启发了工作室协作方向的探索。本项目独立实现，与该项目、Anthropic 及 OpenAI 均无隶属关系。

## 许可证

[MIT](LICENSE)。
