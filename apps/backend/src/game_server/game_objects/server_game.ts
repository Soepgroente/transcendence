import { Wall } from './wall';
import { Ball } from './ball';
import { Paddle } from './paddle';
import { Player } from './player';
import { Goal } from './goal';
import { createSurroundingWalls, createWalls, createBalls, createPlayers,
	 createGoals, createGround, createPaddles } from '../initialize';
import { jsonToVector2 } from '../utils';
import { Engine, Scene, Vector3, HavokPlugin, NullEngine } from '@babylonjs/core';
import { EventEmitter } from 'events';
import { GameStateManager } from '../game-state-manager';
import { performance } from 'perf_hooks';
import { updateMatchStatus } from '../../tournament/match';
import path  from 'path';
import fs from 'fs/promises';
import type { GameState, PlayerAction } from '@repo/trpc/types';

const FIXED_DT_MS = 1000 / 60;
const FIXED_DT_SEC = FIXED_DT_MS / 1000;
const maxPlayerCount = 6;

export class ServerGame extends EventEmitter
{
	gameState: GameState;
	private engine: Engine;
	private scene: Scene;
	private havokInstance: any;
	private dimensions: [number, number];
	private gameIsRunning: boolean;
	private physicsEngine: any;
	
	private jsonMap: any;
	private players: Player[] = [];	
	private paddles: Paddle[] = [];
	private balls: Ball[] = [];
	private walls: Wall[] = [];
	private goals: Goal[] = [];
	private playerCount = 0;
	private actionQueue: PlayerAction[] = [];
	private gameStateManager: GameStateManager;

	constructor(havokInstance: any, gameState: GameState, gameStateManager: GameStateManager)
	{
		super();
		this.havokInstance = havokInstance;
		this.dimensions = [0, 0];
		this.gameIsRunning = true;
		this.engine = new NullEngine();
		this.scene = new Scene(this.engine);
		this.gameState = gameState;
		this.gameStateManager = gameStateManager; 
		console.log('Game_server started', gameState);
	}

	public enqueueAction(action: PlayerAction) 
	{
		this.actionQueue.push(action);
	}
	
	async loadMap(inputFile: string)
	{
		try {
			const fileText = await loadFileText(inputFile);
			const map = JSON.parse(fileText);
			if (!map.dimensions || !map.balls || !map.goals)
			{
				throw new Error('Invalid map format');
			}
			this.createScene(map);
			this.initialGameStateValues();
			this.jsonMap = map;
		} catch (error) {
			console.error('Error loading map:', error);
			throw error;	
		}
	}

	private initialGameStateValues()
	{
		if (this.players.length < 2)
		{
			throw new Error('Map must have at least 2 players.');
		}
		if (this.players.length > maxPlayerCount)
		{
			throw new Error(`Map cannot have more than ${maxPlayerCount} players.`);
		}
		const state = this.gameState;

		for (let i = 0; i < this.players.length; i++)
		{
			state.players[i].position = this.paddles[i].getPosition();
		}
		for (let j = 0; j < this.balls.length; j++)
		{
			state.balls.push(this.balls[j].getPosition());
		}
		state.lastUpdate = performance.now();
	}

	private createScene(map: any)
	{
		const scene = this.scene;
		const havokPlugin = new HavokPlugin(true, this.havokInstance);
		
		scene.enablePhysics(new Vector3(0, -10, 0), havokPlugin);
		
		this.dimensions = jsonToVector2(map.dimensions);
		createGround(scene, this.dimensions);
		createBalls(scene, this.balls, map);
		createSurroundingWalls(scene, this.walls, this.dimensions);
		createWalls(scene, this.walls, map);
		createGoals(scene, this.goals, map);
		createPaddles(scene, this.paddles, map.goals);
		createPlayers(this.players, this.goals, this.paddles);

		this.scene = scene;
		this.physicsEngine = scene.getPhysicsEngine();
		if (this.physicsEngine == null)
		{
			throw new Error('Failed to initialize physics engine.');
		}
		this.playerCount = this.players.length;
	}

	private gameFinished()
	{
		this.gameState.status = 'finished';
		const winner = this.gameState.players.find(p => p.isAlive);
		if (winner)
			updateMatchStatus(this.gameState.matchId, 'finished', winner.id);
		this.gameState.lastUpdate = performance.now();
		this.updateGameState();
		this.gameIsRunning = false;
		this.engine.stopRenderLoop();
		console.log('Game finished and the winner is', winner?.id);
	}

