import { GuildTicketPanel } from "@prisma/client";
import {
	ComponentInteraction,
	Constants,
	ModalSubmitInteraction,
} from "oceanic.js";
import { DatabaseService } from "../../../service/DatabaseService";
import { getComponentRows, getEmojiFromInput } from "../../../util/common.util";

const prisma = DatabaseService.getClient();

async function execute(
	interaction: ComponentInteraction | ModalSubmitInteraction
) {
	if (interaction instanceof ComponentInteraction) {
		return await interaction.createModal({
			title: "Post Ticket Embed",
			customID: "settings.ticket.create_embed",
			components: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Title",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.SHORT,
							customID: "title",
							placeholder: "Write title here",
							required: true,
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Color",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.SHORT,
							placeholder: "#ffffff (hex codes)",
							customID: "color",
							required: true,
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Description",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.PARAGRAPH,
							customID: "description",
							placeholder: "Write description here",
							required: true,
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Image",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.SHORT,
							customID: "image",
							placeholder: "Supports Discord links, Imgur links, etc",
							required: false,
						},
					],
				},
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							label: "Panels (Accurate order)",
							type: Constants.ComponentTypes.TEXT_INPUT,
							style: Constants.TextInputStyles.PARAGRAPH,
							customID: "panels",
							required: true,

							placeholder:
								"Panel Name 1\nPanel Name 2\n\nThis will display the buttons in order",
						},
					],
				},
			],
		});
	}

	if (!interaction.guildID) return;

	if (!interaction.acknowledged) {
		await interaction.defer(64).catch((_) => {});
	}

	const title = interaction.options.getString("title", true);
	const description = interaction.options.getString("description", true);
	const image = interaction.options.getString("image", false);
	const panels = interaction.options.getString("panels", true);
	const color = parseInt(
		interaction.options.getString("color", true).replace("#", "0x")
	);

	const ticketPanels: GuildTicketPanel[] = [];

	for (const p of panels.split("\n")) {
		const record = await prisma.guildTicketPanel.findFirst({
			where: {
				guildID: interaction.guildID,
				name: p.trim(),
			},
		});

		if (!record) continue;

		ticketPanels.push(record);
	}

	if (ticketPanels.length === 0) {
		return interaction.editOriginal(
			interaction.getErrorReply("Please provide at least one ticket panel.")
		);
	}

	await interaction.channel?.createMessage({
		embeds: [
			{
				title,
				description,
				image: (image && { url: image }) || undefined,
				color,
			},
		],
		components: getComponentRows(
			ticketPanels.map((t, i) => {
				return {
					emoji: getEmojiFromInput(t.emoji),
					type: Constants.ComponentTypes.BUTTON,
					label: t.btnLabel,
					style: Constants.ButtonStyles.SECONDARY,
					customID: `action.ticket.create-${t.id}-${i}`,
				};
			})
		),
	});

	await interaction.editOriginal(
		interaction.getSuccessReply("Ticket embed has been created.")
	);
}

export = {
	id: "settings.ticket.create_embed",
	execute,
};
