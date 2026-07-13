// ============================================================================
// Reservation page logic: pricing, validation, admin tools, and submission.
// ============================================================================

const NIGHT_SURCHARGE = 10;

let state = {
    isRoundTrip : false,
    isNight     : false,
    adminMode   : false,
    customPrice : null,
    promoAmount : 0,
    promoType   : 'fixed',
    promoLabel  : '',
};


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
    { flag:'🇧🇪', name:'Belgique',         dial:'+32'  },
    { flag:'🇨🇭', name:'Suisse',           dial:'+41'  },
    { flag:'🇱🇺', name:'Luxembourg',       dial:'+352' },
    { flag:'🇩🇪', name:'Allemagne',        dial:'+49'  },
    { flag:'🇮🇹', name:'Italie',           dial:'+39'  },
    { flag:'🇪🇸', name:'Espagne',          dial:'+34'  },
    { flag:'🇵🇹', name:'Portugal',         dial:'+351' },
    { flag:'🇳🇱', name:'Pays-Bas',         dial:'+31'  },
    { flag:'🇬🇧', name:'Royaume-Uni',      dial:'+44'  },
    { flag:'🇮🇪', name:'Irlande',          dial:'+353' },
    { flag:'🇵🇱', name:'Pologne',          dial:'+48'  },
    { flag:'🇦🇹', name:'Autriche',         dial:'+43'  },
    { flag:'🇩🇰', name:'Danemark',         dial:'+45'  },
    { flag:'🇸🇪', name:'Suède',            dial:'+46'  },
    { flag:'🇳🇴', name:'Norvège',          dial:'+47'  },
    { flag:'🇺🇸', name:'États-Unis',       dial:'+1'   },
    { flag:'🇨🇦', name:'Canada',           dial:'+1'   },
    { flag:'🇦🇺', name:'Australie',        dial:'+61'  },
    { flag:'🇯🇵', name:'Japon',            dial:'+81'  },
    { flag:'🇨🇳', name:'Chine',            dial:'+86'  },
    { flag:'🇮🇳', name:'Inde',             dial:'+91'  },
    { flag:'🇧🇷', name:'Brésil',           dial:'+55'  },
    { flag:'🇲🇦', name:'Maroc',            dial:'+212' },
    { flag:'🇩🇿', name:'Algérie',          dial:'+213' },
    { flag:'🇹🇳', name:'Tunisie',          dial:'+216' },
    { flag:'🇸🇦', name:'Arabie Saoudite',  dial:'+966' },
    { flag:'🇦🇪', name:'Émirats Arabes',   dial:'+971' },
    { flag:'🇶🇦', name:'Qatar',            dial:'+974' },
    { flag:'🇨🇲', name:'Cameroun',         dial:'+237' },
    { flag:'🇸🇳', name:'Sénégal',          dial:'+221' },
    { flag:'🇨🇮', name:"Côte d'Ivoire",    dial:'+225' },
    { flag:'🇬🇭', name:'Ghana',            dial:'+233' },
    { flag:'🇿🇦', name:'Afrique du Sud',   dial:'+27'  },
];

let selectedCountry = COUNTRIES[0];

function buildCountryList() {
    const list = document.getElementById('countryList');
    if (!list) return;
    list.innerHTML = COUNTRIES.map((c, i) =>
        `<div class="country-option" data-index="${i}">
            <span class="flag">${c.flag}</span>
            <span class="name">${c.name}</span>
            <span class="code">${c.dial}</span>
        </div>`
    ).join('');

    // Rebind option clicks every time the list is rebuilt.
    list.querySelectorAll('.country-option').forEach(el => {
        el.addEventListener('click', () => {
            const i = parseInt(el.dataset.index);
            selectedCountry = COUNTRIES[i];
            document.getElementById('selectedFlag').textContent = selectedCountry.flag;
            document.getElementById('selectedDial').textContent = selectedCountry.dial;
            document.getElementById('countryDropdown').classList.remove('open');
            updatePhoneFull();
        });
    });
}

