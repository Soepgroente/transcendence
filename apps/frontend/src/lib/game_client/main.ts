import HavokPhysics from '@babylonjs/havok';
import { ClientGame } from '../index';

async function getPhysics(): Promise<any>
{
	return await HavokPhysics({locateFile: (file: string) => `/${file}`});
}
	
export async function startGame(map: string): Promise<ClientGame>
{
	const havokInstance = await getPhysics();

	if (havokInstance.isError == true)
	{
		console.error('Failed to initialize HavokPhysics.');
		return;
	}
	const game = new ClientGame(havokInstance);
	
	await game.loadMap(map);
	game.run();
	return game;
}
