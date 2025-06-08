// js/utils.js - Допоміжні функції та утіліти

/**
 * Показати повідомлення (alert) з покращеним дизайном
 */
function showAlert(message, type = 'info', duration = 5000) {
    // Створюємо елемент alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade-in`;

    // Іконки для різних типів повідомлень
    const icons = {
        success: '✅',
        danger: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
        <button type="button" class="alert-close" onclick="this.parentElement.remove()" 
                style="position: absolute; top: 15px; right: 15px; background: none; border: none; 
                       font-size: 1.2rem; cursor: pointer; opacity: 0.7;">×</button>
    `;

    // Знаходимо контейнер для alerts або створюємо його
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1060;
            max-width: 400px;
            width: 100%;
        `;
        document.body.appendChild(alertContainer);
    }

    // Додаємо alert з анімацією
    alertContainer.appendChild(alertDiv);

    // Автоматично видаляємо через заданий час
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.style.opacity = '0';
                alertDiv.style.transform = 'translateX(100%)';
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, duration);
    }
}

/**
 * Показати/сховати індикатор завантаження з покращеним дизайном
 */
let loadingCounter = 0;

function showLoading(message = 'Завантаження...') {
    loadingCounter++;

    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(3px);
        `;
        loader.innerHTML = `
            <div class="text-center" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                <div class="spinner" style="width: 50px; height: 50px; border-width: 4px; margin: 0 auto 1rem;"></div>
                <div style="color: var(--gray-700); font-weight: 500;">${message}</div>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        // Оновлюємо повідомлення
        const messageEl = loader.querySelector('div div:last-child');
        if (messageEl) messageEl.textContent = message;
    }

    loader.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    loadingCounter = Math.max(0, loadingCounter - 1);

    if (loadingCounter === 0) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

/**
 * Модальні вікна з покращеною анімацією
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Додаємо анімацію появи
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.8)';
            dialog.style.opacity = '0';

            requestAnimationFrame(() => {
                dialog.style.transition = 'all 0.3s ease';
                dialog.style.transform = 'scale(1)';
                dialog.style.opacity = '1';
            });
        }
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) {
            dialog.style.transform = 'scale(0.8)';
            dialog.style.opacity = '0';

            setTimeout(() => {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }, 300);
        } else {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
}

// Закриття модального вікна при кліку поза ним
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        hideModal(e.target.id);
    }
});

// Закриття модального вікна при натисканні Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            hideModal(openModal.id);
        }
    }
});

/**
 * Форматування дати та часу з локалізацією
 */
function formatDate(dateString, includeTime = false) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Повертаємо оригінал якщо невалідна дата

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Europe/Kiev'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return date.toLocaleDateString('uk-UA', options);
    } catch (error) {
        console.warn('Помилка форматування дати:', error);
        return dateString;
    }
}

function formatTime(timeString) {
    if (!timeString) return '';

    try {
        // Якщо час у форматі HH:MM:SS, обрізаємо секунди
        if (timeString.includes(':')) {
            const parts = timeString.split(':');
            return `${parts[0]}:${parts[1]}`;
        }

        return timeString;
    } catch (error) {
        console.warn('Помилка форматування часу:', error);
        return timeString;
    }
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';

    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return dateTimeString;

        return date.toLocaleString('uk-UA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Kiev'
        });
    } catch (error) {
        console.warn('Помилка форматування дати і часу:', error);
        return dateTimeString;
    }
}

/**
 * Форматування валюти з кращою обробкою
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';

    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '';

        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    } catch (error) {
        console.warn('Помилка форматування валюти:', error);
        return amount + ' ₴';
    }
}

/**
 * Покращена валідація форм
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const inputs = form.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    inputs.forEach(input => {
        const value = input.value.trim();

        // Очищуємо попередні стилі
        input.classList.remove('is-invalid');

        if (!value) {
            input.classList.add('is-invalid');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = input;
        }
    });

    // Перевірка email
    const emailInputs = form.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        if (input.value && !isValidEmail(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = input;
        }
    });

    // Перевірка телефону
    const phoneInputs = form.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        if (input.value && !isValidPhone(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = input;
        }
    });

    // Скролимо до першого невалідного поля
    if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Підтримуємо різні формати українських номерів
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 10;
}

/**
 * Покращена робота з формами
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        const input = form.querySelector(`[name="${key}"]`);

        if (input) {
            // Обробка checkbox
            if (input.type === 'checkbox') {
                data[key] = input.checked;
            }
            // Обробка чисел
            else if (input.type === 'number') {
                data[key] = value ? parseFloat(value) : null;
            }
            // Обробка дат
            else if (input.type === 'date' || input.type === 'datetime-local') {
                data[key] = value || null;
            }
            // Звичайні поля
            else {
                data[key] = value.trim() || null;
            }
        }
    }

    return data;
}

function setFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;

    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = Boolean(data[key]);
            } else {
                input.value = data[key] || '';
            }
        }
    });
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.reset();

    // Видаляємо класи валідації
    const inputs = form.querySelectorAll('.is-invalid, .is-valid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });

    // Очищуємо кастомні елементи (зірки рейтингу тощо)
    const stars = form.querySelectorAll('.star.active');
    stars.forEach(star => star.classList.remove('active'));
}

/**
 * Покращена робота з таблицями
 */
