import {
  ChannelTypes,
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { GeneralService } from "../../../service/GeneralService";
import settingsGeneral from "./settings.general";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction<ComponentTypes.STRING_SELECT>
    | ModalSubmitInteraction
) {
  const customID =
    interaction instanceof ModalSubmitInteraction
      ? interaction.data.customID
      : interaction.data.values.getStrings()[0];

  const field = customID.split("-")[1]?.trim();

  if (interaction instanceof ComponentInteraction) {
    if (field === "logChannelID") {
      return interaction.createModal({
        title: "Set Log Channel",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Channel ID",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "Place channel ID here",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "defaultEmbedColor") {
      return interaction.createModal({
        title: "Set Default Embed Color",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Color",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "#ffffff (hex codes)",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "successEmbedColor") {
      return interaction.createModal({
        title: "Set Success Embed Color",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Color",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "#ffffff (hex codes)",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "errorEmbedColor") {
      return interaction.createModal({
        title: "Set Error Embed Color",
        customID,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Color",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "value",
                placeholder: "#ffffff (hex codes)",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (field === "modRoleIDs") {
      return interaction.createModal({
        title: `Set Mod Roles`,
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

    return;
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  if (!interaction.guildID) return;

  let value = interaction.options.getString("value", true).trim();

  let colorInt = 0;
  if (field.includes("EmbedColor")) {
    if (!value.startsWith("#")) value = "#" + value;

    const color = parseInt(value.replace("#", "0x"));

    if (isNaN(color)) {
      return interaction.createFollowup({
        ...interaction.getErrorReply("Please provide a valid Hex color code!"),
        flags: 64,
      });
    }

    colorInt = color;
  }

  if (field === "logChannelID") {
    const channel = interaction.guild?.channels.get(value.toString());

    if (!channel || channel.type !== ChannelTypes.GUILD_TEXT) {
      return interaction.createFollowup({
        ...interaction.getErrorReply("Please provide a valid text channel!"),
        flags: 64,
      });
    }
  }

  if (field === "modRoleIDs") {
    // @ts-ignore
    value = value.split(",").map((v) => v.trim());
  }

  if (field.includes("EmbedColor")) {
    await prisma.guildGeneralPanel.upsert({
      where: {
        guildID: interaction.guildID,
      },
      update: {
        [field]: colorInt,
        [`${field}Hex`]: value,
      },
      create: {
        [field]: colorInt,
        [`${field}Hex`]: value,
        guildID: interaction.guildID,
      },
    });
  } else {
    await DatabaseService.upsertGuildConfig(
      interaction.guildID,
      "guildGeneralPanel",
      field,
      value
    );
  }

  interaction.data.customID = "settings.general";

  await GeneralService.updateGuildSettings(interaction.guildID);
  await settingsGeneral.execute(interaction);
}

export = {
  id: "settings.general.edit",
  execute,
};
