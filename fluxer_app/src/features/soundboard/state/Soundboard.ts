// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GuildSoundboardSound} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {sortBySnowflakeDesc} from '@fluxer/snowflake/src/SnowflakeUtils';
import {makeAutoObservable} from 'mobx';

interface GuildSoundboardContext {
	sounds: Array<GuildSoundboardSound>;
}

class Soundboard {
	guildSounds: Map<string, GuildSoundboardContext> = new Map();
	panelOpen = false;

	constructor() {
		makeAutoObservable(this, {}, {autoBind: true});
	}

	getGuildSounds(guildId: string): ReadonlyArray<GuildSoundboardSound> {
		return this.guildSounds.get(guildId)?.sounds ?? [];
	}

	togglePanel(): void {
		this.panelOpen = !this.panelOpen;
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
		this.guildSounds.set(guildId, {sounds: sortBySnowflakeDesc([...sounds])});
	}
}

export default new Soundboard();
