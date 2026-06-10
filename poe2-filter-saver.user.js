// ==UserScript==
// @name         POE2 Trade Filter Saver v5
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  保存POE2交易网站的高级过滤器(stats)，支持快捷加载和自动搜索
// @match        https://www.pathofexile.com/trade2/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const STORAGE_KEY = 'poe2_templates_v5';
    const QUERY_KEY = 'pfs_last_query';
    const API_BASE = '/api/trade2/search/poe2/';
    const TRADE_BASE = '/trade2/search/poe2/';

    // ==================== 数据层 ====================
    function getTemplates() {
        return GM_getValue(STORAGE_KEY, []);
    }

    function saveTemplates(templates) {
        GM_setValue(STORAGE_KEY, templates);
    }

    function getLastQuery() {
        try {
            const raw = localStorage.getItem(QUERY_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function getCategoryFromURL() {
        const m = location.pathname.match(/\/trade2\/search\/poe2\/([^/]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    }

    // ==================== 搜索接口 ====================
    async function doSearch(category, queryBody) {
        const resp = await fetch(API_BASE + encodeURIComponent(category), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryBody)
        });
        const data = await resp.json();
        if (data.id) {
            location.href = TRADE_BASE + encodeURIComponent(category) + '/' + data.id;
        } else {
            alert('搜索失败：' + JSON.stringify(data));
        }
    }

    // ==================== Hook fetch 捕获查询 ====================
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const url = args[0]?.toString() || '';
            if (url.includes('/api/trade2/search/') && args[1]?.body) {
                const body = JSON.parse(args[1].body);
                localStorage.setItem(QUERY_KEY, JSON.stringify(body));
            }
        } catch {}
        return origFetch.apply(this, args);
    };

    // ==================== UI 样式 ====================
    function injectStyles() {
        const css = `
            #pfs-panel {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 320px;
                background: #1a1a2e;
                border: 1px solid #333;
                border-radius: 8px;
                z-index: 99999;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #e0e0e0;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                user-select: none;
            }
            #pfs-panel * {
                box-sizing: border-box;
                font-size: 13px;
            }
            .pfs-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: #16213e;
                border-radius: 8px 8px 0 0;
                cursor: move;
            }
            .pfs-header h3 {
                margin: 0;
                font-size: 14px;
                color: #e94560;
            }
            .pfs-header button {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 18px;
                padding: 0 4px;
            }
            .pfs-header button:hover { color: #fff; }
            .pfs-body { padding: 12px 14px; }
            .pfs-row {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            .pfs-input {
                flex: 1;
                padding: 8px 10px;
                background: #0f3460;
                border: 1px solid #333;
                border-radius: 4px;
                color: #fff;
                outline: none;
            }
            .pfs-input:focus { border-color: #e94560; }
            .pfs-btn {
                padding: 8px 14px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                white-space: nowrap;
            }
            .pfs-btn-primary {
                background: #e94560;
                color: #fff;
            }
            .pfs-btn-primary:hover { background: #c73e54; }
            .pfs-btn-primary:disabled {
                background: #555;
                cursor: not-allowed;
            }
            .pfs-btn-danger {
                background: #ff4444;
                color: #fff;
                padding: 4px 10px;
                font-size: 12px;
            }
            .pfs-btn-danger:hover { background: #cc0000; }
            .pfs-btn-apply {
                background: #00b894;
                color: #fff;
                padding: 4px 10px;
                font-size: 12px;
            }
            .pfs-btn-apply:hover { background: #00a884; }
            .pfs-hint {
                font-size: 11px;
                color: #888;
                margin-bottom: 10px;
            }
            .pfs-list {
                max-height: 280px;
                overflow-y: auto;
            }
            .pfs-list::-webkit-scrollbar { width: 6px; }
            .pfs-list::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 3px;
            }
            .pfs-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                background: #16213e;
                border-radius: 4px;
                margin-bottom: 6px;
                transition: background 0.15s;
            }
            .pfs-item:hover { background: #1a2744; }
            .pfs-item-info {
                flex: 1;
                cursor: pointer;
                min-width: 0;
            }
            .pfs-item-name {
                font-weight: 600;
                color: #e94560;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .pfs-item-meta {
                font-size: 11px;
                color: #888;
                margin-top: 2px;
            }
            .pfs-item-actions {
                display: flex;
                gap: 6px;
                margin-left: 8px;
            }
            .pfs-empty {
                text-align: center;
                color: #555;
                padding: 20px 0;
            }
            .pfs-status {
                font-size: 11px;
                color: #00b894;
                margin-top: 8px;
                min-height: 16px;
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==================== UI 面板 ====================
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'pfs-panel';
        panel.innerHTML = `
            <div class="pfs-header" id="pfs-drag">
                <h3>POE2 模板保存器</h3>
                <div>
                    <button id="pfs-minimize" title="最小化">−</button>
                    <button id="pfs-close" title="关闭">×</button>
                </div>
            </div>
            <div class="pfs-body" id="pfs-body">
                <div class="pfs-hint">
                    先搜索一次，然后保存高级过滤器模板<br>
                    应用模板会自动替换 stats 并重新搜索
                </div>
                <div class="pfs-row">
                    <input class="pfs-input" id="pfs-name" placeholder="输入模板名称..." maxlength="50">
                    <button class="pfs-btn pfs-btn-primary" id="pfs-save">保存</button>
                </div>
                <div class="pfs-status" id="pfs-status"></div>
                <div class="pfs-list" id="pfs-list"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // 拖拽
        makeDraggable(panel, document.getElementById('pfs-drag'));

        // 事件
        document.getElementById('pfs-close').onclick = () => panel.style.display = 'none';
        document.getElementById('pfs-minimize').onclick = () => {
            const body = document.getElementById('pfs-body');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        };
        document.getElementById('pfs-save').onclick = saveCurrentTemplate;
        document.getElementById('pfs-name').onkeydown = (e) => {
            if (e.key === 'Enter') saveCurrentTemplate();
        };

        renderList();
    }

    function makeDraggable(panel, handle) {
        let isDragging = false, startX, startY, startLeft, startTop;
        handle.onmousedown = (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            e.preventDefault();
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            panel.style.left = (startLeft + e.clientX - startX) + 'px';
            panel.style.top = (startTop + e.clientY - startY) + 'px';
            panel.style.right = 'auto';
        };
        document.onmouseup = () => isDragging = false;
    }

    function setStatus(msg, isError) {
        const el = document.getElementById('pfs-status');
        el.textContent = msg;
        el.style.color = isError ? '#ff4444' : '#00b894';
        if (!isError) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
    }

    // ==================== 核心逻辑 ====================
    function saveCurrentTemplate() {
        const query = getLastQuery();
        if (!query?.query?.stats) {
            setStatus('请先执行一次搜索', true);
            return;
        }

        const nameInput = document.getElementById('pfs-name');
        const name = nameInput.value.trim();
        if (!name) {
            setStatus('请输入模板名称', true);
            return;
        }

        const templates = getTemplates();
        const stats = query.query.stats;

        // 检查重名
        if (templates.some(t => t.name === name)) {
            if (!confirm(`模板 "${name}" 已存在，覆盖？`)) return;
            const idx = templates.findIndex(t => t.name === name);
            templates[idx] = { name, stats, date: new Date().toLocaleString() };
        } else {
            templates.push({ name, stats, date: new Date().toLocaleString() });
        }

        saveTemplates(templates);
        nameInput.value = '';
        setStatus(`已保存: ${name}`);
        renderList();
    }

    function applyTemplate(index) {
        const templates = getTemplates();
        const tpl = templates[index];
        if (!tpl) return;

        const category = getCategoryFromURL();
        if (!category) {
            setStatus('无法识别当前分类', true);
            return;
        }

        const query = getLastQuery();
        if (!query) {
            setStatus('请先执行一次搜索', true);
            return;
        }

        // 替换 stats，保留其他所有条件
        query.query.stats = tpl.stats;
        setStatus(`应用中: ${tpl.name}...`);
        doSearch(category, query);
    }

    function deleteTemplate(index) {
        const templates = getTemplates();
        const name = templates[index]?.name;
        if (!confirm(`删除模板 "${name}"？`)) return;
        templates.splice(index, 1);
        saveTemplates(templates);
        setStatus(`已删除: ${name}`);
        renderList();
    }

    function renderList() {
        const container = document.getElementById('pfs-list');
        if (!container) return;

        const templates = getTemplates();
        if (templates.length === 0) {
            container.innerHTML = '<div class="pfs-empty">暂无保存的模板</div>';
            return;
        }

        container.innerHTML = templates.map((t, i) => {
            const statsCount = t.stats?.length || 0;
            const filterCount = t.stats?.reduce((n, s) => n + (s.filters?.length || 0), 0) || 0;
            return `
                <div class="pfs-item">
                    <div class="pfs-item-info" title="点击应用" data-action="apply" data-index="${i}">
                        <div class="pfs-item-name">${escapeHtml(t.name)}</div>
                        <div class="pfs-item-meta">${statsCount}组条件 · ${filterCount}条过滤 · ${t.date}</div>
                    </div>
                    <div class="pfs-item-actions">
                        <button class="pfs-btn pfs-btn-apply" data-action="apply" data-index="${i}">应用</button>
                        <button class="pfs-btn pfs-btn-danger" data-action="delete" data-index="${i}">删除</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-action="apply"]').forEach(el => {
            el.onclick = () => applyTemplate(parseInt(el.dataset.index));
        });
        container.querySelectorAll('[data-action="delete"]').forEach(el => {
            el.onclick = () => deleteTemplate(parseInt(el.dataset.index));
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== 注册菜单 ====================
    GM_registerMenuCommand('打开/关闭模板面板', () => {
        const panel = document.getElementById('pfs-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        } else {
            createPanel();
        }
    });

    // ==================== 初始化 ====================
    function init() {
        injectStyles();
        createPanel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
