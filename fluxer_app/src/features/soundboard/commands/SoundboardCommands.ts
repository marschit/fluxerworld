// SPDX-License-Identifier: AGPL-3.0-or-later

import {Endpoints} from '@app/features/app/constants/Endpoints';
import {http} from '@app/features/platform/transport/RestTransport';
import {Logger} from '@app/features/platform/utils/AppLogger';
import Soundboard from '@app/features/soundboard/state/Soundboard';
import type {GuildSoundboardSoundWithUser} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';

const logger = new Logger('SoundboardCommands');

export async function list(guildId: string): Promise<ReadonlyArray<GuildSoundboardSoundWithUser>> {
	const response = await http.get<ReadonlyArray<GuildSoundboardSoundWithUser>>(
		Endpoints.GUILD_SOUNDBOARD_SOUNDS(guildId),
	);
	const sounds = response.body;
	Soundboard.handleSoundsLoaded(guildId, sounds);
	return sounds;
}

export async function create(
	guildId: string,
	sound: {name: string; sound: string; volume?: number; emoji_id?: string | null; emoji_name?: string | null},
): Promise<void> {
	await http.post(Endpoints.GUILD_SOUNDBOARD_SOUNDS(guildId), {body: sound});
}

export async function update(
	guildId: string,
	soundId: string,
	data: {name?: string; volume?: number; emoji_id?: string | null; emoji_name?: string | null},
): Promise<void> {
	await http.patch(Endpoints.GUILD_SOUNDBOARD_SOUND(guildId, soundId), {body: data});
}

export async function remove(guildId: string, soundId: string): Promise<void> {
	await http.delete(Endpoints.GUILD_SOUNDBOARD_SOUND(guildId, soundId));
}

export async function send(guildId: string, soundId: string, channelId: string): Promise<void> {
	try {
		await http.post(Endpoints.GUILD_SOUNDBOARD_SOUND_SEND(guildId, soundId), {body: {channel_id: channelId}});
	} catch (error) {
		logger.error(`Failed to send soundboard sound ${soundId} in guild ${guildId}:`, error);
		throw error;
	}
}
