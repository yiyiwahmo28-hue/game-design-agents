#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedArtifacts = ['design', 'config', 'prototype', 'verification', 'run-log'];
const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i;

const help = `Prepare a game brief for your tool-enabled AI assistant. No model is called.

  npm run new -- --name my-game --brief "Your game idea" [--lang en|zh]
  npm run new -- --name my-game --brief-file ./my-brief.md [--output ./my-run]
  npm run new -- --check ./runs/my-game

The default destination is <this repository>/runs/<name>.
--output selects an exact NEW directory (absolute or relative to your current directory).
Existing destinations, traversal segments, and symbolic-link ancestors are refused.
--check checks delivery-file completeness only; it does not run or grade a game.
`;

export function parseArgs(argv) {
  const options = {};
  const allowed = new Set(['name', 'brief', 'brief-file', 'lang', 'output', 'check']);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') {
      if (argv.length !== 1) throw new Error('--help must be used on its own.');
      return { help: true };
    }
    const key = argv[i].startsWith('--') ? argv[i].slice(2) : '';
    if (!allowed.has(key)) throw new Error(`Unknown option: ${argv[i]}`);
    if (Object.hasOwn(options, key)) throw new Error(`Duplicate option: --${key}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
      throw new Error(`Missing value for --${key}.`);
    }
    options[key] = argv[++i];
  }
  if (options.check !== undefined) {
    if (Object.keys(options).length !== 1) throw new Error('--check must be used on its own.');
    return options;
  }
  if (!options.name || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(options.name) || reservedNames.test(options.name)) {
    throw new Error('--name must be 1–64 lowercase letters, numbers, or hyphens; use a portable directory name.');
  }
  if ((options.brief === undefined) === (options['brief-file'] === undefined)) {
    throw new Error('Provide exactly one of --brief and --brief-file.');
  }
  options.lang ??= 'en';
  if (!['en', 'zh'].includes(options.lang)) throw new Error('--lang must be en or zh.');
  return options;
}

function safeTarget(value, cwd) {
  if (!value || value.includes('\0') || value.split(/[\\/]/).some(part => part === '..')) {
    throw new Error('Output paths must not contain empty values, NUL, or traversal (..) segments.');
  }
  const resolved = path.resolve(cwd, value);
  if (resolved === path.parse(resolved).root) throw new Error('A filesystem root cannot be a run directory.');
  return resolved;
}

async function noSymbolicAncestors(target) {
  let current = target;
  while (true) {
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in run paths: ${current}`);
      if (!stat.isDirectory() && current !== target) throw new Error(`Not a directory: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function fence(text) {
  const lengths = [...text.matchAll(/`+/g)].map(match => match[0].length);
  return '`'.repeat(Math.max(3, ...lengths.map(length => length + 1)));
}

