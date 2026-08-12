/* ===== ADMIN FIREBASE - SA IMPORTOM DEFAULT IKONA IZ UTILS ===== */
import { db, auth } from "../firebase-config-kafic3.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getDefaultGlavnaKategorijaIcon, getDefaultKategorijaIcon, getDefaultPodkategorijaIcon, debug } from './admin-utils.js';

/* KONFIGURACIJA */
const CONFIG = { imgbb: { apiKey: "601149311b1536ee89b01d92e3a22611", uploadUrl: "https://api.imgbb.com/1/upload" }, collections: { glavneKategorije: "glavne-kategorije", kategorije: "kategorije", podkategorije: "podkategorije", artikli: "meni", postavke: "postavke", webPostavke: "web-postavke" }, fallbackSortOrder: 999 };
const NEPOZNATA_KATEGORIJA = { naziv: "Nepoznato", ikona: "fa-question-circle", id: "nepoznato-categoria-id" };

/* AUTENTIFIKACIJA */
export function initAuth(callback) { onAuthStateChanged(auth, (user) => !user ? window.location.href = "login.html" : callback?.(user)); }

/* GENERIC FIRESTORE SERVICE */
class FirestoreService {
  constructor(collectionName, entityName) { this.collectionName = collectionName; this.entityName = entityName; this.collection = collection(db, collectionName); }

  async load(customQuery = null) {
    try {
      debug.log(`Učitavam ${this.entityName}...`); const q = customQuery || query(this.collection, orderBy("sortOrder", "asc")); const snapshot = await getDocs(q); const items = []; snapshot.forEach((doc) => { const data = doc.data(); items.push({ id: doc.id, ...data, sortOrder: data.sortOrder || CONFIG.fallbackSortOrder }); }); debug.log(`Učitano ${items.length} ${this.entityName}:`, items); return items;
    } catch (error) { return this.handleLoadError(error); }
  }

  async loadFallback() { try { const snapshot = await getDocs(this.collection); const items = []; snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() })); return items; } catch (error) { debug.error(`Greška pri fallback učitavanju ${this.entityName}:`, error); return []; } }

  async handleLoadError(error) { debug.error(`Greška pri učitavanju ${this.entityName} sa sortOrder:`, error); const fallbackItems = await this.loadFallback(); return fallbackItems.length > 0 ? await this.initializeSortOrder(fallbackItems) : []; }

  async add(data, calculateSortOrder = true) {
    try {
      debug.log(`Dodajem ${this.entityName}:`, data); if (calculateSortOrder && !data.sortOrder) data.sortOrder = await this.getNextSortOrder(data); const finalData = { ...data, aktivna: data.aktivna !== undefined ? data.aktivna : true, kreirano: new Date() }; debug.log(`Finalni podaci za ${this.entityName}:`, finalData); const docRef = await addDoc(this.collection, finalData); debug.log(`${this.entityName} "${data.naziv}" dodan uspješno sa ID: ${docRef.id}`); return docRef.id;
    } catch (error) { debug.error(`Greška pri dodavanju ${this.entityName}:`, error); throw new Error(`Nije moguće dodati ${this.entityName}: ${error.message}`); }
  }

  async update(id, data) { 
    try { debug.log(`Ažuriram ${this.entityName} ${id}:`, data); const updateData = { ...data, azurirano: new Date() }; await updateDoc(doc(db, this.collectionName, id), updateData); debug.log(`${this.entityName} ${id} ažuriran uspješno`); return true; } catch (error) { debug.error(`Greška pri ažuriranju ${this.entityName}:`, error); throw new Error(`Nije moguće ažurirati ${this.entityName}: ${error.message}`); } 
  }

  async delete(id) { try { await deleteDoc(doc(db, this.collectionName, id)); debug.log(`${this.entityName} ${id} obrisan`); return true; } catch (error) { debug.error(`Greška pri brisanju ${this.entityName}:`, error); throw new Error(`Nije moguće obrisati ${this.entityName}: ${error.message}`); } }

  async getNextSortOrder(data) {
    try {
      let maxSortOrder = 0;
      if (this.collectionName === CONFIG.collections.artikli && data.podkategorija) { const q = query(this.collection, where("podkategorija", "==", data.podkategorija), orderBy("sortOrder", "desc")); const snapshot = await getDocs(q); snapshot.forEach((doc) => { const docData = doc.data(); if (docData.sortOrder && docData.sortOrder > maxSortOrder) maxSortOrder = docData.sortOrder; }); } else if (this.collectionName === CONFIG.collections.podkategorije && data.kategorijaId) { const q = query(this.collection, where("kategorijaId", "==", data.kategorijaId), orderBy("sortOrder", "desc")); const snapshot = await getDocs(q); snapshot.forEach((doc) => { const docData = doc.data(); if (docData.sortOrder && docData.sortOrder > maxSortOrder) maxSortOrder = docData.sortOrder; }); } else { const items = await this.loadFallback(); maxSortOrder = Math.max(...items.map(item => item.sortOrder || 0), 0); }
      return maxSortOrder + 1;
    } catch (error) { debug.error(`Greška pri računanju sortOrder za ${this.entityName}:`, error); return CONFIG.fallbackSortOrder; }
  }

  async initializeSortOrder(items) {
    debug.log(`Inicijalizujem sortOrder za ${items.length} ${this.entityName}...`); const promises = items.map((item, index) => { if (typeof item.sortOrder === 'undefined') { const newSortOrder = index + 1; item.sortOrder = newSortOrder; return updateDoc(doc(db, this.collectionName, item.id), { sortOrder: newSortOrder }); } return null; }).filter(Boolean); if (promises.length > 0) { await Promise.all(promises); debug.log(`SortOrder inicijalizacija za ${this.entityName} završena uspješno`); } return items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async updateSortOrder(items) {
    debug.log(`Ažuriram redosled za ${items.length} ${this.entityName}...`); if (!Array.isArray(items) || items.length === 0) throw new Error("Nevalidni podaci za ažuriranje redosleda"); const promises = items.map((item, index) => { const newSortOrder = index + 1; if (!item.id) { debug.warn(`${this.entityName} bez ID preskočen:`, item); return null; } return updateDoc(doc(db, this.collectionName, item.id), { sortOrder: newSortOrder }); }).filter(Boolean); await Promise.all(promises); debug.log(`Redosled ${this.entityName} uspješno ažuriran u Firebase`); return true;
  }
}

