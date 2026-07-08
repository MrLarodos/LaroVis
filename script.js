// Standard-Sprache: Englisch
let currentLanguage = 'en';

// ─── AUDIO SYNTHESIZER SETUP START ──────────────────────────────────
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(493.88, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
}

function playReadySound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(830.61, audioCtx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
}
// ─── AUDIO SYNTHESIZER SETUP END ──────────────────────────────────

// Übersetzungsfunktion
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Sprache setzen und UI aktualisieren
function setLanguage(lang, isManual = false) {
    currentLanguage = lang;
    localStorage.setItem('uiLanguage', lang);
    if (isManual) {
        localStorage.setItem('langManuallySet', 'true');
    }
    updateUILanguage();
    if (typeof isConfig !== 'undefined' && isConfig && typeof renderConfigUI === 'function') renderConfigUI();
}
// UI-Sprache aktualisieren (alle statischen Texte)
function updateUILanguage() {
    // Connection Lightbox
    const connTitle = document.querySelector('#config-lightbox-content h2');
    if (connTitle) connTitle.textContent = t('connectionTitle');

    const connSubtitle = document.querySelector('#config-lightbox-content .subtitle');
    if (connSubtitle) connSubtitle.textContent = t('connectionSubtitle');

    const ipLabel = document.querySelector('label[for="iobroker-ip"]');
    if (ipLabel) ipLabel.textContent = t('ipLabel');

    const ipInput = document.getElementById('iobroker-ip');
    if (ipInput) ipInput.placeholder = t('ipPlaceholder');

    const portLabel = document.querySelector('label[for="iobroker-port"]');
    if (portLabel) portLabel.textContent = t('portLabel');

    const portInput = document.getElementById('iobroker-port');
    if (portInput) portInput.placeholder = t('portPlaceholder');

    const langLabel = document.querySelector('label[for="iobroker-language"]');
    if (langLabel) langLabel.textContent = t('languageLabel');

    const testBtn = document.getElementById('config-test-btn');
    if (testBtn && testBtn.textContent !== t('testingButton')) {
        testBtn.textContent = t('testButton');
    }

    const saveBtn = document.getElementById('config-save-btn');
    if (saveBtn) saveBtn.textContent = t('saveButton');

    const retryBtn = document.getElementById('config-retry-btn');
    if (retryBtn) retryBtn.textContent = t('retryButton');

    // Slider Lightbox
    const sliderTitle = document.getElementById('lightbox-title');
    if (sliderTitle && sliderTitle.textContent === 'Wertregler') {
        sliderTitle.textContent = t('sliderTitle');
    }

    // Object Browser
    const objBrowserTitle = document.querySelector('#obj-browser .obj-browser-header h3');
    if (objBrowserTitle) objBrowserTitle.textContent = t('objBrowserTitle');

    const objBrowserCloseBtn = document.querySelector('#obj-browser .obj-browser-close-btn');
    if (objBrowserCloseBtn) objBrowserCloseBtn.textContent = t('objBrowserClose');

    // Config Icon
    const configIcon = document.getElementById('config-icon');
    if (configIcon) {
        if (configIcon.textContent === '🚪') {
            configIcon.title = t('leaveConfig');
        } else {
            configIcon.title = t('settings');
        }
    }
}

// Beim Laden der Seite Konfiguration prüfen
checkIoBrokerConfig();

const urlParams = new URLSearchParams(window.location.search);
const isConfig = urlParams.has('config');
const dashName = urlParams.get('dashboard');
const sightName = urlParams.get('subsight');

let appConfig = {};
const stateMap = new Map();

// Tracking für ausstehende Hardware-Bestätigungen
// Struktur: { [tileId]: { targetValue, startTime, fallbackTimer, container } }
const pendingTileStates = {};

/**
 * Sendet einen neuen Wert an ioBroker und startet die Ladeanimation.
 * Die Animation endet erst, wenn ioBroker den exakten Zielwert zurückmeldet.
 * @param {object} tile       - Das Kachel-Konfigurationsobjekt
 * @param {*}      value      - Der zu sendende Zielwert
 * @param {HTMLElement} containerEl - Das .kachel-container Element
 */
