// SPDX-License-Identifier: AGPL-3.0-or-later

import type {GatewayHandlerContext} from '@app/features/gateway/events/EventRouter';
import Soundboard from '@app/features/soundboard/state/Soundboard';
import type {GuildSoundboardSound} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';

interface GuildSoundboardSoundsUpdatePayload {
	guild_id: string;
	soundboard_sounds: ReadonlyArray<GuildSoundboardSound>;
}

export function handleGuildSoundboardSoundsUpdate(
	data: GuildSoundboardSoundsUpdatePayload,
	_context: GatewayHandlerContext,
): void {
	Soundboard.handleGuildSoundboardSoundsUpdate(data.guild_id, data.soundboard_sounds);
}
