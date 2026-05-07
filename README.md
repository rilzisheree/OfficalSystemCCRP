# Discord Moderation Bot

A professional Discord moderation bot with slash commands, MongoDB persistence, and Railway deployment support.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
DISCORD_TOKEN=      # Your bot token from Discord Developer Portal
CLIENT_ID=          # Your application's client ID
MONGODB_URI=        # MongoDB connection string (MongoDB Atlas recommended)
BOT_OWNER_ID=       # Your Discord user ID (for owner-only commands)
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Deploy Slash Commands

Run this once to register all slash commands with Discord (global deploy, takes up to 1 hour):

```bash
pnpm deploy
```

### 4. Start the Bot

**Development:**
```bash
pnpm dev
```

**Production (after build):**
```bash
pnpm build
pnpm start
```

---

## Railway Deployment

1. Create a new Railway project
2. Connect your GitHub repo or use the Railway CLI
3. Set the following environment variables in Railway:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `MONGODB_URI`
   - `BOT_OWNER_ID`
4. Railway will auto-detect the `Dockerfile` and build/run the bot

---

## Commands

### Moderation

| Command | Description | Who can use |
|---|---|---|
| `/purge [amount] [user?]` | Delete up to 100 messages, optionally filter by user | Admin / `allowuser` |
| `/say send [message] [channel?] [reply_to?]` | Send a message as the bot, optionally reply to a message by ID | Admin / `allowuser` |
| `/say edit [message_id] [content] [channel?]` | Edit a bot message by ID | Admin / `allowuser` |
| `/dm [user] [message]` | Send a DM to a user from the bot | Admin / `allowuser` |
| `/globalban [user] [reason?]` | Ban a user from every server the bot is in | Owner only |
| `/unglobalban [user_id]` | Remove a user's global ban | Owner only |
| `/globalbanlist` | Paginated list of globally banned users with unban buttons | Owner only |

### Utility

| Command | Description | Who can use |
|---|---|---|
| `/serverlist` | View all servers with invite links and leave buttons | Owner only |
| `/setlogchannel setglobal` | Set current channel as the global log channel | Owner only |
| `/setlogchannel remove` | Remove the global log channel | Owner only |
| `/setlogchannel check` | Check the current global log channel | Owner only |

### Permissions

| Command | Description | Who can use |
|---|---|---|
| `/allowuser add [user] [command]` | Grant a user permission to use a specific command | Admin |
| `/allowuser remove [user] [command]` | Revoke a user's permission for a command | Admin |
| `/allowuser list` | List all users with custom permissions in this server | Admin |
| `/allowuser check [user]` | Check what commands a user is allowed to use | Admin |

---

## Global Log Channel

Once set with `/setlogchannel setglobal`, the log channel receives:
- Every message deletion from every server
- Every message edit from every server
- Every slash command used from every server
- Global ban/unban actions

---

## Required Bot Permissions

Make sure your bot has the following permissions when adding it to a server:

- Read Messages / View Channels
- Send Messages
- Embed Links
- Manage Messages
- Ban Members
- Create Instant Invite
- Read Message History
- Manage Channels (for invite creation)

**Required Intents (in Discord Developer Portal):**
- Server Members Intent
- Message Content Intent
