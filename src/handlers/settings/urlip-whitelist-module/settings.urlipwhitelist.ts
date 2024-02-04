import {
  Constants,
  ComponentInteraction,
  ModalSubmitInteraction,
} from "oceanic.js";
import { MENU_HOME_BTN_LABEL, MENU_HOME_BTN_STYLE } from "../../../constants";

import { DatabaseService } from "../../../service/DatabaseService";
import { getReadableDuration } from "../../../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const panel = await prisma.guildUrlIpWhitelistPanel.findUnique({
    where: {
      guildID: interaction.guildID,
    },
  });

  const entries = (
    await prisma.guildUrlIpWhitelist.findMany({
      where: {
        guildID: interaction.guildID,
      },
    })
  )
    .map((entry, index) => `${index + 1}) ${entry.entry}`)
    .join("\n");

  await interaction.editOriginal({
    embeds: [
      {
        title: "URL/IP Whitelist Module",
        description: `**Entries,**\n${entries || "List is empty"}`,
        color: interaction.colors.default,

        fields: [
          {
            name: "Timeout",
            value: panel?.timeoutSeconds
              ? getReadableDuration(panel?.timeoutSeconds)
              : "Not Set",
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
            customID: "settings.urlipwhitelist.select_root",
            options: [
              {
                label: "Add Entry",
                value: "settings.urlipwhitelist.edit-addEntry",
                description: "Add URL/IP to whitelist",
              },
              {
                label: "Remove Entry",
                value: "settings.urlipwhitelist.edit-removeEntry",
                description: "Remove URL/IP from whitelist",
              },
              {
                label: "Set Timeout Duration",
                value: "settings.urlipwhitelist.edit-timeoutSeconds",
                description: "Set the timeout duration",
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
  id: "settings.urlipwhitelist",
  execute,
};