/* SERVICE INSTANCES */
const services = { glavneKategorije: new FirestoreService(CONFIG.collections.glavneKategorije, "glavna kategorija"), kategorije: new FirestoreService(CONFIG.collections.kategorije, "kategorija"), podkategorije: new FirestoreService(CONFIG.collections.podkategorije, "podkategorija"), artikli: new FirestoreService(CONFIG.collections.artikli, "artikal") };

/* KASKADNO BRISANJE */
export async function obrisiGlavnuKategorijuKaskadno(glavnaKategorijaId, nazivGlavneKategorije) {
  try {
    debug.log(`Početak kaskadnog brisanja glavne kategorije: ${nazivGlavneKategorije}`);
    const q1 = query(services.kategorije.collection, where("glavnaKategorijaId", "==", glavnaKategorijaId)); const kategorijeSnapshot = await getDocs(q1); const kategorijeZaBrisanje = []; kategorijeSnapshot.forEach((doc) => { kategorijeZaBrisanje.push({ id: doc.id, naziv: doc.data().naziv }); }); debug.log(`Pronađeno ${kategorijeZaBrisanje.length} kategorija za brisanje:`, kategorijeZaBrisanje);
    let ukupnoPodkategorija = 0; let ukupnoArtikala = 0; const artikliZaPrebacivanje = [];
    for (const kategorija of kategorijeZaBrisanje) { const q2 = query(services.podkategorije.collection, where("kategorijaId", "==", kategorija.id)); const podkategorijeSnapshot = await getDocs(q2); const podkategorijeNazivi = []; podkategorijeSnapshot.forEach((doc) => { ukupnoPodkategorija++; podkategorijeNazivi.push(doc.data().naziv); }); for (const podkategorijaNaziv of podkategorijeNazivi) { const q3 = query(services.artikli.collection, where("podkategorija", "==", podkategorijaNaziv)); const artikliSnapshot = await getDocs(q3); artikliSnapshot.forEach((doc) => { const artikalData = doc.data(); artikliZaPrebacivanje.push({ id: doc.id, naziv: artikalData.naziv, staraPodkategorija: podkategorijaNaziv }); ukupnoArtikala++; }); } }
    debug.log(`Statistike brisanja: Glavna kategorija: 1, Kategorije: ${kategorijeZaBrisanje.length}, Podkategorije: ${ukupnoPodkategorija}, Artikli za prebaciti: ${ukupnoArtikala}`);
    await kreirajNepoznatuKategoriju();
    debug.log('Prebacujem artikle u nepoznatu kategoriju...'); for (const artikal of artikliZaPrebacivanje) { await services.artikli.update(artikal.id, { podkategorija: NEPOZNATA_KATEGORIJA.naziv, podkategorijaId: NEPOZNATA_KATEGORIJA.id, staraPodkategorija: artikal.staraPodkategorija, prebacenoDatum: new Date() }); debug.log(`Artikal "${artikal.naziv}" prebačen iz "${artikal.staraPodkategorija}" u "Nepoznato"`); }
    debug.log('Brišem podkategorije...'); for (const kategorija of kategorijeZaBrisanje) { const q2 = query(services.podkategorije.collection, where("kategorijaId", "==", kategorija.id)); const podkategorijeSnapshot = await getDocs(q2); const brisanjePodkategorija = []; podkategorijeSnapshot.forEach((doc) => { brisanjePodkategorija.push(services.podkategorije.delete(doc.id)); }); if (brisanjePodkategorija.length > 0) { await Promise.all(brisanjePodkategorija); } }
    debug.log('Brišem kategorije...'); const brisanjeKategorija = kategorijeZaBrisanje.map(kategorija => services.kategorije.delete(kategorija.id)); if (brisanjeKategorija.length > 0) { await Promise.all(brisanjeKategorija); }
    debug.log('Brišem glavnu kategoriju...'); await services.glavneKategorije.delete(glavnaKategorijaId);
    debug.log(`Kaskadno brisanje završeno uspješno!`);
    return { success: true, message: `Glavna kategorija "${nazivGlavneKategorije}" i sve povezane kategorije su obrisane. ${ukupnoArtikala} artikala je prebačeno u "Nepoznato".`, statistike: { glavnaKategorija: 1, kategorije: kategorijeZaBrisanje.length, podkategorije: ukupnoPodkategorija, artiklPrebaceno: ukupnoArtikala } };
  } catch (error) { debug.error('Greška u kaskadnom brisanju glavne kategorije:', error); throw new Error(`Greška kaskadnog brisanja: ${error.message}`); }
}

