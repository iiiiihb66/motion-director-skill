'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let state = null;
  let activeId = null;
  let pollTimer = null;

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showBanner(msg) {
    const b = $('statusBanner');
    b.textContent = msg;
    b.hidden = !msg;
  }

  async function api(url, method = 'GET', body = null) {
    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function getActiveEp() {
    return state?.episodesData?.episodes?.find(e => e.id === activeId) || null;
  }

  function renderSidebar() {
    const eps = state.episodesData.episodes || [];
    $('epList').innerHTML = eps.map(ep => {
      const timed = state.timings?.episodes?.find(t => t.id === ep.id);
      const dur = timed?.duration ? `${timed.duration.toFixed(1)}s` : '未配音';
      return `<button class="ep-item ${ep.id === activeId ? 'active' : ''}" data-ep="${esc(ep.id)}">
        <strong>${esc(ep.number)} · ${esc(ep.title)}</strong>
        <small>${esc(ep.id)} · ${dur}</small>
      </button>`;
    }).join('');
  }

  function renderEditor() {
    const ep = getActiveEp();
    if (!ep) return;
    $('epTitleHeading').textContent = `${ep.number} · ${ep.title}`;
    $('fTitle').value = ep.title || '';
    $('fQuestion').value = ep.question || '';
    $('fStructure').value = ep.structure || '';
    $('fSummary').value = ep.summary || '';
    $('fCaveat').value = ep.caveat || '';

    const gPlan = state.geminiPlan?.find(p => p.episode === ep.id)?.segments || [];
    const ePlan = state.edgePlan?.find(p => p.episode === ep.id)?.segments || [];
    const timedEp = state.timings?.episodes?.find(t => t.id === ep.id);

    const reuseCount = gPlan.filter(s => s.action === 'reuse').length;
    $('segSummary').textContent = `共 ${ep.segments.length} 段 · Gemini 缓存 ${reuseCount}/${ep.segments.length}`;

    $('segmentsList').innerHTML = ep.segments.map((seg, idx) => {
      const gState = gPlan.find(s => s.id === seg.id)?.action;
      const eState = ePlan.find(s => s.id === seg.id)?.action;
      const tSeg = timedEp?.segments?.find(s => s.id === seg.id);
      const timeStr = tSeg && typeof tSeg.start === 'number' ? `${tSeg.start.toFixed(2)}s - ${tSeg.end.toFixed(2)}s` : '待组装';
      const badge = gState === 'reuse'
        ? '<span class="badge ok">Gemini 已缓存</span>'
        : eState === 'reuse'
          ? '<span class="badge ok">Edge 草稿已缓存</span>'
          : '<span class="badge warn">待生成（新词）</span>';

      return `<div class="seg-card" data-idx="${idx}">
        <div class="seg-top">
          <span class="seg-id">${esc(seg.id)} · ${timeStr}</span>
          ${badge}
        </div>
        <div class="seg-meta-inputs">
          <input class="seg-label" value="${esc(seg.label)}" placeholder="段落标签">
          <input class="seg-scene" value="${esc(seg.scene)}" placeholder="scene 标识">
        </div>
        <textarea class="seg-text" placeholder="旁白台词">${esc(seg.text)}</textarea>
        <input class="seg-emphasis" value="${esc(seg.emphasis)}" placeholder="语气 / 表演重音提示">
        <div class="seg-actions">
          <span class="muted">字数：${(seg.text || '').length}</span>
          <div class="voice-buttons">
            <button type="button" data-seg-voice="edge" data-seg-id="${esc(seg.id)}">⚡ 单句 Edge 试听</button>
            <button type="button" data-seg-voice="gemini" data-seg-id="${esc(seg.id)}">✨ 单句 Gemini 定稿</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function refreshPreview() {
    const ep = getActiveEp();
    if (!ep) return;
    const url = `/pilot/${encodeURIComponent(ep.id)}.html?t=${Date.now()}`;
    $('previewFrame').src = url;
    $('openPreviewTab').href = url;
    const timed = state.timings?.episodes?.find(t => t.id === ep.id);
    $('previewMeta').textContent = timed ? `${ep.id}.html · ${timed.duration?.toFixed(2) || '--'}s` : `${ep.id}.html`;
  }

  function collectEpisodeFromForm() {
    const ep = structuredClone(getActiveEp());
    ep.title = $('fTitle').value.trim();
    ep.question = $('fQuestion').value.trim();
    ep.structure = $('fStructure').value.trim();
    ep.summary = $('fSummary').value.trim();
    ep.caveat = $('fCaveat').value.trim();

    document.querySelectorAll('.seg-card').forEach((card, idx) => {
      ep.segments[idx].label = card.querySelector('.seg-label').value.trim();
      ep.segments[idx].scene = card.querySelector('.seg-scene').value.trim();
      ep.segments[idx].text = card.querySelector('.seg-text').value.trim();
      ep.segments[idx].emphasis = card.querySelector('.seg-emphasis').value.trim();
    });
    return ep;
  }

  async function saveEpisode(silent = false) {
    const ep = collectEpisodeFromForm();
    const res = await api('/api/episode/save', 'POST', { episode: ep });
    state = res.state;
    renderSidebar();
    renderEditor();
    if (!silent) showBanner(`已保存「${ep.title}」到 episodes.json（已更新指纹状态）`);
  }

  function watchJob(jobId) {
    if (pollTimer) clearInterval(pollTimer);
    $('jobStateBadge').textContent = '运行中...';
    $('jobStateBadge').className = 'badge warn';

    const tick = async () => {
      try {
        const job = await api(`/api/jobs/${jobId}`);
        $('jobLogs').textContent = job.logs;
        $('jobLogs').scrollTop = $('jobLogs').scrollHeight;
        if (job.status !== 'running') {
          clearInterval(pollTimer);
          pollTimer = null;
          $('jobStateBadge').textContent = job.status === 'done' ? '完成' : '失败';
          $('jobStateBadge').className = job.status === 'done' ? 'badge ok' : 'badge warn';
          await loadState(false);
          refreshPreview();
          showBanner(job.status === 'done' ? `✓ ${job.label} 已完成并刷新预览` : `✗ ${job.label} 失败：${job.error}`);
        }
      } catch (e) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };
    tick();
    pollTimer = setInterval(tick, 1000);
  }

  async function runVoice(engine, onlySegmentId = null) {
    await saveEpisode(true);
    showBanner(`正在启动 ${engine.toUpperCase()} 配音${onlySegmentId ? ` (${onlySegmentId})` : ''}...`);
    const res = await api('/api/voice/run', 'POST', { episodeId: activeId, engine, onlySegmentId });
    watchJob(res.job.id);
  }

  async function loadState(reloadIframe = true) {
    state = await api('/api/state');
    if (!activeId || !state.episodesData.episodes.some(e => e.id === activeId)) {
      activeId = state.episodesData.episodes[0]?.id || null;
    }
    $('newTemplate').innerHTML = (state.templates || []).map(t => `<option value="${esc(t.id)}">${esc(t.name)} — ${esc(t.structure)}</option>`).join('');
    renderSidebar();
    renderEditor();
    if (reloadIframe) refreshPreview();
  }

  $('epList').onclick = e => {
    const btn = e.target.closest('[data-ep]');
    if (!btn) return;
    activeId = btn.dataset.ep;
    showBanner('');
    renderSidebar();
    renderEditor();
    refreshPreview();
  };

  $('segmentsList').onclick = e => {
    const btn = e.target.closest('[data-seg-voice]');
    if (!btn) return;
    runVoice(btn.dataset.segVoice, btn.dataset.segId).catch(err => showBanner(err.message));
  };

  $('btnSave').onclick = () => saveEpisode(false).catch(err => showBanner(err.message));
  $('btnVoiceEdge').onclick = () => runVoice('edge').catch(err => showBanner(err.message));
  $('btnVoiceGemini').onclick = () => runVoice('gemini').catch(err => showBanner(err.message));
  $('btnBuild').onclick = async () => {
    await saveEpisode(true);
    const res = await api('/api/build', 'POST', {});
    watchJob(res.job.id);
  };
  $('btnPublish').onclick = async () => {
    const res = await api('/api/publish', 'POST', { episodeId: activeId });
    showBanner(`✓ 已同步到总展板 (catalog.js -> ${res.cardId})`);
  };
  $('btnReloadPreview').onclick = refreshPreview;

  $('btnNewEp').onclick = () => { $('newEpForm').reset(); $('newEpDialog').showModal(); };
  $('cancelNewEp').onclick = () => $('newEpDialog').close();
  $('newEpForm').onsubmit = async e => {
    e.preventDefault();
    try {
      const res = await api('/api/episode/create', 'POST', {
        id: $('newId').value,
        title: $('newTitle').value,
        template: $('newTemplate').value,
        question: $('newQuestion').value,
      });
      state = res.state;
      activeId = res.episode.id;
      $('newEpDialog').close();
      renderSidebar();
      renderEditor();
      showBanner(`✓ 已基于母版新建剧集「${res.episode.title}」，可直接修改台词并点 Edge-TTS 试听`);
    } catch (err) {
      showBanner(err.message);
    }
  };

  loadState(true).catch(err => showBanner(`加载失败：${err.message}`));
})();
