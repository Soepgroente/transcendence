// import { Ball, Paddle } from './index';
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
let gameIsRunning = true;
// let gameBall = new Ball(canvas.width / 50, new Vector3(0, 0, 0), drawSphere(scene, ));
// let paddleLeft = new Paddle(0.05, 0.2, {x: -0.9, y: 0});
// let paddleRight = new Paddle(0.05, 0.2, {x: 0.9, y: 0});

const keys: Record<string, boolean> = {};


/* function keyEvents()
{
	if (keys['ArrowUp'] == true)
	{
	paddleRight.direction.y += -0.01;
	}
	if (keys['ArrowDown'] == true)
	{
	paddleRight.direction.y += 0.01;
	}
	if (keys['w'] == true)
	{
	paddleLeft.direction.y += -0.01;
	}
	if (keys['s'] == true)
	{
	paddleLeft.direction.y += 0.01;
	}
	} */

function main()
{
	window.addEventListener('keydown', (event) => {keys[event.key] = true;});
	window.addEventListener('keyup', (event) => {keys[event.key] = false;});
	const engine = new Engine(canvas, true);
	const scene = createScene(engine);

	engine.runRenderLoop(() =>
	{
		if (gameIsRunning == false) return;

		// paddleLeft.direction.y = 0;
		// paddleRight.direction.y = 0;
		// keyEvents();
		// gameBall.moveBall();
		// Draw.circle(gameBall.radius, gameBall.center);
		// paddleLeft.movePaddle();
		// paddleRight.movePaddle();
		// Draw.rectangle(paddleLeft.drawFrom, {x: paddleLeft.width, y: paddleLeft.height});
		// Draw.rectangle(paddleRight.drawFrom, {x: paddleRight.width, y: paddleRight.height});
		scene.render();
	});
}

function createScene (engine: Engine): Scene
{
    const scene = new Scene(engine);
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
    sphere.position.y = 1;
    const ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
    return scene;
}

main();