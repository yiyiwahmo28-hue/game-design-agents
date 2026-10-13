<div align="center">

<img src="docs/assets/logo.svg" width="72" height="72" alt="Game Design Agents 标识" />

# Game Design Agents

**把玩法需求交给 AI，拿到可玩原型。修改规则后，一起更新并验证。**

面向 AI 编程助手的游戏策划交付流程，附带能查看全过程、直接试玩的原创案例。

[![版本](https://img.shields.io/badge/version-0.2.0-176b61?style=flat-square)](package.json) [![检查](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/yiyiwahmo28-hue/game-design-agents/actions/workflows/ci.yml) [![MIT](https://img.shields.io/badge/license-MIT-176b61?style=flat-square)](LICENSE)

[**查看真实过程并试玩**](https://yiyiwahmo28-hue.github.io/game-design-agents/?lang=zh) · [开始自己的游戏](#开始自己的游戏) · [English](README.md)

</div>

> “做一个风暴前救援船只的小游戏。希望玩家需要权衡准备船只，还是立即救人。”

<img src="docs/assets/demo-zh-CN.gif" width="1100" alt="实际交付回放：需求、设计交接、可玩原型、追加修改与验证结果" />

*由已完成的执行记录和实际可玩页面录制、剪辑而成。页面展示保留的产物，不调用模型，也不模拟 Agent 正在思考。[录制说明](docs/demo.md) · [完整案例](docs/runs/rain-harbor/README.md)。*

## 解决什么问题？

AI 写好了策划案，另一次对话做出了原型；再改一条规则，文档、配置和游戏就可能各说各话。最后仍要你逐项找遗漏。

这套 Skill 把需求、设计决定、实现和验收接起来。每次修改都追踪受影响的产物，并留下可以检查的结果。

| 你提供什么 | 可以检查什么 |
| --- | --- |
| 一个新的玩法需求 | 方案取舍、规则说明、可编辑参数、可玩原型 |
| 一次修改要求 | 影响范围、更新后的行为、保留的约束、前后验证 |
| 一个待审查结果 | 实际执行记录、发现的问题、仍缺少的证据 |

## 开始自己的游戏

需要 Node.js 22+，以及能够读写文件、运行命令的 AI 编程助手。仓库自带工具无需安装依赖。

```sh
git clone https://github.com/yiyiwahmo28-hue/game-design-agents.git
cd game-design-agents
npm run new -- --name my-game --brief "做一个有燃料、待救船只和风暴倒计时的救援游戏。" --lang zh
```

**在打开这个仓库的 AI 助手中，粘贴命令打印出的提示。** 提示会指向 Skill 和你的新工作区。命令负责准备文件，助手使用已有模型和工具完成设计与实现。随后按生成的 `START_HERE.md` 查看交付物、运行原型，再提出修改。

[逐步教程与预期交付物 →](docs/start-your-game.zh-CN.md)

<details>
<summary>在已有项目中使用 Skill</summary>

```sh
npx skills add yiyiwahmo28-hue/game-design-agents --skill game-design-team
```

请助手使用 `game-design-team` 处理你的需求或修改任务。单独安装的 Skill 自包含，不附带本仓库的 Demo 和命令行工具。

</details>

<details>
<summary>本地运行已发布的案例</summary>

```sh
npm start
```

打开 `http://127.0.0.1:4173`，查看雨港救援的执行回放并试玩。原有[灯塔远征](https://yiyiwahmo28-hue.github.io/game-design-agents/lantern.html?lang=zh)保留在 `/lantern.html`。

`npm test` 检查实际行为和工具；`npm run simulate` 重新生成两个案例的证据；`npm run verify` 检查证据是否与当前输入、程序一致。

</details>

## 一次真实的“新需求 → 原型 → 修改”

**雨港救援**从[全新原创需求](docs/runs/rain-harbor/brief.md)开始。协调者分派系统与数值设计、核心实现，另行分派浏览器界面；第一版运行后，再发出追加修改，并安排独立审查。

[完整案例](docs/runs/rain-harbor/README.md)保留了设计文档、实际交接摘要、可执行输入、修改要求、验证结果和能力边界。任务按需要合并职责，协作模式有明确记录。

首页可以查看这些产物、直接试玩结果。游戏和验证使用同一份规则程序。固定案例的检查可在本地复现；生成自己的游戏仍需要助手执行，结果会受宿主和模型影响。

## 团队如何协作

| 职责 | 负责什么 |
| --- | --- |
| 设计负责人 | 体验目标、范围、设计选择、整合 |
| 系统策划 | 规则、边界情况、验收场景 |
| 数值策划 | 资源取舍、模型假设、场景结果 |
| 原型开发 | 让代码与配置实际执行规则 |
| 试玩审查 | 依据产物和观察提出可复现的问题 |

按任务启用需要的职责。宿主能调用子代理时，真实分派并明确编辑归属；否则按角色顺序处理并说明自检。[协作与兼容性 →](docs/workflow.zh-CN.md)

## 证据能说明什么？

- 一个已完成的原创案例及追加修改，保留了实现和验证产物。
- 确定性游戏行为与可重新计算的场景结果。
- 可以安装的 Skill，以及为自己的需求创建工作区的入口。

网页没有模型后端。测试不能证明玩家觉得好玩、理解了设计，也不能证明多 Agent 优于单助手；本项目尚无受控质量对比。可选的 `.claude/agents/` 角色定义尚未在 Claude Code 中完成端到端验证。新工作区的完整性检查只确认交付文件存在，验收仍需要阅读和运行。

## 参与改进

用自己的需求试一次，反馈具体失败：输入、预期、实际产物和所用助手。欢迎可复现的新案例、明确的流程缺陷与修复。

[贡献指南](CONTRIBUTING.md) · [反馈问题](https://github.com/yiyiwahmo28-hue/game-design-agents/issues) · [验证记录](docs/verification.md)

方法源于游戏系统策划与跨角色交付经验。公开指令和案例独立编写，不含雇主文档或内部游戏数据。[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)启发了工作室协作方向；本项目独立实现，无隶属关系。通用需求写作可搭配 [Write Clear Spec](https://github.com/yiyiwahmo28-hue/write-clear-spec)。

## 许可证

[MIT](LICENSE)。`private: true` 用于防止误发布到 npm，仓库源码仍然开放。
