import {
  CommandInteraction,
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
  TextChannel,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { GeneralService } from "../../../service/GeneralService";
import { getSuccessReply } from "../../../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(interaction: ModalSubmitInteraction) {
  if (!interaction.member || !interaction.guildID) return;
  await interaction.defer(64);

  const content = interaction.options.getString("content", true);
  const title = interaction.options.getString("title", true);
  const description = interaction.options.getString("description", false);
  const imageUrl = interaction.options.getString("image_url", false);

  await interaction.channel?.createMessage({
    content,
    embeds: [
      {
        color: interaction.colors.default,
        title,
        description: description || undefined,
        image: imageUrl ? { url: imageUrl } : undefined,
      },
    ],
  });

  await interaction.editOriginal(getSuccessReply("Announcement sent!"));
}

export = {
  id: "action.announcement.create",
  execute,
};
