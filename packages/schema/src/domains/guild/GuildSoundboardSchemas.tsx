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

import {type UserPartial, UserPartialResponse} from '@fluxer/schema/src/domains/user/UserResponseSchemas';
import {SnowflakeStringType} from '@fluxer/schema/src/primitives/SchemaPrimitives';
import {z} from 'zod';

export const GuildSoundboardSoundResponse = z.object({
	id: SnowflakeStringType.describe('The unique identifier for this soundboard sound'),
	name: z.string().describe('The name of the sound'),
	volume: z.number().describe('The default volume of the sound (0-1)'),
	emoji_id: SnowflakeStringType.nullish().describe('The emoji ID associated with this sound'),
	emoji_name: z.string().nullish().describe('The emoji name associated with this sound'),
	guild_id: SnowflakeStringType.describe('The ID of the guild this sound belongs to'),
	user_id: SnowflakeStringType.describe('The ID of the user who created this sound'),
});

export type GuildSoundboardSoundResponse = z.infer<typeof GuildSoundboardSoundResponse>;

export const GuildSoundboardSoundWithUserResponse = z.object({
	id: SnowflakeStringType.describe('The unique identifier for this soundboard sound'),
	name: z.string().describe('The name of the sound'),
	volume: z.number().describe('The default volume of the sound (0-1)'),
	emoji_id: SnowflakeStringType.nullish().describe('The emoji ID associated with this sound'),
	emoji_name: z.string().nullish().describe('The emoji name associated with this sound'),
	guild_id: SnowflakeStringType.describe('The ID of the guild this sound belongs to'),
	user: z.lazy(() => UserPartialResponse).describe('The user who created this sound'),
});

export type GuildSoundboardSoundWithUserResponse = z.infer<typeof GuildSoundboardSoundWithUserResponse>;

export const GuildSoundboardSoundWithUserListResponse = z.array(GuildSoundboardSoundWithUserResponse);

export type GuildSoundboardSoundWithUserListResponse = z.infer<typeof GuildSoundboardSoundWithUserListResponse>;

export interface GuildSoundboardSound {
	readonly id: string;
	readonly name: string;
	readonly volume: number;
	readonly emoji_id?: string | null;
	readonly emoji_name?: string | null;
	readonly guild_id: string;
	readonly user_id?: string;
	readonly user?: UserPartial;
}

export interface GuildSoundboardSoundWithUser extends GuildSoundboardSound {
	readonly user: UserPartial;
}
