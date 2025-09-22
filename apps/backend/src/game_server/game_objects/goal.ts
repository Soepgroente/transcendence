import { StandardMaterial, Vector3, MeshBuilder, Mesh, PhysicsShapeType, PhysicsAggregate, PointLight, Scene } from '@babylonjs/core';
import { Ball } from '../index';

const goalPostDiameter = 0.5;

export class Goal
{
	private post1:		Mesh;
	private post2:		Mesh;
	private plate:		Mesh;
	private isAlive:	boolean;
	private normal:		Vector3;
	private scoringCooldown: number;

	private static height = 4;

	constructor(goalpos: Vector3, dimensions: Vector3, post1: Vector3, post2: Vector3, normalDir: Vector3, scene: Scene)
	{
		this.isAlive = true;
		this.scoringCooldown = 0;
		this.normal = normalDir;
		this.post1 = this.createPost(post1, scene);
		this.post2 = this.createPost(post2, scene);
		
		this.plate = MeshBuilder.CreateBox(
			'goalplate',
			{ width: dimensions.x, height: Goal.height, depth: dimensions.z },
			scene
		);
		this.plate.position = goalpos;
		this.plate.position.y = Goal.height / 2;
		this.plate.rotate(Vector3.Up(), Math.atan2(normalDir.x, normalDir.z) + Math.PI / 2);
		
		new PhysicsAggregate(
			this.plate,
			PhysicsShapeType.BOX,
			{ mass: 0, restitution: 1 },
			scene
		);
	}

	createPost(position: Vector3, scene: Scene): Mesh
	{
		const post = MeshBuilder.CreateCylinder('goalPost', { diameter: goalPostDiameter, height: Goal.height }, scene);
		post.position = position;
		post.position.y = Goal.height / 2;

		new PhysicsAggregate(
			post,
			PhysicsShapeType.CYLINDER,
			{ mass: 0, restitution: 1 },
			scene
		);
		return post;
	}

	score(ball: Ball): boolean
	{
		if (this.isAlive == false)
		{
			return false;
		}
		if (this.plate.intersectsMesh(ball.getMesh(), false) == false)
		{
			return false;
		}

		if (this.scoringCooldown == 3)
		{
			this.scoringCooldown = 0;
		}

		if (this.scoringCooldown > 0)
		{
			this.scoringCooldown++;
			return false;
		}

		const linearVelocity = ball.getDirection();

		if (linearVelocity == null)
		{
			return false;
		}
		const ballDirection = linearVelocity.normalize();

		return Vector3.Dot(ballDirection, this.normal) < 0;
	}

	getPlateMesh(): Mesh
	{
		return this.plate;
	}

	getPost1Mesh(): Mesh
	{
		return this.post1;
	}

	getPost2Mesh(): Mesh
	{
		return this.post2;
	}

	eliminate()
	{
		this.isAlive = false;
	}
}