export async function obrisiKategorijuKaskadno(kategorijaId, nazivKategorije) {
  try {
    debug.log(`Početak kaskadnog brisanja kategorije: ${nazivKategorije}`);
    const q1 = query(services.podkategorije.collection, where("kategorijaId", "==", kategorijaId)); const podkategorijeSnapshot = await getDocs(q1); const podkategorijeZaBrisanje = []; podkategorijeSnapshot.forEach((doc) => { podkategorijeZaBrisanje.push({ id: doc.id, naziv: doc.data().naziv }); }); debug.log(`Pronađeno ${podkategorijeZaBrisanje.length} podkategorija za brisanje:`, podkategorijeZaBrisanje);
    let ukupnoArtikala = 0; const artikliZaPrebacivanje = [];
    for (const podkategorija of podkategorijeZaBrisanje) { const q2 = query(services.artikli.collection, where("podkategorija", "==", podkategorija.naziv)); const artikliSnapshot = await getDocs(q2); artikliSnapshot.forEach((doc) => { const artikalData = doc.data(); artikliZaPrebacivanje.push({ id: doc.id, naziv: artikalData.naziv, staraPodkategorija: podkategorija.naziv }); ukupnoArtikala++; }); }
    debug.log(`Statistike brisanja: Kategorija: 1, Podkategorije: ${podkategorijeZaBrisanje.length}, Artikli za prebaciti: ${ukupnoArtikala}`);
    await kreirajNepoznatuKategoriju();
    debug.log('Prebacujem artikle u nepoznatu kategoriju...'); for (const artikal of artikliZaPrebacivanje) { await services.artikli.update(artikal.id, { podkategorija: NEPOZNATA_KATEGORIJA.naziv, podkategorijaId: NEPOZNATA_KATEGORIJA.id, staraPodkategorija: artikal.staraPodkategorija, prebacenoDatum: new Date() }); debug.log(`Artikal "${artikal.naziv}" prebačen iz "${artikal.staraPodkategorija}" u "Nepoznato"`); }
    debug.log('Brišem podkategorije...'); const brisanjePodkategorija = podkategorijeZaBrisanje.map(podkat => services.podkategorije.delete(podkat.id)); if (brisanjePodkategorija.length > 0) { await Promise.all(brisanjePodkategorija); }
    debug.log('Brišem kategoriju...'); await services.kategorije.delete(kategorijaId);
    debug.log(`Kaskadno brisanje kategorije završeno uspješno!`);
    return { success: true, message: `Kategorija "${nazivKategorije}" i sve povezane podkategorije su obrisane. ${ukupnoArtikala} artikala je prebačeno u "Nepoznato".`, statistike: { kategorija: 1, podkategorije: podkategorijeZaBrisanje.length, artiklPrebaceno: ukupnoArtikala } };
  } catch (error) { debug.error('Greška u kaskadnom brisanju kategorije:', error); throw new Error(`Greška kaskadnog brisanja: ${error.message}`); }
}

