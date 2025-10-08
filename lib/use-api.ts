/**
 * カスタムフックでAPIデータを取得
 */

import { useState, useEffect } from 'react';
import { api } from './api-client';

export function useCustomers(search?: string, tagId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.customers.list({ search, tag_id: tagId, limit: 100 });
      setData(response.customers);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [search, tagId]);

  return { data, loading, error, reload };
}

export function useTags() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.tags.list();
      setData(response.tags);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, error, reload };
}

export function useCalls(limit: number = 50) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.calls.list({ limit });
      setData(response.calls);
      setTotal(response.total);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [limit]);

  return { data, total, loading, error, reload };
}

export function useActiveCalls() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      const response = await api.calls.active();
      setData(response.calls);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load active calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 5000); // 5秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, reload };
}

export function useKnowledgeArticles(search?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.knowledge.articles.list({ search, limit: 100 });
      setData(response.articles);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [search]);

  return { data, loading, error, reload };
}

export function useInquiries() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.knowledge.inquiries.list({ limit: 100 });
      setData(response.inquiries);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, error, reload };
}

export function useTenants() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.tenants.list();
      setData(response.tenants);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, error, reload };
}

export function useCampaigns() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.campaigns.list({ limit: 100 });
      setData(response.campaigns);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, error, reload };
}

export function useTemplates() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const response = await api.campaigns.templates.list();
      setData(response.templates);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, error, reload };
}

