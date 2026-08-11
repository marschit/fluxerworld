// SPDX-License-Identifier: AGPL-3.0-or-later

import {AuditLogActionType} from '@fluxer/constants/src/AuditLogActionType';
import {SOUNDBOARD_SOUND_MAX_SIZE} from '@fluxer/constants/src/LimitConstants';
import {ValidationErrorCodes} from '@fluxer/constants/src/ValidationErrorCodes';
import {InputValidationError} from '@fluxer/errors/src/domains/core/InputValidationError';
import type {
	GuildSoundboardSoundResponse,
	GuildSoundboardSoundWithUserResponse,
} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {
	createEmojiID,
	createSoundboardSoundID,
	type GuildID,
	type SoundboardSoundID,
	type UserID,
} from '../../../BrandedTypes';
import {
	mapGuildSoundboardSoundsWithUsersToResponse,
	mapGuildSoundboardSoundToResponse,
} from '../../../guild/GuildModel';
import type {IGuildRepositoryAggregate} from '../../../guild/repositories/IGuildRepositoryAggregate';
import type {ContentHelpers} from '../../../guild/services/content/ContentHelpers';
import type {AvatarService} from '../../../infrastructure/AvatarService';
import type {IGatewayService} from '../../../infrastructure/IGatewayService';
import type {ISnowflakeService} from '../../../infrastructure/ISnowflakeService';
import type {UserCacheService} from '../../../infrastructure/UserCacheService';
import type {RequestCache} from '../../../middleware/RequestCacheMiddleware';
import type {GuildSoundboardSound} from '../../../models/GuildSoundboardSound';
import type {User} from '../../../models/User';

class UnknownSoundboardSoundError extends Error {
	constructor() {
		super('Unknown soundboard sound');
		this.name = 'UnknownSoundboardSoundError';
	}
}

export class SoundboardService {
	constructor(
		private readonly guildRepository: IGuildRepositoryAggregate,
		private readonly userCacheService: UserCacheService,
		private readonly gatewayService: IGatewayService,
		private readonly avatarService: AvatarService,
		private readonly snowflakeService: ISnowflakeService,
		private readonly contentHelpers: ContentHelpers,
	) {}

	async getSoundboardSounds(params: {
		userId: UserID;
		guildId: GuildID;
		requestCache: RequestCache;
	}): Promise<Array<GuildSoundboardSoundWithUserResponse>> {
		const {userId, guildId, requestCache} = params;
		await this.contentHelpers.getGuildData({userId, guildId});

		const sounds = await this.guildRepository.listSoundboardSounds(guildId);
		return await mapGuildSoundboardSoundsWithUsersToResponse(sounds, this.userCacheService, requestCache);
	}

	async createSoundboardSound(
		params: {
			user: User;
			guildId: GuildID;
			name: string;
			sound: string;
			volume?: number;
			emojiId?: bigint | null;
			emojiName?: string | null;
		},
		auditLogReason?: string | null,
	): Promise<GuildSoundboardSoundResponse> {
		const {user, guildId, name, sound: base64Sound, volume = 1, emojiId, emojiName} = params;
		await this.contentHelpers.getGuildData({userId: user.id, guildId});
		await this.contentHelpers.checkCreateExpressionsPermission({userId: user.id, guildId});

		const allSounds = await this.guildRepository.listSoundboardSounds(guildId);

		const audioBuffer = this.processAudio({errorPath: 'sound', base64Audio: base64Sound});

		const soundId = createSoundboardSoundID(await this.snowflakeService.generate());
		await this.avatarService.uploadSoundboardSound({
			prefix: 'soundboard_sounds',
			soundId,
			audioBuffer,
		});

		const soundRow = await this.guildRepository.upsertSoundboardSound({
			guild_id: guildId,
			sound_id: soundId,
			name,
			creator_id: user.id,
			volume,
			emoji_id: emojiId ? createEmojiID(emojiId) : null,
			emoji_name: emojiName ?? null,
			version: 1,
		});

		const updatedSounds = [...allSounds, soundRow];
		await this.dispatchGuildSoundboardSoundsUpdate({guildId, sounds: updatedSounds});

		await this.contentHelpers.recordAuditLog({
			guildId,
			userId: user.id,
			action: AuditLogActionType.SOUNDBOARD_SOUND_CREATE,
			targetId: soundRow.id,
			auditLogReason: auditLogReason ?? null,
			changes: this.contentHelpers.guildAuditLogService.computeChanges(
				null,
				this.contentHelpers.serializeSoundboardSoundForAudit(soundRow),
			),
		});

		return mapGuildSoundboardSoundToResponse(soundRow);
	}

