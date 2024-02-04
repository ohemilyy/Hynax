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

  const panel = await prisma.guildWordBlacklistPanel.findUnique({
    where: {
      guildID: interaction.guildID,
    },
  });

  const blacklist = await prisma.guildWordBlacklist.findMany({
    where: {
      guildID: interaction.guildID,
    },
  });

  const minorWords = blacklist
    .filter((i) => i.type === "minor")
    .map((i) => i.word);

  const majorWords = blacklist
    .filter((i) => i.type === "major")
    .map((i) => i.word);

  await interaction.editOriginal({
    embeds: [
      {
        title: "Word Blacklist Module",
        description: `**Minor Words,**\n${
          minorWords.join(", ") || "None"
        }\n**Major Words,**\n${majorWords.join("\n") || "None"}`,
        color: interaction.colors.default,

        fields: [
          {
            name: "Minor timeout",
            value: panel?.minorTimeoutSeconds
              ? getReadableDuration(panel?.minorTimeoutSeconds)
              : "Not Set",
            inline: true,
          },
          {
            name: "Major timeout",
            value: panel?.majorTimeoutSeconds
              ? getReadableDuration(panel?.majorTimeoutSeconds)
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
            customID: "settings.wblacklist.select_root",
            options: [
              {
                label: "Add Minor Word",
                value: "settings.wblacklist.edit-addMinorWord",
                description: "Add a minor word to the blacklist",
              },
              {
                label: "Add Major Word",
                value: "settings.wblacklist.edit-addMajorWord",
                description: "Add a major word to the blacklist",
              },
              {
                label: "Remove Word",
                value: "settings.wblacklist.edit-removeWord",
                description: "Remove a word from the blacklist",
              },
              {
                label: "Set Minor Timeout Duration",
                value: "settings.wblacklist.edit-minorTimeoutSeconds",
                description: "Set the minor timeout duration",
              },
              {
                label: "Set Major Timeout Duration",
                value: "settings.wblacklist.edit-majorTimeoutSeconds",
                description: "Set the major timeout duration",
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
  id: "settings.wblacklist",
  execute,
};
