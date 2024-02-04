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
      title: "Add Members",
      customID: "action.ticket.add_members",
      components: [
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

  const memberIDs = interaction.options
    .getString("ids", true)
    .split(",")
    .map((i) => i.trim());

  const guildTicketMemberIDs = ticket.GuildTicketMember.map((m) => m.memberID);

  for (const memberID of memberIDs) {
    try {
      // ignore duplicates
      if (guildTicketMemberIDs.includes(memberID)) {
        continue;
      }

      const member = await interaction.member.guild.getMember(memberID);
      if (!member) continue;

      await interaction.client.rest.channels.editPermission(
        ticket.ticketChannelID,
        memberID,
        {
          allow: Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGE,
          type: Constants.OverwriteTypes.MEMBER,
        }
      );

      await prisma.guildTicketMember.create({
        data: {
          ticketID: ticket.id,
          memberID: member.id,
          memberUsername: member.username,
        },
      });
    } catch {}
  }

  // get updated ticket
  const updatedTicket = await prisma.guildTicket.findFirst({
    where: {
      id: ticket.id,
    },
    include: { GuildTicketMember: true },
  });

  if (!updatedTicket) return;

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

  await interaction.editOriginal({
    ...interaction.getSuccessReply("Members have added to the ticket."),
    flags: 64,
  });
}

export = {
  id: "action.ticket.add_members",
  execute,
};
