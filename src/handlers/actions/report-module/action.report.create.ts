import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
  TextChannel,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { GuildLogService } from "../../../service/GuildLogService";

const prisma = DatabaseService.getClient();

async function execute(interaction: ModalSubmitInteraction) {
  if (!interaction.member || !interaction.guildID) return;
  await interaction.defer(64);

  const existingReport = await prisma.guildReport.findFirst({
    where: {
      guildID: interaction.guildID,
      createdMemberID: interaction.member.id,
      status: "open",
    },
  });

  if (existingReport) {
    await interaction.editOriginal(
      interaction.getErrorReply(
        "You already have an open report. Please wait for it to be resolved."
      )
    );
    return;
  }

  const reportPanel = await prisma.guildReportPanel.findUnique({
    where: {
      guildID: interaction.guildID,
    },
  });

  if (!reportPanel?.channelID) {
    await interaction.editOriginal(
      interaction.getErrorReply(
        "This server does not have a report panel set up."
      )
    );
    return;
  }

  const reportChannel = (await interaction.guild?.channels.get(
    reportPanel.channelID
  )) as TextChannel | undefined;

  if (!reportChannel) {
    await interaction.editOriginal(
      interaction.getErrorReply(
        "This server does not have a report panel set up."
      )
    );
    return;
  }

  const reason = interaction.options.getString("reason", true);
  const reportMemberId = interaction.data.customID.split("-")[1].trim();
  const reportedMember = await interaction.guild?.getMember(reportMemberId);

  if (!reportedMember) {
    await interaction.editOriginal(
      interaction.getErrorReply("The user you mentioned is not in this server.")
    );
    return;
  }

  const report = await prisma.guildReport.create({
    data: {
      guildID: interaction.guildID,
      createdMemberID: interaction.member.id,
      createdMemberUsername: interaction.member.username,
      reportedMemberID: reportedMember?.id,
      reportedMemberUsername: reportedMember?.username,
      reason: reason,
    },
  });

  await reportChannel.createMessage({
    embeds: [
      {
        color: interaction.colors.default,
        title: `Report from ${interaction.member.username}`,
        description: `**Reason,**\n${reason}`,
        fields: [
          {
            name: "Reported Member",
            value: `${reportedMember.username} (<@${reportedMember.id}>)`,
          },
          {
            name: "Submitted By",
            value: `${interaction.member.username} (<@${interaction.member.id}>)`,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: `Report ID: ${report.id}`,
        },
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            label: "Mark as Resolved",
            style: Constants.ButtonStyles.SUCCESS,
            customID: `action.report.resolve-${report.id}`,
          },
        ],
      },
    ],
  });
}

export = {
  id: "action.report.create",
  execute,
};
