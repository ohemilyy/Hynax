import {
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import {
  MENU_BACK_BTN_LABEL,
  MENU_BACK_BTN_STYLE,
  MENU_HOME_BTN_LABEL,
  MENU_HOME_BTN_STYLE,
} from "../../../constants";
import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const panelSelectMenuOptions = (
    await prisma.guildSelfRolePanel.findMany({
      where: { guildID: interaction.guildID },
    })
  ).map((i) => {
    return {
      label: i.name,
      value: `settings.srole.panel-${i.id}`,
    };
  });

  await interaction.editOriginal({
    embeds: [
      {
        title: "Self-Role Module",
        description:
          'Set up self-roles. This will update in real-time when you add to it.\n\nOnce you have set up your panels, press "Post Self-Role Embed" to make it interactable',
        color: interaction.colors.default,
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components:
          panelSelectMenuOptions.length > 0
            ? [
                {
                  type: Constants.ComponentTypes.STRING_SELECT,
                  placeholder: "Select self-role panel to manage...",
                  customID: "settings.srole.panel",
                  options: panelSelectMenuOptions,
                },
              ]
            : [
                {
                  customID: "settings.placeholder",
                  type: Constants.ComponentTypes.BUTTON,
                  label: "No panels found",
                  style: Constants.ButtonStyles.DANGER,
                  disabled: true,
                },
              ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            customID: "settings.srole.create_panel",
            type: Constants.ComponentTypes.BUTTON,
            label: "Create Panel",
            style: Constants.ButtonStyles.PRIMARY,
          },
          {
            customID: "settings.srole.post_button_embed",
            type: Constants.ComponentTypes.BUTTON,
            label: "Post Self-Role Button Embed",
            style: Constants.ButtonStyles.PRIMARY,
          },
          {
            customID: "settings.srole.post_menu_embed",
            type: Constants.ComponentTypes.BUTTON,
            label: "Post Self-Role Select Menu Embed",
            style: Constants.ButtonStyles.PRIMARY,
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
  id: "settings.srole",
  execute,
};
