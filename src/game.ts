import {Ball} from './ball';
import {Paddle} from './paddle';
import {vec2} from './ball';
import * as Draw from './draw';
// import './paddle';
// import { drawSomething } from './paddle';

function runGame()
{
	let gameBall = new Ball(4, {x: 0, y: 0});
	let paddleLeft = new Paddle(5, 25, {x: -0.9, y: 0});
	let paddleRight = new Paddle(5, 25, {x: 0.9, y: 0});

	Draw.circle(gameBall.radius, gameBall.center);
	Draw.rectangle(paddleLeft.center, {x: paddleLeft.width, y: paddleLeft.height});
	Draw.rectangle(paddleRight.center, {x: paddleRight.width, y: paddleRight.height});
}

function main()
{
	console.log("Hello world");
	runGame();
}

main();