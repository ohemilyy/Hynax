import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  File,
  GetChannelMessagesOptions,
  Message,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import {
  getLongTimestamp,
  getTicketEmbedHTML,
  getTicketTranscriptHTML,
} from "../../../util/common.util";
import { GuildLogService } from "../../../service/GuildLogService";

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
      title: "Reason for closing ticket",
      customID: "action.ticket.close",
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: "Reason",
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.SHORT,
              placeholder: "Explain why you are closing the ticket",
              customID: "value",
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

  const reason = interaction.options.getString("value", true);

  // update ticket
  await prisma.guildTicket.update({
    where: {
      id: ticket.id,
    },
    data: {
      status: "closed",
    },
    include: {
      panel: true,
    },
  });

  // store messages
  let messages: Message[] = [];

  while (true) {
    let options: GetChannelMessagesOptions = {};

    if (messages.length > 0) {
      options.before = messages[messages.length - 1].id;
    }

    let fetchedMessages = await interaction.client.rest.channels.getMessages(
      interaction.channelID,
      options
    );

    if (fetchedMessages.length === 0) break;

    messages = [...messages, ...fetchedMessages];
  }

  // custom log channel
  const customLogChannelID =
    (ticket.panel.logChannelID &&
      !isNaN(parseInt(ticket.panel.logChannelID)) &&
      ticket.panel.logChannelID) ||
    undefined;

  // post log
  await GuildLogService.postLog({
    guildID: interaction.guildID,
    channelID: customLogChannelID,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Ticket Logs",
          fields: [
            {
              name: "Ticket ID",
              value: `#${ticket.id}`,
              inline: true,
            },
            {
              name: "Panel Name",
              value: ticket.panel.name,
              inline: true,
            },
            {
              name: "\u200b",
              value: "\u200b",
              inline: true,
            },
            {
              name: "Created By",
              value: `<@${ticket.createdMemberID}>`,
              inline: true,
            },
            {
              name: "Closed By",
              value: `<@${interaction.member.id}>`,
              inline: true,
            },
            { name: "Reason Closed", value: reason },
            { name: "Timestamp", value: getLongTimestamp() },
          ],
          footer: {
            text: `⬇️ Full transcript attached below ⬇️`,
          },
        },
      ],
    },
  });

  let deletedMessages = messages
    .reverse()
    .map(
      (m) =>
        `${m.author.username}#${m.author.discriminator} [${m.author.id}]: ${m.content}`
    )
    .join("\n\n");

  const transcriptFile: File = {
    name: "transcript.txt",
    contents: Buffer.from(
      `Ticket ID: #${
        ticket.id
      } | Closed Timestamp: ${new Date().toISOString()}\n\n${deletedMessages}`,
      "utf-8"
    ),
  };

  const ticketChat = messages.map((m) => {
    return {
      author: `${m.author.tag} [${m.author.id}]`,
      message: m.content,
      avatarUrl: m.author.avatarURL(),
    };
  });

  // grab the embeds from ticket and turn them into html
  const ticketEmbedsHTML = messages
    .map((m) => m.embeds)
    .flat()
    .map((embed) => {
      return getTicketEmbedHTML(embed.fields ?? []);
    })
    .join("\n");

  const transcriptHtml = getTicketTranscriptHTML(
    {
      guild: `${interaction.guild?.name}`,
      guildIconUrl: `${interaction.guild?.iconURL()}`,
      ticketId: ticket.id,
      createdBy: `${ticket.createdMemberUsername} [${ticket.createdMemberID}]`,
      createdAt: `${ticket.createdAt.toISOString()}`,
      participants: ticket.GuildTicketMember.map(
        (m) => `${m.memberUsername} [${m.memberID}]`
      ),
      extraHTML: ticketEmbedsHTML,
    },
    ticketChat
  );

  const transcriptHtmlFile: File = {
    name: "transcript.html",
    contents: Buffer.from(transcriptHtml, "utf-8"),
  };

  await GuildLogService.postLog({
    guildID: interaction.guildID,
    channelID: customLogChannelID,
    content: { content: undefined },
    files: [transcriptFile, transcriptHtmlFile],
  });

  try {
    const dmChannel = await interaction.client.rest.channels.createDM(
      ticket.createdMemberID
    );

    await dmChannel.createMessage({
      ...interaction.getDefaultReply(
        `Thank you for submitting the ticket ${ticket.id}. Here is a transcript of it in case you missed on something.`
      ),
      files: [transcriptFile, transcriptHtmlFile],
    });
  } catch {}

  await interaction.editOriginal(
    interaction.getSuccessReply(
      "Ticket has been closed. This channel will get deleted in a few seconds."
    )
  );

  setTimeout(() => {
    interaction.client.rest.channels
      .delete(ticket.ticketChannelID)
      .catch((e) => {
        interaction.client.logger.error(e);
      });
  }, 10000);
}
export = {
  id: "action.ticket.close",
  execute,
};
