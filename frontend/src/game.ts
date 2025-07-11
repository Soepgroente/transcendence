import { Ball, Paddle } from './index';
import { Engine, Scene, FreeCamera, Vector3, Color3, Color4, HemisphericLight, MeshBuilder } from '@babylonjs/core';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
let gameIsRunning = true;
let paddles: Paddle[] = [];
let balls: Ball[] = [];

const keys: Record<string, boolean> = {};


function keyEvents()
{
	if (keys['ArrowUp'] == true)
	{
		paddles[0].direction.z += 0.1;
	}
	if (keys['ArrowDown'] == true)
	{
		paddles[0].direction.z += -0.1;
	}
	if (keys['w'] == true)
	{
		paddles[1].direction.z += 0.1;
	}
	if (keys['s'] == true)
	{
		paddles[1].direction.z += -0.1;
	}
}

function main()
{
	window.addEventListener('keydown', (event) => {keys[event.key] = true;});
	window.addEventListener('keyup', (event) => {keys[event.key] = false;});
	const engine = new Engine(canvas, true);
	const scene = createScene(engine);

	engine.runRenderLoop(() =>
	{
		if (gameIsRunning == false) return;

		keyEvents();
		for (let i = 0; i < paddles.length; i++)
		{
			paddles[i].movePaddle();
		}
		for (let i = 0; i < balls.length; i++)
		{
			balls[i].moveBall();
		}
		scene.render();
	});
}

function createScene (engine: Engine): Scene
{
	const scene = new Scene(engine);
	const camera = new FreeCamera("camera1", new Vector3(0, 15, 0), scene);
	camera.setTarget(Vector3.Zero());
	camera.attachControl(canvas, true);
	const light = new HemisphericLight("light", new Vector3(0, 2000, 0), scene);
	light.intensity = 0.7;
	const ground = MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
	ground.edgesColor = new Color4(0, 1, 1, 1);
	paddles.push(new Paddle(new Vector3(1, 1, 5), new Vector3(0, 0, 0), new Vector3(-8.5, 0.5, 0)));
	paddles.push(new Paddle(new Vector3(1, 1, 5), new Vector3(0, 0, 0), new Vector3(8.5, 0.5, 0)));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0, 1, 1), 0.5, scene));
	return scene;
}

main();