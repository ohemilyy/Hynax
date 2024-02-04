import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import { GuildLogService } from "../../service/GuildLogService";
import { getMilliseconds } from "../../util/common.util";
import { canMemberBeHandled } from "../../util/member.util";
import { checkModPermission } from "../../util/permission.util";

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

  if (!interactionMember) {
    return interaction.editOriginal(
      interaction.getErrorReply("Failed to locate the interaction member.")
    );
  }

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
  const dm = interaction.data.options.getString("dm", false);

  if (interactionMember.id === member.id) {
    return interaction.editOriginal(
      interaction.getErrorReply("You can't timeout yourself!")
    );
  }

  if (
    member.communicationDisabledUntil &&
    member.communicationDisabledUntil >= new Date()
  ) {
    return await interaction.createFollowup(
      interaction.getErrorReply("This member is already timed out.")
    );
  }

  if (!canMemberBeHandled(member, guild, client)) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Bot doesn't have permission to timeout this member!"
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
          description: reason
            ? `You have been timed out for the following reason: ${reason}`
            : `You have been timed out from ${guild.name}!`,
        },
      ],
    });
  } catch {}

  const communicationDisabledUntil = new Date(
    new Date().getTime() + getMilliseconds(duration, unit)
  );

  await guild.editMember(member.id, {
    communicationDisabledUntil: communicationDisabledUntil.toISOString(),
    reason,
  });

  await GuildLogService.postLog({
    guildID: guild.id,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Log Entry: Member Timeout",
          fields: [
            {
              name: "Member",
              value: `${member.username} (${member.id})`,
            },
            {
              name: "Duration",
              value: `${duration}${unit}`,
            },
            {
              name: "Reason",
              value: reason,
            },
            {
              name: "Executed By",
              value: `${interactionMember.username} (${interactionMember.id})`,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });

  await interaction.editOriginal(
    interaction.getSuccessReply(
      `Member **${member.user.username}#${member.user.discriminator}** has been timed out for ${duration}${unit}.`
    )
  );
}

export = {
  execute,
  options: {
    name: "timeout",
    description: "Timeout a member for a specific amount of time",
    options: [
      {
        name: "member",
        description: "member to mute",
        type: Constants.ApplicationCommandOptionTypes.USER,
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
        name: "reason",
        description: "Reason for mute",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
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
