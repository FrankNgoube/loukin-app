import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "loukin-lang";
const DEFAULT_LANG = "fr";

const dictionaries = {
  fr: {
    appName: "LouKin Restaurant",
    tagline: "Saveurs du Cameroun",
    language: "Langue",
    french: "Français",
    english: "English",

    // Navigation
    home: "Accueil",
    kitchen: "Cuisine",
    admin: "Gérant",
    backToMenu: "Retour au menu",

    // Home landing
    welcome: "Bienvenue chez LouKin",
    homeHint: "Scannez le QR code de votre table pour commander.",
    openKitchen: "Ouvrir la cuisine",
    openAdmin: "Espace gérant",
    demoMenu: "Voir le menu (démo)",

    // Categories
    allCategories: "Tout",
    entrees: "Entrées",
    plats: "Plats",
    accompagnements: "Accompagnements",
    desserts: "Desserts",
    boissons: "Boissons",

    // Menu / Cart
    menuTitle: "Notre menu",
    table: "Table",
    addToCart: "Ajouter",
    soldOut: "Épuisé",
    lowStock: "Stock faible",
    only: "Plus que",
    left: "restant",
    cart: "Panier",
    emptyCart: "Votre panier est vide",
    yourOrder: "Votre commande",
    noteForChef: "Note pour le chef (optionnel)",
    notePlaceholder: "Pas de piment, allergie, cuisson...",
    total: "Total",
    sendOrder: "Envoyer la commande",
    sending: "Envoi...",
    paymentCash: "Paiement en espèces uniquement",
    orderError: "Impossible d'envoyer la commande. Réessayez.",
    confirmationTitle: "Commande envoyée !",
    confirmationText: "Votre commande est en cuisine. Vous serez servi à votre table.",
    backToMenuBtn: "Retour au menu",
    orderNumber: "N° de commande",

    // Kitchen
    kitchenTitle: "Tableau de bord — Cuisine",
    autoRefresh: "Mise à jour auto toutes les 5s",
    filterAll: "Toutes",
    waiting: "En attente",
    preparing: "En préparation",
    ready: "Prête",
    served: "Servie",
    noOrders: "Aucune commande pour le moment",
    customerNote: "Note client",
    advanceTo: "Passer à",
    receivedAt: "Reçue à",

    // Admin
    adminTitle: "Espace gérant",
    today: "Aujourd'hui",
    todayOrders: "Commandes du jour",
    todayRevenue: "Recettes du jour",
    pendingReservations: "Réservations en attente",
    activeMenuItems: "Plats disponibles",

    tabMenu: "Menu",
    tabTables: "Tables",
    tabOrders: "Commandes",
    tabReservations: "Réservations",
    tabStock: "Stock",

    // Menu admin
    addItem: "Ajouter un plat",
    editItem: "Modifier",
    deleteItem: "Supprimer",
    confirmDelete: "Supprimer ce plat ?",
    name: "Nom",
    description: "Description",
    price: "Prix (FCFA)",
    category: "Catégorie",
    imageUrl: "URL de l'image",
    stock: "Stock",
    stockUnlimited: "Stock illimité",
    available: "Disponible",
    save: "Enregistrer",
    cancel: "Annuler",

    // Tables admin
    addTable: "Ajouter une table",
    tableNumber: "Numéro de table",
    qrCode: "QR code",
    showQr: "Voir le QR",
    qrHint: "Imprimez ce QR et collez-le sur la table",
    open: "Ouvrir",

    // Orders admin
    history: "Historique",
    searchOrders: "Rechercher...",
    noResults: "Aucun résultat",

    // Reservations admin
    addReservation: "Nouvelle réservation",
    clientName: "Nom du client",
    whatsappNumber: "Numéro WhatsApp",
    date: "Date",
    time: "Heure",
    numberOfPeople: "Nombre de personnes",
    preferences: "Préférences",
    occasion: "Occasion",
    confirm: "Confirmer",
    annul: "Annuler",
    pending: "En attente",
    confirmed: "Confirmée",
    cancelled: "Annulée",

    // Stock
    increment: "+1",
    decrement: "-1",
    markAvailable: "Marquer disponible",
    markUnavailable: "Marquer épuisé",
    toggleUnlimited: "Stock illimité",

    fcfa: "FCFA",
  },
  en: {
    appName: "LouKin Restaurant",
    tagline: "Flavors of Cameroon",
    language: "Language",
    french: "Français",
    english: "English",

    home: "Home",
    kitchen: "Kitchen",
    admin: "Manager",
    backToMenu: "Back to menu",

    welcome: "Welcome to LouKin",
    homeHint: "Scan the QR code on your table to order.",
    openKitchen: "Open kitchen",
    openAdmin: "Manager area",
    demoMenu: "See menu (demo)",

    allCategories: "All",
    entrees: "Starters",
    plats: "Mains",
    accompagnements: "Sides",
    desserts: "Desserts",
    boissons: "Drinks",

    menuTitle: "Our menu",
    table: "Table",
    addToCart: "Add",
    soldOut: "Sold out",
    lowStock: "Low stock",
    only: "Only",
    left: "left",
    cart: "Cart",
    emptyCart: "Your cart is empty",
    yourOrder: "Your order",
    noteForChef: "Note for the chef (optional)",
    notePlaceholder: "No chili, allergy, cooking...",
    total: "Total",
    sendOrder: "Send order",
    sending: "Sending...",
    paymentCash: "Cash payment only",
    orderError: "Could not send order. Try again.",
    confirmationTitle: "Order sent!",
    confirmationText: "Your order is in the kitchen. You will be served at your table.",
    backToMenuBtn: "Back to menu",
    orderNumber: "Order #",

    kitchenTitle: "Kitchen — Dashboard",
    autoRefresh: "Auto-refresh every 5s",
    filterAll: "All",
    waiting: "Waiting",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    noOrders: "No orders yet",
    customerNote: "Customer note",
    advanceTo: "Move to",
    receivedAt: "Received at",

    adminTitle: "Manager area",
    today: "Today",
    todayOrders: "Orders today",
    todayRevenue: "Revenue today",
    pendingReservations: "Pending reservations",
    activeMenuItems: "Active dishes",

    tabMenu: "Menu",
    tabTables: "Tables",
    tabOrders: "Orders",
    tabReservations: "Reservations",
    tabStock: "Stock",

    addItem: "Add dish",
    editItem: "Edit",
    deleteItem: "Delete",
    confirmDelete: "Delete this dish?",
    name: "Name",
    description: "Description",
    price: "Price (FCFA)",
    category: "Category",
    imageUrl: "Image URL",
    stock: "Stock",
    stockUnlimited: "Unlimited stock",
    available: "Available",
    save: "Save",
    cancel: "Cancel",

    addTable: "Add table",
    tableNumber: "Table number",
    qrCode: "QR code",
    showQr: "Show QR",
    qrHint: "Print this QR and stick it on the table",
    open: "Open",

    history: "History",
    searchOrders: "Search...",
    noResults: "No results",

    addReservation: "New reservation",
    clientName: "Client name",
    whatsappNumber: "WhatsApp number",
    date: "Date",
    time: "Time",
    numberOfPeople: "Number of people",
    preferences: "Preferences",
    occasion: "Occasion",
    confirm: "Confirm",
    annul: "Cancel",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",

    increment: "+1",
    decrement: "-1",
    markAvailable: "Mark available",
    markUnavailable: "Mark sold out",
    toggleUnlimited: "Unlimited stock",

    fcfa: "FCFA",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const setLang = (l) => {
    if (dictionaries[l]) setLangState(l);
  };

  const t = (key) => dictionaries[lang]?.[key] ?? dictionaries[DEFAULT_LANG][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { lang: DEFAULT_LANG, setLang: () => {}, t: (k) => dictionaries[DEFAULT_LANG][k] ?? k };
  }
  return ctx;
}
