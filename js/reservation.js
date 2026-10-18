// ============================================================================
// Reservation page logic: pricing, validation, admin tools, and submission.
// ============================================================================

const NIGHT_SURCHARGE = 10;
const ANALYTICS_FORM_VERSION = 'reservation_main_v1';

let bookingFormStartedTracked = false;
let bookingSubmitSuccessTracked = false;

let state = {
    isRoundTrip : false,
    isNight     : false,
    adminMode   : false,
    customPrice : null,
    promoAmount : 0,
    promoType   : 'fixed',
    promoLabel  : '',
};

function trackAnalyticsEvent(name, params = {}) {
    if (window.PPATMarketing?.trackEvent) {
        return window.PPATMarketing.trackEvent(name, params);
    }

    return false;
}

function bookingPagePath() {
    return window.PPATMarketing?.publicPath?.(window.location.pathname)
        || window.location.pathname.replace(/\.html$/i, '')
        || '/';
}

function trackBookingPageView() {
    trackAnalyticsEvent('booking_page_view', {
        page_path: bookingPagePath(),
        form_version: ANALYTICS_FORM_VERSION
    });
}

function trackBookingFormStart() {
    if (bookingFormStartedTracked) return;

    bookingFormStartedTracked = trackAnalyticsEvent('booking_form_start', {
        page_path: bookingPagePath(),
        form_version: ANALYTICS_FORM_VERSION,
        service: document.getElementById('service')?.value || undefined
    });
}

function trackBookingSubmitSuccess(serviceType, tripType) {
    if (bookingSubmitSuccessTracked) return;

    bookingSubmitSuccessTracked = trackAnalyticsEvent('booking_submit_success', {
        page_path: bookingPagePath(),
        form_version: ANALYTICS_FORM_VERSION,
        service_type: serviceType || 'unknown',
        service: serviceType || 'unknown',
        trip_type: tripType || 'unknown',
        success: true
    });
}


// Pricing grid keyed by service and passenger count.
// Services capped at 8 passengers omit the higher indexes on purpose.
const PRICING = {
    // CDG → Paris
    'cdg-paris': {
        1:80,  2:80,  3:90,  4:100, 5:110,
        6:110, 7:120, 8:130, 9:210, 10:220,
        11:220, 12:220, 13:240, 14:240, 15:250, 16:260
    },
    // Orly → Paris
    'orly-paris': {
        1:75,  2:75,  3:80,  4:100, 5:100,
        6:100, 7:110, 8:120, 9:180, 10:200,
        11:200, 12:200, 13:220, 14:220, 15:240, 16:240
    },
    // Orly → Disneyland
    'orly-disney': {
        1:80,  2:80,  3:85,  4:90,  5:95,
        6:100, 7:105, 8:110, 9:185, 10:190,
        11:195, 12:200, 13:205, 14:210, 15:215, 16:220
    },
    // CDG → Disneyland
    'cdg-disney': {
        1:70,  2:70,  3:75,  4:80,  5:85,
        6:90,  7:95,  8:100, 9:165, 10:170,
        11:175, 12:180, 13:185, 14:190, 15:195, 16:200
    },
    // Beauvais → Disneyland
    'beauvais-disney': {
        1:160, 2:160, 3:160, 4:160, 5:165,
        6:170, 7:175, 8:180, 9:315, 10:325,
        11:330, 12:340, 13:345, 14:350, 15:355, 16:360
    },
    // Paris → Disneyland
    'paris-disney': {
        1:90,  2:90,  3:95,  4:100, 5:105,
        6:110, 7:115, 8:120, 9:200, 10:210,
        11:215, 12:220, 13:225, 14:230, 15:235, 16:240
    },
    // Beauvais → Paris  (plafonné 8)
    'beauvais-paris': {
        1:160, 2:160, 3:160, 4:180, 5:180,
        6:180, 7:180, 8:180
    },
    // Paris → Gares  (plafonné 8)
    'paris-gares': {
        1:80, 2:80, 3:80, 4:90, 5:90,
        6:90, 7:90, 8:90
    },
    // CDG → Orly  (plafonné 8)
    'cdg-orly': {
        1:100, 2:100, 3:100, 4:120, 5:120,
        6:120, 7:120, 8:120
    },
    // CDG → Beauvais  (plafonné 8)
    'cdg-beauvais': {
        1:150, 2:150, 3:150, 4:160, 5:160,
        6:160, 7:160, 8:160
    },
    // Beauvais → Orly  (plafonné 8)
    'beauvais-orly': {
        1:180, 2:180, 3:180, 4:210, 5:210,
        6:210, 7:210, 8:210
    },
    // Mise à disposition — tarif fixe
    'dispo-4h'  : { default: 280 },
    'dispo-8h'  : { default: 520 },
    'dispo-10h' : { default: 600 },
};

