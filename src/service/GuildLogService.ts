import { CreateMessageOptions, File, Client } from "oceanic.js";
import { DatabaseService } from "./DatabaseService";

const prisma = DatabaseService.getClient();

type PostLogParams = {
  guildID: string;
  content: CreateMessageOptions;
  files?: File[];
  channelID?: string;
};

export class GuildLogService {
  private static client: Client;

  static initialize(client: Client) {
    this.client = client;
  }

  static async postLog({ guildID, channelID, content, files }: PostLogParams) {
    if (!channelID) {
      const generalPanel = await prisma.guildGeneralPanel.findUnique({
        where: {
          guildID,
        },
      });

      if (!generalPanel) {
        this.client.logger.error(
          `Guild ${guildID} does not have a general panel`
        );
        return;
      }

      channelID = generalPanel.logChannelID;
    }

    await this.client.rest.channels
      .createMessage(channelID, { ...content, files })
      .catch((e) => {
        this.client.logger.error(e);
      });
  }
}