function updatePhoneFull() {
    const num    = document.getElementById('phone-number')?.value.trim().replace(/^0/, '') || '';
    const hidden = document.getElementById('phone-full');
    if (hidden) hidden.value = selectedCountry.dial + num;
}


// Admin helpers stay global because the template triggers them directly.
function applyAdminPrice() {
    const val = parseInt(document.getElementById('adminCustomPrice')?.value);
    if (!val || val <= 0) { alert('Entrez un prix valide supérieur à 0€'); return; }
    state.customPrice = val;
    showAdminNotice(`Prix manuel : ${val}€ (calcul automatique ignoré)`);
    updatePriceSummary();
}

function resetAdminPrice() {
    state.customPrice = null;
    const input = document.getElementById('adminCustomPrice');
    if (input) input.value = '';
    document.getElementById('adminOverrideNotice')?.classList.remove('show');
    updatePriceSummary();
}

function applyPromo() {
    const amount = parseFloat(document.getElementById('adminPromoAmount')?.value);
    const type   = document.getElementById('adminPromoType')?.value;
    const label  = document.getElementById('adminPromoLabel')?.value.trim();
    if (!amount || amount <= 0) { alert('Enter a valid discount value'); return; }
    state.promoAmount = amount;
    state.promoType   = type;
    state.promoLabel  = label || (type === 'percent' ? `Discount ${amount}%` : `Discount ${amount}€`);
    showAdminNotice(`Promotion applied: ${state.promoLabel}`);
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
    if (totalEl) totalEl.textContent = fmt(p.total);

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
        vehEl.value = 'Berline Premium';
        if (hintTxt) hintTxt.textContent = `${total} personne${total > 1 ? 's' : ''} — Berline Premium sélectionnée.`;
    } else {
        vehEl.value = 'Van Luxe 7 places';
        if (hintTxt) hintTxt.textContent = `${total} personnes — Van Luxe sélectionné automatiquement.`;
    }
    hintEl?.classList.add('show');
    updatePriceSummary();
}


// Form validation and inline error helpers.
function clearError(id) {
    const g = document.getElementById(id);
    if (!g) return;
    g.classList.remove('has-error');
    g.querySelector('.field-error')?.classList.remove('show');
}

function showError(id, msg = null) {
    const g = document.getElementById(id);
    if (!g) return;
    g.classList.add('has-error');
    const err = g.querySelector('.field-error');
    if (err) {
        if (msg) err.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
        err.classList.add('show');
    }
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p) { return p.replace(/[\s\-\(\)\.]/g, '').length >= 7; }

function validateForm() {
    let ok = true;
    ['fg-name','fg-email','fg-phone','fg-service','fg-pickup','fg-destination',
     'fg-date','fg-time','fg-passengers','fg-luggage','fg-vehicle','fg-cgv'].forEach(clearError);

    if (!(document.getElementById('name')?.value.trim().length >= 2)) { showError('fg-name'); ok = false; }
    if (!isValidEmail(document.getElementById('email')?.value.trim() || '')) { showError('fg-email'); ok = false; }

    const phone = document.getElementById('phone-number')?.value.trim();
    if (!phone || !isValidPhone(phone)) {
        document.getElementById('fg-phone')?.classList.add('has-error');
        document.getElementById('phoneWrapper')?.classList.add('error');
        document.getElementById('phoneError')?.classList.add('show');
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
        document.getElementById('fg-phone')?.classList.remove('has-error');
        document.getElementById('phoneWrapper')?.classList.remove('error');
        document.getElementById('phoneError')?.classList.remove('show');
        updatePhoneFull();
    });
    document.getElementById('cgv')?.addEventListener('change', () => clearError('fg-cgv'));
}


