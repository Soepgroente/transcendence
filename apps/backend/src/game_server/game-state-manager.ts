import {
  GameState,
  Player,
  PlayerAction,
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
  initGameState(
    matchId: number,
    players: { id: number; alias: string }[]
  ): GameState {
    const initialState: GameState = {
      matchId,
      status: 'waiting',
      players: players.map((p) => ({
        id: p.id,
        alias: p.alias,
        lives: 3, // Number of lives each player starts with
        isAlive: true,
        isReady: false,
        position: { x: 0, y: 0 }, // Where should paddles start?
      })),
      currentRound: 1,
      lastUpdate: new Date(),
      ball: {
        position: { x: 400, y: 300 }, // Center canvas?
        velocity: { x: 0, y: 0 }, // Not moving initially?
      },
    };
    this.gameStates.set(matchId, initialState);
    this.notifySubs(matchId, initialState);
    return initialState;
  }

  /**
   * Handles player actions such as moving paddles or marking readiness.
   * @param action The action performed by the player
   * @returns
   */
  handlePlayerAction(action: PlayerAction): void {
    console.log('Processing action:', action);
    const currentState = this.getGameState(action.matchId);
    if (!currentState) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
    }
    const player = currentState.players.find(
      (p) => p.id === action.playerId
    ) as Player;
    if (!player) {
      console.error('Player not found in match: ', action.playerId);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Player not found in this match ' + action.playerId,
      });
    }
    switch (action.action) {
      case 'up':
        // Move player's paddle up
        player.position.y -= 10; // Example movement
        break;
      case 'down':
        // Move player's paddle down
        break;
      case 'stop':
        // Stop player's paddle
        break;
      case 'ready':
        player.isReady = true;
        break;
    }
    this.gameStates.set(action.matchId, currentState);
  }
}
