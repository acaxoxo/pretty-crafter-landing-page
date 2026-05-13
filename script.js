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
    // 11. CART
    // ============================================
    const cartToggleButtons = document.querySelectorAll('[data-cart-toggle]');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCountBadges = document.querySelectorAll('[data-cart-count]');
    const cartWhatsAppBtn = document.getElementById('cartWhatsAppBtn');
    const cartClearBtn = document.getElementById('cartClearBtn');
    const cartFormDetails = document.querySelector('.cart-form');
    const checkoutName = document.getElementById('checkoutName');
    const checkoutPhone = document.getElementById('checkoutPhone');
    const checkoutAddress = document.getElementById('checkoutAddress');
    const checkoutPayment = document.getElementById('checkoutPayment');
    const checkoutDelivery = document.getElementById('checkoutDelivery');

    const cartStorageKey = 'pretty_crafter_cart';
    const checkoutStorageKey = 'pretty_crafter_checkout';
    const waNumber = '6281237705049';
    const apiBaseUrl = (() => {
        const meta = document.querySelector('meta[name="api-base-url"]');
        const value = meta?.getAttribute('content')?.trim();
        return value || 'http://localhost:3001';
    })();

    const parsePrice = (value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    };

    const formatRupiah = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

    const loadCart = () => {
        try {
            const stored = localStorage.getItem(cartStorageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    };

    const saveCart = () => {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    };

    const loadCheckout = () => {
        try {
            const stored = localStorage.getItem(checkoutStorageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    };

    const saveCheckout = () => {
        const details = getCheckoutDetails();
        localStorage.setItem(checkoutStorageKey, JSON.stringify(details));
    };

    const clearCheckout = () => {
        if (checkoutName) checkoutName.value = '';
        if (checkoutPhone) checkoutPhone.value = '';
        if (checkoutAddress) checkoutAddress.value = '';
        if (checkoutPayment) checkoutPayment.value = '';
        if (checkoutDelivery) checkoutDelivery.value = '';
        localStorage.removeItem(checkoutStorageKey);
    };

    const updateCartCount = () => {
        const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCountBadges.forEach(badge => {
            badge.textContent = totalCount;
        });
    };

    const getCheckoutDetails = () => ({
        name: (checkoutName?.value || '').trim(),
        phone: (checkoutPhone?.value || '').trim(),
        address: (checkoutAddress?.value || '').trim(),
        payment: (checkoutPayment?.value || '').trim(),
        delivery: (checkoutDelivery?.value || '').trim()
    });

    const isCheckoutComplete = () => {
        const details = getCheckoutDetails();
        return details.name && details.phone && details.address && details.payment && details.delivery;
    };

    const buildWhatsAppMessage = () => {
        if (cart.length === 0) {
            return '';
        }

        if (!isCheckoutComplete()) {
            return '';
        }

        const lines = ['Halo Pretty Crafter, saya ingin memesan:'];
        cart.forEach(item => {
            const subtotal = item.price * item.qty;
            lines.push(`- ${item.name} x${item.qty} (${formatRupiah(subtotal)})`);
        });
        lines.push(`Total: ${formatRupiah(getCartTotal())}`);
        const details = getCheckoutDetails();
        lines.push('');
        lines.push('Data pemesan:');
        lines.push(`- Nama: ${details.name}`);
        lines.push(`- No HP: ${details.phone}`);
        lines.push(`- Alamat: ${details.address}`);
        lines.push(`- Metode pembayaran: ${details.payment}`);
        lines.push(`- Pengantaran: ${details.delivery}`);
        lines.push('Terima kasih.');

        return encodeURIComponent(lines.join('\n'));
    };

    const showNotification = (message, type = 'info') => {
        let toast = document.getElementById('apiToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'apiToast';
            toast.style.position = 'fixed';
            toast.style.right = '20px';
            toast.style.bottom = '20px';
            toast.style.zIndex = '9999';
            toast.style.padding = '12px 16px';
            toast.style.borderRadius = '12px';
            toast.style.fontSize = '14px';
            toast.style.color = '#ffffff';
            toast.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            toast.style.maxWidth = '320px';
            document.body.appendChild(toast);
        }

        if (type === 'success') {
            toast.style.background = '#2f855a';
        } else if (type === 'error') {
            toast.style.background = '#c53030';
        } else {
            toast.style.background = '#4a5568';
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        window.clearTimeout(toast._hideTimer);
        toast._hideTimer = window.setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    };

    const buildOrderPayload = () => {
        const customer = getCheckoutDetails();
        const items = cart.map(item => ({
            product_id: item.id,
            qty: item.qty
        }));

        return {
            customer: {
                name: customer.name,
                phone: customer.phone,
                email: '',
                address: customer.address
            },
            items,
            payment_method: customer.payment,
            delivery_method: customer.delivery,
            notes: ''
        };
    };

    const submitOrder = async () => {
        const response = await fetch(`${apiBaseUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildOrderPayload())
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Gagal menyimpan order.');
        }

        return response.json();
    };

    const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const renderCart = () => {
        if (!cartItems || !cartTotal || !cartWhatsAppBtn) {
            return;
        }

        cartItems.innerHTML = '';

        if (cart.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'cart-empty';
            empty.textContent = 'Keranjang masih kosong.';
            cartItems.appendChild(empty);
        } else {
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.dataset.id = item.id;
                itemElement.innerHTML = `
                    <div>
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price">${formatRupiah(item.price)}</span>
                    </div>
                    <div class="cart-item-actions">
                        <button class="cart-qty-btn" type="button" data-action="decrease">-</button>
                        <span class="cart-qty">${item.qty}</span>
                        <button class="cart-qty-btn" type="button" data-action="increase">+</button>
                    </div>
                    <button class="cart-remove" type="button" data-action="remove">Hapus</button>
                `;
                cartItems.appendChild(itemElement);
            });
        }

        cartTotal.textContent = formatRupiah(getCartTotal());
        updateCartCount();

        if (cartFormDetails) {
            cartFormDetails.open = false;
        }

        const message = buildWhatsAppMessage();
        if (message) {
            cartWhatsAppBtn.href = `https://wa.me/${waNumber}?text=${message}`;
            cartWhatsAppBtn.classList.remove('is-disabled');
            cartWhatsAppBtn.setAttribute('aria-disabled', 'false');
        } else {
            cartWhatsAppBtn.href = `https://wa.me/${waNumber}`;
            cartWhatsAppBtn.classList.add('is-disabled');
            cartWhatsAppBtn.setAttribute('aria-disabled', 'true');
        }
    };

    const openCart = () => {
        if (!cartDrawer) {
            return;
        }
        cartDrawer.classList.add('is-open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (cartFormDetails) {
            cartFormDetails.open = false;
        }
    };

    const closeCart = () => {
        if (!cartDrawer) {
            return;
        }
        cartDrawer.classList.remove('is-open');
        cartDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    let cart = loadCart();

    const storedCheckout = loadCheckout();
    if (checkoutName && storedCheckout.name) {
        checkoutName.value = storedCheckout.name;
    }
    if (checkoutPhone && storedCheckout.phone) {
        checkoutPhone.value = storedCheckout.phone;
    }
    if (checkoutAddress && storedCheckout.address) {
        checkoutAddress.value = storedCheckout.address;
    }
    if (checkoutPayment && storedCheckout.payment) {
        checkoutPayment.value = storedCheckout.payment;
    }
    if (checkoutDelivery && storedCheckout.delivery) {
        checkoutDelivery.value = storedCheckout.delivery;
    }
    renderCart();

    cartToggleButtons.forEach(button => {
        button.addEventListener('click', openCart);
    });

    if (cartDrawer) {
        cartDrawer.querySelectorAll('[data-cart-close]').forEach(button => {
            button.addEventListener('click', closeCart);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
            closeCart();
        }
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            if (!card) {
                return;
            }
            const id = card.dataset.productId;
            const name = card.dataset.productName;
            const price = parsePrice(card.dataset.productPrice);

            const existing = cart.find(item => item.id === id);
            if (existing) {
                existing.qty += 1;
            } else {
                cart.push({ id, name, price, qty: 1 });
            }

            saveCart();
            renderCart();
        });
    });

    if (cartItems) {
        cartItems.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) {
                return;
            }
            const cartItem = actionButton.closest('.cart-item');
            if (!cartItem) {
                return;
            }
            const id = cartItem.dataset.id;
            const itemIndex = cart.findIndex(item => item.id === id);
            if (itemIndex === -1) {
                return;
            }

            const action = actionButton.dataset.action;
            if (action === 'increase') {
                cart[itemIndex].qty += 1;
            }

            if (action === 'decrease') {
                cart[itemIndex].qty -= 1;
                if (cart[itemIndex].qty <= 0) {
                    cart.splice(itemIndex, 1);
                }
            }

            if (action === 'remove') {
                cart.splice(itemIndex, 1);
            }

            saveCart();
            renderCart();
        });
    }

    if (cartClearBtn) {
        cartClearBtn.addEventListener('click', () => {
            cart = [];
            saveCart();
            renderCart();
        });
    }

    [checkoutName, checkoutPhone, checkoutAddress, checkoutPayment, checkoutDelivery].forEach(field => {
        if (!field) {
            return;
        }
        field.addEventListener('input', () => {
            saveCheckout();
            renderCart();
        });
        field.addEventListener('change', () => {
            saveCheckout();
            renderCart();
        });
    });

    if (cartWhatsAppBtn) {
        cartWhatsAppBtn.addEventListener('click', async (event) => {
            if (cart.length === 0 || !isCheckoutComplete()) {
                event.preventDefault();
                alert('Lengkapi data diri dan isi keranjang sebelum checkout.');
                return;
            }

            event.preventDefault();

            try {
                await submitOrder();
                showNotification('Order berhasil disimpan. Lanjut ke WhatsApp.', 'success');
                const message = buildWhatsAppMessage();
                cart = [];
                saveCart();
                clearCheckout();
                renderCart();
                const targetUrl = message
                    ? `https://wa.me/${waNumber}?text=${message}`
                    : `https://wa.me/${waNumber}`;
                window.open(targetUrl, '_blank', 'noopener');
            } catch (error) {
                showNotification(error.message || 'Gagal menyimpan order.', 'error');
            }
        });
    }

    // ============================================
    // 12. CUSTOMER CAROUSEL
    // ============================================
    const customerCarousel = document.querySelector('.customer-carousel');

    if (customerCarousel) {
        const track = customerCarousel.querySelector('.customer-track');
        const slides = Array.from(customerCarousel.querySelectorAll('.customer-slide'));
        const dots = Array.from(customerCarousel.querySelectorAll('[data-carousel-dot]'));

        const setActiveSlide = (index) => {
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === index);
            });

            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === index;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        };

        const getClosestSlideIndex = () => {
            if (!track) {
                return 0;
            }
            const trackRect = track.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;
            let closestIndex = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            slides.forEach((slide, index) => {
                const slideRect = slide.getBoundingClientRect();
                const slideCenter = slideRect.left + slideRect.width / 2;
                const distance = Math.abs(trackCenter - slideCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            return closestIndex;
        };

        let isTicking = false;
        if (track) {
            track.addEventListener('scroll', () => {
                if (isTicking) {
                    return;
                }
                isTicking = true;
                window.requestAnimationFrame(() => {
                    setActiveSlide(getClosestSlideIndex());
                    isTicking = false;
                });
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const slide = slides[index];
                if (!slide) {
                    return;
                }
                slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                setActiveSlide(index);
            });
        });

        window.addEventListener('resize', () => {
            setActiveSlide(getClosestSlideIndex());
        });

        window.requestAnimationFrame(() => {
            setActiveSlide(0);
            const firstSlide = slides[0];
            if (firstSlide) {
                firstSlide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        });
    }

    // ============================================
    // 13. CONSOLE MESSAGE
    // ============================================
    console.log('%c🌸 Pretty Crafter Loaded 🌸', 'color:#d4839a; font-size:18px; font-weight:bold;');

});