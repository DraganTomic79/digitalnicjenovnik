/* ===== ADMIN UI - OPTIMIZOVAN BEZ DUPLIKACIJA ===== */
import { sanitizeText, formatCena, getKategorijaIcon, getPodkategorijaIcon, grupisiPoPodkategorijama, sanitizeIconUrl, CONFIG, debug } from './admin-utils.js';

/* RESPONSIVE HELPERS */
const isDesktop = () => window.innerWidth >= 992;

/* TAB SISTEM */
export function initTabSystem() {
  debug.log('Inicijalizacija tab sistema...');
  if (isDesktop()) { document.querySelectorAll('.tab-content').forEach(tab => { tab.classList.add('active'); tab.style.display = 'block'; }); document.querySelector('.mobile-tabs').style.display = 'none'; }
  else { document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active')); const activeButton = document.querySelector('.tab-btn.active'); const activeTabId = activeButton ? activeButton.getAttribute('data-tab') + '-tab' : 'glavne-kategorije-tab'; const targetTab = document.getElementById(activeTabId); if (targetTab) targetTab.classList.add('active'); else document.getElementById('glavne-kategorije-tab')?.classList.add('active'); document.querySelector('.mobile-tabs').style.display = 'flex'; }
}
let resizeTimeout; window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(initTabSystem, 300); });

/* DROPDOWN FUNKCIJE */
export function osvjeziDropdownKategorija(kategorije, select) { populateDropdown(select, kategorije, { defaultText: 'Odaberite kategoriju', valueField: 'id', textField: 'naziv' }); }
export function osvjeziDropdownGlavnihKategorija(glavne, select) { populateDropdown(select, glavne, { defaultText: 'Odaberite glavnu kategoriju', valueField: 'id', textField: 'naziv' }); }
export function osvjeziDropdownPodkategorija(podkategorije, select) { populateDropdown(select, podkategorije, { defaultText: 'Odaberite podkategoriju', valueField: 'naziv', textField: 'naziv' }); }
function populateDropdown(select, items, config) { if (!select) return; const current = select.value; select.innerHTML = `<option value="">${config.defaultText}</option>`; items.forEach(item => { const option = document.createElement('option'); option.value = item[config.valueField]; option.textContent = item[config.textField]; select.appendChild(option); }); if (current) select.value = current; }

/* KREIRANJE IKONA */
function createIconElement(item, type = 'kategorija') {
  let iconUrl, fallback;
  switch(type) { case 'glavnaKategorija': iconUrl = item.ikona; fallback = 'fa-layer-group'; break; case 'kategorija': iconUrl = item.ikonaKategorije || item.ikona; fallback = 'fa-folder'; break; case 'podkategorija': iconUrl = getPodkategorijaIcon(item); fallback = 'fa-tag'; break; default: iconUrl = getKategorijaIcon(item); fallback = 'fa-folder'; }
  if (!iconUrl || !iconUrl.startsWith('http')) {
    const faClass = (iconUrl && iconUrl.startsWith('fa-')) ? iconUrl : fallback;
    return `<i class="fas ${faClass} list-cat-icon"></i>`;
  }
  const sanitized = sanitizeIconUrl(iconUrl);
  if (!sanitized || !sanitized.startsWith('http')) {
    const faClass = (sanitized && sanitized.startsWith('fa-')) ? sanitized : fallback;
    return `<i class="fas ${faClass} list-cat-icon"></i>`;
  }
  return `<img src="${sanitized}" alt="${sanitizeText(item.naziv)}" class="list-cat-icon-img" onerror="this.outerHTML='<i class=&quot;fas ${fallback} list-cat-icon&quot;></i>';" />`;
}

function createImageElement(item) {
  if (!item.slikaURL) return `<div class="item-image" style="background:#f8f9fa;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ddd;"></i></div>`;
  const sanitized = sanitizeIconUrl(item.slikaURL);
  if (!sanitized) return `<div class="item-image" style="background:#f8f9fa;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ddd;"></i></div>`;
  return `<img src="${sanitized}" alt="${sanitizeText(item.naziv)}" class="item-image" onerror="this.outerHTML='<div class=&quot;item-image&quot; style=&quot;background:#f8f9fa;display:flex;align-items:center;justify-content:center;&quot;><i class=&quot;fas fa-image&quot; style=&quot;color:#ddd;&quot;></i></div>'" />`;
}