export async function obrisiPodkategorijuKaskadno(podkategorijaId, nazivPodkategorije) {
  try {
    debug.log(`Početak kaskadnog brisanja podkategorije: ${nazivPodkategorije}`);
    const q1 = query(services.artikli.collection, where("podkategorija", "==", nazivPodkategorije)); const artikliSnapshot = await getDocs(q1); const artikliZaPrebacivanje = []; artikliSnapshot.forEach((doc) => { const artikalData = doc.data(); artikliZaPrebacivanje.push({ id: doc.id, naziv: artikalData.naziv, staraPodkategorija: nazivPodkategorije }); }); debug.log(`Pronađeno ${artikliZaPrebacivanje.length} artikala za prebaciti`);
    await kreirajNepoznatuKategoriju();
    debug.log('Prebacujem artikle u nepoznatu kategoriju...'); for (const artikal of artikliZaPrebacivanje) { await services.artikli.update(artikal.id, { podkategorija: NEPOZNATA_KATEGORIJA.naziv, podkategorijaId: NEPOZNATA_KATEGORIJA.id, staraPodkategorija: artikal.staraPodkategorija, prebacenoDatum: new Date() }); debug.log(`Artikal "${artikal.naziv}" prebačen iz "${artikal.staraPodkategorija}" u "Nepoznato"`); }
    debug.log('Brišem podkategoriju...'); await services.podkategorije.delete(podkategorijaId);
    debug.log(`Kaskadno brisanje podkategorije završeno uspješno!`);
    return { success: true, message: `Podkategorija "${nazivPodkategorije}" je obrisana. ${artikliZaPrebacivanje.length} artikala je prebačeno u "Nepoznato".`, statistike: { podkategorija: 1, artiklPrebaceno: artikliZaPrebacivanje.length } };
  } catch (error) { debug.error('Greška u kaskadnom brisanju podkategorije:', error); throw new Error(`Greška kaskadnog brisanja: ${error.message}`); }
}

async function kreirajNepoznatuKategoriju() {
  try {
    debug.log('Provjeravam da li postoji nepoznata kategorija...');
    const q1 = query(services.kategorije.collection, where("naziv", "==", NEPOZNATA_KATEGORIJA.naziv)); const kategorijaSnapshot = await getDocs(q1);
    let nepoznataKategorijaId;
    if (kategorijaSnapshot.empty) { debug.log('Kreiram nepoznatu kategoriju...'); nepoznataKategorijaId = await services.kategorije.add({ naziv: NEPOZNATA_KATEGORIJA.naziv, ikonaKategorije: NEPOZNATA_KATEGORIJA.ikona, glavnaKategorijaId: null, sortOrder: 9999, sistemska: true }); debug.log(`Nepoznata kategorija kreirana sa ID: ${nepoznataKategorijaId}`); } else { nepoznataKategorijaId = kategorijaSnapshot.docs[0].id; debug.log(`Nepoznata kategorija već postoji sa ID: ${nepoznataKategorijaId}`); }
    const q2 = query(services.podkategorije.collection, where("naziv", "==", NEPOZNATA_KATEGORIJA.naziv), where("kategorijaId", "==", nepoznataKategorijaId)); const podkategorijaSnapshot = await getDocs(q2);
    if (podkategorijaSnapshot.empty) { debug.log('Kreiram nepoznatu podkategoriju...'); const nepoznataPodkategorijaId = await services.podkategorije.add({ naziv: NEPOZNATA_KATEGORIJA.naziv, kategorijaId: nepoznataKategorijaId, ikona: NEPOZNATA_KATEGORIJA.ikona, sortOrder: 9999, sistemska: true }); NEPOZNATA_KATEGORIJA.id = nepoznataPodkategorijaId; debug.log(`Nepoznata podkategorija kreirana sa ID: ${nepoznataPodkategorijaId}`); } else { NEPOZNATA_KATEGORIJA.id = podkategorijaSnapshot.docs[0].id; debug.log(`Nepoznata podkategorija već postoji sa ID: ${NEPOZNATA_KATEGORIJA.id}`); }
    return true;
  } catch (error) { debug.error('Greška kreiranja nepoznate kategorije:', error); throw error; }
}

