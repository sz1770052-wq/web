// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let cart = {
    items: [],
    total: 0,
    count: 0
};

let favorites = {
    items: []
};

let currentUser = null;

$(document).ready(function () {
    // === 1. ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===
    checkCurrentUser();

    // === 2. МОДАЛЬНЫЕ ОКНА ПРОФИЛЯ ===
    $('#profileBtn').on('click', function (e) {
        e.preventDefault();
        if (currentUser) {
            // Если пользователь уже вошел, показываем информацию
            showUserInfo();
        } else {
            // Если не вошел, показываем окно регистрации
            $('#registerModal').fadeIn();
        }
    });

    // Кнопка входа для админа
    $('#showAdminLogin, #showAdminLoginFromLogin').on('click', function (e) {
        e.preventDefault();
        $('#registerModal').fadeOut();
        $('#loginModal').fadeIn();
    });

    // Переключение между окнами
    $('#showLogin').on('click', function (e) {
        e.preventDefault();
        $('#registerModal').fadeOut();
        $('#loginModal').fadeIn();
    });

    $('#showRegister').on('click', function (e) {
        e.preventDefault();
        $('#loginModal').fadeOut();
        $('#registerModal').fadeIn();
    });

    // Кнопка администратора
    $('#adminBtn').on('click', function (e) {
        e.preventDefault();
        showAdminPanel();
    });

    // Закрытие модальных окон при клике на крестик или фон
    $(document).on('click', function (e) {
        // Закрытие окна регистрации
        if ($(e.target).hasClass('modal') && !$(e.target).hasClass('modal-content')) {
            $('#registerModal').fadeOut();
            $('#loginModal').fadeOut();
            $('#adminModal').fadeOut();
            $('#productEditModal').fadeOut();
            $('#companyInfoModal').fadeOut();
            $('#infoModal').fadeOut();
        }
    });

    $('.close').on('click', function (e) {
        $(this).closest('.modal').fadeOut();
    });

    // === 3. ФОРМА РЕГИСТРАЦИИ ===
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();
        if (validateRegisterForm()) {
            registerUser();
        }
    });

    // === 4. ФОРМА ВХОДА ===
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        if (validateLoginForm()) {
            loginUser();
        }
    });

    // === 5. ФОРМА РЕДАКТИРОВАНИЯ ТОВАРА ===
    $('#productEditForm').on('submit', function (e) {
        e.preventDefault();
        saveProduct();
    });

    $('#cancelEdit').on('click', function () {
        $('#productEditModal').fadeOut();
    });

    // === 6. ТАБЫ АДМИН-ПАНЕЛИ ===
    $('.admin-tab').on('click', function () {
        const tab = $(this).data('tab');
        $('.admin-tab').removeClass('active');
        $(this).addClass('active');
        $('.admin-tab-content').removeClass('active');
        $(`#admin${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).addClass('active');

        if (tab === 'products') {
            loadAdminProducts();
        } else if (tab === 'users') {
            loadAdminUsers();
        } else if (tab === 'stats') {
            loadAdminStats();
        }
    });

    // Кнопка добавления товара
    $('#addProductBtn').on('click', function () {
        showAddProductForm();
    });

    // === 7. ИНИЦИАЛИЗАЦИЯ ===
    loadCart();
    loadFavorites();
    initSearch();
    initCartModal();
    initFavoritesModal();
    addRefreshButton();
    initCatalogFilters();
    initFooterLinks();
    initCategoryCards();
   

    // === 8. ВАЛИДАЦИЯ ПОЛЕЙ ФОРМ ===
    $('#name, #email, #phone, #password, #confirmPassword').on('blur', function () {
        validateField($(this));
    });

    $('#loginEmail, #loginPassword').on('blur', function () {
        validateLoginField($(this));
    });

    // === 9. ЗАГРУЗКА ТОВАРОВ ===
    loadProducts();
});

// === СИСТЕМА АВТОРИЗАЦИИ ===

// Проверка текущего пользователя
function checkCurrentUser() {
    const savedUser = localStorage.getItem('pharmacy_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
    }
}

// Обновление интерфейса в зависимости от роли
function updateUserInterface() {
    if (currentUser) {
        $('#profileLabel').text(currentUser.name.split(' ')[0]);
        $('#userBadge').show();

        if (currentUser.role === 'admin') {
            $('#userBadge').html('<i class="fas fa-crown"></i>').css({
                'background': '#ff9800',
                'position': 'absolute',
                'top': '0',
                'right': '5px',
                'color': 'white',
                'border-radius': '50%',
                'width': '22px',
                'height': '22px',
                'font-size': '0.8rem',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'border': '2px solid white',
                'box-shadow': '0 2px 5px rgba(0,0,0,0.2)'
            });
            $('#adminBtn').show();
        } else {
            $('#userBadge').html('<i class="fas fa-user"></i>').css({
                'background': '#727d71',
                'position': 'absolute',
                'top': '0',
                'right': '5px',
                'color': 'white',
                'border-radius': '50%',
                'width': '22px',
                'height': '22px',
                'font-size': '0.8rem',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'border': '2px solid white',
                'box-shadow': '0 2px 5px rgba(0,0,0,0.2)'
            });
            $('#adminBtn').hide();
        }
    } else {
        $('#profileLabel').text('Профиль');
        $('#userBadge').hide();
        $('#adminBtn').hide();
    }
}

// Валидация формы регистрации
function validateRegisterForm() {
    let isValid = true;

    $('#registerForm input').each(function () {
        if (!validateField($(this))) {
            isValid = false;
        }
    });
    return isValid;
}

// Регистрация пользователя
function registerUser() {
    const userData = {
        name: $('#name').val().trim(),
        email: $('#email').val().trim(),
        phone: $('#phone').val().trim(),
        password: $('#password').val()
    };

    const $submitBtn = $('#registerForm .submit-btn');
    $submitBtn.prop('disabled', true).text('Регистрация...');

    // Проверяем, есть ли пользователь с таким email
    $.getJSON('users.json', function (data) {
        const existingUser = data.users.find(user => user.email === userData.email);

        if (existingUser) {
            $('#email').addClass('invalid');
            $('#email').siblings('.error-message').text('Пользователь с таким email уже существует');
            $submitBtn.prop('disabled', false).text('Зарегистрироваться');
            return;
        }

        // Создаем нового пользователя
        const newUser = {
            id: data.users.length + 1,
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: 'user',
            phone: userData.phone,
            registeredAt: new Date().toISOString().split('T')[0]
        };

        // В реальном проекте здесь был бы AJAX запрос к серверу
        // Для учебного проекта просто сохраняем в localStorage

        // Обновляем список пользователей
        data.users.push(newUser);

        // Сохраняем пользователя в localStorage
        currentUser = newUser;
        localStorage.setItem('pharmacy_user', JSON.stringify(currentUser));

        // Показываем успешную регистрацию
        $('#registerForm').prepend(
            '<div class="success-message">Регистрация прошла успешно!</div>'
        );

        setTimeout(function () {
            $('#registerModal').fadeOut();
            $('#registerForm')[0].reset();
            $('.success-message').remove();
            $('#registerForm input').removeClass('valid');
            $submitBtn.prop('disabled', false).text('Зарегистрироваться');

            // Обновляем интерфейс
            updateUserInterface();
            showNotification(`Добро пожаловать, ${userData.name}!`);
        }, 2000);
    }).fail(function () {
        showNotification('Ошибка при регистрации. Попробуйте еще раз.');
        $submitBtn.prop('disabled', false).text('Зарегистрироваться');
    });
}

// Валидация поля формы входа
function validateLoginField($field) {
    const value = $field.val().trim();
    const $error = $field.siblings('.error-message');

    $field.removeClass('valid invalid');
    $error.text('');

    if (!value) {
        $field.addClass('invalid');
        $error.text('Это поле обязательно для заполнения');
        return false;
    }

    $field.addClass('valid');
    return true;
}

// Валидация формы входа
function validateLoginForm() {
    let isValid = true;

    $('#loginForm input').each(function () {
        if (!validateLoginField($(this))) {
            isValid = false;
        }
    });
    return isValid;
}

// Вход пользователя
function loginUser() {
    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();

    const $submitBtn = $('#loginForm .submit-btn');
    $submitBtn.prop('disabled', true).text('Вход...');

    // Проверяем пользователя в users.json
    $.getJSON('users.json', function (data) {
        const user = data.users.find(u => u.email === email && u.password === password);

        if (user) {
            // Сохраняем пользователя в localStorage
            currentUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone
            };
            localStorage.setItem('pharmacy_user', JSON.stringify(currentUser));

            // Показываем успешный вход
            $('#loginForm').prepend(
                '<div class="success-message">Вход выполнен успешно!</div>'
            );

            setTimeout(function () {
                $('#loginModal').fadeOut();
                $('#loginForm')[0].reset();
                $('.success-message').remove();
                $('#loginForm input').removeClass('valid');
                $submitBtn.prop('disabled', false).text('Войти');

                // Обновляем интерфейс
                updateUserInterface();
                showNotification(`Добро пожаловать, ${user.name}!`);
            }, 1500);
        } else {
            $('#loginEmail').addClass('invalid');
            $('#loginPassword').addClass('invalid');
            $('#loginEmail').siblings('.error-message').text('Неверный email или пароль');
            $('#loginPassword').siblings('.error-message').text('Неверный email или пароль');
            $submitBtn.prop('disabled', false).text('Войти');
        }
    }).fail(function () {
        showNotification('Ошибка при входе. Попробуйте еще раз.');
        $submitBtn.prop('disabled', false).text('Войти');
    });
}

// Показ информации о пользователе
function showUserInfo() {
    showInfoModal(
        'Ваш профиль',
        `<p><strong>Имя:</strong> ${currentUser.name}</p>
         <p><strong>Email:</strong> ${currentUser.email}</p>
         <p><strong>Телефон:</strong> ${currentUser.phone || 'Не указан'}</p>
         <p><strong>Роль:</strong> ${currentUser.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
         <div style="margin-top: 20px; text-align: center;">
            <button id="logoutBtn" class="submit-btn" style="background: #f44336;">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </button>
         </div>`
    );

    // Обработчик кнопки выхода
    setTimeout(() => {
        $('#logoutBtn').on('click', function () {
            logoutUser();
        });
    }, 100);
}

// Выход пользователя
function logoutUser() {
    localStorage.removeItem('pharmacy_user');
    currentUser = null;
    updateUserInterface();
    $('#infoModal').fadeOut();
    showNotification('Вы вышли из системы');
}

// === АДМИН-ПАНЕЛЬ ===

// Показ админ-панели
function showAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ запрещен. Требуются права администратора.');
        return;
    }

    $('#adminModal').fadeIn();
    loadAdminProducts();
}

// Загрузка товаров для админ-панели
function loadAdminProducts() {
    $('#adminProductsList').html(`
        <div class="loading-indicator" style="padding: 20px;">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка товаров...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            let productsHTML = '';

            if (data.products.length === 0) {
                productsHTML = '<p style="text-align: center; color: #727d71;">Товары не найдены</p>';
            } else {
                data.products.forEach(product => {
                    productsHTML += `
                        <div class="admin-product-item" style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; gap: 15px;">
                            <div style="width: 50px; height: 50px; background: #f5f5f5; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                                <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.title}" style="max-width: 40px; max-height: 40px;">
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${product.title}</div>
                                <div style="font-size: 14px; color: #727d71;">${formatPrice(product.price)} • ${getCategoryName(product.category)}</div>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button class="edit-product-btn" data-id="${product.id}" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-product-btn" data-id="${product.id}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            $('#adminProductsList').html(productsHTML);

            // Обработчики кнопок редактирования и удаления
            $('.edit-product-btn').on('click', function () {
                const productId = $(this).data('id');
                editProduct(productId);
            });

            $('.delete-product-btn').on('click', function () {
                const productId = $(this).data('id');
                if (confirm('Вы уверены, что хотите удалить этот товар?')) {
                    deleteProduct(productId);
                }
            });
        }
    });
}

// Получение названия категории
function getCategoryName(category) {
    const categoryMap = {
        'medicine': 'Лекарства',
        'vitamins': 'Витамины и БАД',
        'hygiene': 'Гигиена и уход',
        'medtech': 'Мед. техника',
        'baby': 'Мама и малыш',
        'vision': 'Зрение',
        'medical': 'Мед. изделия',
        'cosmetics': 'Косметика',
        'allergy': 'Аллергия',
        'orthopedics': 'Ортопедия',
        'sports': 'Диета и спорт'
    };
    return categoryMap[category] || category;
}

// Показ формы добавления товара
function showAddProductForm() {
    $('#productModalTitle').text('Добавить товар');
    $('#editProductId').val('');
    $('#productEditForm')[0].reset();
    $('#productEditModal').fadeIn();
}

// Редактирование товара
function editProduct(productId) {
    $.getJSON('products.json', function (data) {
        const product = data.products.find(p => p.id == productId);
        if (product) {
            $('#productModalTitle').text('Редактировать товар');
            $('#editProductId').val(product.id);
            $('#editTitle').val(product.title);
            $('#editDescription').val(product.description || '');
            $('#editPrice').val(product.price);
            $('#editOldPrice').val(product.oldPrice || '');
            $('#editCategory').val(product.category);
            $('#editImage').val(product.image || '');
            $('#editRating').val(product.rating || '');
            $('#editBadge').val(product.badge || '');
            $('#productEditModal').fadeIn();
        }
    });
}

// Сохранение товара
function saveProduct() {
    const productId = $('#editProductId').val();
    const productData = {
        title: $('#editTitle').val().trim(),
        description: $('#editDescription').val().trim(),
        price: parseInt($('#editPrice').val()),
        oldPrice: $('#editOldPrice').val() ? parseInt($('#editOldPrice').val()) : null,
        category: $('#editCategory').val(),
        image: $('#editImage').val().trim(),
        rating: $('#editRating').val() ? parseFloat($('#editRating').val()) : null,
        badge: $('#editBadge').val().trim() || ''
    };

    // Валидация
    if (!productData.title || !productData.price) {
        showNotification('Заполните обязательные поля');
        return;
    }

    $.getJSON('products.json', function (data) {
        if (productId) {
            // Редактирование существующего товара
            const index = data.products.findIndex(p => p.id == productId);
            if (index !== -1) {
                data.products[index] = {
                    ...data.products[index],
                    ...productData
                };
                showNotification('Товар успешно обновлен');
            }
        } else {
            // Добавление нового товара
            const newId = Math.max(...data.products.map(p => p.id)) + 1;
            const newProduct = {
                id: newId,
                ...productData
            };
            data.products.push(newProduct);
            showNotification('Товар успешно добавлен');
        }


        $('#productEditModal').fadeOut();
        loadAdminProducts();
        loadProducts(); // Обновляем основной список товаров
    });
}

// Удаление товара
function deleteProduct(productId) {
    $.getJSON('products.json', function (data) {
        const index = data.products.findIndex(p => p.id == productId);
        if (index !== -1) {
            data.products.splice(index, 1);


            showNotification('Товар успешно удален');
            loadAdminProducts();
            loadProducts(); // Обновляем основной список товаров
        }
    });
}

// Загрузка пользователей для админ-панели
function loadAdminUsers() {
    $('#adminUsersList').html(`
        <div class="loading-indicator" style="padding: 20px;">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка пользователей...</p>
        </div>
    `);

    $.getJSON('users.json', function (data) {
        let usersHTML = '';

        if (data.users.length === 0) {
            usersHTML = '<p style="text-align: center; color: #727d71;">Пользователи не найдены</p>';
        } else {
            usersHTML += `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Имя</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Email</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Роль</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Дата регистрации</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.users.forEach(user => {
                usersHTML += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.name}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <span style="padding: 3px 8px; border-radius: 12px; font-size: 12px; background: ${user.role === 'admin' ? '#ff9800' : '#727d71'}; color: white;">
                                ${user.role === 'admin' ? 'Админ' : 'Пользователь'}
                            </span>
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.registeredAt}</td>
                    </tr>
                `;
            });

            usersHTML += '</tbody></table>';
        }

        $('#adminUsersList').html(usersHTML);
    });
}

// Загрузка статистики для админ-панели
function loadAdminStats() {
    // Загружаем данные из разных источников
    $.when(
        $.getJSON('products.json'),
        $.getJSON('users.json')
    ).done(function (productsData, usersData) {
        const products = productsData[0].products;
        const users = usersData[0].users;

        // Общее количество товаров
        $('#totalProducts').text(products.length);

        // Общее количество пользователей
        $('#totalUsers').text(users.length);

        // Всего заказов (из localStorage)
        let totalOrders = 0;
        let totalRevenue = 0;

        // В реальном проекте здесь была бы статистика заказов
        // Для учебного проекта используем фиктивные данные
        totalOrders = Math.floor(Math.random() * 100) + 50;
        totalRevenue = totalOrders * 1500;

        $('#totalOrders').text(totalOrders);
        $('#totalRevenue').text(formatPrice(totalRevenue));

        // Последние действия
        const activity = [
            `Новый пользователь: ${users[users.length - 1]?.name || 'Гость'}`,
            `Добавлен товар: ${products[products.length - 1]?.title || 'Новый товар'}`,
            `Оформлен заказ на сумму: ${formatPrice(Math.floor(Math.random() * 5000) + 1000)}`,
            'Обновлен каталог товаров',
            'Проведена инвентаризация'
        ];

        let activityHTML = '';
        activity.forEach(item => {
            activityHTML += `
                <div style="padding: 8px 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-circle" style="color: #4CAF50; font-size: 8px;"></i>
                    <span>${item}</span>
                    <span style="margin-left: auto; color: #727d71; font-size: 12px;">Сегодня</span>
                </div>
            `;
        });

        $('#recentActivity').html(activityHTML);
    });
}

// === ОСТАЛЬНЫЕ ФУНКЦИИ (из предыдущей версии) ===

// ИНИЦИАЛИЗАЦИЯ ССЫЛОК В ПОДВАЛЕ
function initFooterLinks() {
    $('.footer-link').on('click', function (e) {
        e.preventDefault();
        const type = $(this).data('type');
        showCompanyInfo(type);
    });
}

// ИНИЦИАЛИЗАЦИЯ КЛИКАБЕЛЬНЫХ КАТЕГОРИЙ
function initCategoryCards() {
    $('.category-card').on('click', function () {
        const category = $(this).data('category');
        if (category) {
            filterByCategory(category);
        }
    });
}



// === ФУНКЦИЯ ВАЛИДАЦИИ ПОЛЯ ===
function validateField($field) {
    const fieldName = $field.attr('name');
    const value = $field.val().trim();
    const $error = $field.siblings('.error-message');

    $field.removeClass('valid invalid');
    $error.text('');

    if (!value) {
        $field.addClass('invalid');
        $error.text('Это поле обязательно для заполнения');
        return false;
    }

    let isValid = true;

    switch (fieldName) {
        case 'name':
            if (value.length < 2) {
                $field.addClass('invalid');
                $error.text('Имя должно содержать минимум 2 символа');
                isValid = false;
            } else if (!/^[а-яА-ЯёЁa-zA-Z\s]+$/.test(value)) {
                $field.addClass('invalid');
                $error.text('Имя может содержать только буквы');
                isValid = false;
            } else {
                $field.addClass('valid');
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                $field.addClass('invalid');
                $error.text('Введите корректный email');
                isValid = false;
            } else {
                $field.addClass('valid');
            }
            break;
        case 'phone':
            const phoneRegex = /^\+?[78][-\(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                $field.addClass('invalid');
                $error.text('Введите корректный номер телефона');
                isValid = false;
            } else {
                $field.addClass('valid');
            }
            break;
        case 'password':
            if (value.length < 6) {
                $field.addClass('invalid');
                $error.text('Пароль должен содержать минимум 6 символов');
                isValid = false;
            } else {
                $field.addClass('valid');
            }
            break;
        case 'confirmPassword':
            const password = $('#password').val().trim();
            if (value !== password) {
                $field.addClass('invalid');
                $error.text('Пароли не совпадают');
                isValid = false;
            } else {
                $field.addClass('valid');
            }
            break;
    }
    return isValid;
}

// === ФИЛЬТРАЦИЯ ПО КАТЕГОРИИ ===
function filterByCategory(category) {
    let categoryName = '';
    const categoryMap = {
        'medicine': 'Лекарства',
        'vitamins': 'Витамины и БАД',
        'hygiene': 'Гигиена и уход',
        'baby': 'Мама и малыш',
        'vision': 'Зрение',
        'medtech': 'Мед. техника',
        'medical': 'Мед. изделия',
        'cosmetics': 'Косметика',
        'allergy': 'Аллергия',
        'orthopedics': 'Ортопедия',
        'sports': 'Диета и спорт'
    };

    categoryName = categoryMap[category] || category;

    $('.products-grid').html(`
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Загружаем товары категории "${categoryName}"...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const filteredProducts = data.products.filter(product =>
                product.category === category
            );

            if (filteredProducts.length > 0) {
                displayProducts(filteredProducts);
                showNotification(`Показаны товары категории: ${categoryName} (${filteredProducts.length} шт.)`);
                initCartHandlers();
                initFavoritesHandlers();
            } else {
                $('.products-grid').html(`
                    <div class="no-products">
                        <i class="fas fa-box-open fa-3x"></i>
                        <h3>Товары не найдены</h3>
                        <p>В категории "${categoryName}" пока нет товаров</p>
                        <button onclick="loadProducts()" class="refresh-btn">
                            <i class="fas fa-redo"></i> Вернуться ко всем товарам
                        </button>
                    </div>
                `);
            }
        }
    });
}

// === ФИЛЬТРАЦИЯ ПО НЕСКОЛЬКИМ КАТЕГОРИЯМ ===
function filterMultipleCategories(categories) {
    let categoryNames = categories.map(cat => {
        const categoryMap = {
            'medicine': 'Лекарства',
            'vitamins': 'Витамины и БАД',
            'hygiene': 'Гигиена и уход',
            'baby': 'Мама и малыш',
            'vision': 'Зрение',
            'medtech': 'Мед. техника',
            'medical': 'Мед. изделия',
            'cosmetics': 'Косметика',
            'allergy': 'Аллергия',
            'orthopedics': 'Ортопедия',
            'sports': 'Диета и спорт'
        };
        return categoryMap[cat] || cat;
    }).join(' и ');

    $('.products-grid').html(`
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Загружаем товары категорий "${categoryNames}"...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const filteredProducts = data.products.filter(product =>
                categories.includes(product.category)
            );

            if (filteredProducts.length > 0) {
                displayProducts(filteredProducts);
                showNotification(`Показаны товары категорий: ${categoryNames} (${filteredProducts.length} шт.)`);
                initCartHandlers();
                initFavoritesHandlers();
            } else {
                $('.products-grid').html(`
                    <div class="no-products">
                        <i class="fas fa-box-open fa-3x"></i>
                        <h3>Товары не найдены</h3>
                        <p>В категориях "${categoryNames}" пока нет товаров</p>
                        <button onclick="loadProducts()" class="refresh-btn">
                            <i class="fas fa-redo"></i> Вернуться ко всем товарам
                        </button>
                    </div>
                `);
            }
        }
    });
}

// === ФИЛЬТРАЦИЯ ТОВАРОВ СО СКИДКОЙ ===
function filterDiscountedProducts() {
    $('.products-grid').html(`
        <div class="loading-indicator">
            <i class="fas fa-percentage fa-spin fa-2x"></i>
            <p>Загружаем товары со скидкой...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const discountedProducts = data.products.filter(product =>
                product.oldPrice && product.oldPrice > 0
            );

            if (discountedProducts.length > 0) {
                displayProducts(discountedProducts);
                showNotification(`Показаны товары со скидкой: ${discountedProducts.length} шт.`);
                initCartHandlers();
                initFavoritesHandlers();
            } else {
                $('.products-grid').html(`
                    <div class="no-products">
                        <i class="fas fa-percentage fa-3x"></i>
                        <h3>Товары со скидкой не найдены</h3>
                        <p>В данный момент акционных товаров нет</p>
                        <button onclick="loadProducts()" class="refresh-btn">
                            <i class="fas fa-redo"></i> Вернуться ко всем товарам
                        </button>
                    </div>
                `);
            }
        }
    });
}

// === ПОКАЗ ИНФОРМАЦИОННОГО ОКНА ===
function showInfoModal(title, content) {
    $('#infoModalTitle').text(title);
    $('#infoModalContent').html(content);
    $('#infoModal').fadeIn();
}

// === ПОКАЗ ИНФОРМАЦИИ О КОМПАНИИ ===
function showCompanyInfo(type) {
    let title = '';
    let content = '';

    const infoData = {
        'company': {
            title: 'О компании',
            content: 'Аптека "Пульс" работает с 2005 года. Мы предлагаем широкий ассортимент лекарственных препаратов, медицинских товаров и средств для ухода за здоровьем. Наша миссия - обеспечить доступность качественных лекарств и медицинских товаров для каждого.'
        },
        'suppliers': {
            title: 'Поставщики',
            content: 'Мы сотрудничаем только с проверенными производителями и дистрибьюторами фармацевтической продукции. Все товары имеют необходимые сертификаты качества и хранятся в соответствии с требованиями.'
        },
        'career': {
            title: 'Карьера',
            content: 'Присоединяйтесь к нашей команде! Мы всегда рады профессионалам в области фармации, логистики и клиентского сервиса. Отправьте резюме на info@puls.ru с пометкой "Вакансия".'
        },
        'media': {
            title: 'СМИ о нас',
            content: 'Аптека "Пульс" регулярно упоминается в профильных изданиях как надежный поставщик лекарственных средств. Мы активно участвуем в социальных программах и благотворительных акциях.'
        },
        'licenses': {
            title: 'Лицензии',
            content: 'Наша деятельность полностью лицензирована. Мы имеем все необходимые разрешения на фармацевтическую деятельность, включая лицензию на розничную торговлю лекарственными препаратами.'
        },
        'faq': {
            title: 'Часто задаваемые вопросы',
            content: 'Здесь вы найдете ответы на самые популярные вопросы о заказе, доставке, оплате и возврате товаров. Если не нашли ответ - свяжитесь с нашей службой поддержки.'
        },
        'order': {
            title: 'Как сделать заказ',
            content: '1. Выберите товары в каталоге<br>2. Добавьте их в корзину<br>3. Перейдите в корзину и оформите заказ<br>4. Выберите способ доставки и оплаты<br>5. Подтвердите заказ'
        },
        'delivery': {
            title: 'Оплата и доставка',
            content: 'Доставка: курьером по городу (1-2 дня), почтой по России (3-7 дней). Бесплатная доставка при заказе от 1500 руб.<br>Оплата: наличными при получении, банковской картой онлайн, безналичный расчет для юр. лиц.'
        },
        'return': {
            title: 'Возврат товара',
            content: 'Товары надлежащего качества можно вернуть в течение 7 дней с момента получения. Лекарственные препараты возврату не подлежат согласно законодательству РФ.'
        },
        'privacy': {
            title: 'Конфиденциальность',
            content: 'Мы гарантируем конфиденциальность ваших персональных данных. Информация используется только для обработки заказов и не передается третьим лицам.'
        }
    };

    if (infoData[type]) {
        title = infoData[type].title;
        content = infoData[type].content;
    } else {
        title = 'Информация';
        content = 'Информация по данному разделу временно недоступна.';
    }

    $('#modalTitle').text(title);
    $('#modalContent').html(content);
    $('#companyInfoModal').fadeIn();
}

// === ЗАГРУЗКА ТОВАРОВ ===
function loadProducts() {
    console.log('Загрузка товаров из JSON...');

    $('.products-grid').html(`
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: #6d4c3d;"></i>
            <p style="margin-top: 15px; color: #727d71;">Загружаем товары...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log('Данные получены:', data);
            console.log('Количество товаров:', data.products.length);
            displayProducts(data.products);
            initCartHandlers();
            initFavoritesHandlers();
        },
        error: function (error) {
            console.error('Ошибка загрузки:', error);
            $('.products-grid').html(`
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: #f44336;">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p style="margin-top: 15px;">Ошибка загрузки товаров</p>
                    <p style="font-size: 12px; margin-top: 5px;">${error.statusText}</p>
                    <button onclick="loadProducts()" style="
                        margin-top: 15px;
                        padding: 8px 16px;
                        background: #6d4c3d;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">
                        Попробовать снова
                    </button>
                </div>
            `);
        }
    });
}

// === ОТОБРАЖЕНИЕ ТОВАРОВ ===
function displayProducts(products) {
    const $grid = $('.products-grid');
    $grid.empty();

    if (!products || !Array.isArray(products) || products.length === 0) {
        console.error('Нет товаров для отображения:', products);
        $grid.html(`
            <div class="no-products">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить критерии поиска</p>
            </div>
        `);
        return;
    }

    console.log('Отображаю товаров:', products.length);

    products.forEach(product => {
        if (!product || !product.title) {
            console.warn('Пропущен товар с неполными данными:', product);
            return;
        }

        const oldPrice = product.oldPrice
            ? `<span class="oldPrice">${formatPrice(product.oldPrice)}</span>`
            : '';

        const badge = product.badge && product.badge.trim() !== ''
            ? `<div class="product-badge ${product.badgeClass || ''}">${product.badge}</div>`
            : '';

        const ratingStars = getRatingStars(product.rating || 0);

        const isFavorite = favorites.items.some(item => item.id === product.id);
        const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        const favoriteClass = isFavorite ? 'favorite-active' : '';

        const card = `
            <div class="product-card" data-id="${product.id || ''}" data-category="${product.category || ''}">
                ${badge}
                <div class="product-image">
                    <img src="${product.image || 'images/placeholder.jpg'}" 
                         alt="${product.title}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Нет+фото'">
                    <button class="favorite-btn ${favoriteClass}" data-product-id="${product.id}" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}">
                        <i class="${favoriteIcon}"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    ${product.rating ? `
                    <div class="product-rating">
                        ${ratingStars}
                        <span class="rating-value">${product.rating}</span>
                    </div>
                    ` : ''}
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${oldPrice}
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> В корзину
                    </button>
                </div>
            </div>
        `;
        $grid.append(card);
    });
}

// === ФИЛЬТРАЦИЯ ПО КАТЕГОРИЯМ (для каталога) ===
function initCatalogFilters() {
    $('.catalog-menu a').on('click', function (e) {
        e.preventDefault();
        const categoryText = $(this).find('span').text().toLowerCase();

        const categoryMap = {
            'лекарства': 'medicine',
            'витамины и бад': 'vitamins',
            'гигиена и уход': 'hygiene',
            'мед. техника': 'medtech',
            'мама и малыш': 'baby',
            'зрение': 'vision',
            'мед. изделия': 'medical',
            'косметика': 'cosmetics',
            'аллергия': 'allergy',
            'ортопедия': 'orthopedics',
            'диета и спорт': 'sports'
        };

        const engCategory = categoryMap[categoryText] || categoryText;

        $('.products-grid').html(`
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Загружаем товары категории "${categoryText}"...</p>
            </div>
        `);

        $.ajax({
            url: 'products.json',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                let filteredProducts = [];

                if (engCategory === 'все') {
                    filteredProducts = data.products;
                } else {
                    filteredProducts = data.products.filter(product =>
                        product.category === engCategory
                    );
                }

                if (filteredProducts.length > 0) {
                    displayProducts(filteredProducts);
                    showNotification(`Показаны товары категории: ${categoryText} (${filteredProducts.length} шт.)`);
                    initCartHandlers();
                    initFavoritesHandlers();
                } else {
                    $('.products-grid').html(`
                        <div class="no-products">
                            <i class="fas fa-box-open fa-3x"></i>
                            <h3>Товары не найдены</h3>
                            <p>В категории "${categoryText}" пока нет товаров</p>
                            <button onclick="loadProducts()" class="refresh-btn">
                                <i class="fas fa-redo"></i> Вернуться ко всем товарам
                            </button>
                        </div>
                    `);
                }
            }
        });
    });
}

// === ПОИСК ТОВАРОВ ===
function initSearch() {
    const $searchInput = $('.search-bar input');
    const $searchBtn = $('.search-btn');

    $searchBtn.on('click', function () {
        performSearch($searchInput.val().trim());
    });

    $searchInput.on('keypress', function (e) {
        if (e.which === 13) {
            performSearch($(this).val().trim());
        }
    });

    let searchTimeout;
    $searchInput.on('input', function () {
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();

        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 500);
        } else if (query.length === 0) {
            loadProducts();
        }
    });
}

function performSearch(query) {
    if (!query) {
        loadProducts();
        return;
    }

    $('.products-grid').html(`
        <div class="loading-indicator">
            <i class="fas fa-search fa-spin fa-2x"></i>
            <p>Ищем "${query}"...</p>
        </div>
    `);

    $.ajax({
        url: 'products.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const results = data.products.filter(product => {
                const searchIn = product.title.toLowerCase() + ' ' +
                    (product.description || '').toLowerCase() + ' ' +
                    (product.category || '').toLowerCase();
                return searchIn.includes(query.toLowerCase());
            });

            if (results.length > 0) {
                displayProducts(results);
                showNotification(`Найдено ${results.length} товаров по запросу "${query}"`);
                initCartHandlers();
                initFavoritesHandlers();
            } else {
                $('.products-grid').html(`
                    <div class="no-products">
                        <i class="fas fa-search fa-3x"></i>
                        <h3>Ничего не найдено</h3>
                        <p>По запросу "${query}" товаров не найдено</p>
                        <button onclick="loadProducts()" class="refresh-btn">
                            <i class="fas fa-redo"></i> Показать все товары
                        </button>
                    </div>
                `);
            }
        }
    });
}

// === КОРЗИНА ===
function initCartHandlers() {
    $('.add-to-cart-btn').off('click');
    $('.add-to-cart-btn').on('click', function () {
        const productId = $(this).data('product-id');
        const $button = $(this);

        $.getJSON('products.json', function (data) {
            const product = data.products.find(p => p.id == productId);

            if (product) {
                addToCart(product, $button);
            } else {
                showNotification('Ошибка: товар не найден');
            }
        }).fail(function () {
            showNotification('Ошибка загрузки данных');
        });
    });
}

function addToCart(product, $button) {
    const existingItem = cart.items.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    cart.count += 1;
    cart.total += product.price;

    saveCart();
    updateCartUI();

    $button.html('<i class="fas fa-check"></i> Добавлено');
    $button.css('background', '#4CAF50');

    setTimeout(() => {
        $button.html('<i class="fas fa-shopping-cart"></i> В корзину');
        $button.css('background', '');
    }, 1500);

    showNotification(`"${product.title}" добавлен в корзину!`);
}

function saveCart() {
    localStorage.setItem('pharmacy_cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('pharmacy_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function updateCartUI() {
    $('.cart-count').text(cart.count);
    $('.cart-count').toggle(cart.count > 0);
}

// === МОДАЛЬНОЕ ОКНО КОРЗИНЫ ===
function initCartModal() {
    if ($('#cartModal').length === 0) {
        const $cartModal = $(`
            <div id="cartModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close">&times;</span>
                    <h2><i class="fas fa-shopping-cart"></i> Корзина</h2>
                    <div id="cartItems" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                        <div class="empty-cart-message" style="text-align: center; padding: 40px;">
                            <i class="fas fa-shopping-basket fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                            <p style="color: #727d71;">Ваша корзина пуста</p>
                        </div>
                    </div>
                    <div id="cartSummary" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; display: none;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <strong>Итого товаров:</strong>
                            <span id="cartTotalCount">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <strong>Общая сумма:</strong>
                            <span id="cartTotalPrice" style="color: #6d4c3d; font-weight: bold;">0 ₽</span>
                        </div>
                        <button id="checkoutBtn" class="submit-btn" style="background: #4CAF50;">
                            <i class="fas fa-credit-card"></i> Оформить заказ
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('body').append($cartModal);
    }

    $('.action-btn').filter(function () {
        return $(this).find('.fa-shopping-cart').length > 0;
    }).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showCartModal();
    });

    $(document).on('click', '.close', function () {
        $(this).closest('.modal').fadeOut();
    });

    $(document).on('click', '.modal', function (e) {
        if ($(e.target).hasClass('modal')) {
            $(this).fadeOut();
        }
    });
}

