import { Ball, Wall, rotateVector } from '../../index';
import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh,
	PhysicsShapeType, PhysicsAggregate, PhysicsMotionType, Scene } from '@babylonjs/core';

const offset = 0.1;

export class Paddle
{
	private mesh:			Mesh;
	private spawnPosition:	Vector3;
	private velocity:		Vector3;
	private aggregate:		PhysicsAggregate;
	private targetSpeed:	number = 0.5;
	private acceleration: 	number = 0.03;
	private frozen:			boolean;

	private static eliminatedMaterial: StandardMaterial;

	constructor(dimensions: Vector3, _position: Vector3, surfaceNorm: Vector3, _color: Color3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'box', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.spawnPosition = _position.clone();
		this.mesh.position = _position;
		this.velocity = Vector3.Zero();

		this.aggregate = new PhysicsAggregate(
			this.mesh,
			PhysicsShapeType.BOX,
			{ mass: 0, restitution: 1 },
			scene
		);

		this.aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
		this.aggregate.body.disablePreStep = false;

		const mat = new StandardMaterial('paddleMat', this.mesh.getScene());

		mat.diffuseColor = _color;
		mat.ambientColor = Color3.Black();
		mat.alpha = 0.9;
		mat.maxSimultaneousLights = 16;
        this.mesh.material = mat;
		this.frozen = false;
		this.velocity = rotateVector(this.velocity, Math.PI / 2);
		this.mesh.rotate(Vector3.Up(), Math.atan2(surfaceNorm.x, surfaceNorm.z) + Math.PI / 2);
	}

	// take a look at moving, move "offset" in up or down direction, probably store up & down as vectors in class

	move(walls: Wall[])
	{
		this.mesh.position.x += this.velocity.x;
		this.mesh.position.z += this.velocity.z;
		for (let i = 0; i < walls.length; i++)
		{
			if (this.mesh.intersectsMesh(walls[i].getMesh(), true) == true)
			{
				if (this.velocity.x != 0)
				{
					this.mesh.position.x -= this.velocity.x;
					if (this.mesh.position.x < 0)
					{
						this.mesh.position.x += offset;
					}
					else
					{
						this.mesh.position.x -= offset;
					}
				}
				if (this.velocity.z != 0)
				{
					this.mesh.position.z -= this.velocity.z;
					if (this.mesh.position.z < 0)
					{
						this.mesh.position.z += offset;
					}
					else
					{
						this.mesh.position.z -= offset;
					}
				}

				this.velocity.x = 0;
				this.velocity.z = 0;
				return;
			}
		}
	}

	changeColor(newColor: Color3)
	{
		const mat = this.mesh.material as StandardMaterial;

		mat.diffuseColor = newColor;
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
		this.velocity.x = 0;
		this.velocity.z = 0;
	}

	update(direction: number, pressed: boolean, walls: Wall[])
	{
		if (this.frozen == true)
		{
			return;
		}
		const currentSpeed = this.velocity.length();
	
		if (pressed == false && currentSpeed > 0)
		{
			if (this.velocity.z > 0)
			{
				direction = 1;
			}
			else
			{
				direction = -1;
			}
			this.velocity.z -= this.acceleration * direction;
			if (Math.abs(this.velocity.z) < Math.abs(this.acceleration * direction * 1.5))
			{
				this.velocity.z = 0;
			}
		}
		if (pressed == true && currentSpeed < this.targetSpeed)
		{
			if (this.velocity.z > 0 && direction < 0 || this.velocity.z < 0 && direction > 0)
			{
				direction *= 2;
			}
			this.velocity.z += this.acceleration * direction;
		}
		this.move(walls);
	}

	hits(ball: Ball): boolean
	{
		return this.mesh.intersectsMesh(ball.getMesh(), false);
	}

	eliminate()
	{
		this.mesh.position = this.spawnPosition;
		this.mesh.material = Paddle.eliminatedMaterial;
		this.frozen = true;
		this.aggregate.body.setLinearVelocity(Vector3.Zero());
	}

	static setEliminatedMaterial(mat: StandardMaterial)
	{
		Paddle.eliminatedMaterial = mat;
	}
}
