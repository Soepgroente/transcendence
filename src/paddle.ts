import {vec2} from './ball';

export class Paddle
{
	center:		vec2;
	width:		number;
	height:		number;
	direction:	vec2;
	speed:		number;

	constructor(_width: number, _height: number, _center: vec2)
	{
		this.width = _width;
		this.height = _height;
		this.center = _center;
		this.direction = {x: -1, y: 0};
		this.speed = 1;
	}

	movePaddle()
	{
		this.center.x += this.direction.x * this.speed;
		this.center.y += this.direction.y * this.speed;
	}
}
