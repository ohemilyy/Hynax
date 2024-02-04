import { GuildGeneralPanel } from "@prisma/client";
import { Colors } from "../util/common.util";
import { DatabaseService } from "./DatabaseService";

const prisma = DatabaseService.getClient();

export class GeneralService {
	private static guildSettings: Map<string, GuildGeneralPanel> = new Map();

	static async initialize() {
		const records = await prisma.guildGeneralPanel.findMany();

		for (const record of records) {
			this.guildSettings.set(record.guildID, record);
		}
	}

	static async updateGuildSettings(guildID: string) {
		const panel = await prisma.guildGeneralPanel.findUnique({
			where: {
				guildID,
			},
		});

		if (!panel) return;
		this.guildSettings.set(panel.guildID, panel);
	}

	static getDefaultColor(guildID?: string) {
		const panel = this.guildSettings.get(guildID || "");
		return (
			(panel?.defaultEmbedColor && panel.defaultEmbedColor) || Colors.BLURPLE
		);
	}

	static getSuccessColor(guildID?: string) {
		const panel = this.guildSettings.get(guildID || "");
		return (
			(panel?.successEmbedColor && panel.successEmbedColor) || Colors.GREEN
		);
	}

	static getErrorColor(guildID?: string) {
		const panel = this.guildSettings.get(guildID || "");
		return (panel?.errorEmbedColor && panel.errorEmbedColor) || Colors.RED;
	}
}
