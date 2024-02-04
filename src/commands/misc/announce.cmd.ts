import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";
import { checkModPermission } from "../../util/permission.util";

async function execute(interaction: CommandInteraction, client: Client) {
  if (!interaction.guildID || !interaction.member) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "This command can only be used inside servers."
      ),
      flags: 64,
    });
  }

  const hasPermission = await checkModPermission(interaction.member);

  if (!hasPermission) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "You don't have permission to run this command!"
      )
    );
  }

  return interaction.createModal({
    title: "Create Announcement",
    customID: `action.announcement.create`,
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            label: "Content",
            type: Constants.ComponentTypes.TEXT_INPUT,
            style: Constants.TextInputStyles.SHORT,
            customID: "content",
            placeholder: "For role mention, use <@&role_id>.",
            required: true,
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            label: "Title",
            type: Constants.ComponentTypes.TEXT_INPUT,
            style: Constants.TextInputStyles.SHORT,
            customID: "title",
            placeholder: "Title of the announcement",
            required: true,
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            label: "Description",
            type: Constants.ComponentTypes.TEXT_INPUT,
            style: Constants.TextInputStyles.SHORT,
            customID: "description",
            placeholder: "Description of the announcement",
            required: false,
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            label: "Image URL",
            type: Constants.ComponentTypes.TEXT_INPUT,
            style: Constants.TextInputStyles.SHORT,
            customID: "image_url",
            placeholder: "Image URL of the announcement",
            required: false,
          },
        ],
      },
    ],
  });
}

export = {
  execute,
  options: {
    name: "announce",
    description: "Announce something to the server.",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
