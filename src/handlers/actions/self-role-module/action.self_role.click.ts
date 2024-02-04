import { ComponentInteraction, ComponentTypes } from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { LogService } from "../../../service/LogService";

const prisma = DatabaseService.getClient();
const logger = LogService.getLogger();

async function execute(interaction: ComponentInteraction) {
  if (!interaction.member || !interaction.guildID) return;

  await interaction.defer(64);

  let parts: string[];

  if (interaction.data.componentType === ComponentTypes.STRING_SELECT) {
    parts = interaction.data.values.getStrings()[0].split("-");
  } else {
    parts = interaction.data.customID.split("-");
  }

  const panelID = parts[1]?.trim();

  const panel = await prisma.guildSelfRolePanel.findUnique({
    where: {
      id: panelID,
    },
  });

  if (!panel) {
    return interaction.editOriginal(
      interaction.getErrorReply(
        "Unable to find the corresponding panel. Please inform the server staff."
      )
    );
  }

  for (const roleID of panel.giveRoleIDs) {
    try {
      if (interaction.member.roles.includes(roleID)) {
        await interaction.member.removeRole(roleID);
        await interaction.editOriginal(
          interaction.getSuccessReply(
            `You successfully removed <@&${roleID}> role.`
          )
        );
      } else {
        await interaction.member.addRole(roleID);
        await interaction.editOriginal(
          interaction.getSuccessReply(
            `You successfully obtained <@&${roleID}> role.`
          )
        );
      }
    } catch (e: any) {
      logger.error(e);
    }
  }
}

export = {
  id: "action.self_role.click",
  execute,
};
