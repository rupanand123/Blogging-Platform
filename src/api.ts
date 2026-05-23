import { BlogPost, BlogComment, User, AuthResponse } from "./types";

const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("blog_auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || `HTTP error! Status: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Authentication Actions
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await handleResponse<AuthResponse>(res);
    localStorage.setItem("blog_auth_token", data.token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<AuthResponse>(res);
    localStorage.setItem("blog_auth_token", data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getHeaders(),
      });
    } catch (e) {
      console.warn("Server logout failed, clearing local state anyway:", e);
    } finally {
      localStorage.removeItem("blog_auth_token");
    }
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  // Blog Post Actions
  async getPosts(): Promise<BlogPost[]> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<BlogPost[]>(res);
  },

  async getPost(id: string): Promise<BlogPost> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<BlogPost>(res);
  },

  async createPost(title: string, content: string): Promise<BlogPost> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, content }),
    });
    return handleResponse<BlogPost>(res);
  },

  async updatePost(id: string, title: string, content: string): Promise<BlogPost> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ title, content }),
    });
    return handleResponse<BlogPost>(res);
  },

  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Comment Actions
  async getComments(postId: string): Promise<BlogComment[]> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<BlogComment[]>(res);
  },

  async createComment(postId: string, content: string): Promise<BlogComment> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse<BlogComment>(res);
  },

  async deleteComment(commentId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
