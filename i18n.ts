export type Locale = 'en' | 'ru' | 'de' | 'es' | 'fr';

export const LOCALE_NAMES: Record<Locale, string> = {
    en: 'English',
    ru: 'Русский',
    de: 'Deutsch',
    es: 'Español',
    fr: 'Français',
};

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ru', 'de', 'es', 'fr'];

export interface Translations {
    // Ribbon & commands
    ribbonTooltip: string;
    cmdOpenRandom: string;
    cmdClearHistory: string;
    cmdOpenMultiple: string;
    cmdPickPreset: string;
    cmdToggleSidebar: string;
    cmdPresetPrefix: string;

    // Notices
    noNotesFound: string;
    noPresets: string;
    opened: (note: string) => string;
    openedN: (n: number, names: string) => string;
    presetOpened: (name: string, note: string) => string;
    presetSaved: (name: string) => string;
    presetLoaded: (name: string) => string;
    presetDeleted: (name: string) => string;
    historyClearedNotice: string;

    // Settings tab
    settingsTitle: string;
    langLabel: string;
    langDesc: string;

    // Filters section
    includedFoldersName: string;
    includedFoldersDesc: string;
    includedTagsName: string;
    includedTagsDesc: string;
    includedPropertiesName: string;
    includedPropertiesDesc: string;
    excludedFoldersName: string;
    excludedFoldersDesc: string;
    matchConditionName: string;
    matchConditionDesc: string;
    matchOr: string;
    matchAnd: string;

    // Presets section
    presetsHeader: string;
    savePresetName: string;
    savePresetDesc: string;
    savePresetBtn: string;
    loadBtn: string;
    deleteBtn: string;
    presetMatchAnd: string;
    presetMatchOr: string;

    // Appearance section
    behaviorHeader: string;
    openInNewTabName: string;
    openInNewTabDesc: string;
    historySizeName: string;
    historySizeDesc: string;
    batchSizeName: string;
    batchSizeDesc: string;
    clearHistoryName: string;
    clearHistoryDesc: (n: number) => string;
    clearHistoryBtn: string;

    // Prompt modal
    presetNamePrompt: string;
    cancel: string;
    save: string;

    // Sidebar widget
    widgetTitle: string;
    widgetEmpty: string;
    widgetNext: string;
    widgetOpen: string;
    widgetPreviewError: string;
}

const en: Translations = {
    ribbonTooltip: 'Open random note (with filters)',
    cmdOpenRandom: 'Open random note...',
    cmdClearHistory: 'Clear random note history',
    cmdOpenMultiple: 'Open N random notes',
    cmdPickPreset: 'Pick a preset...',
    cmdToggleSidebar: 'Show random note widget',
    cmdPresetPrefix: 'Random note:',

    noNotesFound: 'No notes found matching the current filters.',
    noPresets: 'No presets saved. Create a preset in plugin settings.',
    opened: (note: string) => `Opened: ${note}`,
    openedN: (n, names) => `Opened ${n} notes: ${names}`,
    presetOpened: (name, note) => `Preset "${name}" → ${note}`,
    presetSaved: (name) => `Preset "${name}" saved.`,
    presetLoaded: (name) => `Preset "${name}" loaded into current filters.`,
    presetDeleted: (name) => `Preset "${name}" deleted.`,
    historyClearedNotice: 'History cleared.',

    settingsTitle: 'Improved Random Note Settings',
    langLabel: 'Language',
    langDesc: 'Interface language of the plugin.',

    includedFoldersName: 'Included Folders',
    includedFoldersDesc: 'Folders to search in (comma-separated).',
    includedTagsName: 'Included Tags',
    includedTagsDesc: 'Tags to filter by (with #, comma-separated).',
    includedPropertiesName: 'Included Properties',
    includedPropertiesDesc: 'YAML properties to filter by (key or key:value).',
    excludedFoldersName: 'Excluded Folders',
    excludedFoldersDesc: 'Folders to skip (comma-separated).',
    matchConditionName: 'Match Condition',
    matchConditionDesc: 'How to combine filters.',
    matchOr: 'OR (any condition)',
    matchAnd: 'AND (all conditions)',

    presetsHeader: 'Presets',
    savePresetName: 'Save Current Filters as Preset',
    savePresetDesc: 'Save the current filter values as a named preset.',
    savePresetBtn: 'Save',
    loadBtn: 'Load',
    deleteBtn: 'Delete',
    presetMatchAnd: '(AND)',
    presetMatchOr: '(OR)',

    behaviorHeader: 'Appearance & Behavior',
    openInNewTabName: 'Open in New Tab',
    openInNewTabDesc: 'Always open the random note in a new tab.',
    historySizeName: 'History Size',
    historySizeDesc: 'How many recent notes to remember to avoid duplicates (0 = disabled).',
    batchSizeName: 'Batch Size (N)',
    batchSizeDesc: 'Number of notes opened by the "Open N random notes" command.',
    clearHistoryName: 'Clear History',
    clearHistoryDesc: (n) => `Notes currently in history: ${n}.`,
    clearHistoryBtn: 'Clear',

    presetNamePrompt: 'Preset name',
    cancel: 'Cancel',
    save: 'Save',

    widgetTitle: 'Random Note',
    widgetEmpty: 'No notes match the current filters.',
    widgetNext: '🔄 Next',
    widgetOpen: '📄 Open',
    widgetPreviewError: 'Could not load preview.',
};

