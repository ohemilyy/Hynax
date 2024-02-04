import { Message } from "oceanic.js";
import { DatabaseService } from "./DatabaseService";
import { GuildUrlIpWhitelistPanel } from "@prisma/client";
import { GuildLogService } from "./GuildLogService";
import { GeneralService } from "./GeneralService";
import { getReadableDuration } from "../util/common.util";
import { IPV4_REGEX, URL_REGEX } from "../constants";

const prisma = DatabaseService.getClient();

export class UrlIpWhitelistService {
  static async checkMessage(message: Message) {
    if (!message.guildID) return;

    if (
      !URL_REGEX().test(message.content) &&
      !IPV4_REGEX().test(message.content)
    ) {
      return;
    }

    const urls = Array.from(
      new Set([...message.content.matchAll(URL_REGEX())].flat())
    );

    const ips = Array.from(
      new Set([...message.content.matchAll(IPV4_REGEX())].flat())
    );

    const panel = await prisma.guildUrlIpWhitelistPanel.findUnique({
      where: {
        guildID: message.guildID,
      },
    });

    if (!panel) {
      message.client.logger.warn(
        `No url/ip whitelist panel found for guild ${message.guildID}`
      );
      return;
    }

    const whitelist = await prisma.guildUrlIpWhitelist.findMany({
      where: {
        guildID: message.guildID,
      },
    });

    const allowedUrls = whitelist
      .filter((i) => i.type === "url")
      .map((i) => i.entry);

    const allowedIps = whitelist
      .filter((i) => i.type === "ip")
      .map((i) => i.entry);

    for (const url of urls) {
      if (
        !allowedUrls.includes(url) &&
        !allowedUrls.find((i) => url.includes(i))
      ) {
        await this.issuePunishment(message, url, "url", panel);
        break;
      }
    }

    for (const ip of ips) {
      if (!allowedIps.includes(ip)) {
        await this.issuePunishment(message, ip, "ip", panel);
        break;
      }
    }
  }

  private static async issuePunishment(
    message: Message,
    entry: string,
    type: "url" | "ip",
    panel: GuildUrlIpWhitelistPanel
  ) {
    const timeoutDuration = panel.timeoutSeconds * 1000;
    if (timeoutDuration === 0) return;

    const member = await message.guild?.getMember(message.author.id);
    if (!member) return;

    await message.delete();

    await message.channel?.createMessage({
      embeds: [
        {
          color: GeneralService.getErrorColor(member.guildID),
          description: `Sorry. This ${type} is not allowed in this server.`,
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
              "Log Entry: IP/URL Whitelist Punishment" +
              (timeoutSuccess ? "" : " (Failed)"),
            fields: [
              {
                name: "Member",
                value: `${member.username} (${member.id})`,
              },
              {
                name: "Reason",
                value: `Non Whitelisted ${type}: \`${entry}\``,
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
