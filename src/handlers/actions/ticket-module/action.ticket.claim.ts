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
    ticket.panel.claimRoleIDs.some((roleId) =>
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
      title: "Confirmation",
      customID: "action.ticket.claim",
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Claim?",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              placeholder: 'Type "Yes" to confirm',
              customID: "res",
              required: true,
            },
          ],
        },
      ],
    });
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  const res = interaction.options.getString("res", true).toLowerCase().trim();
  if (res !== "yes") return;

  // update ticket
  const updatedTicket = await prisma.guildTicket.update({
    where: {
      id: ticket.id,
    },
    data: {
      claimedMemberID: interaction.member.id,
    },
    include: {
      panel: true,
    },
  });

  if (!updatedTicket) return;

  // update permissions and only allow claimed member to see
  for (const roleID of updatedTicket.panel.supportRoleIDs) {
    try {
      await interaction.client.rest.channels.editPermission(
        updatedTicket.ticketChannelID,
        roleID.trim(),
        {
          allow: 0n,
          deny: 1024n,
          type: Constants.OverwriteTypes.ROLE,
        }
      );
    } catch {}
  }

  await interaction.client.rest.channels.editPermission(
    updatedTicket.ticketChannelID,
    interaction.member.id,
    { allow: 1024n, deny: 0n, type: Constants.OverwriteTypes.MEMBER }
  );

  // update embed
  const message = await interaction.client.rest.channels.getMessage(
    interaction.channelID,
    ticket.controlMessageID
  );

  message.embeds[0].fields?.push({
    name: "Claimed By",
    value: `<@${interaction.member.id}>`,
  });

  if (message.components && message.components[0]) {
    message.components[0].components.forEach((i) => {
      if (i.type !== Constants.ComponentTypes.BUTTON) return;
      if (i.label !== "Claim") return;
      i.disabled = true;
    });
  }

  await interaction.editOriginal({
    embeds: message.embeds,
    components: message.components,
  });
}

export = {
  id: "action.ticket.claim",
  execute,
};
