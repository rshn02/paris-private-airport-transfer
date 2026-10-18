// Marketing attribution shared by the public pages.
// Stores first/last campaign touches only with advertising consent; GA4 is independently gated by audience consent.
(function initPPATMarketing(window, document) {
    'use strict';

    if (window.PPATMarketing) return;

    const STORAGE_KEY = 'ppat_marketing_attribution_v1';
    const STORAGE_VERSION = 1;
    const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
    const CAMPAIGN_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'gbraid',
        'wbraid',
        'fbclid',
        'ttclid'
    ];
    const PUBLIC_PATH_ALIASES = {
        '/index': '/',
        '/airport-transfer': '/airport',
        '/disneyland-transfer': '/disneyland',
        '/long-distance-transfer': '/long-distance',
        '/hourly-service': '/hourly'
    };
    const SERVICE_BY_PATH = {
        '/paris-to-normandy': 'normandy',
        '/paris-to-champagne': 'champagne',
        '/paris-to-loire-valley': 'loire-valley'
    };
    const ROUTE_BY_PATH = {
        '/cdg-to-paris': 'cdg-paris',
        '/orly-to-paris': 'orly-paris',
        '/beauvais-to-paris': 'beauvais-paris',
        '/cdg-to-disneyland': 'cdg-disneyland',
        '/orly-to-disneyland': 'orly-disneyland',
        '/beauvais-to-disneyland': 'beauvais-disneyland',
        '/paris-to-disneyland': 'paris-disneyland'
    };

    let memoryAttribution = null;
    const permitted = () => window.PPATConsent?.allows('advertising') === true;
    function clearAttribution() {
        memoryAttribution = null;
        try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    }
    window.addEventListener('ppat:consentchange', () => {
        if (!permitted()) { memoryAttribution = null; if (!window.PPATConsent?.getChoice()?.advertising) clearAttribution(); }
        else captureAttribution();
    });

    function cleanValue(value, maxLength = 200) {
        if (typeof value !== 'string') return '';
        return value.trim().slice(0, maxLength);
    }

    function cleanCampaignValue(value) {
        const cleaned = cleanValue(value, 200);
        if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(cleaned)) return '';
        if (/(?:\+?\d[\s().-]*){8,}/.test(cleaned)) return '';
        return cleaned;
    }

    function cleanContextValue(value) {
        const cleaned = cleanValue(value, 100).toLowerCase();
        return /^[a-z0-9_-]+$/.test(cleaned) ? cleaned : '';
    }

    function publicPath(pathname) {
        let path = cleanValue(pathname || '/', 500).split('?')[0].split('#')[0] || '/';
        path = path.replace(/\.html$/i, '') || '/';
        return PUBLIC_PATH_ALIASES[path] || path;
    }

    function safeReferrer(referrer) {
        const raw = cleanValue(referrer, 1000);
        if (!raw) return '';

        try {
            const url = new URL(raw);
            return `${url.origin}${publicPath(url.pathname)}`.slice(0, 500);
        } catch {
            return '';
        }
    }

    function normalizedHostname(hostname) {
        return cleanValue(hostname, 255).toLowerCase().replace(/^www\./, '');
    }

    function isInternalReferrer(referrer) {
        if (!referrer) return false;

        try {
            const referrerHost = normalizedHostname(new URL(referrer).hostname);
            const currentHost = normalizedHostname(window.location.hostname);
            return Boolean(referrerHost && currentHost && referrerHost === currentHost);
        } catch {
            return false;
        }
    }

    function readCampaignParams(search) {
        const params = new URLSearchParams(search || '');
        return CAMPAIGN_KEYS.reduce((campaign, key) => {
            const value = cleanCampaignValue(params.get(key));
            if (value) campaign[key] = value;
            return campaign;
        }, {});
    }

    function hasCampaignSignal(campaign) {
        return CAMPAIGN_KEYS.some((key) => Boolean(campaign[key]));
    }

    function sourceFromReferrer(referrer) {
        if (!referrer) return 'direct';

        try {
            const host = normalizedHostname(new URL(referrer).hostname);
            if (!host) return 'direct';
            if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google_organic';
            if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
            if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'facebook';
            if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
            if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
            return 'referral';
        } catch {
            return 'direct';
        }
    }

    function classifySource(campaign, referrer) {
        const utmSource = cleanValue(campaign.utm_source).toLowerCase();
        const utmMedium = cleanValue(campaign.utm_medium).toLowerCase();

        if (campaign.gclid || campaign.gbraid || campaign.wbraid) return 'google_ads';
        if (utmSource === 'google' && /^(paid|cpc|ppc|paidsearch|paid_search)$/.test(utmMedium)) {
            return 'google_ads';
        }
        if (utmSource === 'instagram' || utmSource === 'ig') return 'instagram';
        if (campaign.fbclid || utmSource === 'facebook' || utmSource === 'fb') return 'facebook';
        if (campaign.ttclid || utmSource === 'tiktok') return 'tiktok';
        if (utmSource === 'youtube' || utmSource === 'yt') return 'youtube';
        if (utmSource === 'google') return 'google_organic';
        if (utmSource) return utmSource.replace(/[^a-z0-9_-]+/g, '_').slice(0, 100);
        if (hasCampaignSignal(campaign)) return 'campaign';
        return sourceFromReferrer(referrer);
    }

    function buildTouch(campaign, referrer, timestamp) {
        return {
            marketing_source: classifySource(campaign, referrer),
            landing_page: publicPath(window.location.pathname),
            initial_referrer: safeReferrer(referrer),
            captured_at: new Date(timestamp).toISOString(),
            ...campaign
        };
    }

    function readStoredAttribution(now = Date.now()) {
        if (!permitted()) return null;
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return memoryAttribution;

            const parsed = JSON.parse(raw);
            if (
                !parsed ||
                parsed.version !== STORAGE_VERSION ||
                !parsed.first_touch ||
                !parsed.last_touch ||
                Number(parsed.expires_at) <= now
            ) {
                window.localStorage.removeItem(STORAGE_KEY);
                memoryAttribution = null;
                return null;
            }

            memoryAttribution = parsed;
            return parsed;
        } catch {
            return memoryAttribution;
        }
    }

    function writeAttribution(attribution) {
        if (!permitted()) return null;
        memoryAttribution = attribution;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
        } catch {
            // localStorage may be unavailable in private/restricted browser contexts.
        }
        return attribution;
    }

    function captureAttribution(now = Date.now()) {
        if (!permitted()) return null;
        const campaign = readCampaignParams(window.location.search);
        const pageContext = currentContext();
        const externalReferrer = document.referrer && !isInternalReferrer(document.referrer)
            ? document.referrer
            : '';
        const hasNewExternalTouch = hasCampaignSignal(campaign) || Boolean(externalReferrer);
        const stored = readStoredAttribution(now);

        if (!stored) {
            const firstTouch = buildTouch(campaign, externalReferrer, now);
            return writeAttribution({
                version: STORAGE_VERSION,
                first_touch: firstTouch,
                last_touch: firstTouch,
                context: pageContext,
                created_at: now,
                updated_at: now,
                expires_at: now + ATTRIBUTION_TTL_MS
            });
        }

        const context = {
            ...(stored.context || {}),
            ...(pageContext.service ? { service: pageContext.service } : {}),
            ...(pageContext.route ? { route: pageContext.route } : {})
        };

        if (!hasNewExternalTouch) {
            if (JSON.stringify(context) === JSON.stringify(stored.context || {})) return stored;
            return writeAttribution({ ...stored, context });
        }

        return writeAttribution({
            ...stored,
            last_touch: buildTouch(campaign, externalReferrer, now),
            context,
            updated_at: now,
            expires_at: now + ATTRIBUTION_TTL_MS
        });
    }

    function getAttribution() {
        return readStoredAttribution() || captureAttribution();
    }

    function currentContext() {
        const params = new URLSearchParams(window.location.search || '');
        const path = publicPath(window.location.pathname);
        return {
            service: cleanContextValue(params.get('service')) || SERVICE_BY_PATH[path] || '',
            route: cleanContextValue(params.get('route')) || ROUTE_BY_PATH[path] || ''
        };
    }

    function getEventParameters(extra = {}) {
        const attribution = getAttribution();
        const firstTouch = attribution?.first_touch || {};
        const lastTouch = attribution?.last_touch || firstTouch;
        const context = currentContext();
        const storedContext = attribution?.context || {};
        const params = {
            marketing_source: lastTouch.marketing_source || 'direct',
            landing_page: firstTouch.landing_page || publicPath(window.location.pathname),
            utm_source: lastTouch.utm_source || undefined,
            utm_medium: lastTouch.utm_medium || undefined,
            utm_campaign: lastTouch.utm_campaign || undefined,
            utm_content: lastTouch.utm_content || undefined,
            utm_term: lastTouch.utm_term || undefined,
            service: context.service || storedContext.service || undefined,
            route: context.route || storedContext.route || undefined,
            ...extra
        };

        if (params.service) params.service = cleanContextValue(String(params.service));
        if (params.route) params.route = cleanContextValue(String(params.route));

        return Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        );
    }

    const GA_ID = 'G-83LVJPDG1N';
    const PUBLIC_PAGES = new Set(['/', '/airport', '/disneyland', '/long-distance', '/hourly',
        '/services', '/flotte', '/contact', '/reservation', '/links', '/pages/cgv',
        '/pages/confidentialite', ...Object.keys(ROUTE_BY_PATH), ...Object.keys(SERVICE_BY_PATH)]);
    const measurementPath = () => publicPath(window.location.pathname.replace(/\/$/, '') || '/');
    const audienceAllowed = () => window.PPATConsent?.allows('audience') === true && PUBLIC_PAGES.has(measurementPath());
    let googleScript = null, ready = false, pageViewed = false, expiryTimer;
    const pendingEvents = [];
    window['ga-disable-' + GA_ID] = true;
    function command() { window.dataLayer.push(arguments); }
    function safePage() {
        // Never use location.href, document.title, referrer, campaign values or form data.
        return { page_location: 'https://www.parisprivateairporttransfer.com' + measurementPath(),
            page_title: 'Paris Private Airport Transfer ' + measurementPath(), page_referrer: '' };
    }
    function pageView() {
        if (pageViewed || !ready || !audienceAllowed()) return;
        pageViewed = true;
        command('event', 'page_view', { ...safePage(), send_to: GA_ID });
    }
    function updateAnalytics() {
        const allowed = audienceAllowed();
        window['ga-disable-' + GA_ID] = !allowed;
        if (!allowed) {
            // Disable immediately; do not send consent-mode denial pings or replay queued events.
            pendingEvents.length = 0;
            if (window.dataLayer) window.dataLayer.length = 0;
            if (googleScript && !ready) { googleScript.onload = null; googleScript.remove(); googleScript = null; }
            return;
        }
        if (ready) { pageView(); return; }
        if (googleScript) return;
        window.dataLayer = window.dataLayer || [];
        googleScript = document.createElement('script');
        googleScript.async = true;
        googleScript.referrerPolicy = 'no-referrer';
        googleScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        googleScript.onload = () => {
            if (!audienceAllowed()) return updateAnalytics();
            ready = true;
            command('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied',
                ad_user_data: 'denied', ad_personalization: 'denied' });
            command('js', new Date());
            command('config', GA_ID, { ...safePage(), send_page_view: false,
                allow_google_signals: false, allow_ad_personalization_signals: false,
                cookie_expires: 180 * 86400, cookie_update: false });
            pageView();
            for (const name of pendingEvents.splice(0)) trackEvent(name);
        };
        googleScript.onerror = () => { googleScript?.remove(); googleScript = null; pendingEvents.length = 0; };
        document.head.append(googleScript);
    }
    function trackEvent(name) {
        const isBooking = ['booking_form_start', 'booking_submit_success'].includes(name);
        const isContact = ['contact_form_start', 'contact_submit_success'].includes(name);
        if ((!isBooking && !isContact) || !audienceAllowed() ||
            measurementPath() !== (isBooking ? '/reservation' : '/contact')) return false;
        if (!ready) { if (googleScript) { pendingEvents.push(name); return true; } return false; }
        // Deliberately ignore all caller parameters, including route/query and customer fields.
        command('event', name, { ...safePage(), send_to: GA_ID, form_version: isBooking ? 'reservation_main_v1' : 'contact_main_v1' });
        return true;
    }
    window.addEventListener('ppat:consentchange', updateAnalytics);
    window.addEventListener('pageshow', updateAnalytics);
    updateAnalytics();
    // Expiring consent must also disable an already loaded tag on a long-lived page.
    function checkExpiry() {
        if (expiryTimer) window.clearTimeout(expiryTimer);
        updateAnalytics();
        const expires = window.PPATConsent?.getChoice()?.expiresAt;
        if (expires && window.setTimeout) expiryTimer = window.setTimeout(checkExpiry, Math.min(2147483647, Math.max(1, expires - Date.now())));
    }
    window.addEventListener('ppat:consentchange', checkExpiry);
    if (window.setTimeout) checkExpiry();

    function contactEventName(href) {
        const value = cleanValue(href, 1000).toLowerCase();
        if (value.startsWith('tel:')) return 'contact_phone_click';
        if (value.startsWith('mailto:')) return 'contact_email_click';

        try {
            const host = normalizedHostname(new URL(href, window.location.href).hostname);
            if (host === 'wa.me' || host === 'whatsapp.com' || host.endsWith('.whatsapp.com')) {
                return 'contact_whatsapp_click';
            }
        } catch {
            return '';
        }

        return '';
    }

    captureAttribution();

    window.PPATMarketing = {
        captureAttribution,
        classifySource,
        getAttribution,
        getEventParameters,
        publicPath,
        trackEvent,
        storageKey: STORAGE_KEY,
        ttlMs: ATTRIBUTION_TTL_MS,
        get attribution() { return getAttribution(); }
    };

    if (!window.__ppatContactClickTrackingInstalled) {
        window.__ppatContactClickTrackingInstalled = true;
        document.addEventListener('click', (event) => {
            const link = event.target.closest?.('a[href]');
            if (!link) return;

            const eventName = contactEventName(link.getAttribute('href'));
            if (!eventName) return;

            trackEvent(eventName, {
                page_path: publicPath(window.location.pathname)
            });
        });
    }
})(window, document);
