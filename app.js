// app.js
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Use raw body parser (required for Discord signature verification)
app.use(express.raw({ type: 'application/json' }));

console.log("PUBLIC_KEY:", process.env.PUBLIC_KEY);

// --------------------
// Verify Discord request middleware
// --------------------
function VerifyDiscordRequestMiddleware(publicKey) {
  return (req, res, next) => {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');
    const rawBody = req.body;

    if (!verifyKey(rawBody, signature, timestamp, publicKey)) {
      return res.status(401).send('Invalid request signature');
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
  // console.log("Loaded commands:", [...commands.keys()]);
}

// --------------------
// Interaction endpoint
// --------------------
app.post(
  '/interactions',
  VerifyDiscordRequestMiddleware(process.env.PUBLIC_KEY),
  async (req, res) => {
    // Load commands
    await loadCommands();

    const body = JSON.parse(req.body.toString('utf-8'));
    const { type, data } = body;

    // -------------------- PING (Discord verification) --------------------
    if (type === InteractionType.PING) {
      return res.json({ type: InteractionResponseType.PONG });
    }

    // -------------------- Slash commands --------------------
    if (type === InteractionType.APPLICATION_COMMAND) {
      const cmd = commands.get(data.name);
      if (!cmd) {
        return res.json({
          type: 4,
          data: { content: '❌ Unknown command', flags: 64 }
        });
      }

      try {
        return cmd.handle(body, (response) => res.json(response));
      } catch (err) {
        console.error('Command error:', err);
        return res.json({
          type: 4,
          data: { content: '❌ Command failed', flags: 64 }
        });
      }
    }

    // -------------------- Modal submit (like /report) --------------------
    if (type === InteractionType.MODAL_SUBMIT) {
      const cmd = commands.get('report'); // only report uses modal
      if (cmd) return cmd.handle(body, (response) => res.json(response));
    }

    return res.status(400).send('Unknown interaction type');
  }
);

// --------------------
// Optional GET for testing in browser
// --------------------
app.get('/interactions', (req, res) => {
  res.send('Discord interactions endpoint is live. POST requests only!');
});

// --------------------
// Export app for Vercel
// --------------------
export default app;
