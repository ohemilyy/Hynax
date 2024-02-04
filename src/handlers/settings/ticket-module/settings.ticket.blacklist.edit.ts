import {
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { getErrorReply, getSuccessReply } from "../../../util/common.util";
import settingsTicketBlacklist from "./settings.ticket.blacklist";

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
        title: "Add User",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "User ID",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "removeEntry") {
      return interaction.createModal({
        title: "Remove User",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "User ID",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
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

  if (isNaN(parseInt(value))) {
    await interaction.createFollowup({
      ...getErrorReply("Please provide a valid user ID"),
      flags: 64,
    });
    return;
  }

  if (field === "addEntry") {
    const duplicate = await prisma.guildTicketBlacklist.findUnique({
      where: {
        guildID_userID: {
          guildID: interaction.guildID,
          userID: value,
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

    await prisma.guildTicketBlacklist.create({
      data: {
        guildID: interaction.guildID,
        userID: value,
      },
    });

    await interaction.createFollowup({
      ...getSuccessReply(`Added user ${value} to ticket blacklist.`),
      flags: 64,
    });

    await settingsTicketBlacklist.execute(interaction);
    return;
  }

  if (field === "removeEntry") {
    const existingEntry = await prisma.guildTicketBlacklist.findUnique({
      where: {
        guildID_userID: {
          guildID: interaction.guildID,
          userID: value,
        },
      },
    });

    if (!existingEntry) {
      await interaction.createFollowup({
        ...getErrorReply("This user ID does not exist in blacklist"),
        flags: 64,
      });
      return;
    }

    await prisma.guildTicketBlacklist.delete({
      where: {
        id: existingEntry.id,
      },
    });

    await settingsTicketBlacklist.execute(interaction);
    return;
  }

  await settingsTicketBlacklist.execute(interaction);
}

export = {
  id: "settings.ticket.blacklist.edit",
  execute,
};