export async function vratiArtikleIzNepoznate(ciljanaPodkategorija) {
  try {
    debug.log(`Vraćam artikle u podkategoriju: ${ciljanaPodkategorija}`); const q = query(services.artikli.collection, where("podkategorija", "==", NEPOZNATA_KATEGORIJA.naziv)); const snapshot = await getDocs(q); const artikliPrebaceni = [];
    const promises = []; snapshot.forEach((doc) => { const artikalData = doc.data(); const updatePromise = services.artikli.update(doc.id, { podkategorija: ciljanaPodkategorija, podkategorijaId: null, staraPodkategorija: null, vracanoDatum: new Date() }); promises.push(updatePromise); artikliPrebaceni.push(artikalData.naziv); });
    await Promise.all(promises); debug.log(`Vraćeno ${artikliPrebaceni.length} artikala u podkategoriju "${ciljanaPodkategorija}"`);
    return { success: true, prebacenoArtikala: artikliPrebaceni.length, artikli: artikliPrebaceni };
  } catch (error) { debug.error('Greška vraćanja artikala:', error); throw error; }
}

/* GLAVNE KATEGORIJE API */
export const ucitajGlavneKategorije = () => services.glavneKategorije.load();
export const dodajGlavnuKategoriju = (naziv, sortOrder = null, ikona = "") => { debug.log('dodajGlavnuKategoriju:', { naziv, sortOrder, ikona }); const defaultIkona = ikona || getDefaultGlavnaKategorijaIcon(naziv); return services.glavneKategorije.add({ naziv, ikona: defaultIkona, sortOrder }); };
export const azurirajGlavnuKategoriju = (id, podaci) => services.glavneKategorije.update(id, podaci);
export const obrisiGlavnuKategoriju = (id) => services.glavneKategorije.delete(id);
export const azurirajRedoslijedGlavnihKategorija = (glavneKategorije) => services.glavneKategorije.updateSortOrder(glavneKategorije);

/* KATEGORIJE API */
export const ucitajKategorije = () => services.kategorije.load();
export const dodajKategoriju = (naziv, ikonaKategorije, glavnaKategorijaId = null) => { debug.log('dodajKategoriju:', { naziv, ikonaKategorije, glavnaKategorijaId }); const defaultIkona = ikonaKategorije || getDefaultKategorijaIcon(naziv); return services.kategorije.add({ naziv, ikonaKategorije: defaultIkona, glavnaKategorijaId: glavnaKategorijaId || null }); };
export const azurirajKategoriju = (id, kategorija) => services.kategorije.update(id, kategorija);
export const obrisiKategoriju = (id) => services.kategorije.delete(id);
export const azurirajRedoslijedKategorija = (kategorije) => services.kategorije.updateSortOrder(kategorije);

/* PODKATEGORIJE API */
export const ucitajPodkategorije = () => services.podkategorije.load();
export const dodajPodkategoriju = async (naziv, ikona = "", kategorijaId) => { debug.log('dodajPodkategoriju poziv:', { naziv, ikona, kategorijaId }); let validnaIkona = ""; if (ikona) { if (ikona.startsWith('fa-')) { validnaIkona = ikona; debug.log('FontAwesome ikona prepoznata:', validnaIkona); } else if (ikona.startsWith('https://') && ikona.includes('.')) { try { new URL(ikona); validnaIkona = ikona; debug.log('Valjan URL ikona prepoznata:', validnaIkona); } catch (e) { debug.warn('Nevaljan URL za ikonu, koristim fallback:', ikona); validnaIkona = getDefaultPodkategorijaIcon(naziv); } } else { debug.warn('Neprepoznata ikona, koristim fallback:', ikona); validnaIkona = getDefaultPodkategorijaIcon(naziv); } } else { validnaIkona = getDefaultPodkategorijaIcon(naziv); } const podkategorija = { naziv, kategorijaId, ikona: validnaIkona }; debug.log('Finalni objekat za dodavanje podkategorije:', podkategorija); const result = await services.podkategorije.add(podkategorija); debug.log('Podkategorija dodana sa ID:', result); return result; };
export const azurirajPodkategoriju = (id, podkategorija) => { debug.log('azurirajPodkategoriju:', { id, podkategorija }); return services.podkategorije.update(id, podkategorija); };
export const obrisiPodkategoriju = (id) => services.podkategorije.delete(id);
export const azurirajRedoslijedPodkategorija = (podkategorije) => services.podkategorije.updateSortOrder(podkategorije);

