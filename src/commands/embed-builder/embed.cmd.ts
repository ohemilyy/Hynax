import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import embedPanel from "../../handlers/actions/embed-builder/action.embed_builder.panel";
import { checkModPermission } from "../../util/permission.util";
import { DatabaseService } from "../../service/DatabaseService";

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
      interaction.getErrorReply("Failed to find the server.")
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

  await embedPanel.execute(interaction);
}

export = {
  execute,
  options: {
    name: "embed",
    description: "Create an embed",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
