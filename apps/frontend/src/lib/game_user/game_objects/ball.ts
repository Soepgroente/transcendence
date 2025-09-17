import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, PhysicsShapeType, PhysicsAggregate, Scene } from '@babylonjs/core';
import { Paddle, Game, Wall } from '../../index';

export class Ball
{
	private velocity:	Vector3;
	private mesh:		Mesh;
	private diameter:	number;
	private aggregate:	PhysicsAggregate;
	private speed: 		number;
	private lasthit:	number;
	
	private static baseSpeed: number = 10;
	private static speedIncrement: number = 0.3;

	constructor(_center: Vector3, _color: Color3, _diameter: number, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateSphere('sphere', {diameter: _diameter}, scene);
		this.mesh.position = _center;

		this.aggregate = new PhysicsAggregate(
			this.mesh,
			PhysicsShapeType.SPHERE,
			{ mass: 1, restitution: 1 },
			scene
		);
		this.diameter = _diameter;
		this.lasthit = -1;
		this.speed = Ball.baseSpeed;
		this.velocity = Vector3.Zero();
		this.aggregate.body.setLinearVelocity(this.randomVector().scale(Math.random() * Ball.baseSpeed));
		this.aggregate.body.setLinearDamping(0.1);
		this.aggregate.body.setAngularDamping(0.1);

		const mat = new StandardMaterial('ballMat', this.mesh.getScene());
		mat.diffuseColor = _color;
		mat.maxSimultaneousLights = 16;
		this.mesh.material = mat;
	}
	
	destroy()
	{
		this.mesh.dispose();
		this.aggregate.dispose();
	}

	randomVector(): Vector3
	{
		const angle: number = Math.random() * 2 * Math.PI;
		const randomVec = new Vector3(Math.cos(angle), 0, Math.sin(angle));
		randomVec.normalize();
		return randomVec;
	}

	update(paddles: Paddle[], walls: Wall[])
	{
		for (let pad = 0; pad < paddles.length; pad++)
		{
			if (this.mesh.intersectsMesh(paddles[pad].getMesh(), false) == true)
			{
				this.lasthit = pad;
				this.speed += Ball.speedIncrement;
				Game.playPaddleHitSound();
			}
		}

		for (let i = 0; i < walls.length; i++)
		{
			if (this.mesh.intersectsMesh(walls[i].getMesh(), false) == true)
			{
				Game.playWallHitSound();
			}
		}

		const currentVelocity = this.aggregate.body.getLinearVelocity();

		this.velocity.x = currentVelocity.x;
		this.velocity.y = 0;
		this.velocity.z = currentVelocity.z;

		if (this.mesh.position.y > this.diameter / 2)
		{
			this.velocity.y = -this.diameter / 3;
		}

		let currentSpeed = this.velocity.length();

		if (currentSpeed < this.speed)
		{
			if (currentSpeed > 0.001)
			{
				this.velocity = this.velocity.normalize().scale(this.speed);
			}
			else
			{
				this.velocity = this.randomVector().scale(this.speed);
			}
		}
		this.aggregate.body.setLinearVelocity(this.velocity);
	}

	reset()
	{
		this.speed = Ball.baseSpeed;
	}

	getMesh(): Mesh
	{
		return this.mesh;
	}

	getAggregate(): PhysicsAggregate
	{
		return this.aggregate;
	}

	lastHit(): number
	{
		return this.lasthit;
	}

	getDirection(): Vector3
	{
		return this.velocity.normalize();
	}

	setMovement(movement: Vector3)
	{
		this.aggregate.body.setLinearVelocity(movement.scale(this.speed));
		this.velocity = movement.scale(this.speed);
	}
}