// Maximum supported passenger count per service key.
const SERVICE_MAX = {
    'cdg-paris':16,'orly-paris':16,'orly-disney':16,'cdg-disney':16,
    'beauvais-disney':16,'paris-disney':16,
    'beauvais-paris':8,'paris-gares':8,'cdg-orly':8,'cdg-beauvais':8,'beauvais-orly':8,
};


// Resolve the base fare from either the hero calculator or the booking form.
function getBasePrice(source = 'form') {
    const useCalc = source === 'calc';

    const serviceKey =
        (useCalc
            ? document.getElementById('calc-service')?.value
            : document.getElementById('service')?.value) ||
        'cdg-paris';

    const adults =
        parseInt(
            (useCalc
                ? document.getElementById('calc-passengers')?.value
                : document.getElementById('passengers')?.value) ||
            '1'
        ) || 1;

    const children =
        parseInt(
            (useCalc
                ? document.getElementById('calc-child')?.value
                : document.getElementById('child')?.value) ||
            '0'
        ) || 0;

    const total = adults + children;

    const grid = PRICING[serviceKey];

    if (!grid) return 0;
    if (grid.default !== undefined) return grid.default;

    const max = SERVICE_MAX[serviceKey] || 16;
    const nb = Math.min(Math.max(total, 1), max);

    return grid[nb] || grid[max] || 0;
}


// Country list used by the international phone selector.
const COUNTRIES = [
    { flag:'🇫🇷', name:'France',           dial:'+33'  },
    { flag:'🇧🇪', name:'Belgium',          dial:'+32'  },
    { flag:'🇨🇭', name:'Switzerland',      dial:'+41'  },
    { flag:'🇱🇺', name:'Luxembourg',       dial:'+352' },
    { flag:'🇩🇪', name:'Germany',          dial:'+49'  },
    { flag:'🇮🇹', name:'Italy',            dial:'+39'  },
    { flag:'🇪🇸', name:'Spain',            dial:'+34'  },
    { flag:'🇵🇹', name:'Portugal',         dial:'+351' },
    { flag:'🇳🇱', name:'Netherlands',      dial:'+31'  },
    { flag:'🇬🇧', name:'United Kingdom',   dial:'+44'  },
    { flag:'🇮🇪', name:'Ireland',          dial:'+353' },
    { flag:'🇵🇱', name:'Poland',           dial:'+48'  },
    { flag:'🇦🇹', name:'Austria',          dial:'+43'  },
    { flag:'🇩🇰', name:'Denmark',          dial:'+45'  },
    { flag:'🇸🇪', name:'Sweden',           dial:'+46'  },
    { flag:'🇳🇴', name:'Norway',           dial:'+47'  },
    { flag:'🇺🇸', name:'United States',    dial:'+1'   },
    { flag:'🇨🇦', name:'Canada',           dial:'+1'   },
    { flag:'🇲🇽', name:'Mexico',           dial:'+52'  },
    { flag:'🇦🇺', name:'Australia',        dial:'+61'  },
    { flag:'🇯🇵', name:'Japan',            dial:'+81'  },
    { flag:'🇨🇳', name:'China',            dial:'+86'  },
    { flag:'🇮🇳', name:'India',            dial:'+91'  },
    { flag:'🇸🇬', name:'Singapore',        dial:'+65'  },
    { flag:'🇭🇰', name:'Hong Kong',        dial:'+852' },
    { flag:'🇰🇷', name:'South Korea',      dial:'+82'  },
    { flag:'🇳🇿', name:'New Zealand',      dial:'+64'  },
    { flag:'🇧🇷', name:'Brazil',           dial:'+55'  },
    { flag:'🇦🇷', name:'Argentina',        dial:'+54'  },
    { flag:'🇨🇱', name:'Chile',            dial:'+56'  },
    { flag:'🇨🇴', name:'Colombia',         dial:'+57'  },
    { flag:'🇲🇦', name:'Morocco',          dial:'+212' },
    { flag:'🇩🇿', name:'Algeria',          dial:'+213' },
    { flag:'🇹🇳', name:'Tunisia',          dial:'+216' },
    { flag:'🇪🇬', name:'Egypt',            dial:'+20'  },
    { flag:'🇹🇷', name:'Turkey',           dial:'+90'  },
    { flag:'🇸🇦', name:'Saudi Arabia',     dial:'+966' },
    { flag:'🇦🇪', name:'United Arab Emirates', dial:'+971' },
    { flag:'🇶🇦', name:'Qatar',            dial:'+974' },
    { flag:'🇨🇲', name:'Cameroon',         dial:'+237' },
    { flag:'🇸🇳', name:'Senegal',          dial:'+221' },
    { flag:'🇨🇮', name:"Ivory Coast",      dial:'+225' },
    { flag:'🇬🇭', name:'Ghana',            dial:'+233' },
    { flag:'🇳🇬', name:'Nigeria',          dial:'+234' },
    { flag:'🇰🇪', name:'Kenya',            dial:'+254' },
    { flag:'🇿🇦', name:'South Africa',     dial:'+27'  },
];

