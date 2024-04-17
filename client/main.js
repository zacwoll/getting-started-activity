import { DiscordSDK, Events } from '@discord/embedded-app-sdk';

import './style.css'
import rocketLogo from '/rocket.png'

let auth;
let participants = new Map();
let activityChannelId;

// Instantiate the SDK
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID)

setupDiscordSdk().then(() => {
  appendVoiceChannelName();
  appendGuildAvatar();
  discordSdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, debounce(updateParticipants, 1));
  discordSdk.subscribe(Events.SPEAKING_START, startSpeaking, { channel_id: discordSdk.channelId });
  discordSdk.subscribe(Events.SPEAKING_STOP, stopSpeaking, { channel_id: discordSdk.channelId });
})

function startSpeaking(data) {
  console.log({data});
  // Show speaker
  const speaker = participants.get(data.user_id);
  console.log(speaker.global_name);
  
  const speakingId = `speaking-${speaker.global_name}`;
  const textTagString = `${speaker.global_name} is speaking`;
  const textTag = document.createElement('p');
  textTag.id = speakingId;
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

function stopSpeaking(data) {
  const speaker = participants.get(data.user_id);

  const speakingId = `speaking-${speaker.global_name}`;
  const speakingElement = document.getElementById(speakingId);
  if (speakingElement) {
      speakingElement.remove();
  }
}

// Debounce used to guard against ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE firing twice
// Function to debounce event handling
function debounce(callback, delay) {
    let timeoutId;
    return function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback.apply(this, arguments);
        }, delay);
    };
}

// { participants: [] }
function updateParticipants(data) {
  if (participants.size !== data.participants.length) {
    participants.forEach(({id, participant}) => !data.participants.includes(participant) ? participant.delete(id) : null)
    
    data.participants.forEach(participant => {
      if (!participants.has(participant.id)) {
        participants.set(participant.id, participant)
        const textTagString = `New Participant: ${participant.global_name}`;
        const textTag = document.createElement('p');
        textTag.textContent = textTagString;
        app.appendChild(textTag);
      }
    })
  }

  // log all participants
  // participants.forEach(pants => console.log(JSON.stringify(pants, null, 2)));
}

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord is ready");

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      // "identify",
      // "guilds",
      // "rpc.voice.read",

      // "applications.builds.upload",
      // "applications.builds.read",
      // "applications.store.update",
      // "applications.entitlements",
      // "bot",
      "identify",
      // "connections",
      // "email",
      // "gdm.join",
      "guilds",
      // "guilds.join",
      // "guilds.members.read",
      // "messages.read",
      // "relationships.read",
      'rpc.activities.write',
      "rpc.notifications.read",
      "rpc.voice.write",
      "rpc.voice.read",
      // "webhook.incoming",
    ],
  });


  // Retrieve an access_token from your activity's server
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

    // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

async function appendVoiceChannelName() {
  const app = document.querySelector('#app');

  let activityChannelName = 'Unknown';

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

async function appendGuildAvatar() {
  const app = document.querySelector('#app');

  // 1. From the HTTP API fetch a list of all of the user's guilds
  const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
    headers: {
      // NOTE: we're using the access_token provided by the "authenticate" command
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  // 3. Append to the UI an img tag with the related information
  if (currentGuild != null) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute(
      'src',
      // More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
      `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
    );
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
  }
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" alt="Discord" />
    <h1>Hello, World!</h1>
  </div>
`;