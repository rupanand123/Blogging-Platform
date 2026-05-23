import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server_db.json");

// Helper: Salting for basic secure password hashing natively in Node
const PASSWORD_SALT = "BloggingPlatform_Secure_Salt_2026_Key";

interface DbUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface DbPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface DbComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: DbUser[];
  posts: DbPost[];
  comments: DbComment[];
}

// Ensure database file exists and is populated
function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read database file, initializing fresh:", error);
  }

  // Pre-seed some beautiful blogging content
  const adminId = "user_admin_seed";
  const initialUsers: DbUser[] = [
    {
      id: adminId,
      username: "editorial_voice",
      email: "editor@bloggingplatform.com",
      passwordHash: hashPassword("editor123"),
      createdAt: new Date().toISOString(),
    }
  ];

  const initialPosts: DbPost[] = [
    {
      id: "post_1",
      title: "The Art of Modern Web Architecture",
      content: `Developing for the modern web with React and Express means aligning performance, simplicity, and state synchronization. Traditionally, we coupled massive servers and distributed state machines, but true craft comes from simple boundaries. 

By building server-authoritative API paths and keeping the visual layers highly focused, we reduce friction and offer faster interfaces. In this post, we will explore why standard monolithic architectures are enjoying a quiet renaissance, backed by modern compiled toolchains like Vite and esbuild.

### 1. Simple Boundaries
By structuring applications clearly into a client SPA and a unified RESTful server proxy, developers keep API keys safe, avoid CORS issues, and have single-point logging.

### 2. File-Based Persistence
For small-scale tools and prototyping layers, local file-based systems or lightweight embedded engines drastically outperform high-frequency cloud nodes by bypassing network socket overhead entirely.`,
      authorId: adminId,
      authorName: "editorial_voice",
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: "post_2",
      title: "Lessons in Design and Typography Pairings",
      content: `The difference between generic, AI-generated 'slop' layouts and a crafted digital experience comes down to typography, hierarchy, and density. 

When you look at timeless Swiss modernism, you notice:
* Generous negative space that lets text breathe.
* Strong, authoritative display fonts contrasted with highly readable, neutral body fonts.
* Subtle layout shifts that signal structural zones instead of repeated boxes of identical margins.

### Color and Emotion
Avoid generic high-contrast neon gradients that cause visual fatigue. Soft charcoal grays (#1a1a1a) paired with warm cream or soft alabaster white make digital reading comfortable for extended sessions. Focus purely on craft.`,
      authorId: adminId,
      authorName: "editorial_voice",
      createdAt: new Date(Date.now() - 25 * 3600000).toISOString(), // Yesterday
      updatedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
    }
  ];

  const initialComments: DbComment[] = [
    {
      id: "comment_1",
      postId: "post_1",
      authorId: "user_reader_1",
      authorName: "craft_enjoyer",
      content: "This is exactly what I needed to read today. Simple architectures save so much mental space!",
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
    },
    {
      id: "comment_2",
      postId: "post_1",
      authorId: adminId,
      authorName: "editorial_voice",
      content: "@craft_enjoyer couldn't agree more. Simplicity scales mentally much better than complexity.",
      createdAt: new Date(Date.now() - 2.5 * 3600000).toISOString()
    }
  ];

  const newDb: DatabaseSchema = {
    users: initialUsers,
    posts: initialPosts,
    comments: initialComments
  };

  saveDb(newDb);
  return newDb;
}

function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write database file:", error);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

// Initialize database
let db = loadDb();

// Middlewares
app.use(express.json());

// Token simple session lookup table
const activeSessions = new Map<string, string>(); // token -> userId

// Extract User Middleware
function getCurrentUser(req: express.Request): DbUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const userId = activeSessions.get(token);
  if (!userId) return null;
  
  const user = db.users.find(u => u.id === userId);
  return user || null;
}

// Authentication Middlewares
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized access. Please login." });
  }
  (req as any).user = user;
  next();
};

/* ==========================================================================
   REST API ROUTES
   ========================================================================== */

// Auth Register
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  if (normalizedUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  // Reload database in case of parallel server workers/modifications
  db = loadDb();

  const userExists = db.users.some(
    u => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === normalizedUsername.toLowerCase()
  );

  if (userExists) {
    return res.status(400).json({ error: "Username or email is already registered." });
  }

  const newUser: DbUser = {
    id: "user_" + crypto.randomUUID(),
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDb(db);

  // Auto-login after registration
  const token = "token_" + crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, newUser.id);

  const { passwordHash, ...cleanUser } = newUser;
  res.status(201).json({
    user: cleanUser,
    token
  });
});

// Auth Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  db = loadDb();

  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const currentPassHash = hashPassword(password);
  if (user.passwordHash !== currentPassHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = "token_" + crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, user.id);

  const { passwordHash, ...cleanUser } = user;
  res.json({
    user: cleanUser,
    token
  });
});

