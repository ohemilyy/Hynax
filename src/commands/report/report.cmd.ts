import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
  Client,
} from "oceanic.js";

async function execute(interaction: CommandInteraction, client: Client) {
  if (!interaction.guildID || !interaction.member) {
    return interaction.createMessage({
      ...interaction.getErrorReply(
        "This command can only be used inside servers."
      ),
      flags: 64,
    });
  }

  const member = interaction.data.resolved.members.first();
  if (!member) {
    return interaction.createMessage({
      ...interaction.getErrorReply("Please mention a user to report."),
      flags: 64,
    });
  }

  return interaction.createModal({
    title: "Report Member",
    customID: `action.report.create-${member.id}`,
    components: [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            label: "Reason",
            type: Constants.ComponentTypes.TEXT_INPUT,
            style: Constants.TextInputStyles.PARAGRAPH,
            customID: "reason",
            placeholder: "Enter a reason for this report.",
            required: true,
          },
        ],
      },
    ],
  });
}

export = {
  execute,
  options: {
    name: "report",
    type: Constants.ApplicationCommandTypes.USER,
  } as CreateApplicationCommandOptions,
};
