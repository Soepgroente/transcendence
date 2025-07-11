import { Ball, Paddle } from './index';
import { Engine, Scene, FreeCamera, PointLight, Vector3, Color3, Mesh, MeshBuilder, StandardMaterial } from '@babylonjs/core';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
let gameIsRunning = true;
let paddles: Paddle[] = [];
let balls: Ball[] = [];
let walls: Mesh[] = [];

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

function createWalls(scene: Scene)
{
	const groundWidth = 30;
	const groundHeight = 20;
	const wallThickness = 0.5;
	const wallHeight = 2;
	const wallMat = new StandardMaterial('wallMat', scene);
	wallMat.alpha = 0.1;
	wallMat.diffuseColor = new Color3(1, 1, 1);

	walls.push(MeshBuilder.CreateBox('leftWall', {width: wallThickness, height: wallHeight, depth: groundHeight + wallThickness * 2}, scene));
	walls.push(MeshBuilder.CreateBox('rightWall', {width: wallThickness, height: wallHeight, depth: groundHeight + wallThickness * 2}, scene));
	walls.push(MeshBuilder.CreateBox('topWall', {width: groundWidth, height: wallHeight, depth: wallThickness}, scene));
	walls.push(MeshBuilder.CreateBox('bottomWall', {width: groundWidth, height: wallHeight, depth: wallThickness}, scene));
	walls[0].position = new Vector3(-groundWidth / 2 - wallThickness / 2, wallHeight / 2, 0);
	walls[1].position = new Vector3(groundWidth / 2 + wallThickness / 2, wallHeight / 2, 0);
	walls[2].position = new Vector3(0, wallHeight / 2, -groundHeight / 2 - wallThickness / 2);
	walls[3].position = new Vector3(0, wallHeight / 2, groundHeight / 2 + wallThickness / 2);
	for (let i = 0; i < walls.length; i++)
	{
		walls[i].material = wallMat;
	}
}

function handleCollisions()
{
	for (let i = 0; i < balls.length; i++)
	{
		for (let x = 0; x < paddles.length; x++)
		{
			if (balls[i].sphere.intersectsMesh(paddles[x].mesh) == true)
			{
				balls[i].direction.x *= -1;
			}
			if (Math.abs(balls[i].direction.x) < 0.1)
			{
				balls[i].direction.z *= -1;
			}
		}
		if (balls[i].sphere.intersectsMesh(walls[0]) == true ||
			balls[i].sphere.intersectsMesh(walls[1]) == true)
		{
			balls[i].direction.x *= -1;
		}
		if (balls[i].sphere.intersectsMesh(walls[2]) == true ||
			balls[i].sphere.intersectsMesh(walls[3]) == true)
		{
			balls[i].direction.z *= -1;
			// if (Math.abs(balls[i].direction.z) < 0.1)
			// {
			// 	balls[i].direction.x *= -1;
			// }
		}
	}
}

function createPeddles(scene: Scene)
{
	paddles.push(new Paddle(new Vector3(1, 1, 5), new Vector3(0, 0, 0), new Vector3(-13, 0.5, 0), new Color3(1, 0, 0), scene));
	paddles.push(new Paddle(new Vector3(1, 1, 5), new Vector3(0, 0, 0), new Vector3(13, 0.5, 0), new Color3(0, 0, 1), scene));
}

function createBalls(scene: Scene)
{
	balls.push(new Ball(new Vector3(0, 0.5, 0), Color3.Black(), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.8, 0.2, 0.2), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.2, 0.8), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.6, 0.6), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.8, 0.4), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.8, 0.4, 0.2), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.4, 0.2, 0.8), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.6, 0.8, 0.2), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.4, 0.8), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.8, 0.6, 0.2), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.4, 0.8, 0.6), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.6, 0.2, 0.8), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.8, 0.4, 0.6), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.8, 0.4), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.4, 0.6, 0.2), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.6, 0.2, 0.4), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.8, 0.6, 0.4), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.2, 0.4, 0.6), 0.6, scene));
	balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(0.6, 0.8, 0.4), 0.6, scene));
}

function createScene(engine: Engine): Scene
{
	const scene = new Scene(engine);
	const camera = new FreeCamera("camera1", new Vector3(0, 30, 5), scene);
	camera.setTarget(Vector3.Zero());
	camera.attachControl(canvas, true);
	// const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	// light.intensity = 0.7;
	const light2 = new PointLight("pointLight", camera.position, scene);
	light2.intensity = 0.8;
	const ground = MeshBuilder.CreateGround('ground', {width: 30, height: 20, updatable: true}, scene);
	const mat = new StandardMaterial('floor', ground.getScene());
	mat.diffuseColor = new Color3(0.2, 1, 1);
	mat.ambientColor = new Color3(1, 0.2, 0.2);
	ground.material = mat;
	createBalls(scene);
	createPeddles(scene);
	createWalls(scene);
	return scene;
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
		handleCollisions();
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

main();