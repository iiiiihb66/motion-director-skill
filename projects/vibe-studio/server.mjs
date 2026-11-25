import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const STUDIO_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(STUDIO_DIR, '../..');
const PILOT_DIR = path.join(ROOT_DIR, 'projects/vibe-pilot');
const CATALOG_PATH = path.join(ROOT_DIR, 'management/catalog.js');
const PORT = Number(process.env.VIBE_STUDIO_PORT || 4399);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const TEMPLATES = [
  { id: 'A', name: 'A · 猜谜概念片', structure: '反直觉提问 → 拆解机制 → 揭晓反转', note: '适合物理、数学、反常识原理' },
  { id: 'B', name: 'B · 两难选择片', structure: '两难局面 → 推演代价 → 破局视角', note: '适合历史决策、博弈、经济现象' },
  { id: 'C', name: 'C · 痛点原理片', structure: '生活痛点 → 微观机理 → 正确做法', note: '适合日常电器、习惯误区、效率技巧' },
  { id: 'D', name: 'D · 一条主线片', structure: '起点悬念 → 因果链条 → 终点闭环', note: '适合演进史、实验过程、古籍考据' },
  { id: 'E', name: 'E · 闯关片', structure: '关卡挑战 → 逐层排除 → 终极通关', note: '适合排错、方法论、多步验证' },
  { id: 'F', name: 'F · 六面轮转片', structure: '核心道具 → 多维切面 → 整体重构', note: '适合多视角对比、空间几何概念' },
];

const jobs = new Map();
let jobSeq = 1;

