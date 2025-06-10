// js/client.js - Логіка клієнтської частини без резервації

/**
 * Головний клас для управління клієнтською частиною
 */
class RestaurantClient {
    constructor() {
        this.currentMenuCategory = 'all';
        this.selectedRating = 0;
        this.isLoading = false;
        this.init();
    }

    /**
     * Ініціалізація
     */
    async init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupScrollAnimations();
        this.setupMobileMenu();
        await this.loadInitialData();
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Фільтри меню
        const menuFilters = document.querySelectorAll('.menu-filters .btn');
        menuFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.target.dataset.category;
                if (category) {
                    this.filterMenu(category);
                    this.updateActiveFilter(e.target);
                }
            });
        });

        // Рейтинг зірок
        this.setupRatingStars();

        // Форма відгуків
        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFeedbackSubmit();
            });
        }

        // Обробка скролу для анімацій
        window.addEventListener('scroll', debounce(() => {
            this.handleScroll();
        }, 10));

        // Обробка зміни розміру вікна
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Налаштування рейтингу зірок
     */
    setupRatingStars() {
        const stars = document.querySelectorAll('.rating-stars .star');
        const ratingContainer = document.querySelector('.rating-stars');

        if (!stars.length) return;

        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });

            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(rating);
                this.updateRatingText(rating);
            });
        });

        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', () => {
                this.highlightStars(this.selectedRating);
                this.updateRatingText(this.selectedRating);
            });
        }
    }

    /**
     * Налаштування плавної прокрутки
     */
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80;

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Налаштування анімацій при скролі
     */
    setupScrollAnimations() {
        this.observeElements();
    }

    /**
     * Спостереження за елементами для анімацій
     */
    observeElements() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    const delay = Math.random() * 200;
                    setTimeout(() => {
                        entry.target.style.animationDelay = '0s';
                    }, delay);
                }
            });
        }, options);

        const elementsToObserve = document.querySelectorAll(
            '.menu-item, .feedback-item, .contact-card, .card'
        );

        elementsToObserve.forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Налаштування мобільного меню
     */
    setupMobileMenu() {
        let toggleButton = document.querySelector('.navbar-toggle');

        if (!toggleButton) {
            const navbar = document.querySelector('.navbar .container');
            if (navbar && window.innerWidth <= 768) {
                toggleButton = document.createElement('button');
                toggleButton.className = 'navbar-toggle';
                toggleButton.innerHTML = '☰';
                toggleButton.style.cssText = `
                    display: block;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--gray-700);
                    padding: 0.5rem;
                `;
                navbar.appendChild(toggleButton);
            }
        }

        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const navbarNav = document.querySelector('.navbar-nav');
                if (navbarNav && navbarNav.classList.contains('show')) {
                    navbarNav.classList.remove('show');
                }
            });
        });
    }

    /**
     * Перемикання мобільного меню
     */
    toggleMobileMenu() {
        const navbarNav = document.querySelector('.navbar-nav');
        const toggleButton = document.querySelector('.navbar-toggle');

        if (navbarNav) {
            navbarNav.classList.toggle('show');

            if (toggleButton) {
                toggleButton.classList.toggle('active');
            }
        }
    }

    /**
     * Завантаження початкових даних
     */
    async loadInitialData() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            showLoading('Завантаження даних ресторану...');

            await this.loadMenu();
            await this.loadFeedback();
            await this.loadFeedbackStats();

            hideLoading();
            this.isLoading = false;

            this.showWelcomeMessage();
        } catch (error) {
            hideLoading();
            this.isLoading = false;
            console.error('Помилка завантаження даних:', error);
            showAlert('Помилка завантаження даних. Деякі функції можуть бути недоступні.', 'warning');
        }
    }

    /**
     * Показати вітальне повідомлення
     */
    showWelcomeMessage() {
        setTimeout(() => {
            showAlert('Ласкаво просимо до ресторану "Смачна кухня"! 🍽️', 'success', 4000);
        }, 500);
    }

    /**
     * Завантаження меню
     */
    async loadMenu() {
        try {
            const response = await API.Menu.getAvailable();

            if (response.success && response.data) {
                this.renderMenu(response.data);
                console.log(`Завантажено ${response.data.length} страв`);
            } else {
                throw new Error('Не вдалося завантажити меню');
            }
        } catch (error) {
            console.error('Помилка завантаження меню:', error);
            this.renderMenuError();
        }
    }

    /**
     * Відображення меню
     */
    renderMenu(menuItems) {
        const container = document.getElementById('menu-container');
        if (!container) return;

        if (!menuItems || menuItems.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('меню', 'Меню тимчасово недоступне');
            return;
        }

        container.innerHTML = menuItems.map((item, index) => `
            <div class="menu-item" 
                 data-category="${item.category}" 
                 style="animation-delay: ${index * 100}ms">
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
                    <div class="menu-item-price">${formatCurrency(item.price)}</div>
                </div>
                ${item.description ? `
                    <div class="menu-item-description">${escapeHtml(item.description)}</div>
                ` : ''}
                <div class="menu-item-footer">
                    <div class="menu-item-time">${item.cooking_time || 0} хв</div>
                    <div class="menu-item-${item.is_available ? 'available' : 'unavailable'}">
                        ${item.is_available ? '✅ Доступно' : '❌ Недоступно'}
                    </div>
                </div>
            </div>
        `).join('');

        this.animateMenuItems();
    }

    /**
     * Анімація появи елементів меню
     */
    animateMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('fade-in');
            }, index * 100);
        });
    }

    /**
     * Відображення помилки меню
     */
    renderMenuError() {
        const container = document.getElementById('menu-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state col-12">
                    <h3>😔 Помилка завантаження меню</h3>
                    <p>Не вдалося завантажити меню. Спробуйте оновити сторінку.</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        🔄 Оновити сторінку
                    </button>
                </div>
            `;
        }
    }

    /**
     * Фільтрування меню за категорією
     */
    filterMenu(category) {
        this.currentMenuCategory = category;
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach((item, index) => {
            const itemCategory = item.dataset.category;
            const shouldShow = category === 'all' || itemCategory === category;

            if (shouldShow) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.classList.add('fade-in');
                }, index * 50);
            } else {
                item.classList.remove('fade-in');
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });

        this.updateMenuItemsCount(category);
    }

    /**
     * Оновлення лічількa страв
     */
    updateMenuItemsCount(category) {
        const visibleItems = document.querySelectorAll('.menu-item[style*="block"], .menu-item:not([style])');
        const count = category === 'all' ?
            document.querySelectorAll('.menu-item').length :
            visibleItems.length;

        console.log(`Показано страв: ${count}`);
    }

    /**
     * Оновлення активного фільтра
     */
    updateActiveFilter(activeButton) {
        document.querySelectorAll('.menu-filters .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');

        activeButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            activeButton.style.transform = '';
        }, 150);
    }

    /**
     * Встановлення рейтингу
     */
    setRating(rating) {
        this.selectedRating = rating;
        const ratingInput = document.getElementById('rating');
        if (ratingInput) {
            ratingInput.value = rating;
        }
        this.highlightStars(rating);
        this.updateRatingText(rating);

        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.animation = 'bounce 0.3s ease';
                setTimeout(() => {
                    star.style.animation = '';
                }, 300);
            }
        });
    }

    /**
     * Підсвічування зірок
     */
    highlightStars(rating) {
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Оновлення тексту рейтингу
     */
    updateRatingText(rating) {
        const ratingText = document.querySelector('.rating-text');
        if (ratingText) {
            const texts = {
                0: 'Оберіть оцінку',
                1: 'Погано 😞',
                2: 'Незадовільно 😐',
                3: 'Нормально 🙂',
                4: 'Добре 😊',
                5: 'Відмінно! 🤩'
            };
            ratingText.textContent = texts[rating] || texts[0];
        }
    }

    /**
     * Скидання рейтингу
     */
    resetRating() {
        this.selectedRating = 0;
        this.highlightStars(0);
        this.updateRatingText(0);
        const ratingInput = document.getElementById('rating');
        if (ratingInput) {
            ratingInput.value = '';
        }
    }

    /**
     * Обробка подання відгуку
     */
    async handleFeedbackSubmit() {
        if (!this.validateFeedbackForm()) {
            return;
        }

        try {
            showLoading('Відправка відгуку...');

            const formData = getFormData('feedback-form');
            formData.rating = this.selectedRating;
            formData.feedback_date = new Date().toISOString().split('T')[0];

            const response = await API.Feedback.create(formData);

            hideLoading();

            if (response.success) {
                showAlert('🙏 Дякуємо за ваш відгук! Він допоможе нам стати кращими.', 'success', 6000);
                clearForm('feedback-form');
                this.resetRating();

                await this.loadFeedback();
                await this.loadFeedbackStats();
            }
        } catch (error) {
            hideLoading();
            console.error('Помилка відправки відгуку:', error);
            showAlert('❌ Помилка відправки відгуку: ' + error.message, 'danger');
        }
    }

    /**
     * Валідація форми відгуку
     */
    validateFeedbackForm() {
        if (!this.selectedRating) {
            showAlert('⭐ Будь ласка, оберіть оцінку', 'warning');
            document.querySelector('.rating-stars').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            return false;
        }

        return true;
    }

    /**
     * Завантаження відгуків
     */
    async loadFeedback() {
        try {
            const response = await API.Feedback.getPublished();

            if (response.success && response.data) {
                this.renderFeedback(response.data);
                console.log(`Завантажено ${response.data.length} відгуків`);
            }
        } catch (error) {
            console.error('Помилка завантаження відгуків:', error);
            this.renderFeedbackError();
        }
    }

    /**
     * Відображення відгуків
     */
    renderFeedback(feedbacks) {
        const container = document.getElementById('feedback-container');
        if (!container) return;

        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('відгуки', 'Поки що немає відгуків', 'Будьте першим, хто залишить відгук! ⭐');
            return;
        }

        container.innerHTML = feedbacks.map((feedback, index) => `
            <div class="feedback-item" style="animation-delay: ${index * 150}ms">
                <div class="feedback-header">
                    <div class="feedback-author">${escapeHtml(feedback.customer_name || 'Анонім')}</div>
                    <div class="feedback-date">${formatDate(feedback.feedback_date)}</div>
                </div>
                <div class="feedback-rating">
                    <div class="stars">${'⭐'.repeat(feedback.rating)}</div>
                </div>
                ${feedback.comments ? `
                    <div class="feedback-comments">"${escapeHtml(feedback.comments)}"</div>
                ` : ''}
            </div>
        `).join('');

        this.animateFeedbackItems();
    }

    /**
     * Анімація появи відгуків
     */
    animateFeedbackItems() {
        const feedbackItems = document.querySelectorAll('.feedback-item');
        feedbackItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('fade-in');
            }, index * 150);
        });
    }

    /**
     * Відображення помилки відгуків
     */
    renderFeedbackError() {
        const container = document.getElementById('feedback-container');
        if (container) {
            container.innerHTML = this.getEmptyStateHTML('відгуки', 'Помилка завантаження відгуків');
        }
    }

    /**
     * Завантаження статистики відгуків
     */
    async loadFeedbackStats() {
        try {
            const response = await API.Feedback.getStats();

            if (response.success && response.data) {
                this.renderFeedbackStats(response.data);
            }
        } catch (error) {
            console.error('Помилка завантаження статистики:', error);
        }
    }

    /**
     * Відображення статистики відгуків
     */
    renderFeedbackStats(stats) {
        const container = document.getElementById('feedback-stats');
        if (!container || !stats) return;

        const avgRating = parseFloat(stats.avg_rating) || 0;
        const totalCount = parseInt(stats.total_count) || 0;

        container.innerHTML = `
            <div class="avg-rating">
                <div class="avg-rating-value">${avgRating.toFixed(1)}</div>
                <div class="avg-rating-stars">${'⭐'.repeat(Math.round(avgRating))}</div>
                <div class="text-muted">Середня оцінка з ${totalCount} відгуків</div>
            </div>
            
            ${totalCount > 0 ? `
                <div class="stats-breakdown">
                    ${[5, 4, 3, 2, 1].map(rating => `
                        <div class="stats-item">
                            <div class="stats-label">
                                <span>${'⭐'.repeat(rating)}</span>
                            </div>
                            <div class="stats-value">${stats[`rating_${rating}`] || 0}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Генерація HTML для порожнього стану
     */
    getEmptyStateHTML(type, title, subtitle = '') {
        const icons = {
            'меню': '🍽️',
            'відгуки': '💬',
            'контакти': '📞'
        };

        return `
            <div class="empty-state">
                <div style="font-size: 4rem; margin-bottom: 1rem;">${icons[type] || '📋'}</div>
                <h3>${title}</h3>
                ${subtitle ? `<p>${subtitle}</p>` : ''}
            </div>
        `;
    }

    /**
     * Обробка скролу
     */
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Ефект паралаксу для героя
        const hero = document.querySelector('.hero');
        if (hero) {
            const heroHeight = hero.offsetHeight;
            if (scrollTop < heroHeight) {
                const parallaxSpeed = 0.5;
                hero.style.transform = `translateY(${scrollTop * parallaxSpeed}px)`;
            }
        }

        // Показ/приховування кнопки "вгору"
        this.toggleScrollToTopButton(scrollTop);
    }

    /**
     * Показ/приховування кнопки прокрутки вгору
     */
    toggleScrollToTopButton(scrollTop) {
        let scrollButton = document.getElementById('scroll-to-top');

        if (!scrollButton) {
            scrollButton = this.createScrollToTopButton();
        }

        if (scrollTop > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    }

    /**
     * Створення кнопки прокрутки вгору
     */
    createScrollToTopButton() {
        const button = document.createElement('button');
        button.id = 'scroll-to-top';
        button.className = 'scroll-to-top-btn';
        button.innerHTML = '↑';
        button.title = 'Прокрутити вгору';

        button.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
            z-index: 1000;
        `;

        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = button.classList.contains('show') ?
                'translateY(0) scale(1)' : 'translateY(20px) scale(1)';
        });

        document.body.appendChild(button);

        const style = document.createElement('style');
        style.textContent = `
            .scroll-to-top-btn.show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        `;
        document.head.appendChild(style);

        return button;
    }

    /**
     * Обробка зміни розміру вікна
     */
    handleResize() {
        if (window.innerWidth > 768) {
            const navbarNav = document.querySelector('.navbar-nav');
            if (navbarNav && navbarNav.classList.contains('show')) {
                navbarNav.classList.remove('show');
            }
        }
    }
}

/**
 * Допоміжна функція для екранування HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * CSS анімації для bouncing ефекту
 */
const bounceKeyframes = `
    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transform: scale(1);
        }
        40%, 43% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: scale(1.3);
        }
        70% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: scale(1.1);
        }
        90% {
            transform: scale(1.05);
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = bounceKeyframes;
document.head.appendChild(styleSheet);

// Ініціалізуємо клієнт після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.restaurantClient = new RestaurantClient();
});

// Експортуємо клас для глобального використання
window.RestaurantClient = RestaurantClient;