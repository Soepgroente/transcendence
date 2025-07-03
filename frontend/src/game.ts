import {Ball} from './ball';
import {Paddle} from './paddle';
import * as Draw from './draw';
import * as BABYLON from 'babylonjs';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let engine = new BABYLON.Engine(canvas, true);
let gameIsRunning = true;
let gameBall = new Ball(canvas.width / 50, {x: 0, y: 0});
let paddleLeft = new Paddle(0.05, 0.2, {x: -0.9, y: 0});
let paddleRight = new Paddle(0.05, 0.2, {x: 0.9, y: 0});

const keys: Record<string, boolean> = {};

function keyEvents()
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
}

function gameLoop()
{
	if (gameIsRunning == false) return;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	paddleLeft.direction.y = 0;
	paddleRight.direction.y = 0;
	keyEvents();
	gameBall.moveBall();
	Draw.circle(gameBall.radius, gameBall.center);
	paddleLeft.movePaddle();
	paddleRight.movePaddle();
	Draw.rectangle(paddleLeft.drawFrom, {x: paddleLeft.width, y: paddleLeft.height});
	Draw.rectangle(paddleRight.drawFrom, {x: paddleRight.width, y: paddleRight.height});
	
	requestAnimationFrame(gameLoop);
}

function main()
{
	window.addEventListener('keydown', (event) => {keys[event.key] = true;});
	window.addEventListener('keyup', (event) => {keys[event.key] = false;});
	// window.addEventListener("DOMContentLoaded", function gameLoop());
	gameLoop();
}

main();