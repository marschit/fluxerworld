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

import type {GuildSoundboardSound} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import type {UserPartial} from '@fluxer/schema/src/domains/user/UserResponseSchemas';

export class GuildSoundboardSoundRecord {
	readonly id: string;
	readonly guildId: string;
	readonly name: string;
	readonly volume: number;
	readonly emojiId: string | null;
	readonly emojiName: string | null;
	readonly userId: string;
	readonly user?: UserPartial;

	constructor(guildId: string, data: GuildSoundboardSound) {
		this.id = data.id;
		this.guildId = guildId;
		this.name = data.name;
		this.volume = data.volume;
		this.emojiId = data.emoji_id ?? null;
		this.emojiName = data.emoji_name ?? null;
		this.userId = data.user_id ?? '';
		this.user = data.user;
	}

	equals(other: GuildSoundboardSoundRecord): boolean {
		return (
			this.id === other.id &&
			this.guildId === other.guildId &&
			this.name === other.name &&
			this.volume === other.volume &&
			this.emojiId === other.emojiId &&
			this.emojiName === other.emojiName &&
			this.userId === other.userId
		);
	}

	static create(guildId: string, data: GuildSoundboardSound): GuildSoundboardSoundRecord {
		return new GuildSoundboardSoundRecord(guildId, data);
	}
}
