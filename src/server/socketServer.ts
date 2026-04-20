import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
import { prisma } from "../lib/prisma";
import { getStadiumHeightAt } from "../lib/stadiumUtils";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Mock Match Meta
const matchMeta = {
    homeTeam: "Mumbai Indians",
    awayTeam: "Chennai Super Kings",
    homeScore: [188, 6],
    awayScore: [142, 8],
    overs: 18.2,
    status: "LIVE"
};

const friendSim = [
    { userId: "f-1", name: "Rahul", jersey: "MI", status: "At Seat" },
    { userId: "f-2", name: "Sarah", jersey: "MI", status: "Buying Popcorn" },
    { userId: "f-3", name: "Arjun", jersey: "CSK", status: "At Restroom" }
];

const commentaryPool = [
    "SIX! Rohit Sharma hits it out of the ground!",
    "Bumrah strikes! Chennai reeling under pressure.",
    "The energy at StadiaNav is absolutely electric right now.",
    "Dhoni walks in to a standing ovation.",
    "Security notice: Please stay clear of the pitch boundary."
];

// CV Data Buffer (aggregated over 2 seconds)
let cvDensityBuffer: { x: number, z: number, intensity: number }[] = [];

// Broadcast "Global Density Frames" every 2 seconds
setInterval(() => {
    if (cvDensityBuffer.length > 0) {
        io.emit("GLOBAL_DENSITY_FRAME", { timestamp: Date.now(), data: cvDensityBuffer });
        cvDensityBuffer = [];
    }
}, 2000);

// Broadcast Match Meta every 10 seconds (Simulated)
setInterval(() => {
    io.emit("MATCH_UPDATE", {
        ...matchMeta,
        homeScore: `${matchMeta.homeScore[0]}/${matchMeta.homeScore[1]}`,
        awayScore: `${matchMeta.awayScore[0]}/${matchMeta.awayScore[1]}`,
        overs: matchMeta.overs.toFixed(1)
    });
}, 10000);

// Broadcast Commentary every 15 seconds
setInterval(() => {
    const msg = commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
    io.emit("COMMENTARY_TICKER", msg);
}, 15000);

// Broadcast Friend Status every 12 seconds
setInterval(() => {
    io.emit("FRIEND_METADATA_UPDATE", friendSim);
}, 12000);

