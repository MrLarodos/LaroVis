// ── Konfigurations-Editor (renderConfigUI, Drag & Drop, Object-Browser) ──────

let configState = { view: 'overview' };

// ── Gemeinsamer Drag & Drop-State ─────────────────────────────────────────
let _touchDragEl    = null;
let _touchGhost     = null;
let _touchOffsetX   = 0;
let _touchOffsetY   = 0;
let _dragFromHandle = false;

function _ddGetTouchTarget(x, y, selector) {
    if (_touchGhost) _touchGhost.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (_touchGhost) _touchGhost.style.display = '';
    return el ? el.closest(selector) : null;
}
function _ddClearHighlights(selector) {
    document.querySelectorAll(selector).forEach(el => { el.style.outline = ''; });
}

function setupDraggable(selector, onDrop) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        const handle = el.querySelector('.drag-handle');

        if (handle) {
            handle.addEventListener('pointerdown', () => { _dragFromHandle = true; });
            // Flag nur zurücksetzen, wenn man das Handle verlässt
            handle.addEventListener('pointerleave', () => { _dragFromHandle = false; });
        }

        // Desktop
        el.addEventListener('dragstart', function(e) {
            if (!_dragFromHandle) { e.preventDefault(); return false; }
            e.stopPropagation(); // Stoppt Event-Bubbling (Kachel vs. Sicht)
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.id);
        setTimeout(() => { this.style.opacity = '0.4'; }, 0);
        });

        el.addEventListener('dragend', function(e) {
            e.stopPropagation();
            _dragFromHandle = false;
            this.style.opacity = '1';
            _ddClearHighlights(selector);
        });

        el.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            _ddClearHighlights(selector);
            this.style.outline = '2px solid var(--drag-highlight)';
            return false;
        });

        el.addEventListener('dragleave', function(e) {
            e.stopPropagation();
            this.style.outline = '';
        });

        el.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
            _ddClearHighlights(selector);
            const srcId = e.dataTransfer.getData('text/plain');
            const srcEl = document.getElementById(srcId);
            if (!srcEl || srcEl === this) return;
            srcEl.style.opacity = '1';
            onDrop(srcEl, this);
        });

        // Mobile Touch
        el.addEventListener('touchstart', function(e) {
            const hnd = this.querySelector('.drag-handle');
            const tch = e.touches[0];
            if (!hnd || !hnd.contains(document.elementFromPoint(tch.clientX, tch.clientY))) return;
            e.stopPropagation();
            e.preventDefault();
            _touchDragEl = this;
            const rect = this.getBoundingClientRect();
            _touchOffsetX = tch.clientX - rect.left;
            _touchOffsetY = tch.clientY - rect.top;
            _touchGhost = this.cloneNode(true);
            Object.assign(_touchGhost.style, {
                position:'fixed', top:rect.top+'px', left:rect.left+'px',
                width:rect.width+'px', opacity:'0.75', pointerEvents:'none',
                zIndex:'9999', borderRadius:'0.25rem',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)'
            });
            document.body.appendChild(_touchGhost);
            this.style.opacity = '0.3';
        }, { passive: false });

        el.addEventListener('touchmove', function(e) {
            if (!_touchDragEl) return;
            e.stopPropagation();
            e.preventDefault();
            const tch = e.touches[0];
            _touchGhost.style.top  = (tch.clientY - _touchOffsetY) + 'px';
            _touchGhost.style.left = (tch.clientX - _touchOffsetX) + 'px';
            _ddClearHighlights(selector);
            const target = _ddGetTouchTarget(tch.clientX, tch.clientY, selector);
            if (target && target !== _touchDragEl) target.style.outline = '2px solid var(--drag-highlight)';
        }, { passive: false });

            el.addEventListener('touchend', function(e) {
                if (!_touchDragEl) return;
                e.stopPropagation();
                const tch = e.changedTouches[0];
                if (_touchGhost) { _touchGhost.remove(); _touchGhost = null; }
                _touchDragEl.style.opacity = '1';
                _ddClearHighlights(selector);
                const target = _ddGetTouchTarget(tch.clientX, tch.clientY, selector);
                if (target && target !== _touchDragEl) onDrop(_touchDragEl, target);
                _touchDragEl = null;
            }, { passive: false });
    });
}

function initDragDrop() {
    // Kacheln sortieren
    setupDraggable('[id^="tile-drag-"]', function(srcEl, dstEl) {
        const srcDIdx = parseInt(srcEl.dataset.didx), srcSIdx = parseInt(srcEl.dataset.sidx), srcTIdx = parseInt(srcEl.dataset.tidx);
        const dstDIdx = parseInt(dstEl.dataset.didx), dstSIdx = parseInt(dstEl.dataset.sidx), dstTIdx = parseInt(dstEl.dataset.tidx);
        if (srcDIdx !== dstDIdx || srcSIdx !== dstSIdx) return;
        if (srcTIdx === dstTIdx) return;
        const tiles = appConfig.dashboards[srcDIdx].sights[srcSIdx].tiles;
        const [moved] = tiles.splice(srcTIdx, 1);
        tiles.splice(dstTIdx, 0, moved);
        socket.emit('setState', configId, { val: JSON.stringify(appConfig), ack: false }, () => { renderConfigUI(); });
    });

    // Sichten sortieren
    setupDraggable('[id^="sight-drag-"]', function(srcEl, dstEl) {
        const srcDIdx = parseInt(srcEl.dataset.didx), srcSIdx = parseInt(srcEl.dataset.sidx);
        const dstDIdx = parseInt(dstEl.dataset.didx), dstSIdx = parseInt(dstEl.dataset.sidx);
        if (srcDIdx !== dstDIdx) return;
        if (srcSIdx === dstSIdx) return;
        const sights = appConfig.dashboards[srcDIdx].sights;
        const [moved] = sights.splice(srcSIdx, 1);
        sights.splice(dstSIdx, 0, moved);
        socket.emit('setState', configId, { val: JSON.stringify(appConfig), ack: false }, () => { renderConfigUI(); });
    });
}

