/* ===== ADMIN UTILS - CENTRALIZOVANA KONFIGURACIJA I VALIDACIJE ===== */

/* CENTRALNI CONFIG */
/** Globalna konfiguracija za validacije, UI elemente i default vrednosti */
export const CONFIG = {
  validation: {
    kategorija: { minLength: 2, maxLength: 50, required: true },
    podkategorija: { minLength: 2, maxLength: 50, required: true },
    artikal: {
      naziv: { required: true },
      cijena: { required: true, min: 0 },
      podkategorija: { required: true }
    },
    slika: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    }
  },
  ui: {
    toast: {
      autoHideDelay: 5000,
      fadeOutDuration: 300,
      icons: {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      }
    },
    icons: {
      loading: 'fas fa-spinner fa-spin',
      error: 'fas fa-exclamation-triangle',
      empty: {
        kategorije: 'fas fa-folder-open',
        podkategorije: 'fas fa-tags',
        artikli: 'fas fa-utensils',
        glavneKategorije: 'fas fa-layer-group'
      },
      actions: {
        edit: 'fas fa-edit',
        delete: 'fas fa-trash',
        grip: 'fas fa-grip-vertical'
      }
    },
    classes: {
      categoryItem: 'category-item',
      sortableItem: 'sortable-item',
      itemRow: 'item-row',
      dragHandle: 'drag-handle',
      dragPlaceholder: 'drag-placeholder',
      emptyState: 'empty-state',
      actions: 'actions'
    },
    messages: {
      loading: 'Učitavanje...',
      noItems: {
        kategorije: 'Nema kategorija',
        podkategorije: 'Nema podkategorija',
        artikli: 'Nema unesenih artikala',
        glavneKategorije: 'Nema glavnih kategorija'
      }
    }
  },
  defaults: {
    icons: {
      glavnaKategorija: 'fa-layer-group',
      kategorija: 'fa-folder',
      podkategorija: 'fa-tag'
    }
  }
};

/* DEBUG HELPER */
/** Logging funkcije koje se mogu uključiti/isključiti kroz DEBUG_MODE */
const DEBUG_MODE = false;
export const debug = {
  log: (...args) => DEBUG_MODE && console.log(...args),
  warn: (...args) => DEBUG_MODE && console.warn(...args),
  error: (...args) => console.error(...args)
};

/* SANITIZACIJA IKONA */
/** Proverava i čisti URL-ove ikona radi sprečavanja XSS napada */
export function sanitizeIconUrl(iconUrl) {
  if (!iconUrl || typeof iconUrl !== 'string') return null;
  
  const problematic = [
    '11pdp1fddsrbnckydn3e', 
    'mq7zginxbhnbnyvflunb', 
    'localhost', 
    '127.0.0.1', 
    'undefined', 
    'null'
  ];
  
  if (problematic.some(str => iconUrl.includes(str))) { 
    debug.warn('Blokiran problematičan string:', iconUrl); 
    return null; 
  }
  
  if (iconUrl.startsWith('fa-')) return iconUrl;
  
  try { 
    const url = new URL(iconUrl); 
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname && url.hostname.includes('.')) 
      return iconUrl; 
  } catch (e) { 
    debug.warn('Nevaljan URL:', iconUrl); 
  }
  
  if (iconUrl.length < 50 && !iconUrl.includes('.') && !iconUrl.includes('/') && !iconUrl.startsWith('fa-')) 
    return null;
  
  if (iconUrl.startsWith('https://') || iconUrl.startsWith('http://')) { 
    try { 
      const url = new URL(iconUrl); 
      if (!url.hostname || !url.hostname.includes('.')) 
        return null; 
    } catch (e) { 
      return null; 
    } 
  }
  
  return null;
}

/* DEFAULT IKONE FUNKCIJE */
/** Vraća odgovarajuću FA ikonu za glavnu kategoriju prema nazivu */
export function getDefaultGlavnaKategorijaIcon(naziv) {
  const n = naziv.toLowerCase();
  
  if (n.includes('restoran') || n.includes('hrana')) 
    return 'fa-utensils';
  if (n.includes('uslug') || n.includes('servis')) 
    return 'fa-concierge-bell';
  if (n.includes('trgovin') || n.includes('shop')) 
    return 'fa-shopping-bag';
  if (n.includes('zdravlje') || n.includes('medicin')) 
    return 'fa-heartbeat';
  if (n.includes('edukacij') || n.includes('škol')) 
    return 'fa-graduation-cap';
  if (n.includes('tehnologi') || n.includes('it')) 
    return 'fa-laptop-code';
  if (n.includes('sport') || n.includes('fitnes')) 
    return 'fa-dumbbell';
    
  return 'fa-layer-group';
}

