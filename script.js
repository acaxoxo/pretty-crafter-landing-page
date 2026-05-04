document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 0. DARK MODE TOGGLE
    // ============================================
    const darkModeBtn = document.getElementById('darkModeBtn');
    const htmlElement = document.documentElement;

    function updateDarkModeIcons() {
        const isDark = htmlElement.classList.contains('dark');
        const moonIcons = document.querySelectorAll('.moon-icon');
        const sunIcons = document.querySelectorAll('.sun-icon');

        moonIcons.forEach(el => el.style.opacity = isDark ? '0' : '1');
        sunIcons.forEach(el => el.style.opacity = isDark ? '1' : '0');
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
    }

    updateDarkModeIcons();

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            updateDarkModeIcons();

            const isDark = htmlElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // ============================================
    // 1. MOBILE MENU
    // ============================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // ============================================
    // 2. NAVBAR SCROLL & ACTIVE LINK
    // ============================================
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link:not(.cta-button)');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {

        // Shadow navbar
        if (navbar) {
            navbar.classList.toggle('shadow-lg', window.scrollY > 10);
        }

        // Active section
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 200) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-pink-600', 'font-bold');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('text-pink-600', 'font-bold');
            }
        });
    });

    // ============================================
    // 3. SCROLL TO TOP
    // ============================================
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('hidden', window.scrollY <= 300);
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================
    // 4. SMOOTH SCROLL
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================
    // 5. PRODUCT HOVER
    // ============================================
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // ============================================
    // 6. INTERSECTION ANIMATION
    // ============================================
    const animatedCards = document.querySelectorAll('.keunggulan-card');

    if (animatedCards.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedCards.forEach(card => observer.observe(card));
    }

    // ============================================
    // 7. KEYFRAMES
    // ============================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // ============================================
    // 8. TESTIMONIAL ROTATION
    // ============================================
    const testimonialCards = document.querySelectorAll('.testimonial-card');

    if (testimonialCards.length > 0 && window.innerWidth > 768) {
        let index = 0;

        testimonialCards.forEach(card => {
            card.style.opacity = '0.5';
            card.style.transition = 'opacity 0.5s ease';
        });

        testimonialCards[0].style.opacity = '1';

        setInterval(() => {
            testimonialCards.forEach(card => card.style.opacity = '0.5');
            testimonialCards[index].style.opacity = '1';
            index = (index + 1) % testimonialCards.length;
        }, 5000);
    }

    // ============================================
    // 9. TRACK WHATSAPP CLICK
    // ============================================
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', () => {
            console.log('WhatsApp clicked');
        });
    });

    // ============================================
    // 10. IMAGE LAZY EFFECT
    // ============================================
    if ('IntersectionObserver' in window) {
        const imgs = document.querySelectorAll('img');

        const imgObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    obs.unobserve(entry.target);
                }
            });
        });

        imgs.forEach(img => {
            img.style.opacity = '0.8';
            imgObserver.observe(img);
        });
    }

    // ============================================
    // 11. CONSOLE MESSAGE
    // ============================================
    console.log('%c🌸 Pretty Crafter Loaded 🌸', 'color:#d4839a; font-size:18px; font-weight:bold;');

});