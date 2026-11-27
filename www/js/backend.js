// ALETSE FIT · capa de datos
// Modo "cloud": Firebase (cuentas reales y datos en la nube) + RevenueCat (cobro VIP).
// Modo "local": todo en el móvil, para probar sin cuentas (se usa si no hay configuración de Firebase).
(function () {
  const C = window.ALETSE_CONFIG || {};
  const hasFirebase = !!(C.firebase && C.firebase.apiKey && window.FB);
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const platform = Cap && Cap.getPlatform ? Cap.getPlatform() : 'web';
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const err = (m) => { const e = new Error(m); e.userMessage = m; return e; };

  // ---------- Cobro (RevenueCat) ----------
  const rcKey = platform === 'ios' ? (C.revenuecat || {}).ios : (C.revenuecat || {}).android;
  const RC = isNative && rcKey && Cap.Plugins ? Cap.Plugins.Purchases : null;
  const ENT = C.vipEntitlement || 'vip';
  let rcReady = false, rcPackage = null;
  const pay = {
    native: !!RC,
    async init(userId) {
      if (!RC) return;
      try {
        if (!rcReady) { await RC.configure({ apiKey: rcKey, appUserID: userId }); rcReady = true; }
        else { await RC.logIn({ appUserID: userId }); }
        const o = await RC.getOfferings();
        const cur = o && (o.current || (o.all && Object.values(o.all)[0]));
        rcPackage = cur && cur.availablePackages && cur.availablePackages[0] || null;
      } catch (e) { console.warn('RevenueCat', e); }
    },
    price() { return rcPackage && rcPackage.product && rcPackage.product.priceString ? rcPackage.product.priceString + '/mes' : (C.vipPrice || '9,99 €/mes'); },
    activeFrom(info) { const ci = info && (info.customerInfo || info); return !!(ci && ci.entitlements && ci.entitlements.active && ci.entitlements.active[ENT]); },
    async isActive() { if (!RC || !rcReady) return null; try { return pay.activeFrom(await RC.getCustomerInfo()); } catch (e) { return null; } },
    async buy() {
      if (!RC) throw err('El pago solo está disponible en la app de Google Play o App Store.');
      if (!rcPackage) throw err('La suscripción aún no está disponible. Inténtalo más tarde.');
      try { return pay.activeFrom(await RC.purchasePackage({ aPackage: rcPackage })); }
      catch (e) { if (e && (e.userCancelled || e.code === '1' || /cancel/i.test(e.message || ''))) return false; throw err('No se pudo completar el pago.'); }
    },
    async restore() { if (!RC) return false; try { return pay.activeFrom(await RC.restorePurchases()); } catch (e) { return false; } },
    manageUrl() { return platform === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions'; },
    async logout() { if (RC && rcReady) { try { await RC.logOut(); } catch (e) {} } }
  };

  // ---------- Modo nube (Firebase) ----------
  function cloud() {
    FB.init(C.firebase);
    let uid = null, saveT = null;
    const fbErr = (e) => {
      const c = (e && e.code) || '';
      const map = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/invalid-email': 'Escribe un correo válido.',
        'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/wrong-password': 'Correo o contraseña incorrectos.',
        'auth/user-not-found': 'Correo o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
        'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
        'auth/requires-recent-login': 'Vuelve a escribir tu contraseña.'
      };
      return err(map[c] || 'Algo ha fallado. Inténtalo de nuevo.');
    };
    return {
      mode: 'cloud',
      start(onUser) {
        FB.onAuthStateChanged(async (u) => {
          if (!u) { uid = null; onUser(null, null); return; }
          uid = u.uid;
          let snap = null;
          try { snap = await FB.getDoc(FB.doc('users', uid)); } catch (e) {}
          const d = snap && snap.exists() ? snap.data() : {};
          try {
            const created = Date.parse(u.metadata && u.metadata.creationTime) || Date.now();
            await FB.setDoc(FB.doc('stats', uid), { createdAt: created, lastSeen: Date.now(), platform }, { merge: true });
          } catch (e) { console.warn('stats', e); }
          await pay.init(uid);
          onUser({ id: uid, name: d.name || u.displayName || '', email: u.email, photo: d.photo || null }, d.data || null);
        });
      },
      async signUp(name, email, pass) {
        try {
          const cr = await FB.createUserWithEmailAndPassword(email, pass);
          await FB.updateProfile(cr.user, { displayName: name });
          await FB.setDoc(FB.doc('users', cr.user.uid), { name, email, photo: null, data: null, createdAt: FB.serverTimestamp() });
        } catch (e) { throw fbErr(e); }
      },
      async signIn(email, pass) { try { await FB.signInWithEmailAndPassword(email, pass); } catch (e) { throw fbErr(e); } },
      async signOut() { await pay.logout(); await FB.signOut(); },
      async resetPassword(email) { try { await FB.sendPasswordResetEmail(email); } catch (e) { throw fbErr(e); } },
      saveData(S) {
        if (!uid) return; clearTimeout(saveT);
        const data = Object.assign({}, S); delete data.premium;
        saveT = setTimeout(() => FB.setDoc(FB.doc('users', uid), { data, updatedAt: FB.serverTimestamp() }, { merge: true }).catch(console.warn), 800);
      },
      async saveProfile(p) { if (uid) await FB.setDoc(FB.doc('users', uid), p, { merge: true }); },
      async deleteAccount(pass) {
        const u = FB.auth.currentUser; if (!u) return;
        try { await FB.reauthenticateWithCredential(u, FB.EmailAuthProvider.credential(u.email, pass)); }
        catch (e) { throw err('La contraseña no es correcta.'); }
        try {
          const ms = await FB.getDocs(FB.collection('chats', u.uid, 'msgs'));
          const b = FB.batch(); ms.forEach(m => b.delete(m.ref));
          b.delete(FB.doc('vip', u.uid)); b.delete(FB.doc('stats', u.uid)); b.delete(FB.doc('users', u.uid)); await b.commit();
        } catch (e) { console.warn(e); }
        await pay.logout();
        try { await FB.deleteUser(u); } catch (e) { throw fbErr(e); }
      },
      vip: {
        watch(cb) {
          if (!uid) return () => {};
          let v = null, msgs = [];
          const emit = () => cb(v && v.active ? Object.assign({}, v, { msgs }) : null);
          const a = FB.onSnapshot(FB.doc('vip', uid), s => { v = s.exists() ? s.data() : null; emit(); }, () => {});
          const b = FB.onSnapshot(FB.query(FB.collection('chats', uid, 'msgs'), FB.orderBy('at')), s => {
            msgs = s.docs.map(d => { const m = d.data(); return { me: m.from === 'client', t: m.t, at: m.at }; }); emit();
          }, () => {});
          return () => { a(); b(); };
        },
        async activate(user) {
          const ref = FB.doc('vip', uid); const s = await FB.getDoc(ref);
          if (s.exists() && s.data().active) return;
          await FB.setDoc(ref, { active: true, since: (s.exists() && s.data().since) || Date.now(), name: user.name, email: user.email, updatedAt: Date.now() }, { merge: true });
        },
        async deactivate() { const ref = FB.doc('vip', uid); const s = await FB.getDoc(ref); if (s.exists() && s.data().active) await FB.updateDoc(ref, { active: false, updatedAt: Date.now() }); },
        async saveForm(f) { await FB.updateDoc(FB.doc('vip', uid), { form: f, updatedAt: Date.now(), pending: true }); },
        async send(t) {
          await FB.addDoc(FB.collection('chats', uid, 'msgs'), { from: 'client', t, at: Date.now() });
          await FB.updateDoc(FB.doc('vip', uid), { updatedAt: Date.now(), unread: true, lastMsg: t.slice(0, 80) });
        }
      }
    };
  }

  // ---------- Modo prueba (en el móvil) ----------
  function local() {
    let users = ls.get('af_users', {}); let me = ls.get('af_session', null); let cbVip = null;
    const saveUsers = () => ls.set('af_users', users);
    async function hash(p) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('aletse:' + p)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { let h = 0; for (const c of 'aletse:' + p) h = (h * 31 + c.charCodeAt(0)) | 0; return 'f' + h; } }
    let onUserCb = null;
    const emitUser = () => { const u = me && users[me]; onUserCb(u ? { id: me, name: u.name, email: me, photo: u.photo || null } : null, u ? u.data : null); };
    const vipGet = () => (users[me] && users[me].vip) || null;
    const vipSet = (v) => { users[me].vip = v; saveUsers(); if (cbVip) cbVip(v && v.active ? v : null); };
    return {
      mode: 'local',
      start(onUser) { onUserCb = onUser; emitUser(); },
      async signUp(name, email, pass) { if (users[email]) throw err('Ya existe una cuenta con ese correo.'); users[email] = { name, pass: await hash(pass), data: null }; saveUsers(); me = email; ls.set('af_session', me); emitUser(); },
      async signIn(email, pass) { if (!users[email] || users[email].pass !== await hash(pass)) throw err('Correo o contraseña incorrectos.'); me = email; ls.set('af_session', me); emitUser(); },
      async signOut() { me = null; ls.set('af_session', null); emitUser(); },
      async resetPassword() { throw err('En el modo prueba no se pueden enviar correos.'); },
      saveData(S) { if (!me) return; const d = Object.assign({}, S); delete d.premium; users[me].data = d; saveUsers(); },
      async saveProfile(p) { if (!me) return; Object.assign(users[me], p); saveUsers(); },
      async deleteAccount(pass) { if (users[me].pass !== await hash(pass)) throw err('La contraseña no es correcta.'); delete users[me]; saveUsers(); me = null; ls.set('af_session', null); emitUser(); },
      vip: {
        watch(cb) { cbVip = cb; const v = vipGet(); cb(v && v.active ? v : null); return () => { cbVip = null; }; },
        async activate() { vipSet({ active: true, since: Date.now(), form: null, trainPlan: null, dietPlan: null, msgs: [{ me: false, t: '¡Hola! Bienvenida a ALETSE FIT VIP. Rellena el cuestionario y empezamos con tus planes.', at: Date.now() }] }); },
        async deactivate() { const v = vipGet(); if (v) { v.active = false; vipSet(v); } },
        async saveForm(f) { const v = vipGet(); v.form = f; v.msgs.push({ me: false, t: '¡Gracias! Hemos recibido tus datos. Tus planes privados estarán aquí en 48 h.', at: Date.now() }); vipSet(v); },
        async send(t) { const v = vipGet(); v.msgs.push({ me: true, t, at: Date.now() }); if (v.msgs.filter(m => m.me).length === 1) v.msgs.push({ me: false, t: 'Mensaje recibido. Te responderemos personalmente en menos de 24 h.', at: Date.now() }); vipSet(v); }
      }
    };
  }

  const api = hasFirebase ? cloud() : local();
  api.pay = pay; api.isNative = isNative; api.platform = platform; api.config = C;
  window.AB = api;
})();
