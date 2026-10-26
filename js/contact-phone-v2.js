const API_URL = "https://paris-private-backend.onrender.com";

const form = document.getElementById("contactForm");
const successBox = document.getElementById("contactSuccess");
const errorBox = document.getElementById("contactError");
const submitBtn = document.getElementById("contactSubmitBtn");
const CONTACT_FORM_VERSION = "contact_main_v1";

let contactFormStartedTracked = false;
let contactSubmitSuccessTracked = false;

function contactPagePath() {
    return window.PPATMarketing?.publicPath?.(window.location.pathname)
        || window.location.pathname.replace(/\.html$/i, '')
        || '/';
}

function trackContactEvent(name, params = {}) {
    const eventParams = {
        page_path: contactPagePath(),
        form_version: CONTACT_FORM_VERSION,
        ...params
    };

    if (window.PPATMarketing?.trackEvent) {
        return window.PPATMarketing.trackEvent(name, eventParams);
    }

    return false;
}

function trackContactFormStart() {
    if (contactFormStartedTracked) return;
    contactFormStartedTracked = trackContactEvent("contact_form_start");
}

function trackContactSubmitSuccess() {
    if (contactSubmitSuccessTracked) return;
    contactSubmitSuccessTracked = trackContactEvent("contact_submit_success", { success: true });
}

const contactPhone = window.PPATPhoneInput.create({
    input: 'contact-phone', hidden: 'contact-phone-full', trigger: 'contactCountryFlagDisplay',
    dropdown: 'contactCountryDropdown', list: 'contactCountryList', flag: 'contactSelectedFlag',
    dial: 'contactSelectedDial', error: 'contactPhoneError', group: 'contact-fg-phone', wrapper: 'contactPhoneWrapper'
});

// Prefill the existing form for dedicated service landing pages without
// changing its submission payload or backend integration.
const contactParams = new URLSearchParams(window.location.search);
const requestedContactService = contactParams.get("service") || "";
const contactService = /^[a-z0-9_-]+$/i.test(requestedContactService)
    ? requestedContactService.toLowerCase()
    : "";
if (contactParams.get("service") === "normandy") {
    const subjectField = document.getElementById("contact-subject");
    const messageField = document.getElementById("contact-message");

    if (subjectField) subjectField.value = "quote";
    if (messageField && !messageField.value) {
        messageField.value = "Hello, I would like to request a quote for a Paris to Normandy Private Chauffeur journey.\n\nDate:\nNumber of passengers:\nPickup location:\nDesired destinations or stops:\nOne-way, round trip or day trip:";
    }
} else if (contactParams.get("service") === "champagne") {
    const subjectField = document.getElementById("contact-subject");
    const messageField = document.getElementById("contact-message");

    if (subjectField) subjectField.value = "quote";
    if (messageField && !messageField.value) {
        messageField.value = "Hello, I would like to request a quote for a Paris to Champagne Private Chauffeur journey.\n\nDate:\nNumber of passengers:\nPickup location:\nDesired destinations or stops:\nOne-way, round trip or day trip:";
    }
} else if (contactParams.get("service") === "loire-valley") {
    const subjectField = document.getElementById("contact-subject");
    const messageField = document.getElementById("contact-message");

    if (subjectField) subjectField.value = "quote";
    if (messageField && !messageField.value) {
        messageField.value = "Hello, I would like to request a quote for a Paris to Loire Valley Private Chauffeur journey.\n\nDate:\nNumber of passengers:\nPickup location:\nChâteaux or destinations:\nOne-way, round trip or day trip:";
    }
}

function updateContactPhoneFull() { contactPhone.sync(); }

// Validate the visible fields before building the request (the dial code is not a number).
function isValidContactEmail(value) {
    if (typeof value !== "string" || value.length > 254) return false;
    const parts = value.split("@");
    return parts.length === 2
        && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i.test(parts[0])
        && parts[0].length <= 64
        && parts[1].includes(".")
        && parts[1].split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}


const contactRequiredMessages = {
    "contact-name": "Please enter your full name.",
    "contact-email": "Please enter a valid email address.",
    "contact-phone": "Please enter your phone number.",
    "contact-subject": "Please select a subject.",
    "contact-message": "Please enter your message."
};

function validateContactField(field) {
    if (field.id === "contact-phone") return contactPhone.validate();
    const value = typeof field.value === "string" ? field.value.trim() : "";
    let message = value ? "" : contactRequiredMessages[field.id];
    if (field.id === "contact-email" && !isValidContactEmail(value)) {
        message = contactRequiredMessages[field.id];
    }

    const group = field.closest(".form-group");
    let error = group.querySelector(".field-error");
    if (!error) {
        error = document.createElement("div");
        error.className = "field-error";
        error.id = `${field.id}-error`;
        group.appendChild(error);
    }
    error.textContent = message || "";
    error.classList.toggle("show", Boolean(message));
    error.setAttribute("aria-live", "polite");
    field.setAttribute("aria-describedby", error.id);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    field.setCustomValidity(message || "");
    group.classList.toggle("has-error", Boolean(message));
    if (field.id === "contact-phone") {
        document.getElementById("contactPhoneWrapper").classList.toggle("error", Boolean(message));
    }
    return !message;
}

function validateContactForm() {
    updateContactPhoneFull();
    let firstInvalid = null;
    Object.keys(contactRequiredMessages).forEach(id => {
        const field = document.getElementById(id);
        if (!validateContactField(field) && !firstInvalid) firstInvalid = field;
    });
    firstInvalid?.focus();
    return !firstInvalid;
}

Object.keys(contactRequiredMessages).forEach(id => {
    const field = document.getElementById(id);
    ["input", "change"].forEach(event => field.addEventListener(event, () => {
        updateContactPhoneFull();
        if (field.getAttribute("aria-invalid") === "true") validateContactField(field);
    }));
});

function showSuccess(message) {
    successBox.textContent = message;
    successBox.style.display = "block";
    errorBox.style.display = "none";
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
    successBox.style.display = "none";
}

function hideMessages() {
    successBox.style.display = "none";
    errorBox.style.display = "none";
}

updateContactPhoneFull();

// Track only a real edit of a customer-visible field, never focus or prefill.
for (const type of ["input", "change"]) {
    form?.addEventListener(type, event => {
        if (event.isTrusted && Object.hasOwn(contactRequiredMessages, event.target?.id)) {
            trackContactFormStart();
        }
    });
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (submitBtn.disabled) return;
    hideMessages();
    if (!validateContactForm()) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
        return;
    }

    const data = {
        name: document.getElementById("contact-name").value.trim(),
        email: document.getElementById("contact-email").value.trim(),
        phone: document.getElementById("contact-phone-full").value,
        phone_country: contactPhone.country,
        language: document.documentElement.lang || "en",
        subject: document.getElementById("contact-subject").value.trim(),
        message: document.getElementById("contact-message").value.trim(),
        website: document.getElementById("contact-website").value.trim(),
        service: contactService,
        marketing_attribution: window.PPATMarketing?.getAttribution?.() || null
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {

        const response = await fetch(`${API_URL}/api/contact`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                ...await window.PPATEmailOperations.headers("contact", data)
            },

            body: JSON.stringify(data)

        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || result.message || "Message could not be sent.");
        }

        window.PPATEmailOperations.complete("contact");
        if (!data.website) trackContactSubmitSuccess();

        showSuccess(
            "Your message has been sent successfully. We will contact you shortly."
        );

        form.reset();

    } catch (err) {

        console.error(err);

        showError(
            err.message || "An unexpected error occurred."
        );

    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";

});
