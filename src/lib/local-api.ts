// Local API client to replace Firebase functions

const API_BASE_URL = 'http://localhost:3000/api';

// Authentication
export const localAuth = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
  },

  getCurrentUser() {
    const user = localStorage.getItem('adminUser');
    const token = localStorage.getItem('authToken');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('authToken');
  }
};

// Generic API request helper
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localAuth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `API request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      message = errorData.error || errorData.message || message;
    } catch {
      // Ignore JSON parse failures and keep the default message.
    }
    throw new Error(message);
  }

  return response.json();
}

// News API
export const newsAPI = {
  async getAll() {
    return apiRequest('/news');
  },

  async create(data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/news`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create news');
    }

    return response.json();
  },

  async update(id: string, data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update news');
    }

    return response.json();
  },

  async delete(id: string) {
    return apiRequest(`/news/${id}`, { method: 'DELETE' });
  }
};

// Volunteers API
export const volunteersAPI = {
  async getAll() {
    return apiRequest('/volunteers');
  },

  async create(data: any) {
    return apiRequest('/volunteers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: any) {
    return apiRequest(`/volunteers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Complaints API
export const complaintsAPI = {
  async getAll() {
    return apiRequest('/complaints');
  },

  async create(data: any) {
    return apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: any) {
    return apiRequest(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Events API
export const eventsAPI = {
  async getAll() {
    return apiRequest('/events');
  },

  async create(data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create event');
    }

    return response.json();
  },

  async update(id: string, data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update event');
    }

    return response.json();
  },

  async delete(id: string) {
    return apiRequest(`/events/${id}`, { method: 'DELETE' });
  }
};

// Gallery API
export const galleryAPI = {
  async getAll() {
    return apiRequest('/gallery');
  },

  async create(data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/gallery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create gallery item');
    }

    return response.json();
  },

  async update(id: string, data: any) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localAuth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update gallery item');
    }

    return response.json();
  },

  async delete(id: string) {
    return apiRequest(`/gallery/${id}`, { method: 'DELETE' });
  }
};

// Voters API
export const votersAPI = {
  async getAll() {
    return apiRequest('/voters');
  },

  async create(data: any) {
    return apiRequest('/voters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: any) {
    return apiRequest(`/voters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return apiRequest(`/voters/${id}`, { method: 'DELETE' });
  }
};

// Council Members API
export const councilMembersAPI = {
  async getAll() {
    return apiRequest('/council-members');
  },

  async create(data: any) {
    return apiRequest('/council-members', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return apiRequest(`/council-members/${id}`, { method: 'DELETE' });
  }
};

// Councilor Profile API
export const councilorAPI = {
  async get() {
    return apiRequest('/councilor');
  },

  async update(data: any) {
    return apiRequest('/councilor', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Admin users API
export const adminUsersAPI = {
  async getAll() {
    return apiRequest('/admins');
  },

  async create(data: any) {
    return apiRequest('/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: any) {
    return apiRequest(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return apiRequest(`/admins/${id}`, { method: 'DELETE' });
  }
};

// Voter Verification API
export const voterAPI = {
  async verify(nid: string, dob: string) {
    return apiRequest('/voter/verify', {
      method: 'POST',
      body: JSON.stringify({ nid, dob })
    });
  }
};
