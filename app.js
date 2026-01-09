import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";

export const config = {
  api: {
    bodyParser: false, // important! disable parsing so we can use raw body
  },
};

export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  // Verify signature
  if (!verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY)) {
    return res.status(401).send("Invalid request signature");
  }

  const body = JSON.parse(rawBody.toString("utf-8"));

  // PING
  if (body.type === InteractionType.PING) {
    return res.status(200).json({ type: InteractionResponseType.PONG });
  }

  // Slash commands placeholder
  if (body.type === InteractionType.APPLICATION_COMMAND) {
    return res.status(200).json({
      type: 4,
      data: { content: "Hello! Slash commands work." },
    });
  }

  res.status(400).end("Unknown interaction type");
}
