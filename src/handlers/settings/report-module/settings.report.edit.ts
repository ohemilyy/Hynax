import {
  ChannelTypes,
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsReport from "./settings.report";

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
    if (field === "channelID") {
      return interaction.createModal({
        title: "Set Report Log Channel",
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

    if (field === "accessRoleIDs") {
      return interaction.createModal({
        title: `Set Access Roles`,
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

  if (field === "channelID") {
    const channel = interaction.guild?.channels.get(value.toString());

    if (!channel || channel.type !== ChannelTypes.GUILD_TEXT) {
      return interaction.createFollowup({
        ...interaction.getErrorReply("Please provide a valid text channel!"),
        flags: 64,
      });
    }
  }

  if (field.toLowerCase().endsWith("ids")) {
    // @ts-ignore
    value = value.split(",").map((v) => v.trim());
  }

  await DatabaseService.upsertGuildConfig(
    interaction.guildID,
    "guildReportPanel",
    field,
    value
  );

  interaction.data.customID = "settings.report";
  await settingsReport.execute(interaction);
}

export = {
  id: "settings.report.edit",
  execute,
};
