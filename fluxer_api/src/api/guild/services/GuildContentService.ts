// SPDX-License-Identifier: AGPL-3.0-or-later

import type {
	GuildEmojiResponse,
	GuildEmojiWithUserResponse,
	GuildStickerResponse,
	GuildStickerWithUserResponse,
} from '@fluxer/schema/src/domains/guild/GuildEmojiSchemas';
import type {
	GuildSoundboardSoundResponse,
	GuildSoundboardSoundWithUserResponse,
} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import type {UserPartialResponse} from '@fluxer/schema/src/domains/user/UserResponseSchemas';
import type {EmojiID, GuildID, SoundboardSoundID, StickerID, UserID} from '../../BrandedTypes';
import type {AvatarService} from '../../infrastructure/AvatarService';
import type {IAssetDeletionQueue} from '../../infrastructure/IAssetDeletionQueue';
import type {IGatewayService} from '../../infrastructure/IGatewayService';
import type {ISnowflakeService} from '../../infrastructure/ISnowflakeService';
import type {UserCacheService} from '../../infrastructure/UserCacheService';
import type {LimitConfigService} from '../../limits/LimitConfigService';
import type {RequestCache} from '../../middleware/RequestCacheMiddleware';
import type {User} from '../../models/User';
import type {GuildAuditLogService} from '../GuildAuditLogService';
import type {IGuildRepositoryAggregate} from '../repositories/IGuildRepositoryAggregate';
import {ContentHelpers} from './content/ContentHelpers';
import {EmojiService} from './content/EmojiService';
import {ExpressionAssetPurger} from './content/ExpressionAssetPurger';
import {SoundboardService} from './content/SoundboardService';
import {StickerService} from './content/StickerService';

export class GuildContentService {
	private readonly contentHelpers: ContentHelpers;
	private readonly emojiService: EmojiService;
	private readonly stickerService: StickerService;
	private readonly soundboardService: SoundboardService;

	constructor(
		guildRepository: IGuildRepositoryAggregate,
		userCacheService: UserCacheService,
		gatewayService: IGatewayService,
		avatarService: AvatarService,
		snowflakeService: ISnowflakeService,
		guildAuditLogService: GuildAuditLogService,
		assetDeletionQueue: IAssetDeletionQueue,
		limitConfigService: LimitConfigService,
	) {
		this.contentHelpers = new ContentHelpers(gatewayService, guildAuditLogService);
		const expressionAssetPurger = new ExpressionAssetPurger(assetDeletionQueue);
		this.emojiService = new EmojiService(
			guildRepository,
			userCacheService,
			gatewayService,
			avatarService,
			snowflakeService,
			this.contentHelpers,
			expressionAssetPurger,
			limitConfigService,
		);
		this.stickerService = new StickerService(
			guildRepository,
			userCacheService,
			gatewayService,
			avatarService,
			snowflakeService,
			this.contentHelpers,
			expressionAssetPurger,
			limitConfigService,
		);
		this.soundboardService = new SoundboardService(
			guildRepository,
			userCacheService,
			gatewayService,
			avatarService,
			snowflakeService,
			this.contentHelpers,
		);
	}

	async getEmojis(params: {
		userId: UserID;
		guildId: GuildID;
		requestCache: RequestCache;
	}): Promise<Array<GuildEmojiWithUserResponse>> {
		return this.emojiService.getEmojis(params);
	}

	async getEmojiUser(params: {
		userId: UserID;
		guildId: GuildID;
		emojiId: EmojiID;
		requestCache: RequestCache;
	}): Promise<UserPartialResponse> {
		return this.emojiService.getEmojiUser(params);
	}

	async createEmoji(
		params: {
			user: User;
			guildId: GuildID;
			name: string;
			image: string;
		},
		auditLogReason?: string | null,
	): Promise<GuildEmojiResponse> {
		return this.emojiService.createEmoji(params, auditLogReason);
	}

	async cloneEmoji(
		params: {
			user: User;
			guildId: GuildID;
			sourceEmojiId: EmojiID;
		},
		auditLogReason?: string | null,
	): Promise<GuildEmojiResponse> {
		return this.emojiService.cloneEmoji(params, auditLogReason);
	}

