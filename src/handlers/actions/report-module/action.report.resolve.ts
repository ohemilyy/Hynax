import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
  TextChannel,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(interaction: ComponentInteraction) {
  if (!interaction.member || !interaction.guildID) return;
  await interaction.defer(64);

  let hasPermission = interaction.memberPermissions?.has("ADMINISTRATOR");
  if (!hasPermission) {
    const panel = await prisma.guildReportPanel.findUnique({
      where: {
        guildID: interaction.guildID,
      },
    });

    const accessRoles = panel?.accessRoleIDs || [];

    hasPermission = accessRoles.some((roleId) =>
      interaction.member?.roles.includes(roleId.trim())
    );
  }

  if (!hasPermission) {
    await interaction.editOriginal(
      interaction.getErrorReply(
        "You don't have permission to run this command."
      )
    );
    return;
  }

  const reportID = interaction.data.customID.split("-")[1];

  const report = prisma.guildReport.findUnique({
    where: {
      id: reportID,
    },
  });

  if (!report) {
    await interaction.editOriginal(
      interaction.getErrorReply("This report does not exist.")
    );
    return;
  }

  const message = await interaction.channel?.messages.get(
    interaction.message.id
  );

  if (!message) {
    await interaction.editOriginal(
      interaction.getErrorReply("This message does not exist.")
    );
    return;
  }

  message.embeds.forEach((embed) => {
    embed.title += " (Resolved)";
  });

  await message.edit({
    embeds: message.embeds,
    components: [],
  });

  await prisma.guildReport.update({
    where: {
      id: reportID,
    },
    data: {
      status: "resolved",
    },
  });

  await interaction.editOriginal(
    interaction.getSuccessReply("This report has been marked as resolved.")
  );
}

export = {
  id: "action.report.resolve",
  execute,
};
