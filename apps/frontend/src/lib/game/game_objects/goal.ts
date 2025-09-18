import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, PhysicsShapeType, PhysicsAggregate, PointLight, Scene } from '@babylonjs/core';
import { Ball } from '../../index';

const goalPostDiameter = 0.5;

export class Goal
{
	private post1:		Mesh;
	private post2:		Mesh;
	private plate:		Mesh;
	private lights:		PointLight[] = [];
	private isAlive:	boolean;
	private normal:		Vector3;
	private color:		Color3;
	private scoringCooldown: number;
	private aggregate:	PhysicsAggregate;

	private static goalPostMaterial: StandardMaterial;
	private static eliminatedMaterial: StandardMaterial;

	private static height = 4;

	constructor(goalpos: Vector3, dimensions: Vector3, post1: Vector3, post2: Vector3, clr: Color3, normalDir: Vector3, scene: Scene)
	{
		this.isAlive = true;
		this.scoringCooldown = 0;
		this.normal = normalDir;
		this.color = clr;
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
		
		this.aggregate = new PhysicsAggregate(
			this.plate,
			PhysicsShapeType.BOX,
			{ mass: 0, restitution: 1 },
			scene
		);
		const mat = new StandardMaterial('goalMat', scene);
		
		mat.diffuseColor = clr;
		mat.ambientColor = clr;
		mat.alpha = 0.4;
		mat.maxSimultaneousLights = 16;
		this.plate.material = mat;
	}

	createPost(position: Vector3, scene: Scene): Mesh
	{
		const post = MeshBuilder.CreateCylinder('goalPost', { diameter: goalPostDiameter, height: Goal.height }, scene);
		post.position = position;
		post.material = Goal.goalPostMaterial;
		post.position.y = Goal.height / 2;

		new PhysicsAggregate(
			post,
			PhysicsShapeType.CYLINDER,
			{ mass: 0, restitution: 1 },
			scene
		);
		const light = new PointLight('goalLight', new Vector3(position.x, Goal.height, position.z), scene);

		light.diffuse = this.color;
		light.specular = this.color;
		light.intensity = 0.5;
		light.range = 25;
		this.lights.push(light);
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
		this.post1.material = Goal.eliminatedMaterial;
		this.post2.material = Goal.eliminatedMaterial;
		this.plate.material = Goal.eliminatedMaterial;
		for (const light of this.lights)
		{
			light.dispose();
		}
		this.isAlive = false;
	}
	

	static setEliminatedMaterial(mat: StandardMaterial)
	{
		Goal.eliminatedMaterial = mat;
	}

	static getHeight(): number
	{
		return Goal.height;
	}

	static createGoalPostMaterial(scene: Scene)
	{
		const mat = new StandardMaterial('goalPostMat', scene);

		mat.diffuseColor = new Color3(0, 0, 0);
		mat.ambientColor = new Color3(0, 0, 0);
		mat.maxSimultaneousLights = 16;
		Goal.goalPostMaterial = mat;
	}
}