	run()
	{
		console.log('STARTING GAME - waiting for players');
		/*	sets a timeout while clients display "3, 2, 1, START" + 100ms before commencing game	*/
		this.engine.runRenderLoop(this.preGameLoop.bind(this));
	}

	private updateGameState()
	{		
		for (let i = 0; i < this.players.length; i++)
		{
			const p = this.paddles[i].getPosition();

			this.gameState.players[i].position = { x: p.x, z: p.z };
			this.gameState.players[i].lives = this.players[i].getLives?.() ?? this.gameState.players[i].lives;
			this.gameState.players[i].isAlive = this.players[i].isAlive?.() ?? false;
		}
		this.gameState.balls = [];
		this.gameState.balls = this.balls.map(ball => {
			const pos = ball.getPosition();
			return { x: pos.x, z: pos.z };
		});
		this.gameState.lastUpdate = performance.now();
		this.gameStateManager.notifySubs(this.gameState.matchId, this.gameState);
	}

	private preGameLoop()
	{
		this.updateGameState();
		while (this.actionQueue.length > 0)
		{
			const action = this.actionQueue.shift()!;
			const player = this.gameState.players.find(pl => pl.id == action.playerId);
			if (player)
			{
				if (action.action == 'ready')
				{
					player.isReady = true;
					console.log(`Player ${action.playerId} is ready.`);
				}
				if (this.gameState.players.every(p => p.isReady))
				{
					this.gameState.status = 'in_progress'
					updateMatchStatus(this.gameState.matchId, 'playing');
					// Give clients time to show countdown
					setTimeout(() =>
					{
						this.gameIsRunning = true;
						this.engine.stopRenderLoop();
						this.engine.runRenderLoop(this.gameLoop.bind(this));
					}, 3100);
				}
			}
		}
	}

	private processActions()
	{
		while (this.actionQueue.length > 0)
		{
			const action = this.actionQueue.shift()!;

			// isn't this always action.playerID - 1?
			const paddleIndex = this.gameState.players.findIndex(p => p.id == action.playerId);
			if (paddleIndex >= 0)
			{
				let direction: number;
				switch (action.action)
				{
					case '1': direction = 1; break;
					case '-1': direction = -1; break;
					// case '0': direction = 0; break;
					default: direction = 0; break;
				}
				this.paddles[paddleIndex].update(direction, this.walls);
			}
		}
	}

	private updateBallsAndPaddles()
	{
		let scored = false;

		for (let i = 0; i < this.balls.length; i++)
		{
			for (let j = 0; j < this.goals.length; j++)
			{
				if (this.goals[j].score(this.balls[i]) == true)
				{
					this.players[j].loseLife();
					if (this.players[j].isAlive() == false)
					{
						this.playerCount--;
					}
					if (this.playerCount == 1)
					{
						this.gameFinished();
						return;
					}
					this.balls[i].destroy();
					this.balls.splice(i, 1);
					this.balls.push(new Ball
					(
						jsonToVector3(this.jsonMap.balls[i].location),
						0.5, this.scene
					));
					scored = true;
					break;
				}
			}
			if (scored == false)
			{
				this.balls[i].update(this.paddles);
			}
			scored = false;
		}
	}

	private gameLoop()
	{
		if (this.gameIsRunning == true)
		{
			this.processActions();
			this.physicsEngine._step(FIXED_DT_SEC);
			this.updateBallsAndPaddles();
			this.updateGameState();
		}
	}

	dispose()
	{
		this.engine.stopRenderLoop();
		this.scene.dispose();
		this.engine.dispose();
		this.havokInstance = null;
		this.players = [];
		this.paddles = [];
		this.balls = [];
		this.walls = [];
		this.goals = [];
		this.gameIsRunning = false;
		console.log('Game data deleted.');
	}
}

export async function loadFileText(filePath: string): Promise<string> {
	try {
		const absPath = path.resolve(process.cwd(), filePath);
		console.log('Loading map file from:', absPath);
	return await fs.readFile(absPath, 'utf-8');
	} catch (err: any) {
		console.error(`Failed to load file: ${filePath}`, err);
		throw new Error(`Map file not found or unreadable: ${filePath}`);
	}
}

/*	Destroys the resources associated with the game	*/

export function destroyGame(game: ServerGame)
{
	game.dispose();
}