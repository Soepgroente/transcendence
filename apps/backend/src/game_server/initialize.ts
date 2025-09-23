import { Wall, Ball, Paddle, Goal, Player, jsonToVector3 } from './index';
import { Scene, Vector3, MeshBuilder, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

const ballDiameter = 0.5;

export function	createSurroundingWalls(scene: Scene, walls: Wall[], dimensions: number[])
{
	const height = dimensions[0];
	const width = dimensions[1];
	const wallThickness = 0.5;
	const wallHeight = ballDiameter * 8;
	const wallOpacity = 0.3;

	/* | on right */
	walls.push(
		new Wall(new Vector3(wallThickness, wallHeight, height + wallThickness * 2),
		new Vector3(-width / 2 - wallThickness / 2, wallHeight / 2, 0),
		new Vector3(1, 0, 0),
		wallOpacity,
		scene)
	);

	/* | on left */
	walls.push(
		new Wall(new Vector3(wallThickness, wallHeight, height + wallThickness * 2),
		new Vector3(width / 2 + wallThickness / 2, wallHeight / 2, 0),
		new Vector3(-1, 0, 0),
		wallOpacity,
		scene)
	);

	walls.push(
		new Wall(new Vector3(width, wallHeight, wallThickness),
		new Vector3(0, wallHeight / 2, -height / 2 - wallThickness / 2),
		new Vector3(0, 0, 1),
		wallOpacity,
		scene)
	);

	walls.push(
		new Wall(new Vector3(width, wallHeight, wallThickness),
		new Vector3(0, wallHeight / 2, height / 2 + wallThickness / 2),
		new Vector3(0, 0, -1),
		wallOpacity,
		scene)
	);
}

export function createWalls(scene: Scene, walls: Wall[], map: any)
{
	if (map.walls == null || map.walls.length == 0)
	{
		return;
	}
	for (let i = 0; i < map.walls.length; i++)
	{
		walls.push(new Wall
		(
			jsonToVector3(map.walls[i].dimensions),
			jsonToVector3(map.walls[i].location),
			jsonToVector3(map.walls[i].surfaceNormal),
			map.walls[i].opacity || 1,
			scene
		));
	}
}

export function createGoals(scene: Scene, goals: Goal[], map: any)
{
	if (map.goals.length > 6)
	{
		throw new Error('Map cannot have more than 6 players.');
	}
	for (let i = 0; i < map.goals.length; i++)
	{
		goals.push(new Goal
		(
			jsonToVector3(map.goals[i].location),
			jsonToVector3(map.goals[i].dimensions),
			jsonToVector3(map.goals[i].post1),
			jsonToVector3(map.goals[i].post2),
			jsonToVector3(map.goals[i].surfaceNormal),
			scene
		));
	}
}

export function createBalls(scene: Scene, balls: Ball[], map: any)
{
	if (map.balls == null || map.balls.length == 0)
	{
		throw new Error('Map must have at least one ball.');
	}
	for (let i = 0; map.balls[i]; i++)
	{
		balls.push(new Ball
		(
			jsonToVector3(map.balls[i].location),
			0.5, scene
		));
	}
}

export function createPaddles(scene: Scene, paddles: Paddle[], mapGoals: any[])
{
	for (let i = 0; i < mapGoals.length; i++)
	{
		const dimensions = jsonToVector3(mapGoals[i].dimensions);
		dimensions.x = 0.3;
		dimensions.y = 1.5;
		dimensions.z = dimensions.z / 4;
		const goalPos = jsonToVector3(mapGoals[i].location);
		const normal = jsonToVector3(mapGoals[i].surfaceNormal);
		const paddlePos = goalPos.add(normal.scale(2));

		paddles.push(new Paddle
			(dimensions,
			paddlePos,
			normal,
			scene
		));
	}
}

export function createPlayers(players: Player[], goals: Goal[], paddles: Paddle[])
{
	for (let i = 0; i < paddles.length; i++)
	{
		const player = new Player(`Player ${i + 1}`, i + 1, goals[i], paddles[i]);

		players.push(player);
	}
}

export function	createGround(scene: Scene, dimensions: number[])
{
	const ground = MeshBuilder.CreateGround(
		'ground',
		{width: dimensions[1], height: dimensions[0], updatable: false},
		scene
	);
	new PhysicsAggregate(
		ground,
		PhysicsShapeType.BOX,
		{ mass: 0, restitution: 0.5 },
		scene
	);
}