function sendStateAndUpdateUI(tile, value, containerEl) {
    // Alten Fallback-Timer löschen, falls noch aktiv
    if (pendingTileStates[tile.id]?.fallbackTimer) {
        clearTimeout(pendingTileStates[tile.id].fallbackTimer);
    }

    playClickSound();
    containerEl.classList.add('is-loading');

    const fallbackTimer = setTimeout(() => {
        containerEl.classList.remove('is-loading');
        delete pendingTileStates[tile.id];
    }, 20000);

    pendingTileStates[tile.id] = {
        targetValue: value,
        startTime: Date.now(),
        fallbackTimer,
        container: containerEl
    };

    socket.emit('setState', tile.id, { val: value, ack: false });
}

// Speichere die Rücksprung-URL für die Konfiguration
let returnUrl = 'index.html';

// Wenn wir in der Konfiguration sind, prüfe ob eine returnUrl im sessionStorage gespeichert ist
if (isConfig) {
    const saved = sessionStorage.getItem('dashboardReturnUrl');
    if (saved) returnUrl = saved;
} else if (dashName && sightName) {
    // Wenn wir auf einem Dashboard sind, speichere diese URL für den Rücksprung
    returnUrl = `?dashboard=${encodeURIComponent(dashName)}&subsight=${encodeURIComponent(sightName)}`;
    sessionStorage.setItem('dashboardReturnUrl', returnUrl);
} else {
    // Dashboardauswahl - speichere das als Rücksprung
    sessionStorage.setItem('dashboardReturnUrl', 'index.html');
}


function initApp() {
    document.getElementById('footer-tabs').innerHTML = '';
    const configIcon = document.getElementById('config-icon');

    if (isConfig) {
        // In Konfiguration: Zahnrad zu Tür ändern
        if (configIcon) {
            configIcon.textContent = '🚪';
            configIcon.href = returnUrl;
            configIcon.title = t('leaveConfig');
        }
        renderConfigUI();
    } else {
        // Außerhalb Konfiguration: Zahnrad anzeigen
        if (configIcon) {
            configIcon.textContent = '⚙️';
            configIcon.href = '?config';
            configIcon.title = t('settings');
        }

        if (dashName && sightName) {
            renderDashboard(dashName, sightName);
        } else {
            renderDashboardSelector();
        }
    }
}

// Dashboard Auswahl auf Startseite
function renderDashboardSelector() {
    // Zahnrad-Icon in der Dashboard-Auswahl immer anzeigen
    const configIcon = document.getElementById('config-icon');
    if (configIcon) {
        configIcon.style.display = 'block';
    }

    let html = `<h1>${t('dashboardsTitle')}</h1><div class="config-dashboard-selector">`;
    if (appConfig.dashboards && appConfig.dashboards.length > 0) {
        appConfig.dashboards.forEach(dash => {
            html += `<button class="btn config-dashboard-btn" onclick="openDashboard('${dash.name}')">${dash.name}</button>`;
        });
    } else {
        html += `<p>${t('noDashboards')} <a href="?config">${t('config')} ⚙️</a>.</p>`;
    }
    html += `</div>`;
    document.getElementById('app').innerHTML = html;
}

window.openDashboard = function(name) {
    const dash = appConfig.dashboards?.find(d => d.name === name);
    if (dash && dash.sights && dash.sights.length > 0) {
        // Erste Sicht im Array = Startseite (Reihenfolge via Drag & Drop konfigurierbar)
        window.location.search = `?dashboard=${encodeURIComponent(name)}&subsight=${encodeURIComponent(dash.sights[0].name)}`;
    } else {
        alert(t('noSights'));
    }
}

