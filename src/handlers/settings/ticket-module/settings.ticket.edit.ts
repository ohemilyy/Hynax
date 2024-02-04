import {
	ComponentInteraction,
	Constants,
	ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsTicket from "./settings.ticket";

const prisma = DatabaseService.getClient();

async function execute(
	interaction: ComponentInteraction | ModalSubmitInteraction
) {
	if (!interaction.guildID) return;

	const parts = interaction.data.customID.split("-");
	const field = parts[1].trim();

	if (interaction instanceof ComponentInteraction) {
		if (field === "channelNameFormat") {
			return interaction.createModal({
				title: "Set Channel Name Format",
				customID: interaction.data.customID,
				components: [
					{
						type: Constants.ComponentTypes.ACTION_ROW,
						components: [
							{
								label: "Format",
								type: Constants.ComponentTypes.TEXT_INPUT,
								style: Constants.TextInputStyles.SHORT,
								customID: "value",
								placeholder:
									"ticket-{number} | {emoji}-{number} | {emoji}-{username} | {tag}",
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

	await prisma.guildTicketConfig.upsert({
		where: {
			guildID: interaction.guildID,
		},
		create: {
			[field]: value,
			guildID: interaction.guildID,
		},
		update: {
			[field]: value,
		},
	});

	await settingsTicket.execute(interaction);
}

export = {
	id: "settings.ticket.edit",
	execute,
};
