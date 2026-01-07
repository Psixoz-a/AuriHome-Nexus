
import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../services/mockDb';

type Language = 'en' | 'ru';

const dictionary: Record<string, { en: string; ru: string }> = {
  // General & Buttons
  'app.save': { en: 'Save Changes', ru: 'Сохранить изменения' },
  'app.saving': { en: 'Saving...', ru: 'Сохранение...' },
  'app.cancel': { en: 'Cancel', ru: 'Отмена' },
  'app.delete': { en: 'Delete', ru: 'Удалить' },
  'app.edit': { en: 'Edit', ru: 'Редактировать' },
  'app.confirm': { en: 'Are you sure?', ru: 'Вы уверены?' },
  'app.empty': { en: 'No data available', ru: 'Нет данных' },

  // Landing
  'landing.version': { en: 'v2.0 Production Release', ru: 'v2.0 Релиз' },
  'landing.subtitle': { en: 'Professional AuriHome Nexus Orchestration. Connect real hardware via MQTT, automate with complex logic, and control locally via AI.', ru: 'Профессиональная оркестрация AuriHome Nexus. Подключайте реальное оборудование через MQTT, автоматизируйте сложную логику и управляйте локально через ИИ.' },
  'landing.cta.cloud': { en: 'Nexus Console', ru: 'Консоль Nexus' },
  'landing.cta.local': { en: 'Local Hub Interface', ru: 'Интерфейс хаба' },
  
  // Auth
  'auth.signin.title': { en: 'Nexus Access', ru: 'Доступ к Nexus' },
  'auth.signin.subtitle': { en: 'Authenticate to access the AuriHome core configuration', ru: 'Авторизуйтесь для настройки ядра AuriHome' },
  'auth.button.signin': { en: 'Connect', ru: 'Подключиться' },
  'auth.button.authenticating': { en: 'Verifying keys...', ru: 'Проверка ключей...' },
  'auth.secure': { en: 'End-to-End Encrypted', ru: 'Сквозное шифрование' },
  'auth.encryption': { en: 'Production Mode', ru: 'Рабочий режим' },

  // Navigation
  'nav.dashboard': { en: 'Dashboard', ru: 'Дашборд' },
  'nav.devices': { en: 'Device Manager', ru: 'Устройства' },
  'nav.scenarios': { en: 'Logic Builder', ru: 'Сценарии' },
  'nav.settings': { en: 'System Config', ru: 'Настройки' },
  'nav.logout': { en: 'Disconnect', ru: 'Выход' },
  'nav.language': { en: 'Language', ru: 'Язык' },

  // Dashboard & Charts
  'dashboard.title': { en: 'Nexus Overview', ru: 'Обзор Nexus' },
  'dashboard.subtitle': { en: 'Real-time monitoring of your smart environment.', ru: 'Мониторинг вашего умного дома в реальном времени.' },
  'stats.total_devices': { en: 'Online Devices', ru: 'Устройства в сети' },
  'stats.total_devices.sub': { en: 'All systems operational', ru: 'Системы в норме' },
  'stats.system_load': { en: 'Server Load', ru: 'Нагрузка сервера' },
  'stats.current_power': { en: 'Current Power', ru: 'Текущая мощность' },
  'stats.est_daily_cost': { en: 'Est. / day', ru: 'Прогноз / день' },
  'stats.security': { en: 'Security Status', ru: 'Статус охраны' },
  'stats.security.armed': { en: 'Armed', ru: 'Под охраной' },
  'stats.security.safe': { en: 'No intrusions detected', ru: 'Нарушений нет' },
  'chart.activity': { en: 'Network Traffic', ru: 'Сетевой трафик' },
  'chart.temp': { en: 'Temp (°C)', ru: 'Темп. (°C)' },
  'chart.hum': { en: 'Hum (%)', ru: 'Влаж. (%)' },
  'chart.cost': { en: 'Cost', ru: 'Расход' },
  'dashboard.climate': { en: 'Climate Control', ru: 'Климат-контроль' },
  'dashboard.energy': { en: 'Energy Consumption', ru: 'Энергопотребление' },
  'dashboard.map.title': { en: 'Real-time Map', ru: 'Карта дома' },
  'dashboard.map.edit': { en: 'Edit Map', ru: 'Ред. карту' },
  'dashboard.map.save': { en: 'Save Map', ru: 'Сохранить карту' },
  'dashboard.map.cancel': { en: 'Stop Editing', ru: 'Закончить' },
  'dashboard.map.add': { en: 'Add Room', ru: 'Добавить комнату' },
  'dashboard.map.live': { en: 'Live View', ru: 'Живой вид' },
  'dashboard.map.editing': { en: 'Editing Mode', ru: 'Режим правки' },
  'dashboard.map.prompt': { en: 'Enter room name:', ru: 'Введите название комнаты:' },
  'dashboard.map.empty': { en: 'No floor plan configured. Click "Edit Map" to start.', ru: 'План не настроен. Нажмите "Ред. карту" для создания.' },
  'dashboard.logs.title': { en: 'Event Log', ru: 'Журнал событий' },
  'dashboard.quick_actions': { en: 'Quick Actions', ru: 'Быстрые действия' },
  
  // Devices
  'devices.title': { en: 'Device Registry', ru: 'Реестр устройств' },
  'devices.subtitle': { en: 'Manage MQTT topics and hardware states.', ru: 'Управление топиками MQTT и состоянием.' },
  'devices.add': { en: 'Provision Device', ru: 'Добавить устройство' },
  'devices.empty': { en: 'No devices found.', ru: 'Устройства не найдены.' },
  'devices.empty.sub': { en: 'Add your first device or connect MQTT broker.', ru: 'Добавьте первое устройство или подключите MQTT.' },
  'devices.scan.start': { en: 'Start Scanning', ru: 'Начать сканирование' },
  'devices.scan.desc': { en: 'Ensure device is in pairing mode', ru: 'Убедитесь, что устройство в режиме сопряжения' },
  'devices.configure': { en: 'Configure Device', ru: 'Настроить устройство' },
  
  // Scenarios
  'scenarios.title': { en: 'Automation Logic', ru: 'Логика автоматизации' },
  'scenarios.subtitle': { en: 'Create complex IF/THEN/ELSE flows.', ru: 'Создание сложных IF/THEN/ELSE потоков.' },
  'scenarios.create': { en: 'New Logic Flow', ru: 'Новый сценарий' },
  'scenarios.empty': { en: 'No automations configured.', ru: 'Автоматизации отсутствуют.' },

  // Settings
  'settings.title': { en: 'System Config', ru: 'Настройки системы' },
  'settings.subtitle': { en: 'Manage your account preferences and system configurations', ru: 'Управление аккаунтом и конфигурацией' },
  'settings.system_core': { en: 'System Core', ru: 'Ядро системы' },
  'settings.ai.title': { en: 'Intelligence Provider', ru: 'Провайдер ИИ' },
  'settings.ai.select': { en: 'Select AI Brain', ru: 'Выберите мозг ИИ' },
  'settings.ai.key': { en: 'API Key', ru: 'API Ключ' },
  'settings.ai.url': { en: 'Local Endpoint URL', ru: 'URL Локального сервера' },
  'settings.mqtt.title': { en: 'MQTT Broker', ru: 'MQTT Брокер' },
  'settings.mqtt.url': { en: 'Broker URL', ru: 'Адрес брокера' },
  'settings.energy.title': { en: 'Energy & Currency', ru: 'Энергия и Валюта' },
  'settings.energy.cost': { en: 'Cost per kWh', ru: 'Цена за кВт/ч' },
  'settings.profile': { en: 'User Profile', ru: 'Профиль пользователя' },
  'settings.remote': { en: 'Remote Access', ru: 'Удаленный доступ' },
  'settings.security': { en: 'Security', ru: 'Безопасность' },
  'settings.data': { en: 'Data Management', ru: 'Управление данными' },
  'settings.reset': { en: 'Factory Reset', ru: 'Сброс до заводских' },
  'settings.reset.desc': { en: 'Wipe all devices and settings.', ru: 'Удалить все устройства и настройки.' },
  
  // Password Modal
  'settings.security.change_pass': { en: 'Change Password', ru: 'Сменить пароль' },
  'settings.security.current': { en: 'Current Password', ru: 'Текущий пароль' },
  'settings.security.new': { en: 'New Password', ru: 'Новый пароль' },
  'settings.security.confirm': { en: 'Confirm New Password', ru: 'Подтвердите пароль' },
  'settings.security.2fa': { en: 'Two-Factor Auth', ru: 'Двухфакторная аут.' },
  'settings.security.2fa_desc': { en: 'Secure your account', ru: 'Защита аккаунта' },
  'settings.remote.active': { en: 'Active', ru: 'Активен' },
  'settings.remote.offline': { en: 'Offline', ru: 'Отключен' },

  // Local Hub
  'local.title': { en: 'AuriHome Core', ru: 'AuriHome Core' },
  'local.system.online': { en: 'NEXUS ONLINE', ru: 'NEXUS АКТИВЕН' },
  'local.controls': { en: 'Device Controls', ru: 'Управление устройствами' },
  'local.quick_actions': { en: 'Quick Actions', ru: 'Быстрые действия' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from DB on start
  useEffect(() => {
    db.getUser().then(u => {
        if (u.settings.language) setLanguageState(u.settings.language as Language);
    });
  }, []);

  const setLanguage = (lang: Language) => {
      setLanguageState(lang);
      // Persist to DB
      db.getUser().then(u => {
          db.updateUser({ settings: { ...u.settings, language: lang } });
      });
  };

  const t = (key: string) => {
    return dictionary[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
