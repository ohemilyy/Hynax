import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { checkModPermission } from "../../../util/permission.util";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction
    | CommandInteraction
    | ModalSubmitInteraction
) {
  if (!interaction.member || !interaction.guildID) return;
  // check permission
  const hasPermission = await checkModPermission(interaction.member);

  if (!hasPermission) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "You don't have permission to run this command."
      ),
      flags: 64,
    });
  }

  if (!(interaction instanceof ModalSubmitInteraction)) {
    return interaction.createModal({
      title: "Blacklist Users",
      customID: "action.ticket.blacklist_add",
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "User IDs",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              placeholder: "111232333, 2434334, 54545554",
              customID: "ids",
              required: true,
            },
          ],
        },
      ],
    });
  }

  if (!interaction.acknowledged) {
    await interaction.defer(64).catch((_) => {});
  }

  const inputUserIDs = Array.from(
    new Set(
      interaction.options
        .getString("ids", true)
        .split(",")
        .map((i) => i.trim())
    )
  );

  const blacklist = (
    await prisma.guildTicketBlacklist.findMany({
      where: {
        guildID: interaction.guildID,
      },
    })
  ).map((entry) => entry.userID);

  const userIDs = inputUserIDs.filter((id) => !blacklist.includes(id));

  if (userIDs.length === 0) {
    return interaction.createMessage({
      ...interaction.getErrorReply("All users are already blacklisted."),
      flags: 64,
    });
  }

  await prisma.guildTicketBlacklist.createMany({
    data: [
      ...userIDs.map((id) => ({
        guildID: interaction.guildID as string,
        userID: id,
      })),
    ],
  });

  await interaction.editOriginal({
    ...interaction.getSuccessReply("Added users to blacklist."),
    flags: 64,
  });
}

export = {
  id: "action.ticket.blacklist_add",
  execute,
};