	async updateSoundboardSound(
		params: {
			userId: UserID;
			guildId: GuildID;
			soundId: SoundboardSoundID;
			name?: string;
			volume?: number;
			emojiId?: bigint | null;
			emojiName?: string | null;
		},
		auditLogReason?: string | null,
	): Promise<GuildSoundboardSoundResponse> {
		const {userId, guildId, soundId, name, volume, emojiId, emojiName} = params;

		const allSounds = await this.guildRepository.listSoundboardSounds(guildId);
		const sound = allSounds.find((s) => s.id === soundId);
		if (!sound) throw new UnknownSoundboardSoundError();

		await this.contentHelpers.checkModifyExpressionPermission({userId, guildId, creatorId: sound.creatorId});
		const previousSnapshot = this.contentHelpers.serializeSoundboardSoundForAudit(sound);

		const updatedRow = sound.toRow();
		if (name !== undefined) updatedRow.name = name;
		if (volume !== undefined) updatedRow.volume = volume;
		if (emojiId !== undefined) updatedRow.emoji_id = emojiId ? createEmojiID(emojiId) : null;
		if (emojiName !== undefined) updatedRow.emoji_name = emojiName ?? null;

		const updatedSound = await this.guildRepository.upsertSoundboardSound(updatedRow);
		const updatedSounds = allSounds.map((s) => (s.id === soundId ? updatedSound : s));
		await this.dispatchGuildSoundboardSoundsUpdate({guildId, sounds: updatedSounds});

		await this.contentHelpers.recordAuditLog({
			guildId,
			userId,
			action: AuditLogActionType.SOUNDBOARD_SOUND_UPDATE,
			targetId: soundId,
			auditLogReason: auditLogReason ?? null,
			changes: this.contentHelpers.guildAuditLogService.computeChanges(
				previousSnapshot,
				this.contentHelpers.serializeSoundboardSoundForAudit(updatedSound),
			),
		});

		return mapGuildSoundboardSoundToResponse(updatedSound);
	}

	async deleteSoundboardSound(
		params: {userId: UserID; guildId: GuildID; soundId: SoundboardSoundID},
		auditLogReason?: string | null,
	): Promise<void> {
		const {userId, guildId, soundId} = params;
		await this.contentHelpers.getGuildData({userId, guildId});

		const allSounds = await this.guildRepository.listSoundboardSounds(guildId);
		const sound = allSounds.find((s) => s.id === soundId);
		if (!sound) throw new UnknownSoundboardSoundError();

		await this.contentHelpers.checkModifyExpressionPermission({userId, guildId, creatorId: sound.creatorId});
		const previousSnapshot = this.contentHelpers.serializeSoundboardSoundForAudit(sound);

		await this.guildRepository.deleteSoundboardSound(guildId, soundId);
		const updatedSounds = allSounds.filter((s) => s.id !== soundId);
		await this.dispatchGuildSoundboardSoundsUpdate({guildId, sounds: updatedSounds});

		await this.contentHelpers.recordAuditLog({
			guildId,
			userId,
			action: AuditLogActionType.SOUNDBOARD_SOUND_DELETE,
			targetId: soundId,
			auditLogReason: auditLogReason ?? null,
			changes: this.contentHelpers.guildAuditLogService.computeChanges(previousSnapshot, null),
		});
	}

	async sendSoundboardSound(params: {
		userId: UserID;
		guildId: GuildID;
		soundId: SoundboardSoundID;
		channelId: string;
	}): Promise<void> {
		const {userId, guildId, soundId, channelId} = params;
		await this.contentHelpers.getGuildData({userId, guildId});

		const allSounds = await this.guildRepository.listSoundboardSounds(guildId);
		const sound = allSounds.find((s) => s.id === soundId);
		if (!sound) throw new UnknownSoundboardSoundError();

		await this.gatewayService.dispatchGuild({
			guildId,
			event: 'VOICE_CHANNEL_EFFECT_SEND',
			data: {
				guild_id: guildId.toString(),
				channel_id: channelId,
				user_id: userId.toString(),
				sound_id: soundId.toString(),
				sound_volume: sound.volume,
			},
		});
	}

	private processAudio(params: {errorPath: string; base64Audio: string}): Uint8Array {
		const {errorPath, base64Audio} = params;

		const base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;

		let audioBuffer: Uint8Array;
		try {
			audioBuffer = new Uint8Array(Buffer.from(base64Data, 'base64'));
		} catch {
			throw InputValidationError.fromCode(errorPath, ValidationErrorCodes.INVALID_IMAGE_DATA);
		}

		if (audioBuffer.length > SOUNDBOARD_SOUND_MAX_SIZE) {
			throw InputValidationError.fromCode(errorPath, ValidationErrorCodes.IMAGE_SIZE_EXCEEDS_LIMIT, {
				maxSize: SOUNDBOARD_SOUND_MAX_SIZE,
			});
		}

		return audioBuffer;
	}

	private async dispatchGuildSoundboardSoundsUpdate(params: {
		guildId: GuildID;
		sounds: Array<GuildSoundboardSound>;
	}): Promise<void> {
		const {guildId, sounds} = params;
		await this.gatewayService.dispatchGuild({
			guildId,
			event: 'GUILD_SOUNDBOARD_SOUNDS_UPDATE',
			data: {soundboard_sounds: sounds.map(mapGuildSoundboardSoundToResponse)},
		});
	}
}
