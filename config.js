// ── ioBroker Konfiguration & Verbindung ──────────────────────────────────────

let socket = null;
const configId = '0_userdata.0.dashboard.config';
let ioBrokerConfig = null;
let loaderTimer = null;
let lightboxTimer = null;
const delayLoadingBar = 500;  // Wartezeit in Millisekunden, bis der Ladebalken erscheint
const delayLightbox = 3000;   // Wartezeit in Millisekunden, bis der Verbindungsdialog (Lightbox) auftaucht

function handleConnectionError(errorMessage) {
    // Wenn schon Timer laufen, machen wir nichts weiter (verhindert Event-Spam)
    if (loaderTimer || lightboxTimer) return; 
    
    loaderTimer = setTimeout(() => {
        const loader = document.getElementById('connection-loader');
        if (loader) {
            loader.classList.remove('connection-loader-hidden');
            loader.classList.add('connection-loader-visible');
        }
    }, delayLoadingBar);

    lightboxTimer = setTimeout(() => {
        const loader = document.getElementById('connection-loader');
        if (loader) {
            loader.classList.remove('connection-loader-visible');
            loader.classList.add('connection-loader-hidden');
        }
        showConfigLightbox(errorMessage, true);
    }, delayLightbox);
}

function clearConnectionTimers() {
    clearTimeout(loaderTimer);
    clearTimeout(lightboxTimer);
    loaderTimer = null;
    lightboxTimer = null;
    
    const loader = document.getElementById('connection-loader');
    if (loader) {
        loader.classList.remove('connection-loader-visible');
        loader.classList.add('connection-loader-hidden');
    }
}

// Hilfsfunktion: Sprache aus ioBroker synchronisieren (nur wenn nicht manuell gesetzt)
function syncLanguageFromIoBroker(socketInstance, callback) {
    const langManuallySet = localStorage.getItem('langManuallySet');
    if (!langManuallySet) {
        socketInstance.emit('getObject', 'system.config', (err, obj) => {
            if (!err && obj && obj.common && obj.common.language) {
                const sysLang = obj.common.language;
                if (sysLang === 'de' || sysLang === 'en') {
                    setLanguage(sysLang);
                    const langSelect = document.getElementById('iobroker-language');
                    if (langSelect) langSelect.value = sysLang;
                }
            }
            if (callback) callback();
        });
    } else {
        if (callback) callback();
    }
}

// Prüfe beim Laden, ob eine Konfiguration vorhanden ist
function checkIoBrokerConfig() {
    // Lade gespeicherte Sprache oder setze Englisch als Standard
    const savedLang = localStorage.getItem('uiLanguage');
    if (savedLang && (savedLang === 'en' || savedLang === 'de')) {
        currentLanguage = savedLang;
    } else {
        currentLanguage = 'en'; // Standard: Englisch
        localStorage.setItem('uiLanguage', 'en');
    }

    const savedConfig = localStorage.getItem('ioBrokerConfig');
    if (savedConfig) {
        try {
            ioBrokerConfig = JSON.parse(savedConfig);
            initializeSocketConnection();
        } catch(e) {
            console.error('Fehler beim Laden der Konfiguration:', e);
            showConfigLightbox();
        }
    } else {
        showConfigLightbox();
    }
}

function showConfigLightbox(errorMessage = null, showRetry = false) {
    const lightbox = document.getElementById('config-lightbox');
    const ipInput = document.getElementById('iobroker-ip');
    const portInput = document.getElementById('iobroker-port');
    const langSelect = document.getElementById('iobroker-language');
    const retryBtn = document.getElementById('config-retry-btn');

    // Vorbefüllen wenn Konfiguration vorhanden
    if (ioBrokerConfig) {
        ipInput.value = ioBrokerConfig.ip || '';
        portInput.value = ioBrokerConfig.port || '';
    }

    // Sprachauswahl auf aktuelle Sprache setzen
    if (langSelect) {
        langSelect.value = currentLanguage;
    }

    // Fehlermeldung anzeigen wenn vorhanden
    if (errorMessage) {
        showStatusMessage(errorMessage, 'error');
    } else {
        hideStatusMessage();
    }

    // Retry-Button anzeigen/verstecken
    if (retryBtn) {
        retryBtn.style.display = showRetry ? '' : 'none';
    }

    lightbox.style.display = 'flex';

    // UI-Sprache aktualisieren
    updateUILanguage();
}

function hideConfigLightbox() {
    document.getElementById('config-lightbox').style.display = 'none';
}

function showStatusMessage(message, type) {
    const statusEl = document.getElementById('config-status-message');
    statusEl.textContent = message;
    statusEl.className = type;
    statusEl.style.display = 'block';
}

function hideStatusMessage() {
    const statusEl = document.getElementById('config-status-message');
    statusEl.style.display = 'none';
}

function testIoBrokerConnection() {
    const ip = document.getElementById('iobroker-ip').value.trim();
    const port = document.getElementById('iobroker-port').value.trim();

    if (!ip || !port) {
        showStatusMessage(t('fillIpPort'), 'error');
        return;
    }

    hideStatusMessage();
    const testBtn = document.getElementById('config-test-btn');
    const saveBtn = document.getElementById('config-save-btn');
    testBtn.disabled = true;
    testBtn.textContent = t('testingButton');

    // Einfacher Fetch-Test zur Prüfung der Erreichbarkeit
    const testUrl = `http://${ip}:${port}/socket.io/socket.io.js`;

    fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
    })
    .then(() => {
        // Script laden wenn erreichbar
        loadSocketScript(ip, port, testBtn, saveBtn);
    })
    .catch(() => {
        // Auch bei CORS-Fehler versuchen wir das Script zu laden
        // da no-cors mode immer einen Fehler wirft
        loadSocketScript(ip, port, testBtn, saveBtn);
    });
}