function starterPrompt({ brief, root, destination, lang }) {
  const skill = path.join(root, 'skills', 'game-design-team', 'SKILL.md');
  const contract = path.join(destination, 'delivery.json');
  const quote = fence(brief);
  if (lang === 'zh') return `请使用这份 Skill 完成我的游戏需求：
${skill}

工作目录：${destination}
原始需求已完整保存在该目录的 brief.md。交付清单：${contract}。

先阅读 Skill，再把下面的需求实现为可以在浏览器试玩的原型。只在工作目录内创建和修改交付物，不发布、不安装全局工具，不需要复制仓库的示例玩法。

1. 明确玩家动作、体验假设、可逆假设和关键取舍，写出规则与验收条件。保留原始 brief.md。
2. 如宿主支持真实子代理，按独立任务分工并记录实际委派；否则明确使用单助手的顺序角色模式。不要编造对话、执行结果或独立评审。
3. 实际创建设计文档、参数配置和可操作的浏览器原型。配置必须被运行时读取；参数变更要传到真实行为与显示。
4. 启动并执行原型与行为检查。有浏览器工具时操作关键动作、检查错误并留存截图；没有时说明未执行的检查，不用代码阅读代替试玩证据。
5. 将实际步骤、参与方式、命令、结果、缺陷与修复记到运行记录。验证报告区分程序行为、模拟推算、观察结果与尚未验证的体验假设。
6. 更新 delivery.json 中的实际产物路径、revision 和 executionMode，并给出启动方法。用 node "${path.join(root, 'scripts', 'new-run.mjs')}" --check "${destination}" 检查交付文件是否齐全；此检查不证明游戏已运行或好玩。
7. 如果需求已包含后续修改，保存可重现的修改前版本或提交，完成影响分析、同步修改、前后验证。否则完成初版后交付，等待我提出下一次修改；不要自行编造用户反馈。

完整需求：
${quote}text
${brief}
${quote}
`;
  return `Use this Skill to deliver my game brief:
${skill}

Working directory: ${destination}
The exact original request is saved in brief.md there. Delivery manifest: ${contract}.

Read the Skill, then implement the request below as a playable browser prototype. Create and edit deliverables only inside the working directory. Do not publish or install global tools. The repository's example game is not a required design.

1. Define player actions, experience hypotheses, reversible assumptions, design tradeoffs, rules, and observable acceptance cases. Preserve the original brief.md.
2. If the host has real subagent tools, delegate independent tasks and record actual delegation. Otherwise disclose sequential role passes by one assistant. Do not fabricate conversations, execution, or independent review.
3. Create the design, parameter configuration, and working browser prototype. The runtime must consume the configuration; changed parameters must reach real behavior and player feedback.
4. Start and execute the prototype and behavior checks. If browser tools are available, operate key actions, inspect errors, and retain screenshots. Otherwise list the missing checks; source inspection is not browser execution.
5. Record actual steps, execution mode, commands, results, defects, and fixes in the run log. Separate behavior checks, modeled results, observations, and untested experience hypotheses in the verification report.
6. Update the real artifact paths, revision, and executionMode in delivery.json, and supply launch instructions. Run node "${path.join(root, 'scripts', 'new-run.mjs')}" --check "${destination}" to check delivery-file completeness. This does not prove execution or enjoyable design.
7. If the brief includes a revision request, preserve a reproducible baseline or commit, analyze the impact, propagate the change, and verify before/after behavior. Otherwise deliver the initial version and wait for my revision request; do not invent user feedback.

Complete brief:
${quote}text
${brief}
${quote}
`;
}

