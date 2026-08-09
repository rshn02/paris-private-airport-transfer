const API_URL = "https://paris-private-backend.onrender.com";

const form = document.getElementById("contactForm");
const successBox = document.getElementById("contactSuccess");
const errorBox = document.getElementById("contactError");
const submitBtn = document.getElementById("contactSubmitBtn");

const COUNTRIES = [
    { flag: "🇫🇷", name: "France", dial: "+33" },
    { flag: "🇧🇪", name: "Belgium", dial: "+32" },
    { flag: "🇨🇭", name: "Switzerland", dial: "+41" },
    { flag: "🇱🇺", name: "Luxembourg", dial: "+352" },
    { flag: "🇩🇪", name: "Germany", dial: "+49" },
    { flag: "🇮🇹", name: "Italy", dial: "+39" },
    { flag: "🇪🇸", name: "Spain", dial: "+34" },
    { flag: "🇵🇹", name: "Portugal", dial: "+351" },
    { flag: "🇳🇱", name: "Netherlands", dial: "+31" },
    { flag: "🇬🇧", name: "United Kingdom", dial: "+44" },
    { flag: "🇮🇪", name: "Ireland", dial: "+353" },
    { flag: "🇵🇱", name: "Poland", dial: "+48" },
    { flag: "🇦🇹", name: "Austria", dial: "+43" },
    { flag: "🇩🇰", name: "Denmark", dial: "+45" },
    { flag: "🇸🇪", name: "Sweden", dial: "+46" },
    { flag: "🇳🇴", name: "Norway", dial: "+47" },
    { flag: "🇺🇸", name: "United States", dial: "+1" },
    { flag: "🇨🇦", name: "Canada", dial: "+1" },
    { flag: "🇲🇽", name: "Mexico", dial: "+52" },
    { flag: "🇦🇺", name: "Australia", dial: "+61" },
    { flag: "🇯🇵", name: "Japan", dial: "+81" },
    { flag: "🇨🇳", name: "China", dial: "+86" },
    { flag: "🇮🇳", name: "India", dial: "+91" },
    { flag: "🇸🇬", name: "Singapore", dial: "+65" },
    { flag: "🇭🇰", name: "Hong Kong", dial: "+852" },
    { flag: "🇰🇷", name: "South Korea", dial: "+82" },
    { flag: "🇳🇿", name: "New Zealand", dial: "+64" },
    { flag: "🇧🇷", name: "Brazil", dial: "+55" },
    { flag: "🇦🇷", name: "Argentina", dial: "+54" },
    { flag: "🇨🇱", name: "Chile", dial: "+56" },
    { flag: "🇨🇴", name: "Colombia", dial: "+57" },
    { flag: "🇲🇦", name: "Morocco", dial: "+212" },
    { flag: "🇩🇿", name: "Algeria", dial: "+213" },
    { flag: "🇹🇳", name: "Tunisia", dial: "+216" },
    { flag: "🇪🇬", name: "Egypt", dial: "+20" },
    { flag: "🇹🇷", name: "Turkey", dial: "+90" },
    { flag: "🇸🇦", name: "Saudi Arabia", dial: "+966" },
    { flag: "🇦🇪", name: "United Arab Emirates", dial: "+971" },
    { flag: "🇶🇦", name: "Qatar", dial: "+974" },
    { flag: "🇨🇲", name: "Cameroon", dial: "+237" },
    { flag: "🇸🇳", name: "Senegal", dial: "+221" },
    { flag: "🇨🇮", name: "Ivory Coast", dial: "+225" },
    { flag: "🇬🇭", name: "Ghana", dial: "+233" },
    { flag: "🇳🇬", name: "Nigeria", dial: "+234" },
    { flag: "🇰🇪", name: "Kenya", dial: "+254" },
    { flag: "🇿🇦", name: "South Africa", dial: "+27" }
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
