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
  status: z.enum(['waiting', 'in_progress', 'paused', 'finished']),
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

export const GameStateFromClientSchema = z.object({
	action: [-1, 0, 1]
});

export const PlayerActionSchema = z.object({
  playerId: z.number().optional(),
  matchId: z.number(),
  action: z.enum(['1', '-1', '0' ]),
});

export type Player = z.infer<typeof PlayerSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type PlayerAction = z.infer<typeof PlayerActionSchema>;

export interface GameState2
{
	lives: number[];
	balls: Ball[];
	paddles: Paddle[];
	action: number[];
}

export interface Ball
{
	location: { x: number; z: number };
}

export interface Paddle
{
	location: { x: number; z: number };
}

const state: GameState2 = {
	lives: [3, 3],
	balls: [{ location: { x: 0, z: 0 } }],
	paddles: [{ location: { x: 0, z: 0 } }, { location: { x: 0, z: 0 } }],
	action: ['0', '1', '0', '0']
};

state.action = [0, 1];
state.paddles[0] = paddles[0].exportPosition();
state.paddles[0].location.x += state.action[0];
state.paddles[1].location.x += state.action[1];

console.log(state.paddles);