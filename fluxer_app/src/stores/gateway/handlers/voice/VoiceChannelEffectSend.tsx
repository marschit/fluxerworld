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

import {Logger} from '@app/lib/Logger';
import UserStore from '@app/stores/UserStore';
import MediaEngineStore from '@app/stores/voice/MediaEngineFacade';
import {mediaUrl} from '@app/utils/UrlUtils';
import type {GatewayHandlerContext} from '@app/stores/gateway/handlers/index';

const logger = new Logger('VoiceChannelEffectSend');

interface VoiceChannelEffectSendPayload {
	guild_id: string;
	channel_id: string;
	user_id: string;
	sound_id: string;
	sound_volume: number;
}

export function handleVoiceChannelEffectSend(data: VoiceChannelEffectSendPayload, _context: GatewayHandlerContext): void {
	const currentUserId = UserStore.currentUserId;
	const currentChannelId = MediaEngineStore.channelId;

	if (!currentChannelId || currentChannelId !== data.channel_id) {
		return;
	}

	if (data.user_id === currentUserId) {
		return;
	}

	const url = mediaUrl(`soundboard_sounds/${data.sound_id}`);
	const audio = new Audio(url);
	audio.volume = data.sound_volume ?? 1;
	audio.play().catch((err) => {
		logger.error(`Failed to play soundboard sound ${data.sound_id}:`, err);
	});
}
