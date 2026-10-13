'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'es' | 'en' | 'pt';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    messages: 'Mensajes',
    pipeline: 'Pipeline CRM',
    clients: 'Clientes',
    campaigns: 'Campañas',
    automations: 'Automatizaciones',
    orders: 'Pedidos',
    privacyOn: 'Modo Privacidad: Activado',
    privacyOff: 'Modo Privacidad: Desactivado',
    newChat: 'Mensaje a nuevo número',
    quickReplies: 'Respuestas Rápidas',
    aiAssistant: 'Asistente IA',
    search: 'Buscar...',
    stageNew: 'Nuevo contacto',
    stageNegotiation: 'Negociación',
    stageClient: 'Cliente',
    totalDeals: 'Total oportunidades',
    contactsCount: 'contactos',
    filterByStage: 'Filtrar por etapa',
    filterByTag: 'Filtrar por etiqueta',
    filterByInactivity: 'Solo inactivos (>3 días)',
    all: 'Todos',
    openChat: 'Abrir Chat',
    addDeal: 'Nueva Oportunidad',
    deals: 'Oportunidades',
    notes: 'Notas y Bitácora',
    reminders: 'Recordatorios y Programados',
    save: 'Guardar',
    saving: 'Guardando...',
    saved: 'Guardado',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    exportCsv: 'Exportar CSV',
    importCsv: 'Importar CSV',
    calendarSync: 'Agendar en Google Calendar',
  },
  en: {
    messages: 'Messages',
    pipeline: 'CRM Pipeline',
    clients: 'Contacts',
    campaigns: 'Campaigns',
    automations: 'Automations',
    orders: 'Orders',
    privacyOn: 'Privacy Mode: Enabled',
    privacyOff: 'Privacy Mode: Disabled',
    newChat: 'Message unsaved number',
    quickReplies: 'Quick Replies',
    aiAssistant: 'AI Assistant',
    search: 'Search...',
    stageNew: 'New contact',
    stageNegotiation: 'Negotiation',
    stageClient: 'Customer',
    totalDeals: 'Total deals',
    contactsCount: 'contacts',
    filterByStage: 'Filter by stage',
    filterByTag: 'Filter by tag',
    filterByInactivity: 'Inactive only (>3 days)',
    all: 'All',
    openChat: 'Open Chat',
    addDeal: 'New Deal',
    deals: 'Deals',
    notes: 'Internal Notes',
    reminders: 'Reminders & Scheduled',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    cancel: 'Cancel',
    delete: 'Delete',
    exportCsv: 'Export CSV',
    importCsv: 'Import CSV',
    calendarSync: 'Add to Google Calendar',
  },
  pt: {
    messages: 'Mensagens',
    pipeline: 'Pipeline CRM',
    clients: 'Contatos',
    campaigns: 'Campanhas',
    automations: 'Automações',
    orders: 'Pedidos',
    privacyOn: 'Modo Privacidade: Ativado',
    privacyOff: 'Modo Privacidade: Desativado',
    newChat: 'Mensagem para novo número',
    quickReplies: 'Respostas Rápidas',
    aiAssistant: 'Assistente IA',
    search: 'Pesquisar...',
    stageNew: 'Novo contato',
    stageNegotiation: 'Negociação',
    stageClient: 'Cliente',
    totalDeals: 'Total oportunidades',
    contactsCount: 'contatos',
    filterByStage: 'Filtrar por etapa',
    filterByTag: 'Filtrar por etiqueta',
    filterByInactivity: 'Apenas inativos (>3 dias)',
    all: 'Todos',
    openChat: 'Abrir Chat',
    addDeal: 'Nova Oportunidade',
    deals: 'Oportunidades',
    notes: 'Notas Internas',
    reminders: 'Lembretes e Agendados',
    save: 'Salvar',
    saving: 'Salvando...',
    saved: 'Salvo',
    cancel: 'Cancelar',
    delete: 'Excluir',
    exportCsv: 'Exportar CSV',
    importCsv: 'Importar CSV',
    calendarSync: 'Agendar no Google Calendar',
  },
};

interface CrmUiContextType {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  isNewChatModalOpen: boolean;
  setIsNewChatModalOpen: (open: boolean) => void;
}

const CrmUiContext = createContext<CrmUiContextType>({
  privacyMode: false,
  togglePrivacyMode: () => {},
  locale: 'es',
  setLocale: () => {},
  t: (k) => k,
  isNewChatModalOpen: false,
  setIsNewChatModalOpen: () => {},
});

export function CrmUiProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [locale, setLocaleState] = useState<Locale>('es');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedPrivacy = localStorage.getItem('crm_privacy_mode');
      if (storedPrivacy === 'true') setPrivacyMode(true);
      const storedLocale = localStorage.getItem('crm_locale') as Locale;
      if (storedLocale && ['es', 'en', 'pt'].includes(storedLocale)) setLocaleState(storedLocale);
    } catch (_) {}
  }, []);

  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('crm_privacy_mode', String(next));
      } catch (_) {}
      return next;
    });
  };

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem('crm_locale', l);
    } catch (_) {}
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations.es[key] || key;
  };

  return (
    <CrmUiContext.Provider
      value={{
        privacyMode,
        togglePrivacyMode,
        locale,
        setLocale,
        t,
        isNewChatModalOpen,
        setIsNewChatModalOpen,
      }}
    >
      <div className={privacyMode ? 'crm-privacy-blur' : ''}>
        {children}
      </div>
    </CrmUiContext.Provider>
  );
}

export function useCrmUi() {
  return useContext(CrmUiContext);
}
