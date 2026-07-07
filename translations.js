
// ══════════════════════════════════════════════════════════════════════════
// MEHRSPRACHIGKEIT - Dictionary für alle statischen UI-Texte
// ══════════════════════════════════════════════════════════════════════════
const translations = {
    en: {
        // Connection Lightbox
        connectionTitle: 'ioBroker Connection',
        connectionSubtitle: 'Web Server Adapter Instance',
        ipLabel: 'IP Address',
        ipPlaceholder: 'e.g. 192.168.1.100',
        portLabel: 'Port',
        portPlaceholder: 'e.g. 8082',
        languageLabel: 'Language',
        testButton: 'Test',
        testingButton: 'Testing...',
        saveButton: 'Save',
        retryButton: 'Reconnect',
        connectionSuccess: 'Connection established successfully!',
        connectionError: 'Connection failed! Check IP and port.',
        connectionTimeout: 'Timeout! Check IP and port.',
        fillIpPort: 'Please enter IP and port!',
        connectionLost: 'Connection to ioBroker lost. New connection data required?',
        notReachable: 'ioBroker currently not reachable. New connection data required?',

        // Slider Lightbox
        sliderTitle: 'Value Slider',

        // Object Browser
        objBrowserTitle: 'ioBroker Data Points',
        objBrowserClose: 'Close',
        objBrowserLoading: 'Loading objects...',
        objBrowserError: 'Error loading.',
        objBrowserLoadingFrom: 'Loading objects from ioBroker...',

        // Dashboard Selector
        dashboardsTitle: 'Dashboards',
        noDashboards: 'No dashboards available. Go to',
        config: 'Config',

        // Dashboard
        noDashboardFound: 'Dashboard not found.',
        noSightFound: 'View not found.',
        noSights: 'This dashboard has no views yet.',

        // Switch States
        switchOn: 'On',
            switchOff: 'Off',

                // Config UI
                configTitle: 'Configuration Overview',
                closeButton: 'Close',
                dashboard: 'Dashboard',
                background: 'Background',
                footer: 'Footer',
                footerLine: 'Footer Line',
                tileBorder: 'Tile Border (px)',
                fontSize: 'Font Size (rem)',
                configIcon: 'Config',
                deleteDashboardBtn: 'Dashboard',
                sight: 'View',
                deleteSightBtn: 'View',
                addTileBtn: 'Tile',
                addSectionBtn: 'Section',
                addSightBtn: 'View',
                addDashboardBtn: 'Dashboard',
                leaveConfig: 'Leave Configuration',
                settings: 'Settings',

                // Tile Types
                tileTypeValue: 'Value',
                tileTypeCharge: 'Charge',
                tileTypeSwitch: 'Switch',
                tileTypeStatus: 'Status',
                tileTypeSlider: 'Value Slider',
                tileTypeStatusSlider: 'Status Slider',

                // Edit Section
                editSectionTitle: 'Edit Section',
                sectionTitleLabel: 'Title',
                sectionTitleColor: 'Title Color',
                sectionLineColor: 'Line Color',
                cancelButton: 'Cancel',
                saveButtonGeneric: 'Save',

                // Edit Tile
                editTileTitle: 'Edit Tile',
                titleLabel: 'Title',
                datapointLabel: 'ioBroker Data Point',
                treeButton: 'Tree',
                tileTypeLabel: 'Tile Type',
                subvaluesTitle: 'Subvalues (optional)',
                addSubvalueBtn: 'Add Subvalue',
                individualDesignTitle: 'Individual Design',
                bgColorLabel: 'Background Color',
                borderColorLabel: 'Border Color',
                borderStyleLabel: 'Border Style',
                borderWidthLabel: 'Border Width (px)',
                titleColorLabel: 'Title Color',
                valueColorLabel: 'Value Color',
                fontSizeLabel: 'Font Size (rem)',
                standardPlaceholder: 'Standard',

                // Type Specific Settings
                typeSpecificTitle: 'Type Specific Settings',
                decimalsLabel: 'Decimal Places',
                unitLabel: 'Unit',
                unitPlaceholder: 'e.g. °C, kWh, %',
                thousandsSeparator: 'Thousands Separator',
                sliderMinLabel: 'Slider Minimum',
                sliderMaxLabel: 'Slider Maximum',
                valueMappingLabel: 'Value Mapping',
                addMappingBtn: 'Add Mapping',
                activeColorLabel: 'Color in Active State',
                transparencyLabel: 'Transparency (%)',
                statusMappingLabel: 'Status Mapping',
                currentValueLabel: 'Current Value',
                valueSettingsLabel: 'Value Settings',
                sliderRangeLabel: 'Slider Range',
                holdFunctionLabel: 'Hold Function',
                enableHoldLabel: 'Enable Hold Function',
                holdTimeLabel: 'Hold Time',
                holdColorLabel: 'Hold Color',

                // Subvalues
                subvalueTitle: 'Subvalue',
                subvalueDatapoint: 'ioBroker Data Point',
                subvalueType: 'Type',
                subvalueEmoji: 'Emoji',
                subvalueDecimals: 'Decimal Places',
                subvalueUnit: 'Unit',
                subvalueStatusMapping: 'Status Mapping',
                flipTimeLabel: 'Flip Time (ms)',

                // Mapping
                mappingValue: 'Value',
                mappingDisplay: 'Display',

                // Prompts
                promptNewDashboard: 'Name of the new dashboard:',
                promptNewSight: 'Name of the new view:',
                promptNewTile: 'Title of the new tile:',
                promptNewSection: 'Title of the new section:',
                confirmDeleteDashboard: 'Really delete this dashboard?',
                confirmDeleteSight: 'Really delete this view?',
                confirmDeleteTile: 'Really delete this tile?',

                // Errors
                saveError: 'Error saving to ioBroker!',
                saveErrorGeneric: 'Error saving',

                // Misc
                noTitle: 'No Title',
                section: 'Section',
                dragToSort: 'Drag to sort'
    },
    de: {
        // Connection Lightbox
        connectionTitle: 'ioBroker Verbindung',
        connectionSubtitle: 'Instanz des WEB-Server-Adapters',
        ipLabel: 'IP-Adresse',
        ipPlaceholder: 'z.B. 192.168.1.100',
        portLabel: 'Port',
        portPlaceholder: 'z.B. 8082',
        languageLabel: 'Sprache',
        testButton: 'Prüfen',
        testingButton: 'Prüfe...',
        saveButton: 'Speichern',
        retryButton: 'Erneut verbinden',
        connectionSuccess: 'Verbindung erfolgreich aufgebaut!',
        connectionError: 'Verbindung fehlgeschlagen! Prüfe IP und Port.',
        connectionTimeout: 'Zeitüberschreitung! Prüfe IP und Port.',
        fillIpPort: 'Bitte IP und Port eingeben!',
        connectionLost: 'Verbindung zu ioBroker verloren. Neue Verbindungsdaten erforderlich?',
        notReachable: 'ioBroker aktuell nicht erreichbar. Neue Verbindungsdaten erforderlich?',

        // Slider Lightbox
        sliderTitle: 'Wertregler',

        // Object Browser
        objBrowserTitle: 'ioBroker Datenpunkte',
        objBrowserClose: 'Schließen',
        objBrowserLoading: 'Lade Objekte...',
        objBrowserError: 'Fehler beim Laden.',
        objBrowserLoadingFrom: 'Lade Objekte vom ioBroker...',

        // Dashboard Selector
        dashboardsTitle: 'Dashboards',
        noDashboards: 'Keine Dashboards vorhanden. Gehe in die',
        config: 'Config',

        // Dashboard
        noDashboardFound: 'Dashboard nicht gefunden.',
        noSightFound: 'Sicht nicht gefunden.',
        noSights: 'Dieses Dashboard hat noch keine Sichten.',

        // Switch States
        switchOn: 'An',
            switchOff: 'Aus',

                // Config UI
                configTitle: 'Konfiguration Übersicht',
                closeButton: 'Schließen',
                dashboard: 'Dashboard',
                background: 'Hintergrund',
                footer: 'Footer',
                footerLine: 'Footer-Linie',
                tileBorder: 'Kachel-Rahmen (px)',
                fontSize: 'Schriftgröße (rem)',
                configIcon: 'Konfig',
                deleteDashboardBtn: 'Dashboard',
                sight: 'Sicht',
                deleteSightBtn: 'Sicht',
                addTileBtn: 'Kachel',
                addSectionBtn: 'Abschnitt',
                addSightBtn: 'Sicht',
                addDashboardBtn: 'Dashboard',
                leaveConfig: 'Konfiguration verlassen',
                settings: 'Einstellungen',

                // Tile Types
                tileTypeValue: 'Wert',
                tileTypeCharge: 'Laden',
                tileTypeSwitch: 'Schalter',
                tileTypeStatus: 'Status',
                tileTypeSlider: 'Wertregler',
                tileTypeStatusSlider: 'Statusregler',

                // Edit Section
                editSectionTitle: 'Abschnitt bearbeiten',
                sectionTitleLabel: 'Titel',
                sectionTitleColor: 'Titelfarbe',
                sectionLineColor: 'Linienfarbe',
                cancelButton: 'Abbrechen',
                saveButtonGeneric: 'Speichern',

                // Edit Tile
                editTileTitle: 'Kachel bearbeiten',
                titleLabel: 'Titel',
                datapointLabel: 'ioBroker Datenpunkt',
                treeButton: 'Baum',
                tileTypeLabel: 'Kacheltyp',
                subvaluesTitle: 'Subwerte (optional)',
                addSubvalueBtn: 'Subwert hinzufügen',
                individualDesignTitle: 'Individuelles Design',
                bgColorLabel: 'Hintergrundfarbe',
                borderColorLabel: 'Rahmenfarbe',
                borderStyleLabel: 'Rahmenstil',
                borderWidthLabel: 'Rahmenbreite (px)',
                titleColorLabel: 'Titelfarbe',
                valueColorLabel: 'Wertfarbe',
                fontSizeLabel: 'Schriftgröße (rem)',
                standardPlaceholder: 'Standard',

                // Type Specific Settings
                typeSpecificTitle: 'Typspezifische Einstellungen',
                decimalsLabel: 'Dezimalstellen',
                unitLabel: 'Einheit',
                unitPlaceholder: 'z.B. °C, kWh, %',
                thousandsSeparator: '1000er-Trennzeichen',
                sliderMinLabel: 'Regler-Minimum',
                sliderMaxLabel: 'Regler-Maximum',
                valueMappingLabel: 'Wert-Mapping',
                addMappingBtn: 'Mapping hinzufügen',
                activeColorLabel: 'Farbe im Aktiv-Zustand',
                transparencyLabel: 'Transparenz (%)',
                statusMappingLabel: 'Status-Mapping',
                currentValueLabel: 'Aktueller Wert',
                valueSettingsLabel: 'Werteinstellungen',
                sliderRangeLabel: 'Reglerbereich',
                holdFunctionLabel: 'Haltefunktion',
                enableHoldLabel: 'Haltefunktion aktivieren',
                holdTimeLabel: 'Haltezeit',
                holdColorLabel: 'Haltefarbe',

                // Subvalues
                subvalueTitle: 'Subwert',
                subvalueDatapoint: 'ioBroker Datenpunkt',
                subvalueType: 'Typ',
                subvalueEmoji: 'Emoji',
                subvalueDecimals: 'Dezimalstellen',
                subvalueUnit: 'Einheit',
                subvalueStatusMapping: 'Status-Mapping',
                flipTimeLabel: 'Flipzeit (ms)',

                // Mapping
                mappingValue: 'Wert',
                mappingDisplay: 'Anzeige',

                // Prompts
                promptNewDashboard: 'Name des neuen Dashboards:',
                promptNewSight: 'Name der neuen Sicht:',
                promptNewTile: 'Titel der neuen Kachel:',
                promptNewSection: 'Titel des neuen Abschnitts:',
                confirmDeleteDashboard: 'Dieses Dashboard wirklich löschen?',
                confirmDeleteSight: 'Diese Sicht wirklich löschen?',
                confirmDeleteTile: 'Diese Kachel wirklich löschen?',

                // Errors
                saveError: 'Fehler beim Speichern in ioBroker!',
                saveErrorGeneric: 'Fehler beim Speichern',

                // Misc
                noTitle: 'Ohne Titel',
                section: 'Abschnitt',
                dragToSort: 'Ziehen zum Sortieren'
    }
};
