import { ServerGame } from './game_objects/server_game';
import { GameStateManager } from './game-state-manager';
import HavokPhysics from '@babylonjs/havok';
import path from 'path';
import fs from 'fs';
import { type GameState } from '@repo/trpc/types';

/**
* @returns a Promise that resolves to the HavokPhysics instance 
*/

async function getPhysics(): Promise<any>
{
	const localPath = './src/maps/HavokPhysics.wasm';
	// const libPath = 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm';

	const wasmPath = path.resolve(
    process.cwd(),
	localPath
	);
	console.log('Loading Havok WASM from:', wasmPath);
	const buf = fs.readFileSync(wasmPath);
	const wasmBinary = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

	return await HavokPhysics({ wasmBinary});
}

/**
 * Utility function to load a file and return its text content.
 * @param gameState 
 * @param gameStateManager 
 * @param map Optional path to the map file
 * @returns 
 */
export async function startGame(gameState: GameState, gameStateManager: GameStateManager, maxPlayers: number): Promise<ServerGame>
{

	const map = `./src/maps/standard${maxPlayers}player.map`;	
	
	const havokInstance = await getPhysics();

	if (!havokInstance) {
		console.error('HavokPhysics instance is not available.');
		return Promise.reject('Physics engine is not initialized.');
	}
	const game = new ServerGame(havokInstance, gameState, gameStateManager); // Pass the gameStateManager instance;
	
	await game.loadMap(map);
	game.run();
	return game;
}
// /Users/NajiKanounji/42/transcendence/apps/backend/src/maps/standard2player.map
// Loading Havok WASM from: /Users/NajiKanounji/42/transcendence/apps/backend/node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm