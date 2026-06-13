/* ===== ADMIN CONTROLLER ===== */
import * as FirebaseService from './admin-firebase.js';
import * as UIService from './admin-ui.js';
import * as Utils from './admin-utils.js';
import { initMobileOptimizations, initTabSystem } from './admin-ui.js';
import { 
  obrisiGlavnuKategorijuKaskadno, 
  obrisiKategorijuKaskadno, 
  obrisiPodkategorijuKaskadno, 
  vratiArtikleIzNepoznate,
  toggleArtikalAktivnost
} from './admin-firebase.js';

class AdminController {
  constructor() {
    this.state = { 
      data: { 
        kategorije: [], 
        artikli: [], 
        glavneKategorije: [], 
        podkategorije: [] 
      }, 
      editIds: { 
        artikal: null, 
        kategorija: null, 
        glavnaKategorija: null, 
        podkategorija: null 
      }, 
      cache: { 
        slikaURL: "", 
        logoURL: "", 
        currencyCode: "" 
      } 
    };
    
    this.entityConfig = {
      glavnaKategorija: { 
        stateProp: 'glavneKategorije', 
        services: { 
          load: FirebaseService.ucitajGlavneKategorije, 
          add: FirebaseService.dodajGlavnuKategoriju, 
          update: FirebaseService.azurirajGlavnuKategoriju, 
          delete: FirebaseService.obrisiGlavnuKategoriju 
        }, 
        validation: (naziv) => naziv ? 
          { isValid: true } : 
          { isValid: false, errors: ['Unesite naziv glavne kategorije'] }, 
        messages: { 
          addSuccess: 'Glavna kategorija je uspješno dodana', 
          updateSuccess: 'Glavna kategorija je uspješno ažurirana', 
          deleteConfirm: (n) => `Obrisati glavnu kategoriju "${n}"?` 
        } 
      },
      kategorija: { 
        stateProp: 'kategorije', 
        services: { 
          load: FirebaseService.ucitajKategorije, 
          add: FirebaseService.dodajKategoriju, 
          update: FirebaseService.azurirajKategoriju, 
          delete: FirebaseService.obrisiKategoriju 
        }, 
        validation: (naziv, existing, editId) => 
          Utils.validirajKategoriju(naziv, existing, editId), 
        messages: { 
          addSuccess: 'Kategorija je uspješno dodana', 
          updateSuccess: 'Kategorija je uspješno ažurirana', 
          deleteConfirm: (n) => `Obrisati kategoriju "${n}"?` 
        } 
      },
      podkategorija: { 
        stateProp: 'podkategorije', 
        services: { 
          load: FirebaseService.ucitajPodkategorije, 
          add: FirebaseService.dodajPodkategoriju, 
          update: FirebaseService.azurirajPodkategoriju, 
          delete: FirebaseService.obrisiPodkategoriju 
        }, 
        validation: (naziv, existing, editId) => 
          Utils.validirajKategoriju(naziv, existing, editId), 
        messages: { 
          addSuccess: 'Podkategorija je uspješno dodana', 
          updateSuccess: 'Podkategorija je uspješno ažurirana', 
          deleteConfirm: (n) => `Obrisati podkategoriju "${n}"?` 
        } 
      },
      artikal: { 
        stateProp: 'artikli', 
        services: { 
          load: FirebaseService.ucitajArtikleSortirane, 
          add: FirebaseService.dodajArtikalSaSortOrder, 
          update: FirebaseService.azurirajArtikal, 
          delete: FirebaseService.obrisiArtikal 
        }, 
        validation: (data) => 
          Utils.validirajArtikal(data.naziv, data.cijena, data.podkategorija), 
        messages: { 
          addSuccess: 'Artikal je uspješno dodan', 
          updateSuccess: 'Artikal je uspješno ažuriran', 
          deleteConfirm: () => 'Obrisati ovaj artikal?' 
        } 
      }
    };
    
    this.initializeApp();
  }

  /* CURRENCY SUFFIX */
  /** Inicijalizuje prikaz oznake valute pored cene */
  initializeCurrencySuffix() {
    Utils.debug.log('Inicijalizujem currency suffix...');
    const currencySuffix = document.querySelector('.currency-suffix');
    
    if (currencySuffix) { 
      const currentCurrency = this.state.cache.currencyCode || ''; 
      Utils.debug.log('Current currency za suffix:', currentCurrency); 
      
      currencySuffix.textContent = currentCurrency; 
      currencySuffix.style.display = currentCurrency ? 'inline-block' : 'none'; 
      currencySuffix.style.minWidth = currentCurrency ? '45px' : '20px'; 
      currencySuffix.style.padding = '0 8px'; 
      currencySuffix.style.fontWeight = 'bold'; 
      currencySuffix.style.color = '#495057'; 
    }
  }

  /** Forsira inicijalizaciju oznake valute sa ponovnim pokušajima */
  forceCurrencySuffixInit() {
    Utils.debug.log('Forsiram inicijalizaciju currency suffix...');
    
    const checkAndInit = () => { 
      const currencySuffix = document.querySelector('.currency-suffix'); 
      Utils.debug.log('Currency suffix element pronađen:', !!currencySuffix); 
      
      if (currencySuffix) { 
        const currentCurrency = this.state.cache.currencyCode || ''; 
        Utils.debug.log('Postavljam currency na:', currentCurrency || '(prazan)'); 
        
        currencySuffix.textContent = currentCurrency; 
        currencySuffix.style.display = 'block'; 
        currencySuffix.style.minWidth = currentCurrency ? '45px' : '20px'; 
        
        const currencyInput = document.getElementById('cijenaArtikla'); 
        if (currencyInput && !currencyInput.dataset.listenerAdded) { 
          currencyInput.dataset.listenerAdded = 'true'; 
          currencyInput.addEventListener('focus', () => { 
            Utils.debug.log('Input focus, provjeravam suffix...'); 
            this.initializeCurrencySuffix(); 
          }); 
        } 
      } else { 
        Utils.debug.log('Currency suffix još nije pronađen, pokušavam ponovo...'); 
        setTimeout(checkAndInit, 500); 
      } 
    };
    
    checkAndInit();
  }

  /* APLIKACIJSKA INICIJALIZACIJA */
  /** Glavna inicijalizacija aplikacije */
  async initializeApp() { 
    try { 
      this.initElements(); 
      this.initEventListeners(); 
      this.initTabSwitching(); 
      
      FirebaseService.initAuth((user) => 
        Utils.debug.log('Korisnik ulogiran:', user.email)
      ); 
      
      await this.loadAllData(); 
      
      setTimeout(() => { 
        initTabSystem(); 
        initMobileOptimizations(); 
        this.forceCurrencySuffixInit(); 
      }, 200); 
    } catch (error) { 
      Utils.debug.error('Greška inicijalizacije:', error); 
      Utils.prikaziPoruku('Greška pokretanja aplikacije', 'error'); 
    } 
  }

  /* INICIJALIZACIJA ELEMENATA */
  /** Inicijalizacija potrebnih DOM elemenata */
  initElements() {
    const groups = { 
      glavnaKategorija: [
        'naziv', 'ikona', 'previewContainer', 'selectGlavnaKategorija',
        'dodaj', 'sacuvaj', 'otkazi', 'listaContainer'
      ], 
      kategorija: [
        'naziv', 'ikona', 'previewContainer', 'selectGlavnaKategorija',
        'dodaj', 'sacuvaj', 'otkazi', 'listaContainer'
      ], 
      podkategorija: [
        'naziv', 'ikona', 'previewContainer', 'kategorijaSelect',
        'dodaj', 'sacuvaj', 'otkazi', 'listaContainer'
      ], 
      artikal: [
        'naziv', 'cijena', 'podkategorijaSelect', 'opis', 'opis2', 'slika',
        'dodaj', 'sacuvaj', 'otkazi', 'listaContainer'
      ], 
      postavke: [
        'logo', 'logoPreview', 'uploadLogo', 'ukloniLogo', 
        'sacuvajPostavke', 'resetPostavke', 'heroTitle', 'heroSubtitle',
        'sacuvajHero', 'resetHero', 'footerText', 'instagramUrl',
        'facebookUrl', 'youtubeUrl', 'twitterUrl', 'tiktokUrl',
        'footerEnabled', 'footerPreview', 'sacuvajFooter', 'resetFooter',
        'currencyCode', 'saveCurrency', 'resetCurrency'
      ] 
    };
    
    this.elements = {}; 
    
    Object.entries(groups).forEach(([group, elements]) => { 
      this.elements[group] = {}; 
      elements.forEach(el => 
        this.elements[group][el] = document.getElementById(this.getElementId(group, el))
      ); 
    });
  }

