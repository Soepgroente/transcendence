
Players send actions to the server, which processes them and broadcasts updated game state:

### **Player Actions**
```typescript
interface PlayerAction {
  action: '1' | '-1' | '0' | 'ready';
  matchId: number;
  playerId?: number;
}
```


## **Data Flow**

### **Real-time Flow**

1. **Player Input** → Frontend captures keyboard input
2. **Send Action** → tRPC mutation sends action to backend
3. **Server Processing** → Game engine validates and updates state
4. **State Broadcast** → Server broadcasts new state via subscription
5. **Frontend Render** → Babylon.js updates 3D visualization


```
┌─────────────┐
│   Frontend  │ (Babylon.js renders game)
│  (SvelteKit)│
└──────┬──────┘
       │ Player Input (tRPC Mutation)
       ↓
┌─────────────────────────────────────┐
│          Backend (Fastify)          │
│  ┌──────────────────────────────┐   │
│  │   Game State Manager         │   │ ← Authoritative game state
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Game Engine                │   │ ← Physics & collision
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Services (Tournament,      │   │ ← Business logic
│  │   Match, User, Auth)         │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Database (SQLite + Drizzle)│   │
│  └──────────────────────────────┘   │
└─────────────┬───────────────────────┘
              │ Game State (tRPC Subscription)
              ↓
       ┌─────────────┐
       │   Frontend  │ (Updates rendering)
       └─────────────┘
```