function createTableRow(data, columns) {
    const row = document.createElement('tr');

    columns.forEach(column => {
        const cell = document.createElement('td');

        if (typeof column === 'string') {
            cell.textContent = data[column] || '';
        } else if (typeof column === 'object') {
            if (column.formatter) {
                cell.innerHTML = column.formatter(data[column.key], data);
            } else {
                cell.textContent = data[column.key] || '';
            }

            // Додаємо класи якщо вказані
            if (column.className) {
                cell.className = column.className;
            }
        }

        row.appendChild(cell);
    });

    return row;
}

function updateTable(tableId, data, columns) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Очищуємо таблицю з анімацією
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        setTimeout(() => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
        }, index * 50);
    });

    setTimeout(() => {
        tbody.innerHTML = '';

        // Додаємо нові рядки з анімацією
        data.forEach((item, index) => {
            const row = createTableRow(item, columns);
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            tbody.appendChild(row);

            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }, rows.length * 50 + 100);
}

/**
 * Покращене сортування таблиць
 */
function sortTable(tableId, columnIndex, ascending = true) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aText = a.cells[columnIndex]?.textContent.trim() || '';
        const bText = b.cells[columnIndex]?.textContent.trim() || '';

        // Спробуємо конвертувати в числа
        const aNum = parseFloat(aText.replace(/[^\d.-]/g, ''));
        const bNum = parseFloat(bText.replace(/[^\d.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return ascending ? aNum - bNum : bNum - aNum;
        } else {
            return ascending ? aText.localeCompare(bText, 'uk') : bText.localeCompare(aText, 'uk');
        }
    });

    // Перебудовуємо таблицю з анімацією
    rows.forEach((row, index) => {
        setTimeout(() => {
            tbody.appendChild(row);
        }, index * 20);
    });
}

/**
 * Покращена фільтрація таблиць
 */
function filterTable(tableId, searchValue, columns = []) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    searchValue = searchValue.toLowerCase();

    rows.forEach(row => {
        let found = false;

        if (columns.length === 0) {
            // Пошук по всіх колонках
            const cells = row.querySelectorAll('td');
            found = Array.from(cells).some(cell =>
                cell.textContent.toLowerCase().includes(searchValue)
            );
        } else {
            // Пошук по вказаних колонках
            found = columns.some(columnIndex => {
                const cell = row.cells[columnIndex];
                return cell && cell.textContent.toLowerCase().includes(searchValue);
            });
        }

        // Анімований показ/приховування
        if (found) {
            row.style.display = '';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        } else {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                if (row.style.opacity === '0') {
                    row.style.display = 'none';
                }
            }, 300);
        }
    });
}

/**
 * Безпечна робота з localStorage
 */
function saveToStorage(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
        return true;
    } catch (error) {
        console.error('Помилка збереження в localStorage:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;

        return JSON.parse(item);
    } catch (error) {
        console.error('Помилка завантаження з localStorage:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Помилка видалення з localStorage:', error);
        return false;
    }
}

/**
 * Покращений дебаунс з можливістю скасування
 */
function debounce(func, wait, immediate = false) {
    let timeout;

    const debounced = function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func(...args);
    };

    debounced.cancel = function() {
        clearTimeout(timeout);
        timeout = null;
    };

    return debounced;
}

/**
 * Покращене копіювання в буфер обміну
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback для старих браузерів
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                textArea.remove();
            } catch (err) {
                textArea.remove();
                throw err;
            }
        }

        showAlert('Скопійовано в буфер обміну', 'success', 2000);
        return true;
    } catch (error) {
        console.error('Помилка копіювання:', error);
        showAlert('Помилка копіювання', 'danger', 3000);
        return false;
    }
}

/**
 * Покращений експорт в CSV з українською підтримкою
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('Немає даних для експорту', 'warning');
        return;
    }

    try {
        const headers = Object.keys(data[0]);
        const csvContent = [
            // BOM для правильного відображення української мови в Excel
            '\ufeff',
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = String(row[header] || '');
                    // Екрануємо лапки та переноси рядків
                    return `"${value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showAlert('Файл успішно завантажено', 'success');
        } else {
            showAlert('Браузер не підтримує завантаження файлів', 'warning');
        }
    } catch (error) {
        console.error('Помилка експорту CSV:', error);
        showAlert('Помилка експорту файлу', 'danger');
    }
}

/**
 * Перевірка підключення до інтернету
 */
function checkOnlineStatus() {
    const updateOnlineStatus = () => {
        if (!navigator.onLine) {
            showAlert('Відсутнє підключення до інтернету', 'warning', 0);
        } else {
            // Видаляємо повідомлення про відсутність інтернету
            const alerts = document.querySelectorAll('.alert-warning');
            alerts.forEach(alert => {
                if (alert.textContent.includes('інтернету')) {
                    alert.remove();
                }
            });
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Початкова перевірка
    updateOnlineStatus();
}

/**
 * Ініціалізація спільних обробників подій
 */
document.addEventListener('DOMContentLoaded', function() {
    // Перевіряємо статус підключення
    checkOnlineStatus();

    // Додаємо валідацію для полів форм
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid') && this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });

    // Автоматично закриваємо алерти при кліку
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('alert-close')) {
            const alert = e.target.closest('.alert');
            if (alert) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => alert.remove(), 300);
            }
        }
    });
});

// Експортуємо утіліти для глобального використання
window.Utils = {
    showAlert,
    showLoading,
    hideLoading,
    showModal,
    hideModal,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    validateForm,
    isValidEmail,
    isValidPhone,
    getFormData,
    setFormData,
    clearForm,
    createTableRow,
    updateTable,
    sortTable,
    filterTable,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    debounce,
    copyToClipboard,
    exportToCSV,
    checkOnlineStatus
};