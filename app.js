import express from 'express';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import 'dotenv/config';

const app = express();

// Use raw body parser
app.use(express.raw({ type: 'application/json' }));

// Middleware to verify Discord request
function verifyDiscordRequest(publicKey) {
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

// Interaction endpoint
app.post('/interactions', verifyDiscordRequest(process.env.PUBLIC_KEY), (req, res) => {
  const body = JSON.parse(req.body.toString('utf-8'));

  // Respond to PING
  if (body.type === InteractionType.PING) {
    return res.json({ type: InteractionResponseType.PONG });
  }

  res.json({ type: 4, data: { content: 'Slash commands are not yet loaded!' } });
});

// Export app (Vercel serverless)
export default app;
