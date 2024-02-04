import { GuildTicketPanel } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  CategoryChannel,
  ComponentInteraction,
  Constants,
  CreateMessageOptions,
  ModalSubmitInteraction,
  Permissions,
  TextChannel,
  User,
} from "oceanic.js";

import { DatabaseService } from "../../../service/DatabaseService";
import { GeneralService } from "../../../service/GeneralService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.member || !interaction.guildID) return;

  const panelID = interaction.data.customID.split("-")[1];

  // check if duplicate
  const duplicate = await prisma.guildTicket.findFirst({
    where: {
      createdMemberID: interaction.member.id,
      createdMemberUsername: interaction.member.username,
      guildID: interaction.guildID,
      panelID: panelID,
      status: "active",
    },
  });

  if (duplicate) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        `You already have a ticket open in <#${duplicate.ticketChannelID}>.`
      ),
      flags: 64,
    });
  }

  // check blacklisted
  const isBlacklisted = await prisma.guildTicketBlacklist.findUnique({
    where: {
      guildID_userID: {
        guildID: interaction.guildID,
        userID: interaction.member.id,
      },
    },
  });

  if (isBlacklisted) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "You are blacklisted from creating tickets in this server."
      ),
      flags: 64,
    });
  }

  // get panel
  const panel = await prisma.guildTicketPanel.findFirst({
    where: {
      id: panelID,
    },
  });

  if (!panel) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "Ticket panel not found. Please inform the server staff."
      ),
      flags: 64,
    });
  }

  // show questions if there are any
  const questions = panel.questions;

  // show modal if there are question
  if (
    questions.length > 0 &&
    questions[0]?.trim() !== "" &&
    interaction instanceof ComponentInteraction
  ) {
    return interaction.createModal({
      title: "Questions",
      customID: `action.ticket.create-${panelID}`,
      components: questions.map((q) => {
        return {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: q,
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: q,
              required: true,
            },
          ],
        };
      }),
    });
  }

  // create a ticket with answers provided
  if (interaction instanceof ModalSubmitInteraction) {
    return createTicketWithAnswers(interaction, panel);
  }

  // create a regular ticket
  return createRegularTicket(interaction, panel);
}

async function createTicketWithAnswers(
  interaction: ModalSubmitInteraction,
  panel: GuildTicketPanel
) {
  if (!interaction.member || !interaction.guildID) return;

  const questions = panel.questions;
  const answers: string[] = [];

  if (!interaction.acknowledged) {
    await interaction.defer(64);
  }

  questions.forEach((q) => {
    const answer = interaction.options.getString(q, true);
    answers.push(answer);
  });

  const ticketRecord = await prisma.guildTicket.create({
    data: {
      guildID: interaction.guildID,
      createdMemberID: interaction.member.id,
      createdMemberUsername: interaction.member.username,
      ticketChannelID: randomUUID(),
      panelID: panel.id,
      controlMessageID: randomUUID(),
      GuildTicketMember: {
        create: {
          memberID: interaction.member.id,
          memberUsername: interaction.member.username,
        },
      },
    },
  });

  const ticketChannel = await createTicketChannel(
    interaction,
    panel,
    ticketRecord.id
  );

  const controlMessage = await ticketChannel.createMessage(
    getTicketMessageOptions(interaction.user, panel, questions, answers)
  );

  await prisma.guildTicket.update({
    where: {
      id: ticketRecord.id,
    },
    data: {
      ticketChannelID: ticketChannel.id,
      controlMessageID: controlMessage.id,
    },
  });

  await interaction.editOriginal(
    interaction.getSuccessReply(
      `Your ticket <#${ticketChannel.id}> has been created.`
    )
  );
}

async function createRegularTicket(
  interaction: ModalSubmitInteraction | ComponentInteraction,
  panel: GuildTicketPanel
) {
  if (!interaction.member || !interaction.guildID) return;

  if (!interaction.acknowledged) {
    await interaction.defer(64);
  }

  const ticketRecord = await prisma.guildTicket.create({
    data: {
      guildID: interaction.guildID,
      createdMemberID: interaction.member.id,
      createdMemberUsername: interaction.member.username,
      ticketChannelID: randomUUID(),
      panelID: panel.id,
      controlMessageID: randomUUID(),
      GuildTicketMember: {
        create: {
          memberID: interaction.member.id,
          memberUsername: interaction.member.username,
        },
      },
    },
  });

  const ticketChannel = await createTicketChannel(
    interaction,
    panel,
    ticketRecord.id
  );

  const controlMessage = await ticketChannel.createMessage(
    getTicketMessageOptions(interaction.user, panel, [], [])
  );

  await prisma.guildTicket.update({
    where: {
      id: ticketRecord.id,
    },
    data: {
      ticketChannelID: ticketChannel.id,
      controlMessageID: controlMessage.id,
    },
  });

  await interaction.editOriginal({
    content: `Your ticket <#${ticketChannel.id}> has been created.`,
  });
}

