const API_BASE = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
  }

  return data;
}

export { API_BASE };