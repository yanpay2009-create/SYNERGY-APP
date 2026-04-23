import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic Authentication Middleware (Simulated for demo)
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In a real app, verify JWT or session here
  // For now, we'll check for a custom header to simulate auth
  const authHeader = req.headers["x-synergy-auth"];
  if (!authHeader && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
  }));

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.APP_URL || "*", // Restrict origin in production
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json({ limit: "10mb" })); // Increased limit for base64 images/videos

  // Initialize Gemini AI
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.get("/api/health", (req, res) => {
    const now = new Date();
    const thailandTime = new Date(now.getTime() + (7 * 3600000));
    res.json({ status: "ok", timestamp: thailandTime.toISOString() });
  });

  app.get("/api/state", authenticate, (req, res) => {
    res.json(appState);
  });

  app.post("/api/orders", authenticate, (req, res) => {
    const order = req.body;
    
    // Basic Validation
    if (!order || !order.id || !order.total) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    appState.orders.push(order);
    io.emit("order:created", order);
    res.status(201).json(order);
  });

  app.post("/api/notifications", authenticate, (req, res) => {
    const notification = req.body;

    // Basic Validation
    if (!notification || !notification.title || !notification.message) {
      return res.status(400).json({ error: "Invalid notification data" });
    }

    appState.notifications.push(notification);
    io.emit("notification:new", notification);
    res.status(201).json(notification);
  });

  // AI Content Generation Endpoint
  app.post("/api/ai/generate", authenticate, async (req, res) => {
    try {
      const { prompt, model = "gemini-2.0-flash-exp" } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // AI Media Analysis Endpoint
  app.post("/api/ai/analyze", authenticate, async (req, res) => {
    try {
      const { media, mediaType, prompt, model = "gemini-2.0-flash-exp" } = req.body;
      if (!media || !mediaType || !prompt) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const imagePart = {
        inlineData: {
          data: media.split(",")[1] || media,
          mimeType: mediaType === "video" ? "video/mp4" : "image/png"
        }
      };

      const response = await genAI.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }, imagePart] }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ error: error.message || "Failed to analyze media" });
    }
  });

  // AI Image Transformation Endpoint
  app.post("/api/ai/transform", authenticate, async (req, res) => {
    try {
      const { media, prompt, model = "gemini-2.0-flash-exp" } = req.body;
      if (!media || !prompt) return res.status(400).json({ error: "Missing media or prompt" });

      const imagePart = {
        inlineData: {
          data: media.split(",")[1] || media,
          mimeType: "image/png"
        }
      };

      const response = await genAI.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }, imagePart] }
      });
      
      const imageResult = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (imageResult) {
        res.json({ 
          image: `data:${imageResult.inlineData.mimeType};base64,${imageResult.inlineData.data}` 
        });
      } else {
        res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error("AI Transformation failed:", error);
      res.status(500).json({ error: error.message || "Failed to transform image" });
    }
  });

  // Basic In-memory store logic
  let appState = {
    orders: [],
    commissions: [],
    feed: [],
    notifications: [],
    activePromotion: null as any
  };

  // Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send active promotion to new client if exists
    if (appState.activePromotion) {
      socket.emit("promotion:broadcast", appState.activePromotion);
    }

    socket.on("user:join", (userId) => {
      console.log(`User ${userId} joined room`);
      socket.join(userId);
    });

    socket.on("order:created", (order) => {
      console.log("New order created:", order.id);
      // Notify admins
      io.emit("admin:new_order", order);
    });

    socket.on("commission:new", (data) => {
      console.log("New commission for user:", data.userId);
      io.to(data.userId).emit("commission:new", data);
    });

    socket.on("notification:new", (data) => {
      console.log("New notification for user:", data.userId);
      if (data.userId === 'global') {
        io.emit("notification:new", data);
      } else {
        io.to(data.userId).emit("notification:new", data);
      }
    });

    socket.on("admin:broadcast_promotion", (promo) => {
      console.log("Admin broadcasting promotion:", promo.title);
      appState.activePromotion = promo;
      io.emit("promotion:broadcast", promo);
    });

    socket.on("admin:stop_broadcast", () => {
      console.log("Admin stopping broadcast");
      appState.activePromotion = null;
      io.emit("promotion:stop");
    });

    socket.on("admin:approve_post", (postId) => {
      console.log("Admin approved post:", postId);
      io.emit("post:approved", postId);
    });

    socket.on("admin:verify_payment", (data) => {
      // data should contain orderId and userId
      console.log("Admin verified payment for order:", data.orderId);
      io.to(data.userId).emit("order:verified", data.orderId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
