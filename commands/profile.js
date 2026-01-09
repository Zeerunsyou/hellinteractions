import fetch from 'node-fetch';

export const command = {
  name: 'profile',
  description: 'Lookup a Roblox Profile by Username',
  type: 1,
  options: [
    {
      name: 'username',
      description: 'The Roblox username to look up',
      type: 3, // STRING
      required: true,
    },
  ],
};

export async function handle(interaction, respond, DiscordRequest, getRobloxProfile) {
  const username = interaction.data?.options?.[0]?.value;
  if (!username) {
    return respond({
      type: 4,
      data: { content: 'Please provide a username.', flags: 64 },
    });
  }

  // 1️⃣ Fetch user from search API
  const profile = await getRobloxProfile(username);
  if (profile.error) {
    return respond({
      type: 4,
      data: { content: profile.error, flags: 64 },
    });
  }

  // 2️⃣ Fetch additional info from user ID API
  let userDetails = null;
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${profile.id}`);
    if (res.ok) {
      userDetails = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch extra user info:', err);
  }

  // 3️⃣ Fetch avatar from Thumbnails API
  let avatarUrl = null;
  try {
    const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${profile.id}&size=150x150&format=Png&isCircular=false`);
    const avatarData = await avatarRes.json();
    avatarUrl = avatarData.data?.[0]?.imageUrl ?? null;
  } catch {}

  // 4️⃣ Send response
  return respond({
    type: 4,
    data: {
      embeds: [
        {
          title: `${profile.name}'s Info`,
          description: `**Username:** [${profile.name}](https://www.roblox.com/users/${profile.id}/profile)
**Display Name:** ${profile.displayName}
**Roblox ID:** ${profile.id}
**Description:** ${userDetails?.description || 'No description available'}
`,
          color: 0x000000,
          image: avatarUrl ? { url: avatarUrl } : undefined,
          fields: userDetails
            ? [
                { name: 'Created', value: new Date(userDetails.created).toDateString(), inline: true },
                { name: 'Banned', value: userDetails.isBanned ? '✅' : '❌', inline: true },
              ]
            : [],
        },
      ],
    },
  });
}
