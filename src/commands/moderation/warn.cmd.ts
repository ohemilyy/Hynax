import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import { GuildLogService } from "../../service/GuildLogService";
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

  if (interactionMember.id === member.id) {
    return interaction.editOriginal(
      interaction.getErrorReply("You can't warn yourself!")
    );
  }

  if (!canMemberBeHandled(member, guild, client)) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Bot doesn't have permission to warn this member!"
      )
    );
  }

  try {
    const dmChannel = await client.rest.channels.createDM(member.id);
    await dmChannel.createMessage({
      embeds: [
        {
          color: interaction.colors.error,
          description: `You have been warned in **${guild.name}** for **${reason}**`,
        },
      ],
    });
  } catch {}

  await GuildLogService.postLog({
    guildID: guild.id,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Log Entry: Member Warn",
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
      `Member **${member.user.username}#${member.user.discriminator}** has been warned.`
    )
  );
}

export = {
  execute,
  options: {
    name: "warn",
    description: "Warn a member in the server",
    options: [
      {
        name: "member",
        description: "Member to warn",
        type: Constants.ApplicationCommandOptionTypes.USER,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for warn",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
      },
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
