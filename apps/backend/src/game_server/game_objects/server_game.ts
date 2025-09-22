import { Wall, Ball, Paddle, createSurroundingWalls,
		createWalls, createBalls, createPlayers, createGoals,
		createGround, createPaddles, Player, Goal, jsonToVector2 } from '../index';
import { Engine, Scene, Vector3, HavokPlugin } from '@babylonjs/core';

const maxPlayerCount = 6;

export class ServerGame
{
	private engine: Engine;
	private scene: Scene;
	private havokInstance: any;
	private dimensions: [number, number];
	private gameIsRunning: boolean;
	private	gameCanvas: HTMLCanvasElement;
	
	private jsonMap: any;
	private scoreboard: number[] = [];
	private players: Player[] = [];	
	private paddles: Paddle[] = [];
	private balls: Ball[] = [];
	private walls: Wall[] = [];
	private goals: Goal[] = [];
	private playerCount: number = 0;

	constructor(havokInstance: any)
	{
		this.gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.havokInstance = havokInstance;
		this.dimensions = [0, 0];
		this.gameIsRunning = true;
		this.engine = new Engine(this.gameCanvas, true, {antialias: true});
		this.scene = new Scene(this.engine);
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
		this.jsonMap = map;
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

		for (const player of this.players)
		{
			this.scoreboard.push(player.getLives());
		}
		this.scene = scene;
		this.playerCount = this.players.length;

		// Debug Physics Viewer
		// scene.onDataLoadedObservable.addOnce(() => {
		// const viewer = new PhysicsViewer(scene);
		// scene.meshes.forEach(m =>
		// 	{
		// 		if ((m as any).physicsBody || (m as any).physicsAggregate)
		// 		{
		// 			viewer.showBody((m as any).physicsBody || (m as any).physicsAggregate.body);
		// 		}
		// 	});
		// });
	}

	private resumeGame()
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
		this.resumeGame();
	}

	private gameLoop()
	{
		let scored = false;

		if (this.gameIsRunning == true)
		{
			for (let i = 0; i < this.balls.length; i++)
			{
				for (let j = 0; j < this.goals.length; j++)
				{
					if (this.goals[j].score(this.balls[i]) == true)
					{
						this.players[j].loseLife();
						this.scoreboard[j]--;
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
		this.update();
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
		this.scoreboard = [];
		this.gameIsRunning = false;
		console.log('Game data deleted.');
	}

	getPaddles(): Paddle[] {return this.paddles;}
	getBalls(): Ball[] {return this.balls;}
	getWalls(): Wall[] {return this.walls;}
	getGoals(): Goal[] {return this.goals;}
	getPlayers(): Player[] {return this.players;}
	getScene(): Scene {return this.scene;}
	gameRunning(): boolean {return this.gameIsRunning;}
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

