// SPDX-License-Identifier: AGPL-3.0-or-later

import type {EmojiID, GuildID, SoundboardSoundID, UserID} from '../BrandedTypes';
import type {GuildSoundboardSoundRow} from '../database/types/GuildTypes';

export class GuildSoundboardSound {
	readonly guildId: GuildID;
	readonly id: SoundboardSoundID;
	readonly name: string;
	readonly creatorId: UserID;
	readonly volume: number;
	readonly emojiId: EmojiID | null;
	readonly emojiName: string | null;
	readonly version: number;

	constructor(row: GuildSoundboardSoundRow) {
		this.guildId = row.guild_id;
		this.id = row.sound_id;
		this.name = row.name;
		this.creatorId = row.creator_id;
		this.volume = row.volume;
		this.emojiId = row.emoji_id ?? null;
		this.emojiName = row.emoji_name ?? null;
		this.version = row.version;
	}

	toRow(): GuildSoundboardSoundRow {
		return {
			guild_id: this.guildId,
			sound_id: this.id,
			name: this.name,
			creator_id: this.creatorId,
			volume: this.volume,
			emoji_id: this.emojiId,
			emoji_name: this.emojiName,
			version: this.version,
		};
	}
}
