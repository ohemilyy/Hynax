import { Client } from "oceanic.js";
import { GeneralService } from "../service/GeneralService";
import { GuildLogService } from "../service/GuildLogService";
import { TempBanService } from "../service/TempBanService";

async function execute(client: Client) {
  await GeneralService.initialize().catch((e) => {
    client.logger.error(e);
  });

  GuildLogService.initialize(client);

  TempBanService.initialize(client);
}

export = {
  name: "ready",
  once: true,
  execute,
};
