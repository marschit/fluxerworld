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

import * as GuildSoundboardActionCreators from '@app/actions/GuildSoundboardActionCreators';
import styles from '@app/components/voice/SoundboardPanel.module.css';
import {Logger} from '@app/lib/Logger';
import SoundboardStore from '@app/stores/SoundboardStore';
import MediaEngineStore from '@app/stores/voice/MediaEngineFacade';
import {mediaUrl} from '@app/utils/UrlUtils';
import {MusicNoteIcon, SpeakerHighIcon, XIcon} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import {observer} from 'mobx-react-lite';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useLingui} from '@lingui/react/macro';

const logger = new Logger('SoundboardPanel');

function getSoundboardSoundURL(soundId: string): string {
	return mediaUrl(`soundboard_sounds/${soundId}`);
}

export const SoundboardPanel = observer(function SoundboardPanel() {
	const {t} = useLingui();
	const guildId = MediaEngineStore.guildId;
	const channelId = MediaEngineStore.channelId;
	const [loading, setLoading] = useState(false);
	const [playingId, setPlayingId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!guildId) return;
		setLoading(true);
		GuildSoundboardActionCreators.list(guildId)
			.catch((error) => {
				logger.error('Failed to load soundboard sounds:', error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [guildId]);

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	const handlePlaySound = useCallback(
		(soundId: string, volume: number) => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}

			if (playingId === soundId) {
				setPlayingId(null);
				return;
			}

			const audio = new Audio(getSoundboardSoundURL(soundId));
			audio.volume = volume;
			audioRef.current = audio;
			setPlayingId(soundId);

			audio.addEventListener('ended', () => {
				setPlayingId(null);
				audioRef.current = null;
			});

			audio.addEventListener('error', () => {
				logger.error(`Failed to play sound ${soundId}`);
				setPlayingId(null);
				audioRef.current = null;
			});

			void audio.play();

			if (guildId && channelId) {
				GuildSoundboardActionCreators.send(guildId, soundId, channelId).catch((err) => {
					logger.error('Failed to broadcast sound to voice channel:', err);
				});
			}
		},
		[playingId, guildId, channelId],
	);

	const handleClose = useCallback(() => {
		SoundboardStore.closePanel();
	}, []);

	if (!guildId) return null;

	const sounds = SoundboardStore.getGuildSounds(guildId);

	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<span className={styles.title}>{t`Soundboard`}</span>
				<button type="button" className={styles.closeButton} onClick={handleClose}>
					<XIcon weight="bold" />
				</button>
			</div>

			{loading ? (
				<div className={styles.loadingState}>{t`Loading...`}</div>
			) : sounds.length === 0 ? (
				<div className={styles.emptyState}>
					<MusicNoteIcon weight="fill" className={styles.emptyIcon} />
					<span className={styles.emptyText}>{t`No soundboard sounds yet`}</span>
				</div>
			) : (
				<div className={styles.soundGrid}>
					{sounds.map((sound) => (
						<button
							key={sound.id}
							type="button"
							className={clsx(styles.soundButton, playingId === sound.id && styles.soundButtonPlaying)}
							onClick={() => handlePlaySound(sound.id, sound.volume)}
						>
							{sound.emojiName ? (
								<span className={styles.soundEmoji}>{sound.emojiName}</span>
							) : (
								<SpeakerHighIcon weight="fill" className={styles.soundIcon} />
							)}
							<span className={styles.soundName}>{sound.name}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
});
