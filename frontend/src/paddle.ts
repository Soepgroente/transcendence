import {vec2} from './ball';

export class Paddle
{
	center:		vec2;
	drawFrom:	vec2;
	width:		number;
	height:		number;
	direction:	vec2;
	speed:		number;
	color:		string;

	constructor(_widthFromCenter: number, _heightFromCenter: number, _center: vec2)
	{
		this.width = _widthFromCenter;
		this.height = _heightFromCenter;
		this.center = _center;
		this.drawFrom = {x: _center.x - _widthFromCenter, y: _center.y - _heightFromCenter};
		this.direction = {x: 0, y: 0};
		this.speed = 1;
	}

	movePaddle()
	{
		this.center.x += this.direction.x * this.speed;
		this.center.y += this.direction.y * this.speed;
		this.drawFrom.x += this.direction.x * this.speed;
		this.drawFrom.y += this.direction.y * this.speed;
	}
}
