import { Wall } from './wall';
import { Ball } from './ball';
import { Paddle } from './paddle';
import { Player } from './player';
import { Goal } from './goal';
import { createSurroundingWalls, createWalls, createBalls, createPlayers, createGoals, createGround, createPaddles, createScoreboard } from '../initialize';
import { CreateStreamingSoundAsync, CreateAudioEngineAsync, StreamingSound,
		Engine, Scene, FreeCamera, Color3, Vector3, HemisphericLight,
		StandardMaterial, Layer } from '@babylonjs/core';
import { TextBlock, AdvancedDynamicTexture } from '@babylonjs/gui';
import type { AudioEngineV2 } from '@babylonjs/core';
import { trpc } from '../../trpc';
import type { GameState } from '@repo/trpc/types';
import { Colors, jsonToVector2 } from '../utils';

export class ClientGame
{
	private engine: Engine;
	private scene: Scene;
	private dimensions: [number, number];
	private	gameCanvas: HTMLCanvasElement | null;
	private localPlayerIndex = -1;

	private camera: FreeCamera;
	private cameraTransitionActive = false;
	private cameraTransitionStartTime = 0;
	private cameraTransitionDuration = 1500;
	private cameraStartPos: Vector3 = Vector3.Zero();
	private cameraEndPos: Vector3 = Vector3.Zero();

	private scoreboard: TextBlock[] = [];
	private players: Player[] = [];	
	private paddles: Paddle[] = [];
	private balls: Ball[] = [];
	private walls: Wall[] = [];
	private goals: Goal[] = [];
	private gameState: GameState;

	private keysPressed = new Set<string>();
    private upKeys: string[] = ['ArrowUp', 'ArrowRight', 'w', 'd'];
    private downKeys: string[] = ['ArrowDown', 'ArrowLeft', 's', 'a'];

	private static playerOutSound: StreamingSound;
	private static victorySound: StreamingSound;
	private static audioEngine: AudioEngineV2;
	private static music: StreamingSound;
	private userId: number;

	constructor(gameState: GameState, userId: number)
	{
		this.gameState = gameState;
		this.gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		if (!this.gameCanvas)
		{
			console.error('Game canvas not found');
		}
		this.dimensions = [0, 0];
		this.engine = new Engine(this.gameCanvas);
		this.scene = new Scene(this.engine);
		this.userId = userId;
		console.log('Game_client started');
	}

	private async loadSounds()
	{
		try
		{
			ClientGame.audioEngine = await CreateAudioEngineAsync();
			ClientGame.audioEngine.volume = 0.5;
			ClientGame.music = await CreateStreamingSoundAsync('music', 'sounds/frogs.mp3');
			ClientGame.playerOutSound = await CreateStreamingSoundAsync('playerout', 'sounds/playerout.wav');
			ClientGame.victorySound = await CreateStreamingSoundAsync('victory', 'sounds/victory.wav');
			ClientGame.victorySound.maxInstances = 1;

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
		let fileText = '';
		try {
			fileText = await loadFileText(inputFile);
			
		} catch (error) {
			console.error('Error loading map:', error);
			throw error;
			
		}		
		const map = JSON.parse(fileText);
		
		if (!map.dimensions || !map.balls || !map.goals)
		{
			throw new Error('Invalid map format');
		}
		console.log(map);
		this.createScene(map);
		const eliminationMat = new StandardMaterial('eliminatedMat', this.scene);
		
		eliminationMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
		eliminationMat.alpha = 0.5;
		eliminationMat.maxSimultaneousLights = 16;
		
		Paddle.setEliminatedMaterial(eliminationMat);
		Goal.setEliminatedMaterial(eliminationMat);
		Goal.createGoalPostMaterial(this.scene);
		await this.loadSounds();
	}

	private createScene(map: any)
	{
		const scene = this.scene;
		const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 10, 0), scene);
		hemiLight.intensity = 0.6;

