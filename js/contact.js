const API_URL = "https://paris-private-backend.onrender.com";

const form = document.getElementById("contactForm");
const successBox = document.getElementById("contactSuccess");
const errorBox = document.getElementById("contactError");
const submitBtn = document.getElementById("contactSubmitBtn");

const COUNTRIES = [
    { flag: "🇫🇷", name: "France", dial: "+33" },
    { flag: "🇧🇪", name: "Belgique", dial: "+32" },
    { flag: "🇨🇭", name: "Suisse", dial: "+41" },
    { flag: "🇱🇺", name: "Luxembourg", dial: "+352" },
    { flag: "🇩🇪", name: "Allemagne", dial: "+49" },
    { flag: "🇮🇹", name: "Italie", dial: "+39" },
    { flag: "🇪🇸", name: "Espagne", dial: "+34" },
    { flag: "🇵🇹", name: "Portugal", dial: "+351" },
    { flag: "🇳🇱", name: "Pays-Bas", dial: "+31" },
    { flag: "🇬🇧", name: "Royaume-Uni", dial: "+44" },
    { flag: "🇮🇪", name: "Irlande", dial: "+353" },
    { flag: "🇵🇱", name: "Pologne", dial: "+48" },
    { flag: "🇦🇹", name: "Autriche", dial: "+43" },
    { flag: "🇩🇰", name: "Danemark", dial: "+45" },
    { flag: "🇸🇪", name: "Suède", dial: "+46" },
    { flag: "🇳🇴", name: "Norvège", dial: "+47" },
    { flag: "🇺🇸", name: "États-Unis", dial: "+1" },
    { flag: "🇨🇦", name: "Canada", dial: "+1" },
    { flag: "🇦🇺", name: "Australie", dial: "+61" },
    { flag: "🇯🇵", name: "Japon", dial: "+81" },
    { flag: "🇨🇳", name: "Chine", dial: "+86" },
    { flag: "🇮🇳", name: "Inde", dial: "+91" },
    { flag: "🇧🇷", name: "Brésil", dial: "+55" },
    { flag: "🇲🇦", name: "Maroc", dial: "+212" },
    { flag: "🇩🇿", name: "Algérie", dial: "+213" },
    { flag: "🇹🇳", name: "Tunisie", dial: "+216" },
    { flag: "🇸🇦", name: "Arabie Saoudite", dial: "+966" },
    { flag: "🇦🇪", name: "Émirats Arabes", dial: "+971" },
    { flag: "🇶🇦", name: "Qatar", dial: "+974" },
    { flag: "🇨🇲", name: "Cameroun", dial: "+237" },
    { flag: "🇸🇳", name: "Sénégal", dial: "+221" },
    { flag: "🇨🇮", name: "Côte d'Ivoire", dial: "+225" },
    { flag: "🇬🇭", name: "Ghana", dial: "+233" },
    { flag: "🇿🇦", name: "Afrique du Sud", dial: "+27" }
];

let selectedCountry = COUNTRIES[0];

function updateContactPhoneFull() {
    const rawNumber = document.getElementById("contact-phone")?.value.trim() || "";
    const normalizedNumber = rawNumber.replace(/^0/, "");
    const hiddenInput = document.getElementById("contact-phone-full");

    if (hiddenInput) {
        hiddenInput.value = `${selectedCountry.dial}${normalizedNumber}`;
    }
}

function buildContactCountryList() {
    const list = document.getElementById("contactCountryList");
    if (!list) return;

    list.innerHTML = COUNTRIES.map((country, index) => `
        <div class="country-option" data-index="${index}">
            <span class="flag">${country.flag}</span>
            <span class="name">${country.name}</span>
            <span class="code">${country.dial}</span>
        </div>
    `).join("");

    list.querySelectorAll(".country-option").forEach((option) => {
        option.addEventListener("click", () => {
            const index = Number(option.dataset.index);
            selectedCountry = COUNTRIES[index];
            document.getElementById("contactSelectedFlag").textContent = selectedCountry.flag;
            document.getElementById("contactSelectedDial").textContent = selectedCountry.dial;
            document.getElementById("contactCountryDropdown")?.classList.remove("open");
            updateContactPhoneFull();
        });
    });
}

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

buildContactCountryList();
updateContactPhoneFull();

document.getElementById("contactCountryFlagDisplay")?.addEventListener("click", (event) => {
    event.stopPropagation();
    document.getElementById("contactCountryDropdown")?.classList.toggle("open");
});

document.addEventListener("click", (event) => {
    const wrapper = document.querySelector("#contactPhoneWrapper .country-select-wrapper");
    if (wrapper && !wrapper.contains(event.target)) {
        document.getElementById("contactCountryDropdown")?.classList.remove("open");
    }
});

document.getElementById("contact-phone")?.addEventListener("input", updateContactPhoneFull);

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    hideMessages();

    const data = {
        name: document.getElementById("contact-name").value.trim(),
        email: document.getElementById("contact-email").value.trim(),
        phone: document.getElementById("contact-phone-full").value.trim() || document.getElementById("contact-phone").value.trim(),
        subject: document.getElementById("contact-subject").value,
        message: document.getElementById("contact-message").value.trim(),
        website: document.getElementById("contact-website").value
    };

    if (
        !data.name ||
        !data.email ||
        !data.phone ||
        !data.subject ||
        !data.message
    ) {
        showError("Please complete all required fields.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {

        const response = await fetch(`${API_URL}/api/contact`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

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
