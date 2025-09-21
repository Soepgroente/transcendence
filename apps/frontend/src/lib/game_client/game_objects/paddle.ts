import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh,
		PhysicsAggregate, Scene } from '@babylonjs/core';

export class Paddle
{
	private mesh:			Mesh;
	private aggregate:		PhysicsAggregate;

	private static eliminatedMaterial:	StandardMaterial;

	constructor(dimensions: Vector3, _position: Vector3, surfaceNorm: Vector3, _color: Color3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'box', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.mesh.position = _position;
		this.mesh.position.y = dimensions.y / 2;
		this.mesh.rotate(Vector3.Up(), Math.atan2(surfaceNorm.x, surfaceNorm.z) + Math.PI / 2);

		const mat = new StandardMaterial('paddleMat', this.mesh.getScene());

		mat.diffuseColor = _color;
		mat.ambientColor = Color3.Black();
		mat.alpha = 0.9;
		mat.maxSimultaneousLights = 16;
		this.mesh.material = mat;
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

	update(x: number, z: number)
	{
		this.mesh.position.x = x;
		this.mesh.position.z = z;
	}

	eliminate()
	{
		this.mesh.material = Paddle.eliminatedMaterial;
		this.aggregate.body.setLinearVelocity(Vector3.Zero());
	}

	static setEliminatedMaterial(mat: StandardMaterial)
	{
		Paddle.eliminatedMaterial = mat;
	}
}
