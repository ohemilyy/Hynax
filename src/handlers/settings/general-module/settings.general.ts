import {
  Constants,
  ComponentInteraction,
  ModalSubmitInteraction,
} from "oceanic.js";
import {
  MENU_BACK_BTN_LABEL,
  MENU_BACK_BTN_STYLE,
  MENU_HOME_BTN_LABEL,
  MENU_HOME_BTN_STYLE,
} from "../../../constants";

import { DatabaseService } from "../../../service/DatabaseService";
import { Colors, colorToHexString } from "../../../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const panel = await prisma.guildGeneralPanel.findUnique({
    where: {
      guildID: interaction.guildID,
    },
  });

  await interaction.editOriginal({
    embeds: [
      {
        title: "General Module",
        description:
          "Configure general settings for your bot. This will update in real-time when you add to it",
        color: interaction.colors.default,
        fields: [
          {
            name: "Moderation Roles",
            value: panel?.modRoleIDs.length
              ? panel.modRoleIDs.map((id) => `<@&${id}>`).join(", ")
              : "Not Set",
          },
          {
            name: "Common Log Channel",
            value:
              (panel?.logChannelID && `<#${panel.logChannelID}>`) || "Not Set",
          },
          {
            name: "Default Embed Color",
            value:
              (panel?.defaultEmbedColor && panel.defaultEmbedColorHex) ||
              colorToHexString(Colors.BLURPLE),
            inline: true,
          },
          {
            name: "Success Embed Color",
            value:
              (panel?.successEmbedColor && panel.successEmbedColorHex) ||
              colorToHexString(Colors.GREEN),
            inline: true,
          },
          {
            name: "Error (Danger) Embed Color",
            value:
              (panel?.errorEmbedColor && panel.errorEmbedColorHex) ||
              colorToHexString(Colors.RED),
            inline: true,
          },
        ],
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.STRING_SELECT,
            placeholder: "Select an option to configure",
            customID: "settings.general.select_root",
            options: [
              {
                label: "Moderation Roles",
                value: "settings.general.edit-modRoleIDs",
                description: "Set the roles for moderators",
              },
              {
                label: "Fallback Log Channel",
                value: "settings.general.edit-logChannelID",
                description:
                  "Set a fallback log channel for everything to be sent",
              },
              {
                label: "Default Embed Color",
                value: "settings.general.edit-defaultEmbedColor",
                description: "Set the accent (default) color for all embeds",
              },
              {
                label: "Success Embed Color",
                value: "settings.general.edit-successEmbedColor",
                description: "Set the success color for all embeds",
              },
              {
                label: "Error Embed Color",
                value: "settings.general.edit-errorEmbedColor",
                description: "Set the error color for all embeds",
              },
            ],
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            customID: "settings.base",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_HOME_BTN_LABEL,
            style: MENU_HOME_BTN_STYLE,
          },
        ],
      },
    ],
  });
}

export = {
  id: "settings.general",
  execute,
};
