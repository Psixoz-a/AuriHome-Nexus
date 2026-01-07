
# 🏠 AuriHome Nexus (SmartHome Suite)

*[Read in English](#-english-documentation) | [Читать на Русском](#-документация-на-русском)*

---

# 🇺🇸 English Documentation

## 1. Project Overview
**AuriHome Nexus** is a production-ready web application designed for managing a smart home. It features a unique **Dual-Mode Architecture** and **Multi-Provider AI Intelligence**.

### Architecture
1.  **Cloud Dashboard (`/cloud`):** Secure SaaS-style dashboard for analytics, automation logic (IF/THEN), and settings. Accessed via VPN (Tailscale simulation).
2.  **Local Hub (`/local`):** Offline-first interface for wall-mounted tablets with <100ms response time.
3.  **AI Core:** Connects to Google Gemini, OpenAI, or Local AI to interpret natural language commands.
4.  **Automation Engine:** Runs complex scenarios (`IF Condition THEN Action`) directly in the browser.

---

## 2. Key Features

### ⚙️ Automation Logic (Scenarios)
Create powerful rules without coding.
*   **Trigger:** Manual button press or Device State Change (auto).
*   **Conditions:** Check if a device property (e.g., Power, Temperature) equals, is greater than, or less than a value.
*   **Actions:** Turn devices on/off, set brightness, etc.
*   **Test:** Use the "Play" button in the Scenarios list to test manual triggers immediately.

### 🔐 Security & Settings
*   **Password Management:** Securely update your admin credentials (mocked persistence).
*   **2FA & Remote Access:** Toggle security layers. State is persisted to the local database.
*   **AI Configuration:** Switch between Gemini (Free), OpenAI (Paid), or Local LLM.

---

## 3. Installation & Setup

1.  **Clone & Install:**
    ```bash
    git clone https://github.com/your-repo/aurihome-nexus.git
    cd aurihome-nexus
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```

3.  **Default Credentials:**
    *   Email: `admin@aurihome.com`
    *   Password: `password`

---

<br><br><br>

# 🇷🇺 Документация на Русском

## 1. Описание Проекта
**AuriHome Nexus** — это профессиональная система управления умным домом с поддержкой Искусственного Интеллекта.

### Ключевые особенности:
*   **Сценарии автоматизации:** Создавайте логику `ЕСЛИ -> ТО` и `ИНАЧЕ` в визуальном редакторе.
*   **Два режима работы:** Облачная панель администратора и Локальный хаб для планшета.
*   **ИИ Ассистент:** Понимает команды вроде *"Включи свет в гостиной"* и выполняет их через Function Calling.
*   **Безопасность:** Управление паролями, 2FA и удаленным доступом.

---

## 2. Функционал

### ⚙️ Сценарии (Scenarios)
Перейдите в раздел **Logic Builder**.
1.  Нажмите **New Logic Flow**.
2.  Выберите триггер: **Manual** (Кнопка) или **Event** (Автоматически при изменении устройств).
3.  Добавьте блок логики.
4.  **Condition (Условие):** Например, `Living Room Light` `=` `true`.
5.  **Action (Действие):** Например, `Kitchen Light` -> `OFF`.
6.  Сохраните и протестируйте кнопкой **Run**.

### 🔐 Безопасность
*   В разделе **Settings > Security** можно сменить пароль. Текущий пароль по умолчанию: `password`.
*   Переключатели **2FA** и **Remote Access** сохраняют свое состояние.

---

## 3. Установка

1.  **Установка зависимостей:**
    ```bash
    npm install
    ```

2.  **Запуск:**
    ```bash
    npm run dev
    ```
    Приложение доступно по адресу `http://localhost:5173`.
