import type { GameState, PlayerAction } from '@repo/trpc/types';
import { TRPCError } from '@trpc/server';
import { EventEmitter } from 'events';
import { startGame } from './main';
import { ServerGame } from './game_objects/server_game';

export class GameStateManager extends EventEmitter {
  private static instance: GameStateManager;

  private constructor() {
    super();
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private serverGames = new Map<number, ServerGame>();

  subscribe(matchId: number, callback: (state: GameState) => void) {
    console.log(`SUBSCRIBING to gameState:${matchId}`);
    this.on(`gameState:${matchId}`, callback);
    return () => {
      this.off(`gameState:${matchId}`, callback);
    };
  }

  notifySubs(matchId: number, gameState: GameState) {
    this.emit(`gameState:${matchId}`, gameState);
  }

  getGameState(matchId: number): GameState | null {
    return this.serverGames.get(matchId)?.gameState ?? null;
  }

  /**
   * Initializes a new game state for the given matchId if it doesn't already exist.
   * Also starts a new ServerGame instance for the match.
   * @param matchId The ID of the match to initialize
   * @param players The list of players in the match
   * @returns The initialized GameState
   * @throws TRPCError if the game state already exists and is not in 'waiting' status
   */

  async initGameState(
    matchId: number,
    players: { id: number; alias: string }[]
  ): Promise<GameState> {
    if (this.serverGames.has(matchId)) {
      const existingState = this.getGameState(matchId);
      if (existingState) {
        return existingState;
      }
    }
    console.log(`Initializing game state for match ${matchId}...`);
    const initialState: GameState = {
      matchId,
      status: 'waiting' as const,
      lastUpdate: new Date(),
      players: players.map((p) => ({
        id: p.id,
        alias: p.alias,
        lives: 3,
        position: { x: 0, z: 0 },
        isAlive: true,
        isReady: false,
        action: { playerId: p.id, matchId, action: '0' },
      })),
      balls: [{ x: 0, z: 0 }],
    };

    const serverGame = await startGame(initialState, this, players.length);
    this.serverGames.set(matchId, serverGame);
    this.notifySubs(matchId, initialState);
    return initialState;
  }

  /**
   * Handles a player action by enqueuing it in the corresponding ServerGame instance.
   * @param action The player action to handle
   * @throws TRPCError if the match is not found
   */

  handlePlayerAction(action: PlayerAction): void {
    const serverGame = this.serverGames.get(action.matchId);

    if (!serverGame) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Match not found in manager',
      });
    }
    serverGame.enqueueAction(action);
    if (serverGame.gameState.status == 'waiting') {
      if (action.action == 'ready' && serverGame.gameState.players.every((p) => p.isReady)) {
          //here update DB that match is starting
        }
    }
  }
}
