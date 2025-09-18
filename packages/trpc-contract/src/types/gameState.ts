import { z } from 'zod';

const PlayerSchema = z.object({
  id: z.number(),
  alias: z.string(),
  lives: z.number(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  isAlive: z.boolean(),
  isReady: z.boolean(),
});

export const GameStateSchema = z.object({
  matchId: z.number(),
  status: z.enum(['waiting', 'playing', 'paused', 'finished']),
  players: z.array(PlayerSchema),
  currentRound: z.number(),
  lastUpdate: z.date(),
  ball: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    velocity: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }),
});

export const PlayerActionSchema = z.object({
  playerId: z.number().optional(),
  matchId: z.number(),
  action: z.enum(['up', 'down', 'stop', 'ready', 'pause']),
});

export type Player = z.infer<typeof PlayerSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type PlayerAction = z.infer<typeof PlayerActionSchema>;
