import { parseYAML } from "./common.util";

export function getBotConfig() {
	return parseYAML(`${getConfigDir()}/bot.yaml`);
}

function getConfigDir() {
	return `${__dirname}/../../setup`;
}
