import {
  CommandInteraction,
  Constants,
  CreateApplicationCommandOptions,
} from "oceanic.js";
import actionTicketAddMembers from "../../handlers/actions/ticket-module/action.ticket.add_members";
import actionTicketClaim from "../../handlers/actions/ticket-module/action.ticket.claim";
import actionTicketClose from "../../handlers/actions/ticket-module/action.ticket.close";
import actionTicketRemoveMembers from "../../handlers/actions/ticket-module/action.ticket.remove_members";
import actionTicketRename from "../../handlers/actions/ticket-module/action.ticket.rename";
import actionTicketBlacklist_add from "../../handlers/actions/ticket-module/action.ticket.blacklist_add";
import actionTicketBlacklist_remove from "../../handlers/actions/ticket-module/action.ticket.blacklist_remove";

async function execute(interaction: CommandInteraction) {
  const subcommand = interaction.data.options.getSubCommand(true)[0];

  switch (subcommand) {
    case "claim":
      await actionTicketClaim.execute(interaction);
      break;

    case "add-members":
      await actionTicketAddMembers.execute(interaction);
      break;

    case "remove-members":
      await actionTicketRemoveMembers.execute(interaction);
      break;

    case "transfer-members":
      await actionTicketAddMembers.execute(interaction);
      break;

    case "close":
      await actionTicketClose.execute(interaction);
      break;

    case "rename":
      await actionTicketRename.execute(interaction);
      break;

    case "blacklist-add":
      await actionTicketBlacklist_add.execute(interaction);
      break;

    case "blacklist-remove":
      await actionTicketBlacklist_remove.execute(interaction);
      break;
  }
}

export = {
  execute,
  options: {
    name: "ticket",
    description: "Manage support tickets",
    options: [
      {
        name: "claim",
        description: "Claim this support ticket",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "add-members",
        description: "Add members to this support ticket",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "remove-members",
        description: "Remove members from this support ticket",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "transfer-members",
        description:
          "Transfer members from this support ticket to a different one",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "rename",
        description: "Rename this support ticket",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "close",
        description: "Close this support ticket",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "blacklist-add",
        description: "Blacklist users from creating tickets",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
      {
        name: "blacklist-remove",
        description: "Remove users from the blacklist",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      },
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  } as CreateApplicationCommandOptions,
};