let selectedCountry = COUNTRIES[0];

function buildCountryList() {
    const list = document.getElementById('countryList');
    if (!list) return;
    list.innerHTML = COUNTRIES.map((c, i) =>
        `<button type="button" class="country-option" data-index="${i}">
            <span class="flag">${c.flag}</span>
            <span class="name">${c.name}</span>
            <span class="code">${c.dial}</span>
        </button>`
    ).join('');

    // Rebind option clicks every time the list is rebuilt.
    list.querySelectorAll('.country-option').forEach(el => {
        el.addEventListener('click', () => {
            const i = parseInt(el.dataset.index);
            selectedCountry = COUNTRIES[i];
            document.getElementById('selectedFlag').textContent = selectedCountry.flag;
            document.getElementById('selectedDial').textContent = selectedCountry.dial;
            setCountryDropdown(false, true);
            updatePhoneFull();
        });
    });
}

function setCountryDropdown(open, returnFocus = false) {
    const trigger = document.getElementById('countryFlagDisplay');
    const dropdown = document.getElementById('countryDropdown');
    if (!trigger || !dropdown) return;
    dropdown.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (returnFocus) trigger.focus();
}

function updatePhoneFull() {
    const num    = document.getElementById('phone-number')?.value.trim().replace(/^0/, '') || '';
    const hidden = document.getElementById('phone-full');
    if (hidden) hidden.value = selectedCountry.dial + num;
}


function requireAdminUi() {
    if (state.adminMode) return true;
    alert('Please sign in as an administrator first.');
    return false;
}

// These values are only local estimates. The server authorizes and recalculates
// all admin overrides before they are saved.
function applyAdminPrice() {
    if (!requireAdminUi()) return;
    const val = Number(document.getElementById('adminCustomPrice')?.value);
    if (!Number.isFinite(val) || val <= 0) { alert('Entrez un prix valide supérieur à 0€'); return; }
    state.customPrice = val;
    showAdminNotice(`Prix manuel : ${val}€ (pending server validation)`);
    updatePriceSummary();
}

function resetAdminPrice() {
    if (!requireAdminUi()) return;
    state.customPrice = null;
    state.promoAmount = 0;
    state.promoLabel = '';
    const amount = document.getElementById('adminPromoAmount');
    if (amount) amount.value = '';
    const input = document.getElementById('adminCustomPrice');
    if (input) input.value = '';
    document.getElementById('adminOverrideNotice')?.classList.remove('show');
    updatePriceSummary();
}

function applyPromo() {
    if (!requireAdminUi()) return;
    const amount = Number(document.getElementById('adminPromoAmount')?.value);
    const type   = document.getElementById('adminPromoType')?.value;
    const label  = document.getElementById('adminPromoLabel')?.value.trim();
    if (!Number.isFinite(amount) || amount <= 0) { alert('Enter a valid discount value'); return; }
    if (type === 'percent' && amount > 100) { alert('Percentage discount cannot exceed 100%.'); return; }
    state.promoAmount = amount;
    state.promoType   = type;
    state.promoLabel  = label || (type === 'percent' ? `Discount ${amount}%` : `Discount ${amount}€`);
    showAdminNotice(`Promotion applied: ${state.promoLabel} (pending server validation)`);
    updatePriceSummary();
}

function showAdminNotice(text) {
    const el  = document.getElementById('adminOverrideNotice');
    const txt = document.getElementById('adminOverrideText');
    if (el && txt) { txt.textContent = text; el.classList.add('show'); }
}


// Compute the live reservation total, including round-trip and night rules.
function getTotalPrice() {
    if (state.customPrice !== null) {
        const discount = calcDiscount(state.customPrice);
        return { base: state.customPrice, night: 0, discount, total: Math.max(0, state.customPrice - discount) };
    }
    if (document.getElementById('service')?.value === 'other') return { base: 0, night: 0, discount: 0, total: 0 };
    const base     = getBasePrice('form');
    const afterRT  = state.isRoundTrip ? base * 2 : base;
    const night    = getNightSurchargeTotal();
    const subtotal = afterRT + night;
    const discount = calcDiscount(subtotal);
    return { base, roundtrip: state.isRoundTrip ? afterRT : null, night, discount, total: Math.max(0, subtotal - discount) };
}

function calcDiscount(sub) {
    if (!state.promoAmount) return 0;
    return state.promoType === 'percent'
        ? Math.round(sub * state.promoAmount / 100)
        : Math.min(state.promoAmount, sub);
}

