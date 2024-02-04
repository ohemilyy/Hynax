import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import settingsBase from "../../handlers/settings/settings.base";

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
      interaction.getErrorReply("Failed to find the server.")
    );
  }

  const hasPermission = interaction.member.permissions.has("ADMINISTRATOR");

  if (!hasPermission) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "You don't have permission to run this command!"
      )
    );
  }

  await settingsBase.execute(interaction);
}

export = {
  execute,
  options: {
    name: "setup",
    description: "Configure your bot for this server",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
