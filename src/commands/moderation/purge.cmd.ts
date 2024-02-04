import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  GetChannelMessagesOptions,
  Message,
  Client,
} from "oceanic.js";
import { DatabaseService } from "../../service/DatabaseService";
import { GuildLogService } from "../../service/GuildLogService";
import { checkModPermission } from "../../util/permission.util";

const prisma = DatabaseService.getClient();

async function execute(interaction: CommandInteraction, client: Client) {
  await interaction.defer(64);

  if (!interaction.guildID || !interaction.member) {
    return interaction.editOriginal(
      interaction.getErrorReply("This command can only be used inside servers.")
    );
  }

  const guild = client.guilds.get(interaction.guildID);

  if (!guild) {
    return interaction.editOriginal(
      interaction.getErrorReply("Failed to locate the Discord server.")
    );
  }

  const interactionMember = interaction.member;

  if (!interactionMember) {
    return interaction.editOriginal(
      interaction.getErrorReply("Failed to locate the interaction member.")
    );
  }

  const hasPermission = await checkModPermission(interaction.member);

  if (!hasPermission) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "You don't have permission to run this command!"
      )
    );
  }

  const generalPanel = await prisma.guildGeneralPanel.findFirst({
    where: {
      guildID: interaction.guildID,
    },
  });

  const amount = interaction.data.options.getInteger("amount", true);
  const member = interaction.data.options.getMember("member", false);
  const reason = interaction.data.options.getString("reason") || undefined;

  let messages: Message[] = [];

  const allowedFromTimestamp = new Date().getTime() - 1.21e9;

  while (true) {
    if (messages.length >= amount) break;

    let options: GetChannelMessagesOptions = {};

    if (messages.length > 0) {
      options.before = messages[messages.length - 1].id;
    }

    let fetchedMessages = (
      await client.rest.channels.getMessages(interaction.channelID, options)
    ).filter((m) => {
      if (m.timestamp.getTime() < allowedFromTimestamp) return false;
      return true;
    });

    if (fetchedMessages.length === 0) break;

    if (member) {
      fetchedMessages = fetchedMessages.filter(
        (m) => m.author.id === member.id
      );
    }

    messages = [...messages, ...fetchedMessages];
  }

  if (messages.length === 0) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Couldn't find any messages that meet your criteria. Please note that bots can't delete messages older than 14 days."
      )
    );
  }

  messages = messages.slice(0, amount);

  try {
    await client.rest.channels.deleteMessages(
      interaction.channelID,
      messages.map((m) => m.id),
      reason
    );
  } catch (e: any) {
    client.logger.error(e);

    return interaction.editOriginal(
      interaction.getErrorReply(
        "Something went wrong trying to delete messages. Please check bot logs."
      )
    );
  }

  await interaction.editOriginal(
    interaction.getSuccessReply(
      `${messages.length} messages have been successfully deleted;.`
    )
  );

  await GuildLogService.postLog({
    guildID: guild.id,
    channelID: generalPanel?.logChannelID,
    content: {
      embeds: [
        {
          color: interaction.colors.default,
          title: "Log Entry: Purge",
          fields: [
            {
              name: "Amount",
              value: messages.length.toString(),
            },
            {
              name: "Executed By",
              value: `${interactionMember.username} (${interactionMember.id})`,
            },
          ],
          timestamp: new Date().toISOString(),
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

  await GuildLogService.postLog({
    guildID: guild.id,
    channelID: generalPanel?.logChannelID,
    content: { content: "**Deleted Messages,**" },
    files: [
      {
        name: "messages.txt",
        contents: Buffer.from(deletedMessages, "utf-8"),
      },
    ],
  });
}

export = {
  execute,
  options: {
    name: "purge",
    description: "Purge messages in a channel",
    options: [
      {
        name: "amount",
        description: "No. of messages to delete",
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
        max_value: 1000,
        min_value: 1,
        required: true,
      },
      {
        name: "member",
        description: "Only delete messages from a member",
        type: Constants.ApplicationCommandOptionTypes.USER,
        required: false,
      },
      {
        name: "reason",
        description: "Reason for deletion",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: false,
      },
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