/** Vraća odgovarajuću FA ikonu za kategoriju prema nazivu */
export function getDefaultKategorijaIcon(naziv) {
  const n = naziv.toLowerCase();
  
  if (n.includes('restoran') || n.includes('hrana')) 
    return 'fa-utensils';
  if (n.includes('bar') || n.includes('kafić')) 
    return 'fa-coffee';
  if (n.includes('brza hrana')) 
    return 'fa-hamburger';
  if (n.includes('picerija')) 
    return 'fa-pizza-slice';
  if (n.includes('ljepot') || n.includes('lepot')) 
    return 'fa-cut';
  if (n.includes('zdravlje')) 
    return 'fa-stethoscope';
  if (n.includes('auto')) 
    return 'fa-car';
  if (n.includes('trgovin')) 
    return 'fa-shopping-cart';
    
  return 'fa-folder';
}

/** Vraća odgovarajuću FA ikonu za podkategoriju prema nazivu */
export function getDefaultPodkategorijaIcon(naziv) {
  const n = naziv.toLowerCase();
  
  if (n.includes('pice') || n.includes('piće') || n.includes('sok')) 
    return 'fa-coffee';
  if (n.includes('hrana') || n.includes('jelo') || n.includes('meso')) 
    return 'fa-utensils';
  if (n.includes('desert') || n.includes('sladoled')) 
    return 'fa-ice-cream';
  if (n.includes('pizza')) 
    return 'fa-pizza-slice';
  if (n.includes('burger')) 
    return 'fa-hamburger';
  if (n.includes('salata') || n.includes('voće')) 
    return 'fa-leaf';
    
  return 'fa-tag';
}

/* VALIDACIJSKI SISTEM */
/** Klasa sa statičkim metodama za validaciju podataka */
class Validator {
  static validateRequired(value, fieldName) { 
    return !value || (typeof value === 'string' && value.trim() === '') 
      ? `${fieldName} je obavezan` 
      : null; 
  }
  
  static validateLength(value, min, max, fieldName) { 
    const errors = []; 
    const length = value ? value.length : 0; 
    
    if (min && length < min) 
      errors.push(`${fieldName} mora imati najmanje ${min} karaktera`); 
      
    if (max && length > max) 
      errors.push(`${fieldName} može imati maksimalno ${max} karaktera`); 
      
    return errors; 
  }
  
  static validateNumeric(value, min, fieldName) { 
    const errors = []; 
    const numValue = parseFloat(typeof value === 'string' ? value.replace(',', '.') : value); 
    
    if (isNaN(numValue)) 
      errors.push(`${fieldName} mora biti broj`); 
    else if (min !== undefined && numValue <= min) 
      errors.push(`${fieldName} mora biti pozitivna vrijednost`); 
      
    return errors; 
  }
  
  static validateDuplicate(value, existingItems, editId, fieldName, compareFn) { 
    const duplicate = existingItems.find(item => compareFn(item, value)); 
    
    if (duplicate && (!editId || duplicate.id !== editId)) 
      return `${fieldName} "${value}" već postoji`; 
      
    return null; 
  }
}

