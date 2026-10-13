export interface SendMessageOptions {
  chatId: string;
  message: string;
  mediaBase64?: string;
  fallbackPhone?: string;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  body: string;
  timestamp: number;
  hasMedia?: boolean;
  mediaUrl?: string;
  author?: string;
  ack?: number;
}

export interface ChatSummary {
  id: string;
  name: string;
  phone?: string;
  lastMessage?: string;
  timestamp?: number;
  unreadCount?: number;
}

export interface WhatsAppProviderStatus {
  isReady: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  qrCodeData: string | null;
  lastError: string | null;
  mode?: 'local' | 'remote';
}

export interface WhatsAppProvider {
  name: string;
  getStatus(): Promise<WhatsAppProviderStatus>;
  sendMessage(options: SendMessageOptions): Promise<any>;
  getRecentChats(limit?: number): Promise<ChatSummary[]>;
  getChatMessages(chatId: string, days?: number, limit?: number): Promise<ChatMessage[]>;
  downloadMedia(messageId: string): Promise<{ data: string; mimetype: string }>;
  sendBulk?(recipients: Array<{ phone: string; message: string }>): Promise<any>;
  postStatusUpdate?(content: string): Promise<any>;
}

// OpenWA Gateway Provider implementation
import * as OpenWAService from './whatsapp';

export class OpenWAProvider implements WhatsAppProvider {
  name = 'OpenWA Gateway';

  async getStatus(): Promise<WhatsAppProviderStatus> {
    return OpenWAService.getWhatsAppStatus();
  }

  async sendMessage(options: SendMessageOptions): Promise<any> {
    return OpenWAService.sendMessage(
      options.chatId,
      options.message,
      options.mediaBase64,
      options.fallbackPhone
    );
  }

  async getRecentChats(limit = 200): Promise<ChatSummary[]> {
    return OpenWAService.getRecentChats(limit);
  }

  async getChatMessages(chatId: string, days = 2, limit = 100): Promise<ChatMessage[]> {
    return OpenWAService.getChatMessages(chatId, days, limit);
  }

  async downloadMedia(messageId: string): Promise<{ data: string; mimetype: string }> {
    return OpenWAService.downloadMedia(messageId);
  }

  async sendBulk(recipients: Array<{ phone: string; message: string }>): Promise<any> {
    const results = [];
    for (const r of recipients) {
      try {
        const res = await this.sendMessage({ chatId: r.phone, message: r.message });
        results.push({ phone: r.phone, success: true, res });
      } catch (err: any) {
        results.push({ phone: r.phone, success: false, error: err.message });
      }
    }
    return results;
  }
}

// Provider Singleton / Factory
let defaultProvider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!defaultProvider) {
    defaultProvider = new OpenWAProvider();
  }
  return defaultProvider;
}
