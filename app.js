import express from 'express';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import 'dotenv/config';

const app = express();

// Vercel requires the raw body for signature verification
app.use(
  '/interactions',
  express.raw({ type: 'application/json' })
);

// Middleware to verify Discord request
function verifyDiscordRequest(publicKey) {
  return (req, res, next) => {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

    if (!verifyKey(req.body, signature, timestamp, publicKey)) {
      return res.status(401).send('Invalid request signature');
    }
    next();
  };
}

// Interaction endpoint
app.post('/interactions', verifyDiscordRequest(process.env.PUBLIC_KEY), (req, res) => {
  const body = JSON.parse(req.body.toString('utf-8'));

  // Respond to Discord PING
  if (body.type === InteractionType.PING) {
    return res.json({ type: InteractionResponseType.PONG });
  }

  // Slash commands placeholder
  if (body.type === InteractionType.APPLICATION_COMMAND) {
    return res.json({
      type: 4,
      data: { content: 'Slash commands will work once loaded.' },
    });
  }

  res.status(400).send('Unknown interaction type');
});

export default app;