const ru: Translations = {
    ribbonTooltip: 'Открыть случайную заметку (с фильтрами)',
    cmdOpenRandom: 'Открыть случайную заметку...',
    cmdClearHistory: 'Очистить историю случайных заметок',
    cmdOpenMultiple: 'Открыть N случайных заметок',
    cmdPickPreset: 'Выбрать пресет...',
    cmdToggleSidebar: 'Показать виджет случайной заметки',
    cmdPresetPrefix: 'Случайная заметка:',

    noNotesFound: 'Ничего не найдено с такими фильтрами.',
    noPresets: 'Нет сохранённых пресетов. Создайте пресет в настройках плагина.',
    opened: (note) => `Открыто: ${note}`,
    openedN: (n, names) => `Открыто ${n} заметок: ${names}`,
    presetOpened: (name, note) => `Пресет «${name}» → ${note}`,
    presetSaved: (name) => `Пресет «${name}» сохранён.`,
    presetLoaded: (name) => `Пресет «${name}» загружен в текущие фильтры.`,
    presetDeleted: (name) => `Пресет «${name}» удалён.`,
    historyClearedNotice: 'История очищена.',

    settingsTitle: 'Improved Random Note — Настройки',
    langLabel: 'Язык',
    langDesc: 'Язык интерфейса плагина.',

    includedFoldersName: 'Включённые папки',
    includedFoldersDesc: 'Папки для поиска (через запятую).',
    includedTagsName: 'Включённые теги',
    includedTagsDesc: 'Теги для фильтрации (с #, через запятую).',
    includedPropertiesName: 'Включённые свойства',
    includedPropertiesDesc: 'YAML-свойства для фильтрации (ключ или ключ:значение).',
    excludedFoldersName: 'Исключённые папки',
    excludedFoldersDesc: 'Папки, которые нужно исключить (через запятую).',
    matchConditionName: 'Условие совпадения',
    matchConditionDesc: 'Как комбинировать фильтры.',
    matchOr: 'ИЛИ (любое условие)',
    matchAnd: 'И (все условия)',

    presetsHeader: 'Пресеты',
    savePresetName: 'Сохранить фильтры как пресет',
    savePresetDesc: 'Сохранить текущие фильтры как именованный пресет.',
    savePresetBtn: 'Сохранить',
    loadBtn: 'Загрузить',
    deleteBtn: 'Удалить',
    presetMatchAnd: '(И)',
    presetMatchOr: '(ИЛИ)',

    behaviorHeader: 'Внешний вид и поведение',
    openInNewTabName: 'Открывать в новой вкладке',
    openInNewTabDesc: 'Всегда открывать случайную заметку в новой вкладке.',
    historySizeName: 'Размер истории',
    historySizeDesc: 'Сколько последних заметок запоминать (0 — отключить).',
    batchSizeName: 'Количество заметок (N)',
    batchSizeDesc: 'Сколько заметок открывает команда «Открыть N случайных заметок».',
    clearHistoryName: 'Очистить историю',
    clearHistoryDesc: (n) => `Сейчас в истории: ${n} заметок.`,
    clearHistoryBtn: 'Очистить',

    presetNamePrompt: 'Название пресета',
    cancel: 'Отмена',
    save: 'Сохранить',

    widgetTitle: 'Случайная заметка',
    widgetEmpty: 'Не найдено заметок с текущими фильтрами.',
    widgetNext: '🔄 Следующая',
    widgetOpen: '📄 Открыть',
    widgetPreviewError: 'Не удалось загрузить превью.',
};