function tileTypeLabel(type) {
    const map = {
        zahlwert: t('tileTypeValue'),
        charge: t('tileTypeCharge'),
        switch: t('tileTypeSwitch'),
        status: t('tileTypeStatus'),
        wertregler: t('tileTypeSlider'),
        statusregler: t('tileTypeStatusSlider')
    };
    return map[type] || type;
}

function renderConfigUI() {
    const app = document.getElementById('app');

    if (configState.view === 'overview') {
        let html = `<div class="config-panel">
        <div class="config-panel-header">
        <h2>${t('configTitle')}</h2>
        <button class="btn" style="background:var(--close-btn-bg);" onclick="window.location.href='${returnUrl}'">${t('closeButton')}</button>
        </div>`;

        (appConfig.dashboards || []).forEach((dash, dIdx) => {
            html += `<div class="config-dashboard-box">
            <h3><span style="white-space:nowrap;">📊 ${t('dashboard')}:</span> <input type="text" value="${dash.name}" onchange="updateDash(${dIdx}, 'name', this.value)" class="config-dashboard-name-input"><button class="btn config-delete-btn" onclick="deleteDashboard(${dIdx})">🗑️ ${t('deleteDashboardBtn')}</button></h3>
            <div class="config-color-row">
            <label class="config-color-item">${t('background')} <input type="color" onchange="updateDash(${dIdx}, 'bgColor', this.value)" value="${dash.bgColor || '#121212'}" class="config-color-input"></label>
            <label class="config-color-item">${t('footer')} <input type="color" onchange="updateDash(${dIdx}, 'footerBg', this.value)" value="${dash.footerBg || '#1e1e1e'}" class="config-color-input"></label>
            <label class="config-color-item">${t('footerLine')} <input type="color" onchange="updateDash(${dIdx}, 'footerBorder', this.value)" value="${dash.footerBorder || '#333333'}" class="config-color-input"></label>
            <label class="config-color-item">${t('tileBorder')} <input type="number" min="0" max="15" onchange="updateDash(${dIdx}, 'tileBorderWidth', parseInt(this.value))" value="${dash.tileBorderWidth || 3}" class="config-number-input"></label>
            <label class="config-color-item">${t('fontSize')} <input type="number" min="0.5" max="10" step="0.1" onchange="updateDash(${dIdx}, 'tileFontSize', parseFloat(this.value))" value="${dash.tileFontSize || 2.8}" class="config-number-input"></label>
            <label class="config-checkbox-label">
            <span>${t('configIcon')}</span>
            <input type="checkbox" onchange="updateDash(${dIdx}, 'showConfigIcon', this.checked)" ${dash.showConfigIcon !== false ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
            </label>
            </div>`;

            dash.sights?.forEach((sight, sIdx) => {
                html += `<div id="sight-drag-${dIdx}-${sIdx}" draggable="true" data-didx="${dIdx}" data-sidx="${sIdx}" class="config-sight-drag-item">
                <div class="drag-handle config-drag-handle" title="${t('dragToSort')}">↕️</div>
                <div draggable="false" class="config-sight-content">
                <h4 draggable="false" class="config-sight-header">
                <span style="white-space:nowrap;">👁️ ${t('sight')}:</span>
                <input draggable="false" type="text" value="${sight.name}" onchange="updateSight(${dIdx}, ${sIdx}, 'name', this.value)" class="config-sight-name-input">
                <button draggable="false" class="btn" style="background:#1c383f; padding:0.2rem 0.5rem; white-space:nowrap; flex-shrink:0;" onclick="deleteSight(${dIdx}, ${sIdx})">🗑️ ${t('deleteSightBtn')}</button>
                </h4>`;

                // Null-Einträge aus tiles filtern bevor sie gerendert werden
                const validTiles = (sight.tiles || []).filter(t => t !== null && t !== undefined);
                sight.tiles = validTiles;

                validTiles.forEach((tile, tIdx) => {
                    if (tile.type === 'section') {
                        html += `<div id="tile-drag-${dIdx}-${sIdx}-${tIdx}" draggable="true" data-didx="${dIdx}" data-sidx="${sIdx}" data-tidx="${tIdx}" class="config-tile-drag-item">
                        <span class="drag-handle config-tile-drag-handle" title="${t('dragToSort')}">↕️</span>
                        <div class="config-tile-row config-tile-row--section">
                        <span draggable="false" class="config-tile-label">📑 ${tile.title || t('noTitle')} <em>(${t('section')})</em></span>
                        <div class="config-tile-actions">
                        <button draggable="false" class="btn config-tile-btn-edit" onclick="editSection(${dIdx}, ${sIdx}, ${tIdx})">✏️</button>
                        <button draggable="false" class="btn config-tile-btn-delete" onclick="deleteTile(${dIdx}, ${sIdx}, ${tIdx})">🗑️</button>
                        </div>
                        </div>
                        </div>`;
                    } else {
                        html += `<div id="tile-drag-${dIdx}-${sIdx}-${tIdx}" draggable="true" data-didx="${dIdx}" data-sidx="${sIdx}" data-tidx="${tIdx}" class="config-tile-drag-item">
                        <span class="drag-handle config-tile-drag-handle" title="${t('dragToSort')}">↕️</span>
                        <div class="config-tile-row config-tile-row--tile">
                        <span draggable="false" class="config-tile-label">${tile.title || t('noTitle')} <em>(${tileTypeLabel(tile.type)})</em></span>
                        <div class="config-tile-actions">
                        <button draggable="false" class="btn config-tile-btn-edit" onclick="editTile(${dIdx}, ${sIdx}, ${tIdx})">✏️</button>
                        <button draggable="false" class="btn config-tile-btn-delete" onclick="deleteTile(${dIdx}, ${sIdx}, ${tIdx})">🗑️</button>
                        </div>
                        </div>
                        </div>`;
                    }
                });

                html += `<div class="config-sight-actions">
                <button class="btn config-btn-add-tile" onclick="addTile(${dIdx}, ${sIdx})">+ ${t('addTileBtn')}</button>
                <button class="btn config-btn-add-section" onclick="addSection(${dIdx}, ${sIdx})">+ ${t('addSectionBtn')}</button>
                </div>
                </div>
                </div>`;
            });

            html += `<button class="btn config-btn-add-sight" onclick="addSight(${dIdx})">+ ${t('addSightBtn')}</button>
            </div>`;
        });

        html += `<button class="btn" style="background:var(--info-color);" onclick="addDashboard()">+ ${t('addDashboardBtn')}</button>
        <button class="btn" style="background:var(--close-btn-bg); float:right;" onclick="window.location.href='${returnUrl}'">${t('closeButton')}</button>
        </div>`;
        app.innerHTML = html;
        initDragDrop();
    }
    else if (configState.view === 'editSection') {
        const section = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];

        app.innerHTML = `
        <div class="config-panel">
        <h2>${t('editSectionTitle')}</h2>

        <div class="config-form-field">
        <label>${t('sectionTitleLabel')}</label>
        <input type="text" id="section-title" value="${section.title}" class="config-form-field-full">
        </div>

        <div class="config-color-row">
        <div class="config-color-item">
        <label>${t('sectionTitleColor')}</label>
        <input type="color" id="section-titleColor" value="${section.titleColor || '#9ca3af'}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('sectionLineColor')}</label>
        <input type="color" id="section-lineColor" value="${section.lineColor || '#555555'}" class="config-color-input">
        </div>
        </div>

        <div class="config-section-footer">
        <button class="btn" style="background:var(--close-btn-bg);" onclick="configState.view='overview'; renderConfigUI();">${t('cancelButton')}</button>
        <button class="btn" onclick="saveSection()">${t('saveButtonGeneric')}</button>
        </div>
        </div>
        `;
    }
    else if (configState.view === 'editTile') {
        const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];

        // Initialisiere fehlende Felder
        if (!tile.type) tile.type = 'zahlwert';
        if (!tile.bgColor) tile.bgColor = '#1e1e1e';
        if (!tile.borderColor) tile.borderColor = 'rgba(255,255,255,0.05)';
        if (!tile.borderStyle) tile.borderStyle = 'solid';
        if (!tile.titleColor) tile.titleColor = '#9ca3af';
        if (!tile.valueColor) tile.valueColor = '#f3f4f6';
        if (!tile.subValues) tile.subValues = [];
        if (!tile.mapping) tile.mapping = {};

        app.innerHTML = `
        <div class="config-panel">
        <h2>${t('editTileTitle')}</h2>

        <div class="config-form-field">
        <label>${t('titleLabel')}</label>
        <input type="text" id="kachel-title" value="${tile.title}" class="config-form-field-full">
        </div>

        <div class="config-form-field">
        <label>${t('datapointLabel')}</label>
        <div class="config-input-with-btn">
        <input type="text" id="kachel-id" value="${tile.id}" class="config-form-field-full">
        <button class="btn" onclick="openObjectBrowser('kachel-id')" style="white-space: nowrap;">🔍 ${t('treeButton')}</button>
        </div>
        </div>

        <div class="config-form-field">
        <label>${t('tileTypeLabel')}</label>
        <select id="kachel-type" onchange="updateTileTypeFields()" class="config-form-field-full">
        <option value="zahlwert" ${tile.type === 'zahlwert' ? 'selected' : ''}>${t('tileTypeValue')}</option>
        <option value="switch" ${tile.type === 'switch' ? 'selected' : ''}>${t('tileTypeSwitch')}</option>
        <option value="charge" ${tile.type === 'charge' ? 'selected' : ''}>${t('tileTypeCharge')}</option>
        <option value="status" ${tile.type === 'status' ? 'selected' : ''}>${t('tileTypeStatus')}</option>
        <option value="wertregler" ${tile.type === 'wertregler' ? 'selected' : ''}>${t('tileTypeSlider')}</option>
        <option value="statusregler" ${tile.type === 'statusregler' ? 'selected' : ''}>${t('tileTypeStatusSlider')}</option>
        </select>
        </div>

        <div id="type-specific-fields"></div>

        <h3 style="margin-top: 2rem; border-top: 1px solid var(--obj-browser-border); padding-top: 1rem;">${t('subvaluesTitle')}</h3>
        <div id="subvalues-container"></div>
        <button class="btn" id="add-subvalue-btn" onclick="addSubValue()" style="background:var(--success-color); margin-top: 0.5rem;">+ ${t('addSubvalueBtn')}</button>

        <h3 style="margin-top: 2rem; border-top: 1px solid var(--obj-browser-border); padding-top: 1rem;">${t('individualDesignTitle')}</h3>

        <div class="config-color-row">
        <div class="config-color-item">
        <label>${t('bgColorLabel')}</label>
        <input type="color" id="kachel-bgColor" value="${tile.bgColor}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('borderColorLabel')}</label>
        <input type="color" id="kachel-borderColor" value="${tile.borderColor.startsWith('rgba') ? '#ffffff' : tile.borderColor}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('borderStyleLabel')}</label>
        <select id="kachel-borderStyle" style="width: 120px; padding: 0.5rem; box-sizing: border-box;">
        <option value="solid" ${tile.borderStyle === 'solid' ? 'selected' : ''}>Solid</option>
        <option value="dashed" ${tile.borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
        <option value="dotted" ${tile.borderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
        </select>
        </div>
        <div class="config-color-item">
        <label>${t('borderWidthLabel')}</label>
        <input type="number" id="kachel-borderWidth" value="${tile.borderWidth !== undefined ? tile.borderWidth : ''}" placeholder="${t('standardPlaceholder')}" min="0" max="15" class="config-number-input-wide">
        </div>
        <div class="config-color-item">
        <label>${t('titleColorLabel')}</label>
        <input type="color" id="kachel-titleColor" value="${tile.titleColor}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('valueColorLabel')}</label>
        <input type="color" id="kachel-valueColor" value="${tile.valueColor}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('fontSizeLabel')}</label>
        <input type="number" id="kachel-fontSize" value="${tile.fontSize !== undefined ? tile.fontSize : ''}" placeholder="${t('standardPlaceholder')}" min="0.5" max="10" step="0.1" class="config-number-input-wide">
        </div>
        </div>

        <div class="config-section-footer">
        <button class="btn" style="background:var(--close-btn-bg);" onclick="configState.view='overview'; renderConfigUI();">${t('cancelButton')}</button>
        <button class="btn" onclick="saveTile()">${t('saveButtonGeneric')}</button>
        </div>
        </div>
        `;

        renderSubValues();
        updateTileTypeFields();
    }
}

