import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, Mesh } from '@babylonjs/core';

export class Paddle
{
	mesh:		Mesh;
	speed:		number;
	direction:	Vector3;
	color:		string;

	constructor(dimensions: Vector3, direction: Vector3, _position: Vector3)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'box', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z}
		);
		this.mesh.position = _position;
		this.direction = direction;
		this.speed = 1;
	}

	movePaddle()
	{
		this.mesh.position.z += this.direction.z * this.speed;
		this.direction.z = 0;
	}
}
