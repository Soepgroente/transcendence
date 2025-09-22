import { Wall, Ball, Paddle, createSurroundingWalls,
		createWalls, createBalls, createPlayers, createGoals,
		createGround, createPaddles, createScoreboard, Player, Goal, jsonToVector2,
		Colors } from '../../index';
import { CreateStreamingSoundAsync, CreateAudioEngineAsync, StreamingSound,
		Engine, Scene, FreeCamera, Color3, Vector3, HemisphericLight,
		HavokPlugin, StandardMaterial, Layer, PhysicsViewer } from '@babylonjs/core';
import { TextBlock, AdvancedDynamicTexture } from '@babylonjs/gui';
import type { AudioEngineV2 } from '@babylonjs/core';
import type { GameState2 } from '../../index';

export class ClientGame
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
	private lastState: GameState2 | null = null;

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

	/* Up is +1, down is -1, nothing or both pressed is 0 */

	keyEvents(): number
	{
		const up = Boolean(
			this.keys['ArrowUp'] ||
			this.keys['w'] ||
			this.keys['ArrowRight'] ||
			this.keys['d']
		);

		const down = Boolean(
			this.keys['ArrowDown'] ||
			this.keys['s'] ||
			this.keys['ArrowLeft'] ||
			this.keys['a']
		);

		return Number(up) - Number(down);
	}

	private async loadSounds()
	{
		try
		{
			ClientGame.audioEngine = await CreateAudioEngineAsync();
			ClientGame.audioEngine.volume = 0.5;
			ClientGame.music = await CreateStreamingSoundAsync('music', 'sounds/frogs.mp3');
			ClientGame.wallhitSound = await CreateStreamingSoundAsync('wallhit', 'sounds/wallhit.wav');
			ClientGame.paddlehitSound = await CreateStreamingSoundAsync('paddlehit', 'sounds/paddlehit.wav');
			ClientGame.paddlehitSound = await CreateStreamingSoundAsync('paddlehit', 'sounds/paddlehit.wav');
			ClientGame.playerOutSound = await CreateStreamingSoundAsync('playerout', 'sounds/playerout.wav');
			ClientGame.victorySound = await CreateStreamingSoundAsync('victory', 'sounds/victory.wav');
			ClientGame.paddlehitSound.maxInstances = 1;
			ClientGame.wallhitSound.maxInstances = 1;

			ClientGame.paddlehitSound.setVolume(0.6);
			ClientGame.wallhitSound.setVolume(0.6);
			ClientGame.playerOutSound.setVolume(0.6);
			ClientGame.music.play();

			await ClientGame.audioEngine.unlockAsync();
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
		ClientGame.playVictorySound();
		
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

	run()
	{
		this.pauseGame();
		this.showCountdown(this.scene, () =>
		{
			this.engine.runRenderLoop(this.gameLoop.bind(this));
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

	private async updateGameState()
	{
		const serverInput = await loadServerInput((this.scene as any).socket) as string;
		this.lastState = JSON.parse(serverInput) as GameState2;
	}

	private updateScoreboard()
	{
		const lives = this.lastState.lives;

		for (let i = 0; i < this.players.length; i++)
		{
			if (this.players[i].getLives() != lives[i])
			{
				this.players[i].loseLife();
				this.scoreboard[i].text = `Player ${this.players[i].ID}: ${this.players[i].getLives()}`;
			}
		}
	}

	private updateBalls()
	{
		const ballUpdates = this.lastState.balls;

		for (let i = 0; i < ballUpdates.length; i++)
		{
			this.balls[i].update(ballUpdates[i].location.x, ballUpdates[i].location.z);
		}
	}

	private updatePaddles()
	{
		const playerUpdates = this.lastState.paddles;
		
		for (let i = 0; i < playerUpdates.length; i++)
		{
			this.paddles[i].update(playerUpdates[i].location.x, playerUpdates[i].location.z);
		}
	}

	private gameLoop()
	{
		this.updateGameState();
		this.updateBalls();
		this.updatePaddles();
		this.updateScoreboard();
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
		ClientGame.audioEngine.dispose();
		this.gameIsRunning = false;
		console.log('Game data deleted.');
	}

	static playBallHitSound() { ClientGame.paddlehitSound.play(); }
	static playPaddleHitSound() { ClientGame.paddlehitSound.play(); }
	static playPlayerOutSound() { ClientGame.playerOutSound.play(); }
	static playVictorySound() { ClientGame.victorySound.play(); }
	static playWallHitSound() { ClientGame.wallhitSound.play(); }
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

async function loadServerInput(socket: WebSocket): Promise<string>
{
	return new Promise((resolve, reject) =>
	{
		socket.onmessage = (event) =>
		{
			resolve(event.data);
		};
		socket.onerror = (event) =>
		{
			reject(new Error('WebSocket error'));
		};
	});
}

/*	Destroys the resources associated with the game	*/

export async function destroyGame(game: ClientGame)
{
	game.dispose();
}