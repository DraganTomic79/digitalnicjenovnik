/* ===== TRANSLATION MANAGER ===== */

class TranslationManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'sr'; // Defaultni jezik
    this.loadTranslations();
    this.init();
  }

  // Učitaj prevode iz JSON fajla
  async loadTranslations() {
    try {
      const response = await fetch('./translations.json');
      this.translations = await response.json();
      console.log('Prevodi učitani:', this.translations);
    } catch (error) {
      console.error('Greška pri učitavanju prevoda:', error);
      // Fallback prevodi ako se ne mogu učitati iz fajla
      this.translations = {
        sr: { adminPanel: "Admin Panel" },
        en: { adminPanel: "Admin Panel" },
        de: { adminPanel: "Admin-Panel" }
      };
    }
  }

  // Inicijalizuj sistem prevoda
  init() {
    // Učitaj sačuvani jezik iz localStorage
    const savedLanguage = localStorage.getItem('adminPanelLanguage');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }

    // Kreiraj dugmad za prevod
    this.createLanguageButtons();
    
    // Primeni trenutni jezik
    setTimeout(() => this.applyTranslations(), 100);
  }

  // Kreiraj dugmad za jezike
  createLanguageButtons() {
    const header = document.querySelector('.header');
    if (!header) return;

    const languageContainer = document.createElement('div');
    languageContainer.className = 'language-switcher';

    const languages = [
      { code: 'sr', flag: '🇷🇸', name: 'Srpski' },
      { code: 'en', flag: '🇬🇧', name: 'English' },
      { code: 'de', flag: '🇩🇪', name: 'Deutsch' }
    ];

    languages.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = `language-btn ${this.currentLanguage === lang.code ? 'active' : ''}`;
      btn.innerHTML = `${lang.flag}`;
      btn.title = lang.name;

      btn.addEventListener('click', () => this.changeLanguage(lang.code));

      languageContainer.appendChild(btn);
    });

    // Postavi header poziciju za relativno pozicioniranje
    header.style.position = 'relative';
    header.appendChild(languageContainer);
  }

  // Promeni jezik
  changeLanguage(languageCode) {
    if (!this.translations[languageCode]) {
      console.error('Nepoznat jezik:', languageCode);
      return;
    }

    this.currentLanguage = languageCode;
    localStorage.setItem('adminPanelLanguage', languageCode);
    
    // Ažuriraj aktivno dugme
    document.querySelectorAll('.language-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelectorAll('.language-btn')[
      ['sr', 'en', 'de'].indexOf(languageCode)
    ];
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Primeni novi prevod
    this.applyTranslations();
    
    // Ažuriraj title stranice
    document.title = this.t('pageTitle');
  }

  // Dobij prevod za ključ
  t(key, defaultText = key) {
    const translation = this.translations[this.currentLanguage]?.[key];
    return translation || defaultText;
  }

  // Primeni prevode na stranicu
  applyTranslations() {
    if (!this.translations[this.currentLanguage]) return;

    // Mapiranje elemenata sa prevodima
    const translations = [
      // Header
      { selector: '.header h1', textKey: 'adminPanel', keepIcon: true },
      { selector: '.header p', textKey: 'manageMenu' },
      
      // Tab dugmad
      { selector: '.tab-btn[data-tab="glavne-kategorije"] span', textKey: 'mainCategories' },
      { selector: '.tab-btn[data-tab="kategorije"] span', textKey: 'categories' },
      { selector: '.tab-btn[data-tab="podkategorije"] span', textKey: 'subcategories' },
      { selector: '.tab-btn[data-tab="artikli"] span', textKey: 'items' },
      { selector: '.tab-btn[data-tab="postavke"] span', textKey: 'settings' },

      // Glavne kategorije
      { selector: '#glavne-kategorije-tab .card:first-child h3', textKey: 'newMainCategory', keepIcon: true },
      { selector: 'label[for="novaGlavnaKategorija"]', textKey: 'name', keepIcon: true },
      { selector: 'label[for="ikonaGlavneKategorije"]', textKey: 'icon', keepIcon: true },
      { selector: '#glavne-kategorije-tab .card:nth-child(2) h3', textKey: 'listMainCategories', keepIcon: true },
      { selector: '#dodajGlavnuKategorijuBtn', textKey: 'add', keepIcon: true },
      { selector: '#sacuvajGlavnuKategorijuBtn', textKey: 'save', keepIcon: true },
      { selector: '#otkaziGlavnuKategorijuBtn', textKey: 'cancel', keepIcon: true },

      // Kategorije
      { selector: '#kategorije-tab .card:first-child h3', textKey: 'newCategory', keepIcon: true },
      { selector: 'label[for="selectGlavnaKategorija"]', textKey: 'selectMainCategory', keepIcon: true },
      { selector: 'label[for="novaKategorija"]', textKey: 'name', keepIcon: true },
      { selector: 'label[for="ikonaKategorije"]', textKey: 'icon', keepIcon: true },
      { selector: '#kategorije-tab .card:nth-child(2) h3', textKey: 'listCategories', keepIcon: true },
      { selector: '#dodajKategorijuBtn', textKey: 'add', keepIcon: true },
      { selector: '#sacuvajKategorijuBtn', textKey: 'save', keepIcon: true },
      { selector: '#otkaziKategorijuBtn', textKey: 'cancel', keepIcon: true },

      // Podkategorije
      { selector: '#podkategorije-tab .card:first-child h3', textKey: 'newSubcategory', keepIcon: true },
      { selector: 'label[for="selectKategorijaPodkategorija"]', textKey: 'categoryLabel', keepIcon: true },
      { selector: 'label[for="novaPodkategorija"]', textKey: 'name', keepIcon: true },
      { selector: 'label[for="ikonaPodkategorije"]', textKey: 'icon', keepIcon: true },
      { selector: '#podkategorije-tab .card:nth-child(2) h3', textKey: 'listSubcategories', keepIcon: true },
      { selector: '#dodajPodkategorijuBtn', textKey: 'add', keepIcon: true },
      { selector: '#sacuvajPodkategorijuBtn', textKey: 'save', keepIcon: true },
      { selector: '#otkaziPodkategorijuBtn', textKey: 'cancel', keepIcon: true },

      // Artikli
      { selector: '#artikli-tab .card h3', textKey: 'itemManagement', keepIcon: true },
      { selector: 'label[for="selectPodkategorija"]', textKey: 'subcategory', keepIcon: true },
      { selector: 'label[for="nazivArtikla"]', textKey: 'name', keepIcon: true },
      { selector: 'label[for="cijenaArtikla"]', textKey: 'price', keepIcon: true },
      { selector: 'label[for="opisArtikla"]', textKey: 'description', keepIcon: true },
      { selector: 'label[for="slikaArtikla"]', textKey: 'image', keepIcon: true },
      { selector: '#dodajArtikalBtn', textKey: 'addItem', keepIcon: true },
      { selector: '#sacuvajIzmjenuBtn', textKey: 'save', keepIcon: true },
      { selector: '#otkaziIzmjenuBtn', textKey: 'cancel', keepIcon: true },

      // Postavke
      { selector: '#postavke-tab .card h3', textKey: 'siteSettings', keepIcon: true },
      { selector: '#uploadLogoBtn', textKey: 'upload' },
      { selector: '#ukloniLogoBtn', textKey: 'remove' },
      { selector: 'label[for="currencyCode"]', textKey: 'currencyCode' },
      { selector: '#saveCurrencyBtn', textKey: 'save', keepIcon: true },
      { selector: '#resetCurrencyBtn', textKey: 'resetCurrency', keepIcon: true },
      { selector: 'label[for="heroTitle"]', textKey: 'title' },
      { selector: 'label[for="heroSubtitle"]', textKey: 'subtitle' },
      { selector: '#sacuvajHeroBtn', textKey: 'save' },
      { selector: '#resetHeroBtn', textKey: 'reset' },
      { selector: 'label[for="footerText"]', textKey: 'footerText' },
      { selector: '#sacuvajFooterBtn', textKey: 'saveFooter' },
      { selector: '#resetFooterBtn', textKey: 'reset' },
      { selector: '#sacuvajPostavkeBtn', textKey: 'saveAllSettings', keepIcon: true },

      // Toast
      { selector: '#toastTitle', textKey: 'notification' }
    ];

    // Primeni prevode
    translations.forEach(({ selector, textKey, keepIcon = false }) => {
      const element = document.querySelector(selector);
      if (element) {
        const translatedText = this.t(textKey);
        
        if (keepIcon && element.innerHTML.includes('<i ')) {
          // Zadrži ikonu i promeni samo tekst
          const iconMatch = element.innerHTML.match(/<i[^>]*><\/i>/);
          if (iconMatch) {
            element.innerHTML = `${iconMatch[0]} ${translatedText}`;
          } else {
            element.textContent = translatedText;
          }
        } else {
          element.textContent = translatedText;
        }
      }
    });

    // Ažuriraj ostale elemente
    this.updatePlaceholders();
    this.updateDropdownOptions();
    this.updateSpecialElements();
    this.updateHeaderButtons();

    console.log(`Prevodi primenjeni za jezik: ${this.currentLanguage}`);
  }

  // Direktno ažuriraj header dugmad
  updateHeaderButtons() {
    setTimeout(() => {
      // Pronađi dugme "Pogledaj sajt"
      const viewSiteBtn = document.querySelector('a[href="index.html"]');
      if (viewSiteBtn) {
        const icon = viewSiteBtn.querySelector('i');
        const iconHTML = icon ? icon.outerHTML + ' ' : '';
        viewSiteBtn.innerHTML = iconHTML + this.t('viewSite');
      }

      // Pronađi dugme "Odjavi se"
      const logoutBtn = document.querySelector('a[href="login.html"]');
      if (logoutBtn) {
        const icon = logoutBtn.querySelector('i');
        const iconHTML = icon ? icon.outerHTML + ' ' : '';
        logoutBtn.innerHTML = iconHTML + this.t('logout');
      }
    }, 200);
  }

  // Ažuriraj specijalne elemente koji ne mogu biti pokriveni osnovnim mapiranjem
  updateSpecialElements() {
    // Ažuriraj sve h4 naslove
    const allH4 = document.querySelectorAll('h4');
    allH4.forEach(heading => {
      const text = heading.textContent.trim();
      let newText = null;
      
      // Footer & Društvene Mreže
      if (text.includes('Footer') && (text.includes('Društvene') || text.includes('Social') || text.includes('Soziale'))) {
        newText = this.t('footerSocial');
      }
      
      // Hero sekcija
      else if (text.match(/hero/i) && (text.includes('Sekcija') || text.includes('Section') || text.includes('Bereich'))) {
        newText = this.t('heroSection');
      }

      // Novi Artikal
      else if ((text.includes('Novi') && text.includes('Artikal')) ||
          (text.includes('New') && text.includes('Item')) ||
          (text.includes('Neue') && text.includes('Artikel'))) {
        newText = this.t('newItem');
      }

      // Lista Artikala
      else if ((text.includes('Lista') && text.includes('Artikala')) ||
          (text.includes('Items') && text.includes('List')) ||
          (text.includes('Artikel') && text.includes('liste'))) {
        newText = this.t('listItems');
      }

      // Logo
      else if (text === 'Logo') {
        newText = this.t('logo');
      }

      // Valuta
      else if (text.includes('Valuta') || text.includes('Currency') || text.includes('Währung')) {
        newText = this.t('currency');
      }

      if (newText) {
        const icon = heading.querySelector('i');
        const iconHTML = icon ? icon.outerHTML + ' ' : '';
        heading.innerHTML = iconHTML + newText;
      }
    });

    // Direktno mapiranje za specifične h4 elemente
    const footerH4 = document.querySelector('h4 i.fa-footer');
    if (footerH4 && footerH4.parentElement) {
      footerH4.parentElement.innerHTML = '<i class="fas fa-footer"></i> ' + this.t('footerSocial');
    }

    // Size recommendations
    this.updateSizeRecommendations();
    
    // Icon preview labels
    this.updateIconPreviewLabels();
    
    // Examples section
    this.updateExampleSection();
    
    // Footer checkbox i tekst
    this.updateFooterCheckbox();
    
    // Dodatno mapiranje za Footer elemente
    this.updateFooterElements();
  }

  // Nova metoda za ažuriranje footer elemenata
  updateFooterElements() {
    // Pronađi i ažuriraj "Footer & Društvene Mreže" naslov
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.textContent && element.children.length <= 1) { // Samo elementi sa tekstom, ne kontejneri
        const text = element.textContent.trim();
        
        // Footer & Društvene Mreže
        if (text === 'Footer & Društvene Mreže' || 
            text === 'Footer & Social Networks' || 
            text === 'Footer & Soziale Netzwerke') {
          const icon = element.querySelector('i');
          const iconHTML = icon ? icon.outerHTML + ' ' : '';
          element.innerHTML = iconHTML + this.t('footerSocial');
        }
        
        // Prikaži footer
        else if (text === 'Prikaži footer' || 
                 text === 'Show footer' || 
                 text === 'Footer anzeigen') {
          element.textContent = this.t('showFooter');
        }
        
        // Footer tekst
        else if (text === 'Footer tekst' || 
                 text === 'Footer text' || 
                 text === 'Footer-Text') {
          element.textContent = this.t('footerText');
        }
      }
    });
  }

  // Ažuriraj placeholder tekstove
  updatePlaceholders() {
    const placeholderMap = [
      { selector: '#novaGlavnaKategorija', textKey: 'placeholderMainCategory' },
      { selector: '#novaKategorija', textKey: 'placeholderCategory' },
      { selector: '#novaPodkategorija', textKey: 'placeholderSubcategory' },
      { selector: '#nazivArtikla', textKey: 'placeholderItemName' },
      { selector: '#cijenaArtikla', textKey: 'placeholderPrice' },
      { selector: '#opisArtikla', textKey: 'placeholderDescription' },
      { selector: '#currencyCode', textKey: 'placeholderCurrency' },
      { selector: '#heroTitle', textKey: 'placeholderHeroTitle' },
      { selector: '#heroSubtitle', textKey: 'placeholderHeroSubtitle' },
      { selector: '#footerText', textKey: 'placeholderFooterText' }
    ];

    placeholderMap.forEach(({ selector, textKey }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.placeholder = this.t(textKey);
      }
    });

    // Ažuriraj help tekst za valutu
    const currencyHelp = document.querySelector('#currencyCode + small');
    if (currencyHelp) {
      currencyHelp.textContent = this.t('currencyHelp');
    }
  }

  // Ažuriraj dropdown opcije
  updateDropdownOptions() {
    const dropdowns = [
      { 
        selector: '#selectGlavnaKategorija option[value=""]', 
        textKey: 'selectMainCategory' 
      },
      { 
        selector: '#selectKategorijaPodkategorija option[value=""]', 
        textKey: 'selectCategory' 
      },
      { 
        selector: '#selectPodkategorija option[value=""]', 
        textKey: 'selectSubcategory' 
      }
    ];

    dropdowns.forEach(({ selector, textKey }) => {
      const option = document.querySelector(selector);
      if (option) {
        option.textContent = this.t(textKey);
      }
    });
  }

  // Ažuriraj footer checkbox
  updateFooterCheckbox() {
    // Ažuriraj "Prikaži footer" checkbox
    const footerCheckboxLabel = document.querySelector('label[for="footerEnabled"]');
    if (footerCheckboxLabel) {
      const checkbox = footerCheckboxLabel.querySelector('input');
      if (checkbox) {
        // Kreiraj novi HTML sa prevedenim tekstom
        footerCheckboxLabel.innerHTML = '';
        footerCheckboxLabel.appendChild(checkbox);
        footerCheckboxLabel.appendChild(document.createTextNode(' ' + this.t('showFooter')));
      }
    }

    // Ažuriraj "Footer tekst" label
    const footerTextLabel = document.querySelector('label[for="footerText"]');
    if (footerTextLabel) {
      footerTextLabel.textContent = this.t('footerText');
    }

    // Alternativno mapiranje za sve labele koji sadrže "Footer tekst"
    const allLabels = document.querySelectorAll('label');
    allLabels.forEach(label => {
      if (label.textContent.includes('Footer tekst') || 
          label.textContent.includes('Footer text') || 
          label.textContent.includes('Footer-Text')) {
        label.textContent = this.t('footerText');
      }
    });
  }

  // Ažuriraj size recommendation tekstove
  updateSizeRecommendations() {
    const sizeRecommendations = document.querySelectorAll('.size-recommendation');
    
    sizeRecommendations.forEach(element => {
      let currentText = element.innerHTML;
      
      // Zameni "Preporučena veličina" tekst
      currentText = currentText.replace(
        /<strong>.*?(veličina|size|Größe).*?<\/strong>/i,
        `<strong>${this.t('recommendedSize')}:</strong>`
      );
      
      // Zameni "Format" tekst
      currentText = currentText.replace(/(Format|Formats|Formate):/gi, `${this.t('formats')}:`);
      
      // Zameni "Max" tekst  
      currentText = currentText.replace(/(Max|Maximum):/gi, `${this.t('maxSize')}:`);
      
      element.innerHTML = currentText;
    });
  }

  // Ažuriraj primjer sekciju u podkategorijama
  updateExampleSection() {
    const exampleSection = document.querySelector('#podkategorije-tab .form-section div[style*="background: #e3f2fd"]');
    if (exampleSection) {
      const heading = exampleSection.querySelector('h6');
      if (heading) {
        const icon = heading.querySelector('i');
        const iconHTML = icon ? icon.outerHTML + ' ' : '<i class="fas fa-lightbulb"></i> ';
        heading.innerHTML = iconHTML + this.t('examples') + ':';
      }

      const paragraph = exampleSection.querySelector('p');
      if (paragraph) {
        paragraph.innerHTML = `<strong>${this.t('alcoholicDrinks')}:</strong> ${this.t('spirits')}, ${this.t('whiskeys')}, ${this.t('gin')}<br><strong>${this.t('waters')}:</strong> ${this.t('sparkling')}, ${this.t('still')}<br><strong>${this.t('beverages')}:</strong> ${this.t('carbonated')}, ${this.t('naturalJuices')}`;
      }
    }
  }

  // Ažuriraj tekstove u UI komponenti (poziva se iz admin-ui.js)
  updateUITexts() {
    // Ova metoda će biti pozvana iz admin-ui.js kada se osvežavaju liste
    this.applyTranslations();
  }

  // Ažuriraj "Pregled ikone" labele
  updateIconPreviewLabels() {
    // Alternativni način - pronađi sve labele koji sadrže "Pregled ikone"
    const allLabels = document.querySelectorAll('label');
    allLabels.forEach(label => {
      if (label.textContent.includes('Pregled ikone') || 
          label.textContent.includes('Icon preview') || 
          label.textContent.includes('Symbol-Vorschau')) {
        label.textContent = this.t('iconPreview') + ':';
      }
    });

    // Ažuriraj placeholder tekstove u preview containerima
    const previewContainers = [
      { selector: '#glavnaIkonaPreview p', textKey: 'iconNotSelected' },
      { selector: '#ikonaPreview p', textKey: 'iconNotSelected' },
      { selector: '#podkategorijaIkonaPreview p', textKey: 'iconNotSelected' },
      { selector: '#logoPreview p', textKey: 'logoNotSet' }
    ];

    previewContainers.forEach(({ selector, textKey }) => {
      const element = document.querySelector(selector);
      if (element && element.textContent && 
          (element.textContent.includes('nije odabrana') || 
           element.textContent.includes('not selected') || 
           element.textContent.includes('nicht ausgewählt') ||
           element.textContent.includes('nije postavljen') ||
           element.textContent.includes('not set') ||
           element.textContent.includes('nicht gesetzt'))) {
        element.textContent = this.t(textKey);
      }
    });
  }

  // Dobij prevedeni tekst za poruke
  getConfirmDeleteText(type, name) {
    const confirmKey = `deleteConfirm${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return `${this.t(confirmKey)} "${name}"?`;
  }

  // Dobij prevedeni tekst za empty state
  getEmptyStateText(type) {
    const key = `no${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return this.t(key);
  }

  // Metoda za ažuriranje lista kada se pozove iz drugih skriptova
  refreshTranslations() {
    this.applyTranslations();
  }
}

// Globalna instanca
let translationManager = null;

// Inicijalizuj kada se DOM učita
document.addEventListener('DOMContentLoaded', () => {
  translationManager = new TranslationManager();
  
  // Izloži globalne funkcije za dobijanje prevoda
  window.t = (key, defaultText) => translationManager?.t(key, defaultText) || defaultText;
  window.translationManager = translationManager;
});

// Eksportuj za korišćenje u drugim modulima (ako se koristi kao modul)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslationManager;
}