		this.dimensions = jsonToVector2(map.dimensions);
		createGround(scene, this.dimensions);
		createBalls(scene, this.balls, map);
		createSurroundingWalls(scene, this.walls, this.dimensions);
		createWalls(scene, this.walls, map);
		createGoals(scene, this.goals, map);
		createPaddles(scene, this.paddles, map.goals);
		createPlayers(this.players, this.goals, this.paddles);
		createScoreboard(this.scoreboard, this.players);

		const cameraHeight = Math.max(this.dimensions[0], this.dimensions[1]) + 10;
		const camera = new FreeCamera('camera1', new Vector3(0, cameraHeight, -5), scene);
		camera.setTarget(Vector3.Zero());
		
		const background = new Layer('background', 'backgrounds/volcano.jpg', scene, true);
		background.isBackground = true;
		this.scene = scene;
		this.camera = camera;

		this.updateFromServer(this.gameState);
	}

	private victory()
	{
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
		setTimeout(() =>
		{
			this.engine.stopRenderLoop();
			advancedTexture.removeControl(victoryText);
			advancedTexture.dispose();
		}, 100);
	}

	private async waitForStart()
	{
		const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('waitingUI', true, this.scene);
		const waitingText = new TextBlock();

		waitingText.text = "Waiting for players...";
		waitingText.color = "white";
		waitingText.fontSize = 60;
		waitingText.outlineWidth = 5;
		waitingText.outlineColor = "black";
		waitingText.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
		waitingText.verticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
		advancedTexture.addControl(waitingText);
		while (true) 
		{
			await new Promise(resolve => setTimeout(resolve, 100));
			if (this.gameState.status == 'in_progress')
			{
				if (this.userId)
				{
					for (let i = 0; i < this.gameState.players.length; i++)
					{
						if (this.gameState.players[i].alias)
						{
							this.players[i].updatePlayer(this.gameState.players[i].id, this.gameState.players[i].alias, this.gameState.players[i].lives);
						}
					}

				}
				this.engine.runRenderLoop(() =>
				{
					this.updateCameraTransition(performance.now());
				});
				advancedTexture.removeControl(waitingText);
				advancedTexture.dispose();
				this.showCountdown(this.scene, () =>
				{
					console.log('Starting render loop NOW');
					this.engine.stopRenderLoop();
					this.engine.runRenderLoop(this.gameLoop.bind(this));
					console.log('players: ', this.gameState.players);
				});
				break; 
			}
			this.scene.render();
		}
	}

	run()
	{
		this.setupInputListeners();
		this.scene.render();
		trpc.game.sendPlayerAction.mutate({matchId: this.gameState.matchId, action: 'ready'});
		console.log('Player is ready, waiting for other players...');

		this.waitForStart();
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
		this.startCameraTransitionForPlayer(1500);
		function next()
		{
			scene.render();
			if (step < sequence.length)
			{
				countdownText.text = sequence[step];
				step++;
				setTimeout(next, 750);
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

	public updateFromServer(gameState: GameState | null)
	{
		this.gameState = gameState;
	}

	private updateBalls()
	{
		const ballUpdates = this.gameState.balls;

		for (let i = 0; i < ballUpdates.length; i++)
		{
			this.balls[i].update(ballUpdates[i].x, ballUpdates[i].z);
		}
	}

	private updatePaddles()
	{
		const playerUpdates = this.gameState.players;

		for (let i = 0; i < playerUpdates.length; i++)
		{
			this.paddles[i].update(playerUpdates[i].position.x, playerUpdates[i].position.z);
		}
	}

	private updateScoreboard()
	{
		const serverPlayers = this.gameState.players;

		for (let i = 0; i < this.players.length; i++)
		{
			if (this.players[i].getLives() != serverPlayers[i].lives)
			{
				ClientGame.playPlayerOutSound();
				this.players[i].setLives(serverPlayers[i].lives);
				this.scoreboard[i].text = `${this.players[i].getName()}: ${serverPlayers[i].lives}`;
			}
		}
	}

	private gameLoop()
	{
		if (this.gameState.status == 'finished')
		{
			this.victory();
		}
		this.sendKeyPresses();
		this.updatePaddles();
		this.updateBalls();
		this.updateScoreboard();
		this.scene.render();
	}

	private handleKeyDown = (event: KeyboardEvent) =>
	{
		this.keysPressed.add(event.key);
		event.preventDefault();
	};

	private handleKeyUp = (event: KeyboardEvent) =>
	{
		this.keysPressed.delete(event.key);
		event.preventDefault();
	};

	private setupInputListeners()
	{
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	}

	private removeInputListeners()
	{
		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
	}

	private keyToActionFromSet(keys: Set<string>): number
	{
		const up = Array.from(keys).some(k => this.upKeys.includes(k));
		const down = Array.from(keys).some(k => this.downKeys.includes(k));
		return Number(up) - Number(down);
	}

	private sendKeyPresses()
	{
		const action = this.keyToActionFromSet(this.keysPressed);

		trpc.game.sendPlayerAction.mutate({
			matchId: this.gameState.matchId,
			action: action.toString() as '1' | '0' | '-1',
		});
	}

	private updateCameraTransition(now: number)
	{
		if (this.cameraTransitionActive == false)
		{
			return;
		}
		const elapsed = now - this.cameraTransitionStartTime;
		let t = Math.min(1, elapsed / Math.max(1, this.cameraTransitionDuration));
		const easeT = easeInOutQuad(t);
		const newPos = Vector3.Lerp(this.cameraStartPos, this.cameraEndPos, easeT);

		this.camera.position.copyFrom(newPos);
		this.camera.setTarget(Vector3.Zero());

		if (t >= 1)
		{
			this.cameraTransitionActive = false;
		}
		this.gameLoop();
	}

	private startCameraTransitionForPlayer(durationMs: number)
	{
		const playerIndex = this.players.findIndex(p => p.ID === this.userId);
		console.log('players: ', this.players, );
		if (playerIndex != -1)
		{
			this.localPlayerIndex = playerIndex;
			console.log('Local player index set to:', this.localPlayerIndex);
		}

		if (!this.camera )
		{
			console.warn('Camera not initialized yet userId:', this.userId);
			return;
		}
		if (!this.paddles){
			console.warn('Paddles not initialized yet userId:', this.userId);
				return;
			 }
		if(!this.paddles[playerIndex]) { 
			console.warn('playerIndex not initialized yet userId:', this.userId, ' playerIndex:', playerIndex);
			return; 
		}

		const paddle = this.paddles[playerIndex];
		const paddleMesh = paddle.getMesh();
		const backDir = paddle.getSurfaceNormal().scale((Math.max(this.dimensions[0], this.dimensions[1]) / 2) * -1);

		this.cameraStartPos = this.camera.position.clone();
		this.cameraEndPos = paddleMesh.position.add(backDir);
		this.cameraEndPos.y = this.camera.position.y - 15;

		this.cameraTransitionDuration = durationMs;
		this.cameraTransitionStartTime = performance.now();
		this.cameraTransitionActive = true;

		this.engine.runRenderLoop(() =>
		{
			this.updateCameraTransition(performance.now());
		});
	}

	dispose()
	{
		this.removeInputListeners();
		this.engine.stopRenderLoop();
		this.scene.dispose();
		this.engine.dispose();
		this.gameCanvas = null;
		this.players = [];
		this.paddles = [];
		this.balls = [];
		this.walls = [];
		this.goals = [];
		this.scoreboard = [];
		ClientGame.audioEngine.dispose();
		console.log('Game data deleted.');
	}

	static playPlayerOutSound() { ClientGame.playerOutSound.play(); }
	static playVictorySound() { ClientGame.victorySound.play(); }
}

async function loadFileText(filePath: string): Promise<string>
{
	try {

		console.log(`Loading file: ${filePath}`);
		const response = await fetch(filePath);
		if (response.ok == false)
		{
			throw new Error(`Failed to load file: ${filePath}`);
		}
		return response.text();
	
	} catch (error) {
		console.error(`Failed to load file: ${filePath}`, error);
		throw error;
	}
}


/*	Destroys the resources associated with the game	*/

export function destroyGame(game: ClientGame)
{
	game.dispose();
}

function easeInOutQuad(t: number): number
{
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
