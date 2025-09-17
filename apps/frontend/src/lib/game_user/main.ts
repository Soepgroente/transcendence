import HavokPhysics from '@babylonjs/havok';
import { Game } from '../index';

async function getPhysics(): Promise<any>
{
	return await HavokPhysics({locateFile: (file: string) => `/${file}`});
}
	
export async function startGame(map: string): Promise<Game>
{
	const havokInstance = await getPhysics();

	if (havokInstance.isError == true)
	{
		console.error('Failed to initialize HavokPhysics.');
		return;
	}
	const game = new Game(havokInstance);
	
	await game.loadMap(map);
	game.run();
	return game;
}