window.editTile = function(dIdx, sIdx, tIdx) {
    configState = { view: 'editTile', dIdx, sIdx, tIdx };
    renderConfigUI();
};

// --- FUNKTIONEN FÜR HINZUFÜGEN & LÖSCHEN ---

function saveConfigAndRender() {
    socket.emit('setState', configId, { val: JSON.stringify(appConfig), ack: false }, (err) => {
        if(!err) renderConfigUI();
        else alert(t('saveError'));
    });
}

window.updateDash = function(dIdx, key, value) {
    appConfig.dashboards[dIdx][key] = value;
    saveConfigAndRender();
};

window.updateSight = function(dIdx, sIdx, key, value) {
    appConfig.dashboards[dIdx].sights[sIdx][key] = value;
    saveConfigAndRender();
};

window.addDashboard = function() {
    const name = prompt(t('promptNewDashboard'));
    if (!name) return;
    if (!appConfig.dashboards) appConfig.dashboards = [];
    appConfig.dashboards.push({ name: name, sights: [], bgColor: "#121212", footerBg: "#1e1e1e", footerBorder: "#333333", tileBorderWidth: 3, tileFontSize: 2.8 });
    saveConfigAndRender();
};

window.addSight = function(dIdx) {
    const name = prompt(t('promptNewSight'));
    if (!name) return;
    if (!appConfig.dashboards[dIdx].sights) appConfig.dashboards[dIdx].sights = [];
    appConfig.dashboards[dIdx].sights.push({ name: name, tiles: [] });
    saveConfigAndRender();
};

