import { Constants } from "oceanic.js";

export const DISCORD_EMOJI_REGEX = /<:(?<name>.+):(?<id>\d+)>/;

// Button labels for menus
export const MENU_BACK_BTN_LABEL = "Back";
export const MENU_BACK_BTN_STYLE = Constants.ButtonStyles.SECONDARY;

export const MENU_HOME_BTN_LABEL = "Home";
export const MENU_HOME_BTN_STYLE = Constants.ButtonStyles.SUCCESS;

// regex to identify and extract URLs from a string
export const URL_REGEX = () => /(?<url>https?:\/\/[^\s]+)/g;

// regex to identify and extract IPv4 addresses from a string
export const IPV4_REGEX = () => /(?<ip>(?:\d{1,3}\.){3}\d{1,3})/g;