function isNightTime(value) {
    if (!value) return false;
    const hour = parseInt(String(value).split(':')[0], 10);
    return hour >= 22 || hour < 6;
}

function getNightSurchargeTotal() {
    const outboundNight = isNightTime(document.getElementById('time')?.value) ? NIGHT_SURCHARGE : 0;
    const returnNight =
        state.isRoundTrip && isNightTime(document.getElementById('return-time')?.value)
            ? NIGHT_SURCHARGE
            : 0;

    return outboundNight + returnNight;
}

function updatePriceSummary() {
    const calculated = document.getElementById('adminCalculatedPrice');
    const isOther = document.getElementById('service')?.value === 'other';
    if (calculated) calculated.textContent = isOther ? 'No automatic fare — enter a custom price' : (getBasePrice('form') * (state.isRoundTrip ? 2 : 1) + getNightSurchargeTotal()) + '€';
    const priceError = document.getElementById('adminServicePriceError');
    if (priceError && (!isOther || state.customPrice > 0)) priceError.hidden = true;
    const p      = getTotalPrice();
    const fmt    = v => v + '€';
    const adults = parseInt(document.getElementById('passengers')?.value) || 0;
    const kids   = parseInt(document.getElementById('child')?.value)      || 0;
    const nbTot  = adults + kids;

    // Base fare.
    const baseEl = document.getElementById('summaryBaseVal');
    if (baseEl) baseEl.textContent = fmt(state.customPrice !== null ? state.customPrice : p.base);

    // Passenger count summary.
    const paxRow = document.getElementById('summaryPassengers');
    const paxVal = document.getElementById('summaryPassengersVal');
    if (paxRow) {
        paxRow.style.display = (nbTot > 0 && state.customPrice === null) ? 'flex' : 'none';
        if (paxVal && nbTot > 0) paxVal.textContent = `${nbTot} personne${nbTot > 1 ? 's' : ''}`;
    }

    // Round-trip uplift.
    const rtRow = document.getElementById('summaryRoundtrip');
    const rtVal = document.getElementById('summaryRoundtripVal');
    if (rtRow) {
        const show = state.isRoundTrip && state.customPrice === null && p.roundtrip;
        rtRow.style.display = show ? 'flex' : 'none';
        if (rtVal && show) rtVal.textContent = fmt(p.roundtrip);
    }

    // Night surcharge.
    const nightRow = document.getElementById('summaryNight');
    const nightVal = document.getElementById('summaryNightVal');
    if (nightRow) nightRow.style.display = (p.night > 0 && state.customPrice === null) ? 'flex' : 'none';
    if (nightVal) nightVal.textContent = `+${fmt(p.night)}`;

    // Discount.
    const discRow   = document.getElementById('summaryDiscount');
    const discVal   = document.getElementById('summaryDiscountVal');
    const discLabel = document.getElementById('summaryDiscountLabel');
    if (discRow) {
        if (p.discount > 0) {
            discRow.style.display = 'flex';
            if (discVal)   discVal.textContent   = '−' + fmt(p.discount);
            if (discLabel) discLabel.textContent = state.promoLabel || 'Discount';
        } else {
            discRow.style.display = 'none';
        }
    }

    // Final total.
    const totalEl = document.getElementById('summaryTotal');
    if (totalEl) totalEl.textContent = isOther && state.customPrice === null ? 'Custom price required' : fmt(p.total);

    // Keep the hero calculator in sync with its own inputs.
    if (state.customPrice === null) {
        const base2  = getBasePrice('calc');
        const total2 = (state.isRoundTrip ? base2 * 2 : base2) + getNightSurchargeTotal();
        const calcEl = document.getElementById('calcPrice');
        if (calcEl) calcEl.textContent = total2 + '€';
        const subEl = document.getElementById('calcPriceSub');
        if (subEl) subEl.textContent = state.isRoundTrip ? `Outbound ${base2}€ + Return ${base2}€` : '';
    }

    // Toggle the informational night warning.
    document.getElementById('nightWarning')?.classList.toggle('show', p.night > 0 && state.customPrice === null);
}


// Re-evaluate whether any selected trip segment falls in the night window.
function checkNightSurcharge() {
    state.isNight = getNightSurchargeTotal() > 0;
    updatePriceSummary();
}


