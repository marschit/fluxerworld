// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GatewayHandlerContext} from '@app/features/gateway/events/EventRouter';
import {mediaUrl} from '@app/features/messaging/utils/MessagingUrlUtils';
import {Logger} from '@app/features/platform/utils/AppLogger';
import Sound from '@app/features/ui/state/Sound';
import Users from '@app/features/user/state/Users';
import MediaEngine from '@app/features/voice/engine/MediaEngineFacade';
import {getEffectiveAudioState} from '@app/features/voice/engine/VoiceEffectiveAudioState';
import VoiceSettings from '@app/features/voice/state/VoiceSettings';

const logger = new Logger('VoiceChannelEffectSend');

interface VoiceChannelEffectSendPayload {
	guild_id: string;
	channel_id: string;
	user_id: string;
	sound_id: string;
	sound_volume: number;
}

export function handleVoiceChannelEffectSend(
	data: VoiceChannelEffectSendPayload,
	_context: GatewayHandlerContext,
): void {
	if (!MediaEngine.connected) return;
	if (MediaEngine.channelId !== data.channel_id) return;
	if (data.user_id === Users.currentUserId) return;
	if (getEffectiveAudioState().effectiveDeaf) return;
	if (!Sound.getSoundEnabled()) return;

	const outputVolume = Math.max(0, Math.min(1, VoiceSettings.getOutputVolume() / 100));
	const audio = new Audio(mediaUrl(`soundboard_sounds/${data.sound_id}`));
	audio.volume = Math.max(0, Math.min(1, (data.sound_volume ?? 1) * outputVolume));
	audio.play().catch((error) => {
		logger.error(`Failed to play soundboard sound ${data.sound_id}:`, error);
	});
}
