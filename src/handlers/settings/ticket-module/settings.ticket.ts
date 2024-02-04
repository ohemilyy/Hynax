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

  const guildTicketConfig = await prisma.guildTicketConfig.upsert({
    where: {
      guildID: interaction.guildID,
    },
    create: {
      guildID: interaction.guildID,
    },
    update: {},
  });

  const panelSelectMenuOptions = (
    await prisma.guildTicketPanel.findMany({
      where: { guildID: interaction.guildID },
    })
  ).map((i) => {
    return {
      label: i.name,
      value: `settings.ticket.manage_panel-${i.id}`,
    };
  });

  await interaction.editOriginal({
    embeds: [
      {
        title: "Ticket Module",
        description: `Set up ticket this will update in real-time when you add to it \n\nOnce you have set up your ticket panel, press "post ticket embed" to make it interactable `,
        color: interaction.colors.default,
        fields: [
          {
            name: "Channel Name Format",
            value: guildTicketConfig.channelNameFormat,
          },
        ],
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
                  placeholder: "Select ticket panel to manage...",
                  customID: "settings.ticket.mod_panel",
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
            customID: "settings.ticket.edit-channelNameFormat",
            type: Constants.ComponentTypes.BUTTON,
            label: "Set Channel Name Format",
            style: Constants.ButtonStyles.PRIMARY,
          },
          {
            customID: "settings.ticket.create_panel",
            type: Constants.ComponentTypes.BUTTON,
            label: "Create Panel",
            style: Constants.ButtonStyles.PRIMARY,
          },
          {
            customID: "settings.ticket.blacklist",
            type: Constants.ComponentTypes.BUTTON,
            label: "Manage Blacklist",
            style: Constants.ButtonStyles.PRIMARY,
          },
          {
            customID: "settings.ticket.create_embed",
            type: Constants.ComponentTypes.BUTTON,
            label: "Post Ticket Embed",
            style: Constants.ButtonStyles.PRIMARY,
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            customID: "settings.base.utils",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_BACK_BTN_LABEL,
            style: MENU_BACK_BTN_STYLE,
          },
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
  id: "settings.ticket",
  execute,
};