// Admin login/logout toggle for manual pricing overrides.
async function toggleAdminMode() {

    // Already authenticated: log out and reset the admin UI.
    if (state.adminMode) {

        await fetch("https://paris-private-backend.onrender.com/logout", {
            method: "POST",
            credentials: "include"
        });

        state.adminMode = false;

        document.getElementById('adminPanel')?.classList.remove('open');
        document.getElementById('adminBar')?.classList.remove('visible');

        document.getElementById('adminToggleBtn').innerHTML =
            '<i class="fa-solid fa-shield-halved"></i> Admin';

        return;
    }

    // Ask for the admin password before opening the override tools.
    const password = prompt("🔐 Mot de passe administrateur");

    if (!password) return;

    try {

        const res = await fetch("https://paris-private-backend.onrender.com/login", {

            method: "POST",

            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (!data.success) {
            alert("❌ Mot de passe incorrect");
            return;
        }

        state.adminMode = true;

        document.getElementById('adminPanel')?.classList.add('open');
        document.getElementById('adminBar')?.classList.add('visible');

        document.getElementById('adminToggleBtn').innerHTML =
            '<i class="fa-solid fa-shield-halved"></i> Quitter Admin';

        document.getElementById('adminPanel')
            ?.scrollIntoView({ behavior:'smooth', block:'center' });

    } catch (err) {

        console.error(err);

        alert("Erreur serveur admin");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("adminToggleBtn");
    const bar = document.getElementById("adminBar");
    const panel = document.getElementById("adminPanel");

    if (btn) {
        btn.addEventListener("click", () => {
            bar.classList.toggle("visible");
            panel.classList.toggle("open");
        });
    }
});


// Send the booking payload to the backend and reset the UI on success.
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById('submitBtn');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Sending...</span>';
    }

    const p = getTotalPrice();

    const outboundNightSurcharge = isNightTime(document.getElementById('time')?.value)
        ? NIGHT_SURCHARGE
        : 0;

    const returnNightSurcharge =
        state.isRoundTrip && isNightTime(document.getElementById('return-time')?.value)
            ? NIGHT_SURCHARGE
            : 0;

    const totalNightSurcharge = outboundNightSurcharge + returnNightSurcharge;
    const subtotalBeforeDiscount =
        (state.isRoundTrip ? p.base * 2 : p.base) + totalNightSurcharge;
    const discountAmount = calcDiscount(subtotalBeforeDiscount);

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

        price: p.total,
        original_price: p.base,

        service_type: document.getElementById('service')?.value || null,
        outbound_night_surcharge: outboundNightSurcharge,
        return_night_surcharge: returnNightSurcharge,
        night_surcharge: totalNightSurcharge,
        discount_amount: discountAmount,

        promo_code: state.promoLabel || null,

        payment_method: document.querySelector('input[name="payment"]:checked')?.value || null,

        trip_type: state.isRoundTrip ? "round_trip" : "one_way",

    };

    try {
        const res = await fetch("https://paris-private-backend.onrender.com/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
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

        document.getElementById('bookingSuccessRef').textContent = data.booking_number;

        const ok = document.getElementById('bookingSuccess');
        ok?.classList.add('show');
        ok?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        e.target.reset();

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

    // Prevent selecting past dates.
    const today = new Date().toISOString().split('T')[0];
    ['date','return-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.min = today;
    });

    // Build the phone country dropdown.
    buildCountryList();

    // Toggle the country dropdown from the flag control.
    document.getElementById('countryFlagDisplay')?.addEventListener('click', e => {
        e.stopPropagation();
        const dd = document.getElementById('countryDropdown');
        if (!dd) return;
        const isOpen = dd.classList.toggle('open');
        if (isOpen) buildCountryList();
    });

    // Close the dropdown when clicking outside the selector.
    document.addEventListener('click', e => {
        const wrapper = document.querySelector('.country-select-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            document.getElementById('countryDropdown')?.classList.remove('open');
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
    document.getElementById('bookingForm')?.addEventListener('submit', handleFormSubmit);

    // Admin mode entry point.
    document.getElementById('adminToggleBtn')?.addEventListener('click', toggleAdminMode);

    // Initial price summary.
    updatePriceSummary();
});