window.addTile = function(dIdx, sIdx) {
    const title = prompt(t('promptNewTile'));
    if (!title) return;
    if (!appConfig.dashboards[dIdx].sights[sIdx].tiles) appConfig.dashboards[dIdx].sights[sIdx].tiles = [];
    appConfig.dashboards[dIdx].sights[sIdx].tiles.push({
        type: "zahlwert", title: title, id: "", decimals: 0,
        bgColor: "#1e1e1e", borderColor: "#333333", borderStyle: "solid"
    });
    saveConfigAndRender();
};

window.addSection = function(dIdx, sIdx) {
    const title = prompt(t('promptNewSection'));
    if (!title) return;

    if (!appConfig.dashboards[dIdx].sights[sIdx].tiles) appConfig.dashboards[dIdx].sights[sIdx].tiles = [];
    appConfig.dashboards[dIdx].sights[sIdx].tiles.push({
        type: "section",
        title: title,
        titleColor: "#9ca3af",
        lineColor: "#555555"
    });
    saveConfigAndRender();
};

window.editSection = function(dIdx, sIdx, tIdx) {
    configState = { view: 'editSection', dIdx, sIdx, tIdx };
    renderConfigUI();
};

window.saveSection = function() {
    const section = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    section.title = document.getElementById('section-title').value;
    section.titleColor = document.getElementById('section-titleColor').value;
    section.lineColor = document.getElementById('section-lineColor').value;

    socket.emit('setState', configId, { val: JSON.stringify(appConfig), ack: false }, (err) => {
        if(!err) {
            configState.view = 'overview';
            renderConfigUI();
        } else {
            alert(t('saveErrorGeneric'));
        }
    });
};

window.deleteDashboard = function(dIdx) {
    if (confirm(t('confirmDeleteDashboard'))) {
        appConfig.dashboards.splice(dIdx, 1);
        saveConfigAndRender();
    }
};

window.deleteSight = function(dIdx, sIdx) {
    if (confirm(t('confirmDeleteSight'))) {
        appConfig.dashboards[dIdx].sights.splice(sIdx, 1);
        saveConfigAndRender();
    }
};

window.deleteTile = function(dIdx, sIdx, tIdx) {
    if (confirm(t('confirmDeleteTile'))) {
        appConfig.dashboards[dIdx].sights[sIdx].tiles.splice(tIdx, 1);
        saveConfigAndRender();
    }
};

