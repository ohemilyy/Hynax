import { Message, User } from "oceanic.js";
import { DatabaseService } from "./DatabaseService";
import { GuildWordBlacklist, GuildWordBlacklistPanel } from "@prisma/client";
import { GuildLogService } from "./GuildLogService";
import { GeneralService } from "./GeneralService";
import { getReadableDuration } from "../util/common.util";

const prisma = DatabaseService.getClient();

export class WordBlacklistService {
  static async checkMessage(message: Message) {
    if (!message.guildID) return;

    const panel = await prisma.guildWordBlacklistPanel.findUnique({
      where: {
        guildID: message.guildID,
      },
    });

    if (!panel) {
      message.client.logger.warn(
        `No word blacklist panel found for guild ${message.guildID}`
      );
      return;
    }

    const blacklist = await prisma.guildWordBlacklist.findMany({
      where: {
        guildID: message.guildID,
      },
    });

    for (const bw of blacklist) {
      // regex to only match whole words
      const regex = new RegExp(`\\b${bw.word}\\b`, "gi");

      if (regex.test(message.content)) {
        await this.issuePunishment(message, bw, panel);
        break;
      }
    }
  }

  private static async issuePunishment(
    message: Message,
    blacklistWord: GuildWordBlacklist,
    panel: GuildWordBlacklistPanel
  ) {
    const timeoutDuration =
      (blacklistWord.type === "major"
        ? panel.majorTimeoutSeconds
        : panel.minorTimeoutSeconds) * 1000;

    if (timeoutDuration === 0) return;

    const member = await message.guild?.getMember(message.author.id);
    if (!member) return;

    await message.delete();

    await message.channel?.createMessage({
      embeds: [
        {
          color: GeneralService.getErrorColor(member.guildID),
          description: `Sorry. Word **"${blacklistWord.word}"** is not allowed in this server.`,
        },
      ],
    });

    let timeoutSuccess = true;
    try {
      await member.edit({
        communicationDisabledUntil: new Date(
          Date.now() + timeoutDuration
        ).toISOString(),
      });
    } catch (e: any) {
      timeoutSuccess = false;
      message.client.logger.error(e?.toString());
    }

    await GuildLogService.postLog({
      guildID: member.guildID,
      content: {
        embeds: [
          {
            color: GeneralService.getDefaultColor(member.guildID),
            title:
              "Log Entry: Word Blacklist Punishment" +
              (timeoutSuccess ? "" : " (Failed)"),
            fields: [
              {
                name: "Member",
                value: `${member.username} (${member.id})`,
              },
              {
                name: "Reason",
                value: `Word Blacklist Violation: ${blacklistWord.word} (${blacklistWord.type})`,
              },
              {
                name: "Timeout Duration",
                value: getReadableDuration(timeoutDuration / 1000),
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }
}
