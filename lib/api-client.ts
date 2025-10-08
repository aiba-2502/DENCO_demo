/**
 * DENCO Voice AI System - API Client
 * フロントエンドからバックエンドAPIにアクセスするためのクライアント
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const NODE_API_URL = process.env.NEXT_PUBLIC_NODE_BACKEND_URL || 'http://localhost:3001';

// デフォルトのテナントID（開発用）
const DEFAULT_TENANT_ID = 'default-tenant';

/**
 * APIリクエストのヘルパー関数
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEFAULT_TENANT_ID}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// ==================== 顧客管理 API ====================

export const customersApi = {
  list: async (params?: { search?: string; tag_id?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.tag_id) query.append('tag_id', params.tag_id);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return apiRequest<{
      status: string;
      customers: any[];
      total: number;
    }>(`/api/customers?${query}`);
  },

  get: async (customerId: string) => {
    return apiRequest<{ status: string; customer: any }>(`/api/customers/${customerId}`);
  },

  create: async (data: any) => {
    return apiRequest<{ status: string; customer: any }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (customerId: string, data: any) => {
    return apiRequest<{ status: string; customer: any }>(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (customerId: string) => {
    return apiRequest<{ status: string }>(`/api/customers/${customerId}`, {
      method: 'DELETE',
    });
  },

  callHistory: async (customerId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return apiRequest<{
      status: string;
      call_history: any[];
      total: number;
    }>(`/api/customers/${customerId}/call-history?${query}`);
  },
};

// ==================== タグ管理 API ====================

export const tagsApi = {
  list: async () => {
    return apiRequest<{ status: string; tags: any[] }>('/api/tags');
  },

  create: async (data: { name: string; color: string }) => {
    return apiRequest<{ status: string; tag: any }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (tagId: string, data: { name?: string; color?: string }) => {
    return apiRequest<{ status: string; tag: any }>(`/api/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (tagId: string) => {
    return apiRequest<{ status: string }>(`/api/tags/${tagId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ナレッジ API ====================

export const knowledgeApi = {
  articles: {
    list: async (params?: { search?: string; category_id?: string; tag_id?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.category_id) query.append('category_id', params.category_id);
      if (params?.tag_id) query.append('tag_id', params.tag_id);
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.offset) query.append('offset', params.offset.toString());
      
      return apiRequest<{
        status: string;
        articles: any[];
        total: number;
      }>(`/api/knowledge/articles?${query}`);
    },

    create: async (data: any) => {
      return apiRequest<{ status: string; article: any }>('/api/knowledge/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (articleId: string, data: any) => {
      return apiRequest<{ status: string; article: any }>(`/api/knowledge/articles/${articleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (articleId: string) => {
      return apiRequest<{ status: string }>(`/api/knowledge/articles/${articleId}`, {
        method: 'DELETE',
      });
    },
  },

  inquiries: {
    list: async (params?: { customer_id?: string; status?: string; priority?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.customer_id) query.append('customer_id', params.customer_id);
      if (params?.status) query.append('status', params.status);
      if (params?.priority) query.append('priority', params.priority);
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.offset) query.append('offset', params.offset.toString());
      
      return apiRequest<{
        status: string;
        inquiries: any[];
        total: number;
      }>(`/api/knowledge/inquiries?${query}`);
    },

    create: async (data: any) => {
      return apiRequest<{ status: string; inquiry: any }>('/api/knowledge/inquiries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (inquiryId: string, data: any) => {
      return apiRequest<{ status: string; inquiry: any }>(`/api/knowledge/inquiries/${inquiryId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  categories: {
    list: async () => {
      return apiRequest<{ status: string; categories: any[] }>('/api/knowledge/categories');
    },

    create: async (data: { name: string; description?: string }) => {
      return apiRequest<{ status: string; category: any }>('/api/knowledge/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    delete: async (categoryId: string) => {
      return apiRequest<{ status: string }>(`/api/knowledge/categories/${categoryId}`, {
        method: 'DELETE',
      });
    },
  },
};

// ==================== 通話管理 API ====================

export const callsApi = {
  list: async (params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return apiRequest<{
      status: string;
      calls: any[];
      total: number;
    }>(`/api/calls?${query}`);
  },

  active: async () => {
    return apiRequest<{
      status: string;
      calls: any[];
      count: number;
    }>('/api/calls/active');
  },

  get: async (callId: string) => {
    return apiRequest<{
      status: string;
      session: any;
      messages: any[];
    }>(`/api/calls/${callId}`);
  },

  messages: async (callId: string) => {
    return apiRequest<{
      status: string;
      call_id: string;
      messages: any[];
    }>(`/api/calls/${callId}/messages`);
  },

  statistics: async (params?: { start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    
    return apiRequest<{
      status: string;
      statistics: any;
    }>(`/api/statistics?${query}`);
  },
  
  // Node.js Backend (Asterisk統合)
  nodeApi: {
    active: async () => {
      return apiRequest<{
        status: string;
        calls: any[];
        count: number;
      }>('/api/calls/active', {}, NODE_API_URL);
    },

    disconnect: async (callId: string) => {
      return apiRequest<{ status: string }>(`/api/calls/${callId}/disconnect`, {
        method: 'POST',
      }, NODE_API_URL);
    },

    originate: async (data: { phoneNumber: string; callerId?: string }) => {
      return apiRequest<{
        status: string;
        channelId: string;
        phoneNumber: string;
      }>('/api/calls/originate', {
        method: 'POST',
        body: JSON.stringify(data),
      }, NODE_API_URL);
    },

    asteriskStatus: async () => {
      return apiRequest<{
        status: string;
        connected: boolean;
        host: string;
        ariPort: number;
        appName: string;
      }>('/api/asterisk/status', {}, NODE_API_URL);
    },
  },
};

// ==================== AI架電 API ====================

export const campaignsApi = {
  templates: {
    list: async () => {
      return apiRequest<{ status: string; templates: any[] }>('/api/campaigns/templates');
    },

    create: async (data: any) => {
      return apiRequest<{ status: string; template: any }>('/api/campaigns/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    delete: async (templateId: string) => {
      return apiRequest<{ status: string }>(`/api/campaigns/templates/${templateId}`, {
        method: 'DELETE',
      });
    },
  },

  list: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return apiRequest<{
      status: string;
      campaigns: any[];
      total: number;
    }>(`/api/campaigns?${query}`);
  },

  create: async (data: any) => {
    return apiRequest<{ status: string; campaign: any }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  start: async (campaignId: string) => {
    return apiRequest<{ status: string }>(`/api/campaigns/${campaignId}/start`, {
      method: 'POST',
    });
  },

  logs: async (campaignId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    
    return apiRequest<{
      status: string;
      logs: any[];
      total: number;
    }>(`/api/campaigns/${campaignId}/logs?${query}`);
  },
};

// ==================== テナント管理 API ====================

export const tenantsApi = {
  list: async () => {
    return apiRequest<{ status: string; tenants: any[] }>('/api/tenants');
  },

  get: async (tenantId: string) => {
    return apiRequest<{ status: string; tenant: any }>(`/api/tenants/${tenantId}`);
  },

  create: async (data: any) => {
    return apiRequest<{ status: string; tenant: any }>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (tenantId: string, data: any) => {
    return apiRequest<{ status: string; tenant: any }>(`/api/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (tenantId: string) => {
    return apiRequest<{ status: string }>(`/api/tenants/${tenantId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 設定管理 API ====================

export const settingsApi = {
  getAll: async () => {
    return apiRequest<{
      status: string;
      settings: any;
      source: any;
    }>('/api/settings');
  },

  update: async (settings: any) => {
    return apiRequest<{
      status: string;
      message: string;
    }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// ==================== ヘルスチェック API ====================

export const healthApi = {
  python: async () => {
    return apiRequest<{
      status: string;
      timestamp: string;
      service: string;
      database: string;
    }>('/health');
  },

  node: async () => {
    return apiRequest<{
      status: string;
      timestamp: string;
      asterisk: { connected: boolean };
      activeCalls: number;
    }>('/health', {}, NODE_API_URL);
  },
};

// ==================== WebSocket接続 ====================

export function createWebSocketConnection(callId: string): WebSocket {
  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws/frontend`;
  return new WebSocket(wsUrl);
}

// ==================== エクスポート ====================

export const api = {
  customers: customersApi,
  tags: tagsApi,
  knowledge: knowledgeApi,
  calls: callsApi,
  campaigns: campaignsApi,
  tenants: tenantsApi,
  settings: settingsApi,
  health: healthApi,
};

export default api;