  /** Generiše ID DOM elementa prema grupi i nazivu */
  getElementId(group, element) {
    const mappings = { 
      glavnaKategorija: { 
        naziv: 'novaGlavnaKategorija', 
        ikona: 'ikonaGlavneKategorije', 
        previewContainer: 'glavnaIkonaPreview', 
        selectGlavnaKategorija: 'selectGlavnaKategorija', 
        dodaj: 'dodajGlavnuKategorijuBtn', 
        sacuvaj: 'sacuvajGlavnuKategorijuBtn', 
        otkazi: 'otkaziGlavnuKategorijuBtn', 
        listaContainer: 'listaGlavnihKategorija' 
      }, 
      kategorija: { 
        naziv: 'novaKategorija', 
        ikona: 'ikonaKategorije', 
        previewContainer: 'ikonaPreview', 
        selectGlavnaKategorija: 'selectGlavnaKategorija', 
        dodaj: 'dodajKategorijuBtn', 
        sacuvaj: 'sacuvajKategorijuBtn', 
        otkazi: 'otkaziKategorijuBtn', 
        listaContainer: 'listaKategorija' 
      }, 
      podkategorija: { 
        naziv: 'novaPodkategorija', 
        ikona: 'ikonaPodkategorije', 
        previewContainer: 'podkategorijaIkonaPreview', 
        kategorijaSelect: 'selectKategorijaPodkategorija', 
        dodaj: 'dodajPodkategorijuBtn', 
        sacuvaj: 'sacuvajPodkategorijuBtn', 
        otkazi: 'otkaziPodkategorijuBtn', 
        listaContainer: 'listaPodkategorija' 
      }, 
      artikal: { 
        naziv: 'nazivArtikla', 
        cijena: 'cijenaArtikla', 
        podkategorijaSelect: 'selectPodkategorija', 
        opis: 'opisArtikla', 
        opis2: 'opisArtikla2', 
        slika: 'slikaArtikla', 
        dodaj: 'dodajArtikalBtn', 
        sacuvaj: 'sacuvajIzmjenuBtn', 
        otkazi: 'otkaziIzmjenuBtn', 
        listaContainer: 'listaArtikala' 
      }, 
      postavke: { 
        logo: 'logoInput', 
        logoPreview: 'logoPreview', 
        uploadLogo: 'uploadLogoBtn', 
        ukloniLogo: 'ukloniLogoBtn', 
        sacuvajPostavke: 'sacuvajPostavkeBtn', 
        resetPostavke: 'resetPostavkeBtn', 
        heroTitle: 'heroTitle', 
        heroSubtitle: 'heroSubtitle', 
        sacuvajHero: 'sacuvajHeroBtn', 
        resetHero: 'resetHeroBtn', 
        footerText: 'footerText', 
        instagramUrl: 'instagramUrl', 
        facebookUrl: 'facebookUrl', 
        youtubeUrl: 'youtubeUrl', 
        twitterUrl: 'twitterUrl', 
        tiktokUrl: 'tiktokUrl', 
        footerEnabled: 'footerEnabled', 
        footerPreview: 'footerPreview', 
        sacuvajFooter: 'sacuvajFooterBtn', 
        resetFooter: 'resetFooterBtn', 
        currencyCode: 'currencyCode', 
        saveCurrency: 'saveCurrencyBtn', 
        resetCurrency: 'resetCurrencyBtn' 
      } 
    };
    
    return mappings[group]?.[element] || 
      `${group}${element.charAt(0).toUpperCase()}${element.slice(1)}`;
  }

  /* EVENT LISTENERS */
  /** Inicijalizacija svih event listenera */
  initEventListeners() { 
    Object.keys(this.entityConfig).forEach(entity => { 
      const el = this.elements[entity]; 
      if (!el) return; 
      
      this.addHandler(el.dodaj, 'click', () => this.handleEntity(entity, 'add')); 
      this.addHandler(el.sacuvaj, 'click', () => this.handleEntity(entity, 'save')); 
      this.addHandler(el.otkazi, 'click', () => this.handleEntity(entity, 'cancel')); 
      this.addHandler(el.ikona, 'change', () => this.handlePreview(entity)); 
      this.addHandler(el.naziv, 'keypress', (e) => 
        e.key === 'Enter' && (this.state.editIds[entity] ? 
          this.handleEntity(entity, 'save') : 
          this.handleEntity(entity, 'add'))
      ); 
    }); 
    
    this.addHandler(
      this.elements.podkategorija.kategorijaSelect, 
      'change', 
      () => this.filterPodkategorije()
    ); 
    
    this.initPostavkeHandlers(); 
  }

  /** Inicijalizacija handlera za postavke */
  initPostavkeHandlers() {
    const p = this.elements.postavke; 
    if (!p) return;
    
    // Ispravljen handler
this.addHandler(p.uploadLogo, 'click', () => this.handleLogo('upload'));
this.addHandler(p.ukloniLogo, 'click', () => this.handleLogo('remove'));
this.addHandler(p.resetPostavke, 'click', () => this.handleLogo('reset'));
    
    this.addHandler(p.logo, 'change', () => this.handlePreview('logo'));
    this.addHandler(p.saveCurrency, 'click', () => this.saveCurrencySettings());
    this.addHandler(p.resetCurrency, 'click', () => this.resetCurrencySettings());
    this.addHandler(p.currencyCode, 'keypress', (e) => 
      e.key === 'Enter' && this.saveCurrencySettings()
    );
    
    this.addHandler(p.sacuvajHero, 'click', () => this.saveHeroSection());
    this.addHandler(p.resetHero, 'click', () => this.resetHeroSection());
    this.addHandler(p.sacuvajFooter, 'click', () => this.saveFooterSettings());
    this.addHandler(p.resetFooter, 'click', () => this.resetFooterSettings());
    this.addHandler(p.sacuvajPostavke, 'click', () => this.saveWebSettings());
    
    ['footerText', 'instagramUrl', 'facebookUrl', 'youtubeUrl', 'twitterUrl', 'tiktokUrl'].forEach(
      field => this.addHandler(p[field], 'input', () => this.updateFooterPreview())
    );
    
    this.addHandler(p.footerEnabled, 'change', () => this.updateFooterPreview());
  }

  /** Dodaje handler za događaj ako element postoji */
  addHandler(element, event, handler) { 
    if (element) 
      element.addEventListener(event, handler); 
  }