function renderDashboard(dName, sName) {
    const dash = appConfig.dashboards?.find(d => d.name === dName);
    if (!dash) return document.getElementById('app').innerHTML = t('noDashboardFound');

    const sight = dash.sights?.find(s => s.name === sName);
    if (!sight) return document.getElementById('app').innerHTML = t('noSightFound');

    document.documentElement.style.setProperty('--bg-color', dash.bgColor || '#121212');
    document.documentElement.style.setProperty('--footer-bg', dash.footerBg || '#1e1e1e');
    document.documentElement.style.setProperty('--footer-border', dash.footerBorder || '#333');

    // Zahnrad-Icon anzeigen oder verstecken basierend auf Dashboard-Einstellung
    const configIcon = document.getElementById('config-icon');
    if (configIcon) {
        if (dash.showConfigIcon === false) {
            configIcon.style.display = 'none';
        } else {
            configIcon.style.display = 'block';
        }
    }

    // Sichten im Footer generieren
    const footerTabs = document.getElementById('footer-tabs');
    footerTabs.innerHTML = '';
    dash.sights?.forEach(s => {
        const tab = document.createElement('a');
        tab.className = 'footer-tab' + (s.name === sName ? ' active' : '');
        tab.textContent = s.name;
        tab.href = `?dashboard=${encodeURIComponent(dName)}&subsight=${encodeURIComponent(s.name)}`;
        footerTabs.appendChild(tab);
    });

    const grid = document.createElement('div');
    grid.className = 'grid';

    sight.tiles?.forEach(tile => {
        if (!tile) return; // null-Einträge überspringen
        const el = createTile(tile, dash);
        grid.appendChild(el);
    });

    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(grid);
}

