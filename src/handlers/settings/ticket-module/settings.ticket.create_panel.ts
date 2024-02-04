import {
	ComponentInteraction,
	Constants,
	ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsTicketPanel from "./settings.ticket";

const prisma = DatabaseService.getClient();

async function execute(
	interaction: ComponentInteraction | ModalSubmitInteraction
) {
	if (!interaction.guildID) return;

	if (interaction instanceof ComponentInteraction) {
		return interaction.createModal({
			title: "Create Panel",
			customID: "settings.ticket.create_panel",
			components: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Panel Name",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.SHORT,
							placeholder: "Write your new ticket panel name",
							customID: "name",
						},
					],
				},
			],
		});
	}

	if (!interaction.acknowledged) {
		await interaction.deferUpdate().catch((_) => {});
	}

	const name = interaction.options.getString("name", true).trim();

	const duplicate = await prisma.guildTicketPanel.findFirst({
		where: {
			name,
			guildID: interaction.guildID,
		},
	});

	if (duplicate) {
		return interaction.createFollowup({
			...interaction.getErrorReply(
				"You already have a panel with the same name!"
			),
			flags: 64,
		});
	}

	await prisma.guildTicketPanel.create({
		data: {
			name,
			guildID: interaction.guildID,
			pingRoleID: "Not Set",
			categoryID: "Not Set",
			logChannelID: "Not Set",
			supportRoleIDs: "Not Set",
		},
	});

	await settingsTicketPanel.execute(interaction);
}

export = {
	id: "settings.ticket.create_panel",
	execute,
};
