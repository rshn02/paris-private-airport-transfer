(function () {
    'use strict';
    const api = window.PPATPhone;
    window.PPATPhoneInput = { create };
    function create(ids) {
        const get = key => document.getElementById(ids[key]);
        const input = get('input'), hidden = get('hidden'), trigger = get('trigger');
        const dropdown = get('dropdown'), list = get('list'), error = get('error');
        const lang = document.documentElement.lang || 'en';
        const french = lang.startsWith('fr');
        const names = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
        let country = 'US';
        let attempted = false;
        const countries = api.getCountries().map(code => ({ code, name: names.of(code),
            dial: '+' + api.getCountryCallingCode(code),
            flag: String.fromCodePoint(...Array.from(code, c => 127397 + c.charCodeAt(0)))
        })).sort((a, b) => a.name.localeCompare(b.name, lang));
        const search = document.createElement('input');
        search.type = 'search'; search.className = 'phone-country-search';
        search.placeholder = french ? 'Pays ou indicatif' : 'Country or calling code';
        search.setAttribute('aria-label', search.placeholder);
        search.setAttribute('aria-controls', ids.list);
        dropdown.prepend(search);
        list.setAttribute('role', 'group');
        list.setAttribute('aria-label', french ? 'Pays' : 'Countries');
        error.setAttribute('aria-live', 'polite');
        input.setAttribute('aria-describedby', ids.error);
        input.setAttribute('inputmode', 'tel');
        input.placeholder = french ? 'Numéro de téléphone' : 'Phone number';
        input.maxLength = 50;
        function display() {
            const selected = countries.find(c => c.code === country);
            get('flag').textContent = selected.flag;
            get('dial').textContent = selected.dial;
            trigger.setAttribute('aria-label', `${selected.name} (${selected.dial})`);
        }
        function sync() {
            hidden.value = api.normalize(input.value, country) || '';
            return hidden.value;
        }
        function validate() {
            attempted = true;
            const valid = Boolean(sync());
            error.textContent = valid ? '' : api.message(lang);
            error.classList.toggle('show', !valid);
            get('group').classList.toggle('has-error', !valid);
            get('wrapper').classList.toggle('error', !valid);
            input.setAttribute('aria-invalid', String(!valid));
            input.setCustomValidity(valid ? '' : api.message(lang));
            return valid;
        }
        function open(value, restore = false) {
            dropdown.classList.toggle('open', value);
            trigger.setAttribute('aria-expanded', String(value));
            if (value) { search.value = ''; render(); search.focus(); }
            if (restore) trigger.focus();
        }
        function render() {
            const query = search.value.toLocaleLowerCase(lang).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            list.replaceChildren();
            for (const c of countries) {
                const haystack = `${c.name} ${c.code} ${c.dial}`.toLocaleLowerCase(lang).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (!haystack.includes(query)) continue;
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'country-option'; button.dataset.country = c.code;
                button.setAttribute('aria-pressed', String(c.code === country));
                for (const [cls, value] of [['flag', c.flag], ['name', c.name], ['code', c.dial]]) {
                    const span = document.createElement('span'); span.className = cls; span.textContent = value; button.append(span);
                }
                button.addEventListener('click', () => {
                    // Keep the national digits when manually switching a full international value.
                    // Never reinterpret the previous calling code as part of the new number.
                    if (input.value.trim().startsWith('+') && c.code !== country) {
                        const parsed = window.libphonenumber.parsePhoneNumberFromString(input.value, { extract: false });
                        if (parsed) input.value = parsed.nationalNumber;
                    }
                    country = c.code; display(); sync();
                    if (attempted) validate();
                    open(false); input.focus();
                });
                list.append(button);
            }
            list.scrollTop = 0;
            if (!list.children.length) {
                const empty = document.createElement('p');
                empty.textContent = french ? 'Aucun pays trouvé.' : 'No countries found.';
                empty.setAttribute('role', 'status'); list.append(empty);
            }
        }
        trigger.addEventListener('click', () => open(!dropdown.classList.contains('open')));
        search.addEventListener('input', render);
        trigger.parentElement.addEventListener('keydown', event => {
            if (event.key === 'Enter' && event.target === search) {
                event.preventDefault(); list.querySelector('button')?.click();
            }
            if (event.key === 'Escape') { event.preventDefault(); open(false, true); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (!dropdown.classList.contains('open')) { open(true); return; }
                const buttons = Array.from(list.querySelectorAll('button'));
                const current = buttons.indexOf(document.activeElement);
                const next = event.key === 'ArrowDown' ? (current + 1) % buttons.length
                    : (current <= 0 ? buttons.length - 1 : current - 1);
                buttons[next]?.focus();
            }
        });
        document.addEventListener('click', event => { if (!trigger.parentElement.contains(event.target)) open(false); });
        trigger.parentElement.addEventListener('focusout', event => {
            // WebKit can blur the search without focusing a tapped country button.
            // Closing here with no focus destination hides the button before click.
            // The outside-click handler still dismisses unfocused/touch destinations.
            if (event.relatedTarget && !trigger.parentElement.contains(event.relatedTarget)) open(false);
        });
        input.addEventListener('input', () => {
            const detected = api.detectCountry(input.value);
            if (detected) { country = detected; display(); }
            sync(); if (attempted) validate();
        });
        input.addEventListener('blur', () => { if (input.value || attempted) validate(); });
        function reset() {
            country = 'US'; attempted = false; hidden.value = ''; display(); open(false);
            input.setCustomValidity(''); input.setAttribute('aria-invalid', 'false');
            error.textContent = ''; error.classList.remove('show');
            get('group').classList.remove('has-error'); get('wrapper').classList.remove('error');
        }
        input.form?.addEventListener('reset', reset);
        reset(); sync();
        return { sync, validate, reset, get country() { return country; } };
    }
})();
