// ===== CONFIGURACIÓN DE ALETSE FIT =====
// Rellena estos datos cuando crees tus cuentas (la guía explica dónde encontrarlos).
// Mientras firebase.apiKey esté vacío, la app funciona en "modo prueba" (todo se guarda en el móvil).
window.ALETSE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBe6Sswysg0OiRSCR8NETvRWsnuXA-NKTE",
    authDomain: "aletse-fit.firebaseapp.com",
    projectId: "aletse-fit",
    storageBucket: "aletse-fit.firebasestorage.app",
    messagingSenderId: "507205466468",
    appId: "1:507205466468:web:1de022237b28005e28a271"
  },
  // Claves públicas de RevenueCat (cobro de la suscripción VIP)
  revenuecat: { android: "", ios: "" },
  vipEntitlement: "vip",           // nombre del "entitlement" en RevenueCat
  vipPrice: "9,99 €/mes",          // precio que se muestra si la tienda aún no responde
  supportEmail: "aletsefitoficial@gmail.com",
  adminEmail: "aletsefitoficial@gmail.com",   // el mismo correo que en firestore.rules
  adminUrl: "https://juananjs91.github.io/aletsefit/admin.html",
  privacyUrl: "https://juananjs91.github.io/aletsefit/privacidad.html",
  deleteUrl: "https://juananjs91.github.io/aletsefit/borrar-cuenta.html"
};
