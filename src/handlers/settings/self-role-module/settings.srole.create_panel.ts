import {
	ComponentInteraction,
	Constants,
	ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import settingsSrole from "./settings.srole";

const prisma = DatabaseService.getClient();

async function execute(
	interaction: ComponentInteraction | ModalSubmitInteraction
) {
	if (interaction instanceof ComponentInteraction) {
		return interaction.createModal({
			title: "Create Panel",
			customID: interaction.data.customID,
			components: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Panel Name",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.SHORT,
							placeholder: "Write your new panel name",
							customID: "name",
						},
					],
				},
			],
		});
	}

	if (!interaction.guildID) return;

	if (!interaction.acknowledged) {
		await interaction.deferUpdate().catch((_) => {});
	}

	const name = interaction.options.getString("name", true).trim();

	const duplicate = await prisma.guildSelfRolePanel.findFirst({
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

	await prisma.guildSelfRolePanel.create({
		data: {
			name,
			guildID: interaction.guildID,
			giveRoleIDs: "",
			buttonEmoji: "😊",
			buttonLabel: "Obtain Roles",
		},
	});

	await settingsSrole.execute(interaction);
}

export = {
	id: "settings.srole.create_panel",
	execute,
};
