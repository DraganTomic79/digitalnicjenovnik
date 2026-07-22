/* ===== INDEX SCRIPT ===== */
/* Uvoz Firebase konfiguracije i potrebnih funkcija za rad s bazom podataka */
import { db } from './firebase-config-kafic3.js';
import { collection, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

class MenuApp {
  constructor() {
    /* Glavno stanje aplikacije - sadrži sve podatke i zastavice za praćenje učitavanja */
    this.state = { allMainCategories: [], allCategories: [], allSubcategories: [], allItems: [], isUpdating: false, updateTimeout: null, loadedStates: { glavneKategorije: false, kategorije: false, podkategorije: false, artikli: false } };
    this.currencyCode = '';
    /* Dohvaćanje svih potrebnih DOM elemenata jednim pozivom */
    this.elements = ['categoryTabs', 'tabContent', 'logoContainer', 'siteLogo', 'heroTitle', 'heroSubtitle', 'siteFooter', 'footerText', 'instagramLink', 'facebookLink', 'youtubeLink', 'twitterLink', 'tiktokLink', 'scrollToTop'].reduce((elements, id) => { elements[id] = document.getElementById(id); return elements; }, {});
    this.translationManager = null;
    this.initializeApp();
  }

  /* Čeka da translation manager bude dostupan prije nastavka inicijalizacije */
  waitForTranslationManager() {
    return new Promise((resolve) => {
      if (window.indexTranslationManager) {
        this.translationManager = window.indexTranslationManager;
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.indexTranslationManager) {
            this.translationManager = window.indexTranslationManager;
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      }
    });
  }

  /* Pokretanje aplikacije - učitava podatke, postavlja listenere i inicira UI */
  async initializeApp() {
    console.log('Starting MenuApp...');
    await this.waitForTranslationManager();
    try { 
      await Promise.all([this.loadInitialData(), this.loadWebSettings()]); 
      this.setupRealTimeUpdates(); 
      this.initUIFeatures(); 
    } catch (error) { 
      console.error('Application initialization error:', error); 
      this.showError(); 
    }
  }

  /* Osvježava UI kada se promijene prijevodi */
  refreshWithTranslations() {
    console.log('Refreshing UI with new translations...');
    this.createMainTabs();
  }

  /* Učitava početne podatke iz svih kolekcija */
  async loadInitialData() {
    try {
      console.log('Loading initial data...');
      /* Paralelno učitavanje svih kolekcija za bolju performansu */
      const [glavneKatSnapshot, katSnapshot, podkatSnapshot, meniSnapshot] = await Promise.all([
        this.loadCollection('glavne-kategorije'), 
        this.loadCollection('kategorije'), 
        this.loadCollection('podkategorije'), 
        this.loadCollection('meni')
      ]);
      this.resetState(); 
      this.processSnapshots(glavneKatSnapshot, katSnapshot, podkatSnapshot, meniSnapshot); 
      this.sortDataArrays();
      console.log(`Loaded: ${this.state.allMainCategories.length} main, ${this.state.allCategories.length} categories, ${this.state.allSubcategories.length} subcategories, ${this.state.allItems.length} items`);
      this.createMainTabs();
    } catch (error) { 
      console.error('Data loading error:', error); 
      this.showError(); 
    }
  }

  /* Učitava jednu kolekciju sa fallback opcijama */
  async loadCollection(collectionName) {
    try { 
      return await getDocs(query(collection(db, collectionName), orderBy("sortOrder", "asc"))); 
    } catch (error) { 
      try { 
        return await getDocs(collection(db, collectionName)); 
      } catch (fallbackError) { 
        return { forEach: () => {} }; 
      } 
    }
  }

  /* Resetuje stanje aplikacije prije učitavanja novih podataka */
  resetState() { 
    this.state.allMainCategories = []; 
    this.state.allCategories = []; 
    this.state.allSubcategories = []; 
    this.state.allItems = []; 
  }

  /* Obrađuje podatke iz svih kolekcija */
  processSnapshots(glavneKatSnapshot, katSnapshot, podkatSnapshot, meniSnapshot) {
    this.processSnapshot(glavneKatSnapshot, this.state.allMainCategories);
    katSnapshot.forEach(doc => { 
      const data = doc.data(); 
      this.state.allCategories.push({ 
        id: doc.id, 
        ...data, 
        sortOrder: data.sortOrder || 999, 
        glavnaKategorijaId: data.glavnaKategorijaId || null 
      }); 
    });
    podkatSnapshot.forEach(doc => { 
      const data = doc.data(); 
      this.state.allSubcategories.push({ 
        id: doc.id, 
        ...data, 
        sortOrder: data.sortOrder || 999, 
        kategorijaId: data.kategorijaId || null 
      }); 
    });
    this.processSnapshot(meniSnapshot, this.state.allItems);
  }

  /* Obrađuje pojedinačni Firestore snapshot i dodaje podatke u ciljni niz */
  processSnapshot(snapshot, targetArray) { 
    if (snapshot && snapshot.forEach) 
      snapshot.forEach(doc => targetArray.push({ 
        id: doc.id, 
        ...doc.data(), 
        sortOrder: doc.data().sortOrder || 999 
      })); 
  }

  /* Sortira nizove podataka po redoslijedu */
  sortDataArrays() { 
    const sortByOrder = (a, b) => (a.sortOrder || 999) - (b.sortOrder || 999); 
    this.state.allMainCategories.sort(sortByOrder); 
    this.state.allCategories.sort(sortByOrder); 
    this.state.allSubcategories.sort(sortByOrder); 
  }

  /* Kreira glavni prikaz tabova na stranici */
  createMainTabs() {
    if (this.state.isUpdating) return;
    this.state.isUpdating = true; 
    this.clearContainers();
    const useHierarchical = this.state.allMainCategories.length > 0;
    if (useHierarchical) this.createHierarchicalTabs(); 
    else this.createFlatTabs();
    this.state.isUpdating = false;
  }

  /* Kreira hijerarhijski prikaz kada postoje glavne kategorije */
  createHierarchicalTabs() {
    let tabsCreated = 0;
    this.state.allMainCategories.forEach((glavnaKategorija, index) => {
      const kategorije = this.getSubcategoriesForMain(glavnaKategorija.id);
      if (kategorije.length === 0) return;
      const isActive = index === 0;
      this.createTabButton(glavnaKategorija, isActive, true); 
      this.createTabPanel(glavnaKategorija, kategorije, isActive, true);
      tabsCreated++;
    });
  }

  /* Dohvaća kategorije koje pripadaju glavnoj kategoriji */
  getSubcategoriesForMain(glavnaKategorijaId) { 
    const cats = this.state.allCategories.filter(kat => kat.glavnaKategorijaId === glavnaKategorijaId);
    return cats.filter(kat => {
      const subcats = this.getSubcategoriesForCategory(kat.id);
      return subcats.length > 0;
    });
  }

  /* Dohvaća podkategorije za kategoriju */
  getSubcategoriesForCategory(kategorijaId) { 
    const subcats = this.state.allSubcategories.filter(podkat => podkat.kategorijaId === kategorijaId);
    return subcats.filter(podkat => {
      const items = this.getItemsForSubcategory(podkat.naziv);
      return items.length > 0;
    });
  }

  /* Kreira jednostavan prikaz kada nema glavnih kategorija */
  createFlatTabs() {
    const podkategorijeSSadrzajem = this.state.allSubcategories.filter(podkat => {
      const items = this.getItemsForSubcategory(podkat.naziv);
      return items.length > 0;
    });
    if (podkategorijeSSadrzajem.length === 0) { 
      this.createFallbackWithKategorije(); 
      return; 
    }
    podkategorijeSSadrzajem.forEach((podkategorija, index) => {
      const isActive = index === 0;
      this.createTabButton(podkategorija, isActive, false); 
      this.createTabPanel(podkategorija, null, isActive, false);
    });
  }

  /* Kreira fallback prikaz kada nema podkategorija sa sadržajem */
  createFallbackWithKategorije() {
    const kategorijeSSadrzajem = this.state.allCategories.filter(kat => {
      const items = this.getItemsForSubcategory(kat.naziv);
      return items.length > 0;
    });
    if (kategorijeSSadrzajem.length === 0) { 
      this.showEmptyState(); 
      return; 
    }
    kategorijeSSadrzajem.forEach((kategorija, index) => {
      const isActive = index === 0;
      this.createTabButton(kategorija, isActive, false); 
      this.createTabPanel(kategorija, null, isActive, false);
    });
  }

  /* Kreira gumb za tab kategorije ili podkategorije */
  createTabButton(item, isActive, isMainCategory) {
    const tabButton = document.createElement('button');
    const isPromocija = !isMainCategory && this.isPromotion(item);
    const baseClasses = `tab-button ${isActive ? 'active' : ''}`;
    tabButton.className = isPromocija ? `${baseClasses} promocija-tab` : baseClasses;
    
    // AŽURIRANO: Različita polja za ikone
    let ikonaField, defaultIcon, iconClass;
    if (isMainCategory) {
      ikonaField = 'ikona'; // Glavna kategorija koristi 'ikona'
      defaultIcon = 'fas fa-layer-group';
      iconClass = 'main-category-icon';
    } else {
      ikonaField = 'ikonaKategorije'; // Ostalo koristi 'ikonaKategorije'
      defaultIcon = 'fas fa-tag';
      iconClass = 'category-icon';
    }
    
    const ikonaVal = item[ikonaField];
    const ikonaHTML = ikonaVal && ikonaVal.startsWith('http')
      ? `<img src="${ikonaVal}" alt="${item.naziv}" class="${iconClass}" />`
      : `<i class="fas ${(ikonaVal && ikonaVal.startsWith('fa-')) ? ikonaVal : defaultIcon}"></i>`;
    
    // AŽURIRANO: Prevedi naziv (RADI ZA SVE - glavne kategorije, kategorije, podkategorije)
    const translatedName = this.translationManager ? this.translationManager.translateCategory(item.naziv) : item.naziv;
    
    tabButton.innerHTML = `${ikonaHTML} ${translatedName}`;
    tabButton.onclick = () => this.switchTab(item.id, tabButton);
    if (this.elements.categoryTabs) { 
      this.elements.categoryTabs.appendChild(tabButton); 
    }
  }

  /* Kreira panel sa sadržajem za tab */
  createTabPanel(item, kategorije, isActive, isHierarchical) {
    const tabPanel = document.createElement('div');
    tabPanel.className = `tab-panel ${isActive ? 'active' : ''}`;
    tabPanel.id = `tab-${item.id}`;
    tabPanel.innerHTML = isHierarchical ? this.createCategoryAccordionContent(kategorije) : this.createSubcategoryContent(item);
    if (this.elements.tabContent) { 
      this.elements.tabContent.appendChild(tabPanel); 
    }
  }

  /* Kreira sadržaj accordion menija za kategorije */
  createCategoryAccordionContent(kategorije) {
    if (!kategorije || kategorije.length === 0) return this.createEmptyState('No items in this category');
    const accordionItems = kategorije.map(kategorija => {
      const podkategorije = this.getSubcategoriesForCategory(kategorija.id);
      return podkategorije.length > 0 ? this.createCategoryAccordionItem(kategorija, podkategorije) : '';
    }).filter(item => item !== '').join('');
    return `<div class="category-accordion">${accordionItems}</div>`;
  }

  /* Provjerava da li je kategorija alkoholna */
  isAlcoholicCategory(kategorija) {
    if (!kategorija || !kategorija.naziv) return false;
    const naziv = kategorija.naziv.toLowerCase();
    if (naziv.includes('bez') || naziv.includes('non') || naziv.includes('zero') || naziv.includes('0%')) return false;
    return naziv.includes('alkohol') && !naziv.includes('bezalkohol') || naziv === 'alkoholna pića' || naziv === 'alkoholna pica' || naziv.includes('vina') || naziv.includes('cigarete') || naziv.includes('piva') && !naziv.includes('bezalkohol') || naziv.includes('žestok') || naziv.includes('žestoka') || naziv.includes('žestice') || naziv.includes('rakije') || naziv.includes('whiskey') || naziv.includes('vodka') || naziv.includes('rum') || naziv.includes('gin') || naziv.includes('brandy') || naziv.includes('konjak') || naziv.includes('cocktail') || naziv.includes('koktel') || naziv.includes('vinjak') || naziv.includes('tequila') || naziv.includes('likeri-aperitivi');
  }

  /* Provjerava da li je podkategorija alkoholna */
  isAlcoholicSubcategory(podkategorija) {
    if (!podkategorija || !podkategorija.naziv) return false;
    const naziv = podkategorija.naziv.toLowerCase();
    if (naziv.includes('bez') || naziv.includes('non') || naziv.includes('zero') || naziv.includes('0%')) return false;
    return naziv.includes('alkohol') && !naziv.includes('bezalkohol') || naziv === 'alkoholna pića' || naziv === 'alkoholna pica' || naziv.includes('vina') || naziv.includes('cigarete') || naziv.includes('piva') && !naziv.includes('bezalkohol') || naziv.includes('žestok') || naziv.includes('žestoka') || naziv.includes('žestice') || naziv.includes('rakije') || naziv.includes('whiskey') || naziv.includes('vodka') || naziv.includes('rum') || naziv.includes('gin') || naziv.includes('brandy') || naziv.includes('konjak') || naziv.includes('cocktail') || naziv.includes('koktel') || naziv.includes('vinjak') || naziv.includes('tequila') || naziv.includes('likeri-aperitivi');
  }

  /* Kreira stavku u accordion meniju za kategoriju */
  createCategoryAccordionItem(kategorija, podkategorije) {
    // AŽURIRANO: Ikona kategorije može biti u 'ikonaKategorije' ili 'ikona' polju
    const _katIkonaVal = kategorija.ikonaKategorije || kategorija.ikona;
    const categoryIcon = _katIkonaVal && _katIkonaVal.startsWith('http')
      ? `<img src="${_katIkonaVal}" alt="${kategorija.naziv}" class="category-icon" />`
      : `<i class="fas ${(_katIkonaVal && _katIkonaVal.startsWith('fa-')) ? _katIkonaVal : 'fa-folder'}"></i>`;
        
    const totalItems = podkategorije.reduce((sum, podkat) => sum + this.getItemsForSubcategory(podkat.naziv).length, 0);
    const isPromocija = this.isPromotion(kategorija);
    const isAlcoholic = this.isAlcoholicCategory(kategorija);
    const promocijaClass = isPromocija ? ' promocija-subcategory' : '';
    const promocijaButtonClass = isPromocija ? ' promocija-button' : '';
    const ageRestrictorHtml = isAlcoholic ? '<span class="age-restrictor">18+</span>' : '';
    
    // AŽURIRANO: PREVEDI kategoriju
    const translatedName = this.translationManager ? this.translationManager.translateCategory(kategorija.naziv) : kategorija.naziv;
    
    return `<div class="accordion-item${promocijaClass}"><button class="accordion-button${promocijaButtonClass}" onclick="window.menuApp.toggleCategoryAccordion('${kategorija.id}', this)" type="button"><div class="accordion-left">${categoryIcon}<span class="accordion-title">${translatedName}${ageRestrictorHtml}</span></div><span class="item-count">${totalItems}</span><i class="fas fa-chevron-down accordion-arrow"></i></button><div class="accordion-content" id="category-accordion-${kategorija.id}"><div class="subcategory-container">${this.createSubcategoryAccordionContent(podkategorije, kategorija)}</div></div></div>`;
  }

  /* Kreira sadržaj accordion menija za podkategorije */
  createSubcategoryAccordionContent(podkategorije, parentCategory = null) {
    if (!podkategorije || podkategorije.length === 0) return this.createEmptyState('No items in this subcategory');
    const accordionItems = podkategorije.map(podkategorija => {
      const artikli = this.getItemsForSubcategory(podkategorija.naziv);
      return artikli.length > 0 ? this.createSubcategoryAccordionItem(podkategorija, artikli, parentCategory) : '';
    }).filter(item => item !== '').join('');
    return `<div class="subcategory-accordion">${accordionItems}</div>`;
  }

  /* Kreira stavku u accordion meniju za podkategoriju */
  createSubcategoryAccordionItem(podkategorija, artikli, parentCategory = null) {
    // AŽURIRANO: Podkategorija može koristiti 'ikona' ili 'ikonaKategorije'
    const _podIkonaVal = podkategorija.ikona || podkategorija.ikonaKategorije;
    const subcategoryIcon = _podIkonaVal && _podIkonaVal.startsWith('http')
      ? `<img src="${_podIkonaVal}" alt="${podkategorija.naziv}" class="subcategory-icon" />`
      : `<i class="fas ${(_podIkonaVal && _podIkonaVal.startsWith('fa-')) ? _podIkonaVal : 'fa-tag'}"></i>`;
        
    const itemsHTML = this.createItemsHTML(artikli);
    const hasPromocijaItems = this.isPromotion(podkategorija);
    const isAlcoholic = this.isAlcoholicSubcategory(podkategorija);
    const parentIsAlcoholic = parentCategory ? this.isAlcoholicCategory(parentCategory) : false;
    const ageRestrictorHtml = (isAlcoholic && !parentIsAlcoholic) ? '<span class="age-restrictor">18+</span>' : '';
    const itemsContainer = hasPromocijaItems ? `<div class="promocija-group"><div class="items-container">${itemsHTML}</div></div>` : `<div class="items-container">${itemsHTML}</div>`;
    
    // AŽURIRANO: PREVEDI podkategoriju
    const translatedName = this.translationManager ? this.translationManager.translateCategory(podkategorija.naziv) : podkategorija.naziv;
    
    return `<div class="accordion-item subcategory-item"><button class="accordion-button subcategory-button" onclick="window.menuApp.toggleSubcategoryAccordion('${podkategorija.id}', this)" type="button"><div class="accordion-left">${subcategoryIcon}<span class="accordion-title">${translatedName}${ageRestrictorHtml}</span></div><span class="item-count">${artikli.length}</span><i class="fas fa-chevron-down accordion-arrow"></i></button><div class="accordion-content" id="subcategory-accordion-${podkategorija.id}">${itemsContainer}</div></div>`;
  }

  /* Kreira sadržaj za podkategoriju */
  createSubcategoryContent(item) {
    const itemArtikli = this.getItemsForSubcategory(item.naziv);
    if (itemArtikli.length === 0) return this.createEmptyState('No items in this subcategory');
    const itemsHTML = this.createItemsHTML(itemArtikli);
    const itemsContainer = `<div class="items-container">${itemsHTML}</div>`;
    return this.isPromotion(item) ? `<div class="promocija-group">${itemsContainer}</div>` : itemsContainer;
  }

  /* Otvara/zatvara accordion za kategoriju */
  toggleCategoryAccordion(kategorijaId, buttonElement) {
    const content = document.getElementById(`category-accordion-${kategorijaId}`);
    const arrow = buttonElement.querySelector('.accordion-arrow');
    if (!content || !arrow) return;
    const isCurrentlyActive = buttonElement.classList.contains('active');
    const accordionContainer = buttonElement.closest('.category-accordion');
    this.closeAllAccordions(accordionContainer);
    if (!isCurrentlyActive) this.toggleAccordionState(buttonElement, content, arrow, true);
  }

  /* Otvara/zatvara accordion za podkategoriju */
  toggleSubcategoryAccordion(podkategorijaId, buttonElement) {
    const content = document.getElementById(`subcategory-accordion-${podkategorijaId}`);
    const arrow = buttonElement.querySelector('.accordion-arrow');
    if (!content || !arrow) return;
    const isCurrentlyActive = buttonElement.classList.contains('active');
    const accordionContainer = buttonElement.closest('.subcategory-accordion');
    this.closeAllSubcategoryAccordions(accordionContainer);
    if (!isCurrentlyActive) this.toggleAccordionState(buttonElement, content, arrow, true);
  }

  /* Mijenja stanje accordion elementa */
  toggleAccordionState(button, content, arrow, isOpen) { 
    const action = isOpen ? 'add' : 'remove'; 
    button.classList[action]('active'); 
    content.classList[action]('active'); 
    arrow.classList[action]('rotated'); 
  }

  /* Zatvara sve otvorene accordion elemente */
  closeAllAccordions(container) { 
    const elements = { 
      buttons: container.querySelectorAll('.accordion-button'), 
      contents: container.querySelectorAll('.accordion-content'), 
      arrows: container.querySelectorAll('.accordion-arrow') 
    }; 
    Object.values(elements).forEach(nodeList => nodeList.forEach(element => element.classList.remove('active', 'rotated'))); 
  }

  /* Zatvara sve otvorene podkategorije */
  closeAllSubcategoryAccordions(container) { 
    const elements = { 
      buttons: container.querySelectorAll('.subcategory-button'), 
      contents: container.querySelectorAll('.accordion-content'), 
      arrows: container.querySelectorAll('.accordion-arrow') 
    }; 
    Object.values(elements).forEach(nodeList => nodeList.forEach(element => element.classList.remove('active', 'rotated'))); 
  }

  /* Dohvaća stavke za podkategoriju (samo aktivne) */
  getItemsForSubcategory(podkategorijaNaziv) { 
    const items = this.state.allItems.filter(item => 
      (item.podkategorija === podkategorijaNaziv || item.kategorija === podkategorijaNaziv)
      && item.aktivna !== false
    );
    return items.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)); 
  }

  /* Kreira HTML za prikaz stavki */
  createItemsHTML(artikli) {
    return artikli.map(item => {
      const imageElement = item.slikaURL ? this.createImageWithFallback(item) : '<div class="item-placeholder"><i class="fas fa-image"></i></div>';
      const priceDisplay = this.currencyCode && this.currencyCode.trim() !== '' ? `${this.currencyCode} ${this.sanitizeHtml(item.cijena)}` : `${this.sanitizeHtml(item.cijena)}`;
      
      // AŽURIRANO: Prevedi naziv i opis artikla korišćenjem odgovarajućih funkcija
      const translatedNaziv = this.translationManager ? 
        this.translationManager.translateItem(item.naziv) : item.naziv;
      
      let translatedDescription = "";
      if (item.opis) {
        translatedDescription = this.translationManager ? 
          this.translationManager.translateDescription(item.opis) : item.opis;
      }
      const translatedOpis2 = item.opis2 ? (this.translationManager ? this.translationManager.translateDescription(item.opis2) : item.opis2) : '';
      const opis2 = translatedOpis2 ? this.sanitizeHtml(translatedOpis2) : ''; return `<div class="item-card">${imageElement}<div class="item-info"><div class="item-name">${this.sanitizeHtml(translatedNaziv)}</div><div class="item-description">${this.sanitizeHtml(translatedDescription)}</div>${opis2 ? `<div class="item-description2">${opis2}</div>` : ''}</div><div class="item-price">${priceDisplay}</div></div>`;
    }).join('');
  }

  /* Kreira sliku sa fallback opcijom */
  createImageWithFallback(item) {
    const translatedNaziv = this.translationManager ? 
      this.translationManager.translateItem(item.naziv) : item.naziv;
    const altText = this.sanitizeHtml(translatedNaziv);
    const imageId = `img-${item.id || Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => {
      const imgElement = document.getElementById(imageId);
      if (imgElement) {
        imgElement.addEventListener('click', () => this.openImageModal(item.slikaURL, altText, item));
        imgElement.addEventListener('error', () => { 
          imgElement.style.display = 'none'; 
          const placeholder = imgElement.nextElementSibling; 
          if (placeholder) placeholder.style.display = 'flex'; 
        });
      }
    }, 10);
    return `<img id="${imageId}" src="${item.slikaURL}" alt="${altText}" class="item-image clickable-image" style="cursor: pointer;" /><div class="item-placeholder" style="display: none;"><i class="fas fa-image"></i></div>`;
  }

  /* Otvara modalni prozor sa slikom */
  openImageModal(imageUrl, altText, item = null) {
    document.body.style.overflow = 'hidden';
    const modal = this.createImageModal(imageUrl, altText, item);
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('modal-visible'));
  }

  /* Kreira modalni prozor za prikaz slike */
  createImageModal(imageUrl, altText, item = null) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', `Image of ${altText}`);
    modal.addEventListener('click', (e) => { if (e.target === modal) this.closeImageModal(modal); });
    
    const loaderHTML = this.translationManager 
      ? this.translationManager.getModalLoaderHTML() 
      : `<div class="modal-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading image...</span></div>`;
      
    const closeLabel = this.translationManager 
      ? this.translationManager.t('closeImage') 
      : 'Close image';

    // Info panel ispod slike
    let infoHTML = '';
    if (item) {
      const naziv = this.translationManager ? this.translationManager.translateItem(item.naziv) : item.naziv;
      const opis = item.opis ? (this.translationManager ? this.translationManager.translateDescription(item.opis) : item.opis) : '';
      const cijenaVal = item.cijena !== undefined ? parseFloat(item.cijena).toFixed(2) : '';
      const valuta = this.currencyCode && this.currencyCode.trim() !== '' ? this.currencyCode : 'KM';
      const cijena = cijenaVal ? `${valuta} ${cijenaVal}` : '';
      const jedinica = item.jedinicaMjere ? ` / ${item.jedinicaMjere}` : '';
      infoHTML = `
        <div class="modal-info" onclick="event.stopPropagation()">
          <div class="modal-info-naziv">${this.sanitizeHtml(naziv)}</div>
          ${cijena ? `<div class="modal-info-cijena">${cijena}${this.sanitizeHtml(jedinica)}</div>` : ''}
          ${opis ? `<div class="modal-info-opis">${this.sanitizeHtml(opis)}</div>` : ''}${item.opis2 ? `<div class="modal-info-opis2">${this.sanitizeHtml(this.translationManager ? this.translationManager.translateDescription(item.opis2) : item.opis2)}</div>` : ''}
        </div>`;
    }
    
    modal.innerHTML = `
      ${loaderHTML}
      <span class="modal-close" aria-label="${closeLabel}">&times;</span>
      <div class="modal-inner" onclick="event.stopPropagation()">
        <img src="${imageUrl}" alt="${altText}" class="modal-content" />
        ${infoHTML}
      </div>
    `;
    
    const closeButton = modal.querySelector('.modal-close'); 
    closeButton.addEventListener('click', () => this.closeImageModal(modal));
    const img = modal.querySelector('.modal-content'); 
    img.addEventListener('load', () => { 
      const loader = modal.querySelector('.modal-loader'); 
      if (loader) loader.style.display = 'none'; 
    }); 
    img.addEventListener('error', () => this.handleImageError(img));
    
    return modal;
  }

  /* Zatvara modalni prozor sa slikom */
  closeImageModal(modal) { 
    modal.classList.remove('modal-visible'); 
    setTimeout(() => { 
      if (modal.parentElement) document.body.removeChild(modal); 
      document.body.style.overflow = 'auto'; 
    }, 300); 
  }

  /* Prikazuje grešku kada slika ne može biti učitana */
  handleImageError(img) { 
    const modal = img.closest('.image-modal'); 
    const loader = modal.querySelector('.modal-loader'); 
    if (loader) { 
      if (this.translationManager) {
        loader.innerHTML = this.translationManager.getModalErrorHTML();
      } else {
        loader.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Failed to load image</span>`;
      }
      loader.style.color = '#999'; 
      loader.style.display = 'block'; 
    } 
  }

  /* Učitava web postavke iz baze */
  async loadWebSettings() {
    try {
      const webPostavke = await this.getWebSettings();
      if (webPostavke) {
        if (webPostavke.currencyCode !== undefined) { 
          this.currencyCode = webPostavke.currencyCode || ''; 
        } else { 
          this.currencyCode = ''; 
        }
        await Promise.all([
          this.loadLogo(webPostavke.logoURL), 
          Promise.resolve(this.loadHeroContent(webPostavke)), 
          Promise.resolve(this.loadFooter(webPostavke))
        ]);
      } else { 
        this.currencyCode = ''; 
        this.loadHeroContent(null); 
      }
    } catch (error) { 
      console.error('Error loading web settings:', error); 
      this.currencyCode = ''; 
      this.loadHeroContent(null); 
    }
  }

  /* Dohvaća web postavke iz Firestore-a */
  async getWebSettings() { 
    try { 
      const snapshot = await getDocs(collection(db, "web-postavke")); 
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }; 
    } catch (error) { 
      console.error("Error loading web settings:", error); 
      return null; 
    } 
  }

  /* Učitava logo web stranice */
  async loadLogo(logoURL) {
    if (!logoURL || !this.elements.logoContainer || !this.elements.siteLogo) return;
    return new Promise((resolve) => {
      this.elements.siteLogo.onload = () => { 
        this.elements.logoContainer.style.display = 'block'; 
        resolve(); 
      };
      this.elements.siteLogo.onerror = () => { 
        this.elements.logoContainer.style.display = 'none'; 
        resolve(); 
      };
      this.elements.siteLogo.src = logoURL;
    });
  }

  /* Učitava hero sekciju iz Firebase postavki */
  loadHeroContent(webPostavke) {
    const heroLoading = document.querySelector('.hero-loading');
    if (heroLoading) heroLoading.classList.add('hidden');

    if (!webPostavke) return;

    // Sačuvaj Firebase vrijednosti na app objektu (za translation manager)
    this.heroTitleDB = webPostavke.heroTitle || '';
    this.heroSubtitleDB = webPostavke.heroSubtitle || '';

    // Primijeni odmah ako je aktivan jezik 'sr' (default)
    const currentLang = this.translationManager?.currentLanguage || 'sr';
    if (currentLang === 'sr') {
      const titleEl = document.getElementById('heroTitle');
      const subtitleEl = document.getElementById('heroSubtitle');
      if (titleEl && this.heroTitleDB) {
        titleEl.textContent = this.heroTitleDB;
        titleEl.style.display = 'block';
      }
      if (subtitleEl && this.heroSubtitleDB) {
        subtitleEl.textContent = this.heroSubtitleDB;
        subtitleEl.style.display = 'block';
      }
    }
  }

  /* Učitava footer sekciju */
  loadFooter(webPostavke) { 
    if (!this.elements.siteFooter) return; 
    if (webPostavke && webPostavke.footerEnabled) this.displayFooter(webPostavke); 
    else this.elements.siteFooter.style.display = 'none'; 
  }

  /* Prikazuje footer sa socijalnim linkovima */
  displayFooter(postavke) {
    if (this.elements.footerText) this.elements.footerText.textContent = postavke.footerText || '';
    const socialLinks = [ 
      { element: this.elements.instagramLink, url: postavke.instagramUrl, name: 'Instagram' }, 
      { element: this.elements.facebookLink, url: postavke.facebookUrl, name: 'Facebook' }, 
      { element: this.elements.youtubeLink, url: postavke.youtubeUrl, name: 'YouTube' },
      { element: this.elements.twitterLink, url: postavke.twitterUrl, name: 'X' },
      { element: this.elements.tiktokLink, url: postavke.tiktokUrl, name: 'TikTok' }
    ];
    socialLinks.forEach(({ element, url, name }) => { 
      if (element) { 
        element.style.display = url ? 'inline-flex' : 'none';
        if (url) element.href = url; 
      } 
    });
    this.elements.siteFooter.style.display = 'block';
  }

  /* Postavlja real-time listenere za ažuriranje podataka */
  setupRealTimeUpdates() {
    this.createCollectionListener('glavne-kategorije', 'allMainCategories', 'glavneKategorije');
    this.createCollectionListener('kategorije', 'allCategories', 'kategorije');
    this.createCollectionListener('podkategorije', 'allSubcategories', 'podkategorije');
    this.createCollectionListener('meni', 'allItems', 'artikli');
    this.setupWebPostavkeListener();
  }

  /* Kreira listener za pojedinu kolekciju */
  createCollectionListener(collectionName, stateProperty, loadedStateKey) {
    const handleSnapshot = (snapshot) => {
      this.state[stateProperty] = [];
      snapshot.forEach((doc) => {
        const data = doc.data(); 
        const item = { id: doc.id, ...data, sortOrder: data.sortOrder || 999 };
        if (collectionName === 'kategorije') item.glavnaKategorijaId = data.glavnaKategorijaId || null;
        if (collectionName === 'podkategorije') item.kategorijaId = data.kategorijaId || null;
        this.state[stateProperty].push(item);
      });
      if (stateProperty !== 'allItems') this.state[stateProperty].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      this.state.loadedStates[loadedStateKey] = true; 
      this.scheduleUpdate();
    };
    onSnapshot(query(collection(db, collectionName), orderBy("sortOrder", "asc")), handleSnapshot, () => onSnapshot(collection(db, collectionName), handleSnapshot));
  }

  /* Postavlja listener za web postavke */
  setupWebPostavkeListener() {
    onSnapshot(collection(db, "web-postavke"), (snapshot) => {
      if (!snapshot.empty) {
        const postavke = snapshot.docs[0].data(); 
        const newCurrencyCode = postavke.currencyCode || '';
        if (newCurrencyCode !== this.currencyCode) { 
          this.currencyCode = newCurrencyCode; 
          this.scheduleUpdate(); 
        }
        Promise.all([
          this.loadLogo(postavke.logoURL), 
          Promise.resolve(this.loadHeroContent(postavke)), 
          Promise.resolve(this.loadFooter(postavke))
        ]);
      } else { 
        this.currencyCode = ''; 
        this.loadHeroContent(null); 
        this.loadFooter(null); 
      }
    });
  }

  /* Planira ažuriranje UI-a kada se podaci promijene */
  scheduleUpdate() { 
    if (this.state.updateTimeout) clearTimeout(this.state.updateTimeout); 
    this.state.updateTimeout = setTimeout(() => { 
      const { kategorije, podkategorije, artikli } = this.state.loadedStates; 
      if (kategorije && podkategorije && artikli && !this.state.isUpdating) { 
        this.createMainTabs(); 
      } 
    }, 100); 
  }

  /* Inicijalizira dodatne UI funkcionalnosti */
  initUIFeatures() { 
    this.initScrollToTop(); 
    this.initMobileOptimizations(); 
    this.initKeyboardSupport(); 
  }

  /* Inicijalizira scroll-to-top funkcionalnost */
  initScrollToTop() {
    if (!this.elements.scrollToTop) return; 
    let ticking = false;
    const updateScrollButton = () => { 
      this.elements.scrollToTop.classList.toggle('visible', window.pageYOffset > 300); 
      ticking = false; 
    };
    window.addEventListener('scroll', () => { 
      if (!ticking) { 
        requestAnimationFrame(updateScrollButton); 
        ticking = true; 
      } 
    }, { passive: true });
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    this.elements.scrollToTop.addEventListener('click', scrollToTop);
    this.elements.scrollToTop.addEventListener('keydown', (e) => { 
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        scrollToTop(); 
      } 
    });
  }

  /* Inicijalizira optimizacije za mobilne uređaje */
  initMobileOptimizations() {
    const touchFeedback = {
      start: (e) => { 
        const tabButton = e.target.closest('.tab-button'); 
        if (tabButton) tabButton.style.backgroundColor = 'rgba(0,0,0,0.1)'; 
      },
      end: (e) => { 
        const tabButton = e.target.closest('.tab-button'); 
        if (tabButton) tabButton.style.backgroundColor = ''; 
      }
    };
    document.addEventListener('touchstart', touchFeedback.start, { passive: true });
    document.addEventListener('touchend', touchFeedback.end, { passive: true });
  }

  /* Inicijalizira podršku za tipkovnicu */
  initKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
      const modal = document.querySelector('.image-modal.modal-visible');
      if (modal && e.key === 'Escape') { 
        e.preventDefault(); 
        this.closeImageModal(modal); 
      }
    });
  }

  /* Mijenja aktivni tab */
  switchTab(categoryId, clickedButton) {
    document.querySelectorAll('.tab-button, .tab-panel').forEach(element => element.classList.remove('active'));
    clickedButton.classList.add('active');
    const targetPanel = document.getElementById(`tab-${categoryId}`);
    if (targetPanel) targetPanel.classList.add('active');
  }

  /* Sanitizira HTML tekst */
  sanitizeHtml(text) { 
    if (!text) return ''; 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
  }

  /* Čisti kontejnere za tabove i sadržaj */
  clearContainers() { 
    if (this.elements.categoryTabs) this.elements.categoryTabs.innerHTML = ''; 
    if (this.elements.tabContent) this.elements.tabContent.innerHTML = ''; 
  }

  /* Kreira HTML za prazan prikaz */
  createEmptyState(message) {
    if (this.translationManager) {
      return this.translationManager.getEmptyStateHTML('category');
    }
    return `<div class="empty-state"><i class="fas fa-box-open"></i><h3>${message}</h3><p>We'll be adding new products soon</p></div>`;
  }

  /* Prikazuje prazan prikaz kada nema stavki */
  showEmptyState() {
    this.clearContainers();
    if (this.elements.tabContent) {
      if (this.translationManager) {
        this.elements.tabContent.innerHTML = this.translationManager.getEmptyStateHTML('menu');
      } else {
        this.elements.tabContent.innerHTML = `<div class="empty-state"><i class="fas fa-utensils"></i><h3>Menu will be available soon</h3><p>We're working on preparing our menu</p></div>`;
      }
    }
  }

  /* Prikazuje poruku o grešci */
  showError() {
    this.clearContainers();
    if (this.elements.tabContent) {
      if (this.translationManager) {
        this.elements.tabContent.innerHTML = this.translationManager.getEmptyStateHTML('error');
      } else {
        this.elements.tabContent.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Loading error</h3><p>Please try again later</p></div>`;
      }
    }
  }

  /* Provjerava je li stavka promocija */
  isPromotion(item) { 
    if (!item || !item.naziv) return false;
    const naziv = item.naziv.toLowerCase();
    return naziv.includes('promocija') || naziv.includes('promo') || naziv.includes('special') || naziv.includes('offer') || naziv.includes('akcija') || naziv.includes('specijalna ponuda');
  }
}

/* Inicira aplikaciju nakon učitavanja DOM-a */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('categoryTabs')) { 
    window.menuApp = new MenuApp(); 
  }
});