window.saveTile = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const currentType = document.getElementById('kachel-type').value;

    // ── Validierung: Leere Mappings blockieren ────────────────────────────
    if (currentType === 'status' || currentType === 'statusregler') {
        for (const [key, val] of Object.entries(tile.mapping || {})) {
            if (key.trim() === '' || String(val).trim() === '') {
                alert('Fehler: Bitte alle Status-Mappings vollständig ausfüllen (Input und Output dürfen nicht leer sein).');
                return;
            }
        }
    }
    if (currentType === 'wertregler') {
        for (const [key, val] of Object.entries(tile.sliderMapping || {})) {
            if (key.trim() === '' || String(val).trim() === '') {
                alert('Fehler: Bitte alle Wertregler-Mappings vollständig ausfüllen (Input und Output dürfen nicht leer sein).');
                return;
            }
        }
    }
    for (const sub of (tile.subValues || [])) {
        if (sub.type === 'status') {
            for (const [key, val] of Object.entries(sub.mapping || {})) {
                if (key.trim() === '' || String(val).trim() === '') {
                    alert('Fehler: Bitte alle Subwert-Status-Mappings vollständig ausfüllen (Input und Output dürfen nicht leer sein).');
                    return;
                }
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────

    tile.title = document.getElementById('kachel-title').value;
    tile.id = document.getElementById('kachel-id').value;
    tile.type = currentType;

    // Design-Eigenschaften
    tile.bgColor = document.getElementById('kachel-bgColor').value;
    tile.borderColor = document.getElementById('kachel-borderColor').value;
    tile.borderStyle = document.getElementById('kachel-borderStyle').value;
    tile.titleColor = document.getElementById('kachel-titleColor').value;
    tile.valueColor = document.getElementById('kachel-valueColor').value;

    // Rahmenbreite und Schriftgröße
    const borderWidthEl = document.getElementById('kachel-borderWidth');
    const fontSizeEl = document.getElementById('kachel-fontSize');
    if (borderWidthEl && borderWidthEl.value !== '') {
        tile.borderWidth = parseInt(borderWidthEl.value);
    } else {
        delete tile.borderWidth; // Entfernen, um Dashboard-Default zu verwenden
    }
    if (fontSizeEl && fontSizeEl.value !== '') {
        tile.fontSize = parseFloat(fontSizeEl.value);
    } else {
        delete tile.fontSize; // Entfernen, um Standard zu verwenden
    }

    // Typabhängige Felder
    if (tile.type === 'zahlwert' || tile.type === 'wertregler') {
        const decimalsEl = document.getElementById('kachel-decimals');
        const unitEl = document.getElementById('kachel-unit');
        const thousandsSeparatorEl = document.getElementById('kachel-thousandsSeparator');
        if (decimalsEl) tile.decimals = parseInt(decimalsEl.value) || 0;
        if (unitEl) tile.unit = unitEl.value;
        if (thousandsSeparatorEl) tile.thousandsSeparator = thousandsSeparatorEl.checked;

        if (tile.type === 'wertregler') {
            const sliderMinEl = document.getElementById('kachel-sliderMin');
            const sliderMaxEl = document.getElementById('kachel-sliderMax');
            if (sliderMinEl) tile.sliderMin = parseFloat(sliderMinEl.value) || 0;
            if (sliderMaxEl) tile.sliderMax = parseFloat(sliderMaxEl.value) || 100;
            // sliderMapping wird bereits in updateSliderMapping() gespeichert

            // Haltefunktion
            const enableHoldEl = document.getElementById('kachel-enableHold');
            const holdTimeEl = document.getElementById('kachel-holdTime');
            const holdColorEl = document.getElementById('kachel-holdColor');
            if (enableHoldEl) tile.enableHold = enableHoldEl.checked;
            if (holdTimeEl && tile.enableHold) tile.holdTime = parseInt(holdTimeEl.value) || 1000;
            if (holdColorEl && tile.enableHold) tile.holdColor = holdColorEl.value;
        }
    } else if (tile.type === 'switch') {
        const activeColorEl = document.getElementById('kachel-activeColor');
        const activeOpacityEl = document.getElementById('kachel-activeOpacity');
        if (activeColorEl) tile.activeColor = activeColorEl.value;
        if (activeOpacityEl) tile.activeOpacity = parseInt(activeOpacityEl.value);
    } else if (tile.type === 'status' || tile.type === 'statusregler') {
        // Mapping wird bereits in updateMapping() gespeichert
    }

    // Subwerte speichern - WICHTIG: Vor dem Neuaufbau die bestehenden Subwerte sichern
    const existingSubValues = [...(tile.subValues || [])];
    tile.subValues = [];

    document.querySelectorAll('.subvalue-item').forEach((item, idx) => {
        const idEl = item.querySelector(`#subval-id-${idx}`);
        const typeEl = item.querySelector(`#subval-type-${idx}`);

        if (idEl && idEl.value) {
            const type = typeEl ? typeEl.value : 'zahlwert';
            const subValue = {
                id: idEl.value,
                type: type
            };

            if (type === 'zahlwert') {
                const emojiEl = item.querySelector(`#subval-emoji-${idx}`);
                const decimalsEl = item.querySelector(`#subval-decimals-${idx}`);
                const unitEl = item.querySelector(`#subval-unit-${idx}`);

                subValue.emoji = emojiEl ? emojiEl.value : '📊';
                subValue.decimals = decimalsEl ? parseInt(decimalsEl.value) || 0 : 0;
                subValue.unit = unitEl ? unitEl.value : '';
            } else if (type === 'status') {
                const emojiEl = item.querySelector(`#subval-emoji-${idx}`);
                subValue.emoji = emojiEl ? emojiEl.value : '📊';

                // Mapping aus dem bestehenden Subwert übernehmen (wurde in updateSubValueMapping() aktualisiert)
                subValue.mapping = existingSubValues[idx]?.mapping || {};
            }

            tile.subValues.push(subValue);
        }
    });

    socket.emit('setState', configId, { val: JSON.stringify(appConfig), ack: false }, (err) => {
        if(!err) {
            configState.view = 'overview';
            renderConfigUI();
        } else {
            alert(t('saveErrorGeneric'));
        }
    });
};

window.updateTileTypeFields = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const type = document.getElementById('kachel-type').value;
    const container = document.getElementById('type-specific-fields');

    let html = `<h3 style="margin-top: 1.5rem;">${t('typeSpecificTitle')}</h3>`;

    if (type === 'zahlwert' || type === 'wertregler') {
        html += `
        <div class="config-box">
        <div class="config-box-title">${t('valueSettingsLabel')}</div>
        <div class="config-form-field">
        <label>${t('decimalsLabel')}</label>
        <input type="number" id="kachel-decimals" value="${tile.decimals || 0}" min="0" max="5" class="config-form-field-full">
        </div>
        <div class="config-form-field">
        <label>${t('unitLabel')}</label>
        <input type="text" id="kachel-unit" value="${tile.unit || ''}" placeholder="${t('unitPlaceholder')}" class="config-form-field-full">
        </div>
        <div class="config-form-field">
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
        <input type="checkbox" id="kachel-thousandsSeparator" ${tile.thousandsSeparator ? 'checked' : ''} style="width:auto; margin:0;">
        <span>${t('thousandsSeparator')}</span>
        </label>
        </div>
        </div>
        `;

        if (type === 'wertregler') {
            html += `
            <div class="config-box">
            <div class="config-box-title">${t('sliderRangeLabel')}</div>
            <div class="config-form-field">
            <label>${t('sliderMinLabel')}</label>
            <input type="number" id="kachel-sliderMin" value="${tile.sliderMin !== undefined ? tile.sliderMin : 0}" class="config-form-field-full">
            </div>
            <div class="config-form-field">
            <label>${t('sliderMaxLabel')}</label>
            <input type="number" id="kachel-sliderMax" value="${tile.sliderMax !== undefined ? tile.sliderMax : 100}" class="config-form-field-full">
            </div>
            </div>
            <div class="config-box">
            <div class="config-box-title">${t('holdFunctionLabel')}</div>
            <div class="config-form-field">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="checkbox" id="kachel-enableHold" ${tile.enableHold ? 'checked' : ''} style="width:auto; margin:0;" onchange="toggleHoldFields()">
            <span>${t('enableHoldLabel')}</span>
            </label>
            </div>
            <div id="hold-extra-fields" style="display:${tile.enableHold ? 'block' : 'none'};">
            <div class="config-form-field">
            <label>${t('holdTimeLabel')} (ms)</label>
            <input type="number" id="kachel-holdTime" value="${tile.holdTime !== undefined ? tile.holdTime : 1000}" min="200" max="10000" step="100" class="config-form-field-full">
            </div>
            <div class="config-color-row">
            <div class="config-color-item">
            <label>${t('holdColorLabel')}</label>
            <input type="color" id="kachel-holdColor" value="${tile.holdColor || '#ff9800'}" class="config-color-input">
            </div>
            </div>
            </div>
            </div>
            <div class="config-box">
            <div class="config-box-title">${t('valueMappingLabel')}</div>
            <div class="config-mapping-bg">
            <div id="slider-mapping-list"></div>
            <button class="btn" onclick="addSliderMappingEntry()" style="background:var(--success-color); margin-top: 0.5rem;">+ ${t('addMappingBtn')}</button>
            </div>
            </div>
            `;
        }
    } else if (type === 'switch') {
        html += `
        <div class="config-color-row">
        <div class="config-color-item">
        <label>${t('activeColorLabel')}</label>
        <input type="color" id="kachel-activeColor" value="${tile.activeColor || '#10b981'}" class="config-color-input">
        </div>
        <div class="config-color-item">
        <label>${t('transparencyLabel')}</label>
        <input type="number" id="kachel-activeOpacity" value="${tile.activeOpacity !== undefined ? tile.activeOpacity : 90}" min="0" max="100" step="5" class="config-number-input-wide">
        </div>
        </div>
        `;
    } else if (type === 'status' || type === 'statusregler') {
        html += `
        <div class="config-form-field">
        <label>${t('statusMappingLabel')}</label>
        <div class="config-mapping-bg">
        <div class="config-live-value">
        ${t('currentValueLabel')}: <span id="live-value-status">--</span>
        </div>
        <div id="mapping-list"></div>
        <button class="btn" onclick="addMappingEntry()" style="background:var(--success-color); margin-top: 0.5rem;">+ ${t('addMappingBtn')}</button>
        </div>
        </div>
        `;
    }

    container.innerHTML = html;

    // Bei Status- oder Statusregler-Typ: Live-Wert abonnieren und Mapping-Liste rendern
    if (type === 'status' || type === 'statusregler') {
        const datapointId = document.getElementById('kachel-id').value;
        if (datapointId) {
            subscribeState(datapointId, (val) => {
                const liveValEl = document.getElementById('live-value-status');
                if (liveValEl) liveValEl.textContent = String(val);
            });
        }
        renderMappingList();
    }

    // Bei Wertregler-Typ: Slider-Mapping-Liste rendern
    if (type === 'wertregler') {
        renderSliderMappingList();
    }
};

window.renderMappingList = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const container = document.getElementById('mapping-list');
    if (!container) return;

    let html = '';
    const mapping = tile.mapping || {};

    Object.keys(mapping).forEach((key, idx) => {
        html += `
        <div class="config-mapping-row">
        <input type="text" value="${key}" onchange="updateMapping(${idx}, 'key', this.value)" placeholder="${t('mappingValue')}">
        <span>→</span>
        <input type="text" value="${mapping[key]}" onchange="updateMapping(${idx}, 'value', this.value)" placeholder="${t('mappingDisplay')}">
        <button class="btn config-mapping-btn-delete" onclick="deleteMappingEntry(${idx})">🗑️</button>
        </div>
        `;
    });

    container.innerHTML = html;
};

