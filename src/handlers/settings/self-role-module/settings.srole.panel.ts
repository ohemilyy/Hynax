import { GuildSelfRolePanel } from "@prisma/client";
import {
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { MENU_BACK_BTN_LABEL, MENU_HOME_BTN_LABEL } from "../../../constants";
import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  let panel: GuildSelfRolePanel | null;

  if (
    interaction instanceof ComponentInteraction &&
    interaction.data.componentType === Constants.ComponentTypes.STRING_SELECT
  ) {
    panel = await prisma.guildSelfRolePanel.findFirst({
      where: {
        id: interaction.data.values.getStrings()[0].split("-")[1],
      },
    });
  } else {
    panel = await prisma.guildSelfRolePanel.findFirst({
      where: { id: interaction.data.customID.split("-")[1] },
    });
  }

  if (!panel) {
    return interaction.editOriginal(
      interaction.getErrorReply("Failed to find the panel.")
    );
  }

  const embedName = "[``Name``]: " + panel.name;

  const embedGiveRoles =
    "[``Give Roles``]: " +
    (panel.giveRoleIDs
      .map((i) => (isNaN(parseInt(i)) ? "Not Set" : `<@&${i}>`))
      .join(",") || "Not Set");

  const embedButton =
    "[``Label``]: " + panel.buttonLabel + "\n[``Emoji``]: " + panel.buttonEmoji;

  await interaction.editOriginal({
    embeds: [
      {
        title: "Self-Role Panel Editor",
        description: `${embedName}\n${embedGiveRoles}`,
        fields: [{ name: "Button", value: embedButton }],
        color: interaction.colors.default,
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.STRING_SELECT,
            placeholder: "Select an option to configure",
            customID: "settings.srole.select_root",
            options: [
              {
                label: "Name",
                value: `settings.srole.panel.manage-name-${panel.id}`,
                description: "Set the name of the panel",
              },
              {
                label: "Give Roles",
                value: `settings.srole.panel.manage-giveRoleIDs-${panel.id}`,
                description: "Set roles to give",
              },
              {
                label: "Button Emoji",
                value: `settings.srole.panel.manage-buttonEmoji-${panel.id}`,
                description: "Set the emoji of the button",
              },
              {
                label: "Button Label",
                value: `settings.srole.panel.manage-buttonLabel-${panel.id}`,
                description: "Set the label of the button",
              },
              {
                label: "Delete Panel",
                value: `settings.srole.delete_panel-${panel.id}`,
                description: "Delete this panel",
              },
            ],
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            customID: "settings.srole",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_BACK_BTN_LABEL,
            style: Constants.ButtonStyles.SECONDARY,
          },
          {
            customID: "settings.base",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_HOME_BTN_LABEL,
            style: Constants.ButtonStyles.SUCCESS,
          },
        ],
      },
    ],
  });
}

export = {
  id: "settings.srole.panel",
  execute,
};
