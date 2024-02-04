import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import { GuildLogService } from "../../service/GuildLogService";
import { checkModPermission } from "../../util/permission.util";
import { canMemberBeHandled } from "../../util/member.util";

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
  const dm = interaction.data.options.getString("dm", false);

  if (interactionMember.id === member.id) {
    return interaction.editOriginal(
      interaction.getErrorReply("You can't kick yourself!")
    );
  }

  if (!canMemberBeHandled(member, guild, client)) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Bot doesn't have permission to kick this member!"
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
            ? `You have been kicked for the following reason: ${reason}`
            : `You have been kicked from ${guild.name}!`,
        },
      ],
    });
  } catch {}

  await member.kick(reason);

  await GuildLogService.postLog({
    guildID: guild.id,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Log Entry: Member Kick",
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
      `Member **${member.user.username}#${member.user.discriminator}** has been kicked.`
    )
  );
}

export = {
  execute,
  options: {
    name: "kick",
    description: "Kick a member from this server",
    options: [
      {
        name: "member",
        description: "Member to kick",
        type: Constants.ApplicationCommandOptionTypes.USER,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for kick",
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