function showCartModal() {
    updateCartModal();
    $('#cartModal').fadeIn();
}

function updateCartModal() {
    const $cartItems = $('#cartItems');
    const $cartSummary = $('#cartSummary');

    if (cart.items.length === 0) {
        $cartItems.html(`
            <div class="empty-cart-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-shopping-basket fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                <p style="color: #727d71;">Ваша корзина пуста</p>
            </div>
        `);
        $cartSummary.hide();
    } else {
        let itemsHTML = '';
        cart.items.forEach(item => {
            itemsHTML += `
                <div class="cart-item" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                        <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}" style="max-width: 50px; max-height: 50px;" onerror="this.src='https://via.placeholder.com/50x50?text=Нет+фото'">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${item.title}</div>
                        <div style="color: #6d4c3d; font-weight: bold;">${formatPrice(item.price)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="quantity-btn minus" data-id="${item.id}" style="width: 30px; height: 30px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer;">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}" style="width: 30px; height: 30px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer;">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-btn" data-id="${item.id}" style="margin-left: 15px; color: #f44336; background: none; border: none; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        $cartItems.html(itemsHTML);
        $('#cartTotalCount').text(cart.count);
        $('#cartTotalPrice').text(formatPrice(cart.total));
        $cartSummary.show();

        $('.quantity-btn.plus').off('click').on('click', function () {
            const id = parseInt($(this).data('id'));
            const item = cart.items.find(item => item.id === id);
            if (item) {
                item.quantity += 1;
                cart.count += 1;
                cart.total += item.price;
                saveCart();
                updateCartUI();
                updateCartModal();
            }
        });

        $('.quantity-btn.minus').off('click').on('click', function () {
            const id = parseInt($(this).data('id'));
            const itemIndex = cart.items.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                const item = cart.items[itemIndex];
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    cart.count -= 1;
                    cart.total -= item.price;
                } else {
                    cart.count -= 1;
                    cart.total -= item.price;
                    cart.items.splice(itemIndex, 1);
                }
                saveCart();
                updateCartUI();
                updateCartModal();
            }
        });

        $('.remove-btn').off('click').on('click', function () {
            const id = parseInt($(this).data('id'));
            const itemIndex = cart.items.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                const item = cart.items[itemIndex];
                cart.count -= item.quantity;
                cart.total -= item.price * item.quantity;
                cart.items.splice(itemIndex, 1);
                saveCart();
                updateCartUI();
                updateCartModal();
                showNotification(`"${item.title}" удален из корзины`);
            }
        });

        $('#checkoutBtn').off('click').on('click', function () {
            if (cart.items.length > 0) {
                alert(`Заказ оформлен!\n\nТоваров: ${cart.count}\nСумма: ${formatPrice(cart.total)}\n\nСпасибо за покупку!`);
                cart = { items: [], total: 0, count: 0 };
                saveCart();
                updateCartUI();
                updateCartModal();
                $('#cartModal').fadeOut();
            }
        });
    }
}

// === ИЗБРАННОЕ ===
function initFavoritesHandlers() {
    $('.favorite-btn').off('click');
    $('.favorite-btn').on('click', function () {
        const productId = $(this).data('product-id');
        const $button = $(this);

        $.getJSON('products.json', function (data) {
            const product = data.products.find(p => p.id == productId);

            if (product) {
                toggleFavorite(product, $button);
            } else {
                showNotification('Ошибка: товар не найден');
            }
        }).fail(function () {
            showNotification('Ошибка загрузки данных');
        });
    });
}

function toggleFavorite(product, $button) {
    const existingIndex = favorites.items.findIndex(item => item.id === product.id);

    if (existingIndex !== -1) {
        favorites.items.splice(existingIndex, 1);
        $button.find('i').removeClass('fas').addClass('far');
        $button.removeClass('favorite-active');
        $button.attr('title', 'Добавить в избранное');
        showNotification(`"${product.title}" удален из избранного`);
    } else {
        favorites.items.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image
        });
        $button.find('i').removeClass('far').addClass('fas');
        $button.addClass('favorite-active');
        $button.attr('title', 'Удалить из избранного');
        showNotification(`"${product.title}" добавлен в избранное`);
    }

    saveFavorites();
    updateFavoritesUI();
}

function saveFavorites() {
    localStorage.setItem('pharmacy_favorites', JSON.stringify(favorites));
}

function loadFavorites() {
    const savedFavorites = localStorage.getItem('pharmacy_favorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
        updateFavoritesUI();
    }
}

function updateFavoritesUI() {
    $('.favorites-count').text(favorites.items.length);
    $('.favorites-count').toggle(favorites.items.length > 0);
}

// === МОДАЛЬНОЕ ОКНО ИЗБРАННОГО ===
function initFavoritesModal() {
    if ($('#favoritesModal').length === 0) {
        const $favoritesModal = $(`
            <div id="favoritesModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close">&times;</span>
                    <h2><i class="fas fa-heart"></i> Избранное</h2>
                    <div id="favoritesItems" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                        <div class="empty-favorites-message" style="text-align: center; padding: 40px;">
                            <i class="fas fa-heart fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                            <p style="color: #727d71;">Ваше избранное пусто</p>
                            <p style="font-size: 14px; color: #727d71; margin-top: 10px;">Добавляйте товары в избранное, нажимая на сердечко на карточке товара</p>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append($favoritesModal);
    }

    $('.action-btn').filter(function () {
        return $(this).find('.fa-heart').length > 0;
    }).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showFavoritesModal();
    });

    $(document).on('click', '.close', function () {
        $(this).closest('.modal').fadeOut();
    });

    $(document).on('click', '.modal', function (e) {
        if ($(e.target).hasClass('modal')) {
            $(this).fadeOut();
        }
    });
}

