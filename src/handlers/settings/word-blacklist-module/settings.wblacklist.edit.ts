import {
  ChannelTypes,
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { getErrorReply, getSuccessReply } from "../../../util/common.util";
import settingsWblacklist from "./settings.wblacklist";
import timestring from "timestring";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction<ComponentTypes.STRING_SELECT>
    | ModalSubmitInteraction
) {
  const customID =
    interaction instanceof ModalSubmitInteraction
      ? interaction.data.customID
      : interaction.data.values.getStrings()[0];

  const field = customID.split("-")[1]?.trim();

  if (interaction instanceof ComponentInteraction) {
    if (field === "addMajorWord") {
      return interaction.createModal({
        title: "Add Major Word",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Word",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "Hello",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "addMinorWord") {
      return interaction.createModal({
        title: "Add Minor Word",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Word",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "Hello",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "removeWord") {
      return interaction.createModal({
        title: "Remove Word",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Word",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "Hello",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "minorTimeoutSeconds") {
      return interaction.createModal({
        title: "Set Minor Timeout Duration",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Duration",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                placeholder: "5h",
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "majorTimeoutSeconds") {
      return interaction.createModal({
        title: "Set Major Timeout Duration",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Duration",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                placeholder: "5h",
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }

    return;
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  if (!interaction.guildID) return;

  const value = interaction.options.getString("value", true).trim();

  if (field === "addMinorWord" || field === "addMajorWord") {
    const duplicate = await prisma.guildWordBlacklist.findUnique({
      where: {
        guildID_word: {
          guildID: interaction.guildID,
          word: value,
        },
      },
    });

    if (duplicate) {
      await interaction.createFollowup({
        ...getErrorReply("Word already exists in blacklist"),
        flags: 64,
      });
      return;
    }

    const type = field === "addMinorWord" ? "minor" : "major";

    await prisma.guildWordBlacklist.create({
      data: {
        guildID: interaction.guildID,
        word: value,
        type,
      },
    });

    await interaction.createFollowup({
      ...getSuccessReply(`Added ${type} word to blacklist`),
      flags: 64,
    });

    await settingsWblacklist.execute(interaction);
    return;
  }

  if (field === "removeWord") {
    const word = await prisma.guildWordBlacklist.findUnique({
      where: {
        guildID_word: {
          guildID: interaction.guildID,
          word: value,
        },
      },
    });

    if (!word) {
      await interaction.createFollowup({
        ...getErrorReply("Word does not exist in blacklist"),
        flags: 64,
      });
      return;
    }

    await prisma.guildWordBlacklist.delete({
      where: {
        guildID_word: {
          guildID: interaction.guildID,
          word: value,
        },
      },
    });

    await settingsWblacklist.execute(interaction);
    return;
  }

  if (field === "minorTimeoutSeconds" || field === "majorTimeoutSeconds") {
    let seconds = 0;

    try {
      seconds = timestring(value, "s");
    } catch {
      await interaction.createFollowup({
        ...getErrorReply("Invalid duration"),
        flags: 64,
      });
      return;
    }

    if (seconds <= 0) {
      await interaction.createFollowup({
        ...getErrorReply("Duration must be greater than 0"),
        flags: 64,
      });
      return;
    }

    await prisma.guildWordBlacklistPanel.upsert({
      create: {
        guildID: interaction.guildID,
        majorTimeoutSeconds: field === "majorTimeoutSeconds" ? seconds : 0,
        minorTimeoutSeconds: field === "minorTimeoutSeconds" ? seconds : 0,
      },
      update: {
        [field]: seconds,
      },
      where: {
        guildID: interaction.guildID,
      },
    });

    await settingsWblacklist.execute(interaction);
    return;
  }

  await settingsWblacklist.execute(interaction);
}

export = {
  id: "settings.wblacklist.edit",
  execute,
};