const de: Translations = {
    ribbonTooltip: 'Zufällige Notiz öffnen (mit Filtern)',
    cmdOpenRandom: 'Zufällige Notiz öffnen...',
    cmdClearHistory: 'Verlauf löschen',
    cmdOpenMultiple: 'N zufällige Notizen öffnen',
    cmdPickPreset: 'Preset auswählen...',
    cmdToggleSidebar: 'Zufällige-Notiz-Widget anzeigen',
    cmdPresetPrefix: 'Zufällige Notiz:',

    noNotesFound: 'Keine Notizen mit den aktuellen Filtern gefunden.',
    noPresets: 'Keine Presets gespeichert. Erstellen Sie ein Preset in den Plugin-Einstellungen.',
    opened: (note: string) => `Geöffnet: ${note}`,
    openedN: (n, names) => `${n} Notizen geöffnet: ${names}`,
    presetOpened: (name, note) => `Preset „${name}" → ${note}`,
    presetSaved: (name) => `Preset „${name}" gespeichert.`,
    presetLoaded: (name) => `Preset „${name}" in aktuelle Filter geladen.`,
    presetDeleted: (name) => `Preset „${name}" gelöscht.`,
    historyClearedNotice: 'Verlauf geleert.',

    settingsTitle: 'Improved Random Note — Einstellungen',
    langLabel: 'Sprache',
    langDesc: 'Sprache der Plugin-Oberfläche.',

    includedFoldersName: 'Enthaltene Ordner',
    includedFoldersDesc: 'Ordner für die Suche (kommagetrennt).',
    includedTagsName: 'Enthaltene Tags',
    includedTagsDesc: 'Tags zum Filtern (mit #, kommagetrennt).',
    includedPropertiesName: 'Enthaltene Eigenschaften',
    includedPropertiesDesc: 'YAML-Eigenschaften zum Filtern (Schlüssel oder Schlüssel:Wert).',
    excludedFoldersName: 'Ausgeschlossene Ordner',
    excludedFoldersDesc: 'Ordner, die übersprungen werden sollen (kommagetrennt).',
    matchConditionName: 'Übereinstimmungsbedingung',
    matchConditionDesc: 'Wie Filter kombiniert werden.',
    matchOr: 'ODER (irgendeine Bedingung)',
    matchAnd: 'UND (alle Bedingungen)',

    presetsHeader: 'Presets',
    savePresetName: 'Aktuelle Filter als Preset speichern',
    savePresetDesc: 'Aktuelle Filterwerte als benanntes Preset speichern.',
    savePresetBtn: 'Speichern',
    loadBtn: 'Laden',
    deleteBtn: 'Löschen',
    presetMatchAnd: '(UND)',
    presetMatchOr: '(ODER)',

    behaviorHeader: 'Erscheinungsbild & Verhalten',
    openInNewTabName: 'In neuem Tab öffnen',
    openInNewTabDesc: 'Zufällige Notiz immer in einem neuen Tab öffnen.',
    historySizeName: 'Verlaufsgröße',
    historySizeDesc: 'Wie viele zuletzt geöffnete Notizen gespeichert werden (0 = deaktiviert).',
    batchSizeName: 'Stapelgröße (N)',
    batchSizeDesc: 'Anzahl der Notizen, die der Befehl „N zufällige Notizen öffnen" öffnet.',
    clearHistoryName: 'Verlauf löschen',
    clearHistoryDesc: (n) => `Notizen im Verlauf: ${n}.`,
    clearHistoryBtn: 'Löschen',

    presetNamePrompt: 'Preset-Name',
    cancel: 'Abbrechen',
    save: 'Speichern',

    widgetTitle: 'Zufällige Notiz',
    widgetEmpty: 'Keine Notizen mit den aktuellen Filtern.',
    widgetNext: '🔄 Weiter',
    widgetOpen: '📄 Öffnen',
    widgetPreviewError: 'Vorschau konnte nicht geladen werden.',
};

