// ============================================================================
// Main site interactions shared across the public pages.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile navigation toggle.
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Keep the menu icon aligned with the current open state.
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.textContent = '✕';
            } else {
                mobileMenuBtn.textContent = '☰';
            }
        });

        // Close the mobile menu after navigation.
        const menuLinks = navLinks.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            });
        });
    }

    // Add a compact navbar style after a small scroll offset.
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth-scroll in-page anchor links while accounting for the fixed navbar.
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#' && href.length > 1) {
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    const navHeight = navbar.offsetHeight;
                    const targetPosition = targetElement.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Prevent selecting a past date when a booking date field is present.
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Legacy calculator support for pages still using the old field set.
    const calcService = document.getElementById('calc-service');
    const calcVehicle = document.getElementById('calc-vehicle');
    const calcOptions = document.querySelectorAll('.calc-option');
    const calcPrice = document.getElementById('calcPrice');

    function updatePrice() {
        if (!calcService || !calcVehicle || !calcPrice) return;
        
        let total = parseInt(calcService.value) + parseInt(calcVehicle.value);
        
        calcOptions.forEach(option => {
            if (option.checked) {
                total += parseInt(option.value);
            }
        });
        
        calcPrice.textContent = total + '€';
    }

    if (calcService) calcService.addEventListener('change', updatePrice);
    if (calcVehicle) calcVehicle.addEventListener('change', updatePrice);
    calcOptions.forEach(option => {
        option.addEventListener('change', updatePrice);
    });



    // Lightweight contact form feedback for static pages.
    const contactForm = document.getElementById('contactForm');
    const contactSuccess = document.getElementById('contactSuccess');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show inline success feedback without leaving the page.
            if (contactSuccess) {
                contactSuccess.classList.add('show');
                contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Reset the form after a successful submission.
                contactForm.reset();
                
                // Auto-hide the success message after a short delay.
                setTimeout(function() {
                    contactSuccess.classList.remove('show');
                }, 5000);
            }
            
            // Placeholder until the contact form is fully wired to the backend.
            console.log('Contact form submitted');
        });
    }

    // Lazy-load images only when they enter the viewport.
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    // Trigger reveal animations only once when elements become visible.
    const animateOnScroll = document.querySelectorAll('.animate-on-scroll');
    
    if (animateOnScroll.length > 0 && 'IntersectionObserver' in window) {
        const scrollObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    scrollObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        animateOnScroll.forEach(function(element) {
            scrollObserver.observe(element);
        });
    }

});

// ============================================================================
// Shared helpers
// ============================================================================

// Normalize phone input to a French international format when possible.
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('33')) {
        value = '+' + value;
    } else if (value.startsWith('0')) {
        value = '+33' + value.substring(1);
    }
    return value;
}

// Minimal email format validation for client-side checks.
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Preserve CommonJS compatibility for test or tooling usage.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPhoneNumber,
        isValidEmail
    };
}
