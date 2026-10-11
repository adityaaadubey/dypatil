// VeyraLabs Client API Service for Auth, Profile, Wallet, and Execution

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  created_at?: string;
  last_login?: string;
}

export interface Profile {
  display_name: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  preferred_theme: 'dark' | 'light';
  preferred_language: string;
  updated_at?: string;
}

export interface Wallet {
  availableTrialCredits: number;
  usedCredits: number;
  reservedCredits: number;
  updatedAt?: string;
}

export interface ExecutionRecord {
  id: string;
  request_id: string;
  model_id: string;
  provider: string;
  prompt: string;
  response_text: string;
  input_tokens: number;
  output_tokens: number;
  cost_estimate: number;
  latency_ms: number;
  status: 'success' | 'failed';
  error_message?: string;
  cache_hit: number;
  created_at: string;
}

export interface ExecutionResponse {
  requestId: string;
  model: string;
  provider: string;
  text: string;
  tokens: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  costEstimateUsd: number;
  creditsDeducted: number;
  remainingCredits: number;
  cacheHit: boolean;
}

const API_BASE = '/api';

export const authService = {
  // 1. Session & Auth
  async getSession(): Promise<{ user: User; profile: Profile; wallet: Wallet } | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/session`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async signup(name: string, email: string, password: string, phone?: string) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign up.');
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log in.');
    return data;
  },

  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  },

  // 2. Profile & Preferences
  async getProfile() {
    const res = await fetch(`${API_BASE}/profile`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load profile.');
    return await res.json();
  },

  async updateProfile(updates: Partial<Profile>) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
    return data;
  },

  // 3. Wallet & Usage
  async getWallet(): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/profile/wallet`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load wallet.');
    return await res.json();
  },

  async getUsageAnalytics() {
    const res = await fetch(`${API_BASE}/profile/usage`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load usage analytics.');
    return await res.json();
  },

  async getHistory(search: string = '', limit: number = 50): Promise<{ history: ExecutionRecord[] }> {
    const res = await fetch(`${API_BASE}/profile/history?search=${encodeURIComponent(search)}&limit=${limit}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load execution history.');
    return await res.json();
  },

  async deleteHistory(id: string) {
    const res = await fetch(`${API_BASE}/profile/history/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete history record.');
    return data;
  },

  // 4. Live Model Execution
  async executePrompt(modelId: string, prompt: string, maxOutputTokens: number = 2048): Promise<ExecutionResponse> {
    const res = await fetch(`${API_BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ modelId, prompt, maxOutputTokens })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Execution failed.');
    return data;
  },

  // 5. Admin Endpoints
  async getAdminAnalytics() {
    const res = await fetch(`${API_BASE}/admin/analytics`, { credentials: 'include' });
    if (!res.ok) throw new Error('Unauthorized or failed to fetch admin analytics.');
    return await res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch user directory.');
    return await res.json();
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended') {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user status.');
    return data;
  }
};
