// ============================================================================
// Form handlers backed by EmailJS for legacy contact and booking flows.
// ============================================================================

// Shared DOM helpers for inline feedback and button state management.

emailjs.init(EMAILJS_PUBLIC_KEY);

function showElement(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}
function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Sending…</span>';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<span>🎫 Confirm My Booking</span>';
    }
}

// Build a compact seat summary for the legacy booking email template.
function getCheckedOptions() {
    const baby = document.getElementById('baby-seat-input').value;
    const child = document.getElementById('child-seat-input').value;

    return `Baby seat: ${baby}, Child seat: ${child}`;
}

// Legacy booking form submission through EmailJS.
const bookingForm = document.getElementById('bookingForm');
const submitBtn   = document.getElementById('submitBtn');

if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        hideElement('bookingError');
        setButtonLoading(submitBtn, true);

        // Read the selected payment method, or keep a readable fallback.
        const paymentRadio = bookingForm.querySelector('input[name="payment"]:checked');
        const payment = paymentRadio ? paymentRadio.value : 'Not specified';

        // Collect the fields expected by the EmailJS booking template.
        const templateParams = {
            // Customer info
            client_name:    document.getElementById('name').value.trim(),
            client_email:   document.getElementById('email').value.trim(),
            client_phone:   document.getElementById('phone').value.trim(),
            client_company: document.getElementById('company').value.trim() || 'Not provided',

            // Trip
            service:        document.getElementById('service').value,
            pickup:         document.getElementById('pickup').value.trim(),
            destination:    document.getElementById('destination').value.trim(),
            date:           document.getElementById('date').value,
            time:           document.getElementById('time').value,
            passengers:     document.getElementById('passengers').value,
            luggage:        document.getElementById('luggage').value,
            vehicle_type:   document.getElementById('vehicle-type').value,

            // Flight
            flight:         document.getElementById('flight').value.trim() || 'Not provided',
            terminal:       document.getElementById('terminal').value.trim() || 'Not provided',

            // Options & notes
            options:        getCheckedOptions(bookingForm),
            notes:          document.getElementById('notes').value.trim() || 'None',
            payment:        payment,

            // Meta
            reply_to:       document.getElementById('email').value.trim(),
            to_name:        document.getElementById('name').value.trim(),
        };

        try {
            // The EmailJS template is responsible for both customer and admin notifications.
           await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_1,
            templateParams
            );

            // Show success feedback locally once EmailJS accepts the request.
            showElement('bookingSuccess');
            bookingForm.reset();

            // Auto-hide the success state after a short delay.
            setTimeout(() => hideElement('bookingSuccess'), 10000);

        } catch (error) {
            console.error('EmailJS error:', error);
            showElement('bookingError');
        } finally {
            setButtonLoading(submitBtn, false);
        }
        const input = document.querySelector("#telephone");

    });
}

// Contact form submission through EmailJS.
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const contactSubmitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (contactSubmitBtn) {
            contactSubmitBtn.disabled = true;
            contactSubmitBtn.textContent = 'Sending…';
        }

        const templateParams = {
            client_name:    document.getElementById('contact-name').value.trim(),
            client_email:   document.getElementById('contact-email').value.trim(),
            client_phone:   document.getElementById('phone-number').value.trim(),
            subject:        document.getElementById('contact-subject').value,
            message:        document.getElementById('contact-message').value.trim(),
            reply_to:       document.getElementById('contact-email').value.trim(),
            to_name:        document.getElementById('contact-name').value.trim(),
        };

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_CONTACT,
                templateParams
            );

            showElement('contactSuccess');
            contactForm.reset();
            setTimeout(() => hideElement('contactSuccess'), 10000);

        } catch (error) {
            console.error('EmailJS error:', error);
            alert('An error occurred. Please contact us directly by phone or email.');
        } finally {
            if (contactSubmitBtn) {
                contactSubmitBtn.disabled = false;
                contactSubmitBtn.textContent = 'Send Message';
            }
        }
    });
}