window.addMappingEntry = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    if (!tile.mapping) tile.mapping = {};

    const liveVal = document.getElementById('live-value-status')?.textContent || '';
    let baseKey = liveVal !== '--' ? liveVal : 'Neu';
    let newKey = baseKey;
    let counter = 1;

    // Verhindert das Überschreiben bestehender Einträge durch Anhängen eines Zählers
    while (tile.mapping.hasOwnProperty(newKey)) {
        newKey = baseKey + '_' + counter;
        counter++;
    }

    tile.mapping[newKey] = '';
    renderMappingList();
};

window.updateMapping = function(idx, field, value) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const keys = Object.keys(tile.mapping);
    const oldKey = keys[idx];

    if (field === 'key') {
        const oldValue = tile.mapping[oldKey];
        delete tile.mapping[oldKey];
        tile.mapping[value] = oldValue;
    } else {
        tile.mapping[oldKey] = value;
    }
    renderMappingList();
};

window.deleteMappingEntry = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const keys = Object.keys(tile.mapping);
    delete tile.mapping[keys[idx]];
    renderMappingList();
};

// Slider-Mapping Funktionen
window.renderSliderMappingList = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const container = document.getElementById('slider-mapping-list');
    if (!container) return;

    if (!tile.sliderMapping) tile.sliderMapping = {};

    let html = '';
    const mapping = tile.sliderMapping || {};

    Object.keys(mapping).forEach((key, idx) => {
        html += `
        <div class="config-mapping-row">
        <input type="number" value="${key}" onchange="updateSliderMapping(${idx}, 'key', this.value)" placeholder="${t('mappingValue')}">
        <span>→</span>
        <input type="text" value="${mapping[key]}" onchange="updateSliderMapping(${idx}, 'value', this.value)" placeholder="${t('mappingDisplay')}">
        <button class="btn config-mapping-btn-delete" onclick="deleteSliderMappingEntry(${idx})">🗑️</button>
        </div>
        `;
    });

    container.innerHTML = html;
};

window.addSliderMappingEntry = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    if (!tile.sliderMapping) tile.sliderMapping = {};

    let baseKey = 'Neu';
    let newKey = baseKey;
    let counter = 1;

    // Verhindert das Überschreiben bestehender Einträge durch Anhängen eines Zählers
    while (tile.sliderMapping.hasOwnProperty(newKey)) {
        newKey = baseKey + '_' + counter;
        counter++;
    }

    tile.sliderMapping[newKey] = '';
    renderSliderMappingList();
};

