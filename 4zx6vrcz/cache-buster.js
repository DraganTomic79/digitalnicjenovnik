/**
 * Cache Buster - Sprečava probleme s kešom
 * Automatski dodaje timestamp na sve resurse
 */
(function() {
  // Dodaj verziju svim resursima kad se DOM učita
  document.addEventListener('DOMContentLoaded', function() {
    // Generiši timestamp kao verziju
    const version = new Date().getTime();
    
    // Funkcija za dodavanje verzije na URL
    function addVersion(url) {
      if (!url || url.includes('cloudflare') || url.includes('googleapis')) return url;
      const separator = url.includes('?') ? '&' : '?';
      return url + separator + 'v=' + version;
    }
    
    // Dodaj verziju na sve skripte
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src) script.src = addVersion(src);
    });
    
    // Dodaj verziju na sve CSS fajlove
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href) link.href = addVersion(href);
    });
    
    // Dodaj verziju na sve slike
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src) img.src = addVersion(src);
    });
    
    // Ako smo na admin panelu, dodaj dugme za čišćenje keša
    if (window.location.href.includes('admin.html') && document.querySelector('.header')) {
      // Kreiraj dugme
      const clearCacheBtn = document.createElement('button');
      clearCacheBtn.className = 'btn btn-warning btn-sm ms-2';
      clearCacheBtn.innerHTML = '<i class="fas fa-broom"></i> Očisti keš';
      
      // Dodaj dugme u header
      const headerBtns = document.querySelector('.header div');
      if (headerBtns) {
        headerBtns.appendChild(clearCacheBtn);
        
        // Dodaj event listener za klik na dugme
        clearCacheBtn.addEventListener('click', function() {
          // Prikaži obavještenje
          const toastTitle = document.getElementById('toastTitle');
          const toastMessage = document.getElementById('toastMessage');
          const toast = document.getElementById('notificationToast');
          
          if (toastTitle && toastMessage && toast) {
            toastTitle.textContent = 'Informacija';
            toastMessage.textContent = 'Vršim osvježavanje stranice...';
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
          }
          
          // Dodaj timestamp na URL i osvježi stranicu
          setTimeout(() => {
            window.location.href = window.location.href.split('?')[0] + '?v=' + new Date().getTime();
          }, 1000);
        });
      }
      
      // Dodaj info poruku ispod headera
      const headerInfo = document.createElement('div');
      headerInfo.className = 'alert alert-info mt-3';
      headerInfo.innerHTML = '<i class="fas fa-info-circle"></i> <strong>Tip:</strong> Ako ne vidite najnovije promjene, kliknite "Očisti keš" dugme ili pritisnite <code>Ctrl+Shift+R</code>.';
      
      const header = document.querySelector('.header');
      if (header) {
        header.appendChild(headerInfo);
      }
    }
    
    // Dodaj verziju na dinamičke Ajax zahtjeve
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Dodaj verziju samo na lokalne URL-ove
      if (typeof url === 'string' && !url.includes('http')) {
        url = addVersion(url);
      }
      return originalFetch.call(this, url, options);
    };
    
    // Modifikuj XMLHttpRequest da dodaje verziju
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Dodaj verziju samo na lokalne URL-ove
      if (typeof url === 'string' && !url.includes('http')) {
        url = addVersion(url);
      }
      return originalOpen.call(this, method, url, ...args);
    };
  });
})();