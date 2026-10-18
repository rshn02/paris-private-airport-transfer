// Consent controls; Google transport is gated separately in marketing-attribution.js.
(function (window, document) {
  'use strict';
  const KEY = 'ppat_consent_v1';
  const LEGACY = 'ppat_marketing_attribution_v1';
  const TTL = 180 * 24 * 60 * 60 * 1000;
  const sensitive = /^\/(confirm|manage-booking|admin)(?:\.html)?\/?$/.test(window.location.pathname);
  const futureAnalytics = Object.freeze({ measurementId: 'G-83LVJPDG1N', enabled: true });
  let choice = null;
  function valid(value) {
    return value && value.version === 2 && typeof value.audience === 'boolean' &&
      typeof value.advertising === 'boolean' && Number.isFinite(value.savedAt) &&
      value.savedAt <= Date.now() && value.expiresAt === value.savedAt + TTL && value.expiresAt > Date.now();
  }
  function purge() { try { window.localStorage.removeItem(LEGACY); } catch {} }
  function clearGoogleCookies() {
    // Remove only known Google measurement cookies, never booking/auth storage.
    const names = (document.cookie || '').split(';').map(part => part.trim().split('=')[0]);
    const host = window.location.hostname;
    const domains = ['', host, host.replace(/^www\./, '')];
    for (const name of names) {
      if ((!choice?.audience && /^(_ga(?:_|$)|_gid$|_gat)/.test(name)) ||
          (!choice?.advertising && /^(_gcl_|_gac_)/.test(name))) {
        for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
      }
    }
  }
  function read() {
    try { const value = JSON.parse(window.localStorage.getItem(KEY)); return valid(value) ? value : null; }
    catch { return null; }
  }
  choice = read();
  if (!choice?.advertising) purge();
  clearGoogleCookies();
  function allows(purpose) {
    if (!valid(choice)) { choice = null; purge(); clearGoogleCookies(); return false; }
    return !sensitive && (purpose === 'audience' || purpose === 'advertising') && choice[purpose];
  }
  function save(audience, advertising) {
    const savedAt = Date.now();
    choice = { version: 2, audience: audience === true, advertising: advertising === true, savedAt, expiresAt: savedAt + TTL };
    if (!choice.advertising) purge();
    clearGoogleCookies();
    try { window.localStorage.setItem(KEY, JSON.stringify(choice)); } catch {}
    window.dispatchEvent(new Event('ppat:consentchange'));
  }
  window.PPATConsent = Object.freeze({ allows, sensitive, futureAnalytics, getChoice: () => valid(choice) ? { ...choice } : null });
  let dialog, manage, previousFocus;
  function sync() {
    if (!dialog) return;
    dialog.querySelector('#consent-audience').checked = !!choice?.audience;
    dialog.querySelector('#consent-advertising').checked = !!choice?.advertising;
  }
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    choice = read();
    if (!choice?.advertising) purge();
    clearGoogleCookies();
    sync();
    window.dispatchEvent(new Event('ppat:consentchange'));
  });
  function open() {
    previousFocus = document.activeElement;
    sync();
    dialog.querySelector('#consent-options').hidden = true;
    dialog.querySelector('[data-action="customize"]').setAttribute('aria-expanded', 'false');
    dialog.showModal();
    dialog.querySelector('[data-action="reject"]').focus();
  }
  function close() { dialog.close(); (previousFocus?.isConnected ? previousFocus : manage)?.focus(); }
  function init() {
    manage = document.createElement('button');
    manage.type = 'button'; manage.className = 'ppat-consent-manage'; manage.textContent = 'Cookie settings';
    manage.setAttribute('aria-haspopup', 'dialog'); manage.addEventListener('click', open);
    document.body.append(manage);
    dialog = document.createElement('dialog'); dialog.className = 'ppat-consent';
    dialog.setAttribute('aria-labelledby', 'consent-title'); dialog.setAttribute('aria-describedby', 'consent-description');
    dialog.innerHTML = `<h2 id="consent-title">Your privacy choices</h2>
      <p id="consent-description">You can book without optional tracking. Accept or refuse with the same ease, and change your choice anytime using Cookie settings.</p>
      <p>Audience consent enables Google Analytics to measure public page visits and booking form interactions. Google Ads tracking remains disabled. Advertising consent permits storing campaign information locally and attaching it to your booking or contact request.</p>
      <p>Your choice is remembered for up to 180 days. <a href="/pages/confidentialite">Privacy policy</a></p>
      <div class="ppat-consent-actions"><button type="button" data-action="reject">Reject all</button><button type="button" data-action="accept">Accept all</button><button type="button" data-action="customize" aria-expanded="false" aria-controls="consent-options">Customize</button></div>
      <div id="consent-options" hidden><label><input id="consent-audience" type="checkbox"> Audience measurement (Google Analytics)</label><label><input id="consent-advertising" type="checkbox"> Advertising measurement and campaign attribution</label><p>Essential storage supports your privacy choices and the booking process. It cannot be disabled here.</p><button type="button" data-action="save">Save my choices</button></div>
      <button type="button" data-action="close" class="ppat-consent-close">Close without changing my choice</button>`;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'customize') {
        dialog.querySelector('#consent-options').hidden = false;
        event.target.setAttribute('aria-expanded', 'true'); dialog.querySelector('#consent-audience').focus(); return;
      }
      if (action === 'close') return close();
      if (!['accept', 'reject', 'save'].includes(action)) return;
      save(action === 'save' ? dialog.querySelector('#consent-audience').checked : action === 'accept', action === 'save' ? dialog.querySelector('#consent-advertising').checked : action === 'accept');
      close();
    });
    document.body.append(dialog);
    if (!valid(choice)) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