function createTile(tile, dashboardConfig) {
    // Abschnitt-Typ: Erstelle Trennlinie mit Titel
    if (tile.type === 'section') {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.gridColumn = '1 / -1';
        sectionDiv.style.margin = '1rem 0';
        sectionDiv.innerHTML = `
        <div style="color: ${tile.titleColor || '#9ca3af'}; font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; text-align: left;">
        ${tile.title}
        </div>
        <div style="height: 2px; background: linear-gradient(to right, ${tile.lineColor || '#555555'}, transparent); border-radius: 1px;"></div>
        `;
        return sectionDiv;
    }

    const container = document.createElement('div');
    container.className = 'kachel-container';

    const loadingBar = document.createElement('div');
    loadingBar.className = 'kachel-loading-bar';
    container.appendChild(loadingBar);

    const div = document.createElement('div');
    div.className = `kachel type-${tile.type}`;
    div.id = `tile-${(tile.id || '').replace(/\./g, '-')}`;

    container.style.setProperty('--kachel-bg', tile.bgColor || '#1e1e1e');
    container.style.setProperty('--kachel-border', tile.borderColor || 'rgba(255,255,255,0.05)');
    container.style.setProperty('--kachel-border-style', tile.borderStyle || 'solid');

    // Rahmenbreite: Kachel-spezifisch oder Dashboard-Default
    const borderWidth = tile.borderWidth !== undefined ? tile.borderWidth : (dashboardConfig?.tileBorderWidth || 3);
    container.style.setProperty('--kachel-border-width', borderWidth + 'px');

    container.style.setProperty('--title-color', tile.titleColor || '#9ca3af');
    container.style.setProperty('--value-color', tile.valueColor || '#f3f4f6');
    if (tile.activeColor) container.style.setProperty('--active-color', tile.activeColor);

    // Für Schalter: Overlay-Farbe mit Transparenz setzen
    if (tile.type === 'switch' && tile.activeColor) {
        const transparency = tile.activeOpacity !== undefined ? tile.activeOpacity : 90;
        const opacity = (100 - transparency) / 100; // Transparenz umrechnen in Opacity
        const rgb = hexToRgb(tile.activeColor);
        if (rgb) {
            container.style.setProperty('--active-overlay-color', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
        }
    }

    let innerHTML = `<h2>${tile.title}</h2><div class="wert" id="val-${tile.id}">--</div>`;

    if (tile.subValues && tile.subValues.length > 0) {
        innerHTML += `<div class="subwerte-container">`;
        tile.subValues.forEach((sub, idx) => {
            innerHTML += `<div class="subwert">
            <span>${sub.emoji}</span>
            <span class="subval-text" data-subidx="${idx}">--</span>
            </div>`;

            if (sub.type === 'status' && sub.mapping) {
                subscribeState(sub.id, (val, ack) => {
                    const requireAck = sub.waitForAck !== false;
                    if (requireAck && ack === false) return;
                    const el = div.querySelector(`.subval-text[data-subidx="${idx}"]`);
                    if (el) el.textContent = sub.mapping[String(val)] || val;
                });
            } else {
                subscribeState(sub.id, (val, ack) => {
                    const requireAck = sub.waitForAck !== false;
                    if (requireAck && ack === false) return;
                    const el = div.querySelector(`.subval-text[data-subidx="${idx}"]`);
                    if (el) el.textContent = formatNumber(val, sub.decimals) + (sub.unit || '');
                });
            }
        });
        innerHTML += `</div>`;
    }

    div.innerHTML = innerHTML;

    // ResizeObserver für Flip-Modus bei Subwert-Overflow
    if (tile.subValues && tile.subValues.length > 0) {
        const subwerteContainer = div.querySelector('.subwerte-container');
        if (subwerteContainer) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target.scrollWidth > entry.target.clientWidth) {
                        entry.target.classList.add('flip-mode');
                        observer.disconnect();

                        // Flip-Logik starten
                        const subwerte = entry.target.querySelectorAll('.subwert');
                        if (subwerte.length === 0) return;

                        let currentIdx = 0;
                        subwerte[currentIdx].classList.add('flip-active');

                        setInterval(() => {
                            const items = entry.target.querySelectorAll('.subwert');
                            if (items.length < 2) return;

                            const current = items[currentIdx];
                            const nextIdx = (currentIdx + 1) % items.length;
                            const next = items[nextIdx];

                            current.classList.remove('flip-active');
                            current.classList.add('flip-exit');
                            next.classList.add('flip-active');
                            next.classList.remove('flip-exit');

                            setTimeout(() => {
                                current.classList.remove('flip-exit');
                            }, 400);

                            currentIdx = nextIdx;
                        }, tile.flipTime || 3000);
                    }
                }
            });
            observer.observe(subwerteContainer);
        }
    }

    // Schriftgröße anwenden: Kachel-spezifisch oder Dashboard-Default
    const fontSize = tile.fontSize !== undefined ? tile.fontSize : (dashboardConfig?.tileFontSize || 2.8);
    const wertEl = div.querySelector('.wert');
    if (wertEl) wertEl.style.fontSize = fontSize + 'rem';

    // Flag: initialer getState-Aufruf soll die Ladeanimation NICHT beenden
    let initialStateDone = false;

    subscribeState(tile.id, (val, ack) => {
        // Nur bestätigte Werte ins UI übernehmen, wenn waitForAck aktiv (Standard: true)
        const requireAck = tile.waitForAck !== false;
        if (requireAck && ack === false) return;

        const valEl = div.querySelector('.wert');

        if (tile.type === 'zahlwert') {
            const formattedValue = formatNumber(val, tile.decimals, tile.thousandsSeparator);
            const unit = tile.unit || '';
            if (unit) {
                valEl.innerHTML = `${formattedValue}<span class="unit">${unit}</span>`;
            } else {
                valEl.textContent = formattedValue;
            }
        }
        else if (tile.type === 'wertregler') {
            // Prüfe ob es ein Mapping für diesen Wert gibt
            const mapping = tile.sliderMapping || {};
            const mappedValue = mapping[String(val)];

            if (mappedValue) {
                valEl.textContent = mappedValue;
            } else {
                const formattedValue = formatNumber(val, tile.decimals, tile.thousandsSeparator);
                const unit = tile.unit || '';
                if (unit) {
                    valEl.innerHTML = `${formattedValue}<span class="unit">${unit}</span>`;
                } else {
                    valEl.textContent = formattedValue;
                }
            }
        }
        else if (tile.type === 'switch') {
            div.classList.add('interaktiv');

            // Entferne alten Overlay falls vorhanden
            const oldOverlay = div.querySelector('.active-overlay');
            if (oldOverlay) oldOverlay.remove();

            if(val) {
                valEl.textContent = t('switchOn');
                div.classList.add('active-switch');

                // Füge transparenten Overlay hinzu
                const overlay = document.createElement('div');
                overlay.className = 'active-overlay';
                div.appendChild(overlay);
            } else {
                valEl.textContent = t('switchOff');
                div.classList.remove('active-switch');
            }
        }
        else if (tile.type === 'charge') {
            valEl.innerHTML = `${val}<span class="unit">%</span>`;
            div.style.setProperty('--akku-level', val + '%');
        }
        else if ((tile.type === 'status' || tile.type === 'statusregler') && tile.mapping) {
            valEl.textContent = tile.mapping[String(val)] || val;
        }

        // Hardware-Sync: Ladeanimation nur beenden, wenn Zielwert exakt erreicht.
        // Den initialen getState-Callback ignorieren (kein pending vorhanden → kein Problem,
        // aber wir markieren, dass der erste Wert verarbeitet wurde).
        if (!initialStateDone) {
            initialStateDone = true;
            // Initialer Wert: Ladeanimation NICHT beenden (kein pending aktiv)
        } else {
            const pending = pendingTileStates[tile.id];
            if (pending) {
                if ((!requireAck || ack === true) && String(val) === String(pending.targetValue)) {
                    // Zielwert erreicht: Fallback-Timer löschen
                    clearTimeout(pending.fallbackTimer);
                    const elapsed = Date.now() - pending.startTime;
                    const minDisplay = 800;
                    const removeLoading = () => {
                        container.classList.remove('is-loading');
                        delete pendingTileStates[tile.id];
                        playReadySound();
                    };
                    if (elapsed < minDisplay) {
                        setTimeout(removeLoading, minDisplay - elapsed);
                    } else {
                        removeLoading();
                    }
                }
                // Zwischenwert: Animation läuft weiter, nichts tun
            }
        }
    });

    if (tile.type === 'switch') {
        div.onclick = () => {
            const currentVal = stateMap.get(tile.id);
            sendStateAndUpdateUI(tile, !currentVal, container);
        };
    }

    if (tile.type === 'wertregler') {
        div.classList.add('interaktiv');

        if (!tile.enableHold) {
            // Ohne Haltefunktion: einfacher Klick öffnet Lightbox
            div.onclick = () => {
                openSliderLightbox(tile, container);
            };
        } else {
            // Mit Haltefunktion: Kurzer Klick = Toggle, Halten = Lightbox
            const holdTime = tile.holdTime || 1000;
            const holdColor = tile.holdColor || '#ff9800';

            let holdTimer = null;
            let holdStartTime = null;
            let isHolding = false;
            let blinkInterval = null;

            const stopHold = () => {
                if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
                if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
                div.classList.remove('hold-active', 'hold-triggered');
                div.style.removeProperty('--hold-blink-duration');
                div.style.removeProperty('--hold-progress');
                isHolding = false;
                holdStartTime = null;
            };

            const startHold = (e) => {
                // Verhindere Doppelauslösung bei Touch+Mouse
                if (e.type === 'mousedown' && e.sourceCapabilities?.firesTouchEvents) return;
                isHolding = true;
                holdStartTime = Date.now();

                // CSS-Variable für Haltefarbe setzen
                div.style.setProperty('--hold-color', holdColor);

                // Blink-Animation starten: Anfangs langsam, wird schneller
                let blinkDuration = holdTime * 0.8; // Startdauer in ms
                div.style.setProperty('--hold-blink-duration', blinkDuration + 'ms');
                div.classList.add('hold-active');

                // Blink-Geschwindigkeit kontinuierlich erhöhen
                blinkInterval = setInterval(() => {
                    if (!isHolding) return;
                    const elapsed = Date.now() - holdStartTime;
                    const progress = Math.min(elapsed / holdTime, 1);
                    // Dauer von 80% der holdTime auf 100ms reduzieren
                    const newDuration = Math.max(100, blinkDuration * (1 - progress * 0.9));
                    div.style.setProperty('--hold-blink-duration', newDuration + 'ms');
                    // Hintergrund-Füllfortschritt setzen
                    div.style.setProperty('--hold-progress', progress);
                }, 80);

                holdTimer = setTimeout(() => {
                    // Haltezeit erreicht: Blinken stoppen, Rahmen leuchtet dauerhaft
                    if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
                    div.classList.remove('hold-active');
                    div.classList.add('hold-triggered');
                    isHolding = false;
                    holdTimer = null;
                    openSliderLightbox(tile, container);
                    // Aufräumen nach kurzem Delay (Lightbox öffnet sich)
                    setTimeout(() => {
                        div.classList.remove('hold-triggered');
                        div.style.removeProperty('--hold-color');
                    }, 300);
                }, holdTime);
            };

            const endHold = (e) => {
                if (e.type === 'mouseup' && e.sourceCapabilities?.firesTouchEvents) return;
                if (!holdStartTime) return;
                const elapsed = Date.now() - holdStartTime;
                const wasHolding = holdTimer !== null || isHolding;
                stopHold();
                div.style.removeProperty('--hold-color');

                // Kurzer Klick: Toggle zwischen Min und Max
                if (elapsed < 200 && wasHolding) {
                    const currentVal = stateMap.get(tile.id);
                    const min = tile.sliderMin !== undefined ? tile.sliderMin : 0;
                    const max = tile.sliderMax !== undefined ? tile.sliderMax : 100;
                    const mid = (min + max) / 2;
                    const newVal = (currentVal !== undefined && currentVal < mid) ? max : min;
                    sendStateAndUpdateUI(tile, newVal, container);
                }
            };

            const cancelHold = () => {
                if (holdStartTime) {
                    stopHold();
                    div.style.removeProperty('--hold-color');
                }
            };

            div.addEventListener('mousedown', startHold);
            div.addEventListener('mouseup', endHold);
            div.addEventListener('mouseleave', cancelHold);
            div.addEventListener('touchstart', startHold, { passive: true });
            div.addEventListener('touchend', endHold);
            div.addEventListener('touchcancel', cancelHold);
        }
    }

    if (tile.type === 'statusregler') {
        div.classList.add('interaktiv');
        div.onclick = () => {
            openStatusLightbox(tile, container);
        };
    }

    container.appendChild(div);
    return container;
}