function showFavoritesModal() {
    updateFavoritesModal();
    $('#favoritesModal').fadeIn();
}

function updateFavoritesModal() {
    const $favoritesItems = $('#favoritesItems');

    if (favorites.items.length === 0) {
        $favoritesItems.html(`
            <div class="empty-favorites-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-heart fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                <p style="color: #727d71;">Ваше избранное пусто</p>
                <p style="font-size: 14px; color: #727d71; margin-top: 10px;">Добавляйте товары в избранное, нажимая на сердечко на карточке товара</p>
            </div>
        `);
    } else {
        let itemsHTML = '';
        favorites.items.forEach(item => {
            itemsHTML += `
                <div class="favorite-item" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                        <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}" style="max-width: 50px; max-height: 50px;" onerror="this.src='https://via.placeholder.com/50x50?text=Нет+фото'">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${item.title}</div>
                        <div style="color: #6d4c3d; font-weight: bold;">${formatPrice(item.price)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="add-to-cart-from-favorites" data-id="${item.id}" style="padding: 8px 15px; background: #6d4c3d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-shopping-cart"></i> В корзину
                        </button>
                        <button class="remove-from-favorites" data-id="${item.id}" style="color: #f44336; background: none; border: none; cursor: pointer; font-size: 18px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        $favoritesItems.html(itemsHTML);

        $('.add-to-cart-from-favorites').off('click').on('click', function () {
            const id = parseInt($(this).data('id'));

            $.getJSON('products.json', function (data) {
                const product = data.products.find(p => p.id == id);

                if (product) {
                    addToCart(product, $(this));
                    showNotification(`"${product.title}" добавлен в корзину из избранного`);
                }
            });
        });

        $('.remove-from-favorites').off('click').on('click', function () {
            const id = parseInt($(this).data('id'));
            const itemIndex = favorites.items.findIndex(item => item.id === id);

            if (itemIndex !== -1) {
                const item = favorites.items[itemIndex];
                favorites.items.splice(itemIndex, 1);
                saveFavorites();
                updateFavoritesUI();
                updateFavoritesModal();

                $(`.favorite-btn[data-product-id="${id}"]`).find('i').removeClass('fas').addClass('far');
                $(`.favorite-btn[data-product-id="${id}"]`).removeClass('favorite-active');

                showNotification(`"${item.title}" удален из избранного`);
            }
        });
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function addRefreshButton() {
    if ($('.refresh-btn').length === 0) {
        const $refreshBtn = $(`
            <button class="refresh-btn" style="margin-left: 20px;">
                <i class="fas fa-redo"></i> Показать все товары
            </button>
        `);

        $('.section-header').append($refreshBtn);

        $refreshBtn.on('click', function () {
            $(this).addClass('spinning');
            loadProducts();
            setTimeout(() => $(this).removeClass('spinning'), 1000);
        });
    }
}

function formatPrice(price) {
    if (!price && price !== 0) return '0 ₽';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

function getRatingStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function showNotification(message) {
    $('.notification').remove();

    const $notification = $(`
        <div class="notification" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: #4CAF50;
            color: white;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="fas fa-check-circle"></i> ${message}
        </div>
    `);

    $('body').append($notification);

    setTimeout(() => {
        $notification.fadeOut(300, function () {
            $(this).remove();
        });
    }, 3000);
}

// === СТИЛИ ДЛЯ АНИМАЦИИ УВЕДОМЛЕНИЯ ===
$(document).ready(function () {
    $('<style>')
        .text(`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `)
        .appendTo('head');
});