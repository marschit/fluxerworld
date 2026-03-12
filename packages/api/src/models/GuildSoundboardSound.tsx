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

import type {EmojiID, GuildID, SoundboardSoundID, UserID} from '@fluxer/api/src/BrandedTypes';
import type {GuildSoundboardSoundRow} from '@fluxer/api/src/database/types/GuildTypes';

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
