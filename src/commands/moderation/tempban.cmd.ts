import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import { GuildLogService } from "../../service/GuildLogService";
import { checkModPermission } from "../../util/permission.util";
import { canMemberBeHandled } from "../../util/member.util";
import { getMilliseconds } from "../../util/common.util";
import { DatabaseService } from "../../service/DatabaseService";
import { TempBanService } from "../../service/TempBanService";

const prisma = DatabaseService.getClient();

async function execute(interaction: CommandInteraction, client: Client) {
  await interaction.defer(64);

  if (!interaction.guildID || !interaction.member) {
    return interaction.editOriginal(
      interaction.getErrorReply("This command can only be used inside servers.")
    );
  }

  const guild = client.guilds.get(interaction.guildID);

  if (!guild) {
    return interaction.editOriginal(
      interaction.getErrorReply("Failed to locate the Discord server.")
    );
  }

  const interactionMember = interaction.member;

  const hasPermission = await checkModPermission(interaction.member);

  if (!hasPermission) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "You don't have permission to run this command!"
      )
    );
  }

  const member = interaction.data.options.getMember("member", true);
  const reason = interaction.data.options.getString("reason", true);
  const duration = interaction.data.options.getInteger("duration", true);
  const unit = interaction.data.options.getString("unit", true);
  const millis = getMilliseconds(duration, unit);
  const dm = interaction.data.options.getString("dm", false);

  if (interactionMember.id === member.id) {
    return interaction.editOriginal(
      interaction.getErrorReply("You can't ban yourself!")
    );
  }

  if (!canMemberBeHandled(member, guild, client)) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Bot doesn't have permission to ban this member!"
      )
    );
  }

  try {
    const dmChannel = await client.rest.channels.createDM(member.id);
    await dmChannel.createMessage({
      content: dm,
      embeds: [
        {
          color: interaction.colors.error,
          description: `You have been banned from **${guild.name}** for **${duration}${unit}**.`,
          fields: [
            {
              name: "Reason",
              value: reason,
            },
          ],
        },
      ],
    });
  } catch {}

  await guild.createBan(member.id, { reason });

  const tempBan = await prisma.guildTempBan.create({
    data: {
      guildID: guild.id,
      userID: member.id,
      expiresAt: new Date(Date.now() + millis),
      username: member.username,
    },
  });

  TempBanService.addToOngoingTempBans(tempBan);

  await GuildLogService.postLog({
    guildID: guild.id,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Log Entry: Member Temporarily Banned",
          fields: [
            {
              name: "Member",
              value: `${member.username} (${member.id})`,
            },
            {
              name: "Reason",
              value: reason,
            },
            {
              name: "Duration",
              value: `${duration}${unit}`,
            },
            {
              name: "Executed By",
              value: `<@${interactionMember.id}>`,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });

  await interaction.editOriginal(
    interaction.getSuccessReply(
      `Member **${member.user.username}#${member.user.discriminator}** has been banned.`
    )
  );
}

export = {
  execute,
  options: {
    name: "tempban",
    description: "Temporarily ban a member from the server.",
    options: [
      {
        name: "member",
        description: "Member to ban",
        type: Constants.ApplicationCommandOptionTypes.USER,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for ban",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
      },
      {
        name: "duration",
        description: "Duration for mute",
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
        required: true,
      },
      {
        name: "unit",
        description: "Time unit of duration",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: [
          { name: "Seconds", value: "s" },
          { name: "Minutes", value: "m" },
          { name: "Hours", value: "h" },
          { name: "Days", value: "d" },
          { name: "Weeks", value: "w" },
        ],
      },
      {
        name: "dm",
        description: "Send a DM to the user",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: false,
      },
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
