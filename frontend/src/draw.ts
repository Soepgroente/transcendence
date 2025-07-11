// export function drawSphere(
// 	scene: BABY.Scene,
// 	position: BABY.Vector3,
// 	diameter: number,
// 	options?: { color?: BABY.Color3 }
// ): BABY.Mesh 
// {
// 	const sphere = BABY.MeshBuilder.CreateSphere('sphere', { diameter }, scene);
	
// 	sphere.position = new BABY.Vector3(position.x, position.y, position.z);
// 	if (options?.color)
// 	{
// 		const mat = new BABY.StandardMaterial('sphereMat', scene);
// 		mat.diffuseColor = options.color;
// 		sphere.material = mat;
// 	}
// 	return sphere;
// }