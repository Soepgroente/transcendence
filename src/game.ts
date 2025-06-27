import {Ball} from './ball';
import {Paddle} from './paddle';
import * as Draw from './draw';

let gameIsRunning = true;
let gameBall = new Ball(25, {x: 0, y: 0});
let paddleLeft = new Paddle(0.05, 0.2, {x: -0.9, y: 0});
let paddleRight = new Paddle(0.05, 0.2, {x: 0.9, y: 0});

function gameLoop()
{
	if (gameIsRunning == false) return;

	Draw.circle(gameBall.radius, gameBall.center);
	Draw.rectangle(paddleLeft.drawFrom, {x: paddleLeft.width, y: paddleLeft.height});
	Draw.rectangle(paddleRight.drawFrom, {x: paddleRight.width, y: paddleRight.height});
	Draw.circle(2, {x: -0.9, y: 0});
	Draw.circle(2, {x: 0.9, y: 0});
}

function main()
{
	gameLoop();
}

main();