// Keep the round-trip UI state and required fields synchronized.
function setTripMode(rt) {
    state.isRoundTrip = rt;
    document.getElementById('calcOneWayBtn')?.classList.toggle('active', !rt);
    document.getElementById('calcRoundTripBtn')?.classList.toggle('active', rt);
    const cb = document.getElementById('roundtrip');
    if (cb) cb.checked = rt;
    document.getElementById('rtCheck')?.classList.toggle('is-checked', rt);
    document.getElementById('rtBadge')?.classList.toggle('show', rt);
    document.getElementById('rtWrapper')?.classList.toggle('checked', rt);
    const returnRow = document.getElementById('returnDateRow');
    const rdInput   = document.getElementById('return-date');
    const rtInput   = document.getElementById('return-time');
    if (returnRow) returnRow.style.display = rt ? 'grid' : 'none';
    if (rdInput)   rdInput.required = rt;
    if (rtInput)   rtInput.required = rt;
    updatePriceSummary();
}


// Suggest the suitable vehicle from the total passenger count.
function autoSelectVehicle() {
    const adults  = parseInt(document.getElementById('passengers')?.value) || 0;
    const kids    = parseInt(document.getElementById('child')?.value)      || 0;
    const total   = adults + kids;
    const vehEl   = document.getElementById('vehicle-type');
    const hintEl  = document.getElementById('vehicleHint');
    const hintTxt = document.getElementById('vehicleHintText');

    if (!vehEl || total === 0) { updatePriceSummary(); return; }

    if (total <= 2) {
        vehEl.value = 'Premium Sedan';
        if (hintTxt) hintTxt.textContent = `${total} passenger${total > 1 ? 's' : ''} — Premium Sedan selected.`;
    } else {
        vehEl.value = 'Luxury Van 7 seats';
        if (hintTxt) hintTxt.textContent = `${total} passengers — Luxury Van 7 seats selected automatically.`;
    }
    hintEl?.classList.add('show');
    updatePriceSummary();
}


// Form validation and inline error helpers.
function prepareFieldError(group) {
    if (!group) return { control: null, error: null };
    const control = group.querySelector('input:not([type="hidden"]), select, textarea');
    const error = group.querySelector('.field-error');
    if (!control || !error) return { control, error };

    if (!error.id) error.id = `${group.id || control.id}-error`;
    error.setAttribute('aria-live', 'polite');
    control.setAttribute('aria-describedby', error.id);
    if (!control.hasAttribute('aria-invalid')) control.setAttribute('aria-invalid', 'false');
    return { control, error };
}

function clearError(id) {
    const g = document.getElementById(id);
    if (!g) return;
    const { control, error } = prepareFieldError(g);
    g.classList.remove('has-error');
    error?.classList.remove('show');
    control?.setAttribute('aria-invalid', 'false');
}

function showError(id, msg = null) {
    const g = document.getElementById(id);
    if (!g) return;
    const { control, error: err } = prepareFieldError(g);
    g.classList.add('has-error');
    if (err) {
        if (msg) err.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        err.classList.add('show');
    }
    control?.setAttribute('aria-invalid', 'true');
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p) { return p.replace(/[\s\-\(\)\.]/g, '').length >= 7; }

function validateAdminService() {
    const isOther = document.getElementById('service')?.value === 'other';
    const valid = !isOther || (state.adminMode && Number.isFinite(state.customPrice) && state.customPrice > 0);
    const error = document.getElementById('adminServicePriceError');
    if (error) {
        error.hidden = valid;
        error.textContent = valid ? '' : 'Please enter and apply a custom price greater than 0 for Other.';
    }
    if (!valid) document.getElementById('adminCustomPrice')?.focus();
    return valid;
}

function validateForm() {
    let ok = true;
    ['fg-name','fg-email','fg-phone','fg-service','fg-pickup','fg-destination',
     'fg-date','fg-time','fg-passengers','fg-luggage','fg-vehicle','fg-cgv'].forEach(clearError);

    if (!(document.getElementById('name')?.value.trim().length >= 2)) { showError('fg-name'); ok = false; }
    if (!isValidEmail(document.getElementById('email')?.value.trim() || '')) { showError('fg-email'); ok = false; }

    const phone = document.getElementById('phone-number')?.value.trim();
    if (!phone || !isValidPhone(phone)) {
        showError('fg-phone');
        document.getElementById('phoneWrapper')?.classList.add('error');
        ok = false;
    } else {
        document.getElementById('phoneWrapper')?.classList.remove('error');
    }

    ['fg-service','fg-passengers','fg-luggage','fg-vehicle'].forEach(id => {
        if (!document.querySelector(`#${id} select`)?.value) { showError(id); ok = false; }
    });
    ['fg-pickup','fg-destination','fg-date','fg-time'].forEach(id => {
        if (!document.querySelector(`#${id} input`)?.value.trim()) { showError(id); ok = false; }
    });

    const dateVal = document.getElementById('date')?.value;
    if (dateVal && new Date(dateVal) < new Date(new Date().toDateString())) {
        showError('fg-date', 'La date doit être dans le futur'); ok = false;
    }
    if (state.isRoundTrip) {
        if (!document.getElementById('return-date')?.value) { showError('fg-return-date'); ok = false; }
        if (!document.getElementById('return-time')?.value) { showError('fg-return-time'); ok = false; }
    }
    if (!document.getElementById('cgv')?.checked) { showError('fg-cgv'); ok = false; }

    if (!ok) document.querySelector('.form-group.has-error')?.scrollIntoView({ behavior:'smooth', block:'center' });
    return ok;
}

