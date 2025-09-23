import { Ball, Wall, rotateVector, type GamePos } from '../index';
import { Vector3, MeshBuilder, Mesh, PhysicsShapeType,
		 PhysicsAggregate, PhysicsMotionType, Scene } from '@babylonjs/core';

const offset = 0.3;

export class Paddle
{
	private mesh:			Mesh;
	private spawnPosition:	Vector3;
	private velocity:		number;
	private aggregate:		PhysicsAggregate;
	private frozen:			boolean;
	private upDirection:	Vector3;

	private static maxSpeed:			number = 0.6;
	private static acceleration:		number = 0.03;

	constructor(dimensions: Vector3, _position: Vector3, surfaceNorm: Vector3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
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

	private move(walls: Wall[])
	{
		this.mesh.position.x += this.upDirection.x * this.velocity;
		this.mesh.position.z += this.upDirection.z * this.velocity;
		for (let i = 0; i < walls.length; i++)
		{
			if (this.mesh.intersectsMesh(walls[i].getMesh(), true))
			{
				let reverse: number;
				if (this.velocity > 0)
				{
					reverse = this.velocity + offset;
				}
				else
				{
					reverse = this.velocity - offset;
				}
				this.mesh.position.x -= this.upDirection.x * reverse;
				this.mesh.position.z -= this.upDirection.z * reverse;
				this.velocity = 0;
				break;
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

	update(direction: number, pressed: boolean, walls: Wall[])
	{
		if (this.frozen == true)
		{
			return;
		}
		if (pressed == false)
		{
			if (Math.abs(this.velocity) < Paddle.acceleration * 1.5)
			{
				this.velocity = 0;
			}
			else
			{
				if (this.velocity > 0)
				{
					this.velocity -= Paddle.acceleration;
				}
				else
				{
					this.velocity += Paddle.acceleration;
				}
			}
		}
		else if (pressed == true && Math.abs(this.velocity) < Paddle.maxSpeed)
		{
			if ((this.velocity > 0 && direction < 0) ||
				(this.velocity < 0 && direction > 0))
			{
				direction *= 2;
			}
			this.velocity += direction * Paddle.acceleration;
		}
		if (this.velocity == 0)
		{
			return;
		}
		this.velocity = Math.min(Paddle.maxSpeed, Math.max(-Paddle.maxSpeed, this.velocity));
		this.move(walls);
	}

	hits(ball: Ball): boolean
	{
		return this.mesh.intersectsMesh(ball.getMesh(), false);
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
