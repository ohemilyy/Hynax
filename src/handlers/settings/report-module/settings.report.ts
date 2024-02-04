import {
  Constants,
  ComponentInteraction,
  ModalSubmitInteraction,
} from "oceanic.js";
import { MENU_HOME_BTN_LABEL, MENU_HOME_BTN_STYLE } from "../../../constants";

import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const panel = await prisma.guildReportPanel.findUnique({
    where: {
      guildID: interaction.guildID,
    },
  });

  await interaction.editOriginal({
    embeds: [
      {
        title: "Report Module",
        description:
          "Configure report settings for your bot. This will update in real-time when you add to it",
        color: interaction.colors.default,
        fields: [
          {
            name: "Access Roles",
            value: panel?.accessRoleIDs.length
              ? panel.accessRoleIDs.map((id) => `<@&${id}>`).join(", ")
              : "Not Set",
          },
          {
            name: "Report Log Channel",
            value: panel?.channelID ? `<#${panel.channelID}>` : "Not Set",
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
            customID: "settings.report.select_root",
            options: [
              {
                label: "Access Roles",
                value: "settings.report.edit-accessRoleIDs",
                description: "Set roles that can access the reports",
              },
              {
                label: "Report Log Channel",
                value: "settings.report.edit-channelID",
                description: "Set the channel where reports will be logged to",
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
  id: "settings.report",
  execute,
};
