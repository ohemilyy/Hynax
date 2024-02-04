import { GuildSelfRolePanel } from "@prisma/client";
import {
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { getEmojiFromInput } from "../../../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (interaction instanceof ComponentInteraction) {
    return await interaction.createModal({
      title: "Post Self-Role Embed",
      customID: interaction.data.customID,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Title",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              customID: "title",
              placeholder: "Write title here",
              required: false,
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
              placeholder: "#ffffff (hex codes)",
              customID: "color",
              required: false,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Description",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: "description",
              placeholder: "Write description here",
              required: true,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Image",
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
              label: "Panels",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: "panels",
              required: true,

              placeholder:
                "Panel Name 1\nPanel Name 2\n\nThis will display the menu items in order",
            },
          ],
        },
      ],
    });
  }

  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.defer(64).catch((_) => {});
  }

  const title = interaction.options.getString("title", false) || undefined;
  const description = interaction.options.getString("description", true);
  const image = interaction.options.getString("image", false) || undefined;
  const panels = interaction.options.getString("panels", true);

  let color = interaction.colors.default;
  const inputColor = interaction.options.getString("color", false) || undefined;

  if (inputColor) {
    color = parseInt(inputColor.replace("#", "0x"));
  }

  const rolePanels: GuildSelfRolePanel[] = [];

  for (const p of panels.split("\n")) {
    const record = await prisma.guildSelfRolePanel.findFirst({
      where: {
        guildID: interaction.guildID,
        name: p.trim(),
      },
    });

    if (!record) continue;

    if (record.giveRoleIDs.length === 0) {
      return interaction.editOriginal(
        interaction.getErrorReply(
          'Please make sure your panels contain at least one "give role".'
        )
      );
    }

    rolePanels.push(record);
  }

  if (rolePanels.length === 0) {
    return interaction.editOriginal(
      interaction.getErrorReply("Please provide at least one self-role panel.")
    );
  }

  await interaction.channel?.createMessage({
    embeds: [
      {
        title,
        description,
        image: (image && { url: image }) || undefined,
        color,
      },
    ],
    components: [
      {
        type: ComponentTypes.ACTION_ROW,
        components: [
          {
            type: ComponentTypes.STRING_SELECT,
            customID: "action.self_role.click.menu",
            options: rolePanels.map((panel) => {
              return {
                label: panel.buttonLabel,
                value: `action.self_role.click-${panel.id}`,
                emoji: getEmojiFromInput(panel.buttonEmoji),
              };
            }),
          },
        ],
      },
    ],
  });

  await interaction.editOriginal(
    interaction.getSuccessReply("Self-Role embed has been created.")
  );
}

export = {
  id: "settings.srole.post_menu_embed",
  execute,
};
