import { MessageOptions } from "child_process";
import {
  Constants,
  ModalSubmitInteraction,
  CommandInteraction,
  InteractionContent,
} from "oceanic.js";

async function execute(
  interaction: CommandInteraction | ModalSubmitInteraction
) {
  if (!interaction.acknowledged) {
    if (interaction instanceof CommandInteraction) {
      await interaction.defer(64).catch((_) => {});
    } else {
      await interaction.deferUpdate().catch((_) => {});
    }
  }

  const options: InteractionContent & MessageOptions = {
    embeds: [
      {
        title: `${interaction.guild?.name}'s Bot Configuration`,
        description: "In the select menu below, select a module to configure",
        color: interaction.colors.default,
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.STRING_SELECT,
            placeholder: "Select a module to configure",
            customID: "settings.base",
            options: [
              {
                label: "General Module",
                value: "settings.general",
                description:
                  "General bot settings like embed colors and log channel",
              },
              {
                label: "Ticket Module",
                value: "settings.ticket",
                description: "Configure support ticket system",
              },
              {
                label: "Self-Role Module",
                value: "settings.srole",
                description: "Configure self-role system",
              },
              {
                label: "Report Module",
                value: "settings.report",
                description: "Configure report system",
              },
              {
                label: "Word Blacklist Module",
                value: "settings.wblacklist",
                description: "Configure word blacklisting system",
              },
              {
                label: "URL/IP Whitelist Module",
                value: "settings.urlipwhitelist",
                description: "Configure URL/IP whitelisting system",
              },
            ],
          },
        ],
      },
    ],
  };

  if (interaction instanceof CommandInteraction) {
    await interaction.editOriginal(options);
  } else {
    await interaction.editOriginal(options);
  }
}

export = {
  id: "settings.base",
  execute,
};