window.updateSliderMapping = function(idx, field, value) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const keys = Object.keys(tile.sliderMapping);
    const oldKey = keys[idx];

    if (field === 'key') {
        const oldValue = tile.sliderMapping[oldKey];
        delete tile.sliderMapping[oldKey];
        tile.sliderMapping[value] = oldValue;
    } else {
        tile.sliderMapping[oldKey] = value;
    }
    renderSliderMappingList();
};

window.toggleHoldFields = function() {
    const checkbox = document.getElementById('kachel-enableHold');
    const extraFields = document.getElementById('hold-extra-fields');
    if (checkbox && extraFields) {
        extraFields.style.display = checkbox.checked ? 'block' : 'none';
    }
};

window.deleteSliderMappingEntry = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const keys = Object.keys(tile.sliderMapping);
    delete tile.sliderMapping[keys[idx]];
    renderSliderMappingList();
};

window.renderSubValues = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const container = document.getElementById('subvalues-container');
    const addBtn = document.getElementById('add-subvalue-btn');

    if (!container) return;

    let html = '';
    (tile.subValues || []).forEach((sub, idx) => {
        // Initialisiere Typ falls nicht vorhanden
        if (!sub.type) sub.type = 'zahlwert';
        if (!sub.mapping) sub.mapping = {};

        html += `
        <div id="subval-drag-${idx}" draggable="true" data-svidx="${idx}" class="config-subvalue-drag-item">
        <span class="drag-handle config-tile-drag-handle" title="${t('dragToSort')}">↕️</span>
        <div class="subvalue-item config-subvalue-item" data-svidx="${idx}">
        <button class="btn config-subvalue-delete-btn" onclick="deleteSubValue(${idx})">🗑️</button>
        <h4>${t('subvalueTitle')} ${idx + 1}</h4>

        <div class="config-form-field">
        <label>${t('subvalueDatapoint')}</label>
        <div class="config-input-with-btn">
        <input type="text" id="subval-id-${idx}" value="${sub.id || ''}" style="flex:1; padding:0.5rem;">
        <button class="btn" onclick="openObjectBrowser('subval-id-${idx}')" style="white-space:nowrap;">🔍</button>
        </div>
        </div>

        <div class="config-form-field">
        <label>${t('subvalueType')}</label>
        <select id="subval-type-${idx}" onchange="updateSubValueType(${idx})" style="width:100%; padding:0.5rem;">
        <option value="zahlwert" ${sub.type === 'zahlwert' ? 'selected' : ''}>${t('tileTypeValue')}</option>
        <option value="status" ${sub.type === 'status' ? 'selected' : ''}>${t('tileTypeStatus')}</option>
        </select>
        </div>

        <div id="subval-type-fields-${idx}"></div>
        </div>
        </div>
        `;
    });

    container.innerHTML = html;

    // Typspezifische Felder für jeden Subwert rendern
    (tile.subValues || []).forEach((sub, idx) => {
        renderSubValueTypeFields(idx);
    });

    // Drag & Drop für Subvalue-Items aktivieren
    setupDraggable('[id^="subval-drag-"]', function(srcEl, dstEl) {
        const srcIdx = parseInt(srcEl.dataset.svidx);
        const dstIdx = parseInt(dstEl.dataset.svidx);
        if (isNaN(srcIdx) || isNaN(dstIdx) || srcIdx === dstIdx) return;
        const subValues = tile.subValues;
        const [moved] = subValues.splice(srcIdx, 1);
        subValues.splice(dstIdx, 0, moved);
        renderSubValues();
    });

    // Button aktivieren/deaktivieren
    if (addBtn) {
        addBtn.style.display = (tile.subValues || []).length >= 2 ? 'none' : 'inline-block';
    }
};

window.renderSubValueTypeFields = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const sub = tile.subValues[idx];
    const container = document.getElementById(`subval-type-fields-${idx}`);

    if (!container) return;

    const type = document.getElementById(`subval-type-${idx}`)?.value || sub.type || 'zahlwert';

    let html = '';

    if (type === 'zahlwert') {
        html = `
        <div class="config-subvalue-fields">
        <div>
        <label style="display:block; margin-bottom:0.3rem;">${t('subvalueEmoji')}</label>
        <input type="text" id="subval-emoji-${idx}" value="${sub.emoji || '📊'}" style="width: 100%; padding: 0.5rem;">
        </div>
        <div>
        <label style="display:block; margin-bottom:0.3rem;">${t('subvalueDecimals')}</label>
        <input type="number" id="subval-decimals-${idx}" value="${sub.decimals || 0}" min="0" max="5" style="width: 100%; padding: 0.5rem;">
        </div>
        <div>
        <label style="display:block; margin-bottom:0.3rem;">${t('subvalueUnit')}</label>
        <input type="text" id="subval-unit-${idx}" value="${sub.unit || ''}" style="width: 100%; padding: 0.5rem;">
        </div>
        </div>
        `;
    } else if (type === 'status') {
        html = `
        <div class="config-subvalue-fields">
        <div>
        <label style="display:block; margin-bottom:0.3rem;">${t('subvalueEmoji')}</label>
        <input type="text" id="subval-emoji-${idx}" value="${sub.emoji || '📊'}" style="width: 100%; padding: 0.5rem;">
        </div>
        </div>
        <div style="margin-top: 0.5rem;">
        <label style="display:block; margin-bottom:0.3rem;">${t('subvalueStatusMapping')}</label>
        <div class="config-mapping-bg--dark">
        <div class="config-live-value" style="margin-bottom: 0.5rem; font-size: 0.9em; color: var(--value-color);">
        Aktueller Wert: <span id="live-value-subval-${idx}">--</span>
        </div>
        <div id="subval-mapping-list-${idx}"></div>
        <button class="btn" onclick="addSubValueMappingEntry(${idx})" style="background:var(--success-color); margin-top: 0.5rem; padding: 0.3rem 0.6rem; font-size: 0.85rem;">+ ${t('addMappingBtn')}</button>
        </div>
        </div>
        `;
    }

    container.innerHTML = html;

    // Bei Status-Typ: Live-Wert abonnieren und Mapping-Liste rendern
    if (type === 'status') {
        const datapointId = document.getElementById(`subval-id-${idx}`)?.value;
        if (datapointId) {
            subscribeState(datapointId, (val) => {
                const liveValEl = document.getElementById(`live-value-subval-${idx}`);
                if (liveValEl) liveValEl.textContent = String(val);
            });
        }
        renderSubValueMappingList(idx);
    }
};

