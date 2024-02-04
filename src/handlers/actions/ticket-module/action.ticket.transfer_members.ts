import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
  Permissions,
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
      title: "Transfer Members",
      customID: "action.ticket.transfer_members",
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Transfer Ticket ID",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              placeholder: "0001",
              customID: "transferID",
              required: true,
            },
          ],
        },
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Member IDs",
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

  const transferTicketID = interaction.options.getString("transferID", true);

  if (!transferTicketID) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "Please provide a valid transfer ticket ID!"
      ),
      flags: 64,
    });
  }

  const memberIDs = interaction.options
    .getString("ids", true)
    .split(",")
    .map((i) => i.trim())
    .filter((memberID) =>
      ticket.GuildTicketMember.find((i) => i.memberID === memberID)
    );

  if (memberIDs.length === 0) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "Please provide IDs of the members you wish to transfer"
      ),
      flags: 64,
    });
  }

  // transfer ticket
  const transferTicket = await prisma.guildTicket.findFirst({
    where: {
      id: transferTicketID,
    },
    include: {
      GuildTicketMember: true,
    },
  });

  if (!transferTicket) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "Transfer ticket with the given ID does not exist"
      ),
      flags: 64,
    });
  }

  // remove members from the current ticket
  for (const memberID of memberIDs) {
    try {
      await interaction.client.rest.channels.editPermission(
        ticket.ticketChannelID,
        memberID,
        {
          deny: Permissions.VIEW_CHANNEL,
          type: Constants.OverwriteTypes.MEMBER,
        }
      );

      await prisma.guildTicketMember.delete({
        where: {
          ticketID_memberID: {
            ticketID: ticket.id,
            memberID: memberID,
          },
        },
      });
    } catch {}
  }

  // get updated ticket
  const updatedTicket = await prisma.guildTicket.findFirstOrThrow({
    where: {
      id: ticket.id,
    },
    include: { GuildTicketMember: true },
  });

  // update embed
  const message = await interaction.client.rest.channels.getMessage(
    interaction.channelID,
    ticket.controlMessageID
  );

  message.embeds[0].fields?.forEach((f) => {
    if (f.name === "Participants") {
      f.value = updatedTicket.GuildTicketMember.map(
        (i) => `<@${i.memberID}>`
      ).join("\n");
    }
  });

  await message.edit({
    content: message.content,
    embeds: message.embeds,
  });

  // add members to the new ticket
  for (const memberID of memberIDs) {
    try {
      const duplicate = transferTicket.GuildTicketMember.find(
        (i) => i.memberID === memberID
      );

      if (duplicate) continue;

      await interaction.client.rest.channels.editPermission(
        transferTicket.ticketChannelID,
        memberID,
        {
            allow: Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGE,
            type: Constants.OverwriteTypes.MEMBER,
        }
      );

      await prisma.guildTicketMember.create({
        data: {
          memberID,
          ticketID: transferTicket.id,
        },
      });
    } catch {}
  }

  // get updated transfer ticket
  const updatedTransferTicket = await prisma.guildTicket.findFirstOrThrow({
    where: {
      id: transferTicket.id,
    },
    include: { GuildTicketMember: true },
  });

  // update embed
  const transferMessage = await interaction.client.rest.channels.getMessage(
    interaction.channelID,
    transferTicket.controlMessageID
  );

  transferMessage.embeds[0].fields?.forEach((f) => {
    if (f.name === "Participants") {
      f.value = updatedTransferTicket.GuildTicketMember.map(
        (i) => `<@${i.memberID}>`
      ).join("\n");
    }
  });

  await transferMessage.edit({
    content: transferMessage.content,
    embeds: transferMessage.embeds,
  });

  await interaction.editOriginal({
    ...interaction.getSuccessReply("Members have transferred from the ticket."),
    flags: 64,
  });
}

export = {
  id: "action.ticket.transfer_members",
  execute,
};
