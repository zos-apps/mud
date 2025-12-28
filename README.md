# 🏰 MUD

Multiplayer text adventure with AI dungeon master.

## Features

- **Multiplayer** - Play with others in the same browser via BroadcastChannel
- **LLM-Powered Narration** - Dynamic, atmospheric descriptions
- **Pixel Art** - ASCII art scene visualization
- **Character Creation** - Choose avatar, class, and color
- **Exploration** - 9 interconnected rooms to explore
- **Commands** - Full MUD command set (look, move, take, say, emote, etc.)

## Commands

```
Movement: north/n, south/s, east/e, west/w, up/u, down/d
look/l - Look around the room
say/'message - Say something
emote/:action - Perform an action
take/get item - Pick up an item
inventory/i - Check your pack
who - See online players
stats - View your character
help/? - Show commands
```

## Installation

\`\`\`bash
npm install @anthropic/mud
# or
pnpm add @anthropic/mud
\`\`\`

## Usage

\`\`\`tsx
import MUD from '@anthropic/mud';

function App() {
  return <MUD onClose={() => {}} />;
}
\`\`\`

## World

- Town Square - Starting area
- The Rusty Dragon Tavern - Rest and gossip
- Eastern Market - Buy potions and gear
- Temple of the Light - Healing and blessings
- Southern Gate - Exit to the wilderness
- The Darkwood - Dangerous forest
- Dragon's Lair - Treasure and danger
- Alchemist's Workshop - Magical items

## License

MIT
