import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, Scene } from '@babylonjs/core';

export class Wall
{
	private mesh:		Mesh;

	constructor(dimensions: Vector3, _position: Vector3, _surfaceNormal: Vector3, _color: Color3, opacity: number, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'wall', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.mesh.position = _position;
		// this.mesh.rotate(Vector3.Up(), Math.atan2(_surfaceNormal.x, _surfaceNormal.z) + Math.PI / 2);

		const mat = new StandardMaterial('wallMat', this.mesh.getScene());
		mat.diffuseColor = _color;
		mat.alpha = opacity;
		mat.maxSimultaneousLights = 16;
        this.mesh.material = mat;
	}

	getMesh(): Mesh
	{
		return this.mesh;
	}
}
