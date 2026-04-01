export type Language = 'en' | 'tr';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    dailyJournal: 'Daily Journal',
    trades: 'Trades',
    notebook: 'Notebook',
    reports: 'Reports',
    insights: 'Insights',
    addTrade: 'Add Trade',
    comingSoon: 'Coming Soon',
    
    // Dashboard
    goodMorning: 'Good morning! Here\'s your trading overview',
    netPnl: 'Net P&L',
    profitFactor: 'Profit Factor',
    currentStreak: 'Current Streak',
    importTrades: 'Import trades',
    
    // KPI Cards
    days: 'days',
    winning: 'Winning',
    losing: 'Losing',
    
    // Calendar
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    last30Days: 'Last 30 Days',
    custom: 'Custom',
    
    // Widgets
    accountBalance: 'Account Balance & P&L',
    balance: 'Balance',
    tradeWinRate: 'Trade Win %',
    tradeExpectancy: 'Trade Expectancy',
    perTrade: 'per trade',
    week: 'Week',
    totalTrades: 'Total Trades',
    bestTrade: 'Best Trade',
    worstTrade: 'Worst Trade',
    avgWin: 'Avg Win',
    
    // Add Trade Modal
    addNewTrade: 'Add New Trade',
    editTrade: 'Edit Trade',
    dateTime: 'Date & Time',
    symbol: 'Symbol',
    side: 'Side',
    quantity: 'Quantity',
    entryPrice: 'Entry Price',
    exitPrice: 'Exit Price',
    fees: 'Fees',
    riskPerTrade: 'Risk per Trade',
    strategy: 'Strategy',
    tags: 'Tags',
    imageUrl: 'Image URL',
    notes: 'Notes',
    preview: 'Preview',
    pnl: 'P&L',
    rMultiple: 'R Multiple',
    cancel: 'Cancel',
    saving: 'Saving...',
    updateTrade: 'Update Trade',
    
    // Validation
    required: 'is required',
    mustBePositive: 'must be greater than 0',
    cannotBeNegative: 'cannot be negative',
    
    // Filters
    filters: 'Filters',
    all: 'All',
    long: 'Long',
    short: 'Short',
    win: 'Win',
    loss: 'Loss',
    clearFilters: 'Clear filters',
    apply: 'Apply',
    
    // Demo
    demoData: 'TradeDiwan Demo',
    demoUser: 'Demo User',
    
    // Future features
    backtesting: 'Backtesting',
    tradeReplay: 'Trade Replay',
    challenges: 'Challenges',
    mentorMode: 'Mentor Mode',
    university: 'University',
    resourceCenter: 'Resource Center',
    
    // Common
    settings: 'Settings',
    signOut: 'Sign out',
    language: 'Language',
    
    // Calendar
    tradeHistory: 'Trade History',
    dailyReview: 'Daily Review',
    noTrades: 'No trades',
    
    // Journal
    whatWentWell: 'What Went Well',
    toImprove: 'To Improve',
    generalNotes: 'General Notes',
    mood: 'Mood',
    save: 'Save',
    saving: 'Saving...',

    // Broker Sync
    brokerSync: 'Broker Sync',
    autoSync: 'Auto Sync',
    fileUpload: 'File Upload',
    manual: 'Manual',
    connectedAccounts: 'Connected Accounts',
    addNewBroker: 'Add New Broker',
    connectYourTradingAccount: 'Connect your trading account for automatic trade import',
    platform: 'Platform',
    server: 'Server',
    login: 'Login',
    investorPassword: 'Investor Password',
    startDate: 'Start Date',
    optional: 'Optional',
    connect: 'Connect',
    connecting: 'Connecting',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
    lastSync: 'Last Sync',
    uploadTradeHistory: 'Upload Trade History',
    uploadInstructions: 'Upload your trading platform\'s export file to import trades',
    selectFile: 'Select File',
    selectedFile: 'Selected File',
    uploadFile: 'Upload File',
    howToExport: 'How to Export from Your Platform',
    mt5Step1: 'Open MetaTrader 5 Desktop Application',
    mt5Step2: 'In the Terminal window, select the History tab',
    mt5Step3: 'Right-click → Reports → HTML',
    mt5Step4: 'Save the report and upload it here',
    manualEntry: 'Manual Entry',
    manualEntryDescription: 'Add trades manually using our trade form',
    addTradeManually: 'Add Trade Manually',
  },
  tr: {
    // Navigation
    dashboard: 'Panel',
    dailyJournal: 'Günlük',
    trades: 'İşlemler',
    notebook: 'Not Defteri',
    reports: 'Raporlar',
    insights: 'Analiz',
    addTrade: 'İşlem Ekle',
    comingSoon: 'Yakında',
    
    // Dashboard
    goodMorning: 'Günaydın! İşte trading özetiniz',
    netPnl: 'Net K/Z',
    profitFactor: 'Kar Faktörü',
    currentStreak: 'Mevcut Seri',
    importTrades: 'İşlem aktar',
    
    // KPI Cards
    days: 'gün',
    winning: 'Kazanan',
    losing: 'Kaybeden',
    
    // Calendar
    today: 'Bugün',
    thisWeek: 'Bu Hafta',
    thisMonth: 'Bu Ay',
    last30Days: 'Son 30 Gün',
    custom: 'Özel',
    
    // Widgets
    accountBalance: 'Hesap Bakiyesi & K/Z',
    balance: 'Bakiye',
    tradeWinRate: 'Kazanma Oranı',
    tradeExpectancy: 'İşlem Beklentisi',
    perTrade: 'işlem başına',
    week: 'Hafta',
    totalTrades: 'Toplam İşlem',
    bestTrade: 'En İyi İşlem',
    worstTrade: 'En Kötü İşlem',
    avgWin: 'Ort. Kazanç',
    
    // Add Trade Modal
    addNewTrade: 'Yeni İşlem Ekle',
    editTrade: 'İşlem Düzenle',
    dateTime: 'Tarih & Saat',
    symbol: 'Sembol',
    side: 'Yön',
    quantity: 'Adet',
    entryPrice: 'Giriş Fiyatı',
    exitPrice: 'Çıkış Fiyatı',
    fees: 'Komisyon',
    riskPerTrade: 'İşlem Başına Risk',
    strategy: 'Strateji',
    tags: 'Etiketler',
    imageUrl: 'Görsel URL',
    notes: 'Notlar',
    preview: 'Önizleme',
    pnl: 'K/Z',
    rMultiple: 'R Katı',
    cancel: 'İptal',
    saving: 'Kaydediliyor...',
    updateTrade: 'İşlemi Güncelle',
    
    // Validation
    required: 'gereklidir',
    mustBePositive: '0\'dan büyük olmalıdır',
    cannotBeNegative: 'negatif olamaz',
    
    // Filters
    filters: 'Filtreler',
    all: 'Tümü',
    long: 'Alış',
    short: 'Satış',
    win: 'Kazanan',
    loss: 'Kaybeden',
    clearFilters: 'Filtreleri temizle',
    apply: 'Uygula',
    
    // Demo
    demoData: 'TradeDiwan Demo',
    demoUser: 'Demo Kullanıcı',
    
    // Future features
    backtesting: 'Backtest',
    tradeReplay: 'İşlem Tekrarı',
    challenges: 'Görevler',
    mentorMode: 'Mentor Modu',
    university: 'Üniversite',
    resourceCenter: 'Kaynak Merkezi',
    
    // Common
    settings: 'Ayarlar',
    signOut: 'Çıkış yap',
    language: 'Dil',
    
    // Calendar
    tradeHistory: 'İşlem Geçmişi',
    dailyReview: 'Günlük Değerlendirme',
    noTrades: 'İşlem bulunmuyor',
    
    // Journal
    whatWentWell: 'İyi Giden Şeyler',
    toImprove: 'Geliştirilecek Alanlar',
    generalNotes: 'Genel Notlar',
    mood: 'Ruh Hali',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',

    // Broker Sync
    brokerSync: 'Broker Bağlantısı',
    autoSync: 'Otomatik Senkronizasyon',
    fileUpload: 'Dosya Yükleme',
    manual: 'Manuel',
    connectedAccounts: 'Bağlı Hesaplar',
    addNewBroker: 'Yeni Broker Ekle',
    connectYourTradingAccount: 'Otomatik işlem aktarımı için trading hesabınızı bağlayın',
    platform: 'Platform',
    server: 'Sunucu',
    login: 'Giriş',
    investorPassword: 'Yatırımcı Şifresi',
    startDate: 'Başlangıç Tarihi',
    optional: 'Opsiyonel',
    connect: 'Bağlan',
    connecting: 'Bağlanıyor',
    connected: 'Bağlı',
    disconnected: 'Bağlantı Kesildi',
    error: 'Hata',
    lastSync: 'Son Senkronizasyon',
    uploadTradeHistory: 'İşlem Geçmişi Yükle',
    uploadInstructions: 'İşlemleri aktarmak için trading platformunuzun export dosyasını yükleyin',
    selectFile: 'Dosya Seç',
    selectedFile: 'Seçilen Dosya',
    uploadFile: 'Dosya Yükle',
    howToExport: 'Platformunuzdan Nasıl Export Edilir',
    mt5Step1: 'MetaTrader 5 Desktop Uygulamasını açın',
    mt5Step2: 'Terminal penceresinde History sekmesini seçin',
    mt5Step3: 'Sağ tık → Reports → HTML',
    mt5Step4: 'Raporu kaydedin ve buraya yükleyin',
    manualEntry: 'Manuel Giriş',
    manualEntryDescription: 'İşlem formumuzla manuel olarak işlem ekleyin',
    addTradeManually: 'Manuel İşlem Ekle',
  }
};

export function getTranslations(lang: Language) {
  return translations[lang];
}
