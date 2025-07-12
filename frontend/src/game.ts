import { Wall, Ball, Paddle } from './index';
import { Engine, Scene, FreeCamera, PointLight, Vector2, Vector3, Color3, Mesh, MeshBuilder, StandardMaterial,
		PhysicsShapeType, HavokPlugin, PhysicsAggregate } from '@babylonjs/core';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const arena = Vector2.Zero();
let gameIsRunning = true;
let paddles: Paddle[] = [];
let balls: Ball[] = [];
let walls: Wall[] = [];

const keys: Record<string, boolean> = {};

function keyEvents()
{
	if (keys['ArrowUp'] == true)
	{
		paddles[0].direction.z += -0.1;
	}
	if (keys['ArrowDown'] == true)
	{
		paddles[0].direction.z += 0.1;
	}
	if (keys['w'] == true)
	{
		paddles[1].direction.z += -0.1;
	}
	if (keys['s'] == true)
	{
		paddles[1].direction.z += 0.1;
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

	walls.push(
		new Wall(new Vector3(wallThickness, wallHeight, groundHeight + wallThickness * 2),
		new Vector3(-groundWidth / 2 - wallThickness / 2, wallHeight / 2, 0),
		Color3.Black(),
		new Vector3(1, 0, 0),
		scene)
	);
	
	walls.push(
		new Wall(new Vector3(wallThickness, wallHeight, groundHeight + wallThickness * 2),
		new Vector3(groundWidth / 2 + wallThickness / 2, wallHeight / 2, 0),
		Color3.Black(),
		new Vector3(-1, 0, 0),
		scene)
	);

	walls.push(
		new Wall(new Vector3(groundWidth, wallHeight, wallThickness),
		new Vector3(0, wallHeight / 2, -groundHeight / 2 - wallThickness / 2),
		Color3.Black(),
		new Vector3(0, 0, -1),
		scene)
	);

	walls.push(
		new Wall(new Vector3(groundWidth, wallHeight, wallThickness),
		new Vector3(0, wallHeight / 2, groundHeight / 2 + wallThickness / 2),
		Color3.Black(),
		new Vector3(0, 0, 1),
		scene)
	);
}

function handleCollisions()
{
	for (let i = 0; i < balls.length; i++)
	{
		balls[i].move();
		for (let x = 0; x < paddles.length; x++)
		{
			if (balls[i].sphere.intersectsMesh(paddles[x].mesh) == true)
			{
				balls[i].reverseMove();
				balls[i].direction.x *= -1;
				if (Math.abs(balls[i].direction.x) < 1)
				{
					balls[i].direction.z *= -1;
				}
				balls[i].move();
				break;
			}
		}
		for (let w = 0; w < walls.length; w++)
		{
			if (balls[i].sphere.intersectsMesh(walls[w].mesh) == true)
			{
				balls[i].reverseMove();
				balls[i].changeDirection(walls[w].normal);
				balls[i].move();
				break;
			}
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
	for (let i = 0; i < 25; i++)
	{
		balls.push(new Ball(new Vector3(0, 0.5, 0), new Color3(Math.random(), Math.random(), Math.random()), Math.random(), scene));
	}
}

function createScene(engine: Engine): Scene
{
	const scene = new Scene(engine);
	const camera = new FreeCamera("camera1", new Vector3(0, 30, 5), scene);
	camera.setTarget(Vector3.Zero());
	camera.attachControl(canvas, true);
	const light2 = new PointLight("pointLight", camera.position, scene);
	light2.intensity = 0.8;
	const ground = MeshBuilder.CreateGround('ground', {width: 30, height: 20, updatable: true}, scene);
	const mat = new StandardMaterial('floor', ground.getScene());
	mat.diffuseColor = new Color3(0.2, 1, 1);
	mat.ambientColor = new Color3(1, 0.2, 0.2);
	ground.material = mat;

	// const hk = new HavokPlugin();
  	// scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
	//   // Create a sphere shape and the associated body. Size will be determined automatically.
	createBalls(scene);
	createPeddles(scene);
	createWalls(scene);
	// var sphereAggregate = new PhysicsAggregate(balls[0].sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution:0.75}, scene);

	// var groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);
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
			balls[i].move();
		}
		scene.render();
	});
}

main();