// Auth Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// Auth Check Session
app.get("/api/auth/me", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Session expired or invalid token" });
  }
  const { passwordHash, ...cleanUser } = user;
  res.json({ user: cleanUser });
});

// GET all posts
app.get("/api/posts", (req, res) => {
  db = loadDb();
  // Return blogs from newest to oldest
  const sortedPosts = [...db.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sortedPosts);
});

// GET post by ID
app.get("/api/posts/:id", (req, res) => {
  db = loadDb();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Blog post not found" });
  }
  res.json(post);
});

// POST create blog post
app.post("/api/posts", requireAuth, (req, res) => {
  const { title, content } = req.body;
  const user = (req as any).user as DbUser;

  if (!title || !content) {
    return res.status(400).json({ error: "Post title and content are required." });
  }

  if (title.trim().length < 5) {
    return res.status(400).json({ error: "Title must be at least 5 characters long." });
  }

  if (content.trim().length < 10) {
    return res.status(400).json({ error: "Content must be at least 10 characters long." });
  }

  db = loadDb();
  const newPost: DbPost = {
    id: "post_" + crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    authorId: user.id,
    authorName: user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.posts.push(newPost);
  saveDb(db);

  res.status(201).json(newPost);
});

// PUT update blog post
app.put("/api/posts/:id", requireAuth, (req, res) => {
  const { title, content } = req.body;
  const user = (req as any).user as DbUser;
  const postId = req.params.id;

  if (!title || !content) {
    return res.status(400).json({ error: "Post title and content are required." });
  }

  db = loadDb();
  const postIndex = db.posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Blog post not found" });
  }

  const post = db.posts[postIndex];

  // Authorization check
  if (post.authorId !== user.id) {
    return res.status(403).json({ error: "You are not authorized to edit this post." });
  }

  const updatedPost: DbPost = {
    ...post,
    title: title.trim(),
    content: content.trim(),
    updatedAt: new Date().toISOString()
  };

  db.posts[postIndex] = updatedPost;
  saveDb(db);

  res.json(updatedPost);
});

// DELETE blog post
app.delete("/api/posts/:id", requireAuth, (req, res) => {
  const user = (req as any).user as DbUser;
  const postId = req.params.id;

  db = loadDb();
  const postIndex = db.posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Blog post not found" });
  }

  const post = db.posts[postIndex];

  // Authorization check
  if (post.authorId !== user.id) {
    return res.status(403).json({ error: "You are not authorized to delete this post." });
  }

  // Remove the post
  db.posts.splice(postIndex, 1);

  // Also remove all comments associated with this post
  db.comments = db.comments.filter(c => c.postId !== postId);

  saveDb(db);

  res.json({ success: true, message: "Blog post and its comments deleted successfully" });
});

// GET comments for a post
app.get("/api/posts/:id/comments", (req, res) => {
  db = loadDb();
  const postId = req.params.id;
  
  // Return comments oldest first for sequential reading
  const comments = db.comments
    .filter(c => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json(comments);
});

// POST create comment on a post
app.post("/api/posts/:id/comments", requireAuth, (req, res) => {
  const { content } = req.body;
  const user = (req as any).user as DbUser;
  const postId = req.params.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Comment content cannot be empty." });
  }

  db = loadDb();
  const postExists = db.posts.some(p => p.id === postId);
  if (!postExists) {
    return res.status(404).json({ error: "Blog post not found" });
  }

  const newComment: DbComment = {
    id: "comment_" + crypto.randomUUID(),
    postId,
    authorId: user.id,
    authorName: user.username,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  saveDb(db);

  res.status(201).json(newComment);
});

// DELETE a comment
app.delete("/api/comments/:commentId", requireAuth, (req, res) => {
  const user = (req as any).user as DbUser;
  const commentId = req.params.commentId;

  db = loadDb();
  const commentIndex = db.comments.findIndex(c => c.id === commentId);

  if (commentIndex === -1) {
    return res.status(404).json({ error: "Comment not found" });
  }

  const comment = db.comments[commentIndex];
  const post = db.posts.find(p => p.id === comment.postId);

  // Author of the comment OR author of the blog post can delete it
  const isCommentAuthor = comment.authorId === user.id;
  const isPostAuthor = post ? post.authorId === user.id : false;

  if (!isCommentAuthor && !isPostAuthor) {
    return res.status(403).json({ error: "You are not authorized to delete this comment." });
  }

  db.comments.splice(commentIndex, 1);
  saveDb(db);

  res.json({ success: true, message: "Comment deleted successfully." });
});

/* ==========================================================================
   VITE INTEGRATION & STATIC SERVING
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    // Mount Vite's middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