/* PRIKAZ ENTITETA */
export function prikaziGlavneKategorije(items, container, onEdit, onDelete, onReorder) { displayEntityList({ items, container, type: 'glavneKategorije', createItemHTML: (item) => createEntityItemHTML(item, 'glavnaKategorija', true), onEdit, onDelete, onReorder, confirmDelete: (item) => `Obrisati glavnu kategoriju "${item.naziv}"?`, sortable: true }); }
export function prikaziKategorije(items, container, onEdit, onDelete, onReorder) { displayEntityList({ items, container, type: 'kategorije', createItemHTML: (item) => createEntityItemHTML(item, 'kategorija', true), onEdit, onDelete, onReorder, confirmDelete: (item) => `Obrisati kategoriju "${item.naziv}"?`, sortable: true }); }
export function prikaziPodkategorije(podkategorije, kategorije, container, onEdit, onDelete, onReorder) { const enhanced = podkategorije.map(p => ({ ...p, kategorijaText: kategorije.find(k => k.id === p.kategorijaId)?.naziv || 'Nepoznata kategorija' })); displayEntityList({ items: enhanced, container, type: 'podkategorije', createItemHTML: (item) => createPodkategorijaItemHTML(item, true), onEdit, onDelete, onReorder, confirmDelete: (item) => `Obrisati podkategoriju "${item.naziv}"?`, sortable: true }); }
export function prikaziArtikle(artikli, podkategorije, container, onEdit, onDelete, onReorder, currency = '', onToggle = null) { container.innerHTML = ""; if (artikli.length === 0) { showEmptyState(container, 'artikli'); return; } const grouped = grupisiPoPodkategorijama(artikli, podkategorije); Object.entries(grouped).forEach(([naziv, items]) => { if (items.length > 0) container.appendChild(createCategoryGroup(naziv, items, { onEdit, onDelete, onReorder, onToggle, currencyCode: currency })); }); }

/* PRIKAZ LISTA */
function displayEntityList(config) {
  const { items, container, type, createItemHTML, onEdit, onDelete, onReorder, confirmDelete, sortable = false } = config;
  container.innerHTML = ""; if (items.length === 0) { showEmptyState(container, type); return; }
  const listContainer = document.createElement('div'); listContainer.className = sortable ? 'sortable-categories' : 'list-container';
  items.forEach(item => { const el = document.createElement('div'); el.className = `${CONFIG.ui.classes.categoryItem} ${sortable ? CONFIG.ui.classes.sortableItem : ''}`; if (sortable) { el.draggable = true; el.dataset.id = item.id; } el.innerHTML = createItemHTML(item); listContainer.appendChild(el); });
  container.appendChild(listContainer); setupEntityEventListeners(container, items, { onEdit, onDelete, confirmDelete }); if (sortable && onReorder) initDragAndDrop(listContainer, onReorder);
}

/* KREIRANJE HTML */
function createEntityItemHTML(item, type, hasDrag = false) { const icon = createIconElement(item, type); const drag = hasDrag ? `<div class="${CONFIG.ui.classes.dragHandle}"><i class="${CONFIG.ui.icons.actions.grip}"></i></div>` : ''; return `<div style="display:flex;align-items:center;flex:1;min-width:0;">${drag}${icon}<strong>${sanitizeText(item.naziv)}</strong></div><div class="${CONFIG.ui.classes.actions}"><button class="btn btn-sm btn-warning btn-edit" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.edit}"></i></button><button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.delete}"></i></button></div>`; }
function createPodkategorijaItemHTML(item, hasDrag = false) { const icon = createIconElement(item, 'podkategorija'); const drag = hasDrag ? `<div class="${CONFIG.ui.classes.dragHandle}"><i class="${CONFIG.ui.icons.actions.grip}"></i></div>` : ''; return `<div style="display:flex;align-items:center;flex:1;min-width:0;">${drag}${icon}<div class="item-details"><strong style="display:block;margin-bottom:4px;">${sanitizeText(item.naziv)}</strong><small class="text-muted" style="display:block;">Kategorija: ${sanitizeText(item.kategorijaText)}</small></div></div><div class="${CONFIG.ui.classes.actions}"><button class="btn btn-sm btn-warning btn-edit" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.edit}"></i></button><button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.delete}"></i></button></div>`; }

