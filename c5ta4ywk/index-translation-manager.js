/* ===== INDEX TRANSLATION MANAGER - BEZ KREIRANJA DUGMADI ===== */

class IndexTranslationManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'sr';
    this.translationsReady = this.loadTranslations();
    this.init();
  }

  async loadTranslations() {
    try {
      const response = await fetch('./index-translations.json');
      this.translations = await response.json();
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

  async init() {
    // Sačekaj da se prevodi STVARNO učitaju (umjesto nagađanja sa fiksnim timeout-om)
    await this.translationsReady;

    // Učitaj sačuvani jezik iz localStorage
    const savedLanguage = localStorage.getItem('siteLanguage');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }

    const start = () => {
      this.setupLanguageButtons();
      this.applyTranslations();
    };

    // Čekaj da se DOM učita
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
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

      // Prvo skini "active" sa SVIH dugmadi (npr. SR je u HTML-u tvrdo markiran
      // kao podrazumijevano aktivan prije nego se JS učita) — pa tek onda
      // označi ISKLJUČIVO ono koje stvarno odgovara trenutnom jeziku.
      btn.classList.remove('active');
      if (langCode === this.currentLanguage) {
        btn.classList.add('active');
      }

      // Dodaj click event
      btn.addEventListener('click', () => this.changeLanguage(langCode));
    });
    
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
    // Naslov taba dolazi iz baze (pageTitle u postavkama) — ne prepisuje se prevodom
    
    // Ažuriraj Hero sekciju
    this.updateHeroSection();
    
    // Pozovi MenuApp da osvježi prikaz
    if (window.menuApp && window.menuApp.refreshWithTranslations) {
      window.menuApp.refreshWithTranslations();
    }
    setTimeout(() => this.showMissingPanel(), 300);
    
  }

  t(key, defaultText = key) {
    return this.translations[this.currentLanguage]?.[key] || defaultText;
  }

  // Normalizacija za poređenje: bez razmaka na krajevima, višestrukih razmaka i razlike velikih/malih slova
  _norm(text) {
    return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Traži prevod u rječniku: tačno poklapanje, pa poklapanje bez obzira na velika/mala slova i razmake
  _lookup(type, text) {
    const dict = this.translations[this.currentLanguage]?.[type];
    if (!dict || !text) return null;
    if (dict[text]) return dict[text];
    this._indexCache = this._indexCache || {};
    const cacheKey = this.currentLanguage + '|' + type;
    if (!this._indexCache[cacheKey]) {
      const idx = {};
      Object.keys(dict).forEach(k => { const n = this._norm(k); if (!(n in idx)) idx[n] = dict[k]; });
      this._indexCache[cacheKey] = idx;
    }
    return this._indexCache[cacheKey][this._norm(text)] || null;
  }

  // Jedinice mjere u opisima (gr -> g, lit -> liter) kad za cijeli opis ne postoji prevod
  _translateUnits(text) {
    const liter = this.currentLanguage === 'de' ? 'Liter' : 'liter';
    return text
      .replace(/(\d)\s*gr\b\.?/gi, '$1 g')
      .replace(/(\d)\s*lit\b\.?/gi, '$1 ' + liter);
  }

  // Bilježi neprevedene tekstove (koristi se samo za pomoćni prikaz ?prevodi=1)
  _noteMissing(type, text) {
    if (!text || !String(text).trim()) return;
    this.missing = this.missing || { categories: new Set(), items: new Set(), descriptions: new Set() };
    this.missing[type].add(String(text).trim());
  }

  // Prevedi naziv kategorije/podkategorije
  translateCategory(categoryName) {
    if (!categoryName) return categoryName;
    if (this.currentLanguage === 'sr') return categoryName;
    const translation = this._lookup('categories', categoryName);
    if (!translation) this._noteMissing('categories', categoryName);
    return translation || categoryName;
  }

  // Prevedi naziv artikla
  translateItem(itemName) {
    if (!itemName) return itemName;
    if (this.currentLanguage === 'sr') return itemName;
    const translation = this._lookup('items', itemName);
    if (!translation) this._noteMissing('items', itemName);
    return translation || itemName;
  }

  // Prevedi opis artikla: cijeli opis; ako ga nema, dijelovi odvojeni sa " / " ili ","; pa jedinice mjere
  translateDescription(description) {
    if (!description) return description;
    if (this.currentLanguage === 'sr') return description;
    const whole = this._lookup('descriptions', description);
    if (whole) return whole;

    const unitFixed = this._translateUnits(description);
    const sepMatch = description.match(/\s\/\s/) ? /\s\/\s/ : null;
    if (sepMatch) {
      let anyMissing = false;
      const parts = description.split(sepMatch).map(part => {
        const t = this._lookup('descriptions', part) || this._lookup('descriptions', this._translateUnits(part));
        if (t) return t;
        const u = this._translateUnits(part);
        if (u === part) anyMissing = true;
        return u;
      });
      if (anyMissing) this._noteMissing('descriptions', description);
      return parts.join(' / ');
    }
    if (unitFixed === description) this._noteMissing('descriptions', description);
    return unitFixed;
  }

  // Prevedi bilo koji tekst (naziv ili opis)
  translateText(text, type = 'item') {
    if (!text) return text;
    if (this.currentLanguage === 'sr') return text;
    return type === 'description' ? this.translateDescription(text) : this.translateItem(text);
  }

  // Pomoćni prikaz neprevedenih tekstova: otvoriti stranicu sa ?prevodi=1, izabrati EN ili DE
  showMissingPanel() {
    if (!/[?&]prevodi=1/.test(location.search)) return;
    let box = document.getElementById('missingTranslationsBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'missingTranslationsBox';
      box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;max-height:45vh;overflow:auto;background:#111;color:#eee;font:12px/1.4 monospace;padding:10px;border:2px solid #C6A664;border-radius:8px;z-index:99999;white-space:pre-wrap;';
      document.body.appendChild(box);
    }
    const m = this.missing || { categories: new Set(), items: new Set(), descriptions: new Set() };
    const out = { categories: [...m.categories], items: [...m.items], descriptions: [...m.descriptions] };
    const txt = JSON.stringify(out, null, 1);
    box.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = 'Kopiraj listu neprevedenih (' + this.currentLanguage.toUpperCase() + ')';
    btn.style.cssText = 'display:block;margin-bottom:8px;padding:6px 10px;';
    btn.onclick = () => { try { navigator.clipboard.writeText(txt); btn.textContent = 'Kopirano ✓'; } catch (e) { btn.textContent = 'Označite i kopirajte ručno'; } };
    box.appendChild(btn);
    box.appendChild(document.createTextNode(txt));
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
    // Naslov taba dolazi iz baze (pageTitle u postavkama) — ne prepisuje se prevodom
    
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