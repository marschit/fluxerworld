/*
 * Copyright (C) 2026 Fluxer Contributors
 *
 * This file is part of Fluxer.
 *
 * Fluxer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Fluxer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Fluxer. If not, see <https://www.gnu.org/licenses/>.
 */

import {Endpoints} from '@app/Endpoints';
import http from '@app/lib/HttpClient';
import {Logger} from '@app/lib/Logger';
import SoundboardStore from '@app/stores/SoundboardStore';
import type {GuildSoundboardSoundWithUser} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';

const logger = new Logger('Soundboard');

export async function list(guildId: string): Promise<ReadonlyArray<GuildSoundboardSoundWithUser>> {
	try {
		const response = await http.get<ReadonlyArray<GuildSoundboardSoundWithUser>>({
			url: Endpoints.GUILD_SOUNDBOARD_SOUNDS(guildId),
		});
		const sounds = response.body;
		SoundboardStore.handleSoundsLoaded(guildId, sounds);
		logger.debug(`Retrieved ${sounds.length} soundboard sounds for guild ${guildId}`);
		return sounds;
	} catch (error) {
		logger.error(`Failed to list soundboard sounds for guild ${guildId}:`, error);
		throw error;
	}
}

export async function create(
	guildId: string,
	sound: {name: string; sound: string; volume?: number; emoji_id?: string | null; emoji_name?: string | null},
): Promise<void> {
	try {
		await http.post({url: Endpoints.GUILD_SOUNDBOARD_SOUNDS(guildId), body: sound});
		logger.debug(`Created soundboard sound ${sound.name} in guild ${guildId}`);
	} catch (error) {
		logger.error(`Failed to create soundboard sound ${sound.name} in guild ${guildId}:`, error);
		throw error;
	}
}

export async function update(
	guildId: string,
	soundId: string,
	data: {name?: string; volume?: number; emoji_id?: string | null; emoji_name?: string | null},
): Promise<void> {
	try {
		await http.patch({url: Endpoints.GUILD_SOUNDBOARD_SOUND(guildId, soundId), body: data});
		logger.debug(`Updated soundboard sound ${soundId} in guild ${guildId}`);
	} catch (error) {
		logger.error(`Failed to update soundboard sound ${soundId} in guild ${guildId}:`, error);
		throw error;
	}
}

export async function send(guildId: string, soundId: string): Promise<void> {
	try {
		await http.post({url: Endpoints.GUILD_SOUNDBOARD_SOUND_SEND(guildId, soundId)});
		logger.debug(`Sent soundboard sound ${soundId} in guild ${guildId}`);
	} catch (error) {
		logger.error(`Failed to send soundboard sound ${soundId} in guild ${guildId}:`, error);
		throw error;
	}
}

export async function remove(guildId: string, soundId: string): Promise<void> {
	try {
		await http.delete({url: Endpoints.GUILD_SOUNDBOARD_SOUND(guildId, soundId)});
		logger.debug(`Removed soundboard sound ${soundId} from guild ${guildId}`);
	} catch (error) {
		logger.error(`Failed to remove soundboard sound ${soundId} from guild ${guildId}:`, error);
		throw error;
	}
}
