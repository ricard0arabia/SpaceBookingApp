import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
      credentials: true
    }
  });

  const pubClient = createRedisConnection("socket-pub");
  const subClient = createRedisConnection("socket-sub");
  if (pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter enabled.");
  } else {
    logger.warn("Socket.IO Redis adapter disabled. Sticky sessions required for scale.");
  }

  io.on("connection", (socket) => {
    socket.on("calendar:join", (room: string) => {
      socket.join(room);
    });
    socket.on("calendar:leave", (room: string) => {
      socket.leave(room);
    });
  });
  return io;
};

export const getIo = () => io;
