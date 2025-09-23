/* import { z } from 'zod';

const PlayerSchema = z.object({
	id: z.number(),
	alias: z.string(),
	lives: z.number(),
	position: z.object({
		x: z.number(),
		z: z.number(),
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
	z: z.number(),
	}),
	velocity: z.object({
	x: z.number(),
	z: z.number(),
	}),
})
});

export const PlayerActionSchema = z.object({
playerId: z.number().optional(),
matchId: z.number(),
action: z.enum(['1', '-1', '0' ]),
});

export type Player = z.infer<typeof PlayerSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type PlayerAction = z.infer<typeof PlayerActionSchema>; */

export interface Player
{
	id: number;
	alias: string;
	lives: number;
	position: GamePos;
	isAlive: boolean;
	isReady: boolean;
	action: PlayerAction[];
};

export class GameState
{
	matchId: number = 0;
	status: 'waiting' | 'in_progress' | 'paused' | 'finished' = 'waiting';
	players: Player[] = [];
	lastUpdate: number = 0;
	balls: GamePos[] = [];

	constructor(matchId: number)
	{
		this.matchId = matchId;
	}
};

export interface PlayerAction
{
	action: '1' | '-1' | '0';
	id: number;
}

export interface GamePos
{
	x: number;
	z: number;
}