/* ARTIKLI API */
export const ucitajArtikle = () => services.artikli.loadFallback();

export async function ucitajArtikleSortirane() {
  try {
    debug.log("Učitavam artikle sa sortOrder..."); const q = query(services.artikli.collection, orderBy("podkategorija", "asc"), orderBy("sortOrder", "asc")); const snapshot = await getDocs(q); const artikli = []; snapshot.forEach((doc) => { const data = doc.data(); artikli.push({ id: doc.id, ...data, sortOrder: data.sortOrder || CONFIG.fallbackSortOrder }); }); debug.log("Učitano artikala sa sortOrder:", artikli.length, artikli); return artikli;
  } catch (error) { debug.error("Greška učitavanja artikala sa sortOrder:", error); const artikli = await ucitajArtikle(); return await initializeSortOrderArtikli(artikli); }
}

async function initializeSortOrderArtikli(artikli) {
  debug.log("Inicijalizujem sortOrder za", artikli.length, "artikala..."); const artiklPoPodkategorijama = artikli.reduce((groups, artikal) => { const podkategorija = artikal.podkategorija || artikal.kategorija || 'Other'; if (!groups[podkategorija]) groups[podkategorija] = []; groups[podkategorija].push(artikal); return groups; }, {}); const promises = []; Object.entries(artiklPoPodkategorijama).forEach(([podkategorija, podkategorijaArtikli]) => { podkategorijaArtikli.forEach((artikal, index) => { if (typeof artikal.sortOrder === 'undefined') { const newSortOrder = index + 1; artikal.sortOrder = newSortOrder; promises.push(updateDoc(doc(db, CONFIG.collections.artikli, artikal.id), { sortOrder: newSortOrder })); } }); }); if (promises.length > 0) { await Promise.all(promises); debug.log("SortOrder inicijalizacija za artikle završena uspješno"); } return artikli.sort((a, b) => { const aPodkat = a.podkategorija || a.kategorija || ''; const bPodkat = b.podkategorija || b.kategorija || ''; if (aPodkat !== bPodkat) return aPodkat.localeCompare(bPodkat); return (a.sortOrder || CONFIG.fallbackSortOrder) - (b.sortOrder || CONFIG.fallbackSortOrder); });
}

export const dodajArtikal = (artikal) => { debug.log('dodajArtikal:', artikal); return services.artikli.add(artikal, false); };
export const dodajArtikalSaSortOrder = (artikal) => { debug.log('dodajArtikalSaSortOrder:', artikal); return services.artikli.add(artikal, true); };
export const azurirajArtikal = (id, artikal) => { debug.log('azurirajArtikal:', { id, artikal }); return services.artikli.update(id, artikal); };
export const obrisiArtikal = (id) => services.artikli.delete(id);

export async function azurirajRedoslijedArtikala(podkategorijaNaziv, newOrder) {
  try {
    debug.log(`Ažuriram redosled artikala u podkategoriji "${podkategorijaNaziv}"`); if (!podkategorijaNaziv || !Array.isArray(newOrder) || newOrder.length === 0) { throw new Error("Nevalidni podaci za ažuriranje redosleda artikala"); } const promises = newOrder.map((artikalId, index) => { if (!artikalId) return null; return updateDoc(doc(db, CONFIG.collections.artikli, artikalId), { sortOrder: index + 1 }); }).filter(Boolean); await Promise.all(promises); debug.log(`Redosled artikala u podkategoriji "${podkategorijaNaziv}" uspješno ažuriran`); return true;
  } catch (error) { debug.error("Greška ažuriranja redosleda artikala:", error); throw new Error("Nije moguće ažurirati redosled artikala: " + error.message); }
}

