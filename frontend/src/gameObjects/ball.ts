import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, Scene } from '@babylonjs/core';

export class Ball
{
	direction:	Vector3;
	speed:		number;
	sphere:		Mesh;
	tmpVector:	Vector3;

	constructor(_center: Vector3, _color: Color3, _diameter: number, scene: Scene)
	{
		this.sphere = MeshBuilder.CreateSphere("sphere", {diameter: _diameter}, scene);
		this.sphere.position = _center;
		this.direction = this.randomVector();
		this.speed = 0.25;

		const mat = new StandardMaterial("ballMat", this.sphere.getScene());
        mat.diffuseColor = _color;
        this.sphere.material = mat;
	}
	
	randomVector(): Vector3
	{
		const angle: number = Math.random() * 2 * Math.PI;
		const randomVec = new Vector3(Math.cos(angle), 0, Math.sin(angle));
		randomVec.normalize();
		return randomVec;
	}

	move()
	{
		this.sphere.position.x += this.direction.x * this.speed;
		this.sphere.position.z += this.direction.z * this.speed;
	}

	reverseMove()
	{
		this.sphere.position.x -= this.direction.x * this.speed;
		this.sphere.position.z -= this.direction.z * this.speed;
	}

	changeDirection(surfaceNormal: Vector3, collisionMomentum?: Vector3)
	{
		this.tmpVector = surfaceNormal.scale(-2 * Vector3.Dot(this.direction, surfaceNormal));
		this.direction = this.direction.add(this.tmpVector);
	}
}
