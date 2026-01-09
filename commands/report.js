// commands/report.js

export const command = {
  name: "report",
  description: "Submit an exploiter report",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2]
};

export async function handle(interaction, respond) {
  return respond({
    type: 9, // MODAL
    data: {
      custom_id: "report_modal",
      title: "Exploiter Report",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "roblox_id",
              style: 1,
              label: "Roblox ID",
              placeholder: "Example: 123456789",
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "reason",
              style: 2,
              label: "Reason",
              placeholder: "Explain what happened...",
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "proof",
              style: 1,
              label: "Proof Link",
              placeholder: "Screenshot / video link",
              required: true
            }
          ]
        }
      ]
    }
  });
}