const es: Translations = {
    ribbonTooltip: 'Abrir nota aleatoria (con filtros)',
    cmdOpenRandom: 'Abrir nota aleatoria...',
    cmdClearHistory: 'Limpiar historial de notas aleatorias',
    cmdOpenMultiple: 'Abrir N notas aleatorias',
    cmdPickPreset: 'Seleccionar un perfil...',
    cmdToggleSidebar: 'Mostrar widget de nota aleatoria',
    cmdPresetPrefix: 'Nota aleatoria:',

    noNotesFound: 'No se encontraron notas con los filtros actuales.',
    noPresets: 'No hay perfiles guardados. Cree un perfil en los ajustes del plugin.',
    opened: (note: string) => `Abierto: ${note}`,
    openedN: (n, names) => `${n} notas abiertas: ${names}`,
    presetOpened: (name, note) => `Perfil "${name}" → ${note}`,
    presetSaved: (name) => `Perfil "${name}" guardado.`,
    presetLoaded: (name) => `Perfil "${name}" cargado en los filtros actuales.`,
    presetDeleted: (name) => `Perfil "${name}" eliminado.`,
    historyClearedNotice: 'Historial borrado.',

    settingsTitle: 'Improved Random Note — Configuración',
    langLabel: 'Idioma',
    langDesc: 'Idioma de la interfaz del plugin.',

    includedFoldersName: 'Carpetas incluidas',
    includedFoldersDesc: 'Carpetas en las que buscar (separadas por comas).',
    includedTagsName: 'Etiquetas incluidas',
    includedTagsDesc: 'Etiquetas por las que filtrar (con #, separadas por comas).',
    includedPropertiesName: 'Propiedades incluidas',
    includedPropertiesDesc: 'Propiedades YAML para filtrar (clave o clave:valor).',
    excludedFoldersName: 'Carpetas excluidas',
    excludedFoldersDesc: 'Carpetas a omitir (separadas por comas).',
    matchConditionName: 'Condición de coincidencia',
    matchConditionDesc: 'Cómo combinar los filtros.',
    matchOr: 'O (cualquier condición)',
    matchAnd: 'Y (todas las condiciones)',

    presetsHeader: 'Perfiles',
    savePresetName: 'Guardar filtros como perfil',
    savePresetDesc: 'Guarda los valores de filtro actuales como un perfil con nombre.',
    savePresetBtn: 'Guardar',
    loadBtn: 'Cargar',
    deleteBtn: 'Eliminar',
    presetMatchAnd: '(Y)',
    presetMatchOr: '(O)',

    behaviorHeader: 'Apariencia y Comportamiento',
    openInNewTabName: 'Abrir en nueva pestaña',
    openInNewTabDesc: 'Abrir siempre la nota aleatoria en una nueva pestaña.',
    historySizeName: 'Tamaño del historial',
    historySizeDesc: 'Cuántas notas recientes recordar para evitar duplicados (0 = desactivado).',
    batchSizeName: 'Tamaño del lote (N)',
    batchSizeDesc: 'Número de notas que abre el comando "Abrir N notas aleatorias".',
    clearHistoryName: 'Limpiar historial',
    clearHistoryDesc: (n) => `Notas en el historial: ${n}.`,
    clearHistoryBtn: 'Limpiar',

    presetNamePrompt: 'Nombre del perfil',
    cancel: 'Cancelar',
    save: 'Guardar',

    widgetTitle: 'Nota aleatoria',
    widgetEmpty: 'No hay notas que coincidan con los filtros actuales.',
    widgetNext: '🔄 Siguiente',
    widgetOpen: '📄 Abrir',
    widgetPreviewError: 'No se pudo cargar la vista previa.',
};