// Broadcast Match Clock every 1 second
let clockSeconds = 14 * 60 + 32;
setInterval(() => {
    clockSeconds++;
    const m = Math.floor(clockSeconds / 60);
    const s = clockSeconds % 60;
    io.emit("MATCH_CLOCK", `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}, 1000);

interface UserCoords {
  userId: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

const userSocketMap = new Map<string, string>(); // userId -> socketId
const socketUserMap = new Map<string, string>(); // socketId -> userId

io.on("connection", (socket: Socket) => {
  socket.on("authenticate", async (userId: string) => {
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);
    
    // 1. PATH RECOVERY: Restore navigation state on refresh
    const navState = await prisma.navigationState.findUnique({ where: { userId } });
    if (navState?.activeRouteId) {
      socket.emit("NAV_RECOVERY", { routeId: navState.activeRouteId });
    }
    
    // Recovery: Last known location
    const lastLoc = await prisma.location.findUnique({ where: { userId } });
    if (lastLoc) {
      socket.emit("POSITION_RECOVERY", { x: lastLoc.x, y: lastLoc.y, z: lastLoc.z });
    }
  });

  socket.on("hero_fan_broadcast", async (coords: UserCoords) => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) return;

    // 2. THE GUARD: Anti-Center Snap & Height Protection
    let finalX = coords.x;
    let finalY = coords.y;
    let finalZ = coords.z;

    // If (0,0,0) or null, override with Seat Anchor
    if ((finalX === 0 && finalY === 0 && finalZ === 0) || !finalX) {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { currentLocation: true }
      });
      
      const seat = user?.assignedSeatId ? await prisma.seat.findUnique({ where: { label: user.assignedSeatId } }) : null;
      
      if (seat) {
        finalX = seat.x;
        finalY = seat.y;
        finalZ = seat.z;
      } else {
        return; // Prevent kidnapping if no seat info
      }
    }

    // Height Guard: Check against NavMesh (with 3m tolerance)
    const floorH = getStadiumHeightAt(finalX, finalZ);
    if (Math.abs(finalY - floorH) > 3.0) return;

    // 3. SOCIAL SYNC (Broadcast ONLY to Accepted Friends)
    const friendships = await prisma.socialGraph.findMany({
      where: {
        AND: [
          { status: "ACCEPTED" },
          { OR: [{ senderId: userId }, { receiverId: userId }] }
        ]
      }
    });

    const friendIds = friendships.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    
    friendIds.forEach(fId => {
      const fSocket = userSocketMap.get(fId);
      if (fSocket) {
        io.to(fSocket).emit("FRIEND_LOCATION_UPDATE", {
          friendId: userId,
          coords: { x: finalX, y: finalY, z: finalZ, rotation: coords.rotation }
        });
      }
    });

    // 4. PERSISTENCE (Throttled to 2s)
    handlePersistence(userId, { x: finalX, y: finalY, z: finalZ, rotation: coords.rotation });
  });

  socket.on("SOCIAL_FLARE_TRIGGER", (flare: { x: number, z: number, intensity: number }) => {
      // Broadcast to all clients to render a "Social Flare" on their map
      io.emit("SOCIAL_FLARE", flare);
  });

  socket.on("disconnect", () => {
    const userId = socketUserMap.get(socket.id);
    if (userId) {
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);
    }
  });
});

const lastUpsertMap = new Map<string, number>();
const lastLoggedMap = new Map<string, number>();

async function handlePersistence(userId: string, data: any) {
  const now = Date.now();
  const lastUpsert = lastUpsertMap.get(userId) || 0;

  if (now - lastUpsert < 2000) return; // 2s Throttle
  lastUpsertMap.set(userId, now);

  try {
      // 1. Update Last Known
      await prisma.location.upsert({
        where: { userId },
        update: { ...data },
        create: { userId, ...data }
      });

      // 2. Logging Every 10 Seconds (History)
      const lastLogged = lastLoggedMap.get(userId) || 0;
      if (now - lastLogged > 10000) {
        lastLoggedMap.set(userId, now);
        await prisma.locationHistory.create({
          data: { userId, x: data.x, y: data.y, z: data.z }
        });
      }
  } catch (err) {
      console.error(`[Persistence Error] User ${userId}:`, err);
  }
}

// 5. ADMIN CONTROLS: Section Toggles & Wayfinding Reroute
app.use(express.json());

// Manual CORS Middleware (Strict IPv4/IPv6 Support)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  
  if (req.method === "OPTIONS") {
    console.log("[CORS-Preflight]", req.path);
    return res.sendStatus(200);
  }
  next();
});

app.post("/api/admin/toggle-section", async (req, res) => {
  const { blockId, isActive } = req.body;
  await prisma.navMeshOverride.update({ where: { blockId }, data: { isActive } });
  io.emit("NAV_MESH_UPDATE", { blockId, isActive });
  res.json({ success: true });
});

// 7. SOS DISPATCH & RESOLUTION
app.post("/api/admin/dispatch-sos", async (req, res) => {
    const { alertId, userId, action } = req.body;
    console.log(`[SOS-Dispatch] ID: ${alertId}, User: ${userId}`);
    
    // Notify the specific user that help is coming
    const uSocket = userSocketMap.get(userId);
    if (uSocket) {
        io.to(uSocket).emit("SOS_UPDATE", { alertId, status: "DISPATCHED", message: "Medical staff has been dispatched to your seat." });
    }
    res.json({ success: true });
});

// 8. ORDER STATUS SYNC
app.post("/api/admin/update-order-status", async (req, res) => {
    const { orderId, userId, status } = req.body;
    await prisma.order.update({ where: { id: orderId }, data: { status } });
    
    const uSocket = userSocketMap.get(userId);
    if (uSocket) {
        io.to(uSocket).emit("ORDER_STATUS_UPDATE", { orderId, status });
    }
    res.json({ success: true });
});

// 9. FAN ENGAGEMENT & REWARDS
app.post("/api/fan/vote", async (req, res) => {
    const { optionId, userId } = req.body;
    try {
        await prisma.pollOption.update({
            where: { id: optionId },
            data: { votes: { increment: 1 } }
        });
        
        // Add points for voting
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { loyaltyPoints: { increment: 10 } }
            });
        }
        
        io.emit("POLL_UPDATE", { optionId });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Vote failed" });
    }
});

app.post("/api/fan/points", async (req, res) => {
    const { userId, amount } = req.body;
    try {
        if (userId) {
            const updated = await prisma.user.update({
                where: { id: userId },
                data: { loyaltyPoints: { increment: amount } }
            });
            io.emit("USER_UPDATE", { userId, points: updated.loyaltyPoints });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Points sync failed" });
    }
});

// 9. GLOBAL ADMIN BROADCAST
app.post("/api/admin/broadcast", (req, res) => {
    const { message, type } = req.body; // type: 'emergency' | 'info' | 'commercial'
    io.emit("ADMIN_BROADCAST", { message, type, timestamp: new Date().toISOString() });
    res.json({ success: true });
});

// 6. CV Data Ingestion (Backend Preparation)
app.post("/api/cv/upload-frame", (req, res) => {
    const { simulatedData, cameraId, waitTimes } = req.body;
    
    // Convert generic CV boxes into 3D stadium coordinates (Placeholder CV extraction)
    const extractedCoords = simulatedData || [];
    
    // Feed into the Spatial Density Buffer
    extractedCoords.forEach((coord: any) => cvDensityBuffer.push(coord));

    // If Vision Engine calculated wait times, Broadcast to all UX Clients
    if (waitTimes) {
        io.emit("WAIT_TIMES_UPDATE", waitTimes);
    }

    res.json({ success: true, pointsProcessed: extractedCoords.length, cameraId });
});

// 7. MIDNIGHT HISTORY API
app.get("/api/user/midnight-history/:userId", async (req, res) => {
  const { userId } = req.params;
  const history = await prisma.locationHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
  res.json(history);
});

const PORT = 3002;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`STADIANAV SYNC ENGINE ONLINE`);
    console.log(`Endpoint: http://127.0.0.1:${PORT}`);
    console.log(`=========================================`);
});