async function createTicketChannel(
  interaction: ModalSubmitInteraction | ComponentInteraction,
  panel: GuildTicketPanel,
  ticketID: string
) {
  if (!interaction.guildID) throw new Error("Ticket create guild not found");

  const guildTicketConfig = await prisma.guildTicketConfig.upsert({
    where: {
      guildID: interaction.guildID,
    },
    create: {
      guildID: interaction.guildID,
    },
    update: {},
  });

  const formatter = new Intl.NumberFormat("en-US", {
    minimumIntegerDigits: 4,
    useGrouping: false,
  });

  if (!panel.categoryID) {
    throw new Error("Ticket category not found");
  }

  const category = await interaction.client.rest.channels.get<CategoryChannel>(
    panel.categoryID
  );

  const channelName = getTicketChannelName(
    guildTicketConfig.channelNameFormat,
    {
      username: interaction.user.username,
      emoji: panel.emoji,
      number: formatter.format(category.channels.size + 1),
      tag: interaction.user.tag,
    }
  );

  const botPerms =
    Permissions.VIEW_CHANNEL |
    Permissions.SEND_MESSAGES |
    Permissions.MANAGE_MESSAGES |
    Permissions.MANAGE_CHANNELS |
    Permissions.EMBED_LINKS;

  const authorPerms =
    Permissions.VIEW_CHANNEL |
    Permissions.ATTACH_FILES |
    Permissions.SEND_MESSAGES |
    Permissions.EMBED_LINKS;

  const staffPerms =
    Permissions.VIEW_CHANNEL |
    Permissions.ATTACH_FILES |
    Permissions.EMBED_LINKS |
    Permissions.MANAGE_MESSAGES;

  const ticketChannel = await interaction.client.rest.guilds.createChannel(
    panel.guildID,
    Constants.ChannelTypes.GUILD_TEXT,
    {
      name: channelName,
      parentID: panel.categoryID,
      permissionOverwrites: [
        {
          id: interaction.guildID,
          type: Constants.OverwriteTypes.ROLE,
          allow: 0n,
          deny: 1024n,
        },
        ...panel.supportRoleIDs.map((i) => {
          return {
            id: i.trim(),
            type: Constants.OverwriteTypes.ROLE,
            allow: staffPerms,
            deny: 0n,
          };
        }),
        {
          id: interaction.user.id,
          type: Constants.OverwriteTypes.MEMBER,
          allow: authorPerms,
          deny: 0n,
        },
        {
          id: interaction.client.user.id,
          type: Constants.OverwriteTypes.MEMBER,
          allow: botPerms,
          deny: 0n,
        },
      ].filter((i) => i?.id && !isNaN(parseInt(i.id))),
    }
  );

  return ticketChannel as TextChannel;
}

function getTicketMessageOptions(
  user: User,
  panel: GuildTicketPanel,
  questions: string[],
  answers: string[]
): CreateMessageOptions {
  return {
    content:
      panel.pingRoleID && !isNaN(parseInt(panel.pingRoleID))
        ? `<@&${panel.pingRoleID}>`
        : undefined,
    embeds: [
      {
        color: GeneralService.getDefaultColor(panel.guildID),
        title: `Ticket for: ${panel.name}`,
        description: "Please be patient. Support staff will attend you soon.",
        fields: [
          { name: "Participants", value: `<@${user.id}>` },
          ...questions.map((q, i) => {
            return {
              name: q,
              value: answers[i],
              inline: false,
            };
          }),
        ],
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            label: "Claim",
            style: Constants.ButtonStyles.SUCCESS,
            customID: "action.ticket.claim",
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            label: "Rename",
            style: Constants.ButtonStyles.SECONDARY,
            customID: "action.ticket.rename",
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            label: "Add Members",
            style: Constants.ButtonStyles.PRIMARY,
            customID: "action.ticket.add_members",
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            label: "Close",
            style: Constants.ButtonStyles.DANGER,
            customID: "action.ticket.close",
          },
        ],
      },
    ],
  };
}

function getTicketChannelName(
  format: string,
  data: { username: string; emoji: string; number: string; tag: string }
) {
  return format
    .replace("{username}", data.username)
    .replace("{emoji}", data.emoji)
    .replace("{number}", data.number)
    .replace("{tag}", data.tag);
}

export = {
  id: "action.ticket.create",
  execute,
};