function createCategoryGroup(naziv, items, handlers) {
  const { onEdit, onDelete, onReorder, onToggle, currencyCode = '' } = handlers; const katDiv = document.createElement('div'); katDiv.className = 'category-group'; katDiv.innerHTML = `<h4><i class="fas fa-tag"></i> ${sanitizeText(naziv)}</h4>`;
  const sortable = document.createElement('div'); sortable.className = 'sortable-items'; sortable.dataset.category = naziv;
  items.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)).forEach(item => { const el = document.createElement('div'); const jeAktivan = item.aktivna !== false; el.className = `${CONFIG.ui.classes.itemRow} ${CONFIG.ui.classes.sortableItem}${jeAktivan ? '' : ' artikal-neaktivan'}`; el.draggable = true; el.dataset.id = item.id; el.dataset.category = naziv; const price = currencyCode && currencyCode.trim() !== '' ? `${formatCena(item.cijena)} ${currencyCode}` : `${formatCena(item.cijena)}`; const statusBadge = jeAktivan ? `<span class="badge-status badge-aktivan">Aktivan</span>` : `<span class="badge-status badge-neaktivan">Sakriven</span>`; const toggleBtnLabel = jeAktivan ? 'Sakrij' : 'Objavi'; const toggleBtnClass = jeAktivan ? 'btn-toggle-sakrij' : 'btn-toggle-objavi'; el.innerHTML = `<div style="display:flex;align-items:center;flex:1;min-width:0;"><div class="${CONFIG.ui.classes.dragHandle}"><i class="${CONFIG.ui.icons.actions.grip}"></i></div>${createImageElement(item)}<div class="item-info"><div class="item-name">${sanitizeText(item.naziv)} ${statusBadge}</div><div class="item-description">${sanitizeText(item.opis || "")}</div></div></div><div class="item-price">${price}</div><div class="${CONFIG.ui.classes.actions}"><button class="btn btn-sm ${toggleBtnClass} btn-toggle" data-id="${item.id}" data-aktivna="${jeAktivan}">${toggleBtnLabel}</button><button class="btn btn-sm btn-warning btn-edit" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.edit}"></i></button><button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}"><i class="${CONFIG.ui.icons.actions.delete}"></i></button></div>`; sortable.appendChild(el); });
  katDiv.appendChild(sortable); setupArticleEventListeners(sortable, items, { onEdit, onDelete, onToggle }); if (onReorder) initDragAndDropArtikli(sortable, naziv, onReorder); return katDiv;
}

/* EVENT LISTENERS */
function setupEntityEventListeners(container, items, handlers) {
  const { onEdit, onDelete, confirmDelete } = handlers;
  container.querySelectorAll('.btn-edit').forEach(btn => { btn.addEventListener('click', (e) => { const item = items.find(i => i.id === e.currentTarget.getAttribute('data-id')); if (item && onEdit) onEdit(item); }); });
  container.querySelectorAll('.btn-delete').forEach(btn => { btn.addEventListener('click', async (e) => { const item = items.find(i => i.id === e.currentTarget.getAttribute('data-id')); if (item && confirm(confirmDelete(item)) && onDelete) await onDelete(item.id, item.naziv); }); });
}
function setupArticleEventListeners(container, items, handlers) {
  const { onEdit, onDelete, onToggle } = handlers;
  container.querySelectorAll('.btn-toggle').forEach(btn => { btn.addEventListener('click', (e) => { const id = e.currentTarget.getAttribute('data-id'); const trenutnoAktivna = e.currentTarget.getAttribute('data-aktivna') === 'true'; if (onToggle) onToggle(id, trenutnoAktivna); }); });
  container.querySelectorAll('.btn-edit').forEach(btn => { btn.addEventListener('click', (e) => { const item = items.find(i => i.id === e.currentTarget.getAttribute('data-id')); if (item && onEdit) onEdit(item); }); });
  container.querySelectorAll('.btn-delete').forEach(btn => { btn.addEventListener('click', async (e) => { const item = items.find(i => i.id === e.currentTarget.getAttribute('data-id')); if (item && confirm(`Obrisati artikal "${item.naziv}"?`) && onDelete) await onDelete(item.id); }); });
}

/* UI STANJA */
export function setEditMode(isEdit, elements) { toggleButtonVisibility(elements, isEdit); }
export function setEditModeKategorija(isEdit, elements) { toggleButtonVisibility(elements, isEdit); }
function toggleButtonVisibility(elements, isEdit) { const { dodaj, sacuvaj, otkazi } = elements; if (isEdit) { dodaj?.classList.add('d-none'); sacuvaj?.classList.remove('d-none'); otkazi?.classList.remove('d-none'); } else { dodaj?.classList.remove('d-none'); sacuvaj?.classList.add('d-none'); otkazi?.classList.add('d-none'); } }

export function popuniFormuArtikal(artikal, elements) { const fieldMappings = { naziv: artikal.naziv, cijena: artikal.cijena, podkategorijaSelect: artikal.podkategorija, opis: artikal.opis || "" }; Object.entries(fieldMappings).forEach(([field, value]) => { if (elements[field]) elements[field].value = value; }); }
export function ocistiFormuArtikal(elements) { clearFormFields(elements, ['naziv', 'cijena', 'podkategorijaSelect', 'opis', 'slika']); }
export function ocistiFormuKategorija(elements) { clearFormFields(elements, ['naziv', 'ikona', 'kategorijaSelect']); if (elements.previewContainer) elements.previewContainer.innerHTML = '<p>Ikona trenutno nije odabrana</p>'; }
function clearFormFields(elements, fields) { fields.forEach(field => { if (elements[field]) elements[field].value = ""; }); }

