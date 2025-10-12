import { ClientGame, type GameState } from '../index';

export async function startGame(map: string, gameState: GameState, userId: number): Promise<ClientGame>
{
	if (gameState == null || gameState === undefined)
	{
		return new Promise<ClientGame>((resolve, reject) => {reject('GameState does not exist');});
	}
	const game = new ClientGame(gameState, userId);
	
	await game.loadMap(map);
	if (gameState.status !== 'finished')
		game.run();
	return game;
}
