import {
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { MENU_BACK_BTN_LABEL, MENU_HOME_BTN_LABEL } from "../../../constants";
import { DatabaseService } from "../../../service/DatabaseService";

const prisma = DatabaseService.getClient();

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  let panel;

  if (
    interaction instanceof ComponentInteraction &&
    interaction.data.componentType === Constants.ComponentTypes.STRING_SELECT
  ) {
    panel = await prisma.guildTicketPanel.findFirst({
      where: {
        id: interaction.data.values.getStrings()[0].split("-")[1],
      },
    });
  } else {
    panel = await prisma.guildTicketPanel.findFirst({
      where: { id: interaction.data.customID.split("-")[1] },
    });
  }

  if (!panel) {
    return interaction.createFollowup(
      interaction.getErrorReply("Failed to find the panel.")
    );
  }

  const category =
    (panel.categoryID && interaction.guild?.channels.get(panel.categoryID)) ||
    undefined;

  const embedName = "[``Name``]: " + panel.name;

  const embedLogChannel =
    "[``Logs``]: " +
    (panel.logChannelID && panel.logChannelID !== "Not Set"
      ? `<#${panel.logChannelID}>`
      : "Not Set");

  const embedCategory =
    "[``Category``]: " + (category ? `#${category.name}` : "Not Set");

  const embedSupportRoles =
    "[``Support Roles``]: " +
    (panel.supportRoleIDs
      .map((i) => (isNaN(parseInt(i)) ? "Not Set" : `<@&${i}>`))
      .join(",") || "Not Set");

  const embedClaimRoles =
    "[``Claim Roles``]: " +
    (panel.claimRoleIDs
      .map((i) => (isNaN(parseInt(i)) ? "Not Set" : `<@&${i}>`))
      .join(",") || "Not Set");

  const embedPingRole =
    "[``Role to ping``]: " +
    (!isNaN(parseInt(panel.pingRoleID || ""))
      ? `<@&${panel.pingRoleID}>`
      : "Not Set");

  const embedQuestions =
    "[``Questions``]: \n" +
    (panel.questions.map((q, i) => `[\`\`#${i + 1}\`\`] ${q}`).join("\n") ||
      "Not Set");

  const embedButton =
    "[``Label``]: " + panel.btnLabel + "\n[``Emoji``]: " + panel.emoji;

  await interaction.editOriginal({
    embeds: [
      {
        title: "Ticket Panel Editor",
        color: interaction.colors.default,
        description: `${embedName}\n${embedLogChannel}\n${embedCategory}\n${embedSupportRoles}\n${embedClaimRoles}\n${embedPingRole}\n\n${embedQuestions}`,
        fields: [{ name: "Button", value: embedButton }],
      },
    ],
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.STRING_SELECT,
            placeholder: "Select an option to configure",
            customID: "settings.ticket.manage_panel.select_root",
            options: [
              {
                label: "Name",
                value: `settings.ticket.manage_panel.edit-${panel.id}-name`,
                description: "Rename the panel",
              },
              {
                label: "Log Channel",
                value: `settings.ticket.manage_panel.edit-${panel.id}-logChannelID`,
                description: "Set the log channel for the panel",
              },
              {
                label: "Category Channel",
                value: `settings.ticket.manage_panel.edit-${panel.id}-categoryID`,
                description:
                  "Set the category channel for tickets created by the panel",
              },
              {
                label: "Support Roles",
                value: `settings.ticket.manage_panel.edit-${panel.id}-supportRoleIDs`,
                description:
                  "Set the roles that can view and manage tickets created by the panel",
              },
              {
                label: "Claim Roles",
                value: `settings.ticket.manage_panel.edit-${panel.id}-claimRoleIDs`,
                description:
                  "Set the roles that can claim tickets created by the panel",
              },
              {
                label: "Ping Role",
                value: `settings.ticket.manage_panel.edit-${panel.id}-pingRoleID`,
                description:
                  "Set the role to ping when a ticket is created by the panel",
              },
              {
                label: "Questions",
                value: `settings.ticket.manage_panel.edit-${panel.id}-questions`,
                description:
                  "Set the questions to ask when a ticket is created by someone",
              },
              {
                label: "Button Emoji",
                value: `settings.ticket.manage_panel.edit-${panel.id}-emoji`,
                description: "Set the emoji for the create ticket button",
              },
              {
                label: "Button Label",
                value: `settings.ticket.manage_panel.edit-${panel.id}-btnLabel`,
                description: "Set the label for the create ticket button",
              },
              {
                label: "Delete Panel",
                value: `settings.ticket.manage_panel.delete-${panel.id}`,
                description: "Delete this panel",
              },
            ],
          },
        ],
      },
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            customID: "settings.ticket",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_BACK_BTN_LABEL,
            style: Constants.ButtonStyles.SECONDARY,
          },
          {
            customID: "settings.base",
            type: Constants.ComponentTypes.BUTTON,
            label: MENU_HOME_BTN_LABEL,
            style: Constants.ButtonStyles.SUCCESS,
          },
        ],
      },
    ],
  });
}

export = {
  id: "settings.ticket.manage_panel",
  execute,
};