const fr: Translations = {
    ribbonTooltip: 'Ouvrir une note aléatoire (avec filtres)',
    cmdOpenRandom: 'Ouvrir une note aléatoire...',
    cmdClearHistory: "Effacer l'historique des notes aléatoires",
    cmdOpenMultiple: 'Ouvrir N notes aléatoires',
    cmdPickPreset: 'Choisir un profil...',
    cmdToggleSidebar: 'Afficher le widget note aléatoire',
    cmdPresetPrefix: 'Note aléatoire :',

    noNotesFound: 'Aucune note trouvée avec les filtres actuels.',
    noPresets: "Aucun profil enregistré. Créez un profil dans les paramètres du plugin.",
    opened: (note: string) => `Ouvert : ${note}`,
    openedN: (n, names) => `${n} notes ouvertes : ${names}`,
    presetOpened: (name, note) => `Profil « ${name} » → ${note}`,
    presetSaved: (name) => `Profil « ${name} » enregistré.`,
    presetLoaded: (name) => `Profil « ${name} » chargé dans les filtres actuels.`,
    presetDeleted: (name) => `Profil « ${name} » supprimé.`,
    historyClearedNotice: 'Historique effacé.',

    settingsTitle: 'Improved Random Note — Paramètres',
    langLabel: 'Langue',
    langDesc: "Langue de l'interface du plugin.",

    includedFoldersName: 'Dossiers inclus',
    includedFoldersDesc: 'Dossiers dans lesquels chercher (séparés par des virgules).',
    includedTagsName: 'Étiquettes incluses',
    includedTagsDesc: 'Étiquettes pour filtrer (avec #, séparées par des virgules).',
    includedPropertiesName: 'Propriétés incluses',
    includedPropertiesDesc: 'Propriétés YAML pour filtrer (clé ou clé:valeur).',
    excludedFoldersName: 'Dossiers exclus',
    excludedFoldersDesc: 'Dossiers à ignorer (séparés par des virgules).',
    matchConditionName: 'Condition de correspondance',
    matchConditionDesc: 'Comment combiner les filtres.',
    matchOr: 'OU (n\'importe quelle condition)',
    matchAnd: 'ET (toutes les conditions)',

    presetsHeader: 'Profils',
    savePresetName: 'Enregistrer les filtres comme profil',
    savePresetDesc: 'Enregistre les valeurs de filtre actuelles comme profil nommé.',
    savePresetBtn: 'Enregistrer',
    loadBtn: 'Charger',
    deleteBtn: 'Supprimer',
    presetMatchAnd: '(ET)',
    presetMatchOr: '(OU)',

    behaviorHeader: 'Apparence & Comportement',
    openInNewTabName: 'Ouvrir dans un nouvel onglet',
    openInNewTabDesc: 'Toujours ouvrir la note aléatoire dans un nouvel onglet.',
    historySizeName: "Taille de l'historique",
    historySizeDesc: "Combien de notes récentes retenir pour éviter les doublons (0 = désactivé).",
    batchSizeName: 'Taille du lot (N)',
    batchSizeDesc: 'Nombre de notes ouvertes par la commande « Ouvrir N notes aléatoires ».',
    clearHistoryName: "Effacer l'historique",
    clearHistoryDesc: (n) => `Notes dans l'historique : ${n}.`,
    clearHistoryBtn: 'Effacer',

    presetNamePrompt: 'Nom du profil',
    cancel: 'Annuler',
    save: 'Enregistrer',

    widgetTitle: 'Note aléatoire',
    widgetEmpty: 'Aucune note ne correspond aux filtres actuels.',
    widgetNext: '🔄 Suivante',
    widgetOpen: '📄 Ouvrir',
    widgetPreviewError: 'Impossible de charger l\'aperçu.',
};

export const TRANSLATIONS: Record<Locale, Translations> = { en, ru, de, es, fr };

export function detectLocale(): Locale {
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
    if ((SUPPORTED_LOCALES as string[]).includes(lang)) return lang as Locale;
    return 'en';
}
