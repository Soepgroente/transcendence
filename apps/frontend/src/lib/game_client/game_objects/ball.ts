import { StandardMaterial, Color3, Vector3, MeshBuilder, Mesh, Scene } from '@babylonjs/core';

export class Ball
{
	private mesh:		Mesh;

	constructor(_center: Vector3, _color: Color3, _diameter: number, scene: Scene)
	{
		const mat = new StandardMaterial('ballMat', this.mesh.getScene());

		mat.diffuseColor = _color;
		mat.maxSimultaneousLights = 16;
		this.mesh = MeshBuilder.CreateSphere('sphere', {diameter: _diameter}, scene);
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
