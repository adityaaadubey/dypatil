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

async function parseSafeResponse(res: Response, defaultError: string) {
  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `${defaultError} (${res.status}: ${res.statusText || 'Server Error'})`);
  }
  return data;
}

export const authService = {
  // 1. Session & Auth
  async getSession(): Promise<{ user: User; profile: Profile; wallet: Wallet } | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/session`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text ? JSON.parse(text) : null;
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
    return await parseSafeResponse(res, 'Failed to sign up.');
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await parseSafeResponse(res, 'Failed to log in.');
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
    return await parseSafeResponse(res, 'Failed to load profile.');
  },

  async updateProfile(updates: Partial<Profile>) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    return await parseSafeResponse(res, 'Failed to update profile.');
  },

  // 3. Wallet & Usage
  async getWallet(): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/profile/wallet`, { credentials: 'include' });
    return await parseSafeResponse(res, 'Failed to load wallet.');
  },

  async getUsageAnalytics() {
    const res = await fetch(`${API_BASE}/profile/usage`, { credentials: 'include' });
    return await parseSafeResponse(res, 'Failed to load usage analytics.');
  },

  async getHistory(search: string = '', limit: number = 50): Promise<{ history: ExecutionRecord[] }> {
    const res = await fetch(`${API_BASE}/profile/history?search=${encodeURIComponent(search)}&limit=${limit}`, { credentials: 'include' });
    return await parseSafeResponse(res, 'Failed to load execution history.');
  },

  async deleteHistory(id: string) {
    const res = await fetch(`${API_BASE}/profile/history/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await parseSafeResponse(res, 'Failed to delete history record.');
  },

  // 4. Live Model Execution
  async executePrompt(modelId: string, prompt: string, maxOutputTokens: number = 2048): Promise<ExecutionResponse> {
    const res = await fetch(`${API_BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ modelId, prompt, maxOutputTokens })
    });
    return await parseSafeResponse(res, 'Execution failed.');
  },

  // 5. Admin Endpoints
  async getAdminAnalytics() {
    const res = await fetch(`${API_BASE}/admin/analytics`, { credentials: 'include' });
    return await parseSafeResponse(res, 'Unauthorized or failed to fetch admin analytics.');
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
    return await parseSafeResponse(res, 'Failed to fetch user directory.');
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended') {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return await parseSafeResponse(res, 'Failed to update user status.');
  }
};
