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

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const blacklist = (
    await prisma.guildTicketBlacklist.findMany({
      where: {
        guildID: interaction.guildID,
      },
    })
  )
    .map((entry, i) => `${i}) <@${entry.userID}> [${entry.userID}]`)
    .join("\n");

  await interaction.editOriginal({
    embeds: [
      {
        title: "Ticket Blacklist",
        description: `**Users,**\n${blacklist || "List is empty"}`,
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
            customID: "settings.ticket.blacklist.select_root",
            options: [
              {
                label: "Add Entry",
                value: "settings.ticket.blacklist.edit-addEntry",
                description: "Add user to ticket blacklist",
              },
              {
                label: "Remove Entry",
                value: "settings.ticket.blacklist.edit-removeEntry",
                description: "Remove user from ticket blacklist",
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
          {
            customID: "settings.ticket",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_BACK_BTN_LABEL,
            style: MENU_BACK_BTN_STYLE,
          },
        ],
      },
    ],
  });
}

export = {
  id: "settings.ticket.blacklist",
  execute,
};