window.updateSubValueType = function(idx) {
    renderSubValueTypeFields(idx);
};

window.renderSubValueMappingList = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const sub = tile.subValues[idx];
    const container = document.getElementById(`subval-mapping-list-${idx}`);

    if (!container) return;

    let html = '';
    const mapping = sub.mapping || {};

    Object.keys(mapping).forEach((key, mapIdx) => {
        html += `
        <div class="config-mapping-row-sm">
        <input type="text" value="${key}" onchange="updateSubValueMapping(${idx}, ${mapIdx}, 'key', this.value)" placeholder="${t('mappingValue')}">
        <span>→</span>
        <input type="text" value="${mapping[key]}" onchange="updateSubValueMapping(${idx}, ${mapIdx}, 'value', this.value)" placeholder="${t('mappingDisplay')}">
        <button class="btn config-mapping-btn-delete-sm" onclick="deleteSubValueMappingEntry(${idx}, ${mapIdx})">🗑️</button>
        </div>
        `;
    });

    container.innerHTML = html;
};

window.addSubValueMappingEntry = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const sub = tile.subValues[idx];

    if (!sub.mapping) sub.mapping = {};

    const liveVal = document.getElementById(`live-value-subval-${idx}`)?.textContent || '';
    let baseKey = (liveVal !== '--' && liveVal !== '') ? liveVal : 'Neu';
    let newKey = baseKey;
    let counter = 1;

    // Verhindert das Überschreiben bestehender Einträge durch Anhängen eines Zählers
    while (sub.mapping.hasOwnProperty(newKey)) {
        newKey = baseKey + '_' + counter;
        counter++;
    }

    sub.mapping[newKey] = '';

    renderSubValueMappingList(idx);
};

window.updateSubValueMapping = function(idx, mapIdx, field, value) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const sub = tile.subValues[idx];
    const keys = Object.keys(sub.mapping);
    const oldKey = keys[mapIdx];

    if (field === 'key') {
        const oldValue = sub.mapping[oldKey];
        delete sub.mapping[oldKey];
        sub.mapping[value] = oldValue;
    } else {
        sub.mapping[oldKey] = value;
    }

    renderSubValueMappingList(idx);
};

window.deleteSubValueMappingEntry = function(idx, mapIdx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    const sub = tile.subValues[idx];
    const keys = Object.keys(sub.mapping);
    delete sub.mapping[keys[mapIdx]];

    renderSubValueMappingList(idx);
};

window.addSubValue = function() {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    if (!tile.subValues) tile.subValues = [];

    if (tile.subValues.length < 2) {
        tile.subValues.push({
            id: '',
            type: 'zahlwert',
            emoji: '📊',
            decimals: 0,
            unit: '',
            mapping: {}
        });
        renderSubValues();
    }
};

window.deleteSubValue = function(idx) {
    const tile = appConfig.dashboards[configState.dIdx].sights[configState.sIdx].tiles[configState.tIdx];
    tile.subValues.splice(idx, 1);
    renderSubValues();
};

// ── Object-Browser ────────────────────────────────────────────────────────────

let ioObjectIds = [];
let targetInputIdForBrowser = null;

function openObjectBrowser(targetInputId) {
    document.getElementById('obj-browser').style.display = 'block';
    targetInputIdForBrowser = targetInputId;

    if (ioObjectIds.length === 0) {
        document.getElementById('obj-tree').innerHTML = t('objBrowserLoadingFrom');
        socket.emit('getObjects', (err, objs) => {
            if (objs) {
                ioObjectIds = Object.keys(objs).sort();
                renderTreeLevel('', document.getElementById('obj-tree'));
            } else {
                document.getElementById('obj-tree').innerHTML = t('objBrowserError');
            }
        });
    } else {
        renderTreeLevel('', document.getElementById('obj-tree'));
    }
}

function renderTreeLevel(prefix, container) {
    container.innerHTML = '';
    const levelNodes = new Set();
    const items = [];

    ioObjectIds.forEach(id => {
        if (id.startsWith(prefix)) {
            const remainder = id.substring(prefix.length);
            const parts = remainder.split('.');
            if (parts.length > 1) {
                levelNodes.add(parts[0]);
            } else if (parts[0] !== '') {
                items.push(parts[0]);
            }
        }
    });

    levelNodes.forEach(node => {
        const div = document.createElement('div');
        div.innerHTML = `📁 <strong>${node}</strong>`;
        div.style.cursor = 'pointer';
        div.style.marginLeft = prefix ? '20px' : '0px';
        div.style.color = 'var(--obj-folder-color)';

        const childContainer = document.createElement('div');
        childContainer.style.display = 'none';

        div.onclick = (e) => {
            e.stopPropagation();
            if (childContainer.style.display === 'none') {
                childContainer.style.display = 'block';
                if (childContainer.innerHTML === '') {
                    renderTreeLevel(prefix + node + '.', childContainer);
                }
            } else {
                childContainer.style.display = 'none';
            }
        };
        div.appendChild(childContainer);
        container.appendChild(div);
    });

    items.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `📄 ${item}`;
        div.style.cursor = 'pointer';
        div.style.marginLeft = prefix ? '20px' : '0px';
        div.style.color = 'var(--obj-item-color)';

        div.onclick = (e) => {
            e.stopPropagation();
            const inputEl = document.getElementById(targetInputIdForBrowser);
            if(inputEl) inputEl.value = prefix + item;
            document.getElementById('obj-browser').style.display = 'none';
        };
        container.appendChild(div);
    });
}
