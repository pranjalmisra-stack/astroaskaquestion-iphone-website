import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";

// Replace this with the public site key from your score-based reCAPTCHA Enterprise key.
const recaptchaEnterpriseSiteKey = "6LdZwdktAAAAAM3xlmW2UKm4suTf-Qds4g_od5Hf";
let appCheckInstance;

export function initializeWebsiteAppCheck(firebaseApp) {
  if (recaptchaEnterpriseSiteKey === "PASTE_RECAPTCHA_ENTERPRISE_SITE_KEY_HERE") {
    throw new Error("Add the reCAPTCHA Enterprise site key to website-app-check.mjs before using App Check.");
  }
  if (!appCheckInstance) {
    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
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