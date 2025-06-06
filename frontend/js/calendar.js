// js/calendar.js - Інтерактивний календар для резервації

/**
 * Клас для управління календарем
 */
class ReservationCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.reservationsData = {};
        this.monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        this.dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        this.init();
    }

    /**
     * Ініціалізація календаря
     */
    init() {
        this.setupEventListeners();
        this.render();
        this.loadReservationsForMonth();
    }

    /**
     * Налаштування обробників подій
     */
    setupEventListeners() {
        // Кнопки навігації місяцями
        const prevButton = document.getElementById('prev-month');
        const nextButton = document.getElementById('next-month');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
                this.loadReservationsForMonth();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
                this.loadReservationsForMonth();
            });
        }
    }

    /**
     * Відображення календаря
     */
    render() {
        this.renderHeader();
        this.renderGrid();
    }

    /**
     * Відображення заголовка календаря
     */
    renderHeader() {
        const headerElement = document.getElementById('current-month-year');
        if (headerElement) {
            const monthName = this.monthNames[this.currentDate.getMonth()];
            const year = this.currentDate.getFullYear();
            headerElement.textContent = `${monthName} ${year}`;
        }
    }

    /**
     * Відображення сітки календаря
     */
    renderGrid() {
        const gridElement = document.getElementById('calendar-grid');
        if (!gridElement) return;

        gridElement.innerHTML = '';

        // Додаємо заголовки днів тижня
        this.dayNames.forEach(dayName => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day calendar-day-header';
            dayHeader.textContent = dayName;
            gridElement.appendChild(dayHeader);
        });

        // Отримуємо перший та останній день місяця
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

        // Отримуємо день тижня для першого дня (0 = неділя)
        const startDay = firstDay.getDay();

        // Додаємо дні з попереднього місяця
        for (let i = 0; i < startDay; i++) {
            const prevDate = new Date(firstDay);
            prevDate.setDate(prevDate.getDate() - (startDay - i));

            const dayElement = this.createDayElement(prevDate, true);
            gridElement.appendChild(dayElement);
        }

        // Додаємо дні поточного місяця
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dayElement = this.createDayElement(date, false);
            gridElement.appendChild(dayElement);
        }

        // Додаємо дні з наступного місяця для заповнення сітки
        const totalCells = gridElement.children.length - 7; // Віднімаємо заголовки
        const remainingCells = 35 - totalCells; // 5 рядків × 7 днів = 35 клітинок

        for (let day = 1; day <= remainingCells; day++) {
            const nextDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, day);
            const dayElement = this.createDayElement(nextDate, true);
            gridElement.appendChild(dayElement);
        }
    }

    /**
     * Створення елемента дня
     */
    createDayElement(date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        const today = new Date();
        const dateString = this.formatDate(date);

        // Додаємо класи
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (this.isSameDay(date, today)) {
            dayElement.classList.add('today');
        }

        if (this.isPastDate(date)) {
            dayElement.classList.add('past');
        } else if (!isOtherMonth) {
            // Додаємо обробник кліку тільки для майбутніх дат поточного місяця
            dayElement.addEventListener('click', () => {
                this.selectDate(date);
            });
        }

        if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
            dayElement.classList.add('selected');
        }

        // Перевіряємо наявність резервацій
        if (this.reservationsData[dateString] && this.reservationsData[dateString].length > 0) {
            dayElement.classList.add('has-reservations');
        }

        return dayElement;
    }

    /**
     * Вибір дати
     */
    selectDate(date) {
        if (this.isPastDate(date)) return;

        this.selectedDate = new Date(date);
        this.render(); // Перемальовуємо календар для показу вибраної дати

        // Показуємо секцію з часами
        this.showTimeSlots();

        // Оновлюємо відображення обраної дати
        const selectedDateDisplay = document.getElementById('selected-date-display');
        if (selectedDateDisplay) {
            selectedDateDisplay.textContent = this.formatDateForDisplay(date);
        }

        // Завантажуємо доступні часи для обраної дати
        this.loadAvailableTimeSlots();

        // Тригеримо подію зміни дати
        this.onDateChange();
    }

    /**
     * Показ секції з часовими слотами
     */
    showTimeSlots() {
        const timeSlotsSection = document.getElementById('time-slots-section');
        if (timeSlotsSection) {
            timeSlotsSection.style.display = 'block';
            timeSlotsSection.classList.add('fade-in-up');
        }
    }

    /**
     * Завантаження доступних часових слотів
     */
    async loadAvailableTimeSlots() {
        if (!this.selectedDate) return;

        try {
            const dateString = this.formatDate(this.selectedDate);

            // Отримуємо резервації на обрану дату
            const response = await API.Reservations.getByDate(dateString);

            // Генеруємо часові слоти
            this.renderTimeSlots(response.success ? response.data : []);

        } catch (error) {
            console.error('Помилка завантаження часових слотів:', error);
            this.renderTimeSlots([]);
        }
    }

    /**
     * Відображення часових слотів
     */
    renderTimeSlots(reservations = []) {
        const timeSlotsContainer = document.getElementById('time-slots');
        if (!timeSlotsContainer) return;

        // Робочі години ресторану
        const workingHours = [
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
        ];

        // Створюємо мап зайнятих часів
        const occupiedTimes = new Set();
        reservations.forEach(reservation => {
            if (reservation.status === 'Підтверджено' || reservation.status === 'Прибули') {
                occupiedTimes.add(reservation.reservation_time.substring(0, 5)); // HH:MM формат
            }
        });

        timeSlotsContainer.innerHTML = '';

        workingHours.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;
            timeSlot.dataset.time = time;

            if (occupiedTimes.has(time)) {
                timeSlot.classList.add('occupied');
                timeSlot.title = 'Час зайнятий';
            } else {
                timeSlot.addEventListener('click', () => {
                    this.selectTimeSlot(time, timeSlot);
                });
            }

            timeSlotsContainer.appendChild(timeSlot);
        });
    }

    /**
     * Вибір часового слоту
     */
    selectTimeSlot(time, element) {
        // Знімаємо вибір з інших слотів
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });

        // Вибираємо поточний слот
        element.classList.add('selected');

        // Зберігаємо обраний час
        const selectedTimeInput = document.getElementById('selected_time');
        if (selectedTimeInput) {
            selectedTimeInput.value = time;
        }

        // Показуємо схему столиків
        this.showTableLayout();

        // Тригеримо подію зміни часу
        this.onTimeChange();
    }

    /**
     * Показ схеми столиків
     */
    showTableLayout() {
        const tableLayoutCard = document.getElementById('table-layout-card');
        if (tableLayoutCard) {
            tableLayoutCard.style.display = 'block';
            tableLayoutCard.classList.add('fade-in-up');
        }

        // Завантажуємо схему столиків
        this.loadTableLayout();
    }

    /**
     * Завантаження резервацій для місяця
     */
    async loadReservationsForMonth() {
        try {
            // Завантажуємо резервації для кожного дня місяця
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            // Очищуємо попередні дані
            this.reservationsData = {};

            // Завантажуємо резервації для кожного дня місяця
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateString = this.formatDate(date);

                try {
                    const response = await API.Reservations.getByDate(dateString);
                    if (response.success && response.data.length > 0) {
                        this.reservationsData[dateString] = response.data;
                    }
                } catch (error) {
                    // Ігноруємо помилки для окремих днів
                    console.warn(`Не вдалося завантажити резервації для ${dateString}`);
                }
            }

            // Перемальовуємо календар з новими даними
            this.render();

        } catch (error) {
            console.error('Помилка завантаження резервацій для місяця:', error);
        }
    }

    /**
     * Перевірка, чи дата в минулому
     */
    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    /**
     * Перевірка, чи це той самий день
     */
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    /**
     * Форматування дати для API
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Форматування дати для відображення
     */
    formatDateForDisplay(date) {
        const day = date.getDate();
        const month = this.monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    /**
     * Отримання обраної дати
     */
    getSelectedDate() {
        return this.selectedDate;
    }

    /**
     * Отримання обраного часу
     */
    getSelectedTime() {
        const selectedTimeInput = document.getElementById('selected_time');
        return selectedTimeInput ? selectedTimeInput.value : null;
    }

    /**
     * Скидання вибору
     */
    reset() {
        this.selectedDate = null;

        // Приховуємо секції
        const timeSlotsSection = document.getElementById('time-slots-section');
        const tableLayoutCard = document.getElementById('table-layout-card');

        if (timeSlotsSection) {
            timeSlotsSection.style.display = 'none';
        }

        if (tableLayoutCard) {
            tableLayoutCard.style.display = 'none';
        }

        // Очищуємо форму
        const selectedDateInput = document.getElementById('selected_date');
        const selectedTimeInput = document.getElementById('selected_time');

        if (selectedDateInput) selectedDateInput.value = '';
        if (selectedTimeInput) selectedTimeInput.value = '';

        this.render();
    }

    /**
     * Обробники подій (для розширення функціоналу)
     */
    onDateChange() {
        // Оновлюємо приховане поле з датою
        const selectedDateInput = document.getElementById('selected_date');
        if (selectedDateInput && this.selectedDate) {
            selectedDateInput.value = this.formatDate(this.selectedDate);
        }

        // Тригеримо подію для інших компонентів
        document.dispatchEvent(new CustomEvent('dateSelected', {
            detail: {
                date: this.selectedDate,
                dateString: this.selectedDate ? this.formatDate(this.selectedDate) : null
            }
        }));
    }

    onTimeChange() {
        // Тригеримо подію для інших компонентів
        document.dispatchEvent(new CustomEvent('timeSelected', {
            detail: {
                time: this.getSelectedTime()
            }
        }));
    }

    /**
     * Завантаження схеми столиків (буде реалізовано в наступному файлі)
     */
    async loadTableLayout() {
        // Ця функція буде реалізована в advanced-reservation.js
        if (window.restaurantLayout && typeof window.restaurantLayout.loadTables === 'function') {
            await window.restaurantLayout.loadTables();
        }
    }
}

// Експортуємо клас для використання
window.ReservationCalendar = ReservationCalendar;