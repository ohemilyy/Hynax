import { PrismaClient } from "@prisma/client";

export class DatabaseService {
	private static client = new PrismaClient();

	public static getClient() {
		return this.client;
	}

	/**
	 * Upsert arbitrary values dynamically into different guild specific schemas
	 **/
	public static async upsertGuildConfig(
		guildID: string,
		schema: string,
		key: string,
		value: any
	) {
		//@ts-ignore
		await this.client[schema].upsert({
			where: {
				guildID,
			},
			update: {
				[key]: value,
			},
			create: {
				[key]: value,
				guildID,
			},
		});
	}
}
