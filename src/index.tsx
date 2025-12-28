import React, { useState, useEffect, useRef, useCallback } from 'react';

interface MUDProps {
  onClose: () => void;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  class: string;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  inventory: string[];
  room: string;
  color: string;
}

interface Message {
  id: string;
  type: 'system' | 'narration' | 'chat' | 'action' | 'scene';
  sender?: string;
  senderColor?: string;
  content: string;
  timestamp: number;
  pixelArt?: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  exits: Record<string, string>;
  items: string[];
  npcs: string[];
  pixelArt: string;
}

const AVATAR_OPTIONS = ['🧙', '⚔️', '🏹', '🗡️', '🛡️', '🔮', '🐉', '🦊', '🧝', '🧛', '👹', '🧟'];
const CLASS_OPTIONS = ['Wizard', 'Warrior', 'Ranger', 'Rogue', 'Cleric', 'Bard'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

// Game world
const ROOMS: Record<string, Room> = {
  'town-square': {
    id: 'town-square',
    name: 'Town Square',
    description: 'You stand in the bustling town square. A fountain gurgles in the center, and merchants hawk their wares from wooden stalls. The cobblestones are worn smooth by countless feet.',
    exits: { north: 'tavern', east: 'market', south: 'gate', west: 'temple' },
    items: ['copper coin', 'worn map'],
    npcs: ['Town Crier', 'Fruit Vendor'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  🏛️    🌳  ⛲  🌳    🏛️  │
      │  🏠 ═══════════════════ 🏪  │
      │     🧑🧑  🧙  🧑🧑      │
      │  🏠 ═══════════════════ 🏠  │
      │      🌳         🌳      │
      └─────────────────────────────┘
    `
  },
  'tavern': {
    id: 'tavern',
    name: 'The Rusty Dragon Tavern',
    description: 'Warm firelight flickers across the common room. The smell of roasting meat and spilled ale fills the air. Adventurers of all sorts gather here, sharing tales of glory and disaster.',
    exits: { south: 'town-square', up: 'tavern-rooms' },
    items: ['mug of ale', 'bowl of stew'],
    npcs: ['Barkeep Mira', 'Mysterious Stranger'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  🔥🪵🔥  🍺🍺🍺  🛡️⚔️  │
      │  ═══════════════════════  │
      │  🪑🧝🪑  🪑🧙🪑  🪑🧟🪑  │
      │  ═══════════════════════  │
      │  🚪           🪜          │
      └─────────────────────────────┘
    `
  },
  'market': {
    id: 'market',
    name: 'Eastern Market',
    description: 'Colorful tents and stalls line the narrow street. Merchants from distant lands display exotic wares: shimmering silks, mysterious potions, and weapons of fine craft.',
    exits: { west: 'town-square', north: 'alchemist' },
    items: ['healing potion', 'rusty dagger'],
    npcs: ['Silk Merchant', 'Weapon Smith'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  ⛺💎  ⛺🧪  ⛺⚗️  ⛺🗡️  │
      │  ═══════════════════════  │
      │  🧑💰  🧙🔮  🧝🎒  🧟🪙  │
      │  ═══════════════════════  │
      │  🏺  🪔  📜  🗝️  💰  │
      └─────────────────────────────┘
    `
  },
  'gate': {
    id: 'gate',
    name: 'Southern Gate',
    description: 'Massive iron gates stand open, guarded by soldiers in gleaming armor. Beyond lies the wilderness - forests dark with mystery and roads leading to distant kingdoms.',
    exits: { north: 'town-square', south: 'wilderness' },
    items: [],
    npcs: ['Gate Captain', 'Weary Traveler'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  🏰 ⬛⬛🚪⬛⬛ 🏰  │
      │      ⚔️🛡️  🛡️⚔️      │
      │  ═══════════════════════  │
      │  🌳🌲  🛤️🛤️  🌲🌳  │
      │  🌲🌳  🛤️🛤️  🌳🌲  │
      └─────────────────────────────┘
    `
  },
  'temple': {
    id: 'temple',
    name: 'Temple of the Light',
    description: 'Marble columns rise to a vaulted ceiling painted with celestial scenes. Candles flicker on countless altars, and the air is thick with incense and whispered prayers.',
    exits: { east: 'town-square' },
    items: ['holy water', 'prayer beads'],
    npcs: ['High Priestess', 'Penitent Monk'],
    pixelArt: `
      ┌─────────────────────────────┐
      │    ✨  ⭐  ✨  ⭐  ✨    │
      │  🏛️ ═══════════════ 🏛️  │
      │  🕯️  🕯️  ⛪  🕯️  🕯️  │
      │      🧎  🙏  🧎      │
      │  ════════════════════════  │
      └─────────────────────────────┘
    `
  },
  'wilderness': {
    id: 'wilderness',
    name: 'The Darkwood',
    description: 'Ancient trees tower overhead, their branches blocking out the sky. Strange sounds echo through the mist. This is no place for the unprepared.',
    exits: { north: 'gate', east: 'cave' },
    items: ['glowing mushroom', 'wolf fang'],
    npcs: ['Forest Spirit', 'Goblin Scout'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  🌲🌳🌲🌳🌲🌳🌲🌳🌲  │
      │  🌫️🐺  🦇  🌫️🕷️  🦉  │
      │  🌲 ════════════ 🌲  │
      │  🍄  💀  🌿  🐍  🌲  │
      │  🌲🌳🌲🌳🌲🌳🌲🌳🌲  │
      └─────────────────────────────┘
    `
  },
  'cave': {
    id: 'cave',
    name: 'Dragon\'s Lair',
    description: 'The cave mouth yawns before you, exhaling hot, sulfurous air. Gold coins glitter in the darkness. Something massive breathes in the depths...',
    exits: { west: 'wilderness' },
    items: ['gold coin', 'dragon scale', 'ancient sword'],
    npcs: ['Sleeping Dragon'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  ⬛⬛⬛⬛🔥⬛⬛⬛⬛  │
      │  ⬛💰💰💰🐉💰💰💰⬛  │
      │  ⬛💰💎👑💎💰💀⬛  │
      │  ⬛💰💰💰💰💰💰⬛  │
      │  ⬛⬛⬛🚪⬛⬛⬛  │
      └─────────────────────────────┘
    `
  },
  'alchemist': {
    id: 'alchemist',
    name: 'Alchemist\'s Workshop',
    description: 'Bubbling cauldrons and shelves of strange ingredients fill this cramped space. A wizened figure peers at you through thick spectacles.',
    exits: { south: 'market' },
    items: ['fire potion', 'invisibility elixir'],
    npcs: ['Master Alchemist Zorn'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  📚📚  🧪⚗️🧪  📚📚  │
      │  🕯️ ═══════════ 🕯️  │
      │  ⚗️  🔮  🧙‍♂️  🔮  ⚗️  │
      │  🧪💀  📜  💀🧪  │
      │  ════════════════════════  │
      └─────────────────────────────┘
    `
  },
  'tavern-rooms': {
    id: 'tavern-rooms',
    name: 'Tavern Upstairs',
    description: 'A narrow hallway leads to several rooms for rent. The floorboards creak ominously.',
    exits: { down: 'tavern' },
    items: ['old key'],
    npcs: ['Sleeping Drunk'],
    pixelArt: `
      ┌─────────────────────────────┐
      │  🚪  🚪  🚪  🚪  │
      │  ═══════════════════════  │
      │  🛏️  🛏️  🛏️  🛏️  │
      │  🕯️      🕯️      │
      │  ════════🪜═══════════  │
      └─────────────────────────────┘
    `
  },
};

// LLM-style narrative generator
const generateNarration = (action: string, player: Player, room: Room, players: Player[]): string => {
  const templates: Record<string, string[]> = {
    look: [
      `${player.name} surveys their surroundings. ${room.description}`,
      `The ${player.class} takes a moment to observe. ${room.description}`,
    ],
    move: [
      `${player.name} ventures forth, their footsteps echoing in the ${room.name}.`,
      `The ${player.class} arrives at ${room.name}. ${room.description.split('.')[0]}.`,
    ],
    attack: [
      `${player.name} readies their weapon, eyes narrowing with determination.`,
      `The ${player.class} enters combat stance, ready to fight!`,
    ],
    take: [
      `${player.name} carefully picks up the item, adding it to their pack.`,
      `With practiced hands, the ${player.class} secures their new treasure.`,
    ],
    drop: [
      `${player.name} sets the item down carefully.`,
      `The ${player.class} discards the item.`,
    ],
    say: [
      `${player.name}'s voice echoes through ${room.name}.`,
      `The ${player.class} speaks to those nearby.`,
    ],
    emote: [
      `${player.name}'s presence fills the room.`,
    ],
  };

  const category = action.split(' ')[0].toLowerCase();
  const options = templates[category] || templates.emote;
  return options[Math.floor(Math.random() * options.length)];
};

const STORAGE_KEY = 'zos-mud-state';
const CHANNEL_NAME = 'zos-mud-channel';

const MUD: React.FC<MUDProps> = ({ onClose }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPixelArt, setShowPixelArt] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [setupName, setSetupName] = useState('');
  const [setupAvatar, setSetupAvatar] = useState('🧙');
  const [setupClass, setSetupClass] = useState('Wizard');
  const [setupColor, setSetupColor] = useState(COLORS[0]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize multiplayer channel
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    
    channelRef.current.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'player-join') {
        setPlayers(prev => {
          if (prev.find(p => p.id === data.player.id)) return prev;
          return [...prev, data.player];
        });
        addMessage({
          type: 'system',
          content: `${data.player.avatar} ${data.player.name} the ${data.player.class} has joined the realm!`,
        });
      } else if (data.type === 'player-leave') {
        setPlayers(prev => prev.filter(p => p.id !== data.playerId));
      } else if (data.type === 'player-move') {
        setPlayers(prev => prev.map(p => 
          p.id === data.playerId ? { ...p, room: data.room } : p
        ));
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'sync-request' && player) {
        channelRef.current?.postMessage({ type: 'player-join', player });
      }
    };

    // Request sync from other tabs
    channelRef.current.postMessage({ type: 'sync-request' });

    return () => {
      if (player) {
        channelRef.current?.postMessage({ type: 'player-leave', playerId: player.id });
      }
      channelRef.current?.close();
    };
  }, [player]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const broadcast = useCallback((msg: Message) => {
    channelRef.current?.postMessage({ type: 'message', message: msg });
  }, []);

  const handleCommand = useCallback((input: string) => {
    if (!player) return;
    
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    const currentRoom = ROOMS[player.room];

    switch (command) {
      case 'look':
      case 'l': {
        const narration = generateNarration('look', player, currentRoom, players);
        const msg = addMessage({ type: 'narration', content: narration, pixelArt: currentRoom.pixelArt });
        broadcast(msg);
        
        if (currentRoom.items.length > 0) {
          addMessage({ type: 'system', content: `You see: ${currentRoom.items.join(', ')}` });
        }
        if (currentRoom.npcs.length > 0) {
          addMessage({ type: 'system', content: `Present: ${currentRoom.npcs.join(', ')}` });
        }
        const playersHere = players.filter(p => p.room === player.room && p.id !== player.id);
        if (playersHere.length > 0) {
          addMessage({ type: 'system', content: `Other adventurers: ${playersHere.map(p => `${p.avatar} ${p.name}`).join(', ')}` });
        }
        const exits = Object.keys(currentRoom.exits).join(', ');
        addMessage({ type: 'system', content: `Exits: ${exits}` });
        break;
      }

      case 'north':
      case 'south':
      case 'east':
      case 'west':
      case 'up':
      case 'down':
      case 'n':
      case 's':
      case 'e':
      case 'w':
      case 'u':
      case 'd': {
        const dirMap: Record<string, string> = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down' };
        const dir = dirMap[command] || command;
        const newRoomId = currentRoom.exits[dir];
        
        if (newRoomId && ROOMS[newRoomId]) {
          const newRoom = ROOMS[newRoomId];
          setPlayer(prev => prev ? { ...prev, room: newRoomId } : null);
          channelRef.current?.postMessage({ type: 'player-move', playerId: player.id, room: newRoomId });
          
          const msg = addMessage({
            type: 'narration',
            content: `${player.avatar} ${player.name} travels ${dir} to ${newRoom.name}.\n\n${newRoom.description}`,
            pixelArt: newRoom.pixelArt,
          });
          broadcast(msg);
        } else {
          addMessage({ type: 'system', content: 'You cannot go that way.' });
        }
        break;
      }

      case 'say':
      case "'": {
        if (args) {
          const msg = addMessage({
            type: 'chat',
            sender: player.name,
            senderColor: player.color,
            content: `${player.avatar} ${player.name} says: "${args}"`,
          });
          broadcast(msg);
        }
        break;
      }

      case 'emote':
      case ':': {
        if (args) {
          const msg = addMessage({
            type: 'action',
            sender: player.name,
            senderColor: player.color,
            content: `* ${player.avatar} ${player.name} ${args}`,
          });
          broadcast(msg);
        }
        break;
      }

      case 'take':
      case 'get': {
        if (args && currentRoom.items.includes(args)) {
          setPlayer(prev => prev ? {
            ...prev,
            inventory: [...prev.inventory, args],
          } : null);
          ROOMS[player.room].items = currentRoom.items.filter(i => i !== args);
          const msg = addMessage({
            type: 'narration',
            content: `${player.avatar} ${player.name} picks up the ${args}.`,
          });
          broadcast(msg);
        } else {
          addMessage({ type: 'system', content: `You don't see that here.` });
        }
        break;
      }

      case 'inventory':
      case 'i': {
        if (player.inventory.length > 0) {
          addMessage({ type: 'system', content: `You are carrying: ${player.inventory.join(', ')}` });
        } else {
          addMessage({ type: 'system', content: 'Your pack is empty.' });
        }
        break;
      }

      case 'who': {
        const allPlayers = [...players];
        if (!allPlayers.find(p => p.id === player.id)) {
          allPlayers.push(player);
        }
        addMessage({
          type: 'system',
          content: `Online adventurers (${allPlayers.length}):\n${allPlayers.map(p => 
            `  ${p.avatar} ${p.name} the ${p.class} (Level ${p.level}) - ${ROOMS[p.room]?.name || 'Unknown'}`
          ).join('\n')}`,
        });
        break;
      }

      case 'stats': {
        addMessage({
          type: 'system',
          content: `${player.avatar} ${player.name} the ${player.class}\nLevel: ${player.level} | XP: ${player.xp}\nHP: ${player.hp}/${player.maxHp}\nInventory: ${player.inventory.length} items`,
        });
        break;
      }

      case 'help':
      case '?': {
        addMessage({
          type: 'system',
          content: `=== MUD Commands ===
Movement: north/n, south/s, east/e, west/w, up/u, down/d
look/l - Look around the room
say/'/message - Say something
emote/:action - Perform an action
take/get item - Pick up an item
inventory/i - Check your pack
who - See online players
stats - View your character
help/? - Show this help`,
        });
        break;
      }

      default:
        addMessage({ type: 'system', content: `Unknown command: ${command}. Type 'help' for commands.` });
    }
  }, [player, players, addMessage, broadcast]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleCommand(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, handleCommand]);

  const createCharacter = useCallback(() => {
    if (!setupName.trim()) return;
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: setupName,
      avatar: setupAvatar,
      class: setupClass,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      inventory: [],
      room: 'town-square',
      color: setupColor,
    };
    
    setPlayer(newPlayer);
    setPlayers(prev => [...prev, newPlayer]);
    setShowSetup(false);
    
    channelRef.current?.postMessage({ type: 'player-join', player: newPlayer });
    
    const startRoom = ROOMS['town-square'];
    addMessage({
      type: 'system',
      content: `Welcome to the realm, ${newPlayer.avatar} ${newPlayer.name} the ${newPlayer.class}!`,
    });
    addMessage({
      type: 'narration',
      content: startRoom.description,
      pixelArt: startRoom.pixelArt,
    });
    addMessage({
      type: 'system',
      content: `Type 'help' for a list of commands.`,
    });
  }, [setupName, setupAvatar, setupClass, setupColor, addMessage]);

  // Character creation screen
  if (showSetup) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900">
        <div className="bg-gray-800/80 backdrop-blur p-8 rounded-xl border border-purple-500/30 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            🏰 Enter the Realm
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Character Name</label>
              <input
                type="text"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setSetupAvatar(avatar)}
                    className={`w-12 h-12 text-2xl rounded-lg transition-all ${
                      setupAvatar === avatar
                        ? 'bg-purple-600 ring-2 ring-purple-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Class</label>
              <div className="grid grid-cols-3 gap-2">
                {CLASS_OPTIONS.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSetupClass(cls)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      setupClass === cls
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSetupColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      setupColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={createCharacter}
              disabled={!setupName.trim()}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                setupName.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Begin Adventure
            </button>
          </div>
          
          <p className="text-center text-gray-500 text-sm mt-4">
            Multiplayer • LLM-powered • Text Adventure
          </p>
        </div>
      </div>
    );
  }

  const currentRoom = player ? ROOMS[player.room] : null;

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🏰</span>
          <div>
            <h1 className="font-bold">MUD</h1>
            <p className="text-xs text-gray-500">{currentRoom?.name || 'Unknown'}</p>
          </div>
        </div>
        
        {player && (
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: player.color }}>{player.avatar} {player.name}</span>
            <span className="text-red-400">❤️ {player.hp}/{player.maxHp}</span>
            <span className="text-yellow-400">⭐ Lvl {player.level}</span>
            <span className="text-gray-500">{players.length + 1} online</span>
          </div>
        )}
        
        <button
          onClick={() => setShowPixelArt(!showPixelArt)}
          className={`px-3 py-1 rounded text-sm ${showPixelArt ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          🎨 Art {showPixelArt ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className="animate-fadeIn">
            {msg.type === 'system' && (
              <div className="text-gray-500 text-sm whitespace-pre-wrap">{msg.content}</div>
            )}
            {msg.type === 'narration' && (
              <div>
                <div className="text-purple-300 italic whitespace-pre-wrap">{msg.content}</div>
                {showPixelArt && msg.pixelArt && (
                  <pre className="text-xs text-green-400/70 mt-2 font-mono leading-tight">{msg.pixelArt}</pre>
                )}
              </div>
            )}
            {msg.type === 'chat' && (
              <div>
                <span style={{ color: msg.senderColor }}>{msg.content}</span>
              </div>
            )}
            {msg.type === 'action' && (
              <div className="text-yellow-400 italic">{msg.content}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <span className="text-purple-400 py-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-gray-100"
            autoFocus
          />
        </div>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MUD;
