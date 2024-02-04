import { Client } from "oceanic.js";
import { Job, scheduleJob } from "node-schedule";
import { GuildTempBan } from "@prisma/client";
import { DatabaseService } from "./DatabaseService";
import { GeneralService } from "./GeneralService";

type OngoingTempBan = {
  id: string;
  job: Job;
};

const prisma = DatabaseService.getClient();

export class TempBanService {
  private static ongoingTempBans: Map<string, OngoingTempBan> = new Map();
  private static client: Client;

  static initialize(client: Client) {
    this.client = client;
    this.loadOngoingTempBans();
    this.client.logger.info("TempBanService initialized");
  }

  private static async loadOngoingTempBans() {
    const tempBans = await prisma.guildTempBan.findMany();

    const now = Date.now();

    for (const tempBan of tempBans) {
      if (tempBan.expiresAt.getTime() < now) {
        await this.endTempBan(tempBan);
      } else {
        this.addToOngoingTempBans(tempBan);
      }
    }
  }

  static addToOngoingTempBans(tempBan: GuildTempBan) {
    this.ongoingTempBans.set(tempBan.id, {
      id: tempBan.id,
      job: scheduleJob(tempBan.expiresAt, async () => {
        await this.endTempBan(tempBan);
      }),
    });
  }

  private static async endTempBan(tempBan: GuildTempBan) {
    try {
      const guild = this.client.guilds.get(tempBan.guildID);
      if (!guild) return;

      await guild.removeBan(tempBan.userID).catch((e) => {
        this.client.logger.error(e);
      });

      await prisma.guildTempBan.delete({
        where: {
          id: tempBan.id,
        },
      });

      const generalPanel = await prisma.guildGeneralPanel.findUnique({
        where: {
          guildID: tempBan.guildID,
        },
      });

      if (!generalPanel) {
        this.client.logger.error(
          `Guild ${tempBan.guildID} does not have a general panel`
        );
        return;
      }

      await this.client.rest.channels.createMessage(generalPanel.logChannelID, {
        embeds: [
          {
            color: GeneralService.getDefaultColor(guild.id),
            title: "Log Entry: Member Temporary Ban Ended",
            fields: [
              {
                name: "Member",
                value: `${tempBan.username} (${tempBan.userID})`,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      this.client.logger.error(e);
    } finally {
      this.ongoingTempBans.delete(tempBan.id);
    }
  }
}
