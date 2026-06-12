// ==UserScript==
// @name         POE2 高级过滤器模板保存器 V5
// @namespace    https://pathofexile.com/
// @version      5.2
// @description  保存和应用 POE2 Trade2 高级过滤器模板
// @author       ChatGPT
// @match        https://www.pathofexile.com/trade2/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'poe2_filter_templates_v5';

    let latestQuery = null;
    let latestCategory = null;

    // ==========================
    // 捕获 Trade2 搜索请求
    // ==========================

    const oldOpen = XMLHttpRequest.prototype.open;
    const oldSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._pfs_url = url;
        return oldOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        try {
            if (this._pfs_url && this._pfs_url.includes('/api/trade2/search/')) {
                latestQuery = JSON.parse(body);
                localStorage.setItem('pfs_last_query', body);

                const match = this._pfs_url.match(/\/api\/trade2\/search\/poe2\/(.+)/);
                if (match) {
                    latestCategory = decodeURIComponent(match[1]);
                }

                console.log('[PFS] Query Captured', latestQuery);
            }
        } catch (e) {
            console.error(e);
        }
        return oldSend.apply(this, arguments);
    };

    // ==========================
    // 注入样式
    // ==========================

    function injectStyles() {
        const css = `
            #pfs-v5-panel {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 340px;
                background: #1a1a2e;
                border: 2px solid #8b6b3f;
                z-index: 999999;
                color: #e0e0e0;
                padding: 12px;
                font-size: 12px;
                font-family: 'Segoe UI', Arial, sans-serif;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.8);
                user-select: none;
            }
            #pfs-v5-panel * {
                box-sizing: border-box;
            }
            .pfs-title {
                font-weight: bold;
                font-size: 14px;
                color: #e94560;
                margin-bottom: 10px;
            }
            .pfs-input-row {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            .pfs-input {
                flex: 1;
                padding: 8px 10px;
                background: #0f3460;
                border: 1px solid #444;
                border-radius: 4px;
                color: #fff;
                outline: none;
                font-size: 13px;
            }
            .pfs-input:focus {
                border-color: #e94560;
            }
            .pfs-input::placeholder {
                color: #888;
            }
            .pfs-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                transition: background 0.15s;
            }
            .pfs-btn-save {
                background: #e94560;
                color: #fff;
            }
            .pfs-btn-save:hover {
                background: #c73e54;
            }
            .pfs-btn-apply {
                background: #00b894;
                color: #fff;
                padding: 5px 12px;
                font-size: 12px;
            }
            .pfs-btn-apply:hover {
                background: #00a884;
            }
            .pfs-btn-delete {
                background: #ff4444;
                color: #fff;
                padding: 5px 10px;
                font-size: 12px;
            }
            .pfs-btn-delete:hover {
                background: #cc0000;
            }
            .pfs-template-list {
                max-height: 300px;
                overflow-y: auto;
            }
            .pfs-template-list::-webkit-scrollbar {
                width: 6px;
            }
            .pfs-template-list::-webkit-scrollbar-thumb {
                background: #555;
                border-radius: 3px;
            }
            .pfs-template-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: #16213e;
                border: 1px solid #2a3a5c;
                border-radius: 6px;
                margin-bottom: 8px;
                transition: background 0.15s, border-color 0.15s;
            }
            .pfs-template-item:hover {
                background: #1a2744;
                border-color: #e94560;
            }
            .pfs-template-info {
                flex: 1;
                cursor: pointer;
                min-width: 0;
                margin-right: 10px;
            }
            .pfs-template-name {
                font-weight: 600;
                color: #e94560;
                font-size: 13px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .pfs-template-meta {
                font-size: 11px;
                color: #888;
                margin-top: 3px;
            }
            .pfs-template-actions {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }
            .pfs-empty {
                text-align: center;
                color: #666;
                padding: 20px 0;
                font-size: 13px;
            }
            .pfs-hint {
                color: #888;
                font-size: 11px;
                margin-top: 10px;
            }
            .pfs-btn-export {
                background: #3498db;
                color: #fff;
                padding: 5px 12px;
                font-size: 12px;
            }
            .pfs-btn-export:hover {
                background: #2980b9;
            }
            .pfs-btn-import {
                background: #9b59b6;
                color: #fff;
                padding: 5px 12px;
                font-size: 12px;
            }
            .pfs-btn-import:hover {
                background: #8e44ad;
            }
            .pfs-toolbar {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            .pfs-title-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .pfs-btn-minimize {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .pfs-btn-minimize:hover {
                opacity: 1;
            }
            #pfs-orb-icon {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 48px;
                height: 48px;
                cursor: pointer;
                z-index: 999999;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
                transition: transform 0.2s;
                display: none;
                line-height: 0;
            }
            #pfs-orb-icon:hover {
                transform: scale(1.15);
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==========================
    // UI
    // ==========================

    function createUI() {
        if (document.getElementById('pfs-v5-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'pfs-v5-panel';

        panel.innerHTML = `
            <div class="pfs-title-row">
                <div class="pfs-title">POE2 高级过滤器模板</div>
                <button class="pfs-btn-minimize" id="pfs-minimize" title="缩小">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e94560" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            <div class="pfs-input-row">
                <input class="pfs-input" id="pfs-name" placeholder="输入模板名称..." maxlength="50" />
                <button class="pfs-btn pfs-btn-save" id="pfs-save">保存</button>
            </div>

            <div class="pfs-toolbar">
                <button class="pfs-btn pfs-btn-export" id="pfs-export">导出</button>
                <button class="pfs-btn pfs-btn-import" id="pfs-import">导入</button>
                <input type="file" id="pfs-file" accept=".json" style="display:none" />
            </div>

            <div class="pfs-template-list" id="pfs-list"></div>

            <div class="pfs-hint">先搜索一次再保存模板</div>
        `;

        document.body.appendChild(panel);

        // 神圣石图标 (SVG)
        const orbIcon = document.createElement('div');
        orbIcon.id = 'pfs-orb-icon';
        orbIcon.title = '展开过滤器面板';
        orbIcon.onclick = () => togglePanel(true);
        orbIcon.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="orbGrad" cx="40%" cy="35%">
                        <stop offset="0%" stop-color="#fff7ae"/>
                        <stop offset="50%" stop-color="#f0c040"/>
                        <stop offset="100%" stop-color="#a06800"/>
                    </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="20" fill="url(#orbGrad)" stroke="#805800" stroke-width="2"/>
                <text x="24" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#603000" font-family="serif">D</text>
            </svg>
        `;
        document.body.appendChild(orbIcon);

        document.getElementById('pfs-minimize').onclick = () => togglePanel(false);
        document.getElementById('pfs-name').onkeydown = (e) => {
            if (e.key === 'Enter') saveTemplate();
        };
        document.getElementById('pfs-export').onclick = exportTemplates;
        document.getElementById('pfs-import').onclick = () => document.getElementById('pfs-file').click();
        document.getElementById('pfs-file').onchange = importTemplates;

        renderTemplates();
    }

    // ==========================
    // 模板操作
    // ==========================

    function getTemplates() {
        return GM_getValue(STORAGE_KEY, []);
    }

    function setTemplates(data) {
        GM_setValue(STORAGE_KEY, data);
    }

    function saveTemplate() {
        try {
            const query = JSON.parse(localStorage.getItem('pfs_last_query'));

            if (!query) {
                alert('请先点击一次搜索');
                return;
            }

            const name = document.getElementById('pfs-name').value.trim();

            if (!name) {
                alert('请输入名称');
                return;
            }

            const templates = getTemplates();

            // 检查重名
            const existIdx = templates.findIndex(t => t.name === name);
            if (existIdx >= 0) {
                if (!confirm(`模板 "${name}" 已存在，覆盖？`)) return;
                templates[existIdx] = {
                    name,
                    stats: structuredClone(query.query.stats),
                    date: new Date().toLocaleString()
                };
            } else {
                templates.push({
                    name,
                    stats: structuredClone(query.query.stats),
                    date: new Date().toLocaleString()
                });
            }

            setTemplates(templates);
            document.getElementById('pfs-name').value = '';
            renderTemplates();
            alert('保存成功');

        } catch (e) {
            console.error(e);
            alert('保存失败');
        }
    }

    function renderTemplates() {
        const container = document.getElementById('pfs-list');
        if (!container) return;

        const templates = getTemplates();
        container.innerHTML = '';

        if (templates.length === 0) {
            container.innerHTML = '<div class="pfs-empty">暂无保存的模板</div>';
            return;
        }

        templates.forEach((tpl, index) => {
            const statsCount = tpl.stats?.length || 0;
            const filterCount = tpl.stats?.reduce((n, s) => n + (s.filters?.length || 0), 0) || 0;

            const item = document.createElement('div');
            item.className = 'pfs-template-item';

            item.innerHTML = `
                <div class="pfs-template-info" title="点击应用">
                    <div class="pfs-template-name">${escapeHtml(tpl.name)}</div>
                    <div class="pfs-template-meta">${statsCount}组条件 · ${filterCount}条过滤 · ${tpl.date || ''}</div>
                </div>
                <div class="pfs-template-actions">
                    <button class="pfs-btn pfs-btn-apply">应用</button>
                    <button class="pfs-btn pfs-btn-delete">删除</button>
                </div>
            `;

            item.querySelector('.pfs-template-info').onclick = () => applyTemplate(tpl);
            item.querySelector('.pfs-btn-apply').onclick = () => applyTemplate(tpl);
            item.querySelector('.pfs-btn-delete').onclick = () => deleteTemplate(index);

            container.appendChild(item);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==========================
    // 套用模板
    // ==========================

    async function applyTemplate(template) {
        try {
            const query = JSON.parse(localStorage.getItem('pfs_last_query'));

            if (!query) {
                alert('请先搜索一次');
                return;
            }

            query.query.stats = structuredClone(template.stats);

            const currentUrl = location.pathname;
            const m = currentUrl.match(/\/trade2\/search\/poe2\/([^\/]+)/);

            if (!m) {
                alert('无法识别分类');
                return;
            }

            const category = decodeURIComponent(m[1]);

            const response = await fetch(`/api/trade2/search/poe2/${encodeURIComponent(category)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });

            const result = await response.json();

            if (!result.id) {
                alert('搜索失败');
                return;
            }

            location.href = `/trade2/search/poe2/${encodeURIComponent(category)}/${result.id}`;

        } catch (e) {
            console.error(e);
            alert('应用模板失败');
        }
    }

    function deleteTemplate(index) {
        const templates = getTemplates();
        const name = templates[index]?.name;
        if (!confirm(`删除模板 "${name}"？`)) return;
        templates.splice(index, 1);
        setTemplates(templates);
        renderTemplates();
    }

    // ==========================
    // 导入导出
    // ==========================

    function exportTemplates() {
        const templates = getTemplates();
        if (templates.length === 0) {
            alert('没有可导出的模板');
            return;
        }

        const data = JSON.stringify(templates, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `poe2-templates-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    function importTemplates(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    alert('无效的模板文件');
                    return;
                }

                const templates = getTemplates();
                let added = 0;
                let skipped = 0;

                imported.forEach(tpl => {
                    if (!tpl.name || !tpl.stats) {
                        skipped++;
                        return;
                    }

                    const existIdx = templates.findIndex(t => t.name === tpl.name);
                    if (existIdx >= 0) {
                        skipped++;
                    } else {
                        templates.push({
                            name: tpl.name,
                            stats: tpl.stats,
                            date: tpl.date || new Date().toLocaleString()
                        });
                        added++;
                    }
                });

                setTemplates(templates);
                renderTemplates();
                alert(`导入完成：新增 ${added} 个，跳过 ${skipped} 个`);

            } catch (err) {
                console.error(err);
                alert('导入失败：文件格式错误');
            }
        };
        reader.readAsText(file);

        // 重置input，允许重复导入同一文件
        event.target.value = '';
    }

    // ==========================
    // 缩小/展开
    // ==========================

    function togglePanel(show) {
        const panel = document.getElementById('pfs-v5-panel');
        const orb = document.getElementById('pfs-orb-icon');
        if (!panel || !orb) return;

        if (show) {
            panel.style.display = 'block';
            orb.style.display = 'none';
        } else {
            panel.style.display = 'none';
            orb.style.display = 'block';
        }
    }

    // ==========================
    // 等待页面
    // ==========================

    function init() {
        injectStyles();
        createUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
