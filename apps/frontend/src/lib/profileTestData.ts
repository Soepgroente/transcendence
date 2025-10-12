export interface User {
  id: number;
  alias: string;
  name?: string;
  email: string;
  avatarPath?: string;
}

export interface Match {
  id: number;
  tournamentId?: number;
  victor?: number;
  date: Date;
}

export interface MatchParticipation {
  id: number;
  matchId: number;
  playerId: number;
  placement: number;
}

export interface Friendship {
  id: number;
  userId: number;
  friendId: number;
}

export interface MatchHistoryEntry {
  id: number;
  date: Date;
  placement: number;
  opponent?: [User];
  isWin: boolean;
}

export interface Lobby {
  id: number;
  creator: number;
  players: number[];
  mode: number;
}

export enum TournamentStatus {
  WAITING = 'waiting',
  READY = 'ready',
  ONGOING = 'ongoing',
  COMPLETED = 'completed'
}

export interface Tournament {
  id: number;
  creator: number;
  name: string;
  playerLimit: number;
  players: number[];
  status: TournamentStatus;
  victor?: number;
  date: Date;
}

export interface TournamentHistoryEntry {
  id: number;
  date: Date;
  tournamentName: string;
  playerLimit: number;
  isWin: boolean;
}

export const testUsers: User[] = [
  {
    id: 1,
    alias: "Player1",
    name: "John Doe",
    email: "john@example.com",
    avatarPath: "https://thisishollywood.com/cdn/shop/products/2330-2325_1024x1024.jpg?v=1615010563",
  },
  {
    id: 2,
    alias: "GamerGirl",
    name: "Jane Smith", 
    email: "jane@example.com",
    avatarPath: "https://thf.bing.com/th?q=Avatar+Fight+Scene&w=120&h=120&c=1&rs=1&qlt=90&cb=1&pid=InlineBlock&mkt=nl-NL&cc=NL&setlang=en&adlt=moderate&t=1&mw=247",
  },
  {
    id: 3,
    alias: "ProPlayer",
    name: "Mike Johnson",
    email: "mike@example.com",
    avatarPath: "https://thf.bing.com/th?q=Mr+Bean+Avatar&w=120&h=120&c=1&rs=1&qlt=90&cb=1&pid=InlineBlock&mkt=nl-NL&cc=NL&setlang=en&adlt=moderate&t=1&mw=247",
  },
  {
    id: 4,
    alias: "EliteGamer",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    avatarPath: "https://th.bing.com/th/id/OIP.ZDjW4WOYi3l-8kcjsCkVMQHaE8?w=265&h=180&c=7&r=0&o=5&pid=1.7",
  }
]

export const testLobbies: Lobby[] = [
  {
    id: 1,
    creator: 1,
    players: [1], // Player1 waiting for 1v1 opponent
    mode: 1 // 1v1 mode
  },
  {
    id: 2,
    creator: 2,
    players: [2, 3], // GamerGirl vs ProPlayer (full 1v1)
    mode: 1 // 1v1 mode
  },
  {
    id: 3,
    creator: 1,
    players: [1, 2, 4], // 3 players waiting for one more in 2v2
    mode: 2 // 2v2 mode
  },
  {
    id: 4,
    creator: 3,
    players: [3], // ProPlayer waiting for 1v1 opponent
    mode: 1 // 1v1 mode
  },
  {
    id: 5,
    creator: 4,
    players: [1, 3], // Player1 and ProPlayer waiting for 2v2 teammates
    mode: 2 // 2v2 mode
  },
  {
    id: 6,
    creator: 2,
    players: [2, 4], // GamerGirl and EliteGamer waiting for 2v2 opponents
    mode: 2 // 2v2 mode
  }
];


export const testMatches: Match[] = [
  { id: 1, victor: 1, date: new Date('2024-09-01') },
  { id: 2, victor: 2, date: new Date('2024-09-02') },
  { id: 3, victor: 1, date: new Date('2024-09-03') },
  { id: 4, victor: 3, date: new Date('2024-09-04') },
  { id: 5, victor: 1, date: new Date('2024-09-05') },
  { id: 6, victor: 2, date: new Date('2024-09-06') },
  { id: 7, victor: 3, date: new Date('2024-09-07') },
  { id: 8, victor: 1, date: new Date('2024-09-08') },
  { id: 9, victor: 2, date: new Date('2024-09-09') },
  { id: 10, victor: 3, date: new Date('2024-09-10') },
  { id: 11, victor: 1, date: new Date('2024-09-11') },
  { id: 12, victor: 2, date: new Date('2024-09-12') },
]

export const testMatchParticipations: MatchParticipation[] = [
  { id: 1, matchId: 1, playerId: 1, placement: 1 },
  { id: 2, matchId: 1, playerId: 2, placement: 2 },
  { id: 3, matchId: 2, playerId: 2, placement: 1 },
  { id: 4, matchId: 2, playerId: 3, placement: 2 },
  { id: 5, matchId: 3, playerId: 1, placement: 1 },
  { id: 6, matchId: 3, playerId: 3, placement: 2 },
  { id: 7, matchId: 4, playerId: 3, placement: 1 },
  { id: 8, matchId: 4, playerId: 1, placement: 2 },
  { id: 9, matchId: 5, playerId: 1, placement: 1 },
  { id: 10, matchId: 5, playerId: 2, placement: 2 },
  { id: 11, matchId: 6, playerId: 2, placement: 1 },
  { id: 12, matchId: 6, playerId: 3, placement: 2 },
  { id: 13, matchId: 7, playerId: 3, placement: 1 },
  { id: 14, matchId: 7, playerId: 1, placement: 2 },
  { id: 15, matchId: 8, playerId: 1, placement: 1 },
  { id: 16, matchId: 8, playerId: 2, placement: 2 },
  { id: 17, matchId: 9, playerId: 2, placement: 1 },
  { id: 18, matchId: 9, playerId: 3, placement: 2 },
  { id: 19, matchId: 10, playerId: 3, placement: 1 },
  { id: 20, matchId: 10, playerId: 1, placement: 2 },
  { id: 21, matchId: 11, playerId: 1, placement: 1 },
  { id: 22, matchId: 11, playerId: 3, placement: 2 },
  { id: 23, matchId: 12, playerId: 2, placement: 1 },
  { id: 24, matchId: 12, playerId: 1, placement: 2 },
]