/* VALIDACIJSKE FUNKCIJE */
/** Validira kategoriju (obavezno, dužina, duplikat) */
export function validirajKategoriju(naziv, postojece, editId = null) {
  const errors = []; 
  const config = CONFIG.validation.kategorija;
  
  const req = Validator.validateRequired(naziv, 'Naziv kategorije');
  if (req) 
    return { isValid: false, errors: [req] };
    
  errors.push(...Validator.validateLength(naziv, config.minLength, config.maxLength, 'Naziv kategorije'));
  
  const dup = Validator.validateDuplicate(
    naziv, 
    postojece, 
    editId, 
    'Kategorija', 
    (item, value) => item.naziv.toLowerCase().trim() === value.toLowerCase().trim()
  );
  
  if (dup) 
    errors.push(dup);
    
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/** Validira podkategoriju (obavezno, dužina, duplikat) */
export function validirajPodkategoriju(naziv, postojece, editId = null) {
  const errors = []; 
  const config = CONFIG.validation.podkategorija;
  
  const req = Validator.validateRequired(naziv, 'Naziv podkategorije');
  if (req) 
    return { isValid: false, errors: [req] };
    
  errors.push(...Validator.validateLength(naziv, config.minLength, config.maxLength, 'Naziv podkategorije'));
  
  const dup = Validator.validateDuplicate(
    naziv, 
    postojece, 
    editId, 
    'Podkategorija', 
    (item, value) => item.naziv.toLowerCase().trim() === value.toLowerCase().trim()
  );
  
  if (dup) 
    errors.push(dup);
    
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/** Validira artikal (naziv, cijena, podkategorija) */
export function validirajArtikal(naziv, cijena, podkategorija) {
  const errors = []; 
  const config = CONFIG.validation.artikal;
  
  const nazivError = Validator.validateRequired(naziv, 'Naziv artikla');
  if (nazivError) 
    errors.push(nazivError);
    
  const cijenaError = Validator.validateRequired(cijena, 'Cijena artikla');
  if (cijenaError) 
    errors.push(cijenaError);
  else 
    errors.push(...Validator.validateNumeric(cijena, config.cijena.min, 'Cijena'));
    
  if (!podkategorija || podkategorija.trim() === '') 
    errors.push('Podkategorija nije izabrana');
    
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/** Validira sliku (veličina, format) */
export function validirajSliku(file) {
  const errors = []; 
  const config = CONFIG.validation.slika;
  
  if (!file) 
    return { isValid: true, errors: [] };
    
  if (file.size > config.maxSize) 
    errors.push('Slika je prevelika. Maksimalna veličina je 5MB');
    
  if (!config.allowedTypes.includes(file.type)) 
    errors.push('Nepodržan format slike. Dozvoljeni formati: JPEG, PNG, GIF, WebP');
    
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/* OBRADA TEKSTA */
/** Sanitizuje tekst protiv XSS napada */
export function sanitizeText(text) { 
  if (typeof text !== 'string') 
    return ''; 
    
  const map = { 
    '<': '&lt;', 
    '>': '&gt;', 
    '"': '&quot;', 
    "'": '&#x27;', 
    '/': '&#x2F;' 
  }; 
  
  return text.replace(/[<>"'/]/g, char => map[char]); 
}

/** Formatira cijenu na dva decimalna mjesta */
export function formatCena(cena) { 
  const normalized = typeof cena === 'string' ? cena.replace(',', '.') : cena; 
  const broj = parseFloat(normalized); 
  
  return isNaN(broj) ? '0.00' : broj.toFixed(2); 
}

/* UPRAVLJANJE IKONAMA */
/** Dobavlja ikonu kategorije ili vraća default */
export function getKategorijaIcon(kategorija) { 
  const ikona = kategorija.ikonaKategorije; 
  
  if (!ikona) 
    return CONFIG.defaults.icons.kategorija; 
    
  const sanitized = sanitizeIconUrl(ikona); 
  return sanitized || CONFIG.defaults.icons.kategorija; 
}

/** Dobavlja ikonu podkategorije ili vraća default */
export function getPodkategorijaIcon(podkategorija) { 
  const ikona = podkategorija.ikona; 
  
  if (!ikona) 
    return CONFIG.defaults.icons.podkategorija; 
    
  const sanitized = sanitizeIconUrl(ikona); 
  return sanitized || CONFIG.defaults.icons.podkategorija; 
}

/* OBRADA PODATAKA */
/** Grupiše artikle po kategorijama */
export function grupisiPoKategorijama(artikli, kategorije) { 
  const grupisani = kategorije.reduce((groups, kat) => { 
    groups[kat.naziv] = []; 
    return groups; 
  }, {}); 
  
  artikli.forEach(artikal => { 
    const key = artikal.kategorija || 'Other'; 
    
    if (!grupisani[key]) 
      grupisani[key] = []; 
      
    grupisani[key].push(artikal); 
  }); 
  
  return grupisani; 
}

/** Grupiše artikle po podkategorijama */
export function grupisiPoPodkategorijama(artikli, podkategorije) { 
  const grupisani = podkategorije.reduce((groups, podkat) => { 
    groups[podkat.naziv] = []; 
    return groups; 
  }, {}); 
  
  artikli.forEach(artikal => { 
    const key = artikal.podkategorija || artikal.kategorija || 'Other'; 
    
    if (!grupisani[key]) 
      grupisani[key] = []; 
      
    grupisani[key].push(artikal); 
  }); 
  
  return grupisani; 
}

/** Filtrira podkategorije za određenu kategoriju */
export function getPodkategorijeForKategorija(podkategorije, kategorijaId) { 
  return podkategorije.filter(p => p.kategorijaId === kategorijaId); 
}

/** Filtrira artikle za određenu podkategoriju */
export function getArtikliForPodkategorija(artikli, naziv) { 
  return artikli.filter(a => a.podkategorija === naziv || a.kategorija === naziv); 
}

/* UI STATE MANAGEMENT */
/** Postavlja/uklanja loading stanje na dugmetu */
export function setLoadingState(button, isLoading) { 
  if (!button) 
    return; 
    
  if (isLoading) { 
    button.disabled = true; 
    button.dataset.originalText = button.innerHTML; 
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Molimo sačekajte...'; 
  } else { 
    button.disabled = false; 
    
    if (button.dataset.originalText) { 
      button.innerHTML = button.dataset.originalText; 
      delete button.dataset.originalText; 
    } 
  } 
}

/* NOTIFIKACIJE */
/** Prikazuje toast notifikaciju (success, error, warning, info) */
export function prikaziPoruku(poruka, tip = 'info') {
  const toast = document.getElementById('notificationToast'); 
  const title = document.getElementById('toastTitle'); 
  const message = document.getElementById('toastMessage');
  
  if (!toast || !title || !message) { 
    alert(poruka); 
    return; 
  }
  
  const tipovi = { 
    success: { 
      title: 'Uspjeh', 
      class: 'text-success', 
      icon: 'fas fa-check-circle' 
    }, 
    error: { 
      title: 'Greška', 
      class: 'text-danger', 
      icon: 'fas fa-exclamation-circle' 
    }, 
    warning: { 
      title: 'Upozorenje', 
      class: 'text-warning', 
      icon: 'fas fa-exclamation-triangle' 
    }, 
    info: { 
      title: 'Info', 
      class: 'text-info', 
      icon: 'fas fa-info-circle' 
    } 
  };
  
  const config = tipovi[tip] || tipovi.info;
  
  title.innerHTML = `<i class="${config.icon}"></i> ${config.title}`; 
  title.className = `me-auto ${config.class}`; 
  message.textContent = poruka;
  
  new bootstrap.Toast(toast, { 
    delay: tip === 'error' ? 5000 : 3000 
  }).show();
}

/* UTILITY HELPERS */
/** Debounce - odlaže izvršavanje funkcije */
export function debounce(func, wait) { 
  let timeout; 
  
  return function(...args) { 
    clearTimeout(timeout); 
    timeout = setTimeout(() => func(...args), wait); 
  }; 
}

/** Throttle - ograničava učestalost poziva funkcije */
export function throttle(func, limit) { 
  let inThrottle; 
  
  return function(...args) { 
    if (!inThrottle) { 
      func.apply(this, args); 
      inThrottle = true; 
      setTimeout(() => inThrottle = false, limit); 
    } 
  }; 
}

/** Generiše jedinstveni ID */
export const generateId = () => 
  Date.now().toString(36) + Math.random().toString(36).substr(2);

/** Proverava validnost email formata */
export const isValidEmail = (email) => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Formatira datum u lokalni format (DD.MM.YYYY) */
export function formatDate(date) { 
  if (!(date instanceof Date)) 
    date = new Date(date); 
    
  return date.toLocaleDateString('sr-RS', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }); 
}

/** Formatira veličinu fajla (B, KB, MB, GB) */
export function formatFileSize(bytes) { 
  if (bytes === 0) 
    return '0 Bytes'; 
    
  const k = 1024; 
  const sizes = ['Bytes', 'KB', 'MB', 'GB']; 
  const i = Math.floor(Math.log(bytes) / Math.log(k)); 
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; 
}

/** Kopira tekst u clipboard */
export function copyToClipboard(text) { 
  if (navigator.clipboard && window.isSecureContext) 
    return navigator.clipboard.writeText(text); 
    
  const textArea = document.createElement('textarea'); 
  textArea.value = text; 
  textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px'; 
  
  document.body.appendChild(textArea); 
  textArea.select(); 
  
  try { 
    document.execCommand('copy'); 
    textArea.remove(); 
    return Promise.resolve(); 
  } catch (error) { 
    textArea.remove(); 
    return Promise.reject(error); 
  } 
}

/** Memoizira funkciju za bolje performanse */
export function memoize(fn) { 
  const cache = new Map(); 
  
  return function(...args) { 
    const key = JSON.stringify(args); 
    
    if (cache.has(key)) 
      return cache.get(key); 
      
    const result = fn.apply(this, args); 
    cache.set(key, result); 
    
    return result; 
  }; 
}