import { Interaction, CreateMessageOptions } from "oceanic.js";
import { Logger } from "pino";
import { ModalSubmitOptionResolver } from "./src/helpers/ModalSubmitOptionResolver";

declare module "oceanic.js" {
	interface Interaction {
		colors: {
			default: number;
			success: number;
			error: number;
		};
		getDefaultReply: (text: string) => CreateMessageOptions;
		getSuccessReply: (text: string) => CreateMessageOptions;
		getErrorReply: (text: string) => CreateMessageOptions;
	}

	interface ModalSubmitInteraction {
		options: ModalSubmitOptionResolver;
	}

	interface Client {
		logger: Logger;
	}
}
