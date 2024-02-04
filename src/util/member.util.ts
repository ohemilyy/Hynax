// @ts-nocheck

import { Guild, Member, Client, Role } from "oceanic.js";

export function canMemberBeHandled(
	member: Member,
	guild: Guild,
	client: Client
) {
	if (member.user.id === guild.ownerID) return false;
	if (member.user.id === client.user.id) return false;
	if (client.user.id === guild.ownerID) return true;

	if (!guild.members.get(client.user.id)?.roles.length) return false;

	if (!member.roles.length) return true;

	const roleMap = (role: string | number) => guild.roles.get(role);

	let roles = guild.members
		.get(client.user.id)
		?.roles.map(roleMap)
		.filter((r) => r != undefined); //.sort((prev, role) => guild.roles.get(prev).position - );

	if (!roles) return false;

	let highestRoleOfBot = roles[findHighest(roles).index]; //roles.reduce((prev, role) => (comparePositions(prev, role, guild) > 0 ? role : prev), roles[findHighest(roles, true).index]); // I have no idea about the position of role[0], it was a blind guess so I hope it indeed is the first (bottom positioned) role.

	let rolesOfMembers = member.roles.map(roleMap);
	let highestRoleOfMember = rolesOfMembers[findHighest(rolesOfMembers).index]; //rolesOfMembers.reduce((prev, curr) => (comparePositions(prev, curr, guild) > 0 ? curr : prev), rolesOfMembers[findHighest(rolesOfMembers, true).index]);//member.roles[0]);

	return comparePositions(highestRoleOfBot, highestRoleOfMember, guild) > 0;
}

/**
 * @param {Role[]} roles If it's not role[], use map.
 */
function findHighest(roles: Role[], isLowest = false) {
	let first = { index: -1, position: isLowest ? 99999 : 0 };

	for (let i = 0; i < roles.length; i++) {
		let role = roles[i];

		if (!isLowest && first.position < role.position)
			first = { index: i, position: role.position };
		else if (isLowest && first.position > role.position)
			first = { index: i, position: role.position };
	}

	return first;
}

/**
 * @param {string} role1
 * @param {string} role2
 * @param {Guild} guild
 */
function comparePositions(role1: Role, role2: Role, guild: Guild) {
	const resolved = [role1, role2];
	//const resolved = [guild.roles.get(role1), guild.roles.get(role2)];

	if (resolved[0].position === resolved[1].position) return 0;
	return resolved[0].position - resolved[1].position;
}