function bindLiveValidation() {
    const map = { 'vehicle-type': 'fg-vehicle' };
    ['name','email','service','pickup','destination','date','time','passengers','luggage','vehicle-type'].forEach(id => {
        const el  = document.getElementById(id);
        const gid = map[id] || `fg-${id}`;
        el?.addEventListener('input',  () => clearError(gid));
        el?.addEventListener('change', () => clearError(gid));
    });
    document.getElementById('phone-number')?.addEventListener('input', () => {
        clearError('fg-phone');
        document.getElementById('phoneWrapper')?.classList.remove('error');
        updatePhoneFull();
    });
    document.getElementById('cgv')?.addEventListener('change', () => clearError('fg-cgv'));
}


const API_URL = 'https://paris-private-backend.onrender.com';
let adminSessionRevision = 0;
let adminExpiryTimer;
let verifiedAdminUserId = null;
let adminInitialization = Promise.resolve();

function setAdminUi(enabled) {
    state.adminMode = enabled;
    const other = document.getElementById('adminOtherService');
    if (other) { other.hidden = !enabled; other.disabled = !enabled; }
    if (!enabled && document.getElementById('service')?.value === 'other') {
        document.getElementById('service').value = '';
    }
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.hidden = !enabled;
        panel.classList.toggle('open', enabled);
    }
    if (!enabled) {
        verifiedAdminUserId = null;
        clearTimeout(adminExpiryTimer);
        state.customPrice = null;
        state.promoAmount = 0;
        state.promoType = 'fixed';
        state.promoLabel = '';
        ['adminCustomPrice', 'adminPromoAmount', 'adminPromoLabel', 'adminClientNote',
            'adminRef', 'adminOverrideReason'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        const type = document.getElementById('adminPromoType');
        if (type) type.value = 'fixed';
        document.getElementById('adminOverrideNotice')?.classList.remove('show');
    }
    updatePriceSummary();
}

async function getVerifiedAdminToken() {
    if (!window.ppatSupabase) return null;
    const revision = adminSessionRevision;
    const { data, error } = await window.ppatSupabase.auth.getSession();
    const session = data?.session;
    if (error || !session?.access_token || session.expires_at * 1000 <= Date.now()) return null;
    const response = await fetch(`${API_URL}/api/admin/session`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok || revision !== adminSessionRevision || session.expires_at * 1000 <= Date.now()) return null;
    verifiedAdminUserId = session.user?.id || null;
    clearTimeout(adminExpiryTimer);
    if (Number.isFinite(session.expires_at)) {
        adminExpiryTimer = setTimeout(() => {
            adminSessionRevision++;
            setAdminUi(false);
        }, Math.min(session.expires_at * 1000 - Date.now(), 2147483647));
    }
    return session.access_token;
}

async function syncAdminUi() {
    const revision = ++adminSessionRevision;
    try {
        const token = await getVerifiedAdminToken();
        if (revision === adminSessionRevision) setAdminUi(Boolean(token));
    } catch {
        if (revision === adminSessionRevision) setAdminUi(false);
    }
}

function initializeAdminSession() {
    setAdminUi(false);
    if (!window.ppatSupabase) return;
    window.ppatSupabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return; // getSession below handles initial restoration.
        // Never await Supabase calls inside its auth callback.
        adminSessionRevision++;
        if (!session || event === 'SIGNED_OUT' || session.expires_at * 1000 <= Date.now()) {
            setAdminUi(false);
        } else {
            if (verifiedAdminUserId !== (session.user?.id || null)) setAdminUi(false);
            const revision = adminSessionRevision;
            setTimeout(() => {
                if (revision === adminSessionRevision) adminInitialization = syncAdminUi();
            }, 0);
        }
    });
    adminInitialization = syncAdminUi();
}

async function toggleAdminMode() {
    adminSessionRevision++;
    setAdminUi(false);
    try {
        const result = await window.ppatSupabase?.auth.signOut();
        if (result?.error) alert('Sign out could not be completed. Please try again.');
    } catch {
        alert('Sign out could not be completed. Please try again.');
    }
}


