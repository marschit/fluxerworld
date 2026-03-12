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

import {GuildSoundboardSoundRecord} from '@app/records/GuildSoundboardSoundRecord';
import type {GuildSoundboardSound} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {sortBySnowflakeDesc} from '@fluxer/snowflake/src/SnowflakeUtils';
import {makeAutoObservable} from 'mobx';

interface GuildSoundboardContext {
	sounds: Array<GuildSoundboardSoundRecord>;
}

class SoundboardStore {
	guildSounds: Map<string, GuildSoundboardContext> = new Map();
	panelOpen = false;

	constructor() {
		makeAutoObservable(this, {}, {autoBind: true});
	}

	getGuildSounds(guildId: string): ReadonlyArray<GuildSoundboardSoundRecord> {
		return this.guildSounds.get(guildId)?.sounds ?? [];
	}

	togglePanel(): void {
		this.panelOpen = !this.panelOpen;
	}

	openPanel(): void {
		this.panelOpen = true;
	}

	closePanel(): void {
		this.panelOpen = false;
	}

	handleGuildSoundboardSoundsUpdate(guildId: string, sounds: ReadonlyArray<GuildSoundboardSound>): void {
		this.updateGuildSounds(guildId, sounds);
	}

	handleSoundsLoaded(guildId: string, sounds: ReadonlyArray<GuildSoundboardSound>): void {
		this.updateGuildSounds(guildId, sounds);
	}

	handleGuildDelete(guildId: string): void {
		this.guildSounds.delete(guildId);
	}

	private updateGuildSounds(guildId: string, sounds: ReadonlyArray<GuildSoundboardSound>): void {
		const soundRecords = sounds.map((sound) => new GuildSoundboardSoundRecord(guildId, sound));
		const sortedSounds = sortBySnowflakeDesc(soundRecords);
		this.guildSounds.set(guildId, {sounds: sortedSounds});
	}
}

export default new SoundboardStore();
