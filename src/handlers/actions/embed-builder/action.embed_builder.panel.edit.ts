import {
  ComponentInteraction,
  Constants,
  ModalSubmitInteraction,
} from "oceanic.js";

async function execute(
  interaction: ComponentInteraction | ModalSubmitInteraction
) {
  const property = interaction.data.customID.split("-")[1];

  if (interaction instanceof ComponentInteraction) {
    if (property === "author") {
      return interaction.createModal({
        title: "Edit Author",
        customID: "action.embed_builder.panel.edit-" + property,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Author",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "name",
                placeholder: "Write author here",
                required: true,
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Icon URL",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "icon_url",
                placeholder: "Supports Discord links, Imgur links, etc",
                required: false,
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "URL",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "url",
                placeholder: "HTTPS to hyperlink on author",
                required: false,
              },
            ],
          },
        ],
      });
    }

    if (property === "footer") {
      return interaction.createModal({
        title: "Edit Footer",
        customID: "action.embed_builder.panel.edit-" + property,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Footer",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "text",
                placeholder: "Write footer here",
                required: true,
              },
            ],
          },
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Icon URL",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "icon_url",
                placeholder: "Supports Discord links, Imgur links, etc",
                required: false,
              },
            ],
          },
        ],
      });
    }

    if (property === "fields") {
      return interaction.createModal({
        title: "Edit Fields",
        customID: "action.embed_builder.panel.edit-" + property,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Fields (Don't remove split)",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.PARAGRAPH,
                customID: "fields",
                value: "Field 1 | Value \nField 2 | Value\n",
                required: true,
              },
            ],
          },
        ],
      });
    }

    if (property === "post") {
      return interaction.createModal({
        title: "Post Embed",
        customID: "action.embed_builder.panel.edit-" + property,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Channel ID",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: "id",
                placeholder: "Place channel ID here",
                required: false,
              },
            ],
          },
        ],
      });
    }

    if (property === "ping_roles") {
      return interaction.createModal({
        title: "Ping Roles",
        customID: "action.embed_builder.panel.edit-" + property,
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                label: "Roles",
                type: Constants.ComponentTypes.TEXT_INPUT,
                style: Constants.TextInputStyles.SHORT,
                customID: property,
                placeholder:
                  "Place role ID here for multiple do: 13243232, 343425435",
                required: false,
              },
            ],
          },
        ],
      });
    }

    return interaction.createModal({
      title: `Set ${property}`,
      customID: "action.embed_builder.panel.edit-" + property,
      components: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              label: property,
              type: Constants.ComponentTypes.TEXT_INPUT,
              style: Constants.TextInputStyles.PARAGRAPH,
              customID: property,
              placeholder: "Write text, image links or color hex",
              required: true,
            },
          ],
        },
      ],
    });
  }

  if (!interaction.acknowledged) {
    await interaction.deferUpdate().catch((_) => {});
  }

  if (!interaction.guildID) return;

  const messsage = await interaction.getOriginal();
  let content = messsage.content;
  const embed = messsage.embeds[0];

  if (property.includes("author")) {
    embed.author = {
      name: interaction.options.getString("name", true),
      url: interaction.options.getString("url", false) || undefined,
      iconURL: interaction.options.getString("icon_url", false) || undefined,
    };
  } else if (property.includes("footer")) {
    embed.footer = {
      text: interaction.options.getString("text", true),
      iconURL: interaction.options.getString("icon_url", false) || undefined,
    };
  } else if (["image", "thumbnail"].includes(property)) {
    const url =
      interaction.options.getString("image", false) ||
      interaction.options.getString("thumbnail", false);
    //@ts-ignore
    embed[property] = { url };
  } else if (property === "color") {
    embed.color = parseInt(
      interaction.options.getString(property, true).replace("#", "0x")
    );
  } else if (property === "fields") {
    const fields = interaction.options.getString(property, true);
    if (!embed.fields) embed.fields = [];

    fields.split("\n").forEach((f) => {
      const parts = f.split("|");
      embed.fields?.push({ name: parts[0].trim(), value: parts[1].trim() });
    });
  } else if (property === "timestamp") {
    embed.timestamp = new Date(
      interaction.options.getString(property, true)
    ).toString();
  } else if (property === "ping_roles") {
    content = interaction.options
      .getString("ping_roles", true)
      .split(",")
      .map((r) => `<@&${r.trim()}>`)
      .join(",");
  } else if (property !== "post") {
    //@ts-ignore
    embed[property] = interaction.options.getString(property, true);
  }

  // panel edit
  if (property! !== "post") {
    return await interaction.editOriginal({
      embeds: [embed],
      content: content || undefined,
    });
  }

  // create the embed
  const channelID =
    interaction.options.getString("id", false) || interaction.channel?.id;

  if (!channelID) return;

  await interaction.client.rest.channels.createMessage(channelID, {
    embeds: [embed],
    content: content || undefined,
  });

  // remove edit panel
  await interaction.editOriginal({
    ...interaction.getSuccessReply(`Embed has been posted in <#${channelID}>.`),
    components: [],
    content: undefined,
  });
}

export = {
  id: "action.embed_builder.panel.edit",
  execute,
};