// Send the booking payload to the backend and reset the UI on success.
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm() || !validateAdminService()) return;

    const btn = document.getElementById('submitBtn');
    if (btn?.disabled) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Sending...</span>';
    }

    await adminInitialization;
    const submittingAsAdmin = state.adminMode;
    const bookingData = {
        customer_name: document.getElementById('name')?.value.trim(),
        customer_email: document.getElementById('email')?.value.trim(),
        customer_phone: document.getElementById('phone-full')?.value
            || (selectedCountry.dial + document.getElementById('phone-number')?.value.trim()),

        pickup_location: document.getElementById('pickup')?.value.trim(),
        destination: document.getElementById('destination')?.value.trim(),

        booking_date: document.getElementById('date')?.value,
        booking_time: document.getElementById('time')?.value,

        return_date: state.isRoundTrip ? document.getElementById('return-date')?.value : null,
        return_time: state.isRoundTrip ? document.getElementById('return-time')?.value : null,

        vehicle_type: document.getElementById('vehicle-type')?.value,

        passengers: parseInt(document.getElementById('passengers')?.value) || 1,
        children: parseInt(document.getElementById('child')?.value) || 0,

        luggage: parseInt(
            (document.getElementById('luggage')?.value || '0').replace(/\D/g, '')
        ) || 0,

        baby_seats: parseInt(document.getElementById('baby-seat-input')?.value) || 0,
        child_seats: parseInt(document.getElementById('child-seat-input')?.value) || 0,

        flight_number: document.getElementById('flight')?.value.trim() || null,
        terminal: document.getElementById('terminal')?.value.trim() || null,
        notes: document.getElementById('notes')?.value.trim() || null,

        service_type: document.getElementById('service')?.value || null,
        payment_method: document.querySelector('input[name="payment"]:checked')?.value || null,

        trip_type: state.isRoundTrip ? "round_trip" : "one_way",

    };

    if (!state.adminMode) {
        const marketingAttribution = window.PPATMarketing?.getAttribution?.();
        if (marketingAttribution) {
            bookingData.marketing_attribution = marketingAttribution;
        }
    }

    try {
        let token = null;
        if (submittingAsAdmin) {
            try {
                token = await getVerifiedAdminToken();
            } catch {
                setAdminUi(false);
                throw new Error('Unable to verify administrator access. Please sign in again.');
            }
        }
        if (submittingAsAdmin && (!token || !state.adminMode)) {
            setAdminUi(false);
            throw new Error('Your admin session has expired. Please sign in again.');
        }
        if (token) {
            bookingData.admin_override = {
                custom_price: state.customPrice,
                discount: state.promoAmount > 0 ? {
                    amount: state.promoAmount,
                    type: state.promoType,
                    label: state.promoLabel
                } : undefined,
                reason: document.getElementById('adminOverrideReason')?.value.trim() || null
            };
            bookingData.internal_note = document.getElementById('adminClientNote')?.value.trim() || null;
            bookingData.internal_reference = document.getElementById('adminRef')?.value.trim() || null;
        }

        const res = await fetch(`${API_URL}/api/bookings${token ? '/admin' : ''}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...await window.PPATEmailOperations.headers("booking", bookingData),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(bookingData)
        });

        const raw = await res.text();
        let data = {};

        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(raw || "Server error");
        }

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Server error");
        }

        trackBookingSubmitSuccess(bookingData.service_type, bookingData.trip_type);
        document.getElementById('bookingSuccessRef').textContent = data.booking_number;

        const ok = document.getElementById('bookingSuccess');
        ok?.classList.add('show');
        ok?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        window.PPATEmailOperations.complete("booking");
        e.target.reset();
        bookingFormStartedTracked = false;
        bookingSubmitSuccessTracked = false;

        state = {
            isRoundTrip: false,
            isNight: false,
            adminMode: state.adminMode,
            customPrice: null,
            promoAmount: 0,
            promoType: 'fixed',
            promoLabel: ''
        };

        setTripMode(false);
        updatePriceSummary();

    } catch (err) {
        console.error(err);
        alert(err.message || "Error while sending the booking.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Confirm My Booking</span>';
        }
    }
}
// Seat counters drive both the visible badge and hidden numeric inputs.
function changeSeat(type, change) {

    // Visible counter shown inside the seat card.
    const countEl = document.getElementById(`${type}-count`);

    // Support both the current and the legacy hidden input ids.
    const inputEl =
        document.getElementById(`${type}-input`) ||
        document.getElementById(`${type}-seat-input`);

    if (!countEl || !inputEl) {
        console.warn(`Seat elements not found for: ${type}`);
        return;
    }

    let current = parseInt(countEl.textContent) || 0;

    current += change;

    // Clamp the seat count to a safe range.
    if (current < 0) current = 0;
    if (current > 10) current = 10;

    // Update the visible counter.
    countEl.textContent = current;

    // Mirror the value to the hidden form input.
    inputEl.value = current;
}

// Initialize the reservation page without relying on inline event handlers.
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminSession();
    trackBookingPageView();

    const bookingForm = document.getElementById('bookingForm');

    bookingForm?.addEventListener('input', event => {
        if (event.isTrusted) trackBookingFormStart();
    });

    bookingForm?.addEventListener('change', event => {
        if (event.isTrusted) trackBookingFormStart();
    });

    // Prevent selecting past dates.
    const today = new Date().toISOString().split('T')[0];
    ['date','return-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.min = today;
    });

    // Build the phone country dropdown.
    buildCountryList();
    document.querySelectorAll('#bookingForm .form-group').forEach(prepareFieldError);

    // Toggle the country dropdown from the flag control.
    document.getElementById('countryFlagDisplay')?.addEventListener('click', e => {
        e.stopPropagation();
        const dd = document.getElementById('countryDropdown');
        if (!dd) return;
        const isOpen = !dd.classList.contains('open');
        if (isOpen) buildCountryList();
        setCountryDropdown(isOpen);
    });

    document.querySelector('.country-select-wrapper')?.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        setCountryDropdown(false, true);
    });

    // Close the dropdown when clicking outside the selector.
    document.addEventListener('click', e => {
        const wrapper = document.querySelector('.country-select-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            setCountryDropdown(false);
        }
    });

    // Keep the full international phone value updated.
    document.getElementById('phone-number')?.addEventListener('input', updatePhoneFull);

    // Hero calculator events.
    document.getElementById('calc-service')?.addEventListener('change', updatePriceSummary);
    document.getElementById('calc-passengers')?.addEventListener('change', updatePriceSummary);
    document.getElementById('service')?.addEventListener('change', updatePriceSummary);

    // Round-trip toggles.
    document.getElementById('calcOneWayBtn')?.addEventListener('click',    () => setTripMode(false));
    document.getElementById('calcRoundTripBtn')?.addEventListener('click', () => setTripMode(true));
    document.getElementById('roundtrip')?.addEventListener('change', function() { setTripMode(this.checked); });

    // Night-window checks.
    document.getElementById('time')?.addEventListener('change', checkNightSurcharge);
    document.getElementById('return-time')?.addEventListener('change', checkNightSurcharge);

    // Vehicle suggestion reacts to passenger count changes.
    document.getElementById('passengers')?.addEventListener('change', autoSelectVehicle);
    document.getElementById('child')?.addEventListener('change',      autoSelectVehicle);

    // Manual vehicle changes should hide the auto-selection hint.
    document.getElementById('vehicle-type')?.addEventListener('change', () => {
        document.getElementById('vehicleHint')?.classList.remove('show');
        updatePriceSummary();
    });

    // Live validation bindings.
    bindLiveValidation();

    // Booking form submission.
    bookingForm?.addEventListener('submit', handleFormSubmit);

    // Admin mode entry point.
    document.getElementById('adminToggleBtn')?.addEventListener('click', toggleAdminMode);

    // Prefill existing dedicated route landing pages.
    // This only selects existing form values; pricing remains calculated by the current engine.
    const routeParams = new URLSearchParams(window.location.search);
    const routePrefills = {
        'cdg-paris': {
            service: 'cdg-paris',
            pickup: 'Charles de Gaulle Airport (CDG)',
            destination: ''
        },
        'orly-paris': {
            service: 'orly-paris',
            pickup: 'Paris Orly Airport (ORY)',
            destination: ''
        },
        'beauvais-paris': {
            service: 'beauvais-paris',
            pickup: 'Beauvais Airport (BVA)',
            destination: ''
        },
        'cdg-disneyland': {
            service: 'cdg-disney',
            pickup: 'Charles de Gaulle Airport (CDG)',
            destination: 'Disneyland Paris'
        },
        'orly-disneyland': {
            service: 'orly-disney',
            pickup: 'Paris Orly Airport (ORY)',
            destination: 'Disneyland Paris'
        },
        'beauvais-disneyland': {
            service: 'beauvais-disney',
            pickup: 'Beauvais Airport (BVA)',
            destination: 'Disneyland Paris'
        },
        'paris-disneyland': {
            service: 'paris-disney',
            destination: 'Disneyland Paris'
        }
    };
    const routePrefill = routePrefills[routeParams.get('route')];

    if (routePrefill) {
        const serviceSelect = document.getElementById('service');
        const calculatorService = document.getElementById('calc-service');
        const pickupInput = document.getElementById('pickup');
        const destinationInput = document.getElementById('destination');

        if (serviceSelect) serviceSelect.value = routePrefill.service;
        if (calculatorService) calculatorService.value = routePrefill.service;
        if (pickupInput && routePrefill.pickup && !pickupInput.value) pickupInput.value = routePrefill.pickup;
        if (destinationInput && !destinationInput.value) destinationInput.value = routePrefill.destination;
    }

    // Initial price summary.
    updatePriceSummary();
});
