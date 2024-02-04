import {
	CommandInteraction,
	ComponentInteraction,
	Constants,
	CreateMessageOptions,
} from "oceanic.js";

async function execute(interaction: CommandInteraction | ComponentInteraction) {
	if (!interaction.acknowledged) {
		await interaction.defer(64).catch((_) => {});
	}

	const options: CreateMessageOptions = {
		embeds: [
			{
				title: "Embed Builder",
				description:
					"You can customize this however you like, this will update in real-time when you add to it",
			},
		],
		components: [
			{
				type: Constants.ComponentTypes.ACTION_ROW,
				components: [
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-title",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Title",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-description",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Description",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-color",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Color",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-image",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Image",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-thumbnail",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Thumbnail",
					},
				],
			},
			{
				type: Constants.ComponentTypes.ACTION_ROW,
				components: [
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-url",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Link URL",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-author",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Author",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-timestamp",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Timestamp",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-footer",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Footer",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-fields",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Fields",
					},
				],
			},
			{
				type: Constants.ComponentTypes.ACTION_ROW,
				components: [
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-ping_roles",
						style: Constants.ButtonStyles.PRIMARY,
						label: "Set Ping Roles",
					},
					{
						type: Constants.ComponentTypes.BUTTON,
						customID: "action.embed_builder.panel.edit-post",
						style: Constants.ButtonStyles.SUCCESS,
						label: "Post Embed",
					},
				],
			},
		],
	};

	await interaction.editOriginal(options);
}

export = {
	id: "action.embed_builder.panel",
	execute,
};
