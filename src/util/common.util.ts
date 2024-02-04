import { Dirent, readFileSync } from "fs";
import YAML from "yaml";
import { resolve } from "path";
import { readdir } from "fs/promises";
import { DISCORD_EMOJI_REGEX } from "../constants";
import { MessageComponent } from "oceanic.js";
import humanizeDuration from "humanize-duration";

export function parseYAML(filePath: string) {
  return YAML.parse(readFileSync(filePath, "utf8"));
}

/**
 * get all files in a directory recursively
 */
export async function getDirFiles(
  dirPath: string,
  exts: string[]
): Promise<Array<string>> {
  const dirents = await readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent: Dirent) => {
      const res = resolve(dirPath, dirent.name);
      return dirent.isDirectory() ? getDirFiles(res, exts) : res;
    })
  );
  return Array.prototype.concat(...files).filter((f: string) => {
    return exts.find((ext) => f.endsWith(ext)) ? true : false;
  });
}

export const Colors = {
  DEFAULT: 0x000000,
  WHITE: 0xffffff,
  AQUA: 0x1abc9c,
  GREEN: 0x57f287,
  BLUE: 0x3498db,
  YELLOW: 0xfee75c,
  PURPLE: 0x9b59b6,
  LUMINOUS_VIVID_PINK: 0xe91e63,
  FUCHSIA: 0xeb459e,
  GOLD: 0xf1c40f,
  ORANGE: 0xe67e22,
  RED: 0xed4245,
  GREY: 0x95a5a6,
  NAVY: 0x34495e,
  DARK_AQUA: 0x11806a,
  DARK_GREEN: 0x1f8b4c,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368a,
  DARK_VIVID_PINK: 0xad1457,
  DARK_GOLD: 0xc27c0e,
  DARK_ORANGE: 0xa84300,
  DARK_RED: 0x992d22,
  DARK_GREY: 0x979c9f,
  DARKER_GREY: 0x7f8c8d,
  LIGHT_GREY: 0xbcc0c0,
  DARK_NAVY: 0x2c3e50,
  BLURPLE: 0x5865f2,
  GREYPLE: 0x99aab5,
  DARK_BUT_NOT_BLACK: 0x2c2f33,
  NOT_QUITE_BLACK: 0x23272a,
};

export function getDefaultReply(text: string) {
  return {
    embeds: [
      {
        description: text,
        color: Colors.BLURPLE,
      },
    ],
  };
}

export function getErrorReply(text: string) {
  return {
    embeds: [
      {
        description: text,
        color: Colors.RED,
      },
    ],
  };
}

export function getSuccessReply(text: string) {
  return {
    embeds: [
      {
        description: text,
        color: Colors.GREEN,
      },
    ],
  };
}

export function getLongTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:F>`;
}

type TicketInformation = {
  guild: string;
  guildIconUrl: string;
  ticketId: string;
  createdBy: string;
  createdAt: string;
  participants?: string[];
  extraHTML?: string;
};

type TicketChat = {
  author: string;
  message: string;
  avatarUrl: string;
};

type TicketEmbedField = {
  name: string;
  value: string;
};

export function getTicketTranscriptHTML(
  ticketInformation: TicketInformation,
  chats: TicketChat[]
) {
  const participantsStr = ticketInformation.participants
    ? ticketInformation.participants.join(", ")
    : "";

  const chatsHTML = chats
    .map((chat) => {
      return `
    <div
    class="flex bg-[#1e2124] p-3 gap-5 rounded-lg items-center border-l-[#7289da] border-l-4"
  >
    <div class="flex bg-[#1e2124] p-3 gap-5 rounded-lg items-center">
      <img
        src="${chat.avatarUrl}"
        class="rounded-full w-10 h-10 object-cover"
      />
      <div class="flex flex-col">
        <p class="text-white text-[12px] font-semibold">${chat.author}</p>
        <p class="text-white text-[12px]">
          ${chat.message}
        </p>
      </div>
    </div>
  </div>
    `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="flex flex-col bg-[#282b30] p-5 gap-3">
    <div
      class="flex flex-col bg-[#1e2124] p-3 gap-5 rounded-lg justify-center border-l-[#7289da] border-l-4"
    >
      <div class="flex gap-3 items-center">
        <img
          src="${ticketInformation.guildIconUrl}"
          class="rounded-full w-5 h-5 object-cover"
        />
        <h2 class="flex text-white text-[12px] font-bold">
          Ticket Information
        </h2>
      </div>

      <div class="text-white text-[10px] grid grid-cols-2 max-w-[150px] gap-1">
        <span class="font-bold">Guild:</span>
        <span>${ticketInformation.guild}</span>

        <span class="font-bold">Ticket:</span>
        <span>${ticketInformation.ticketId}</span>

        <span class="font-bold">Created By:</span>
        <span>${ticketInformation.createdBy}</span>

        <span class="font-bold">Created At:</span>
        <span>${ticketInformation.createdAt}</span>
        ${
          participantsStr
            ? `<span class="font-bold">Participants:</span> <span>${participantsStr}</span>`
            : ""
        }
      </div>
    </div>

    <hr />
    <h2 class="flex text-white font-bold justify-center">Full Conversation</h2>
    <hr />

    ${ticketInformation.extraHTML ? ticketInformation.extraHTML : ""}

    ${chatsHTML}
  </body>
</html>
`;

  return html;
}

export function getTicketEmbedHTML(fields: TicketEmbedField[]) {
  const fieldsHTML = fields
    .map(
      (f) => `
    <div class="flex flex-col">
      <span class="font-bold">${f.name}</span>
      <span>${f.value}</span>
    </div>
  `
    )
    .join("");

  return `

  <div
  class="flex flex-col bg-[#1e2124] p-3 gap-5 rounded-lg justify-center border-l-[#7289da] border-l-4"
>
  <div class="text-white text-[10px] flex flex-col max-w-[150px] gap-2">
    ${fieldsHTML}
  </div>
</div>
  `;
}

export function getEmojiFromInput(input: string) {
  if (DISCORD_EMOJI_REGEX.test(input)) {
    const results = DISCORD_EMOJI_REGEX.exec(input) as RegExpExecArray;
    return { id: results.groups!.id, name: results.groups!.name };
  }
  return { name: input?.trim(), id: null };
}

export function getComponentRows(components: MessageComponent[]) {
  const copy: MessageComponent[] = JSON.parse(JSON.stringify(components));
  const parts = [];

  while (copy.length > 0) {
    parts.push(copy.splice(0, 5));
  }

  return parts
    .map((part) => {
      return {
        type: 1,
        components: part,
      };
    })
    .slice(0, 5);
}

export function colorToHexString(color: number) {
  let str = "#" + color.toString(16);
  if (str.length < 7) {
    str = str + "0".repeat(7 - str.length);
  }
  return str;
}

export function getMilliseconds(duration: number, unit: string) {
  switch (unit) {
    case "s":
      return duration * 1000;
    case "m":
      return duration * 60000;
    case "h":
      return duration * 3.6e6;
    case "d":
      return duration * 8.64e7;
    case "w":
      return duration * 6.048e8;
  }
  return 0;
}

export function getReadableDuration(seconds: number) {
  return humanizeDuration(seconds * 1000);
}
