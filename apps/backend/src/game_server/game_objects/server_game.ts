import { initTRPC } from '@trpc/server';
import { Wall, Ball, Paddle, createSurroundingWalls, GameState,
		createWalls, createBalls, createPlayers, createGoals,
		createGround, createPaddles, Player, Goal, jsonToVector2, type GamePos } from '../index';
import { Engine, Scene, Vector3, HavokPlugin } from '@babylonjs/core';

const maxPlayerCount = 6;
const playerLives = 3;

export class ServerGame
{
	private engine: Engine;
	private scene: Scene;
	private havokInstance: any;
	private dimensions: [number, number];
	private gameIsRunning: boolean;
	private	gameCanvas: HTMLCanvasElement;
	private gameState: GameState;
	
	private jsonMap: any;
	private clients: { id: number; alias: string }[];
	private players: Player[] = [];	
	private paddles: Paddle[] = [];
	private balls: Ball[] = [];
	private walls: Wall[] = [];
	private goals: Goal[] = [];
	private playerCount: number = 0;

	constructor(havokInstance: any, matchID: number, clients: { id: number; alias: string }[])
	{
		this.gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.havokInstance = havokInstance;
		this.dimensions = [0, 0];
		this.gameIsRunning = true;
		this.engine = new Engine(this.gameCanvas, true, {antialias: true});
		this.scene = new Scene(this.engine);
		this.gameState = new GameState(matchID);
		this.clients = clients;
		console.log('Game started');
	}

	async loadMap(inputFile: string)
	{
		const fileText = await loadFileText(inputFile);
		
		const map = JSON.parse(fileText);
		
		if (!map.dimensions || !map.balls || !map.goals)
		{
			throw new Error('Invalid map format');
		}
		this.createScene(map);
		this.initGameState();
		this.jsonMap = map;
	}

	private initGameState()
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
		const players = this.clients;

		for (let i = 0; i < this.players.length; i++)
		{
			state.players.push(
			{
				id: players[i].id,
				alias: players[i].alias,
				lives: 3,
				position: this.paddles[i].getPosition(),
				isAlive: true,
				isReady: false,
				action: []
			});
		}
		state.set(matchId, initialState);
		this.notifySubs(matchId, initialState);

		for (let j = 0; j < this.balls.length; j++)
		{
			state.balls.push(this.balls[j].getPosition());
		}
		state.lastUpdate = Date.now();
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
		createWalls(scene, this.walls, map.walls);
		createGoals(scene, this.goals, map);
		createPaddles(scene, this.paddles, map.goals);
		createPlayers(this.players, this.goals, this.paddles);

		this.scene = scene;
		this.playerCount = this.players.length;
	}

	private startGame()
	{
		this.gameIsRunning = true;
		this.engine.runRenderLoop(this.gameLoop.bind(this));
	}

	private gameFinished()
	{
		this.gameIsRunning = false;
		this.engine.stopRenderLoop();
		console.log('Game finished');
	}

	run()
	{
		// wait for everyone to be ready
		this.startGame();
	}

	private updateGameState()
	{
		const state = this.gameState;
		
		for (let i = 0; i < this.players.length; i++)
		{
			state.players[i].position = this.paddles[i].getPosition();
			state.players[i].lives = this.players[i].getLives();
			if (state.players[i].lives <= 0)
			{
				state.players[i].isAlive = false;
			}
		}
		state.balls = [];
		for (let i = 0; i < this.balls.length; i++)
		{
			state.balls.push(this.balls[i].getPosition());
		}
		state.lastUpdate = Date.now();
	}

	private updatePlayerInput()
	{
		const state = this.gameState;
		let direction = 0;

		for (let i = 0; i < state.players.length; i++)
		{
			switch (state.players[i].action[0].action)
			{
				case '1':
					direction = 1;
					break;
				case '-1':
					direction = -1;
					break;
				case '0':
					direction = 0;
					break;
				default:
					direction = 0;
					break;
			}
			this.paddles[i].update(direction, direction != 0 ? true : false, this.walls);
		}
	}

	private gameLoop()
	{
		let scored = false;

		this.updatePlayerInput();
		if (this.gameIsRunning == true)
		{
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
						i--;
						scored = true;
						break;
					}
				}
				if (scored == false)
				{
					this.balls[i].update(this.paddles, this.walls);
				}
				if (this.balls.length == 0)
				{
					for (let j = 0; j < this.players.length; j++)
					{
						this.paddles[j].reset();
					}
					createBalls(this.scene, this.balls, this.jsonMap);
				}
				scored = false;
			}
		}
		this.updateGameState();
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

async function loadFileText(filePath: string): Promise<string>
{
	const response = await fetch(filePath);

	if (response.ok == false)
	{
		throw new Error(`Failed to load file: ${filePath}`);
	}
	return response.text();
}

/*	Destroys the resources associated with the game	*/

export async function destroyGame(game: ServerGame)
{
	game.dispose();
}

