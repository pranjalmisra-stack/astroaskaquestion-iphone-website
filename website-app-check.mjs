import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";

const recaptchaSiteKey = "6LejyNktAAAAAKvLRJ9LCbJ_IfBc1Mis9PIUVkTB";
let appCheckInstance;

export function initializeWebsiteAppCheck(firebaseApp) {
  if (!appCheckInstance) {
    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
  return appCheckInstance;
}

export async function websiteAppCheckHeaders() {
  if (!appCheckInstance) throw new Error("Firebase App Check has not been initialized.");
  const result = await getToken(appCheckInstance);
  return { "X-Firebase-AppCheck": result.token };
}