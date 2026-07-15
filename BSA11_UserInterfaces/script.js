// Глобальные переменные состояния
let currentScreen = 'home-screen';
let navigationHistory = [];
let currentUser = null;
let currentBooking = {
    service: null,
    master: null,
    date: null,
    time: null,
    datetime: null,
    notification: 'telegram'
};

// Состояние календаря
let calendarDate = new Date();
let selectedDate = null;
let selectedTimeSlot = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadMockData();
    updateBottomNav();
});

function initializeApp() {
    // Устанавливаем заголовок
    updateHeaderTitle(currentScreen);
    
    // Показываем главный экран
    showScreen(currentScreen);
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Генерируем календарь
    renderCalendar();
}

function setupEventListeners() {
    // Обработка выбора услуги
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            selectService(this);
        });
    });
    
    // Обработка выбора мастера
    document.querySelectorAll('.master-card').forEach(card => {
        card.addEventListener('click', function() {
            selectMaster(this);
        });
    });
    
    // Обработка выбора времени
    document.querySelectorAll('.time-slot.available').forEach(slot => {
        slot.addEventListener('click', function() {
            selectTimeSlot(this);
        });
    });
    
    // Обработка выбора уведомлений
    document.querySelectorAll('.notification-option').forEach(option => {
        option.addEventListener('click', function() {
            selectNotificationOption(this);
        });
    });
}

// Навигация между экранами
function showScreen(screenId) {
    // Добавляем текущий экран в историю
    if (currentScreen !== screenId) {
        navigationHistory.push(currentScreen);
    }
    
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
        
        // Обновляем заголовок
        updateHeaderTitle(screenId);
        
        // Обновляем нижнюю навигацию
        updateBottomNav();
        
        // Обновляем данные на экране подтверждения
        if (screenId === 'confirm-screen') {
            updateConfirmationDetails();
        }
        
        // Обновляем информацию о выбранном слоте на экране мастеров
        if (screenId === 'masters-screen') {
            updateSelectedSlotInfo();
        }
        
        // Перегенерируем календарь при переходе на экран даты
        if (screenId === 'datetime-screen') {
            renderCalendar();
            // Восстанавливаем визуальное выделение, если дата уже выбрана
            if (selectedDate) {
                const days = document.querySelectorAll('.calendar-day:not(.other-month):not(.disabled)');
                days.forEach(el => {
                    if (parseInt(el.textContent) === selectedDate.getDate()) {
                        el.classList.add('selected');
                    }
                });
                updateSelectedDateInfo();
                // Восстанавливаем выделение слота времени
                if (selectedTimeSlot) {
                    document.querySelectorAll('.time-slot').forEach(s => {
                        if (s.textContent.trim() === selectedTimeSlot) {
                            s.classList.add('selected');
                        }
                    });
                    document.getElementById('datetime-continue-btn').disabled = false;
                }
            }
        }
        
        // Инициализируем расписание при переходе
        if (screenId === 'manager-schedule') {
            initSchedule();
        }
        
        // Обновляем отчёты при переходе на экран отчётов
        if (screenId === 'manager-reports') {
            updateReports();
        }
        
        // Обновляем отзывы при переходе на экран отзывов
        if (screenId === 'manager-reviews') {
            updateReviews();
        }
        
        // Сбрасываем выбор услуги при переходе на экран услуг
        if (screenId === 'services-screen') {
            resetServiceSelection();
        }
        
        // Сбрасываем выбор мастера при переходе на экран мастеров
        if (screenId === 'masters-screen') {
            resetMasterSelection();
        }
    }
}

function resetServiceSelection() {
    document.querySelectorAll('.service-card').forEach(c => {
        c.classList.remove('selected');
    });
    currentBooking.service = null;
    document.getElementById('services-continue-btn').disabled = true;
}

function resetMasterSelection() {
    document.querySelectorAll('.master-card').forEach(c => {
        c.classList.remove('selected');
    });
    currentBooking.master = null;
    document.getElementById('masters-continue-btn').disabled = true;
}

function resetDateTimeSelection() {
    selectedDate = null;
    selectedTimeSlot = null;
    currentBooking.datetime = null;
    currentBooking.date = null;
    currentBooking.time = null;
    document.getElementById('selected-date-info').style.display = 'none';
    document.getElementById('datetime-continue-btn').disabled = true;
    // Сбрасываем выделение слотов
    document.querySelectorAll('.time-slot').forEach(s => {
        s.classList.remove('selected');
    });
}

function goBack() {
    if (navigationHistory.length > 0) {
        const previousScreen = navigationHistory.pop();
        showScreen(previousScreen);
    } else {
        showScreen('home-screen');
    }
}

function updateHeaderTitle(screenId) {
    const titles = {
        'home-screen': 'Главная',
        'register-screen': 'Регистрация',
        'login-screen': 'Вход',
        'services-screen': 'Услуги',
        'datetime-screen': 'Выбор даты и времени',
        'masters-screen': 'Мастера',
        'confirm-screen': 'Подтверждение',
        'result-screen': 'Запись подтверждена',
        'profile-screen': 'Личный кабинет',
        'manager-screen': 'Панель менеджера',
        'manager-schedule': 'Расписание',
        'manager-reports': 'Отчёты',
        'manager-reviews': 'Отзывы',
        'master-screen': 'Панель мастера'
    };
    
    const titleElement = document.querySelector('.header-title');
    if (titleElement) {
        titleElement.textContent = titles[screenId] || 'BarberShop';
    }
}