function openStatusLightbox(tile, containerEl) {
    const overlay = document.getElementById('lightbox-overlay');
    const titleEl = document.getElementById('lightbox-title');
    const sliderContainer = overlay.querySelector('.slider-container');
    const currentValueEl = document.getElementById('slider-current-value');
    const mappingButtonsContainer = document.getElementById('mapping-buttons');

    titleEl.textContent = tile.title;

    // Slider-Elemente ausblenden – nur Mapping-Buttons anzeigen
    if (sliderContainer) sliderContainer.style.display = 'none';
    if (currentValueEl) currentValueEl.style.display = 'none';

    const mapping = tile.mapping || {};

    // Mapping-Buttons für jeden konfigurierten Eintrag erstellen
    mappingButtonsContainer.innerHTML = '';
    Object.keys(mapping).forEach(key => {
        const button = document.createElement('button');
        button.className = 'mapping-button';
        button.textContent = mapping[key];
        button.onclick = () => {
            if (containerEl) {
                sendStateAndUpdateUI(tile, key, containerEl);
            } else {
                socket.emit('setState', tile.id, { val: key, ack: false });
            }
            overlay.style.display = 'none';
        };
        mappingButtonsContainer.appendChild(button);
    });

    overlay.style.display = 'flex';

    // Schließen bei Klick auf Overlay
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            // Slider-Elemente beim Schließen wieder einblenden (für openSliderLightbox)
            if (sliderContainer) sliderContainer.style.display = '';
            if (currentValueEl) currentValueEl.style.display = '';
            overlay.style.display = 'none';
        }
    };
}

