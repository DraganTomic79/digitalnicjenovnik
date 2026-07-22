/* ===== INDEX TRANSLATION MANAGER - BEZ KREIRANJA DUGMADI ===== */

class IndexTranslationManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'sr';
    this.loadTranslations();
    this.init();
  }

  async loadTranslations() {
    try {
      const response = await fetch('./index-translations.json');
      this.translations = await response.json();
      console.log('Index prevodi učitani');
    } catch (error) {
      console.error('Greška pri učitavanju prevoda:', error);
      this.translations = {
        sr: { 
          loading: "Učitavanje...", 
          heroTitle: "CJENOVNIK", 
          heroSubtitle: "Pogledajte našu kompletnu ponudu", 
          categories: {},
          items: {},
          descriptions: {}
        },
        en: { 
          loading: "Loading...", 
          heroTitle: "PRICE LIST", 
          heroSubtitle: "Check out our complete offer", 
          categories: {},
          items: {},
          descriptions: {}
        },
        de: { 
          loading: "Laden...", 
          heroTitle: "PREISLISTE", 
          heroSubtitle: "Sehen Sie sich unser komplettes Angebot an", 
          categories: {},
          items: {},
          descriptions: {}
        }
      };
    }
  }

  init() {
    // Učitaj sačuvani jezik iz localStorage
    const savedLanguage = localStorage.getItem('siteLanguage');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }
    
    // Čekaj da se DOM učita
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupLanguageButtons();
        setTimeout(() => this.applyTranslations(), 200);
      });
    } else {
      this.setupLanguageButtons();
      setTimeout(() => this.applyTranslations(), 200);
    }
  }

  setupLanguageButtons() {
    // Pronađi sva jezička dugmad u HTML-u
    const languageButtons = document.querySelectorAll('.language-btn');
    
    if (languageButtons.length === 0) {
      console.warn('Jezička dugmad nisu pronađena u HTML-u');
      return;
    }
    
    // Dodaj event listenere na svako dugme
    languageButtons.forEach(btn => {
      const langCode = btn.getAttribute('data-lang');
      
      // Postavi aktivno dugme na osnovu trenutnog jezika
      if (langCode === this.currentLanguage) {
        btn.classList.add('active');
      }
      
      // Dodaj click event
      btn.addEventListener('click', () => this.changeLanguage(langCode));
    });
    
    console.log(`Postavljeno ${languageButtons.length} jezičkih dugmadi`);
  }

  changeLanguage(languageCode) {
    if (!this.translations[languageCode]) {
      console.error(`Prevod za jezik '${languageCode}' nije pronađen`);
      return;
    }
    
    // Postavi novi jezik
    this.currentLanguage = languageCode;
    localStorage.setItem('siteLanguage', languageCode);
    
    // Ažuriraj aktivno dugme
    document.querySelectorAll('.language-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-lang') === languageCode) {
        btn.classList.add('active');
      }
    });
    
    // Primeni prevode
    this.applyTranslations();
    document.title = this.t('pageTitle');
    
    // Ažuriraj Hero sekciju
    this.updateHeroSection();
    
    // Pozovi MenuApp da osvježi prikaz
    if (window.menuApp && window.menuApp.refreshWithTranslations) {
      window.menuApp.refreshWithTranslations();
    }
    
    console.log(`Jezik promenjen na: ${languageCode}`);
  }

  t(key, defaultText = key) {
    return this.translations[this.currentLanguage]?.[key] || defaultText;
  }

  // Prevedi naziv kategorije/podkategorije
  translateCategory(categoryName) {
    if (!categoryName) return categoryName;
    if (this.currentLanguage === 'sr') return categoryName;
    const translation = this.translations[this.currentLanguage]?.categories?.[categoryName];
    return translation || categoryName;
  }

  // NOVA FUNKCIJA - Prevedi naziv artikla
  translateItem(itemName) {
    if (!itemName) return itemName;
    if (this.currentLanguage === 'sr') return itemName;
    const translation = this.translations[this.currentLanguage]?.items?.[itemName];
    return translation || itemName;
  }

  // NOVA FUNKCIJA - Prevedi opis artikla
  translateDescription(description) {
    if (!description) return description;
    if (this.currentLanguage === 'sr') return description;
    const translation = this.translations[this.currentLanguage]?.descriptions?.[description];
    return translation || description;
  }

  // NOVA FUNKCIJA - Prevedi bilo koji tekst (naziv ili opis)
  translateText(text, type = 'item') {
    if (!text) return text;
    if (this.currentLanguage === 'sr') return text;
    
    const translationKey = type === 'description' ? 'descriptions' : 'items';
    const translation = this.translations[this.currentLanguage]?.[translationKey]?.[text];
    return translation || text;
  }

  // Ažuriraj Hero sekciju sa prevodima
  updateHeroSection() {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroSection = document.querySelector('.hero-section');
    const heroLoading = document.querySelector('.hero-loading');

    if (heroLoading) heroLoading.style.display = 'none';

    // Za srpski jezik koristi vrijednosti iz Firebase (postavljene od admina)
    // Za ostale jezike koristi prevode iz translations.json
    if (this.currentLanguage === 'sr' && window.menuApp) {
      if (heroTitle && window.menuApp.heroTitleDB) {
        heroTitle.textContent = window.menuApp.heroTitleDB;
        heroTitle.style.display = 'block';
      } else if (heroTitle) {
        const t = this.t('heroTitle');
        if (t && t !== 'heroTitle') { heroTitle.textContent = t; heroTitle.style.display = 'block'; }
      }
      if (heroSubtitle && window.menuApp.heroSubtitleDB) {
        heroSubtitle.textContent = window.menuApp.heroSubtitleDB;
        heroSubtitle.style.display = 'block';
      } else if (heroSubtitle) {
        const t = this.t('heroSubtitle');
        if (t && t !== 'heroSubtitle') { heroSubtitle.textContent = t; heroSubtitle.style.display = 'block'; }
      }
    } else {
      if (heroTitle) {
        const translatedTitle = this.t('heroTitle');
        if (translatedTitle && translatedTitle !== 'heroTitle') {
          heroTitle.textContent = translatedTitle;
          heroTitle.style.display = 'block';
        }
      }
      if (heroSubtitle) {
        const translatedSubtitle = this.t('heroSubtitle');
        if (translatedSubtitle && translatedSubtitle !== 'heroSubtitle') {
          heroSubtitle.textContent = translatedSubtitle;
          heroSubtitle.style.display = 'block';
        }
      }
    }

    if (heroSection) heroSection.style.display = 'block';
  }

  applyTranslations() {
    // Hero loading
    const heroLoading = document.querySelector('.hero-loading');
    if (heroLoading) {
      const icon = heroLoading.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '<i class="fas fa-spinner fa-spin"></i>';
      heroLoading.innerHTML = `${iconHTML}<span>${this.t('loading')}</span>`;
    }

    // Category tabs loading
    const tabsLoading = document.querySelector('#categoryTabs .loading');
    if (tabsLoading) {
      const icon = tabsLoading.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '<i class="fas fa-spinner fa-spin"></i>';
      tabsLoading.innerHTML = `${iconHTML}<span>${this.t('loadingCategories')}</span>`;
    }

    // Tab content loading
    const contentLoading = document.querySelector('#tabContent .loading');
    if (contentLoading) {
      const icon = contentLoading.querySelector('i');
      const iconHTML = icon ? icon.outerHTML : '<i class="fas fa-spinner fa-spin"></i>';
      contentLoading.innerHTML = `${iconHTML}<h3>${this.t('loadingMenu')}</h3><p>${this.t('pleaseWait')}</p>`;
    }

    // Scroll to top button
    const scrollBtn = document.getElementById('scrollToTop');
    if (scrollBtn) scrollBtn.setAttribute('aria-label', this.t('backToTop'));

    // Page title
    document.title = this.t('pageTitle');
    
    // Ažuriraj Hero sekciju
    this.updateHeroSection();
  }

  getEmptyStateHTML(type = 'general') {
    const configs = {
      general: { icon: 'fas fa-box-open', title: 'noItemsInCategory', subtitle: 'addingProductsSoon' },
      menu: { icon: 'fas fa-utensils', title: 'menuAvailableSoon', subtitle: 'preparingMenu' },
      category: { icon: 'fas fa-box-open', title: 'noItemsInCategory', subtitle: 'addingProductsSoon' },
      error: { icon: 'fas fa-exclamation-triangle', title: 'loadingError', subtitle: 'tryAgainLater' }
    };
    const config = configs[type] || configs.general;
    return `<div class="empty-state"><i class="${config.icon}"></i><h3>${this.t(config.title)}</h3><p>${this.t(config.subtitle)}</p></div>`;
  }

  getModalLoaderHTML() {
    return `<div class="modal-loader"><i class="fas fa-spinner fa-spin"></i><span>${this.t('loadingImage')}</span></div>`;
  }

  getModalErrorHTML() {
    return `<i class="fas fa-exclamation-triangle"></i><span>${this.t('failedToLoadImage')}</span>`;
  }
}

// Inicijalizuj Translation Manager
let indexTranslationManager = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    indexTranslationManager = new IndexTranslationManager();
    window.indexTranslationManager = indexTranslationManager;
    window.tIndex = (key, defaultText) => indexTranslationManager?.t(key, defaultText) || defaultText;
  });
} else {
  indexTranslationManager = new IndexTranslationManager();
  window.indexTranslationManager = indexTranslationManager;
  window.tIndex = (key, defaultText) => indexTranslationManager?.t(key, defaultText) || defaultText;
}