export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
