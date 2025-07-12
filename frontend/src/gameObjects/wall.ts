import { Engine, Scene, FreeCamera, StandardMaterial, Vector3, Color3, HemisphericLight, MeshBuilder, Mesh } from '@babylonjs/core';

export class Wall
{
	mesh:		Mesh;
	normal:		Vector3;
	color:		string;

	constructor(dimensions: Vector3, _position: Vector3, _color: Color3, _normal: Vector3, scene: Scene)
	{
		this.mesh = MeshBuilder.CreateBox
		(
			'wall', 
			{width: dimensions.x, height: dimensions.y, depth: dimensions.z},
			scene
		);
		this.mesh.position = _position;
		this.normal = _normal;
		
		const mat = new StandardMaterial("wallMat", this.mesh.getScene());
		mat.diffuseColor = _color;
		mat.alpha = 0.1;
        this.mesh.material = mat;
	}
}

