import {
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { getEmojiFromInput } from "../../../util/common.util";
import { checkModPermission } from "../../../util/permission.util";

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.member || !interaction.guildID) return;

  // check permission
  const hasPermission = await checkModPermission(interaction.member);

  if (!hasPermission) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "You don't have permissions to perform this action."
      ),
      flags: 64,
    });
  }

  if (interaction instanceof ComponentInteraction) {
    return interaction.createModal({
      title: "Create Self-Role Embed",
      customID: `action.self_role.create`,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Label (Don't remove the split)",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: "label",
              value: "Label | ✅",
              required: true,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "image",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              customID: "image",
              placeholder: "Supports Discord links, Imgur links, etc",
              required: false,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Title & Desc (Don't remove split)",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: "title_desc",
              value: "Write title here | Write description here",
              required: true,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Color",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              customID: "color",
              placeholder: "#ffffff (hex codes)",
              required: true,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Role",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              customID: "role_id",
              placeholder: "Place role ID here",
              required: true,
            },
          ],
        },
      ],
    });
  }

  if (!interaction.acknowledged) {
    await interaction.defer(64);
  }

  const titleDescParts = interaction.options
    .getString("title_desc", true)
    .split("|");

  const labelParts = interaction.options.getString("label", true).split("|");

  const title = titleDescParts[0].trim();
  const description = titleDescParts[1].trim();

  const toggleLabel = labelParts[0].trim();
  const toggleLabelEmoji = labelParts[1].trim();

  const color = parseInt(
    interaction.options.getString("color", true).replace("#", "0x")
  );
  const roleID = interaction.options.getString("role_id", true);
  const image = interaction.options.getString("image", false);

  await interaction.client.rest.channels.createMessage(interaction.channelID, {
    embeds: [
      {
        color,
        title,
        description,
        image: (image && { url: image }) || undefined,
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.SECONDARY,
            emoji: getEmojiFromInput(toggleLabelEmoji),
            label: toggleLabel,
            customID: `action.self_role.click-${roleID}`,
          },
        ],
      },
    ],
  });

  await interaction.editOriginal(
    interaction.getSuccessReply("Self role embed has been created.")
  );
}

export = {
  id: "action.self_role.create",
  execute,
};
