
# 🏠 AuriHome Nexus

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**AuriHome Nexus** is a professional-grade, dual-mode (Cloud SaaS + Local Hub) smart home orchestration system. It bridges the gap between complex industrial automation and consumer-friendly UX.

---

### ⚠️ License & Commercial Use
**Free for personal use.**
This project is open-sourced under the MIT License for educational purposes, personal home automation, and community contributions.

**For commercial use, white-labeling, or enterprise integration, please [Contact Me](mailto:your.email@example.com).**
*Thinking of launching your own Smart Home Hub product? Let's talk.*

---

## 🌍 Language / Язык

*   [🇺🇸 Read in English](#-english-documentation)
*   [🇷🇺 Читать на Русском](#-документация-на-русском)

---

# 🇺🇸 English Documentation

## 🚀 Overview

AuriHome Nexus solves the "Cloud vs Local" dilemma.
1.  **Cloud Zone:** A secure dashboard for administration, analytics, and complex scenario building.
2.  **Local Hub:** An ultra-fast (<100ms latency), offline-first interface for wall-mounted tablets, connecting directly to hardware via MQTT over WebSockets.

### Key Features
*   **Dual-Mode Architecture:** Seamless switching between Cloud SaaS and Local Control.
*   **AI Integration:** Supports Google Gemini, OpenAI, and Local LLMs (Ollama) for natural language control.
*   **Visual Automation:** Drag & Drop logic builder (`IF Device=ON AND Time>18:00 THEN Set Mood=Cozy`).
*   **Hardware Agnostic:** Works with Zigbee2MQTT, Tasmota, and any MQTT-enabled device.

## 💻 Hardware Requirements

To run the Local Hub (Docker container + MQTT Broker) effectively:

| Component | Minimum | Recommended (Production) |
| :--- | :--- | :--- |
| **CPU** | Raspberry Pi 3 (Quad Core) | **Raspberry Pi 4 / 5** or Intel NUC |
| **RAM** | 2 GB | **4 GB+** |
| **Storage** | 16 GB SD Card | **64 GB SSD** (for log retention) |
| **Network** | Wi-Fi 2.4GHz | **Ethernet** (Critical for MQTT stability) |
| **Radio** | None (WiFi devices only) | **Sonoff Zigbee 3.0 Dongle Plus** |

## 🛠️ Installation (1 Minute Start)

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aurihome-nexus.git
    cd aurihome-nexus
    ```

2.  **Launch via Docker:**
    This starts the Web UI (Port 3000) and the MQTT Broker (Port 1883/9001).
    ```bash
    docker-compose up -d
    ```

3.  **Access:**
    Open `http://localhost:3000` in your browser.
    *   **Login:** `admin@aurihome.com`
    *   **Password:** `password`

## 🗺️ Project Roadmap

We are actively developing AuriHome Nexus. Here is our vision:

- [x] **Core:** React UI, Tailwind Styling, Dark/Light Mode.
- [x] **Connectivity:** Real-time MQTT Integration via WebSockets.
- [x] **Logic:** Visual Scenario Builder (IF/THEN/ELSE).
- [x] **AI:** Integration with Google Gemini & OpenAI.
- [ ] **Mobile:** Native wrapper (Capacitor) for iOS/Android notifications.
- [ ] **Voice:** Local "Wake Word" detection (Porcupine integration).
- [ ] **Video:** NVR functionality (RTSP Stream recording).
- [ ] **Matter:** Native support for Matter protocol devices.

---

<br>

# 🇷🇺 Документация на Русском

## 🚀 О проекте

**AuriHome Nexus** решает проблему выбора между облаком и локальным управлением.
1.  **Cloud Zone:** Защищенная панель для настройки, аналитики и создания сценариев.
2.  **Local Hub:** Сверхбыстрый (отклик <100 мс) интерфейс для настенных планшетов, работающий без интернета через MQTT.

### Ключевые возможности
*   **Гибридная архитектура:** Работает и в облаке, и локально.
*   **ИИ Ядро:** Поддержка Google Gemini, OpenAI и локальных моделей (Ollama) для голосового управления.
*   **Визуальный редактор:** Создание сценариев без программирования (`ЕСЛИ Свет=ВКЛ И Время>18:00 ТО Режим=Уют`).
*   **Универсальность:** Полная поддержка Zigbee2MQTT и Tasmota.

## 💻 Системные требования

Для запуска Локального Хаба (Docker + Брокер) в режиме 24/7:

| Компонент | Минимально | Рекомендуется (Production) |
| :--- | :--- | :--- |
| **CPU** | Raspberry Pi 3 | **Raspberry Pi 4 / 5** или Intel NUC |
| **ОЗУ** | 2 ГБ | **4 ГБ+** |
| **Диск** | 16 ГБ SD карта | **64 ГБ SSD** (для базы данных и логов) |
| **Сеть** | Wi-Fi | **Ethernet** (Кабель важен для стабильности MQTT) |
| **Zigbee** | Нет (только WiFi устройства) | **Sonoff Zigbee 3.0 Dongle Plus** |

## 🛠️ Установка (Запуск за 1 минуту)

Требования: Установленный [Docker](https://docs.docker.com/get-docker/).

1.  **Скачайте репозиторий:**
    ```bash
    git clone https://github.com/your-username/aurihome-nexus.git
    cd aurihome-nexus
    ```

2.  **Запустите Docker Compose:**
    Команда поднимет веб-интерфейс (порт 3000) и брокер MQTT (порты 1883/9001).
    ```bash
    docker-compose up -d
    ```

3.  **Вход:**
    Откройте `http://localhost:3000`.
    *   **Логин:** `admin@aurihome.com`
    *   **Пароль:** `password`

## 🗺️ Дорожная карта (Roadmap)

Текущий статус и планы развития:

- [x] **Ядро:** UI на React/Tailwind, Анимации, Темы.
- [x] **Связь:** Реальный MQTT клиент через WebSockets.
- [x] **Логика:** Конструктор сценариев автоматизации.
- [x] **AI:** Интеграция с LLM (Gemini/OpenAI).
- [ ] **Мобильное приложение:** Native версия для iOS/Android (Push-уведомления).
- [ ] **Голос:** Локальное распознавание команды активации ("Привет, Дом").
- [ ] **Видео:** Запись потоков с камер (NVR).
- [ ] **Matter:** Поддержка нового стандарта умного дома.