export async function createRun(options, { cwd = process.cwd(), root = repositoryRoot } = {}) {
  const brief = options.brief ?? await fs.readFile(path.resolve(cwd, options['brief-file']), 'utf8');
  if (!brief.trim()) throw new Error('The brief must contain a non-whitespace request.');
  const destination = safeTarget(options.output ?? path.join(root, 'runs', options.name), cwd);
  await noSymbolicAncestors(destination);
  try {
    await fs.lstat(destination);
    throw new Error(`Destination already exists; no files were changed: ${destination}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const prompt = starterPrompt({ brief, root, destination, lang: options.lang });
  const manifest = {
    schemaVersion: 1,
    name: options.name,
    language: options.lang,
    revision: 'initial',
    executionMode: 'unrecorded',
    artifacts: [
      { id: 'design', path: 'design/design.md' },
      { id: 'config', path: 'config/game.json' },
      { id: 'prototype', path: 'prototype/index.html' },
      { id: 'verification', path: 'evidence/verification.md' },
      { id: 'run-log', path: 'evidence/run-log.md' },
    ],
  };
  const title = options.lang === 'zh' ? '# 从这份需求开始' : '# Start with your brief';
  const note = options.lang === 'zh'
    ? '这里只创建了工作区，尚未生成游戏、调用模型或执行任何 Agent。打开支持文件与运行工具的 Codex 或 Claude Code，允许它访问上述 Skill 和工作目录，再复制以下完整提示。原型的运行方法由实际实现决定，应写在最终交付说明中。'
    : 'This command only prepared a workspace. No game has been generated, no model called, and no agent executed. Open Codex or Claude Code with file and execution tools, allow access to the Skill and working directory, and copy the full prompt below. The implemented prototype must include its actual launch instructions.';
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.mkdir(destination); // Exclusive creation: even an empty existing directory must not be reused.
  for (const directory of ['design', 'config', 'prototype', 'evidence']) {
    await fs.mkdir(path.join(destination, directory));
  }
  await fs.writeFile(path.join(destination, 'brief.md'), brief, { flag: 'wx', encoding: 'utf8' });
  await fs.writeFile(path.join(destination, 'START_HERE.md'), `${title}\n\n${note}\n\n---\n\n${prompt}`, { flag: 'wx', encoding: 'utf8' });
  await fs.writeFile(path.join(destination, 'delivery.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', encoding: 'utf8' });
  return { destination, prompt };
}

export async function checkRun(directory, { cwd = process.cwd() } = {}) {
  const destination = safeTarget(directory, cwd);
  await noSymbolicAncestors(destination);
  const manifestPath = path.join(destination, 'delivery.json');
  const manifestStat = await fs.lstat(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) throw new Error('delivery.json must be a regular file.');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const problems = [];
  if (manifest.schemaVersion !== 1) problems.push('Unsupported or missing schemaVersion.');
  if (!['delegated', 'sequential', 'mixed'].includes(manifest.executionMode)) {
    problems.push('Record actual executionMode: delegated, sequential, or mixed.');
  }
  if (typeof manifest.revision !== 'string' || !manifest.revision.trim()) problems.push('Record the delivered revision.');
  if (!Array.isArray(manifest.artifacts)) problems.push('artifacts must be an array.');
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  const seenPaths = new Set();
  for (const id of expectedArtifacts) {
    const entries = artifacts.filter(item => item?.id === id);
    if (entries.length !== 1) {
      problems.push(`Expected exactly one artifact: ${id}.`);
      continue;
    }
    const value = entries[0].path;
    if (typeof value !== 'string' || !value.trim() || value.includes('\0') || path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || value.includes(':') || value.split(/[\\/]/).some(part => part === '..')) {
      problems.push(`${id}: path must be relative and stay inside the run directory.`);
      continue;
    }
    const target = path.resolve(destination, value.replaceAll('\\', '/'));
    const key = process.platform === 'win32' ? target.toLowerCase() : target;
    if (seenPaths.has(key)) {
      problems.push(`${id}: each required artifact must have its own file.`);
      continue;
    }
    seenPaths.add(key);
    if (['brief.md', 'START_HERE.md', 'delivery.json'].some(file => {
      const instruction = path.resolve(destination, file);
      return (process.platform === 'win32' ? instruction.toLowerCase() : instruction) === key;
    })) {
      problems.push(`${id}: workspace instructions are not a delivered artifact.`);
      continue;
    }
    try {
      await noSymbolicAncestors(target);
      const stat = await fs.lstat(target);
      if (!stat.isFile() || stat.size === 0) problems.push(`${id}: missing a non-empty regular file at ${value}.`);
    } catch (error) {
      if (error.code === 'ENOENT') problems.push(`${id}: missing ${value}.`);
      else problems.push(`${id}: ${error.message}`);
    }
  }
  return { destination, ok: problems.length === 0, problems };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) return console.log(help);
    if (options.check !== undefined) {
      const result = await checkRun(options.check);
      console.log(`Delivery-file completeness: ${result.ok ? 'PASS' : 'INCOMPLETE'}\n${result.destination}`);
      for (const problem of result.problems) console.log(`- ${problem}`);
      console.log('This checks declared files only. Read the verification report for executed checks and limits.');
      if (!result.ok) process.exitCode = 1;
      return;
    }
    const result = await createRun(options);
    console.log(options.lang === 'zh'
      ? `已创建工作区：${result.destination}\n尚未运行模型或生成游戏。把以下提示复制给支持工具的 AI 助手（也保存在 START_HERE.md）：\n\n${result.prompt}`
      : `Prepared workspace: ${result.destination}\nNo model was called and no game generated. Copy this prompt to a tool-enabled AI assistant (also saved in START_HERE.md):\n\n${result.prompt}`);
  } catch (error) {
    console.error(`new-run: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
