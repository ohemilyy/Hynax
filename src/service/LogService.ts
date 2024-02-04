import pino from "pino";

export class LogService {
	private static logger = pino(
		pino.transport({
			targets: [
				{
					level: "info",
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "dd-mm-yyyy h:MM:ss TT",
						ignore: "pid,hostname",
					},
				},
				{
					level: "info",
					target: "pino-pretty",
					options: {
						colorize: false,
						translateTime: "dd-mm-yyyy h:MM:ss TT",
						ignore: "pid,hostname",
						destination: `${__dirname}/../../logs/logs`,
					},
				},
			],
		})
	);

	public static getLogger() {
		return this.logger;
	}
}
