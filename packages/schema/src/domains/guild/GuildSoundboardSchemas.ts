// SPDX-License-Identifier: AGPL-3.0-or-later

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
