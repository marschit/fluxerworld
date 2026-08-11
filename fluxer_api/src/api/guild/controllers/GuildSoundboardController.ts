// SPDX-License-Identifier: AGPL-3.0-or-later

import {GuildIdParam, GuildIdSoundIdParam} from '@fluxer/schema/src/domains/common/CommonParamSchemas';
import {
	GuildSoundboardSoundCreateRequest,
	GuildSoundboardSoundSendRequest,
	GuildSoundboardSoundUpdateRequest,
} from '@fluxer/schema/src/domains/guild/GuildRequestSchemas';
import {
	GuildSoundboardSoundResponse,
	GuildSoundboardSoundWithUserListResponse,
} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {createGuildID, createSoundboardSoundID} from '../../BrandedTypes';
import {LoginRequired} from '../../middleware/AuthMiddleware';
import {RateLimitMiddleware} from '../../middleware/RateLimitMiddleware';
import {OpenAPI} from '../../middleware/ResponseTypeMiddleware';
import {RateLimitConfigs} from '../../RateLimitConfig';
import type {HonoApp} from '../../types/HonoEnv';
import {Validator} from '../../Validator';

export function GuildSoundboardController(app: HonoApp) {
	app.post(
		'/guilds/:guild_id/soundboard-sounds',
		RateLimitMiddleware(RateLimitConfigs.GUILD_SOUNDBOARD_SOUND_CREATE),
		LoginRequired,
		Validator('param', GuildIdParam),
		Validator('json', GuildSoundboardSoundCreateRequest),
		OpenAPI({
			operationId: 'create_guild_soundboard_sound',
			summary: 'Create guild soundboard sound',
			responseSchema: GuildSoundboardSoundResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description: 'Create a soundboard sound for the guild. Requires CREATE_EXPRESSIONS permission.',
		}),
		async (ctx) => {
			const user = ctx.get('user');
			const guildId = createGuildID(ctx.req.valid('param').guild_id);
			const {name, sound, volume, emoji_id, emoji_name} = ctx.req.valid('json');
			const auditLogReason = ctx.get('auditLogReason') ?? null;
			const result = await ctx.get('guildService').createSoundboardSound(
				{
					user,
					guildId,
					name,
					sound,
					volume,
					emojiId: emoji_id,
					emojiName: emoji_name,
				},
				auditLogReason,
			);
			return ctx.json(result);
		},
	);

	app.get(
		'/guilds/:guild_id/soundboard-sounds',
		RateLimitMiddleware(RateLimitConfigs.GUILD_SOUNDBOARD_SOUNDS_LIST),
		LoginRequired,
		Validator('param', GuildIdParam),
		OpenAPI({
			operationId: 'list_guild_soundboard_sounds',
			summary: 'List guild soundboard sounds',
			responseSchema: GuildSoundboardSoundWithUserListResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description: 'List all soundboard sounds for the guild.',
		}),
		async (ctx) => {
			const {guild_id} = ctx.req.valid('param');
			const userId = ctx.get('user').id;
			const guildId = createGuildID(guild_id);
			const requestCache = ctx.get('requestCache');
			return ctx.json(await ctx.get('guildService').getSoundboardSounds({userId, guildId, requestCache}));
		},
	);

	app.patch(
		'/guilds/:guild_id/soundboard-sounds/:sound_id',
		RateLimitMiddleware(RateLimitConfigs.GUILD_SOUNDBOARD_SOUND_UPDATE),
		LoginRequired,
		Validator('param', GuildIdSoundIdParam),
		Validator('json', GuildSoundboardSoundUpdateRequest),
		OpenAPI({
			operationId: 'update_guild_soundboard_sound',
			summary: 'Update guild soundboard sound',
			responseSchema: GuildSoundboardSoundResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description:
				'Update a soundboard sound. Creator can update their own sounds with CREATE_EXPRESSIONS; others need MANAGE_EXPRESSIONS.',
		}),
		async (ctx) => {
			const {guild_id, sound_id} = ctx.req.valid('param');
			const userId = ctx.get('user').id;
			const guildId = createGuildID(guild_id);
			const soundId = createSoundboardSoundID(sound_id);
			const {name, volume, emoji_id, emoji_name} = ctx.req.valid('json');
			const auditLogReason = ctx.get('auditLogReason') ?? null;
			const result = await ctx.get('guildService').updateSoundboardSound(
				{
					userId,
					guildId,
					soundId,
					name,
					volume,
					emojiId: emoji_id,
					emojiName: emoji_name,
				},
				auditLogReason,
			);
			return ctx.json(result);
		},
	);

	app.post(
		'/guilds/:guild_id/soundboard-sounds/:sound_id/send',
		RateLimitMiddleware(RateLimitConfigs.GUILD_SOUNDBOARD_SOUND_SEND),
		LoginRequired,
		Validator('param', GuildIdSoundIdParam),
		Validator('json', GuildSoundboardSoundSendRequest),
		OpenAPI({
			operationId: 'send_guild_soundboard_sound',
			summary: 'Send a soundboard sound to voice channel',
			responseSchema: null,
			statusCode: 204,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description: 'Play a soundboard sound in the voice channel the user is connected to.',
		}),
		async (ctx) => {
			const {guild_id, sound_id} = ctx.req.valid('param');
			const {channel_id} = ctx.req.valid('json');
			const userId = ctx.get('user').id;
			const guildId = createGuildID(guild_id);
			const soundId = createSoundboardSoundID(sound_id);
			await ctx.get('guildService').sendSoundboardSound({userId, guildId, soundId, channelId: channel_id});
			return ctx.body(null, 204);
		},
	);

	app.delete(
		'/guilds/:guild_id/soundboard-sounds/:sound_id',
		RateLimitMiddleware(RateLimitConfigs.GUILD_SOUNDBOARD_SOUND_DELETE),
		LoginRequired,
		Validator('param', GuildIdSoundIdParam),
		OpenAPI({
			operationId: 'delete_guild_soundboard_sound',
			summary: 'Delete guild soundboard sound',
			responseSchema: null,
			statusCode: 204,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description:
				'Delete a soundboard sound. Creator can delete their own sounds with CREATE_EXPRESSIONS; others need MANAGE_EXPRESSIONS.',
		}),
		async (ctx) => {
			const {guild_id, sound_id} = ctx.req.valid('param');
			const userId = ctx.get('user').id;
			const guildId = createGuildID(guild_id);
			const soundId = createSoundboardSoundID(sound_id);
			const auditLogReason = ctx.get('auditLogReason') ?? null;

			await ctx.get('guildService').deleteSoundboardSound({userId, guildId, soundId}, auditLogReason);

			return ctx.body(null, 204);
		},
	);
}
