import { Intents } from "oceanic.js";
import { CustomClient } from "./helpers/CustomClient";
import { getBotConfig } from "./util/config.util";
import { setGlobalDispatcher, Agent } from "undici";

setGlobalDispatcher(new Agent({ connect: { timeout: 20_000 } }));

const config = getBotConfig();

async function initializeBot() {
  const client = new CustomClient({
    auth: `Bot ${config["TOKEN"]}`,
    gateway: {
      intents:
        Intents.GUILDS | Intents.MESSAGE_CONTENT | Intents.GUILD_MESSAGES,
    },
    allowedMentions: {
      roles: true,
      users: true,
      everyone: true,
      repliedUser: true,
    },
  });

  await client.connect();
}

initializeBot();
