import { Message, Client } from "oceanic.js";
import { WordBlacklistService } from "../service/WordBlacklistService";
import { UrlIpWhitelistService } from "../service/UrlIpWhitelistService";

async function execute(message: Message, client: Client) {
  await WordBlacklistService.checkMessage(message).catch((e) => {
    client.logger.error(e);
  });

  await UrlIpWhitelistService.checkMessage(message).catch((e) => {
    client.logger.error(e);
  });
}

export = {
  name: "messageCreate",
  once: false,
  execute,
};
