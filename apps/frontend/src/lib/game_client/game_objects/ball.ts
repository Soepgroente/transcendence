import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, Scene } from '@babylonjs/core';

export class Ball
{
	private mesh:		Mesh;

	constructor(_center: Vector3, _color: Color3, _diameter: number, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateSphere('sphere', {diameter: _diameter}, scene);
		const mat = new StandardMaterial('ballMat', scene);

		mat.diffuseColor = _color;
		mat.maxSimultaneousLights = 16;
		this.mesh.position = _center;
		this.mesh.material = mat;
	}

	destroy()
	{
		this.mesh.dispose();
	}

	update(x: number, z: number)
	{
		this.mesh.position.x = x;
		this.mesh.position.z = z;
	}

	getMesh(): Mesh
	{
		return this.mesh;
	}
}
