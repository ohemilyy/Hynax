import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction
    | CommandInteraction
    | ModalSubmitInteraction
) {
  if (!interaction.member || !interaction.guildID) return;

  const ticket = await prisma.guildTicket.findFirst({
    where: {
      ticketChannelID: interaction.channelID,
    },
    include: { GuildTicketMember: true, panel: true },
  });

  if (!ticket) {
    return interaction.createMessage({
      ...interaction.getErrorReply("This is not a ticket channel."),
      flags: 64,
    });
  }

  // check permission
  const hasPermission =
    interaction.member.permissions.has("ADMINISTRATOR") ||
    ticket.panel.supportRoleIDs.some((roleId) =>
      interaction.member?.roles.includes(roleId.trim())
    );

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
      title: "Rename Ticket",
      customID: "action.ticket.rename",
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "New Name",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              customID: "name",
              required: true,
              minLength: 1,
              maxLength: 100,
            },
          ],
        },
      ],
    });
  }

  if (!interaction.acknowledged) {
    await interaction.defer(64).catch((_) => {});
  }

  const name = interaction.options.getString("name", true);

  try {
    await interaction.client.rest.channels.edit(ticket.ticketChannelID, {
      name,
    });
  } catch (e: any) {
    interaction.client.logger.error(e);
    return interaction.editOriginal(
      interaction.getErrorReply("Something went wrong.")
    );
  }

  await interaction.editOriginal(
    interaction.getSuccessReply(`Ticket has been renamed to **${name}**.`)
  );
}

export = {
  id: "action.ticket.rename",
  execute,
};