/* LOADING I ERROR */
export function showLoading(containerElement) { showStateMessage(containerElement, { icon: CONFIG.ui.icons.loading, message: CONFIG.ui.messages.loading, iconSize: 'fa-2x' }); }
export function showError(containerElement, poruka) { showStateMessage(containerElement, { icon: CONFIG.ui.icons.error, message: sanitizeText(poruka), iconSize: 'fa-2x', color: '#dc3545' }); }
function showEmptyState(containerElement, type) { showStateMessage(containerElement, { icon: CONFIG.ui.icons.empty[type], message: CONFIG.ui.messages.noItems[type], iconSize: 'fa-2x', wrapperClass: CONFIG.ui.classes.emptyState }); }
function showStateMessage(containerElement, config) { const { icon, message, iconSize = '', color = '', wrapperClass = '' } = config; containerElement.innerHTML = `<div ${wrapperClass ? `class="${wrapperClass}"` : ''} style="text-align:center;padding:40px;${color ? `color:${color};` : ''}"><i class="${icon} ${iconSize}"></i><p style="margin-top:10px;">${message}</p></div>`; }

/* DRAG & DROP */
function initDragAndDrop(container, onReorderCallback) { const dragState = { draggedElement: null, placeholder: null }; const handlers = { dragstart: (e) => handleDragStart(e, dragState), dragend: (e) => handleDragEnd(e, dragState), dragover: (e) => handleDragOver(e, container, dragState), drop: (e) => handleDrop(e, container, dragState, onReorderCallback) }; Object.entries(handlers).forEach(([event, handler]) => container.addEventListener(event, handler)); }
function initDragAndDropArtikli(container, podkategorijaNaziv, onReorderCallback) { initDragAndDrop(container, (newOrder) => onReorderCallback(podkategorijaNaziv, newOrder)); }
function handleDragStart(e, dragState) { const sortableItem = e.target.closest(`.${CONFIG.ui.classes.sortableItem}`); if (!sortableItem) return; dragState.draggedElement = sortableItem; sortableItem.style.opacity = '0.5'; sortableItem.classList.add('dragging'); dragState.placeholder = document.createElement('div'); dragState.placeholder.className = CONFIG.ui.classes.dragPlaceholder; dragState.placeholder.style.height = sortableItem.offsetHeight + 'px'; }
function handleDragEnd(e, dragState) { const sortableItem = e.target.closest(`.${CONFIG.ui.classes.sortableItem}`); if (sortableItem === dragState.draggedElement) { sortableItem.style.opacity = ''; sortableItem.classList.remove('dragging'); if (dragState.placeholder?.parentNode) dragState.placeholder.parentNode.removeChild(dragState.placeholder); dragState.draggedElement = null; dragState.placeholder = null; } }
function handleDragOver(e, container, dragState) { e.preventDefault(); if (!dragState.draggedElement || !dragState.placeholder) return; const afterElement = getDragAfterElement(container, e.clientY); if (afterElement == null) container.appendChild(dragState.placeholder); else container.insertBefore(dragState.placeholder, afterElement); }
function handleDrop(e, container, dragState, onReorderCallback) { e.preventDefault(); if (!dragState.draggedElement || !dragState.placeholder) return; if (dragState.placeholder.nextSibling) container.insertBefore(dragState.draggedElement, dragState.placeholder.nextSibling); else container.appendChild(dragState.draggedElement); if (dragState.placeholder.parentNode) dragState.placeholder.parentNode.removeChild(dragState.placeholder); const newOrder = Array.from(container.children).filter(child => child.classList.contains(CONFIG.ui.classes.sortableItem)).map(child => child.dataset.id); if (onReorderCallback) onReorderCallback(newOrder); }
function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll(`.${CONFIG.ui.classes.sortableItem}:not(.dragging)`)]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }

/* MOBILNE OPTIMIZACIJE */
export function isMobileDevice() { return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }
export function initMobileOptimizations() { if (!isMobileDevice()) return; document.body.classList.add('mobile-device'); initTabSystem(); }

/* INICIJALIZACIJA */
if (typeof window !== 'undefined') { document.addEventListener('DOMContentLoaded', () => { initMobileOptimizations(); initTabSystem(); }); }