function updateBottomNav() {
    // Скрываем нижнюю навигацию на некоторых экранах
    const bottomNav = document.getElementById('bottom-nav');
    const hideOnScreens = ['register-screen', 'login-screen', 'confirm-screen', 'result-screen'];
    
    if (hideOnScreens.includes(currentScreen)) {
        bottomNav.classList.add('hidden');
    } else {
        bottomNav.classList.remove('hidden');
    }
    
    // Обновляем активную кнопку
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMap = {
        'home-screen': 0,
        'services-screen': 1,
        'profile-screen': 2,
        'manager-screen': 3
    };
    
    const activeIndex = activeMap[currentScreen];
    if (activeIndex !== undefined) {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[activeIndex]) {
            navItems[activeIndex].classList.add('active');
        }
    }
}

// ==================== КАЛЕНДАРЬ ====================

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // Обновляем заголовок месяца
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    document.getElementById('calendar-month-year').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Генерируем дни
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Дни предыдущего месяца
    const startDayOfWeek = firstDay.getDay() || 7; // Пн=1, Вс=7
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startDayOfWeek - 1; i > 0; i--) {
        const day = prevMonthLastDay - i + 1;
        const dayElement = createDayElement(day, true, false, false, false);
        daysContainer.appendChild(dayElement);
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;
        const isSelected = selectedDate && 
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
        
        const dayElement = createDayElement(day, false, isToday, isPast, isSelected);
        daysContainer.appendChild(dayElement);
    }
    
    // Дни следующего месяца
    const totalDays = startDayOfWeek - 1 + lastDay.getDate();
    const remainingCells = 7 - (totalDays % 7 || 7);
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true, false, false, false);
        daysContainer.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth, isToday, isPast, isSelected) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.textContent = day;
    
    if (isOtherMonth) {
        div.classList.add('other-month');
    } else {
        if (isPast) {
            div.classList.add('disabled');
        } else {
            div.addEventListener('click', function() {
                selectCalendarDay(day);
            });
        }
        if (isToday) div.classList.add('today');
        if (isSelected) div.classList.add('selected');
    }
    
    return div;
}

function selectCalendarDay(day) {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    selectedDate = new Date(year, month, day);
    selectedTimeSlot = null;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('.calendar-day').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Находим и выделяем выбранный день
    const days = document.querySelectorAll('.calendar-day:not(.other-month):not(.disabled)');
    days.forEach(el => {
        if (parseInt(el.textContent) === day) {
            el.classList.add('selected');
        }
    });
    
    // Показываем информацию о выбранной дате
    updateSelectedDateInfo();
    
    // Сбрасываем выбор времени
    document.querySelectorAll('.time-slot').forEach(s => {
        s.classList.remove('selected');
    });
    
    // Обновляем слоты времени для выбранной даты
    updateTimeSlotsForDate(selectedDate);
    
    // Блокируем кнопку продолжения
    document.getElementById('datetime-continue-btn').disabled = true;
}

function updateSelectedDateInfo() {
    if (!selectedDate) return;
    
    const infoContainer = document.getElementById('selected-date-info');
    const infoText = document.getElementById('selected-date-text');
    
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const dayName = dayNames[selectedDate.getDay()];
    const day = selectedDate.getDate();
    const monthName = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    
    infoText.textContent = `${day} ${monthName} ${year}, ${dayName}`;
    infoContainer.style.display = 'flex';
}