export const testTournaments: Tournament[] = [
  {
    id: 1,
    creator: 1,
    name: "Summer Championship",
    playerLimit: 4,
    players: [1],
    status: TournamentStatus.WAITING,
    date: new Date('2024-09-15')
  },
  {
    id: 2,
    creator: 2,
    name: "Elite Masters Cup",
    playerLimit: 2,
    players: [2, 3],
    status: TournamentStatus.ONGOING,
    date: new Date('2024-09-10')
  },
  {
    id: 3,
    creator: 3,
    name: "Beginner's Tournament",
    playerLimit: 4,
    players: [3, 1, 2, 4],
    status: TournamentStatus.COMPLETED,
    victor: 1,
    date: new Date('2024-09-05')
  },
  {
    id: 4,
    creator: 4,
    name: "Pro League Finals",
    playerLimit: 2,
    players: [4, 1],
    status: TournamentStatus.READY,
    date: new Date('2024-09-18')
  },
  {
    id: 5,
    creator: 1,
    name: "Weekend Warriors",
    playerLimit: 6,
    players: [1, 2],
    status: TournamentStatus.WAITING,
    date: new Date('2024-09-17')
  },
  {
    id: 6,
    creator: 2,
    name: "Champions League",
    playerLimit: 4,
    players: [2, 3, 4, 1],
    status: TournamentStatus.ONGOING,
    date: new Date('2024-09-12')
  },
  {
    id: 7,
    creator: 3,
    name: "Ultimate Challenge",
    playerLimit: 6,
    players: [3, 4, 1],
    status: TournamentStatus.WAITING,
    date: new Date('2024-09-16')
  },
  {
    id: 8,
    creator: 1,
    name: "Spring Classic",
    playerLimit: 4,
    players: [1, 2, 3, 4],
    status: TournamentStatus.COMPLETED,
    victor: 3,
    date: new Date('2024-08-28')
  },
  {
    id: 9,
    creator: 4,
    name: "Elite Duel",
    playerLimit: 2,
    players: [4, 2],
    status: TournamentStatus.COMPLETED,
    victor: 2,
    date: new Date('2024-08-20')
  },
  {
    id: 10,
    creator: 2,
    name: "Winter Championship",
    playerLimit: 4,
    players: [2, 1, 3, 4],
    status: TournamentStatus.COMPLETED,
    victor: 4,
    date: new Date('2024-08-15')
  }
]

export const testFriendships: Friendship[] = [
  { id: 1, userId: 1, friendId: 2},
  { id: 2, userId: 2, friendId: 3},
]

export function getCreator(creatorId: number): User |  undefined {
  return testUsers.find(user => user.id === creatorId) || undefined;
}

export function getUserMatches(userId: number) {
  return testMatchParticipations.filter(mp => mp.playerId === userId);
}

export function getUserStats(userId: number) {
  const userMatches = testMatchParticipations.filter(mp => mp.playerId === userId);
  const wins = userMatches.filter(mp => mp.placement === 1).length;
  const losses = userMatches.filter(mp => mp.placement > 1).length;

  return { wins, losses }
}

export function getUserById(id: number): User | undefined {
  return testUsers.find(user => user.id === id);
}

export function getUserFriends(userId: number): User[] {
  const friendsIds = testFriendships
    .filter(friendship => friendship.userId === userId || friendship.friendId === userId)
    .map(friendship => friendship.userId === userId ? friendship.friendId : friendship.userId);

    return testUsers.filter(user => friendsIds.includes(user.id));
}

export function getUserMatchHistory(userId: number): MatchHistoryEntry[] {
  const userMatches = getUserMatches(userId);

  const entries = userMatches.map(participation => {
    const match = testMatches.find(m => m.id === participation.matchId);
    if (!match)
    {
      console.log(`Match ${participation.matchId} not found`);
      return null;
    }
    const opponentParticipation = testMatchParticipations.find(mp => mp.matchId === participation.matchId && mp.playerId !== userId);
    const opponent = opponentParticipation ? getUserById(opponentParticipation.playerId) : undefined;
    
    return {
      id: participation.matchId,
      date: match.date,
      placement: participation.placement,
      opponent: opponent ? [opponent] : undefined,
      isWin: participation.placement === 1
    }
  }).filter(entry => entry != null) as MatchHistoryEntry[];

  return entries;
}

export function getUserTournamentHistory(userId: number): TournamentHistoryEntry[] {
  const userTournaments = testTournaments.filter(tournament => 
    tournament.players.includes(userId) && tournament.status === TournamentStatus.COMPLETED
  );

  const entries = userTournaments.map(tournament => {
    return {
      id: tournament.id,
      date: tournament.date,
      tournamentName: tournament.name,
      playerLimit: tournament.playerLimit,
      isWin: tournament.victor === userId
    }
  });

  return entries;
}