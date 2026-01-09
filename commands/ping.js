export const command = {
  name: "ping",
  description: "Replies with Pong!",
  type: 1,
  integration_types: [1], // DMs + servers
  contexts: [0, 1, 2],
};

export async function handle(interaction, respond) {
  return respond({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      embeds: [
        {
          description: "Pong!",
          color: 0x63666A,
        },
      ],
    },
  });
}
