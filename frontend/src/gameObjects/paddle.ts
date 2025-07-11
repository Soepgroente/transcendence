import { Engine, Scene, FreeCamera, StandardMaterial, Vector3, Color3, HemisphericLight, MeshBuilder, Mesh } from '@babylonjs/core';

export class Paddle
{
	mesh:		Mesh;
	speed:		number;
	direction:	Vector3;
	color:		string;

	constructor(dimensions: Vector3, direction: Vector3, _position: Vector3, _color: Color3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'box', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.mesh.position = _position;
		this.direction = direction;
		this.speed = 1;
		
		const mat = new StandardMaterial("ballMat", this.mesh.getScene());
		mat.diffuseColor = _color;
        this.mesh.material = mat;
	}

	movePaddle()
	{
		this.mesh.position.z += this.direction.z * this.speed;
		this.direction.z = 0;
	}
}
