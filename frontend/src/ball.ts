export interface vec2 {x: number; y: number;}

export class Ball
{
	radius:		number;
	center:		vec2;
	direction:	vec2;
	speed:		number;

	constructor(_radius: number, _center: vec2)
	{
		this.radius = _radius;
		this.center = _center;
		this.direction = this.randomVector();
		this.speed = 0.001;
	}
	
	randomVector(): vec2
	{
		const angle: number = Math.random() * 2 * Math.PI;
		return {x: Math.cos(angle), y: Math.sin(angle)};
	}

	moveBall()
	{
		this.center.x += this.direction.x * this.speed;
		this.center.y += this.direction.y * this.speed;
	}
}

