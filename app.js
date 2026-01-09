import express from 'express';
import 'dotenv/config';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';

const app = express();
app.use(express.raw({ type: 'application/json' })); // ⚠️ RAW body required

app.post('/interactions', (req, res) => {
  const signature = req.header('X-Signature-Ed25519');
  const timestamp = req.header('X-Signature-Timestamp');
  const rawBody = req.body;

  try {
    if (!verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY)) {
      throw new Error('Invalid signature');
    }

    const body = JSON.parse(rawBody.toString('utf-8'));

    // PING test
    if (body.type === InteractionType.PING) {
      return res.json({ type: InteractionResponseType.PONG });
    }

    // Placeholder for commands
    return res.json({ type: 4, data: { content: 'Command received!' } });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }
});

export default app;
