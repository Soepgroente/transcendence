import {
  GameState
} from '@repo/trpc/src/types/gameState';
import { TRPCError } from '@trpc/server';
import { EventEmitter } from 'events';

export class GameStateManager extends EventEmitter {
  private gameStates = new Map<number, GameState>();

  subscribe(matchId: number, callback: (state: GameState) => void) {
    this.on(`gameState:${matchId}`, callback);
    return () => {
      this.off(`gameState: ${matchId}`, callback);
    };
  }

  notifySubs(matchId: number, gameState: GameState) {
    console.log(`Notifying subscribers of match ${matchId}`);
    this.emit(`gameState:${matchId}`, gameState);
  }

  getGameState(matchId: number): GameState | null {
    return this.gameStates.get(matchId) ?? null;
  }

  /**
   *
   * @param matchId The unique identifier for the match
   * @param players Array of players participating in the match still not sure from where we get this
   * @returns
   */
  initGameState(matchId: number, players: { id: number; alias: string }[]): GameState
  {
    const initialState = new GameState(matchId);

    for (const player of players)
    {
      initialState.players.push(
      {
        id: player.id,
        alias: player.alias,
        lives: 3,
        position: { x: 0, z: 0 },
        isAlive: true,
        isReady: false,
        action: []
      });
    }
    this.gameStates.set(matchId, initialState);
    this.notifySubs(matchId, initialState);
    return initialState;
  }
}

export function addGameState(game: GameState)
{
  
}