	async bulkCreateEmojis(
		params: {
			user: User;
			guildId: GuildID;
			emojis: Array<{
				name: string;
				image: string;
			}>;
		},
		auditLogReason?: string | null,
	): Promise<{
		success: Array<GuildEmojiResponse>;
		failed: Array<{
			name: string;
			error: string;
		}>;
	}> {
		return this.emojiService.bulkCreateEmojis(params, auditLogReason);
	}

	async updateEmoji(
		params: {
			userId: UserID;
			guildId: GuildID;
			emojiId: EmojiID;
			name: string;
		},
		auditLogReason?: string | null,
	): Promise<GuildEmojiResponse> {
		return this.emojiService.updateEmoji(params, auditLogReason);
	}

	async deleteEmoji(
		params: {
			userId: UserID;
			guildId: GuildID;
			emojiId: EmojiID;
			purge?: boolean;
		},
		auditLogReason?: string | null,
	): Promise<void> {
		return this.emojiService.deleteEmoji(params, auditLogReason);
	}

	async getStickers(params: {
		userId: UserID;
		guildId: GuildID;
		requestCache: RequestCache;
	}): Promise<Array<GuildStickerWithUserResponse>> {
		return this.stickerService.getStickers(params);
	}

	async getStickerUser(params: {
		userId: UserID;
		guildId: GuildID;
		stickerId: StickerID;
		requestCache: RequestCache;
	}): Promise<UserPartialResponse> {
		return this.stickerService.getStickerUser(params);
	}

	async createSticker(
		params: {
			user: User;
			guildId: GuildID;
			name: string;
			description?: string | null;
			tags: Array<string>;
			image: string;
		},
		auditLogReason?: string | null,
	): Promise<GuildStickerResponse> {
		return this.stickerService.createSticker(params, auditLogReason);
	}

	async cloneSticker(
		params: {
			user: User;
			guildId: GuildID;
			sourceStickerId: StickerID;
		},
		auditLogReason?: string | null,
	): Promise<GuildStickerResponse> {
		return this.stickerService.cloneSticker(params, auditLogReason);
	}

	async bulkCreateStickers(
		params: {
			user: User;
			guildId: GuildID;
			stickers: Array<{
				name: string;
				description?: string | null;
				tags: Array<string>;
				image: string;
			}>;
		},
		auditLogReason?: string | null,
	): Promise<{
		success: Array<GuildStickerResponse>;
		failed: Array<{
			name: string;
			error: string;
		}>;
	}> {
		return this.stickerService.bulkCreateStickers(params, auditLogReason);
	}

	async updateSticker(
		params: {
			userId: UserID;
			guildId: GuildID;
			stickerId: StickerID;
			name: string;
			description?: string | null;
			tags: Array<string>;
		},
		auditLogReason?: string | null,
	): Promise<GuildStickerResponse> {
		return this.stickerService.updateSticker(params, auditLogReason);
	}

	async deleteSticker(
		params: {
			userId: UserID;
			guildId: GuildID;
			stickerId: StickerID;
			purge?: boolean;
		},
		auditLogReason?: string | null,
	): Promise<void> {
		return this.stickerService.deleteSticker(params, auditLogReason);
	}

	async getSoundboardSounds(params: {
		userId: UserID;
		guildId: GuildID;
		requestCache: RequestCache;
	}): Promise<Array<GuildSoundboardSoundWithUserResponse>> {
		return this.soundboardService.getSoundboardSounds(params);
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
		return this.soundboardService.createSoundboardSound(params, auditLogReason);
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
		return this.soundboardService.updateSoundboardSound(params, auditLogReason);
	}

	async deleteSoundboardSound(
		params: {userId: UserID; guildId: GuildID; soundId: SoundboardSoundID},
		auditLogReason?: string | null,
	): Promise<void> {
		return this.soundboardService.deleteSoundboardSound(params, auditLogReason);
	}

	async sendSoundboardSound(params: {
		userId: UserID;
		guildId: GuildID;
		soundId: SoundboardSoundID;
		channelId: string;
	}): Promise<void> {
		return this.soundboardService.sendSoundboardSound(params);
	}
}
