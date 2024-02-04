import {
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { getErrorReply, getSuccessReply } from "../../../util/common.util";
import timestring from "timestring";
import { IPV4_REGEX, URL_REGEX } from "../../../constants";
import settingsUrlipwhitelist from "./settings.urlipwhitelist";

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
    if (field === "addEntry") {
      return interaction.createModal({
        title: "Add URL/IP",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Entry",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "0.0.0.0",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "removeEntry") {
      return interaction.createModal({
        title: "Remove URL/IP",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Entry",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "0.0.0.0",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "timeoutSeconds") {
      return interaction.createModal({
        title: "Set Timeout Duration",
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

  if (field === "addEntry") {
    const duplicate = await prisma.guildUrlIpWhitelist.findUnique({
      where: {
        guildID_entry: {
          guildID: interaction.guildID,
          entry: value,
        },
      },
    });

    if (duplicate) {
      await interaction.createFollowup({
        ...getErrorReply("This entry already exists in whitelist"),
        flags: 64,
      });
      return;
    }

    let type = "";

    if (IPV4_REGEX().test(value)) type = "ip";
    if (URL_REGEX().test(value)) type = "url";

    if (!type) {
      await interaction.createFollowup({
        ...getErrorReply("Please provide a valid URL or IP"),
        flags: 64,
      });
      return;
    }

    await prisma.guildUrlIpWhitelist.create({
      data: {
        guildID: interaction.guildID,
        entry: value,
        type,
      },
    });

    await interaction.createFollowup({
      ...getSuccessReply(`Added ${value} to whitelist`),
      flags: 64,
    });

    await settingsUrlipwhitelist.execute(interaction);
    return;
  }

  if (field === "removeEntry") {
    const existingEntry = await prisma.guildUrlIpWhitelist.findUnique({
      where: {
        guildID_entry: {
          guildID: interaction.guildID,
          entry: value,
        },
      },
    });

    if (!existingEntry) {
      await interaction.createFollowup({
        ...getErrorReply("Entry does not exist in whitelist"),
        flags: 64,
      });
      return;
    }

    await prisma.guildUrlIpWhitelist.delete({
      where: {
        id: existingEntry.id,
      },
    });

    await settingsUrlipwhitelist.execute(interaction);
    return;
  }

  if (field === "timeoutSeconds") {
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

    await prisma.guildUrlIpWhitelistPanel.upsert({
      create: {
        guildID: interaction.guildID,
        timeoutSeconds: seconds,
      },
      update: {
        [field]: seconds,
      },
      where: {
        guildID: interaction.guildID,
      },
    });

    await settingsUrlipwhitelist.execute(interaction);
    return;
  }

  await settingsUrlipwhitelist.execute(interaction);
}

export = {
  id: "settings.urlipwhitelist.edit",
  execute,
};
