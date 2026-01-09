// app.js
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

console.log("PUBLIC_KEY:", process.env.PUBLIC_KEY);

// --------------------
// Verify Discord request middleware
// --------------------
function VerifyDiscordRequestMiddleware(publicKey) {
  return (req, res, next) => {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');
    const rawBody = req.rawBody;

    if (!verifyKey(rawBody, signature, timestamp, publicKey)) {
      return res.status(401).send('Bad request signature');
    }

    next();
  };
}

// --------------------
// Load commands dynamically
// --------------------
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');

async function loadCommands() {
  if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const cmd = await import(`./commands/${file}`);
    commands.set(cmd.command.name, cmd);
  }
  console.log("Loaded commands:", [...commands.keys()]);
}

// --------------------
// Interaction handler
// --------------------
app.post(
  '/interactions',
  express.raw({ type: 'application/json' }), // keep raw bytes
  VerifyDiscordRequestMiddleware(process.env.PUBLIC_KEY),
  async (req, res) => {
    const body = JSON.parse(req.body.toString('utf-8')); // parse after verification
    const { type, data } = body;

    // Ping
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // Slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const cmd = commands.get(data.name);
      if (!cmd) return res.send({ type: 4, data: { content: '❌ Unknown command', flags: 64 } });
      try {
        return cmd.handle(body, (response) => res.send(response));
      } catch (err) {
        console.error('Command error:', err);
        return res.send({ type: 4, data: { content: '❌ Command failed', flags: 64 } });
      }
    }

    // Modal submit (like /report)
    if (type === InteractionType.MODAL_SUBMIT) {
      const cmd = commands.get('report');
      if (cmd) return cmd.handle(body, (response) => res.send(response));
    }

    return res.status(400).send('Unknown interaction type');
  }
);

export default app;