/* IMAGE UPLOAD SERVICE */
export async function uploadSlika(file) {
  try {
    debug.log('Početak upload-a slike:', file.name, file.size, file.type); if (!file || file.size === 0) { throw new Error('Fajl nije valjan'); } if (file.size > 5 * 1024 * 1024) { throw new Error('Fajl je prevelik (max 5MB)'); }
    
    const formData = new FormData(); formData.append("image", file); debug.log('Šaljem na ImgBB:', CONFIG.imgbb.uploadUrl);
    
    const response = await fetch(`${CONFIG.imgbb.uploadUrl}?key=${CONFIG.imgbb.apiKey}`, { method: "POST", body: formData }); if (!response.ok) { debug.error('HTTP greška:', response.status, response.statusText); throw new Error(`HTTP Error: ${response.status}`); }
    
    const data = await response.json(); debug.log('ImgBB odgovor:', data);
    
    if (data.success && data.data && data.data.url) {
      const imageUrl = data.data.url; debug.log('Uspješan upload, URL:', imageUrl); if (!imageUrl.startsWith('https://i.ibb.co/') && !imageUrl.startsWith('https://ibb.co/')) { debug.warn('Neočekivan format URL-a od ImgBB:', imageUrl); } return imageUrl;
    } else { debug.error('ImgBB upload neuspješan:', data); throw new Error("ImgBB upload failed: " + (data.error?.message || JSON.stringify(data))); }
  } catch (error) { debug.error("Greška uploading image:", error); throw new Error("Cannot upload image: " + error.message); }
}

/* SETTINGS SERVICE */
class SettingsService {
  constructor(collectionName) { this.collectionName = collectionName; this.collection = collection(db, collectionName); }
  async load() { try { debug.log(`Učitavam ${this.collectionName}...`); const snapshot = await getDocs(this.collection); if (!snapshot.empty) { const doc = snapshot.docs[0]; const data = { id: doc.id, ...doc.data() }; debug.log(`Učitano ${this.collectionName}:`, data); return data; } debug.log(`${this.collectionName} ne postoji`); return null; } catch (error) { debug.error(`Error loading ${this.collectionName}:`, error); throw new Error(`Cannot load ${this.collectionName}: ${error.message}`); } }
  async save(postavke) { try { debug.log(`Čuvam ${this.collectionName}:`, postavke); const snapshot = await getDocs(this.collection); const timestamp = new Date(); if (!snapshot.empty) { const doc = snapshot.docs[0]; await updateDoc(doc.ref, { ...postavke, azurirano: timestamp }); debug.log(`${this.collectionName} updated`); } else { await addDoc(this.collection, { ...postavke, kreirano: timestamp, azurirano: timestamp }); debug.log(`${this.collectionName} created`); } return true; } catch (error) { debug.error(`Error saving ${this.collectionName}:`, error); throw new Error(`Cannot save ${this.collectionName}: ${error.message}`); } }
}

/* SETTINGS API */
const settingsServices = { postavke: new SettingsService(CONFIG.collections.postavke), webPostavke: new SettingsService(CONFIG.collections.webPostavke) };
export const ucitajPostavke = () => settingsServices.postavke.load();
export const azurirajPostavke = (postavke) => settingsServices.postavke.save(postavke);
export const ucitajWebPostavke = () => settingsServices.webPostavke.load();
export const sacuvajWebPostavke = (postavke) => { debug.log('sacuvajWebPostavke:', postavke); return settingsServices.webPostavke.save(postavke); };
/* TOGGLE ARTIKAL AKTIVNOST */
export async function toggleArtikalAktivnost(id, trenutnoAktivna) {
  try {
    const noviStatus = !trenutnoAktivna;
    debug.log(`Mijenjam status artikla ${id}: ${trenutnoAktivna} → ${noviStatus}`);
    await updateDoc(doc(db, CONFIG.collections.artikli, id), {
      aktivna: noviStatus,
      azurirano: new Date()
    });
    debug.log(`Status artikla ${id} uspješno promijenjen na: ${noviStatus}`);
    return noviStatus;
  } catch (error) {
    debug.error('Greška promjene statusa artikla:', error);
    throw new Error('Nije moguće promijeniti status artikla: ' + error.message);
  }
}
