// app.js
import 'dotenv/config';
import express from 'express';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiscordRequest } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --------------------
// Raw body for verification
// --------------------
app.use(
  '/interactions',
  express.raw({ type: 'application/json' })
);

// --------------------
// Middleware to verify Discord signature
// --------------------
app.use('/interactions', (req, res, next) => {
  const signature = req.header('X-Signature-Ed25519');
  const timestamp = req.header('X-Signature-Timestamp');
  const rawBody = req.body;

  if (!verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY)) {
    return res.status(401).send('Bad request signature');
  }
  next();
});

// --------------------
// Load commands dynamically
// --------------------
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  commands.set(cmd.command.name, cmd);
}
console.log("Loaded commands:", [...commands.keys()]);

// --------------------
// POST /interactions
// --------------------
app.post('/interactions', async (req, res) => {
  let body;
  try {
    body = JSON.parse(req.body.toString('utf-8'));
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const { type, data } = body;

  // PING
  if (type === InteractionType.PING) {
    return res.status(200).json({ type: InteractionResponseType.PONG });
  }

  // MODAL SUBMIT
  if (type === InteractionType.MODAL_SUBMIT) {
    const cmd = commands.get(data.custom_id.split('_')[0]);
    if (!cmd) return res.status(400).send('Unknown modal');

    return cmd.handle(body, (response) => res.send(response), DiscordRequest);
  }

  // Slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {
    const cmd = commands.get(data.name);
    if (!cmd) return res.send({ type: 4, data: { content: '❌ Unknown command' } });

    return cmd.handle(body, (response) => res.send(response), DiscordRequest);
  }

  return res.status(400).send('Unknown interaction type');
});

// ✅ Export for Vercel
export default app;