function openSliderLightbox(tile, containerEl) {
    const overlay = document.getElementById('lightbox-overlay');
    const titleEl = document.getElementById('lightbox-title');
    
    // Altes Slider-Element klonen und ersetzen, um Event-Listener zu bereinigen
    let sliderInput = document.getElementById('slider-input');
    const newSlider = sliderInput.cloneNode(true);
    sliderInput.replaceWith(newSlider);
    sliderInput = newSlider;
    
    const minEl = document.getElementById('slider-min');
    const maxEl = document.getElementById('slider-max');
    const currentValueEl = document.getElementById('slider-current-value');
    const mappingButtonsContainer = document.getElementById('mapping-buttons');

    const min = tile.sliderMin !== undefined ? tile.sliderMin : 0;
    const max = tile.sliderMax !== undefined ? tile.sliderMax : 100;
    const currentVal = stateMap.get(tile.id) || min;
    const mapping = tile.sliderMapping || {};

    titleEl.textContent = tile.title;
    sliderInput.min = min;
    sliderInput.max = max;
    sliderInput.value = currentVal;

    // Funktion zum Abrufen des Anzeigewerts (mit oder ohne Mapping)
    const getDisplayValue = (val) => {
        const mappedValue = mapping[String(val)];
        if (mappedValue) {
            return mappedValue;
        }
        const formatted = formatNumber(val, tile.decimals, tile.thousandsSeparator);
        const unit = tile.unit || '';
        return formatted + unit;
    };

    // Formatierung für Min/Max-Werte (mit Mapping-Unterstützung)
    minEl.textContent = getDisplayValue(min);
    maxEl.textContent = getDisplayValue(max);

    // Klick-Handler für Min/Max-Direktauswahl
    minEl.onclick = () => {
        sliderInput.value = min;
        updateCurrentDisplay(min);
        if (containerEl) {
            sendStateAndUpdateUI(tile, min, containerEl);
        } else {
            socket.emit('setState', tile.id, { val: min, ack: false });
        }
    };

    maxEl.onclick = () => {
        sliderInput.value = max;
        updateCurrentDisplay(max);
        if (containerEl) {
            sendStateAndUpdateUI(tile, max, containerEl);
        } else {
            socket.emit('setState', tile.id, { val: max, ack: false });
        }
    };

    // Aktuellen Wert formatiert anzeigen
    const updateCurrentDisplay = (val) => {
        currentValueEl.textContent = getDisplayValue(val);
    };

    updateCurrentDisplay(currentVal);

    // Mapping-Buttons erstellen (für Werte zwischen Min und Max)
    mappingButtonsContainer.innerHTML = '';
    Object.keys(mapping).forEach(key => {
        const numKey = parseFloat(key);
        // Nur Werte anzeigen, die nicht Min oder Max sind
        if (numKey !== min && numKey !== max && !isNaN(numKey)) {
            const button = document.createElement('button');
            button.className = 'mapping-button';
            button.textContent = mapping[key];
            button.onclick = () => {
                sliderInput.value = numKey;
                updateCurrentDisplay(numKey);
                if (containerEl) {
                    sendStateAndUpdateUI(tile, numKey, containerEl);
                } else {
                    socket.emit('setState', tile.id, { val: numKey, ack: false });
                }
            };
            mappingButtonsContainer.appendChild(button);
        }
    });

    // Event-Listener für Slider-Änderungen
    const onInput = (e) => {
        updateCurrentDisplay(parseFloat(e.target.value));
    };

    const onRelease = (e) => {
        const newValue = parseFloat(e.target.value);
        if (containerEl) {
            sendStateAndUpdateUI(tile, newValue, containerEl);
        } else {
            socket.emit('setState', tile.id, { val: newValue, ack: false });
        }
    };

    sliderInput.addEventListener('input', onInput);
    sliderInput.addEventListener('change', onRelease);

    overlay.style.display = 'flex';

    // Schließen bei Klick auf Overlay
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            // Slider-Elemente beim Schließen wieder einblenden (für zukünftige openSliderLightbox-Aufrufe)
            const sliderContainer = overlay.querySelector('.slider-container');
            const currentValueEl = document.getElementById('slider-current-value');
            if (sliderContainer) sliderContainer.style.display = '';
            if (currentValueEl) currentValueEl.style.display = '';
            overlay.style.display = 'none';
        }
    };
}

function subscribeState(id, callback) {
    if(!id) return;
    socket.emit('getState', id, (err, state) => {
        if (state) {
            stateMap.set(id, state.val);
            callback(state.val, state.ack);
        }
    });
    socket.emit('subscribe', id);

    socket.on('stateChange', (changedId, state) => {
        if (changedId === id && state) {
            stateMap.set(id, state.val);
            callback(state.val, state.ack);
        }
    });
}

function formatNumber(val, decimals, useThousandsSeparator) {
    if(isNaN(val)) return val;
    const factor = Math.pow(10, decimals || 0);
    const rounded = Math.round(val * factor) / factor;

    if (useThousandsSeparator) {
        return rounded.toLocaleString('de-DE', {
            minimumFractionDigits: decimals || 0,
            maximumFractionDigits: decimals || 0
        });
    }

    return rounded;
}

function updateValue(elementId, val, decimals, unit) {
    const el = document.getElementById(elementId);
    if(el) el.textContent = formatNumber(val, decimals) + (unit || '');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