function loadSocketScript(ip, port, testBtn, saveBtn) {
    const socketUrl = `http://${ip}:${port}/socket.io/socket.io.js`;
    const scriptEl = document.getElementById('socket-io-script');

    // Entferne altes Script falls vorhanden
    if (scriptEl.src) {
        scriptEl.remove();
        const newScript = document.createElement('script');
        newScript.id = 'socket-io-script';
        document.head.appendChild(newScript);
    }

    const currentScript = document.getElementById('socket-io-script');
    let scriptLoaded = false;
    let connectionTested = false;

    currentScript.onerror = () => {
        if (!connectionTested) {
            connectionTested = true;
            showStatusMessage(t('connectionError'), 'error');
            testBtn.disabled = false;
            testBtn.textContent = t('testButton');
            saveBtn.disabled = true;
        }
    };

    currentScript.onload = () => {
        scriptLoaded = true;

        // Prüfe ob io verfügbar ist
        if (typeof io === 'undefined') {
            showStatusMessage(t('connectionError'), 'error');
            testBtn.disabled = false;
            testBtn.textContent = t('testButton');
            saveBtn.disabled = true;
            return;
        }

        // Versuche Verbindung aufzubauen
        let testSocket = null;
        try {
            testSocket = io(`http://${ip}:${port}`, {
                timeout: 5000,
                reconnection: false,
                transports: ['polling', 'websocket']
            });

            testSocket.on('connect', () => {
                if (!connectionTested) {
                    connectionTested = true;

                    syncLanguageFromIoBroker(testSocket, () => {
                        // Erfolgsmeldung anzeigen (jetzt in der richtigen Sprache)
                        showStatusMessage(t('connectionSuccess'), 'success');
                        testBtn.disabled = false;
                        testBtn.textContent = t('testButton');
                        saveBtn.disabled = false;

                        setTimeout(() => {
                            if (testSocket) testSocket.disconnect();
                        }, 100);
                    });
                }
            });

            testSocket.on('connect_error', (err) => {
                if (!connectionTested) {
                    connectionTested = true;
                    console.error('Verbindungsfehler:', err);
                    showStatusMessage(t('connectionError'), 'error');
                    testBtn.disabled = false;
                    testBtn.textContent = t('testButton');
                    saveBtn.disabled = true;
                    if (testSocket) testSocket.disconnect();
                }
            });

            // Timeout nach 6 Sekunden
            setTimeout(() => {
                if (!connectionTested) {
                    connectionTested = true;
                    showStatusMessage(t('connectionTimeout'), 'error');
                    testBtn.disabled = false;
                    testBtn.textContent = t('testButton');
                    saveBtn.disabled = true;
                    if (testSocket) testSocket.disconnect();
                }
            }, 6000);
        } catch (err) {
            console.error('Fehler beim Verbindungsaufbau:', err);
            showStatusMessage(t('connectionError'), 'error');
            testBtn.disabled = false;
            testBtn.textContent = t('testButton');
            saveBtn.disabled = true;
        }
    };

    currentScript.src = socketUrl;
}

function saveIoBrokerConfig() {
    const ip = document.getElementById('iobroker-ip').value.trim();
    const port = document.getElementById('iobroker-port').value.trim();

    ioBrokerConfig = { ip, port };
    localStorage.setItem('ioBrokerConfig', JSON.stringify(ioBrokerConfig));

    hideConfigLightbox();
    initializeSocketConnection();
}

// Reconnect mit gespeicherten Daten (IP/Port aus den Eingabefeldern oder ioBrokerConfig)
function retryIoBrokerConnection() {
    const ip = document.getElementById('iobroker-ip').value.trim() || (ioBrokerConfig && ioBrokerConfig.ip);
    const port = document.getElementById('iobroker-port').value.trim() || (ioBrokerConfig && ioBrokerConfig.port);

    if (!ip || !port) {
        showStatusMessage(t('fillIpPort'), 'error');
        return;
    }

    // Sicherstellen, dass ioBrokerConfig aktuell ist
    ioBrokerConfig = { ip, port };
    localStorage.setItem('ioBrokerConfig', JSON.stringify(ioBrokerConfig));

    hideConfigLightbox();
    initializeSocketConnection();
}

function initializeSocketConnection() {
    if (!ioBrokerConfig) return;

    const socketUrl = `http://${ioBrokerConfig.ip}:${ioBrokerConfig.port}`;

    // Lade Socket.io Script falls noch nicht geladen
    const scriptEl = document.getElementById('socket-io-script');
    if (!scriptEl.src) {
        scriptEl.src = `${socketUrl}/socket.io/socket.io.js`;
        scriptEl.onload = () => {
            connectSocket(socketUrl);
        };
    } else {
        connectSocket(socketUrl);
    }
}

function connectSocket(socketUrl) {
    socket = io(socketUrl);

    socket.on('connect', () => {
        clearConnectionTimers(); // Neu: Timer löschen und Ladebalken ausblenden
        hideConfigLightbox();
        
        syncLanguageFromIoBroker(socket);

        socket.emit('getState', configId, (err, state) => {
            if (state && state.val) {
                try {
                    appConfig = JSON.parse(state.val);
                } catch(e) { console.error("JSON Parse Error", e); }
            }
            initApp();
        });
    });

    socket.on('connect_error', (err) => {
        console.error('Socket-Verbindung fehlgeschlagen:', err);
        handleConnectionError(t('notReachable')); // Angepasst
    });

    socket.on('disconnect', (reason) => {
        console.warn('Socket getrennt:', reason);
        if (reason === 'io server disconnect' || reason === 'transport close') {
            handleConnectionError(t('connectionLost')); // Angepasst
        }
    });
}
