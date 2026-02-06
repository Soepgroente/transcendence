# Pong CLI

A command-line interface for interacting with the Pong backend API.  
Use this tool to sign up, sign in, and view your match history directly from the terminal.

## Features

- **Sign Up:** Create a new account.
- **Sign In:** Authenticate and store your token locally.
- **Match History:** List your matches.
- **signout**: remove the token.

## Requirements

- The backend server must be running and accessible for the CLI to work.
- By default, the CLI connects to the backend API at `backend`.
  You can change this by setting the `BACKEND_API` environment variable.

## Usage

### Development

```bash
pnpm --filter cli dev [command] 
```

### Production
access to cli docker 

```bash
docker compose -f compose.prod.yaml exec  cli /bin/sh
```

run `pong` and choose from help menu
