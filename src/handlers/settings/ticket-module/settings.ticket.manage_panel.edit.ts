import {
  ChannelTypes,
  ComponentInteraction,
  ComponentTypes,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsTicketManagePanel from "./settings.ticket.manage_panel";

const prisma = DatabaseService.getClient();

async function execute(
  interaction:
    | ComponentInteraction<ComponentTypes.STRING_SELECT>
    | ModalSubmitInteraction
) {
  if (!interaction.guildID) return;
  1;
  const customID =
    interaction instanceof ModalSubmitInteraction
      ? interaction.data.customID
      : interaction.data.values.getStrings()[0];

  const parts = customID.split("-");
  const panelID = parts[1];
  const field = parts[2];

  if (interaction instanceof ComponentInteraction) {
    switch (field) {
      case "name": {
        return interaction.createModal({
          title: "Set Panel Name",
          customID: customID,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  label: "Set Panel Name",
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

      case "logChannelID": {
        return interaction.createModal({
          title: "Set Log Channel",
          customID: customID,
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

      case "categoryID": {
        return interaction.createModal({
          title: "Set Category Channel",
          customID: customID,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  label: "Category ID",
                  type: Constants.ComponentTypes.TEXT_INPUT,
                  style: Constants.TextInputStyles.SHORT,
                  customID: "value",
                  placeholder: "Place category ID here",
                  required: true,
                },
              ],
            },
          ],
        });
      }

      case "supportRoleIDs": {
        return interaction.createModal({
          title: "Set Support Roles",
          customID: customID,
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

      case "claimRoleIDs": {
        return interaction.createModal({
          title: "Set Claim Roles",
          customID: customID,
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

      case "pingRoleID": {
        return interaction.createModal({
          title: "Set Ping Role",
          customID: customID,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  label: "Role ID",
                  type: Constants.ComponentTypes.TEXT_INPUT,
                  style: Constants.TextInputStyles.SHORT,
                  customID: "value",
                  placeholder: "Place role ID here",
                  required: true,
                },
              ],
            },
          ],
        });
      }

      case "questions": {
        return interaction.createModal({
          title: "Set Questions",
          customID: customID,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  label: "Questions (Character limit is 45)",
                  type: Constants.ComponentTypes.TEXT_INPUT,
                  style: Constants.TextInputStyles.PARAGRAPH,
                  placeholder:
                    "Question 1?\nQuestion 2\nQuestion 3\n\nMaximum of 3 questions.",
                  customID: "value",
                  required: true,
                },
              ],
            },
          ],
        });
      }

      case "emoji": {
        return interaction.createModal({
          title: "Set Button Emoji",
          customID: customID,
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

      case "btnLabel": {
        return interaction.createModal({
          title: "Set Button Label",
          customID: customID,
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  label: "Label",
                  type: Constants.ComponentTypes.TEXT_INPUT,
                  style: Constants.TextInputStyles.SHORT,
                  placeholder: "Label for button to create ticket",
                  customID: "value",
                  required: true,
                },
              ],
            },
          ],
        });
      }
    }

    return;
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  let inputValue = interaction.options.getString("value", true).trim();

  if (field.toLocaleLowerCase().endsWith("ids")) {
    //@ts-ignore
    inputValue = inputValue.split(",").map((i) => i.trim());
  }

  switch (field) {
    case "categoryID": {
      const category = interaction.guild?.channels.get(inputValue);

      if (!category || category.type !== ChannelTypes.GUILD_CATEGORY) {
        return interaction.createFollowup({
          ...interaction.getErrorReply(
            "Please provide the ID of a valid category channel!"
          ),
          flags: 64,
        });
      }

      await prisma.guildTicketPanel.update({
        data: {
          categoryID: category.id,
        },
        where: {
          id: panelID,
        },
      });
      break;
    }

    case "logChannelID": {
      const channel = interaction.guild?.channels.get(inputValue);

      if (!channel || channel.type !== ChannelTypes.GUILD_TEXT) {
        return interaction.createFollowup({
          ...interaction.getErrorReply(
            "Please provide the ID of a valid text channel!"
          ),
          flags: 64,
        });
      }

      await prisma.guildTicketPanel.update({
        data: {
          logChannelID: channel.id,
        },
        where: {
          id: panelID,
        },
      });
      break;
    }

    case "questions": {
      let questions = inputValue
        .split("\n")
        .map((v) => v.trim())
        .filter((v) => v);

      if (questions.length > 5) {
        questions = questions.slice(0, 5);
      }

      await prisma.guildTicketPanel.update({
        data: {
          questions,
        },
        where: {
          id: panelID,
        },
      });

      break;
    }

    default: {
      await prisma.guildTicketPanel.update({
        data: {
          [field]: inputValue,
        },
        where: {
          id: panelID,
        },
      });
    }
  }

  await settingsTicketManagePanel.execute(interaction);
}

export = {
  id: "settings.ticket.manage_panel.edit",
  execute,
};