  /** Inicijalizacija za prebacivanje između tabova */
  initTabSwitching() { 
    document.querySelectorAll('.tab-btn').forEach(btn => { 
      btn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        const targetTab = btn.getAttribute('data-tab'); 
        
        if (window.innerWidth < 992) { 
          document.querySelectorAll('.tab-btn, .tab-content').forEach(el => 
            el.classList.remove('active')
          ); 
          
          btn.classList.add('active'); 
          
          const content = document.getElementById(targetTab + '-tab'); 
          if (content) 
            content.classList.add('active'); 
          else 
            document.getElementById('glavne-kategorije-tab')?.classList.add('active'); 
        } 
        
        if (targetTab === 'postavke') 
          this.loadWebSettings(); 
          
        if (targetTab === 'artikli') { 
          setTimeout(() => { 
            this.initializeCurrencySuffix(); 
            this.updateCurrencySuffix(); 
          }, 300); 
        } 
      }); 
    }); 
  }

  /* UČITAVANJE PODATAKA */
  /** Učitavanje svih podataka iz firebase baze */
  async loadAllData() { 
    const containers = Object.values(this.elements)
      .filter(s => s.listaContainer)
      .map(s => s.listaContainer); 
      
    containers.forEach(c => UIService.showLoading(c)); 
    
    try { 
      await Promise.all([ 
        this.loadEntity('glavnaKategorija'), 
        this.loadEntity('kategorija'), 
        this.loadEntity('podkategorija'), 
        this.loadEntity('artikal'), 
        this.loadWebSettings() 
      ]); 
      
      setTimeout(() => this.initializeCurrencySuffix(), 100); 
      setTimeout(() => this.initializeCurrencySuffix(), 500); 
      setTimeout(() => this.initializeCurrencySuffix(), 1000); 
    } catch (error) { 
      Utils.debug.error('Greška učitavanja:', error); 
      containers.forEach(c => UIService.showError(c, 'Greška učitavanja')); 
    } 
  }

  /** Učitavanje pojedinačnog entiteta */
  async loadEntity(entityType) { 
    try { 
      const config = this.entityConfig[entityType]; 
      if (!config) return; 
      
      this.state.data[config.stateProp] = await config.services.load(); 
      await this.updateUI(entityType); 
    } catch (error) { 
      Utils.debug.error(`Greška učitavanja ${entityType}:`, error); 
      UIService.showError(
        this.elements[entityType]?.listaContainer, 
        `Greška učitavanja ${entityType}`
      ); 
    } 
  }

  /* ENTITY HANDLERS */
  /** Upravlja akcijama nad entitetima */
  async handleEntity(entityType, action, ...args) { 
    const handlers = { 
      add: () => this.addEntity(entityType), 
      save: () => this.saveEntity(entityType), 
      cancel: () => this.cancelEntity(entityType), 
      edit: (data) => this.editEntity(entityType, data), 
      delete: (id, naziv) => this.deleteEntity(entityType, id, naziv) 
    }; 
    
    if (handlers[action]) 
      await handlers[action](...args); 
  }

  /** Dodaje novi entitet */
  async addEntity(entityType) {
    const config = this.entityConfig[entityType]; 
    const elements = this.elements[entityType]; 
    
    if (!config || !elements) 
      return;
      
    if (this.state.editIds[entityType]) 
      return Utils.prikaziPoruku('Završite trenutno uređivanje prije dodavanja novog elementa', 'warning');

    try {
      if (entityType === 'podkategorija') { 
        const kategorijaSelect = elements.kategorijaSelect; 
        if (!kategorijaSelect || !kategorijaSelect.value || kategorijaSelect.value.trim() === '') 
          return Utils.prikaziPoruku('Molimo odaberite kategoriju prije dodavanja podkategorije', 'error'); 
      }
      
      const data = this.extractFormData(entityType); 
      Utils.debug.log('Ekstraktovani podaci:', data);
      
      if (entityType === 'artikal') { 
        Utils.debug.log('Provjeravam podkategoriju:', data.podkategorija); 
        if (!data.podkategorija || data.podkategorija === '') { 
          Utils.debug.log('Podkategorija je prazna!'); 
          return Utils.prikaziPoruku('Molimo odaberite podkategoriju', 'error'); 
        } 
      }
      
      const validation = config.validation(
        entityType === 'artikal' ? data : data.naziv, 
        this.state.data[config.stateProp], 
        null
      ); 
      
      Utils.debug.log('Validacija rezultat:', validation); 
      if (!validation.isValid) 
        return Utils.prikaziPoruku(validation.errors.join('\n'), 'error');

      let imageURL = ""; 
      if (data.imageFile) { 
        const imgValidation = Utils.validirajSliku(data.imageFile); 
        if (!imgValidation.isValid) 
          return Utils.prikaziPoruku(imgValidation.errors.join('\n'), 'error'); 
        
        imageURL = await FirebaseService.uploadSlika(data.imageFile); 
      }

      Utils.setLoadingState(elements.dodaj, true); 
      const entityData = this.prepareEntityData(entityType, data, imageURL); 
      Utils.debug.log('Pripravljeni podaci za slanje:', entityData);
      
      if (entityType === 'podkategorija') 
        await config.services.add(entityData.naziv, entityData.ikona, entityData.kategorijaId); 
      else if (entityType === 'glavnaKategorija') 
        await config.services.add(entityData.naziv, entityData.sortOrder, entityData.ikona); 
      else if (entityType === 'kategorija') 
        await config.services.add(entityData.naziv, entityData.ikona, entityData.glavnaKategorijaId); 
      else if (entityType === 'artikal') 
        await config.services.add(entityData.artikal);
      
      this.clearForm(entityType); 
      await this.loadEntity(entityType); 
      
      if (entityType === 'kategorija') 
        await this.loadEntity('podkategorija'); 
        
      if (entityType === 'podkategorija') 
        await this.loadEntity('artikal'); 
        
      Utils.prikaziPoruku(config.messages.addSuccess, 'success');
    } catch (error) { 
      Utils.debug.error(`Greška dodavanja ${entityType}:`, error); 
      Utils.prikaziPoruku(`Greška dodavanja ${entityType}: ${error.message}`, 'error'); 
    } finally { 
      Utils.setLoadingState(elements.dodaj, false); 
    }
  }

  /** Čuva izmene na entitetu */
  async saveEntity(entityType) {
    const editId = this.state.editIds[entityType]; 
    if (!editId) return; 
    
    const config = this.entityConfig[entityType]; 
    const elements = this.elements[entityType]; 
    
    if (!config || !elements) return;

    try {
      const data = this.extractFormData(entityType); 
      
      if (entityType === 'artikal' && (!data.podkategorija || data.podkategorija.trim() === '')) 
        return Utils.prikaziPoruku('Molimo odaberite podkategoriju', 'error'); 
        
      const validation = config.validation(
        entityType === 'artikal' ? data : data.naziv, 
        this.state.data[config.stateProp], 
        editId
      ); 
      
      if (!validation.isValid) 
        return Utils.prikaziPoruku(validation.errors.join('\n'), 'error');

      const currentEntity = this.state.data[config.stateProp].find(item => item.id === editId); 
      let imageURL = currentEntity ? 
        (currentEntity.ikona || currentEntity.ikonaKategorije || currentEntity.slikaURL || "") : 
        ""; 
        
      if (data.imageFile) { 
        const imgValidation = Utils.validirajSliku(data.imageFile); 
        if (!imgValidation.isValid) 
          return Utils.prikaziPoruku(imgValidation.errors.join('\n'), 'error'); 
          
        imageURL = await FirebaseService.uploadSlika(data.imageFile); 
      }

      Utils.setLoadingState(elements.sacuvaj, true); 
      const updateData = this.prepareUpdateData(entityType, data, imageURL, currentEntity); 
      await config.services.update(editId, updateData);

      this.cancelEntity(entityType); 
      await this.loadEntity(entityType); 
      
      if (entityType === 'kategorija') 
        await this.loadEntity('podkategorija'); 
        
      if (entityType === 'podkategorija') 
        await this.loadEntity('artikal'); 
        
      Utils.prikaziPoruku(config.messages.updateSuccess, 'success');
    } catch (error) { 
      Utils.debug.error(`Greška čuvanja ${entityType}:`, error); 
      Utils.prikaziPoruku(`Greška čuvanja ${entityType}`, 'error'); 
    } finally { 
      Utils.setLoadingState(elements.sacuvaj, false); 
    }
  }

  /** Otkazuje trenutno uređivanje entiteta */
  cancelEntity(entityType) { 
    this.state.editIds[entityType] = null; 
    this.clearForm(entityType); 
    UIService.setEditModeKategorija(false, this.elements[entityType]); 
  }

  /* KASKADNO BRISANJE */
  /** Briše entitet uz proveru povezanih entiteta */
  async deleteEntity(entityType, id, naziv) {
    const config = this.entityConfig[entityType]; 
    if (!config) return;
    
    if (entityType === 'glavnaKategorija') 
      return this.deleteGlavnaKategorijaKaskadno(id, naziv);
    
    if (entityType === 'kategorija') { 
      const podkategorije = await FirebaseService.ucitajPodkategorije(); 
      const vezanePodkategorije = podkategorije.filter(p => p.kategorijaId === id); 
      
      if (vezanePodkategorije.length > 0) { 
        const opcija = confirm(
          `Kategorija "${naziv}" ima ${vezanePodkategorije.length} podkategorija.` + 
          `\n\nOdaberite:\nOK = Kaskadno brisanje (briše sve i prebacuje artikle u "Nepoznato")` + 
          `\nCancel = Odustani`
        ); 
        
        if (opcija) 
          return this.deleteKategorijaKaskadno(id, naziv); 
        else 
          return; 
      } 
    }
    
    if (entityType === 'podkategorija') { 
      const artikli = await FirebaseService.ucitajArtikleSortirane(); 
      const vezaniArtikli = artikli.filter(a => a.podkategorija === naziv); 
      
      if (vezaniArtikli.length > 0) { 
        const opcija = confirm(
          `Podkategorija "${naziv}" ima ${vezaniArtikli.length} artikala.` + 
          `\n\nOdaberite:\nOK = Kaskadno brisanje (prebacuje artikle u "Nepoznato")` + 
          `\nCancel = Odustani`
        ); 
        
        if (opcija) 
          return this.deletePodkategorijaKaskadno(id, naziv); 
        else 
          return; 
      } 
    }
    
    if (!confirm(config.messages.deleteConfirm(naziv))) 
      return; 
      
    try { 
      await config.services.delete(id); 
      await this.loadEntity(entityType); 
      
      if (entityType === 'kategorija') 
        await this.loadEntity('podkategorija'); 
        
      if (entityType === 'podkategorija') 
        await this.loadEntity('artikal'); 
        
      Utils.prikaziPoruku(`${entityType} "${naziv}" je uspješno obrisan`, 'success'); 
    } catch (error) { 
      Utils.debug.error(`Greška brisanja ${entityType}:`, error); 
      Utils.prikaziPoruku(`Greška brisanja ${entityType}`, 'error'); 
    }
  }

  /** Kaskadno briše glavnu kategoriju sa svim podređenim elementima */
  async deleteGlavnaKategorijaKaskadno(glavnaKategorijaId, nazivGlavneKategorije) { 
    try { 
      const statistike = await this.prebrojElementeZaBrisanje(glavnaKategorijaId); 
      Utils.debug.log('Statistike prije brisanja:', statistike); 
      
      const upozorenje = this.kreirajPorukaUpozorenja(nazivGlavneKategorije, statistike); 
      if (!confirm(upozorenje)) { 
        Utils.prikaziPoruku('Brisanje otkazano', 'info'); 
        return; 
      } 
      
      Utils.prikaziPoruku('Brisanje u toku... Molimo sačekajte.', 'info'); 
      
      const rezultat = await obrisiGlavnuKategorijuKaskadno(
        glavnaKategorijaId, 
        nazivGlavneKategorije
      ); 
      
      if (rezultat.success) { 
        await this.loadAllData(); 
        
        const uspjehPoruka = 
          `✅ Uspješno obrisano:\n` + 
          `📁 Glavna kategorija: "${nazivGlavneKategorije}"\n` + 
          `📂 Kategorije: ${rezultat.statistike.kategorije}\n` + 
          `🏷️ Podkategorije: ${rezultat.statistike.podkategorije}\n` + 
          `📦 Artikli prebačeni u "Nepoznato": ${rezultat.statistike.artiklPrebaceno}\n\n` + 
          `Artikli su sigurno prebačeni u "Nepoznato" odakle ih možete vratiti u željene podkategorije.`;
          
        Utils.prikaziPoruku(uspjehPoruka, 'success'); 
      } 
    } catch (error) { 
      Utils.debug.error('Greška kaskadnog brisanja:', error); 
      Utils.prikaziPoruku(`Greška kaskadnog brisanja: ${error.message}`, 'error'); 
    } 
  }

  /** Kaskadno briše kategoriju sa podkategorijama i artiklima */
  async deleteKategorijaKaskadno(kategorijaId, nazivKategorije) { 
    try { 
      const statistike = await this.prebrojElementeZaBrisanjeKategorije(kategorijaId); 
      Utils.debug.log('Statistike prije brisanja kategorije:', statistike); 
      
      const upozorenje = this.kreirajPorukaUpozorenjaKategorija(nazivKategorije, statistike); 
      if (!confirm(upozorenje)) { 
        Utils.prikaziPoruku('Brisanje otkazano', 'info'); 
        return; 
      } 
      
      Utils.prikaziPoruku('Brisanje u toku... Molimo sačekajte.', 'info'); 
      const rezultat = await obrisiKategorijuKaskadno(kategorijaId, nazivKategorije); 
      
      if (rezultat.success) { 
        await this.loadAllData(); 
        
        const uspjehPoruka = 
          `✅ Uspješno obrisano:\n` + 
          `📁 Kategorija: "${nazivKategorije}"\n` + 
          `🏷️ Podkategorije: ${rezultat.statistike.podkategorije}\n` + 
          `📦 Artikli prebačeni u "Nepoznato": ${rezultat.statistike.artiklPrebaceno}\n\n` + 
          `Artikli su sigurno prebačeni u "Nepoznato" odakle ih možete vratiti u željene podkategorije.`;
          
        Utils.prikaziPoruku(uspjehPoruka, 'success'); 
      } 
    } catch (error) { 
      Utils.debug.error('Greška kaskadnog brisanja kategorije:', error); 
      Utils.prikaziPoruku(`Greška kaskadnog brisanja: ${error.message}`, 'error'); 
    } 
  }

  /** Kaskadno briše podkategoriju i premešta artikle u Nepoznato */
  async deletePodkategorijaKaskadno(podkategorijaId, nazivPodkategorije) { 
    try { 
      const statistike = await this.prebrojElementeZaBrisanjePodkategorije(nazivPodkategorije); 
      Utils.debug.log('Statistike prije brisanja podkategorije:', statistike); 
      
      const upozorenje = this.kreirajPorukaUpozorenjaPodkategorija(nazivPodkategorije, statistike); 
      if (!confirm(upozorenje)) { 
        Utils.prikaziPoruku('Brisanje otkazano', 'info'); 
        return; 
      } 
      
      Utils.prikaziPoruku('Brisanje u toku... Molimo sačekajte.', 'info'); 
      const rezultat = await obrisiPodkategorijuKaskadno(podkategorijaId, nazivPodkategorije); 
      
      if (rezultat.success) { 
        await this.loadAllData(); 
        
        const uspjehPoruka = 
          `✅ Uspješno obrisano:\n` + 
          `🏷️ Podkategorija: "${nazivPodkategorije}"\n` + 
          `📦 Artikli prebačeni u "Nepoznato": ${rezultat.statistike.artiklPrebaceno}\n\n` + 
          `Artikli su sigurno prebačeni u "Nepoznato" odakle ih možete vratiti u željene podkategorije.`;
          
        Utils.prikaziPoruku(uspjehPoruka, 'success'); 
      } 
    } catch (error) { 
      Utils.debug.error('Greška kaskadnog brisanja podkategorije:', error); 
      Utils.prikaziPoruku(`Greška kaskadnog brisanja: ${error.message}`, 'error'); 
    } 
  }

  /* HELPER FUNKCIJE ZA PREBROJAVANJE */
  /** Prebraja elemente za brisanje glavne kategorije */
  async prebrojElementeZaBrisanje(glavnaKategorijaId) { 
    try { 
      const kategorije = await FirebaseService.ucitajKategorije(); 
      const podkategorije = await FirebaseService.ucitajPodkategorije(); 
      const artikli = await FirebaseService.ucitajArtikleSortirane(); 
      
      const kategorijeUGlavnoj = kategorije.filter(k => 
        k.glavnaKategorijaId === glavnaKategorijaId
      ); 
      
      const kategorijeIds = kategorijeUGlavnoj.map(k => k.id); 
      
      const podkategorijeUKategorijama = podkategorije.filter(p => 
        kategorijeIds.includes(p.kategorijaId)
      ); 
      
      const podkategorijeNazivi = podkategorijeUKategorijama.map(p => p.naziv); 
      
      const artikliUPodkategorijama = artikli.filter(a => 
        podkategorijeNazivi.includes(a.podkategorija)
      ); 
      
      return { 
        kategorije: kategorijeUGlavnoj.length, 
        podkategorije: podkategorijeUKategorijama.length, 
        artikli: artikliUPodkategorijama.length, 
        kategorijeNazivi: kategorijeUGlavnoj.map(k => k.naziv), 
        podkategorijeNazivi: podkategorijeNazivi, 
        artikliNazivi: artikliUPodkategorijama.map(a => a.naziv).slice(0, 5) 
      }; 
    } catch (error) { 
      Utils.debug.error('Greška prebrojanja elemenata:', error); 
      return { kategorije: 0, podkategorije: 0, artikli: 0 }; 
    } 
  }

  /** Prebraja elemente za brisanje kategorije */
  async prebrojElementeZaBrisanjeKategorije(kategorijaId) { 
    try { 
      const podkategorije = await FirebaseService.ucitajPodkategorije(); 
      const artikli = await FirebaseService.ucitajArtikleSortirane(); 
      
      const podkategorijeUKategoriji = podkategorije.filter(p => 
        p.kategorijaId === kategorijaId
      ); 
      
      const podkategorijeNazivi = podkategorijeUKategoriji.map(p => p.naziv); 
      
      const artikliUPodkategorijama = artikli.filter(a => 
        podkategorijeNazivi.includes(a.podkategorija)
      ); 
      
      return { 
        podkategorije: podkategorijeUKategoriji.length, 
        artikli: artikliUPodkategorijama.length, 
        podkategorijeNazivi: podkategorijeNazivi, 
        artikliNazivi: artikliUPodkategorijama.map(a => a.naziv).slice(0, 5) 
      }; 
    } catch (error) { 
      Utils.debug.error('Greška prebrojanja elemenata kategorije:', error); 
      return { podkategorije: 0, artikli: 0 }; 
    } 
  }

  /** Prebraja artikle za brisanje podkategorije */
  async prebrojElementeZaBrisanjePodkategorije(nazivPodkategorije) { 
    try { 
      const artikli = await FirebaseService.ucitajArtikleSortirane(); 
      const artikliUPodkategoriji = artikli.filter(a => 
        a.podkategorija === nazivPodkategorije
      ); 
      
      return { 
        artikli: artikliUPodkategoriji.length, 
        artikliNazivi: artikliUPodkategoriji.map(a => a.naziv).slice(0, 5) 
      }; 
    } catch (error) { 
      Utils.debug.error('Greška prebrojanja artikala u podkategoriji:', error); 
      return { artikli: 0 }; 
    } 
  }

  /* KREIRANJE PORUKA UPOZORENJA */
  /** Kreira poruku upozorenja za brisanje glavne kategorije */
  kreirajPorukaUpozorenja(nazivGlavneKategorije, statistike) { 
    let poruka = 
      `⚠️ UPOZORENJE: Kaskadno brisanje glavne kategorije ⚠️\n\n` + 
      `Brisanjem glavne kategorije "${nazivGlavneKategorije}" će se obrisati:\n\n` + 
      `📁 Glavna kategorija: "${nazivGlavneKategorije}"\n` + 
      `📂 Kategorije: ${statistike.kategorije}`; 
      
    if (statistike.kategorijeNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.kategorijeNazivi.join(', ')}`; 
      
    poruka += `\n🏷️ Podkategorije: ${statistike.podkategorije}`; 
    
    if (statistike.podkategorijeNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.podkategorijeNazivi.slice(0, 3).join(', ')}${statistike.podkategorijeNazivi.length > 3 ? '...' : ''}`; 
      
    poruka += `\n\n📦 Artikli koji će biti prebačeni u "Nepoznato": ${statistike.artikli}`; 
    
    if (statistike.artikliNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.artikliNazivi.join(', ')}${statistike.artikli > 5 ? '...' : ''}`; 
      
    poruka += 
      `\n\n✅ Artikli NEĆE biti obrisani - biće sigurno prebačeni u podkategoriju "Nepoznato" ` + 
      `odakle ih možete vratiti u željene kategorije.\n\n` + 
      `Da li ste sigurni da želite da nastavite?`; 
      
    return poruka; 
  }

  /** Kreira poruku upozorenja za brisanje kategorije */
  kreirajPorukaUpozorenjaKategorija(nazivKategorije, statistike) { 
    let poruka = 
      `⚠️ UPOZORENJE: Kaskadno brisanje kategorije ⚠️\n\n` + 
      `Brisanjem kategorije "${nazivKategorije}" će se obrisati:\n\n` + 
      `📁 Kategorija: "${nazivKategorije}"\n` + 
      `🏷️ Podkategorije: ${statistike.podkategorije}`; 
      
    if (statistike.podkategorijeNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.podkategorijeNazivi.slice(0, 3).join(', ')}${statistike.podkategorijeNazivi.length > 3 ? '...' : ''}`; 
      
    poruka += `\n\n📦 Artikli koji će biti prebačeni u "Nepoznato": ${statistike.artikli}`; 
    
    if (statistike.artikliNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.artikliNazivi.join(', ')}${statistike.artikli > 5 ? '...' : ''}`; 
      
    poruka += 
      `\n\n✅ Artikli NEĆE biti obrisani - biće sigurno prebačeni u podkategoriju "Nepoznato" ` + 
      `odakle ih možete vratiti u željene kategorije.\n\n` + 
      `Da li ste sigurni da želite da nastavite?`; 
      
    return poruka; 
  }

  /** Kreira poruku upozorenja za brisanje podkategorije */
  kreirajPorukaUpozorenjaPodkategorija(nazivPodkategorije, statistike) { 
    let poruka = 
      `⚠️ UPOZORENJE: Kaskadno brisanje podkategorije ⚠️\n\n` + 
      `Brisanjem podkategorije "${nazivPodkategorije}" će se obrisati:\n\n` + 
      `🏷️ Podkategorija: "${nazivPodkategorije}"`; 
      
    poruka += `\n\n📦 Artikli koji će biti prebačeni u "Nepoznato": ${statistike.artikli}`; 
    
    if (statistike.artikliNazivi.length > 0) 
      poruka += `\n   └─ ${statistike.artikliNazivi.join(', ')}${statistike.artikli > 5 ? '...' : ''}`; 
      
    poruka += 
      `\n\n✅ Artikli NEĆE biti obrisani - biće sigurno prebačeni u podkategoriju "Nepoznato" ` + 
      `odakle ih možete vratiti u željene kategorije.\n\n` + 
      `Da li ste sigurni da želite da nastavite?`; 
      
    return poruka; 
  }

  /* VRAĆANJE ARTIKALA IZ NEPOZNATO */
  /** Vraća artikle iz Nepoznato u izabranu podkategoriju */
  async vratiArtikleIzNepoznate() { 
    try { 
      const podkategorije = await FirebaseService.ucitajPodkategorije(); 
      const validnePodkategorije = podkategorije.filter(p => 
        p.naziv !== "Nepoznato"
      ); 
      
      if (validnePodkategorije.length === 0) { 
        Utils.prikaziPoruku(
          'Nema dostupnih podkategorija. Kreirajte podkategorije prije vraćanja artikala.', 
          'warning'
        ); 
        return; 
      } 
      
      const ciljanaPodkategorija = prompt(
        `Odaberite podkategoriju u koju želite vratiti artikle iz "Nepoznato":\n\n` + 
        `Unesite naziv podkategorije:\n` + 
        `${validnePodkategorije.map(p => `- ${p.naziv}`).join('\n')}`
      ); 
      
      if (!ciljanaPodkategorija || ciljanaPodkategorija.trim() === '') { 
        Utils.prikaziPoruku('Vraćanje otkazano', 'info'); 
        return; 
      } 
      
      const postojiPodkategorija = validnePodkategorije.some(p => 
        p.naziv === ciljanaPodkategorija
      ); 
      
      if (!postojiPodkategorija) { 
        Utils.prikaziPoruku('Odabrana podkategorija ne postoji', 'error'); 
        return; 
      } 
      
      Utils.prikaziPoruku('Vraćanje artikala u toku...', 'info'); 
      
      const rezultat = await vratiArtikleIzNepoznate(ciljanaPodkategorija); 
      
      if (rezultat.success) { 
        await this.loadEntity('artikal'); 
        
        Utils.prikaziPoruku(
          `Uspješno vraćeno ${rezultat.prebacenoArtikala} artikala u podkategoriju "${ciljanaPodkategorija}"`, 
          'success'
        ); 
      } 
    } catch (error) { 
      Utils.debug.error('Greška vraćanja artikala:', error); 
      Utils.prikaziPoruku(`Greška vraćanja artikala: ${error.message}`, 'error'); 
    } 
  }

  /** Dodaje dugme za vraćanje artikala ako ih ima u Nepoznatom */
  dodajDugmeVratiArtikle() { 
    const nepoznatiArtikli = this.state.data.artikli.filter(a => 
      a.podkategorija === "Nepoznato"
    ); 
    
    if (nepoznatiArtikli.length > 0) { 
      const container = this.elements.artikal.listaContainer; 
      if (!container) return; 
      
      let dugme = document.getElementById('vratiArtikleBtn'); 
      
      if (!dugme) { 
        dugme = document.createElement('button'); 
        dugme.id = 'vratiArtikleBtn'; 
        dugme.className = 'btn btn-warning btn-sm mb-3'; 
        dugme.style.marginTop = '15px'; 
        dugme.innerHTML = `<i class="fas fa-undo"></i> Vrati artikle iz "Nepoznato" (${nepoznatiArtikli.length})`; 
        dugme.addEventListener('click', () => this.vratiArtikleIzNepoznate()); 
        container.insertBefore(dugme, container.firstChild); 
      } else { 
        dugme.innerHTML = `<i class="fas fa-undo"></i> Vrati artikle iz "Nepoznato" (${nepoznatiArtikli.length})`; 
      } 
    } else { 
      const dugme = document.getElementById('vratiArtikleBtn'); 
      if (dugme) dugme.remove(); 
    } 
  }

  /* DATA EXTRACTION I PREPARATION */
  /** Izvlači podatke iz forme za određeni tip entiteta */
  extractFormData(entityType) { 
    const el = this.elements[entityType]; 
    
    const base = { 
      naziv: el.naziv?.value?.trim() || "", 
      imageFile: el.ikona?.files[0] || el.slika?.files[0] || null 
    }; 
    
    if (entityType === 'kategorija') 
      return { 
        ...base, 
        glavnaKategorijaId: el.selectGlavnaKategorija?.value || null 
      }; 
      
    if (entityType === 'podkategorija') { 
      const kategorijaId = el.kategorijaSelect?.value?.trim() || null; 
      Utils.debug.log('Izvučena kategorijaId:', kategorijaId); 
      Utils.debug.log('Element kategorijaSelect:', el.kategorijaSelect); 
      
      if (!kategorijaId || kategorijaId === '' || kategorijaId === 'null') { 
        Utils.debug.error('KategorijaId je prazan ili null!'); 
        throw new Error('Molimo odaberite kategoriju za podkategoriju'); 
      } 
      
      return { 
        ...base, 
        kategorijaId: kategorijaId 
      }; 
    } 
    
    if (entityType === 'artikal') { 
      const podkategorija = el.podkategorijaSelect?.value?.trim() || ""; 
      Utils.debug.log('Izvučena podkategorija:', podkategorija); 
      
      return { 
        naziv: base.naziv, 
        cijena: el.cijena?.value?.trim() || "", 
        podkategorija: podkategorija, 
        opis: el.opis?.value?.trim() || "", 
        opis2: el.opis2?.value?.trim() || "", 
        imageFile: base.imageFile 
      }; 
    } 
    
    return base; 
  }

  /** Priprema podatke za kreiranje novog entiteta */
  prepareEntityData(entityType, data, imageURL) { 
    Utils.debug.log('prepareEntityData pozvan:', { entityType, data, imageURL }); 
    
    if (entityType === 'glavnaKategorija') 
      return { 
        naziv: data.naziv, 
        sortOrder: null, 
        ikona: imageURL || 'fa-layer-group' 
      }; 
      
    if (entityType === 'kategorija') 
      return { 
        naziv: data.naziv, 
        ikona: imageURL || 'fa-folder', 
        glavnaKategorijaId: data.glavnaKategorijaId 
      }; 
      
    if (entityType === 'podkategorija') { 
      const finalData = { 
        naziv: data.naziv, 
        ikona: imageURL || 'fa-tag', 
        kategorijaId: data.kategorijaId 
      }; 
      
      Utils.debug.log('Pripravljeni podaci za podkategoriju:', finalData); 
      return finalData; 
    } 
    
    if (entityType === 'artikal') { 
      const podkat = this.state.data.podkategorije.find(p => 
        p.naziv === data.podkategorija
      ); 
      
      return { 
        artikal: { 
          naziv: data.naziv, 
          cijena: Utils.formatCena(data.cijena), 
          podkategorija: data.podkategorija, 
          podkategorijaId: podkat?.id || null, 
          opis: data.opis, 
        opis2: data.opis2 || "", 
          opis2: data.opis2 || "", 
          slikaURL: imageURL 
        } 
      }; 
    } 
    
    return {}; 
  }

  /** Priprema podatke za ažuriranje entiteta */
  prepareUpdateData(entityType, data, imageURL, current) { 
    if (entityType === 'glavnaKategorija') 
      return { 
        naziv: data.naziv, 
        ikona: imageURL 
      }; 
      
    if (entityType === 'kategorija') 
      return { 
        naziv: data.naziv, 
        ikonaKategorije: imageURL, 
        glavnaKategorijaId: data.glavnaKategorijaId, 
        sortOrder: current?.sortOrder || 999 
      }; 
      
    if (entityType === 'podkategorija') 
      return { 
        naziv: data.naziv, 
        ikona: imageURL, 
        kategorijaId: data.kategorijaId, 
        sortOrder: current?.sortOrder || 999 
      }; 
      
    if (entityType === 'artikal') { 
      const podkat = this.state.data.podkategorije.find(p => 
        p.naziv === data.podkategorija
      ); 
      
      return { 
        naziv: data.naziv, 
        cijena: Utils.formatCena(data.cijena), 
        podkategorija: data.podkategorija, 
        podkategorijaId: podkat?.id || null, 
        opis: data.opis, 
        slikaURL: imageURL 
      }; 
    } 
    
    return {}; 
  }

  /** Čisti formu za unos/izmenu entiteta */
  clearForm(entityType) { 
    const el = this.elements[entityType]; 
    if (!el) return; 
    
    if (entityType === 'kategorija' || entityType === 'podkategorija') 
      UIService.ocistiFormuKategorija(el); 
    else if (entityType === 'artikal') 
      UIService.ocistiFormuArtikal(el); 
    else { 
      if (el.naziv) el.naziv.value = ''; 
      if (el.ikona) el.ikona.value = ''; 
      if (el.previewContainer) 
        el.previewContainer.innerHTML = '<p>Ikona nije odabrana</p>'; 
    } 
  }

  /* TOGGLE STATUS ARTIKLA */
  /** Mijenja vidljivost artikla (Objavi/Sakrij) */
  async toggleArtikalStatus(id, trenutnoAktivna) {
    try {
      const noviStatus = await toggleArtikalAktivnost(id, trenutnoAktivna);
      const poruka = noviStatus ? 'Artikal je objavljen i vidljiv gostima' : 'Artikal je sakriven i nije vidljiv gostima';
      Utils.prikaziPoruku(poruka, noviStatus ? 'success' : 'info');
      await this.loadEntity('artikal');
    } catch (error) {
      Utils.debug.error('Greška promjene statusa artikla:', error);
      Utils.prikaziPoruku('Greška promjene statusa artikla', 'error');
    }
  }

  /* UI UPDATE */
  /** Ažurira UI za određeni tip entiteta */
  async updateUI(entityType) { 
    switch (entityType) { 
      case 'glavnaKategorija': 
        UIService.osvjeziDropdownGlavnihKategorija(
          this.state.data.glavneKategorije, 
          this.elements.glavnaKategorija.selectGlavnaKategorija
        ); 
        
        UIService.osvjeziDropdownGlavnihKategorija(
          this.state.data.glavneKategorije, 
          this.elements.kategorija.selectGlavnaKategorija
        ); 
        
        UIService.prikaziGlavneKategorije(
          this.state.data.glavneKategorije, 
          this.elements.glavnaKategorija.listaContainer, 
          (item) => this.editEntity(entityType, item), 
          (id, naziv) => this.handleEntity(entityType, 'delete', id, naziv), 
          (newOrder) => this.reorderGlavneKategorije(newOrder)
        ); 
        break; 
        
      case 'kategorija': 
        UIService.osvjeziDropdownKategorija(
          this.state.data.kategorije, 
          this.elements.podkategorija.kategorijaSelect
        ); 
        
        UIService.prikaziKategorije(
          this.state.data.kategorije, 
          this.elements.kategorija.listaContainer, 
          (item) => this.editEntity(entityType, item), 
          (id, naziv) => this.handleEntity(entityType, 'delete', id, naziv), 
          (newOrder) => this.reorderKategorije(newOrder)
        ); 
        break; 
        
      case 'podkategorija': 
        UIService.osvjeziDropdownPodkategorija(
          this.state.data.podkategorije, 
          this.elements.artikal.podkategorijaSelect
        ); 
        
        UIService.prikaziPodkategorije(
          this.state.data.podkategorije, 
          this.state.data.kategorije, 
          this.elements.podkategorija.listaContainer, 
          (item) => this.editEntity(entityType, item), 
          (id, naziv) => this.handleEntity(entityType, 'delete', id, naziv), 
          (newOrder) => this.reorderPodkategorije(newOrder)
        ); 
        break; 
        
      case 'artikal': 
        const displayCurrency = this.state.cache.currencyCode || ''; 
        
        UIService.prikaziArtikle(
          this.state.data.artikli, 
          this.state.data.podkategorije, 
          this.elements.artikal.listaContainer, 
          (item) => this.editEntity(entityType, item), 
          (id) => this.handleEntity(entityType, 'delete', id), 
          (podkatNaziv, newOrder) => this.reorderArtikli(podkatNaziv, newOrder), 
          displayCurrency,
          (id, trenutnoAktivna) => this.toggleArtikalStatus(id, trenutnoAktivna)
        ); 
        
        this.dodajDugmeVratiArtikle(); 
        break; 
    } 
  }

  /** Filtrira podkategorije prema izabranoj kategoriji */
  filterPodkategorije() { 
    const kategorijaId = this.elements.podkategorija.kategorijaSelect?.value; 
    if (!kategorijaId) return; 
    
    const filtriranePodkategorije = this.state.data.podkategorije.filter(p => 
      p.kategorijaId === kategorijaId
    ); 
    
    UIService.prikaziPodkategorije(
      filtriranePodkategorije, 
      this.state.data.kategorije, 
      this.elements.podkategorija.listaContainer, 
      (item) => this.editEntity('podkategorija', item), 
      (id, naziv) => this.handleEntity('podkategorija', 'delete', id, naziv), 
      (newOrder) => this.reorderPodkategorije(newOrder)
    ); 
  }

  /** Priprema formu za izmenu entiteta */
  editEntity(entityType, data) { 
    const el = this.elements[entityType]; 
    if (!el) return; 
    
    try { 
      this.state.editIds[entityType] = data.id; 
      
      if (entityType === 'artikal') { 
        this.state.cache.slikaURL = data.slikaURL || ""; 
        this.state.cache.podkategorijaId = data.podkategorijaId || null; 
        UIService.popuniFormuArtikal(data, el); 
        UIService.setEditMode(true, el); 
      } else { 
        el.naziv.value = data.naziv; 
        
        if (el.selectGlavnaKategorija && entityType === 'kategorija') 
          el.selectGlavnaKategorija.value = data.glavnaKategorijaId || ''; 
          
        if (el.kategorijaSelect && entityType === 'podkategorija') 
          el.kategorijaSelect.value = data.kategorijaId || ''; 
          
        if (el.ikona) 
          el.ikona.value = ""; 
          
        this.updatePreviewForEdit(entityType, data.ikona || data.ikonaKategorije); 
        UIService.setEditModeKategorija(true, el); 
      } 
      
      el.naziv?.focus(); 
    } catch (error) { 
      Utils.debug.error(`Greška uređivanja ${entityType}:`, error); 
      Utils.prikaziPoruku(`Greška učitavanja ${entityType} za uređivanje`, 'error'); 
    } 
  }

  /** Ažurira prikaz ikone prilikom izmene entiteta */
  updatePreviewForEdit(entityType, imageURL) { 
    const el = this.elements[entityType]; 
    if (!el.previewContainer) return; 
    
    Utils.debug.log('updatePreviewForEdit pozvan:', { entityType, imageURL }); 
    
    if (imageURL) { 
      if (imageURL.startsWith('fa-')) { 
        Utils.debug.log('FontAwesome ikona za preview:', imageURL); 
        el.previewContainer.innerHTML = 
          `<div style="position:relative;text-align:center;padding:10px;">` + 
          `<i class="fas ${imageURL}" style="font-size:48px;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3);"></i>` + 
          `<p style="font-size:12px;color:white;margin-top:8px;text-shadow:0 1px 3px rgba(0,0,0,0.5);font-weight:600;">` + 
          `Trenutna ikona (odaberite novu sliku za zamjenu)` + 
          `</p></div>`; 
      } else if (imageURL.startsWith('http')) { 
        Utils.debug.log('URL slika za preview:', imageURL); 
        el.previewContainer.innerHTML = 
          `<div style="position:relative;text-align:center;">` + 
          `<img src="${imageURL}" alt="Trenutna ikona" ` + 
          `style="max-width:60px;max-height:60px;object-fit:contain;` + 
          `background:linear-gradient(135deg,#667eea,#764ba2);padding:8px;` + 
          `border-radius:8px;border:2px solid rgba(102,126,234,0.3);` + 
          `box-shadow:0 2px 8px rgba(102,126,234,0.25);" />` + 
          `<p style="font-size:12px;color:white;margin-top:8px;` + 
          `text-shadow:0 1px 3px rgba(0,0,0,0.5);font-weight:600;">` + 
          `Trenutna ikona (odaberite novu sliku za zamjenu)` + 
          `</p></div>`; 
      } else { 
        Utils.debug.warn('Neprepoznat format ikone za preview:', imageURL); 
        el.previewContainer.innerHTML = 
          '<p style="color:white;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.5);">' + 
          'Nema ikone - odaberite sliku</p>'; 
      } 
    } else { 
      el.previewContainer.innerHTML = 
        '<p style="color:white;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.5);">' + 
        'Nema ikone - odaberite sliku</p>'; 
    } 
  }

  /** Obrađuje prikaz pregleda slika */
  handlePreview(type) { 
    const handlers = { 
      glavnaKategorija: () => this.showImagePreview(
        this.elements.glavnaKategorija.ikona?.files[0], 
        this.elements.glavnaKategorija.previewContainer
      ), 
      kategorija: () => this.showImagePreview(
        this.elements.kategorija.ikona.files[0], 
        this.elements.kategorija.previewContainer
      ), 
      podkategorija: () => this.showImagePreview(
        this.elements.podkategorija.ikona.files[0], 
        this.elements.podkategorija.previewContainer
      ), 
      logo: () => this.showImagePreview(
        this.elements.postavke.logo.files[0], 
        this.elements.postavke.logoPreview, 
        'logo'
      ) 
    }; 
    
    if (handlers[type]) 
      handlers[type](); 
  }

  /** Prikazuje pregled odabrane slike */
  showImagePreview(file, container, type = 'icon') { 
    if (!container) return; 
    
    if (file) { 
      const validation = Utils.validirajSliku(file); 
      
      if (!validation.isValid) { 
        Utils.prikaziPoruku(validation.errors.join('\n'), 'error'); 
        container.innerHTML = '<p>Ikona nije odabrana</p>'; 
        return; 
      } 
      
      const url = URL.createObjectURL(file); 
      const maxSize = type === 'logo' ? '200px' : '60px'; 
      
      container.innerHTML = 
        `<img src="${url}" alt="Preview" style="max-width:${maxSize};max-height:${maxSize};" />`; 
        
      if (type === 'logo') 
        this.elements.postavke.ukloniLogo?.classList.remove('d-none'); 
    } else { 
      container.innerHTML = '<p>Ikona nije odabrana</p>'; 
    } 
  }

  /* SORTIRANJE I REORDER */
  /** Ažurira redosled glavnih kategorija */
  async reorderGlavneKategorije(newOrder) { 
    try { 
      await Promise.all(
        newOrder.map((id, index) => 
          FirebaseService.azurirajGlavnuKategoriju(id, { sortOrder: index + 1 })
        )
      ); 
      
      Utils.prikaziPoruku(
        'Redoslijed glavnih kategorija je uspješno ažuriran', 
        'success'
      ); 
      
      setTimeout(() => this.loadEntity('glavnaKategorija'), 500); 
    } catch (error) { 
      Utils.debug.error('Greška ažuriranja redoslijeda glavnih kategorija:', error); 
      await this.loadEntity('glavnaKategorija'); 
    } 
  }

  /** Ažurira redosled kategorija */
  async reorderKategorije(newOrder) { 
    try { 
      const reordered = newOrder.map((id, index) => ({ 
        id, sortOrder: index + 1 
      })); 
      
      await FirebaseService.azurirajRedoslijedKategorija(reordered); 
      
      Utils.prikaziPoruku(
        'Redoslijed kategorija je uspješno ažuriran', 
        'success'
      ); 
      
      setTimeout(() => this.loadEntity('kategorija'), 500); 
    } catch (error) { 
      Utils.debug.error('Greška ažuriranja redoslijeda kategorija:', error); 
      Utils.prikaziPoruku('Greška ažuriranja redoslijeda', 'error'); 
      await this.loadEntity('kategorija'); 
    } 
  }

  /** Ažurira redosled podkategorija */
  async reorderPodkategorije(newOrder) { 
    try { 
      const reordered = newOrder.map((id, index) => ({ 
        id, sortOrder: index + 1 
      })); 
      
      await FirebaseService.azurirajRedoslijedPodkategorija(reordered); 
      
      Utils.prikaziPoruku(
        'Redoslijed podkategorija je uspješno ažuriran', 
        'success'
      ); 
      
      setTimeout(() => this.loadEntity('podkategorija'), 500); 
    } catch (error) { 
      Utils.debug.error('Greška ažuriranja redoslijeda podkategorija:', error); 
      Utils.prikaziPoruku('Greška ažuriranja redoslijeda', 'error'); 
      await this.loadEntity('podkategorija'); 
    } 
  }

  /** Ažurira redosled artikala u podkategoriji */
  async reorderArtikli(podkategorijaNaziv, newOrder) { 
    try { 
      await FirebaseService.azurirajRedoslijedArtikala(
        podkategorijaNaziv, 
        newOrder
      ); 
      
      Utils.prikaziPoruku(
        `Redoslijed artikala u podkategoriji "${podkategorijaNaziv}" je uspješno promijenjen`, 
        'success'
      ); 
      
      await this.loadEntity('artikal'); 
    } catch (error) { 
      Utils.debug.error('Greška ažuriranja redoslijeda artikala:', error); 
      Utils.prikaziPoruku('Greška ažuriranja redoslijeda artikala', 'error'); 
      await this.loadEntity('artikal'); 
    } 
  }

  /* WEB POSTAVKE */
  /** Učitava web postavke */
  async loadWebSettings() { 
    try { 
      Utils.debug.log('loadWebSettings pokrenut'); 
      const postavke = await FirebaseService.ucitajWebPostavke(); 
      Utils.debug.log('Učitane postavke:', postavke); 
      
      if (!postavke) { 
        Utils.debug.log('Nema postavki, postavljam default vrijednosti'); 
        this.state.cache.currencyCode = ''; 
        this.state.cache.logoURL = ''; 
        
        if (this.elements.postavke.currencyCode) 
          this.elements.postavke.currencyCode.value = ''; 
          
        if (this.elements.postavke.logoPreview) 
          this.elements.postavke.logoPreview.innerHTML = '<p>Logo trenutno nije postavljen</p>'; 
          
        this.initializeCurrencySuffix(); 
        return; 
      } 
      
      if (postavke.logoURL) { 
        this.state.cache.logoURL = postavke.logoURL; 
        this.elements.postavke.logoPreview.innerHTML = 
          `<img src="${postavke.logoURL}" alt="Logo" style="max-width:200px;max-height:100px;" />`;
          
        this.elements.postavke.ukloniLogo?.classList.remove('d-none'); 
      } else { 
        this.state.cache.logoURL = ''; 
        this.elements.postavke.logoPreview.innerHTML = '<p>Logo trenutno nije postavljen</p>'; 
        this.elements.postavke.ukloniLogo?.classList.add('d-none'); 
      } 
      
      if (this.elements.postavke.currencyCode) { 
        this.state.cache.currencyCode = postavke.currencyCode || ''; 
        this.elements.postavke.currencyCode.value = this.state.cache.currencyCode; 
        Utils.debug.log('Postavljena valuta u cache i input:', this.state.cache.currencyCode); 
        setTimeout(() => this.initializeCurrencySuffix(), 100); 
      } 
      
      if (this.elements.postavke.heroTitle) 
        this.elements.postavke.heroTitle.value = postavke.heroTitle || ""; 
        
      if (this.elements.postavke.heroSubtitle) 
        this.elements.postavke.heroSubtitle.value = postavke.heroSubtitle || ""; 
        
      const footerFields = { 
        footerText: postavke.footerText || "", 
        instagramUrl: postavke.instagramUrl || "", 
        facebookUrl: postavke.facebookUrl || "", 
        youtubeUrl: postavke.youtubeUrl || "", 
        twitterUrl: postavke.twitterUrl || "", 
        tiktokUrl: postavke.tiktokUrl || "" 
      }; 
      
      Object.entries(footerFields).forEach(([field, value]) => { 
        if (this.elements.postavke[field]) 
          this.elements.postavke[field].value = value; 
      }); 
      
      if (this.elements.postavke.footerEnabled) 
        this.elements.postavke.footerEnabled.checked = !!postavke.footerEnabled; 
        
      this.updateFooterPreview(); 
    } catch (error) { 
      Utils.debug.error('Greška učitavanja postavki:', error); 
      this.state.cache.currencyCode = ''; 
      this.state.cache.logoURL = ''; 
      
      if (this.elements.postavke.currencyCode) 
        this.elements.postavke.currencyCode.value = ''; 
        
      this.initializeCurrencySuffix(); 
    } 
  }

  /** Čuva postavke valute */
  async saveCurrencySettings() { 
    try { 
      const currencyInput = this.elements.postavke.currencyCode; 
      
      if (!currencyInput) { 
        Utils.prikaziPoruku('Currency input field ne postoji', 'error'); 
        return; 
      } 
      
      const currencyCode = currencyInput.value.trim(); 
      
      if (currencyCode.length > 5) 
        return Utils.prikaziPoruku('Kod valute mora imati 5 karaktera ili manje', 'error'); 
        
      Utils.setLoadingState(this.elements.postavke.saveCurrency, true); 
      this.state.cache.currencyCode = currencyCode || ''; 
      
      Utils.debug.log('Spremljena valuta u cache:', this.state.cache.currencyCode); 
      
      const allSettings = this.collectAllWebSettings(); 
      allSettings.currencyCode = this.state.cache.currencyCode; 
      
      await FirebaseService.sacuvajWebPostavke(allSettings); 
      
      setTimeout(() => { 
        this.updateCurrencySuffix(); 
        this.initializeCurrencySuffix(); 
      }, 200); 
      
      await this.updateUI('artikal'); 
      
      const message = currencyCode ? 
        `Postavke valute "${currencyCode}" su uspješno sačuvane` : 
        'Valuta je uspješno uklonjena'; 
        
      Utils.prikaziPoruku(message, 'success'); 
      
      setTimeout(() => this.updateCurrencySuffix(), 1000); 
    } catch (error) { 
      Utils.debug.error('Greška čuvanja postavki valute:', error); 
      Utils.prikaziPoruku('Greška čuvanja postavki valute', 'error'); 
    } finally { 
      Utils.setLoadingState(this.elements.postavke.saveCurrency, false); 
    } 
  }

  /** Resetuje postavke valute */
  resetCurrencySettings() { 
    this.elements.postavke.currencyCode.value = ''; 
    this.state.cache.currencyCode = ''; 
    this.updateCurrencySuffix(); 
  }

  /** Ažurira prikaz oznake valute */
  updateCurrencySuffix() { 
    Utils.debug.log('updateCurrencySuffix pokrenut'); 
    let currencySuffix = document.querySelector('.currency-suffix'); 
    
    if (!currencySuffix) { 
      const cijenaInput = document.getElementById('cijenaArtikla'); 
      
      if (cijenaInput && cijenaInput.parentNode) { 
        Utils.debug.log('Kreiram currency suffix element...'); 
        cijenaInput.parentNode.style.position = 'relative'; 
        cijenaInput.parentNode.style.display = 'flex'; 
        cijenaInput.parentNode.style.alignItems = 'center'; 
        
        currencySuffix = document.createElement('span'); 
        currencySuffix.className = 'currency-suffix'; 
        currencySuffix.style.position = 'absolute'; 
        currencySuffix.style.right = '10px'; 
        currencySuffix.style.top = '50%'; 
        currencySuffix.style.transform = 'translateY(-50%)'; 
        currencySuffix.style.fontWeight = 'bold'; 
        currencySuffix.style.color = '#495057'; 
        currencySuffix.style.pointerEvents = 'none'; 
        currencySuffix.style.fontSize = '14px'; 
        currencySuffix.style.backgroundColor = 'transparent'; 
        
        cijenaInput.parentNode.appendChild(currencySuffix); 
      } 
    } 
    
    if (currencySuffix) { 
      const currencyText = this.state.cache.currencyCode || ''; 
      Utils.debug.log('Currency text za prikaz:', currencyText || '(prazan)'); 
      
      if (currencyText) { 
        currencySuffix.textContent = currencyText; 
        currencySuffix.style.display = 'block'; 
        
        const cijenaInput = document.getElementById('cijenaArtikla'); 
        if (cijenaInput) 
          cijenaInput.style.paddingRight = (currencyText.length * 8 + 20) + 'px'; 
      } else { 
        currencySuffix.style.display = 'none'; 
        
        const cijenaInput = document.getElementById('cijenaArtikla'); 
        if (cijenaInput) 
          cijenaInput.style.paddingRight = '12px'; 
      } 
      
      Utils.debug.log('Suffix ažuriran sa:', currencyText || '(prazan)'); 
    } else { 
      Utils.debug.log('Nije moguće kreirati currency suffix element!'); 
    } 
  }

  /* LOGO UPRAVLJANJE */
  /** Upravlja akcijama za logo (upload, remove, reset) */
  async handleLogo(action) { 
    const actions = { 
      upload: () => this.uploadLogo(), 
      remove: () => this.removeLogo(), 
      reset: () => this.resetLogo() 
    }; 
    
    if (actions[action]) 
      await actions[action](); 
  }

  /** Postavlja novi logo */
  async uploadLogo() { 
    const { logo, uploadLogo } = this.elements.postavke; 
    const file = logo.files[0]; 
    
    if (!file) 
      return Utils.prikaziPoruku('Molimo odaberite sliku za logo', 'error'); 
      
    try { 
      Utils.setLoadingState(uploadLogo, true); 
      
      const url = await FirebaseService.uploadSlika(file); 
      this.state.cache.logoURL = url; 
      
      this.elements.postavke.logoPreview.innerHTML = 
        `<img src="${url}" alt="Logo" style="max-width:200px;max-height:100px;" />`; 
        
      this.elements.postavke.ukloniLogo?.classList.remove('d-none'); 
      
      Utils.debug.log('Automatski čuvam logo u Firebase...'); 
      const allSettings = this.collectAllWebSettings(); 
      await FirebaseService.sacuvajWebPostavke(allSettings); 
      
      Utils.debug.log('Logo automatski sačuvan u Firebase'); 
      Utils.prikaziPoruku('Logo je uspješno postavljen i sačuvan', 'success'); 
    } catch (error) { 
      Utils.debug.error('Greška upload-a logo slike:', error); 
      Utils.prikaziPoruku('Greška upload-a logo slike', 'error'); 
    } finally { 
      Utils.setLoadingState(uploadLogo, false); 
    } 
  }

  /** Uklanja postavljeni logo */
