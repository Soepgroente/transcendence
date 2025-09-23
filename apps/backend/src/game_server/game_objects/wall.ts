import { Vector3, MeshBuilder, Mesh, PhysicsShapeType, PhysicsAggregate, Scene } from '@babylonjs/core';

export class Wall
{
	private mesh:		Mesh;
	private aggregate:	PhysicsAggregate;

	constructor(dimensions: Vector3, _position: Vector3, _surfaceNormal: Vector3, opacity: number, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'wall', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.mesh.position = _position;

		this.aggregate = new PhysicsAggregate(
			this.mesh,
			PhysicsShapeType.BOX,
			{ mass: 0, restitution: 1 },
			scene
		);
	}

	getMesh(): Mesh
	{
		return this.mesh;
	}
}