function runCmd(cmd, args, cwd = ROOT_DIR) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: process.env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${cmd} exited with ${code}`));
    });
  });
}

function startJob(label, steps) {
  const id = `job-${jobSeq++}`;
  const job = { id, label, status: 'running', logs: `[${new Date().toLocaleTimeString()}] 开始：${label}\n`, error: null };
  jobs.set(id, job);

  (async () => {
    try {
      for (const step of steps) {
        job.logs += `\n$ ${step.cmd} ${step.args.join(' ')}\n`;
        await new Promise((resolve, reject) => {
          const child = spawn(step.cmd, step.args, { cwd: ROOT_DIR, env: process.env });
          child.stdout.on('data', d => { job.logs += d.toString(); });
          child.stderr.on('data', d => { job.logs += d.toString(); });
          child.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`退出码 ${code}`));
          });
        });
      }
      job.status = 'done';
      job.logs += `\n[${new Date().toLocaleTimeString()}] ✓ 全部完成\n`;
    } catch (err) {
      job.status = 'error';
      job.error = err.message;
      job.logs += `\n✗ 失败：${err.message}\n`;
    }
  })();

  return job;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function serveFile(res, filePath) {
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(await fs.readFile(filePath));
}

async function getState() {
  const episodesData = JSON.parse(await fs.readFile(path.join(PILOT_DIR, 'episodes.json'), 'utf8'));
  let timings = null;
  let film = null;
  try { timings = JSON.parse(await fs.readFile(path.join(PILOT_DIR, 'timings.json'), 'utf8')); } catch {}
  try { film = JSON.parse(await fs.readFile(path.join(PILOT_DIR, 'film.json'), 'utf8')); } catch {}

  let geminiPlan = [];
  let edgePlan = [];
  try {
    const [gRes, eRes] = await Promise.all([
      runCmd('python3', ['projects/vibe-pilot/voice.py', '--plan']),
      runCmd('python3', ['projects/vibe-pilot/voice.py', '--plan', '--engine', 'edge']),
    ]);
    geminiPlan = JSON.parse(gRes.stdout);
    edgePlan = JSON.parse(eRes.stdout);
  } catch {}

  return { episodesData, timings, film, geminiPlan, edgePlan, templates: TEMPLATES };
}

async function publishToCatalog(ep) {
  const raw = await fs.readFile(CATALOG_PATH, 'utf8');
  const prefix = 'window.MOTION_CATALOG = ';
  if (!raw.startsWith(prefix)) throw new Error('catalog.js 格式不符合预期');
  const catalog = JSON.parse(raw.slice(prefix.length).replace(/;\s*$/, ''));
  const cardId = `vibe-${ep.id}`;
  const previewPath = `projects/vibe-pilot/${ep.id}.html`;
  const existing = catalog.projects.find(p => p.id === cardId);

  if (existing) {
    existing.title = `知识手记 · ${ep.title}`;
    existing.note = `${ep.summary || ep.structure}（已通过 Vibe Studio 更新）`;
    if (!existing.versions.some(v => v.path === previewPath)) {
      existing.versions.unshift({
        id: previewPath,
        label: 'Vibe Studio 生成版本',
        path: previewPath,
        mode: 'page',
        runtimeNote: '由 Vibe Studio 打包发布。',
      });
    }
  } else {
    catalog.projects.unshift({
      id: cardId,
      title: `知识手记 · ${ep.title}`,
      kind: '混合',
      stage: 'review',
      image: 'projects/vibe-pilot/refraction-preview.jpg',
      cover: 'Vibe Studio 新建剧集 · 待审阅',
      note: ep.summary || ep.structure,
      aliases: ['Vibe知识大赏', 'Vibe Studio', ep.id, ep.title],
      versions: [
        {
          id: previewPath,
          label: 'Vibe Studio 生成版本',
          path: previewPath,
          mode: 'page',
          runtimeNote: '由 Vibe Studio 本地工作台生成，可离线打开。',
        },
      ],
    });
  }
  catalog.updated = new Date().toISOString().slice(0, 10);
  await fs.writeFile(CATALOG_PATH, `${prefix}${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
  return cardId;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = url.pathname;

    if (p === '/api/state' && req.method === 'GET') {
      return sendJson(res, 200, await getState());
    }

    if (p === '/api/episode/save' && req.method === 'POST') {
      const body = await readBody(req);
      const epPath = path.join(PILOT_DIR, 'episodes.json');
      const bakPath = path.join(PILOT_DIR, 'episodes.json.bak');
      const current = JSON.parse(await fs.readFile(epPath, 'utf8'));
      if (!existsSync(bakPath)) await fs.writeFile(bakPath, JSON.stringify(current, null, 2) + '\n');

      const idx = current.episodes.findIndex(e => e.id === body.episode?.id);
      if (idx < 0) return sendJson(res, 404, { error: '找不到对应剧集' });
      current.episodes[idx] = body.episode;
      await fs.writeFile(epPath, JSON.stringify(current, null, 2) + '\n', 'utf8');
      return sendJson(res, 200, { ok: true, state: await getState() });
    }

    if (p === '/api/episode/create' && req.method === 'POST') {
      const body = await readBody(req);
      const id = String(body.id || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const title = String(body.title || '').trim();
      if (!id || !title) return sendJson(res, 400, { error: '请填写英文 ID（如 gravity-lens）和中文标题' });

      const epPath = path.join(PILOT_DIR, 'episodes.json');
      const current = JSON.parse(await fs.readFile(epPath, 'utf8'));
      if (current.episodes.some(e => e.id === id)) return sendJson(res, 400, { error: `剧集 ID ${id} 已存在` });

      const tpl = TEMPLATES.find(t => t.id === body.template) || TEMPLATES[0];
      const prefix = id.slice(0, 2).toUpperCase();
      const num = String(current.episodes.length + 1).padStart(2, '0');
      const newEp = {
        id,
        number: num,
        title,
        structure: tpl.structure,
        question: body.question || `${title}背后的关键机制是什么？`,
        summary: body.summary || `使用母版 ${tpl.name} 拆解「${title}」。`,
        sources: [{ id: 'S1', title: '待补充权威出处（T1/T2）', url: '' }],
        caveat: '草稿阶段示意；正式发布前请核对 facts.md 出处。',
        segments: [
          { id: `${prefix}01`, label: '开场钩子（3秒猜）', scene: 'phenomenon', text: `先猜一下：关于${title}，直觉和现实往往正好相反。`, emphasis: '好奇发问，留出停顿。', facts: ['S1'] },
          { id: `${prefix}02`, label: '拆解核心对象', scene: 'setup', text: '我们先盯住最关键的那个物理量，不要被表面现象带偏。', emphasis: '放缓语速，突出重点。', facts: ['S1'] },
          { id: `${prefix}03`, label: '机制转折', scene: 'mechanism', text: '当条件发生变化时，真正起决定作用的其实是背后的比例关系。', emphasis: '转折重音清楚。', facts: ['S1'] },
          { id: `${prefix}04`, label: '对比验证', scene: 'compare', text: '把两组数据摆在一起看，差距立刻就拉开了。', emphasis: '有发现感。', facts: ['S1'] },
          { id: `${prefix}05`, label: '收束结论', scene: 'resolve', text: `所以回到开头的问题，理解了这层关系，${title}就完全通透了。`, emphasis: '清晰收束，不喊口号。', facts: ['S1'] },
        ],
      };

      current.episodes.push(newEp);
      await fs.writeFile(epPath, JSON.stringify(current, null, 2) + '\n', 'utf8');
      return sendJson(res, 200, { ok: true, episode: newEp, state: await getState() });
    }

    if (p === '/api/voice/run' && req.method === 'POST') {
      const body = await readBody(req);
      const engine = ['edge', 'gemini', 'minimax'].includes(body.engine) ? body.engine : 'edge';
      const args = ['projects/vibe-pilot/voice.py', '--episode', body.episodeId, '--engine', engine, '--generate'];
      if (body.onlySegmentId) args.push('--only', body.onlySegmentId);
      args.push('--assemble');
      const steps = [
        { cmd: 'python3', args },
        { cmd: 'node', args: ['projects/vibe-pilot/build.mjs'] },
      ];
      const job = startJob(`${body.episodeId} · ${engine.toUpperCase()} 配音与打包`, steps);
      return sendJson(res, 200, { ok: true, job });
    }

    if (p === '/api/build' && req.method === 'POST') {
      const job = startJob('重新打包预览并校验 (build.mjs + verify.mjs)', [
        { cmd: 'python3', args: ['projects/vibe-pilot/voice.py', '--assemble', '--allow-incomplete'] },
        { cmd: 'node', args: ['projects/vibe-pilot/build.mjs'] },
        { cmd: 'node', args: ['projects/vibe-pilot/verify.mjs'] },
      ]);
      return sendJson(res, 200, { ok: true, job });
    }

    if (p === '/api/publish' && req.method === 'POST') {
      const body = await readBody(req);
      const current = JSON.parse(await fs.readFile(path.join(PILOT_DIR, 'episodes.json'), 'utf8'));
      const ep = current.episodes.find(e => e.id === body.episodeId);
      if (!ep) return sendJson(res, 404, { error: '剧集不存在' });
      const cardId = await publishToCatalog(ep);
      return sendJson(res, 200, { ok: true, cardId });
    }

    if (p.startsWith('/api/jobs/') && req.method === 'GET') {
      const job = jobs.get(p.slice('/api/jobs/'.length));
      if (!job) return sendJson(res, 404, { error: '任务不存在' });
      return sendJson(res, 200, job);
    }

    if (p.startsWith('/pilot/')) {
      const rel = path.normalize(p.slice('/pilot/'.length)).replace(/^(\.\.(\/|\\|$))+/, '');
      return serveFile(res, path.join(PILOT_DIR, rel));
    }

    if (p === '/workbench' || p === '/workbench/') {
      return serveFile(res, path.join(ROOT_DIR, 'index.html'));
    }

    if (p === '/' || p === '/index.html') return serveFile(res, path.join(STUDIO_DIR, 'index.html'));
    const staticFile = path.join(STUDIO_DIR, path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, ''));
    return serveFile(res, staticFile);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Vibe Studio running at http://127.0.0.1:${PORT}/`);
});
