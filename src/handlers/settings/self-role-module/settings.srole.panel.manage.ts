import {
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsSrolePanel from "./settings.srole.panel";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction<ComponentTypes.STRING_SELECT>
    | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;

  const customID =
    interaction instanceof ModalSubmitInteraction
      ? interaction.data.customID
      : interaction.data.values.getStrings()[0];

  const parts = customID.split("-");
  const field = parts[1].trim();
  const panelID = parts[2].trim();

  if (interaction instanceof ComponentInteraction) {
    if (field === "name") {
      return interaction.createModal({
        title: "Set Panel Name",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Name",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "Write panel name here",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "giveRoleIDs") {
      return interaction.createModal({
        title: "Set Give Roles",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Roles",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                placeholder:
                  "Place role ID here for multiple do: 13243232, 343425435",
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "buttonEmoji") {
      return interaction.createModal({
        title: "Set Button Emoji",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Emoji",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                placeholder: "Unicode Emoji from https://emojipedia.org/",
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "buttonLabel") {
      return interaction.createModal({
        title: "Set Button Label",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Label",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                placeholder: "Label for button to create app",
                customID: "value",
                required: true,
              },
            ],
          },
        ],
      });
    }
    return;
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  // get value from modal submission
  let value = interaction.options.getString("value", true);

  if (field.includes("RoleID") || field.includes("channelID")) {
    for (const roleID of value.split(",")) {
      if (isNaN(parseInt(roleID))) {
        return interaction.createFollowup({
          ...interaction.getErrorReply(
            `Please provide valid ${
              field.includes("RoleID") ? "Role IDs" : "Channel IDs"
            }!`
          ),
          flags: 64,
        });
      }
    }

    value = value
      .split(",")
      .map((i) => i.trim())
      .join(",");
  }

  if (field.toLowerCase().endsWith("ids")) {
    //@ts-ignore
    value = value.split(",");
  }

  await prisma.guildSelfRolePanel.update({
    data: {
      [field]: value,
    },
    where: {
      id: panelID,
    },
  });

  interaction.data.customID = `settings.srole.panel-${panelID}`;
  await settingsSrolePanel.execute(interaction);
}

export = {
  id: "settings.srole.panel.manage",
  execute,
};
