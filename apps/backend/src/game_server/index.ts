import { Vector3 } from "@babylonjs/core";

export * from './game_objects/ball';
export * from './game_objects/paddle';
export * from './game_objects/wall';
export * from './game_objects/player';
export * from './game_objects/goal';
export * from './game_objects/server_game';
export * from './initialize';
export * from './main';
export { type GameState2, type GameState } from '@repo/trpc/src/types/gameState';

export function dot2D(a: Vector3, b: Vector3): number
{
	return a.x * b.x + a.z * b.z;
}

export function jsonToVector2(obj: { width: number; height: number }): [number, number]
{
	return [obj.width, obj.height];
}

export function jsonToVector3(obj: { x: number; y: number; z: number }): Vector3
{
	return new Vector3(obj.x, obj.y, obj.z);
}

export function vector3ToJson(vec: Vector3): { x: number; y: number; z: number }
{
	return { x: roundNumber(vec.x), y: roundNumber(vec.y), z: roundNumber(vec.z) };
}

export function roundNumber(n: number): number
{
	return Math.round(n * 1000) / 1000;
}