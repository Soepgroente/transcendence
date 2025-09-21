import { Wall, Ball, Paddle, createSurroundingWalls,
		createWalls, createBalls, createPlayers, createGoals,
		createGround, createPaddles, createScoreboard, Player, Goal, jsonToVector2,
		jsonToVector3, GameMenu, ColorMap, Colors } from '../../index';
import { CreateStreamingSoundAsync, CreateAudioEngineAsync, StreamingSound,
		Engine, Scene, FreeCamera, Color3, Vector3, HemisphericLight,
		HavokPlugin, StandardMaterial, Layer, PhysicsViewer } from '@babylonjs/core';
import { TextBlock, AdvancedDynamicTexture } from '@babylonjs/gui';
import type { AudioEngineV2 } from '@babylonjs/core';

const maxPlayerCount = 6;

export class Game
{
	private engine: Engine;
	private scene: Scene;
	private havokInstance: any;
	private dimensions: [number, number];
	private gameIsRunning: boolean;
	private	gameCanvas: HTMLCanvasElement;
	
	private jsonMap: any;
	private keys: Record<string, boolean> = {};
	private scoreboard: TextBlock[] = [];
	private players: Player[] = [];	
	private paddles: Paddle[] = [];
	private balls: Ball[] = [];
	private walls: Wall[] = [];
	private goals: Goal[] = [];
	private playerCount: number = 0;

	private static wallhitSound: StreamingSound;
	private static paddlehitSound: StreamingSound;
	private static playerOutSound: StreamingSound;
	private static victorySound: StreamingSound;
	private static audioEngine: AudioEngineV2;
	private static music: StreamingSound;

	constructor(havokInstance: any)
	{
		window.addEventListener('keydown', (event) => {this.keys[event.key] = true;});
		window.addEventListener('keyup', (event) => {this.keys[event.key] = false;});			
		
		this.gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.havokInstance = havokInstance;
		this.dimensions = [0, 0];
		this.gameIsRunning = true;
		this.engine = new Engine(this.gameCanvas, true, {antialias: true});
		this.scene = new Scene(this.engine);
		console.log('Game started');
	}

	keyEvents()
	{
		for (let i = 0; i < this.players.length; i++)
		{
			this.players[i].checkForActions(this.keys, this.walls);
		}
	}

	private async loadSounds()
	{
		try
		{
			Game.audioEngine = await CreateAudioEngineAsync();
			Game.audioEngine.volume = 0.5;
			Game.music = await CreateStreamingSoundAsync('music', 'sounds/frogs.mp3');
			Game.wallhitSound = await CreateStreamingSoundAsync('wallhit', 'sounds/wallhit.wav');
			Game.paddlehitSound = await CreateStreamingSoundAsync('paddlehit', 'sounds/paddlehit.wav');
			Game.paddlehitSound = await CreateStreamingSoundAsync('paddlehit', 'sounds/paddlehit.wav');
			Game.playerOutSound = await CreateStreamingSoundAsync('playerout', 'sounds/playerout.wav');
			Game.victorySound = await CreateStreamingSoundAsync('victory', 'sounds/victory.wav');
			Game.paddlehitSound.maxInstances = 1;
			Game.wallhitSound.maxInstances = 1;

			Game.paddlehitSound.setVolume(0.6);
			Game.wallhitSound.setVolume(0.6);
			Game.playerOutSound.setVolume(0.6);
			Game.music.play();

			await Game.audioEngine.unlockAsync();
		}
		catch (error)
		{
			console.error('Error loading audio:', error);
		}
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
		
		const eliminationMat = new StandardMaterial('eliminatedMat', this.scene);
		
		eliminationMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
		eliminationMat.alpha = 0.5;
		eliminationMat.maxSimultaneousLights = 16;
		
		Paddle.setEliminatedMaterial(eliminationMat);
		Goal.setEliminatedMaterial(eliminationMat);
		Goal.createGoalPostMaterial(this.scene);
		await this.loadSounds();
		this.jsonMap = map;
	}

	private createScene(map: any)
	{
		const scene = this.scene;
		const havokPlugin = new HavokPlugin(true, this.havokInstance);
		
		scene.enablePhysics(new Vector3(0, -10, 0), havokPlugin);
		const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 10, 0), scene);
		hemiLight.intensity = 0.6;
		
		this.dimensions = jsonToVector2(map.dimensions);
		const cameraHeight = Math.max(this.dimensions[0], this.dimensions[1]) + 10;
		const camera = new FreeCamera('camera1', new Vector3(0, cameraHeight, 0), scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(this.gameCanvas, true);
		createGround(scene, this.dimensions);
		createBalls(scene, this.balls, map);
		createSurroundingWalls(scene, this.walls, this.dimensions);
		createWalls(scene, this.walls, map.walls);
		createGoals(scene, this.goals, map);
		createPaddles(scene, this.paddles, map.goals);
		createPlayers(this.players, this.goals, this.paddles);
		createScoreboard(this.scoreboard, this.players);
		
		const background = new Layer('background', 'backgrounds/volcano.jpg', scene, true);
		background.isBackground = true;
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

	private victory()
	{
		this.pauseGame();
		Game.playVictorySound();
		
		const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('victoryUI', true, this.scene);
		const victoryText = new TextBlock();
		
		for (let i = 0; i < this.players.length; i++)
		{
			if (this.players[i].isAlive() == true)
			{
				victoryText.color = Colors[i].name;
				victoryText.text = `${this.players[i].getName()} wins!`;
				break;
			}
		}
		victoryText.fontSize = 50;
		victoryText.outlineWidth = 10;
		victoryText.outlineColor = 'black';
		advancedTexture.addControl(victoryText);
		this.scene.render();
	}

	private pauseGame()
	{
		this.gameIsRunning = false;
		this.engine.stopRenderLoop();
	}

	private resumeGame()
	{
		this.gameIsRunning = true;
		this.engine.runRenderLoop(this.gameLoop.bind(this));
	}

	toggleGamePause()
	{
		if (this.gameIsRunning == true)
		{
			this.pauseGame();
		}
		else
		{
			this.resumeGame();
		}
	}

	run()
	{
		this.pauseGame();
		this.showCountdown(this.scene, () =>
		{
			new GameMenu(this.scene, this);
			this.resumeGame();
		});
	}

	private showCountdown(scene: Scene, onFinish: () => void)
	{
		const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
		const countdownText = new TextBlock();
		countdownText.color = 'red';
		countdownText.fontSize = 180;
		countdownText.outlineWidth = 5;
		countdownText.outlineColor = 'black';
		advancedTexture.addControl(countdownText);

		const sequence = ['3', '2', '1', 'START'];
		let step = 0;
		
		function next()
		{
			scene.render();
			if (step < sequence.length)
			{
				countdownText.text = sequence[step];
				step++;
				setTimeout(next, 500);
			}
			else
			{
				advancedTexture.removeControl(countdownText);
				advancedTexture.dispose();
				onFinish();
			}
		}
		next();
	}

	private gameLoop()
	{
		let scored = false;

		if (this.gameIsRunning == true)
		{
			this.keyEvents();
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
						this.scoreboard[j].text = `Player ${this.players[j].ID}: ${this.players[j].getLives()}`;
						if (this.playerCount == 1)
						{
							this.victory();
							return;
						}
						Game.playerOutSound.play();
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
		this.scene.render();
	}

	dispose()
	{
		this.engine.stopRenderLoop();
		this.scene.dispose();
		this.engine.dispose();
		this.havokInstance = null;
		this.gameCanvas = null;
		this.players = [];
		this.paddles = [];
		this.balls = [];
		this.walls = [];
		this.goals = [];
		this.scoreboard = [];
		Game.audioEngine.dispose();
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

	static playBallHitSound() { Game.paddlehitSound.play(); }
	static playPaddleHitSound() { Game.paddlehitSound.play(); }
	static playPlayerOutSound() { Game.playerOutSound.play(); }
	static playVictorySound() { Game.victorySound.play(); }
	static playWallHitSound() { Game.wallhitSound.play(); }
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

export async function destroyGame(game: Game)
{
	game.dispose();
}

