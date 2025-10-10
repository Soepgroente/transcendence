import { Wall } from './wall';
import { rotateVector, meshesIntersect } from '../utils';
import { type GamePos } from '@repo/trpc/types';
import { Vector3, MeshBuilder, Mesh, PhysicsShapeType,
		 PhysicsAggregate, PhysicsMotionType, Scene } from '@babylonjs/core';

export class Paddle
{
	private mesh:			Mesh;
	private spawnPosition:	Vector3;
	private velocity:		number;
	private aggregate:		PhysicsAggregate;
	private frozen:			boolean;
	private upDirection:	Vector3;

	private static maxSpeed			 = 0.6;
	private static acceleration		 = 0.03;

	constructor(dimensions: Vector3, _position: Vector3, surfaceNorm: Vector3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox(
			'box', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.spawnPosition = _position.clone();
		this.mesh.position = _position;
		this.mesh.position.y = dimensions.y / 2;
		this.velocity = 0;
		this.upDirection = rotateVector(surfaceNorm, -Math.PI / 2);
		this.mesh.rotate(Vector3.Up(), Math.atan2(surfaceNorm.x, surfaceNorm.z) + Math.PI / 2);

		this.aggregate = new PhysicsAggregate(
			this.mesh,
			PhysicsShapeType.BOX,
			{ mass: 0, restitution: 1 },
			scene
		);

		this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
		this.aggregate.body.disablePreStep = false;
		this.frozen = false;
	}

	/*	Optimisation, if this results in clipping we can use the stepping method	*/
	
	private move(walls: Wall[])
	{
		if (this.frozen) return;

		// const dx = this.upDirection.x * this.velocity;
		// const dz = this.upDirection.z * this.velocity;
		// const distance = Math.hypot(dx, dz);

		// if (distance == 0) return;

		// const stepSize = 0.08;
		// const steps = Math.max(1, Math.ceil(distance / stepSize));
		// const stepX = dx / steps;
		// const stepZ = dz / steps;

		// for (let s = 0; s < steps; s++)
		// {
		// 	this.mesh.position.x += stepX;
		// 	this.mesh.position.z += stepZ;

		// 	this.mesh.computeWorldMatrix(true);
		// 	for (const wall of walls)
		// 	{
		// 		if (meshesIntersect(this.mesh, wall.getMesh()) == true)
		// 		{
		// 			this.mesh.position.x -= stepX;
		// 			this.mesh.position.z -= stepZ;
		// 			this.velocity = 0;
		// 			return;
		// 		}
		// 	}
		// }
		this.mesh.position.x += this.upDirection.x * this.velocity;
		this.mesh.position.z += this.upDirection.z * this.velocity;

		this.mesh.computeWorldMatrix(true);
		for (const wall of walls)
		{
			if (meshesIntersect(this.mesh, wall.getMesh()) == true)
			{
				this.mesh.position.x -= this.upDirection.x * this.velocity;
				this.mesh.position.z -= this.upDirection.z * this.velocity;
				this.velocity = 0;
				return;
			}
		}
	}

	getMesh(): Mesh
	{
		return this.mesh;
	}

	reset()
	{
		if (this.frozen == true)
		{
			return;
		}
		this.mesh.position.x = this.spawnPosition.x;
		this.mesh.position.z = this.spawnPosition.z;
		this.velocity = 0;
	}

	update(direction: number, walls: Wall[])
	{
		if (this.frozen == true)
		{
			return;
		}
		if (direction == 0)
		{
			if (Math.abs(this.velocity) < Paddle.acceleration * 1.5)
			{
				this.velocity = 0;
				return;
			}
			if (this.velocity > 0)
			{
				this.velocity -= Paddle.acceleration;
			}
			else
			{
				this.velocity += Paddle.acceleration;
			}
		}
		else if (Math.abs(this.velocity) < Paddle.maxSpeed)
		{
			if ((this.velocity > 0 && direction < 0) ||
				(this.velocity < 0 && direction > 0))
			{
				direction *= 2;
			}
			this.velocity += direction * Paddle.acceleration;
		}
		this.velocity = Math.min(Paddle.maxSpeed, Math.max(-Paddle.maxSpeed, this.velocity));
		this.move(walls);
	}

	getPosition(): GamePos
	{
		return { x: this.mesh.position.x, z: this.mesh.position.z };
	}

	eliminate()
	{
		this.mesh.position = this.spawnPosition;
		this.frozen = true;
		this.aggregate.body.setLinearVelocity(Vector3.Zero());
	}
}
