import { apiClient } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const assistantService = {
  /** POST /api/assistant/chat */
  chat: async (message: string, history: ChatMessage[], context?: string): Promise<string> => {
    const res = await apiClient.post<unknown, { data: { reply: string } }>('/assistant/chat', {
      message,
      history,
      context,
    });
    return res.data.reply;
  },

  /** POST /api/assistant/improve-text */
  improveText: async (text: string, kind: 'product_description' | 'rfq_requirements'): Promise<string> => {
    const res = await apiClient.post<unknown, { data: { improved: string } }>('/assistant/improve-text', {
      text,
      kind,
    });
    return res.data.improved;
  },
};