async removeLogo() { 
  this.state.cache.logoURL = ""; 
  this.elements.postavke.logoPreview.innerHTML = '<p>Logo trenutno nije postavljen</p>'; 
  this.elements.postavke.logo.value = ""; 
  this.elements.postavke.ukloniLogo?.classList.add('d-none'); 
  
  try {
    const allSettings = this.collectAllWebSettings();
    await FirebaseService.sacuvajWebPostavke(allSettings);

    Utils.prikaziPoruku('Logo je uspješno uklonjen', 'success');
  } catch (error) {
    Utils.prikaziPoruku(
      'Logo je uklonjen lokalno. Kliknite "Sačuvaj Sve Postavke" da potvrdite promjene.',
      'warning'
    );
  }
}


  /** Resetuje logo na default */
  resetLogo() { 
    this.removeLogo(); 
  }

  /** Automatski čuva promene loga */
  async autoSaveLogo() { 
    try { 
      Utils.debug.log('Auto-save loga...'); 
      
      const allSettings = this.collectAllWebSettings(); 
      await FirebaseService.sacuvajWebPostavke(allSettings); 
      
      Utils.debug.log('Logo promjena automatski sačuvana'); 
      Utils.prikaziPoruku('Logo je uklonjen', 'success'); 
    } catch (error) { 
      Utils.debug.error('Greška auto-save loga:', error); 
      Utils.prikaziPoruku(
        'Logo je uklonjen lokalno. Kliknite "Sačuvaj Sve Postavke" da potvrdite promjene.', 
        'warning'
      ); 
    } 
  }

  /* OSTALE WEB POSTAVKE */
  /** Čuva sve web postavke odjednom */
  async saveWebSettings() { 
    try { 
      Utils.setLoadingState(this.elements.postavke.sacuvajPostavke, true); 
      
      const allSettings = this.collectAllWebSettings(); 
      await FirebaseService.sacuvajWebPostavke(allSettings); 
      
      Utils.prikaziPoruku('Postavke su uspješno sačuvane', 'success'); 
    } catch (error) { 
      Utils.debug.error('Greška čuvanja postavki:', error); 
      Utils.prikaziPoruku('Greška čuvanja postavki', 'error'); 
    } finally { 
      Utils.setLoadingState(this.elements.postavke.sacuvajPostavke, false); 
    } 
  }

  /** Čuva postavke Hero sekcije */
  async saveHeroSection() { 
    const { heroTitle, heroSubtitle, sacuvajHero } = this.elements.postavke; 
    
    if (!heroTitle || !heroSubtitle) { 
      Utils.prikaziPoruku('Hero elementi nisu pronađeni u DOM-u', 'error'); 
      return; 
    } 
    
    try { 
      Utils.setLoadingState(sacuvajHero, true); 
      
      const heroData = this.collectAllWebSettings(); 
      heroData.heroTitle = heroTitle.value.trim() || ""; 
      heroData.heroSubtitle = heroSubtitle.value.trim(); 
      
      await FirebaseService.sacuvajWebPostavke(heroData); 
      
      Utils.prikaziPoruku('Hero sekcija je uspješno sačuvana', 'success'); 
    } catch (error) { 
      Utils.debug.error('Greška čuvanja hero sekcije:', error); 
      Utils.prikaziPoruku('Greška čuvanja hero sekcije', 'error'); 
    } finally { 
      Utils.setLoadingState(sacuvajHero, false); 
    } 
  }

  /** Resetuje postavke Hero sekcije */
  resetHeroSection() { 
    const { heroTitle, heroSubtitle } = this.elements.postavke; 
    
    if (heroTitle) heroTitle.value = ""; 
    if (heroSubtitle) heroSubtitle.value = ""; 
  }

  /** Čuva postavke Footer-a */
  async saveFooterSettings() { 
    try { 
      Utils.setLoadingState(this.elements.postavke.sacuvajFooter, true); 
      
      const footerData = this.collectAllWebSettings(); 
      await FirebaseService.sacuvajWebPostavke(footerData); 
      
      Utils.prikaziPoruku('Footer je uspješno sačuvan', 'success'); 
    } catch (error) { 
      Utils.debug.error('Greška čuvanja footer-a:', error); 
      Utils.prikaziPoruku('Greška čuvanja footer-a', 'error'); 
    } finally { 
      Utils.setLoadingState(this.elements.postavke.sacuvajFooter, false); 
    } 
  }

  /** Resetuje postavke Footer-a */
  resetFooterSettings() { 
    [
      'footerText', 'instagramUrl', 'facebookUrl', 
      'youtubeUrl', 'twitterUrl', 'tiktokUrl'
    ].forEach(field => { 
      if (this.elements.postavke[field]) 
        this.elements.postavke[field].value = ""; 
    }); 
    
    if (this.elements.postavke.footerEnabled) 
      this.elements.postavke.footerEnabled.checked = false; 
      
    this.updateFooterPreview(); 
  }

  /** Ažurira prikaz preview-a Footer-a */
  updateFooterPreview() { 
    const { footerPreview, footerEnabled } = this.elements.postavke; 
    if (!footerPreview) return; 
    
    if (!footerEnabled?.checked) { 
      footerPreview.style.display = 'none'; 
      return; 
    } 
    
    const footerData = this.getFooterData(); 
    
    if (!footerData.hasContent) { 
      footerPreview.style.display = 'none'; 
      return; 
    } 
    
    footerPreview.style.display = 'block'; 
    footerPreview.innerHTML = 
      `<div style="padding:10px;background:#f8f9fa;border-radius:5px;margin-top:10px;">` + 
      `${footerData.text ? `<p>${footerData.text}</p>` : ''}` + 
      `<div style="margin-top:8px;">${footerData.links.join('')}</div>` + 
      `</div>`;
  }

  /** Vraća podatke za prikaz Footer-a */
  getFooterData() { 
    const el = this.elements.postavke; 
    const text = el.footerText?.value.trim() || ""; 
    
    const links = [ 
      { 
        url: el.instagramUrl?.value, 
        name: 'Instagram', 
        color: '#E4405F', 
        icon: 'fab fa-instagram' 
      }, 
      { 
        url: el.facebookUrl?.value, 
        name: 'Facebook', 
        color: '#1877F2', 
        icon: 'fab fa-facebook' 
      }, 
      { 
        url: el.youtubeUrl?.value, 
        name: 'YouTube', 
        color: '#FF0000', 
        icon: 'fab fa-youtube' 
      }, 
      { 
        url: el.twitterUrl?.value, 
        name: 'X', 
        color: '#000000', 
        icon: 'fab fa-x' 
      }, 
      { 
        url: el.tiktokUrl?.value, 
        name: 'TikTok', 
        color: '#000000', 
        icon: 'fab fa-tiktok' 
      } 
    ].filter(link => link.url)
     .map(link => 
       `<a href="${link.url}" target="_blank" style="margin-right:15px;color:${link.color};">` + 
       `<i class="${link.icon}"></i> ${link.name}` + 
       `</a>`
     );
    
    return { 
      text, 
      links, 
      hasContent: text || links.length > 0 
    };
  }

  /** Prikuplja sve web postavke u jedan objekat */
  collectAllWebSettings() { 
    const el = this.elements.postavke; 
    
    return {
      logoURL: this.state.cache.logoURL,
      currencyCode: this.state.cache.currencyCode,
      footerText: el.footerText?.value.trim() || "",
      instagramUrl: el.instagramUrl?.value.trim() || "",
      facebookUrl: el.facebookUrl?.value.trim() || "",
      youtubeUrl: el.youtubeUrl?.value.trim() || "",
      twitterUrl: el.twitterUrl?.value.trim() || "",
      tiktokUrl: el.tiktokUrl?.value.trim() || "",
      footerEnabled: el.footerEnabled?.checked || false,
      heroTitle: el.heroTitle?.value.trim() || "",
      heroSubtitle: el.heroSubtitle?.value.trim() || ""
    };
  }
}

/* INICIJALIZACIJA APLIKACIJE */
/** Inicijalizacija AdminController-a nakon učitavanja DOM-a */
if (typeof window !== 'undefined' && !window.adminControllerLoaded) { 
  window.adminControllerLoaded = true; 
  
  document.addEventListener('DOMContentLoaded', () => {
    new AdminController();
  });
}