import fetch from 'node-fetch';

export const command = {
  name: 'view',
  description: 'View full Discord user info using the Discord Lookup API',
  type: 1,
  options: [
    {
      name: 'userid',
      description: 'Discord User ID or mention',
      type: 3,
      required: true,
    },
  ],
};

const BADGE_EMOJIS = {
  HOUSE_BRAVERY: '<:house_bravery:1458968579797024838>',
  HOUSE_BRILLIANCE: '<:house_brilliance:1458968591511851211>',
  HOUSE_BALANCE: '<:house_ballance:1458968566442229925>',
  EARLY_VERIFIED_BOT_DEVELOPER: '<:early_verified_bot_developer:1458968554077552901>',
  VERIFIED_BOT: '<:bot_developer:1458968498150834362>',
  BUG_HUNTER_LEVEL_1: '<:bug_hunter_level_1:1458968515833757879>',
  BUG_HUNTER_LEVEL_2: '<:bug_hunter_level_2:1458968528618262670>',
  BUG_HUNTER_LEVEL_3: '<:bug_hunter_level_3:1458968542946001019>',
  PREMIUM_EARLY_SUPPORTER: '<:premium_early_supporter:1458968615796867153>',
  STAFF: '<:staff:1458968627721142415>',
  PARTNER: '<:partner:1458969093041422544>',
  NITRO: '<:nitro:1458973461635666071>',
};

export async function handle(interaction, respond) {
  let input = interaction.data?.options?.[0]?.value;
  if (!input) {
    return respond({
      type: 4,
      data: { content: 'Please provide a Discord user ID or mention.', flags: 64 },
    });
  }

  // Handle mentions
  const mentionMatch = input.match(/^<@!?(\d+)>$/);
  const userId = mentionMatch ? mentionMatch[1] : input;

  let userData;
  try {
    const res = await fetch(`https://discord-lookup-api-omega.vercel.app/v1/user/${userId}`);
    if (!res.ok) throw new Error('User not found');
    userData = await res.json();
  } catch (err) {
    return respond({
      type: 4,
      data: { content: 'User not found or API error.', flags: 64 },
    });
  }

  const raw = userData.raw || {};

  // Strip #0 from usernames
  const discriminator = raw.discriminator && raw.discriminator !== '0' ? `#${raw.discriminator}` : '';
  const displayUsername = `${userData.username ?? 'Unknown'}${discriminator}`;

  // Avatar & Banner
  const avatarUrl = userData.avatar?.link || `https://cdn.discordapp.com/embed/avatars/${raw.discriminator % 5}.png`;
  const bannerUrl = userData.banner?.link || null;
  const avatarDecoUrl = userData.avatar_decoration?.link || null;

  // Account creation
  const createdAt = userData.created_at
    ? `<t:${Math.floor(new Date(userData.created_at).getTime() / 1000)}:F>`
    : 'Unknown';

  // Map badges to emojis
  let badgesArray = userData.badges?.map(b => BADGE_EMOJIS[b] || `❓${b}`) || [];

  // Add Nitro if the user has it
  const premiumType = raw?.premium_type || 0;
  if (premiumType > 0) badgesArray.push(BADGE_EMOJIS.NITRO);

  const badges = badgesArray.length > 0 ? badgesArray.join(' ') : 'None';

  // Show user ID as (@username) ID
  const idField = `(<@${userData.id}>) ${userData.id}`;

  const fields = [
    { name: 'Username', value: displayUsername, inline: true },
    { name: 'Global Name', value: userData.global_name || 'None', inline: true },
    { name: 'User ID', value: idField, inline: true },
    { name: 'Account Created', value: createdAt, inline: false },
    { name: 'Accent Color', value: userData.accent_color ? `#${userData.accent_color.toString(16)}` : 'None', inline: true },
    { name: 'Banner Color', value: userData.banner_color || 'None', inline: true },
    { name: 'Badges', value: badges, inline: false },
  ];

  if (userData.clan) {
    fields.push(
      { name: 'Clan Tag', value: userData.clan.tag ?? 'None', inline: true },
      { name: 'Clan Badge', value: userData.clan.badge ?? 'None', inline: true },
    );
  }

  if (userData.collectibles?.nameplate) {
    fields.push(
      { name: 'Collectible Nameplate', value: userData.collectibles.nameplate.label ?? 'None', inline: false }
    );
  }

  if (userData.display_name_styles) {
    fields.push(
      { name: 'Display Name Style', value: `Font: ${userData.display_name_styles.font_id}, Effect: ${userData.display_name_styles.effect_id}`, inline: false }
    );
  }

  return respond({
    type: 4,
    data: {
      embeds: [
        {
          title: `${userData.username ?? 'Unknown'} (${userData.global_name ?? 'No global name'})`,
          color: userData.accent_color || 0x000000,
          thumbnail: { url: avatarUrl },
          image: bannerUrl ? { url: bannerUrl } : undefined,
          fields,
        },
      ],
    },
  });
}