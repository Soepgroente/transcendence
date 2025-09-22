import HavokPhysics from '@babylonjs/havok';
import { ServerGame } from './index';

async function getPhysics(): Promise<any>
{
	return await HavokPhysics({locateFile: (file: string) => `/${file}`});
}
	
export async function startGame(map: string): Promise<ServerGame>
{
	const havokInstance = await getPhysics();

	if (havokInstance.isError == true)
	{
		console.error('Failed to initialize HavokPhysics.');
		return Promise.reject();
	}
	const game = new ServerGame(havokInstance);
	
	await game.loadMap(map);
	game.run();
	return game;
}
