import { ComponentInteraction, ComponentTypes } from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsSrole from "./settings.srole";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction<ComponentTypes.STRING_SELECT>
) {
  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  if (!interaction.guildID) return;

  const customID = interaction.data.values.getStrings()[0];
  const panelID = customID.split("-")[1];

  await prisma.guildSelfRolePanel.deleteMany({
    where: {
      id: panelID,
      guildID: interaction.guildID,
    },
  });

  interaction.data.customID = "settings.srole";

  await settingsSrole.execute(interaction);
}

export = {
  id: "settings.srole.delete_panel",
  execute,
};