function updateTimeSlotsForDate(date) {
    // Имитация разных слотов для разных дат
    const slotsContainer = document.getElementById('time-slots-container');
    slotsContainer.innerHTML = '';
    
    const allSlots = [
        { time: '10:00 - 11:00', booked: false },
        { time: '11:00 - 12:00', booked: false },
        { time: '12:00 - 13:00', booked: date.getDay() === 6 || date.getDay() === 0 ? false : true },
        { time: '13:00 - 14:00', booked: false },
        { time: '14:00 - 15:00', booked: false },
        { time: '15:00 - 16:00', booked: date.getDate() % 3 === 0 },
        { time: '16:00 - 17:00', booked: date.getDay() === 1 },
        { time: '17:00 - 18:00', booked: false },
        { time: '18:00 - 19:00', booked: false },
        { time: '19:00 - 20:00', booked: date.getDate() % 2 === 0 }
    ];
    
    allSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot ${slot.booked ? 'booked' : 'available'}`;
        slotElement.textContent = slot.time;
        
        if (!slot.booked) {
            slotElement.addEventListener('click', function() {
                selectTimeSlot(this);
            });
        }
        
        slotsContainer.appendChild(slotElement);
    });
}

function prevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
    // Сбрасываем выбор при смене месяца
    selectedDate = null;
    selectedTimeSlot = null;
    document.getElementById('selected-date-info').style.display = 'none';
    document.getElementById('datetime-continue-btn').disabled = true;
    updateTimeSlotsForDate(new Date());
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
    // Сбрасываем выбор при смене месяца
    selectedDate = null;
    selectedTimeSlot = null;
    document.getElementById('selected-date-info').style.display = 'none';
    document.getElementById('datetime-continue-btn').disabled = true;
    updateTimeSlotsForDate(new Date());
}

// ==================== ВЫБОР ВРЕМЕНИ ====================

function selectTimeSlot(slot) {
    if (slot.classList.contains('booked')) return;
    
    document.querySelectorAll('.time-slot').forEach(s => {
        s.classList.remove('selected');
    });
    
    slot.classList.add('selected');
    selectedTimeSlot = slot.textContent.trim();
    
    // Сохраняем в currentBooking
    if (selectedDate) {
        const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const monthNames = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        const dateStr = `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`;
        currentBooking.datetime = `${dateStr}, ${selectedTimeSlot}`;
        currentBooking.date = selectedDate;
        currentBooking.time = selectedTimeSlot;
    }
    
    // Активируем кнопку продолжения
    document.getElementById('datetime-continue-btn').disabled = false;
}

// ==================== ВЫБОР МАСТЕРА ====================

function updateSelectedSlotInfo() {
    const infoContainer = document.getElementById('selected-slot-info');
    const infoText = document.getElementById('selected-slot-text');
    
    if (currentBooking.datetime) {
        infoText.textContent = currentBooking.datetime;
        infoContainer.style.display = 'flex';
    } else {
        infoContainer.style.display = 'none';
    }
}

// ==================== РЕГИСТРАЦИЯ И ВХОД ====================

function registerUser() {
    const phone = document.getElementById('register-phone').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    
    // Валидация
    if (!validatePhone(phone)) {
        showError('phone-error', 'Введите корректный номер телефона');
        return;
    }
    
    if (!name.trim()) {
        showError('phone-error', 'Введите имя');
        return;
    }
    
    if (password.length < 6) {
        showError('phone-error', 'Пароль должен быть не менее 6 символов');
        return;
    }
    
    // Имитация регистрации
    currentUser = {
        id: generateId(),
        phone: phone,
        name: name,
        registered: new Date().toLocaleDateString('ru-RU')
    };
    
    // Показываем успешное сообщение
    alert(`Регистрация успешна! Добро пожаловать, ${name}. SMS отправлено на ${phone}`);
    
    // Переходим в личный кабинет
    showScreen('profile-screen');
    updateUserProfile();
}

function loginUser() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    
    // Имитация входа
    if (phone && password) {
        currentUser = {
            id: 'user-123',
            phone: phone,
            name: 'Иван Иванов',
            registered: '2024-01-15'
        };
        
        showScreen('profile-screen');
        updateUserProfile();
    } else {
        alert('Введите телефон и пароль');
    }
}

function logout() {
    currentUser = null;
    showScreen('home-screen');
}

function updateUserProfile() {
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-phone').textContent = currentUser.phone;
    }
}

// ==================== НОВАЯ ЗАПИСЬ ====================

function startNewBooking() {
    // Сбрасываем все данные текущей записи
    currentBooking = {
        service: null,
        master: null,
        date: null,
        time: null,
        datetime: null,
        notification: 'telegram'
    };
    selectedDate = null;
    selectedTimeSlot = null;
    
    // Очищаем историю навигации для новой записи
    navigationHistory = [];
    
    // Сбрасываем UI календаря
    resetDateTimeSelection();
    
    // Переходим к выбору услуги
    showScreen('services-screen');
}

// ==================== ВЫБОР УСЛУГИ ====================

function selectService(card) {
    document.querySelectorAll('.service-card').forEach(c => {
        c.classList.remove('selected');
    });
    
    card.classList.add('selected');
    currentBooking.service = {
        id: card.getAttribute('data-id'),
        name: card.querySelector('h3').textContent,
        price: card.querySelector('.service-price').textContent
    };
    
    // Активируем кнопку продолжения
    document.getElementById('services-continue-btn').disabled = false;
}

// ==================== ВЫБОР МАСТЕРА ====================

function selectMaster(card) {
    document.querySelectorAll('.master-card').forEach(c => {
        c.classList.remove('selected');
    });
    
    card.classList.add('selected');
    currentBooking.master = {
        id: card.getAttribute('data-id'),
        name: card.querySelector('h3').textContent,
        rating: card.querySelector('.rating').textContent
    };
    
    // Активируем кнопку продолжения
    document.getElementById('masters-continue-btn').disabled = false;
}

// ==================== ВЫБОР УВЕДОМЛЕНИЙ ====================

function selectNotificationOption(option) {
    document.querySelectorAll('.notification-option').forEach(o => {
        o.classList.remove('selected');
    });
    
    option.classList.add('selected');
    currentBooking.notification = option.querySelector('span').textContent.toLowerCase();
}

// ==================== ПОДТВЕРЖДЕНИЕ ====================

function updateConfirmationDetails() {
    if (currentBooking.service) {
        document.getElementById('confirm-service').textContent = currentBooking.service.name;
        document.getElementById('confirm-price').textContent = currentBooking.service.price;
        document.getElementById('confirm-total').textContent = currentBooking.service.price;
    }
    
    if (currentBooking.master) {
        document.getElementById('confirm-master').textContent = currentBooking.master.name;
    }
    
    if (currentBooking.datetime) {
        document.getElementById('confirm-datetime').textContent = currentBooking.datetime;
    }
}

function confirmBooking() {
    if (!currentBooking.service || !currentBooking.master || !currentBooking.datetime) {
        alert('Пожалуйста, заполните все данные');
        return;
    }
    
    // Генерация номера записи
    const bookingId = '#' + Math.floor(Math.random() * 1000000);
    const bookingTime = new Date().toLocaleString('ru-RU');
    
    document.getElementById('booking-id').textContent = bookingId;
    document.getElementById('booking-time').textContent = currentBooking.datetime;
    
    // Показываем экран результата
    showScreen('result-screen');
    
    // Имитация отправки уведомления
    setTimeout(() => {
        console.log(`Уведомление отправлено через ${currentBooking.notification}`);
    }, 1000);
}

// ==================== ВАЛИДАЦИЯ И ФОРМАТИРОВАНИЕ ====================

function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('8')) {
        value = '7' + value.substring(1);
    }
    if (value.startsWith('7')) {
        value = '+7' + value.substring(1);
    }
    
    if (value.startsWith('+7')) {
        let digits = value.substring(2);
        let formatted = '+7';
        
        if (digits.length > 0) formatted += ' (' + digits.substring(0, 3);
        if (digits.length > 3) formatted += ') ' + digits.substring(3, 6);
        if (digits.length > 6) formatted += '-' + digits.substring(6, 8);
        if (digits.length > 8) formatted += '-' + digits.substring(8, 10);
        
        input.value = formatted;
    }
    
    hideError('phone-error');
}

function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('7');
}

function checkPasswordStrength(input) {
    const password = input.value;
    const strengthText = document.getElementById('password-strength-text');
    const strengthFill = document.getElementById('strength-fill');
    
    let strength = 0;
    let width = 0;
    let text = 'Слабый';
    let color = '#dc3545';
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) {
        text = 'Слабый';
        color = '#dc3545';
        width = 33;
    } else if (strength <= 4) {
        text = 'Средний';
        color = '#ffc107';
        width = 66;
    } else {
        text = 'Сильный';
        color = '#28a745';
        width = 100;
    }
    
    strengthText.textContent = text;
    strengthFill.style.width = width + '%';
    strengthFill.style.backgroundColor = color;
}

// ==================== УТИЛИТЫ ====================

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function loadMockData() {
    // Загрузка тестовых данных
    console.log('Mock data loaded');
}

// Быстрые действия
function setAmount(amount) {
    document.getElementById('amount-input').value = amount;
}

function toggleProfile() {
    if (currentUser) {
        showScreen('profile-screen');
    } else {
        showScreen('login-screen');
    }
}

// Экспорт функций для использования в HTML
window.showScreen = showScreen;
window.goBack = goBack;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logout = logout;
window.selectService = selectService;
window.selectMaster = selectMaster;
window.selectTimeSlot = selectTimeSlot;
window.confirmBooking = confirmBooking;
window.formatPhone = formatPhone;
window.checkPasswordStrength = checkPasswordStrength;
window.setAmount = setAmount;
window.toggleProfile = toggleProfile;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.selectCalendarDay = selectCalendarDay;
window.startNewBooking = startNewBooking;

// ==================== ОТЧЁТЫ ====================

// Мок-данные для отчётов
let reportBookings = [];
let reportFilteredBookings = [];

function generateReportData() {
    const services = [
        { id: 's1', name: 'Мужская стрижка', price: 1500 },
        { id: 's2', name: 'Стрижка машинкой', price: 800 },
        { id: 's3', name: 'Моделирование бороды', price: 1000 },
        { id: 's4', name: 'Детская стрижка', price: 1200 },
        { id: 's5', name: 'Комплекс (стрижка + борода)', price: 2200 },
        { id: 's6', name: 'Камуфляж седины', price: 1800 }
    ];
    
    const masters = [
        { id: 'm1', name: 'Алексей', rating: 4.8 },
        { id: 'm2', name: 'Дмитрий', rating: 4.9 },
        { id: 'm3', name: 'Сергей', rating: 4.7 },
        { id: 'm4', name: 'Михаил', rating: 4.6 }
    ];
    
    const clients = [
        'Иван Петров', 'Сергей Иванов', 'Алексей Смирнов', 'Дмитрий Козлов',
        'Михаил Новиков', 'Андрей Морозов', 'Владимир Волков', 'Николай Соколов',
        'Павел Кузнецов', 'Роман Попов', 'Евгений Лебедев', 'Артём Павлов'
    ];
    
    reportBookings = [];
    const today = new Date();
    
    // Генерируем данные за последние 30 дней
    for (let i = 0; i < 60; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(10 + Math.floor(Math.random() * 10), Math.random() > 0.5 ? 0 : 30, 0, 0);
        
        const service = services[Math.floor(Math.random() * services.length)];
        const master = masters[Math.floor(Math.random() * masters.length)];
        const client = clients[Math.floor(Math.random() * clients.length)];
        
        reportBookings.push({
            id: 'BK-' + String(i + 1).padStart(4, '0'),
            date: date,
            client: client,
            service: service,
            master: master,
            amount: service.price,
            status: Math.random() > 0.1 ? 'completed' : 'cancelled'
        });
    }
    
    // Сортируем по дате (сначала новые)
    reportBookings.sort((a, b) => b.date - a.date);
    
    reportFilteredBookings = [...reportBookings];
}

function updateReports() {
    if (reportBookings.length === 0) {
        generateReportData();
    }
    
    // Заполняем фильтры
    populateReportFilters();
    
    // Применяем фильтры
    applyReportFilters();
}

function populateReportFilters() {
    // Заполняем селект услуг
    const serviceSelect = document.getElementById('report-service-filter');
    if (serviceSelect && serviceSelect.options.length <= 1) {
        const services = [...new Set(reportBookings.map(b => b.service.name))];
        services.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            serviceSelect.appendChild(option);
        });
    }
    
    // Заполняем селект мастеров
    const masterSelect = document.getElementById('report-master-filter');
    if (masterSelect && masterSelect.options.length <= 1) {
        const masters = [...new Set(reportBookings.map(b => b.master.name))];
        masters.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            masterSelect.appendChild(option);
        });
    }
}

function applyReportFilters() {
    const dateFrom = document.getElementById('report-date-from')?.value;
    const dateTo = document.getElementById('report-date-to')?.value;
    const serviceFilter = document.getElementById('report-service-filter')?.value;
    const masterFilter = document.getElementById('report-master-filter')?.value;
    
    reportFilteredBookings = reportBookings.filter(booking => {
        // Фильтр по дате от
        if (dateFrom) {
            const fromDate = new Date(dateFrom + 'T00:00:00');
            if (booking.date < fromDate) return false;
        }
        
        // Фильтр по дате до
        if (dateTo) {
            const toDate = new Date(dateTo + 'T23:59:59');
            if (booking.date > toDate) return false;
        }
        
        // Фильтр по услуге
        if (serviceFilter && booking.service.name !== serviceFilter) return false;
        
        // Фильтр по мастеру
        if (masterFilter && booking.master.name !== masterFilter) return false;
        
        return true;
    });
    
    // Обновляем сводку
    updateReportSummary();
    
    // Обновляем графики
    updateReportCharts();
    
    // Обновляем таблицу
    renderReportTable();
}

function resetReportFilters() {
    document.getElementById('report-date-from').value = '';
    document.getElementById('report-date-to').value = '';
    document.getElementById('report-service-filter').value = '';
    document.getElementById('report-master-filter').value = '';
    
    applyReportFilters();
}

function updateReportSummary() {
    const totalRevenue = reportFilteredBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.amount, 0);
    
    const totalBookings = reportFilteredBookings.length;
    const uniqueClients = new Set(reportFilteredBookings.map(b => b.client)).size;
    const avgCheck = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
    
    document.getElementById('report-revenue').textContent = totalRevenue.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('report-bookings-count').textContent = totalBookings;
    document.getElementById('report-clients-count').textContent = uniqueClients;
    document.getElementById('report-avg-check').textContent = avgCheck.toLocaleString('ru-RU') + ' ₽';
}

function updateReportCharts() {
    // Статистика по услугам
    const serviceStats = {};
    reportFilteredBookings
        .filter(b => b.status === 'completed')
        .forEach(b => {
            if (!serviceStats[b.service.name]) {
                serviceStats[b.service.name] = { bookings: 0, revenue: 0 };
            }
            serviceStats[b.service.name].bookings++;
            serviceStats[b.service.name].revenue += b.amount;
        });
    
    const chartContainer = document.getElementById('service-chart');
    if (chartContainer) {
        chartContainer.innerHTML = '';
        const maxRevenue = Math.max(...Object.values(serviceStats).map(s => s.revenue), 1);
        
        Object.entries(serviceStats).forEach(([name, stats]) => {
            const percent = (stats.revenue / maxRevenue) * 100;
            
            const barRow = document.createElement('div');
            barRow.className = 'chart-bar-row';
            
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = name;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.width = percent + '%';
            bar.textContent = stats.bookings + ' зап. / ' + stats.revenue.toLocaleString('ru-RU') + ' ₽';
            
            barContainer.appendChild(bar);
            barRow.appendChild(label);
            barRow.appendChild(barContainer);
            chartContainer.appendChild(barRow);
        });
    }
    
    // Статистика по мастерам
    const masterStats = {};
    reportFilteredBookings
        .filter(b => b.status === 'completed')
        .forEach(b => {
            if (!masterStats[b.master.name]) {
                masterStats[b.master.name] = { bookings: 0, revenue: 0, rating: b.master.rating };
            }
            masterStats[b.master.name].bookings++;
            masterStats[b.master.name].revenue += b.amount;
        });
    
    const masterStatsContainer = document.getElementById('master-stats');
    if (masterStatsContainer) {
        masterStatsContainer.innerHTML = '';
        const maxBookings = Math.max(...Object.values(masterStats).map(m => m.bookings), 1);
        
        Object.entries(masterStats).forEach(([name, stats]) => {
            const workload = Math.round((stats.bookings / maxBookings) * 100);
            
            const card = document.createElement('div');
            card.className = 'master-stat-card';
            
            card.innerHTML = `
                <div class="master-stat-header">
                    <div class="master-stat-avatar">${name[0]}</div>
                    <div class="master-stat-info">
                        <h4>${name}</h4>
                        <div class="master-stat-rating">⭐ ${stats.rating}</div>
                    </div>
                </div>
                <div class="master-stat-data">
                    <div class="master-stat-row">
                        <span>Записей:</span>
                        <strong>${stats.bookings}</strong>
                    </div>
                    <div class="master-stat-row">
                        <span>Выручка:</span>
                        <strong>${stats.revenue.toLocaleString('ru-RU')} ₽</strong>
                    </div>
                    <div class="master-stat-row">
                        <span>Загрузка:</span>
                        <div class="workload-bar">
                            <div class="workload-fill" style="width: ${workload}%"></div>
                        </div>
                        <span>${workload}%</span>
                    </div>
                </div>
            `;
            
            masterStatsContainer.appendChild(card);
        });
    }
}

function renderReportTable() {
    const tableBody = document.getElementById('report-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (reportFilteredBookings.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 24px; color: #6c757d;">Нет данных за выбранный период</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    reportFilteredBookings.forEach(booking => {
        const row = document.createElement('tr');
        
        const dateStr = booking.date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const timeStr = booking.date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td>${dateStr}<br><small>${timeStr}</small></td>
            <td>${booking.client}</td>
            <td>${booking.service.name}</td>
            <td>${booking.master.name}</td>
            <td>${booking.amount.toLocaleString('ru-RU')} ₽</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function exportReport() {
    if (reportFilteredBookings.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    // Формируем CSV
    let csv = 'Дата;Время;Клиент;Услуга;Мастер;Сумма\n';
    
    reportFilteredBookings.forEach(booking => {
        const dateStr = booking.date.toLocaleDateString('ru-RU');
        const timeStr = booking.date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        csv += `${dateStr};${timeStr};${booking.client};${booking.service.name};${booking.master.name};${booking.amount}\n`;
    });
    
    // Добавляем итоги
    const totalRevenue = reportFilteredBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.amount, 0);
    csv += `\nИтого;;;${reportFilteredBookings.length} записей;;${totalRevenue} ₽\n`;
    
    // Создаём и скачиваем файл
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'report_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
}

// ==================== ОТЗЫВЫ ====================

// Мок-данные для отзывов
let reviewData = [];
let filteredReviews = [];

function generateReviewData() {
    const masters = ['Алексей', 'Дмитрий', 'Сергей', 'Михаил'];
    const services = ['Мужская стрижка', 'Стрижка машинкой', 'Моделирование бороды', 'Детская стрижка', 'Комплекс (стрижка + борода)', 'Камуфляж седины'];
    const clients = [
        { name: 'Иван Петров', initial: 'И' },
        { name: 'Сергей Иванов', initial: 'С' },
        { name: 'Алексей Смирнов', initial: 'А' },
        { name: 'Дмитрий Козлов', initial: 'Д' },
        { name: 'Михаил Новиков', initial: 'М' },
        { name: 'Андрей Морозов', initial: 'А' },
        { name: 'Владимир Волков', initial: 'В' },
        { name: 'Николай Соколов', initial: 'Н' },
        { name: 'Павел Кузнецов', initial: 'П' },
        { name: 'Роман Попов', initial: 'Р' },
        { name: 'Евгений Лебедев', initial: 'Е' },
        { name: 'Артём Павлов', initial: 'А' }
    ];
    
    const reviewTexts = [
        'Отличная стрижка, мастер настоящий профессионал! Обязательно приду ещё.',
        'Всё понравилось, качественно и быстро. Рекомендую!',
        'Хороший сервис, приятная атмосфера. Мастер учёл все пожелания.',
        'Немного не угадал с длиной, но в целом неплохо. Мастер старался.',
        'Лучший барбершоп в городе! Всегда отличный результат.',
        'Профессиональный подход, внимательное отношение к клиенту. Спасибо!',
        'Отличное место, чтобы привести себя в порядок. Буду приходить постоянно.',
        'Мастер предложил отличный вариант стрижки, результат превзошёл ожидания.',
        'Всё супер! Чисто, аккуратно, вежливый персонал. Цены адекватные.',
        'Хорошо подстригли бороду, учли все пожелания. Рекомендую этого мастера.',
        'Приятно удивлён качеством обслуживания. Обязательно вернусь!',
        'Делал комплексную стрижку с бородой — результат отличный. Спасибо мастеру!'
    ];
    
    reviewData = [];
    const today = new Date();
    
    // Генерируем 24 отзыва за последние 60 дней
    for (let i = 0; i < 24; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        
        const client = clients[Math.floor(Math.random() * clients.length)];
        const master = masters[Math.floor(Math.random() * masters.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const rating = Math.random() > 0.15 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1;
        const text = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        
        reviewData.push({
            id: 'RV-' + String(i + 1).padStart(3, '0'),
            client: client,
            master: master,
            service: service,
            rating: rating,
            text: text,
            date: date
        });
    }
    
    // Сортируем по дате (сначала новые)
    reviewData.sort((a, b) => b.date - a.date);
    filteredReviews = [...reviewData];
}

function updateReviews() {
    if (reviewData.length === 0) {
        generateReviewData();
    }
    
    populateReviewFilters();
    applyReviewFilters();
}

function populateReviewFilters() {
    const masterSelect = document.getElementById('review-master-filter');
    if (masterSelect && masterSelect.options.length <= 1) {
        const masters = [...new Set(reviewData.map(r => r.master))];
        masters.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            masterSelect.appendChild(option);
        });
    }
}

function applyReviewFilters() {
    const masterFilter = document.getElementById('review-master-filter')?.value;
    const ratingFilter = document.getElementById('review-rating-filter')?.value;
    
    filteredReviews = reviewData.filter(review => {
        if (masterFilter && review.master !== masterFilter) return false;
        if (ratingFilter && review.rating !== parseInt(ratingFilter)) return false;
        return true;
    });
    
    updateReviewSummary();
    renderReviews();
}

function resetReviewFilters() {
    document.getElementById('review-master-filter').value = '';
    document.getElementById('review-rating-filter').value = '';
    applyReviewFilters();
}

function updateReviewSummary() {
    const totalReviews = filteredReviews.length;
    const avgRating = totalReviews > 0
        ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : '0.0';
    
    document.getElementById('review-avg-rating').textContent = avgRating;
    document.getElementById('review-total-count').textContent = totalReviews;
}

function renderReviews() {
    const container = document.getElementById('reviews-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filteredReviews.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">Отзывов за выбранный период не найдено</div>';
        return;
    }
    
    filteredReviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        const dateStr = review.date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        card.innerHTML = `
            <div class="review-card-header">
                <div class="review-client-info">
                    <div class="review-client-avatar">${review.client.initial}</div>
                    <div>
                        <div class="review-client-name">${review.client.name}</div>
                        <div class="review-date">${dateStr}</div>
                    </div>
                </div>
                <div class="review-rating-stars">${stars}</div>
            </div>
            <div class="review-service-info">
                <span><i class="fas fa-cut"></i> ${review.service}</span>
                <span><i class="fas fa-user"></i> ${review.master}</span>
            </div>
            <div class="review-text">${review.text}</div>
        `;
        
        container.appendChild(card);
    });
}

// ==================== РАСПИСАНИЕ (ПАНЕЛЬ УПРАВЛЕНИЯ) ====================

// Состояние расписания
let scheduleCalendarDate = new Date();
let scheduleSelectedDate = null;
let scheduleSelectedMaster = 'all';
let scheduleBookings = [];
let scheduleCurrentBookingId = null;

// Мок-данные для расписания
const scheduleMasters = [
    { id: '1', name: 'Алексей Петров', shortName: 'Алексей' },
    { id: '2', name: 'Дмитрий Смирнов', shortName: 'Дмитрий' },
    { id: '3', name: 'Михаил Иванов', shortName: 'Михаил' }
];

const scheduleClients = [
    'Петр Сидоров', 'Андрей Козлов', 'Сергей Иванов', 'Иван Петров',
    'Алексей Смирнов', 'Дмитрий Козлов', 'Михаил Новиков', 'Владимир Волков',
    'Николай Соколов', 'Павел Кузнецов', 'Роман Попов', 'Евгений Лебедев'
];

const scheduleServices = [
    'Мужская стрижка', 'Бритье', 'Стрижка бороды', 'Комплекс "Все включено"',
    'Стрижка машинкой', 'Моделирование бороды', 'Детская стрижка', 'Камуфляж седины'
];

function generateScheduleData() {
    scheduleBookings = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Генерируем записи на ближайшие 14 дней
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        
        // Пропускаем выходные
        if (date.getDay() === 0) continue;
        
        // Генерируем 3-6 записей на день
        const bookingsCount = 3 + Math.floor(Math.random() * 4);
        const usedSlots = new Set();
        
        for (let i = 0; i < bookingsCount; i++) {
            // Выбираем случайный час с 10 до 18
            let hour;
            do {
                hour = 10 + Math.floor(Math.random() * 8);
            } while (usedSlots.has(hour));
            usedSlots.add(hour);
            
            const master = scheduleMasters[Math.floor(Math.random() * scheduleMasters.length)];
            const client = scheduleClients[Math.floor(Math.random() * scheduleClients.length)];
            const service = scheduleServices[Math.floor(Math.random() * scheduleServices.length)];
            
            const statuses = ['confirmed', 'pending', 'cancelled'];
            const weights = [0.6, 0.3, 0.1];
            let random = Math.random();
            let status = 'confirmed';
            for (let s = 0; s < statuses.length; s++) {
                if (random < weights[s]) {
                    status = statuses[s];
                    break;
                }
                random -= weights[s];
            }
            
            const bookingDate = new Date(date);
            bookingDate.setHours(hour, 0, 0, 0);
            
            scheduleBookings.push({
                id: 'SCH-' + String(scheduleBookings.length + 1).padStart(4, '0'),
                date: bookingDate,
                master: master,
                client: client,
                service: service,
                status: status,
                comment: Math.random() > 0.7 ? 'Особых пожеланий нет' : '',
                price: 1200 + Math.floor(Math.random() * 1800)
            });
        }
    }
}

function initSchedule() {
    if (scheduleBookings.length === 0) {
        generateScheduleData();
    }
    renderScheduleCalendar();
    renderScheduleTimeline();
}

function renderScheduleCalendar() {
    const year = scheduleCalendarDate.getFullYear();
    const month = scheduleCalendarDate.getMonth();
    
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    document.getElementById('schedule-calendar-month-year').textContent =
        `${monthNames[month]} ${year}`;
    
    const daysContainer = document.getElementById('schedule-calendar-days');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Дни предыдущего месяца
    const startDayOfWeek = firstDay.getDay() || 7;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = startDayOfWeek - 1; i > 0; i--) {
        const dayElement = createScheduleDayElement(prevMonthLastDay - i + 1, true, false, false, false);
        daysContainer.appendChild(dayElement);
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;
        const isSelected = scheduleSelectedDate &&
            date.getDate() === scheduleSelectedDate.getDate() &&
            date.getMonth() === scheduleSelectedDate.getMonth() &&
            date.getFullYear() === scheduleSelectedDate.getFullYear();
        
        // Считаем количество записей на этот день
        const dayBookings = scheduleBookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getDate() === day &&
                   bDate.getMonth() === month &&
                   bDate.getFullYear() === year &&
                   b.status !== 'cancelled';
        });
        
        const dayElement = createScheduleDayElement(day, false, isToday, isPast, isSelected, dayBookings.length);
        daysContainer.appendChild(dayElement);
    }
    
    // Дни следующего месяца
    const totalDays = startDayOfWeek - 1 + lastDay.getDate();
    const remainingCells = 7 - (totalDays % 7 || 7);
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createScheduleDayElement(day, true, false, false, false);
        daysContainer.appendChild(dayElement);
    }
}

function createScheduleDayElement(day, isOtherMonth, isToday, isPast, isSelected, bookingCount) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.textContent = day;
    
    if (isOtherMonth) {
        div.classList.add('other-month');
    } else {
        if (isPast) {
            div.classList.add('disabled');
        } else {
            div.addEventListener('click', function() {
                selectScheduleDay(day);
            });
        }
        if (isToday) div.classList.add('today');
        if (isSelected) div.classList.add('selected');
        
        // Добавляем индикатор записей
        if (bookingCount > 0 && !isPast) {
            const indicator = document.createElement('div');
            indicator.className = 'calendar-day-badge';
            indicator.textContent = bookingCount;
            div.appendChild(indicator);
        }
    }
    
    return div;
}

function selectScheduleDay(day) {
    const year = scheduleCalendarDate.getFullYear();
    const month = scheduleCalendarDate.getMonth();
    
    scheduleSelectedDate = new Date(year, month, day);
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#schedule-calendar-days .calendar-day').forEach(el => {
        el.classList.remove('selected');
    });
    
    const days = document.querySelectorAll('#schedule-calendar-days .calendar-day:not(.other-month):not(.disabled)');
    days.forEach(el => {
        if (parseInt(el.textContent) === day) {
            el.classList.add('selected');
        }
    });
    
    // Показываем информацию о выбранной дате
    const infoContainer = document.getElementById('schedule-selected-date-info');
    const infoText = document.getElementById('schedule-selected-date-text');
    
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    infoText.textContent = `${day} ${monthNames[month]} ${year}, ${dayNames[scheduleSelectedDate.getDay()]}`;
    infoContainer.style.display = 'flex';
    
    // Обновляем временную шкалу
    renderScheduleTimeline();
}

function prevScheduleMonth() {
    scheduleCalendarDate.setMonth(scheduleCalendarDate.getMonth() - 1);
    scheduleSelectedDate = null;
    document.getElementById('schedule-selected-date-info').style.display = 'none';
    renderScheduleCalendar();
    renderScheduleTimeline();
}

function nextScheduleMonth() {
    scheduleCalendarDate.setMonth(scheduleCalendarDate.getMonth() + 1);
    scheduleSelectedDate = null;
    document.getElementById('schedule-selected-date-info').style.display = 'none';
    renderScheduleCalendar();
    renderScheduleTimeline();
}

function selectScheduleMaster(btn, masterId) {
    document.querySelectorAll('.master-filter-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    scheduleSelectedMaster = masterId;
    renderScheduleTimeline();
}

function renderScheduleTimeline() {
    const timeline = document.getElementById('schedule-timeline');
    timeline.innerHTML = '';
    
    if (!scheduleSelectedDate) {
        timeline.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><p>Выберите дату для просмотра расписания</p></div>';
        return;
    }
    
    // Часы работы с 10:00 до 20:00
    for (let hour = 10; hour <= 19; hour++) {
        const timeStart = `${hour.toString().padStart(2, '0')}:00`;
        const timeEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        const row = document.createElement('div');
        row.className = 'schedule-hour-row';
        
        // Метка времени
        const label = document.createElement('div');
        label.className = 'schedule-hour-label';
        label.textContent = timeStart;
        row.appendChild(label);
        
        // Слот
        const slot = document.createElement('div');
        slot.className = 'schedule-slot';
        
        // Ищем записи на этот час для выбранной даты и мастера
        const bookingsInSlot = scheduleBookings.filter(b => {
            const bDate = new Date(b.date);
            const matchesDate = bDate.getDate() === scheduleSelectedDate.getDate() &&
                bDate.getMonth() === scheduleSelectedDate.getMonth() &&
                bDate.getFullYear() === scheduleSelectedDate.getFullYear();
            const matchesHour = bDate.getHours() === hour;
            const matchesMaster = scheduleSelectedMaster === 'all' || b.master.id === scheduleSelectedMaster;
            return matchesDate && matchesHour && matchesMaster;
        });
        
        if (bookingsInSlot.length > 0) {
            bookingsInSlot.forEach(booking => {
                const card = document.createElement('div');
                card.className = `schedule-booking-card status-${booking.status}`;
                card.onclick = function() { showBookingDetail(booking.id); };
                
                const statusTexts = {
                    'confirmed': 'Подтверждено',
                    'pending': 'Ожидает',
                    'cancelled': 'Отменено'
                };
                
                card.innerHTML = `
                    <div class="booking-time">${timeStart} - ${timeEnd}</div>
                    <div class="booking-client">${booking.client}</div>
                    <div class="booking-service">${booking.service} · ${booking.master.shortName}</div>
                    <div class="booking-status-badge">${statusTexts[booking.status]}</div>
                `;
                
                slot.appendChild(card);
            });
        } else {
            // Свободный слот
            const freeSlot = document.createElement('div');
            freeSlot.className = 'schedule-slot free';
            
            const freeBtn = document.createElement('button');
            freeBtn.className = 'free-slot-btn';
            freeBtn.innerHTML = '<i class="fas fa-plus"></i> Свободно';
            freeBtn.onclick = function() {
                showScheduleCreateBooking(timeStart);
            };
            
            freeSlot.appendChild(freeBtn);
            slot.appendChild(freeSlot);
        }
        
        row.appendChild(slot);
        timeline.appendChild(row);
    }
}

function showBookingDetail(bookingId) {
    scheduleCurrentBookingId = bookingId;
    const booking = scheduleBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modal = document.getElementById('booking-detail-modal');
    const body = document.getElementById('booking-detail-body');
    
    const dateStr = booking.date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeStr = booking.date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const statusTexts = {
        'confirmed': 'Подтверждено',
        'pending': 'Ожидает подтверждения',
        'cancelled': 'Отменено'
    };
    
    const statusColors = {
        'confirmed': '#28a745',
        'pending': '#ffc107',
        'cancelled': '#dc3545'
    };
    
    body.innerHTML = `
        <div class="detail-row">
            <span>Клиент:</span>
            <strong>${booking.client}</strong>
        </div>
        <div class="detail-row">
            <span>Услуга:</span>
            <span>${booking.service}</span>
        </div>
        <div class="detail-row">
            <span>Мастер:</span>
            <span>${booking.master.name}</span>
        </div>
        <div class="detail-row">
            <span>Дата:</span>
            <span>${dateStr}</span>
        </div>
        <div class="detail-row">
            <span>Время:</span>
            <span>${timeStr}</span>
        </div>
        <div class="detail-row">
            <span>Стоимость:</span>
            <strong>${booking.price.toLocaleString('ru-RU')} ₽</strong>
        </div>
        <div class="detail-row">
            <span>Статус:</span>
            <span style="color: ${statusColors[booking.status]}; font-weight: 600;">${statusTexts[booking.status]}</span>
        </div>
        ${booking.comment ? `
        <div class="detail-row">
            <span>Комментарий:</span>
            <span>${booking.comment}</span>
        </div>` : ''}
    `;
    
    modal.style.display = 'flex';
}

function closeBookingDetail() {
    document.getElementById('booking-detail-modal').style.display = 'none';
    scheduleCurrentBookingId = null;
}

function editBooking() {
    closeBookingDetail();
    alert('Функция редактирования записи будет доступна в следующей версии');
}

function cancelBooking() {
    if (!scheduleCurrentBookingId) return;
    
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) return;
    
    const booking = scheduleBookings.find(b => b.id === scheduleCurrentBookingId);
    if (booking) {
        booking.status = 'cancelled';
    }
    
    closeBookingDetail();
    renderScheduleTimeline();
    
    // Обновляем календарь (индикаторы)
    renderScheduleCalendar();
}

function showScheduleCreateBooking(prefilledTime) {
    closeBookingDetail();
    
    const dateStr = scheduleSelectedDate
        ? scheduleSelectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        : 'не выбрана';
    
    const timeStr = prefilledTime || 'удобное время';
    
    alert(`Создание новой записи на ${dateStr} в ${timeStr}\n\nФункция будет доступна в следующей версии`);
}

// Экспорт функций расписания
window.initSchedule = initSchedule;
window.selectScheduleMaster = selectScheduleMaster;
window.prevScheduleMonth = prevScheduleMonth;
window.nextScheduleMonth = nextScheduleMonth;
window.showBookingDetail = showBookingDetail;
window.closeBookingDetail = closeBookingDetail;
window.editBooking = editBooking;
window.cancelBooking = cancelBooking;
window.showScheduleCreateBooking = showScheduleCreateBooking;

// Экспорт функций отзывов
window.updateReviews = updateReviews;
window.applyReviewFilters = applyReviewFilters;
window.resetReviewFilters = resetReviewFilters;

// Экспорт функций отчётов
window.updateReports = updateReports;
window.applyReportFilters = applyReportFilters;
window.resetReportFilters = resetReportFilters;
window.exportReport = exportReport;