// app.js
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DiscordRequest } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();
console.log("PUBLIC_KEY:", process.env.PUBLIC_KEY);

// --------------------
// Verify Discord request
// --------------------
function VerifyDiscordRequestMiddleware(publicKey) {
  return (req, res, next) => {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');
    const rawBody = req.body;

    if (!verifyKey(rawBody, signature, timestamp, publicKey)) {
      return res.status(401).send('Bad request signature');
    }

    next();
  };
}

// --------------------
// Load commands from folder
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
// Roblox Profile helper
// --------------------
async function getRobloxProfile(username, retries = 3, delayMs = 1000) {
  username = username.trim();
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'DiscordBot (v1.0)' }
    });

    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, delayMs));
      return getRobloxProfile(username, retries - 1, delayMs * 2);
    }

    if (!res.ok) return { error: `Roblox API returned ${res.status}` };

    const data = await res.json();
    if (!data.data?.length) return { error: `No user found for "${username}"` };
    const user = data.data[0];
    return { id: user.id, name: user.name, displayName: user.displayName };

  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delayMs));
      return getRobloxProfile(username, retries - 1, delayMs * 2);
    }
    return { error: 'Failed to fetch Roblox profile.' };
  }
}


app.post(
  '/interactions',
  express.raw({ type: 'application/json' }),
  VerifyDiscordRequestMiddleware(process.env.PUBLIC_KEY),
  async (req, res) => {
    const body = JSON.parse(req.body.toString('utf-8'));
    const { type, data } = body;

    // PING
    if (type === InteractionType.PING) return res.send({ type: InteractionResponseType.PONG });

    // MODAL SUBMIT (like /report)
    if (type === InteractionType.MODAL_SUBMIT) {
      if (data.custom_id === 'report_modal') {
        const robloxId = data.components[0].components[0].value;
        const reason = data.components[1].components[0].value;
        const proof = data.components[2].components[0].value;

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: 'Retard Report',
                color: 0x000000, // black
                fields: [
                  { name: 'Retard ID', value: robloxId, inline: true },
                  { name: 'Reason', value: reason, inline: false },
                  { name: 'Proof', value: proof, inline: false },
                ],
              },
            ],
            flags: 0,
          },
        });
      }
    }

    // Slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const cmd = commands.get(data.name);
      if (!cmd) return res.send({ type: 4, data: { content: '❌ Unknown command' } });

      return cmd.handle(body, (response) => res.send(response), DiscordRequest, getRobloxProfile);
    }

    return res.status(400).send('Unknown interaction type');
  }
);

export default app;
