import { ComponentInteraction, ComponentTypes } from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsTicket from "./settings.ticket";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction<ComponentTypes.STRING_SELECT>
) {
  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  if (!interaction.guildID) return;

  const panelID = interaction.data.values.getStrings()[0].split("-")[1];

  await prisma.guildTicketPanel.deleteMany({
    where: {
      id: panelID,
      guildID: interaction.guildID,
    },
  });

  interaction.data.customID = `settings.ticket`;

  await settingsTicket.execute(interaction);
}

export = {
  id: "settings.ticket.manage_panel.delete",
  execute,
};
