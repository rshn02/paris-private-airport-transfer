const API_URL = "https://paris-private-backend.onrender.com";

const form = document.getElementById("contactForm");
const successBox = document.getElementById("contactSuccess");
const errorBox = document.getElementById("contactError");
const submitBtn = document.getElementById("contactSubmitBtn");

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

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    hideMessages();

    const data = {
        name: document.getElementById("contact-name").value.trim(),
        email: document.getElementById("contact-email").value.trim(),
        phone: document.getElementById("contact-phone").value.trim(),
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
