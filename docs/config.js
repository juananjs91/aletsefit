// ===== CONFIGURACIÓN DE ALETSE FIT =====
// Rellena estos datos cuando crees tus cuentas (la guía explica dónde encontrarlos).
// Mientras firebase.apiKey esté vacío, la app funciona en "modo prueba" (todo se guarda en el móvil).
window.ALETSE_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  // Claves públicas de RevenueCat (cobro de la suscripción VIP)
  revenuecat: { android: "", ios: "" },
  vipEntitlement: "vip",           // nombre del "entitlement" en RevenueCat
  vipPrice: "9,99 €/mes",          // precio que se muestra si la tienda aún no responde
  supportEmail: "aletsefitoficial@gmail.com",
  adminEmail: "aletsefitoficial@gmail.com",   // el mismo correo que en firestore.rules
  privacyUrl: "https://TU-USUARIO.github.io/aletsefit/privacidad.html",
  deleteUrl: "https://TU-USUARIO.github.io/aletsefit/borrar-cuenta.html"
};
