import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import express from 'express';

const app = express();

// Use raw body for signature verification
app.use(express.raw({ type: 'application/json' }));

// Discord verification middleware
function verifyDiscordRequest(publicKey) {
  return (req, res, next) => {
    const signature = req.header('X-Signature-Ed25519');
    const timestamp = req.header('X-Signature-Timestamp');
    const rawBody = req.body;

    try {
      if (!verifyKey(rawBody, signature, timestamp, publicKey)) {
        throw new Error('Invalid request signature');
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid request signature' });
    }
  };
}

// POST endpoint
app.post(
  '/interactions',
  verifyDiscordRequest(process.env.PUBLIC_KEY),
  (req, res) => {
    const body = JSON.parse(req.body.toString('utf-8'));

    // Respond to PING like Python example
    if (body.type === InteractionType.PING) {
      return res.json({ type: InteractionResponseType.PONG });
    }

    // Handle other interactions (commands/modals)
    return res.json({ type: 4, data: { content: 'Command received!' } });
  }
);

export default app;
