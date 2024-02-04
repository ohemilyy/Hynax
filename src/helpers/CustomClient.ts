import {
  Client,
  ClientOptions,
  CommandInteraction,
  CreateApplicationCommandOptions,
  Interaction,
  InteractionTypes,
  ModalSubmitInteraction,
} from "oceanic.js";
import { resolve } from "path";
import { getDirFiles } from "../util/common.util";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getBotConfig } from "../util/config.util";
import { LogService } from "../service/LogService";
import { ModalSubmitOptionResolver } from "./ModalSubmitOptionResolver";
import { InteractionHandler } from "./InteractionHandler";
import { createHash } from "crypto";
import { GeneralService } from "../service/GeneralService";
const config = getBotConfig();

export type CustomApplicationCommand = {
  execute: (interaction: CommandInteraction, client: Client) => Promise<any>;
  options: CreateApplicationCommandOptions;
};

export type CustomModalSubmitInteraction = ModalSubmitInteraction & {
  options: ModalSubmitOptionResolver;
};

export class CustomClient extends Client {
  public readonly logger = LogService.getLogger();
  private commands: Map<string, CustomApplicationCommand>;
  private interactionHandler: InteractionHandler;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Map();
    this.registerEventListeners().catch((e) => {
      this.logger.error(e);
    });
    this.interactionHandler = new InteractionHandler();
  }

  private registerEventListeners = async () => {
    const eventListeners: any = {
      once: {
        ready: [{ execute: this.handleOnReady }],
      },
      on: {
        interactionCreate: [{ execute: this.handleInteractionCreate }],
        error: [{ execute: this.handleOnError }],
      },
    };

    const eventsDirPath = resolve(`${__dirname}/../events`);

    let eventFiles: string[] = [];

    if (existsSync(eventsDirPath)) {
      eventFiles = await getDirFiles(eventsDirPath, [".event.js", ".event.ts"]);
    }

    for (const f of eventFiles) {
      const event = await import(f).catch((e) => {
        this.logger.error(e);
      });
      if (!event) continue;

      const eventType = event.once ? "once" : "on";

      if (eventListeners[eventType][event.name]) {
        eventListeners[eventType][event.name].push(event);
      } else {
        eventListeners[eventType][event.name] = [event];
      }
    }

    let onceListenerCount = 0;
    let alwaysListenerCount = 0;

    for (const eventType of Object.keys(eventListeners)) {
      for (const eventName of Object.keys(eventListeners[eventType])) {
        //@ts-ignore
        this[eventType](eventName, (...args) => {
          for (const event of eventListeners[eventType][eventName]) {
            if (!event.execute) {
              this.logger.error(
                `failed to find execute() for [${eventType}][${eventName}]->${event}.event`
              );
            }

            event?.execute(...args, this)?.catch((e: any) => {
              this.logger.error(e);
            });
          }
        });

        eventType === "once" ? onceListenerCount++ : alwaysListenerCount++;
      }
    }

    this.logger.info(
      `custom-client: registered ${
        onceListenerCount + alwaysListenerCount
      } [once: ${onceListenerCount} | always: ${alwaysListenerCount}] event listeners`
    );
  };

  private loadCommands = async () => {
    const commandsDirPath = resolve(`${__dirname}/../commands`);

    let commandFiles: string[] = [];

    if (existsSync(commandsDirPath)) {
      commandFiles = await getDirFiles(commandsDirPath, [".cmd.js", ".cmd.ts"]);
    }

    const commands: CreateApplicationCommandOptions[] = [];

    for (const f of commandFiles) {
      const command = await import(f).catch((e) => {
        this.logger.error(e);
      });

      if (!command) continue;

      commands.push(command.options);
      this.commands.set(command.options.name, command);
    }

    // stringify commands array and calculate sha-256 hash
    const commandsHash = createHash("sha256")
      .update(JSON.stringify(commands))
      .digest("hex");

    // file used to store the hash of the last registered commands
    const changesFile = resolve(
      `${__dirname}/../../${
        config.PRODUCTION ? "cmdhash-production" : "cmdhash-dev"
      }`
    );

    // check if commands have changed before re-registering them again
    if (existsSync(changesFile)) {
      const oldHash = readFileSync(changesFile, "utf-8");
      if (oldHash === commandsHash) {
        this.logger.info(
          `custom-client: no changes to application commands detected`
        );
        return;
      }
    }

    if (config.PRODUCTION) {
      await this.application
        .bulkEditGuildCommands(config["TEST GUILD ID"], [])
        .catch((_) => {});
      await this.application.bulkEditGlobalCommands(commands);
    } else {
      await this.application.bulkEditGuildCommands(
        config["TEST GUILD ID"],
        commands
      );
      await this.application.bulkEditGlobalCommands([]).catch((_) => {});
    }

    // write commands hash to file
    writeFileSync(changesFile, commandsHash);

    this.logger.info(
      `custom-client: loaded ${this.commands.size} application commands`
    );
  };

  private handleOnReady = async () => {
    this.editStatus(config["STATUS"], [
      {
        name: config["ACTIVITY NAME"],
        type: config["ACTIVITY TYPE"],
      },
    ]);

    await this.loadCommands();

    let devServerName = "";

    if (!config.PRODUCTION) {
      devServerName =
        this.guilds.get(config["TEST GUILD ID"])?.name || "unknown";
    }

    this.logger.info(
      `bot: ready [${this.user.username}#${this.user.discriminator}] [${
        config.PRODUCTION ? "PRODUCTION" : `DEVELOPMENT (${devServerName})`
      }]`
    );
  };

  private handleInteractionCreate = async (interaction: Interaction) => {
    try {
      //@ts-ignore
      const guildID = interaction["guildID"];
      const defaultColor = GeneralService.getDefaultColor(guildID);
      const successColor = GeneralService.getSuccessColor(guildID);
      const errorColor = GeneralService.getErrorColor(guildID);

      interaction.colors = {
        default: defaultColor,
        error: errorColor,
        success: successColor,
      };

      interaction.getDefaultReply = (text: string) => ({
        embeds: [
          {
            description: text,
            color: defaultColor,
          },
        ],
      });

      interaction.getSuccessReply = (text: string) => ({
        embeds: [
          {
            description: text,
            color: successColor,
          },
        ],
      });

      interaction.getErrorReply = (text: string) => ({
        embeds: [
          {
            description: text,
            color: errorColor,
          },
        ],
      });

      if (interaction instanceof CommandInteraction) {
        const command = this.commands.get(interaction.data.name);
        if (command) await command.execute(interaction, this);
      }

      if (interaction instanceof ModalSubmitInteraction) {
        (interaction as CustomModalSubmitInteraction).options =
          new ModalSubmitOptionResolver(interaction.data);
      }

      await this.interactionHandler.checkInteraction(interaction);
    } catch (e) {
      this.logger.error(e);
    }
  };

  private handleOnError = async (e: any) => {
    this.logger.error(e);
  };
}
