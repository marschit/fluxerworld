// SPDX-License-Identifier: AGPL-3.0-or-later

import {mediaUrl} from '@app/features/messaging/utils/MessagingUrlUtils';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as SoundboardCommands from '@app/features/soundboard/commands/SoundboardCommands';
import styles from '@app/features/soundboard/components/SoundboardPanel.module.css';
import Soundboard from '@app/features/soundboard/state/Soundboard';
import MediaEngine from '@app/features/voice/engine/MediaEngineFacade';
import {useLingui} from '@lingui/react/macro';
import {MusicNoteIcon, SpeakerHighIcon, XIcon} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import {observer} from 'mobx-react-lite';
import {useCallback, useEffect, useRef, useState} from 'react';

const logger = new Logger('SoundboardPanel');

function getSoundboardSoundURL(soundId: string): string {
	return mediaUrl(`soundboard_sounds/${soundId}`);
}

export const SoundboardPanel = observer(function SoundboardPanel() {
	const {t} = useLingui();
	const guildId = MediaEngine.guildId;
	const channelId = MediaEngine.channelId;
	const [loading, setLoading] = useState(false);
	const [playingId, setPlayingId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!guildId) return;
		setLoading(true);
		SoundboardCommands.list(guildId)
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
				SoundboardCommands.send(guildId, soundId, channelId).catch((error) => {
					logger.error('Failed to broadcast sound to voice channel:', error);
				});
			}
		},
		[playingId, guildId, channelId],
	);

	const handleClose = useCallback(() => {
		Soundboard.closePanel();
	}, []);

	if (!guildId) return null;

	const sounds = Soundboard.getGuildSounds(guildId);

	return (
		<div className={styles.panel} data-flx="soundboard.soundboard-panel.panel">
			<div className={styles.header}>
				<span className={styles.title}>{t`Soundboard`}</span>
				<button
					type="button"
					className={styles.closeButton}
					onClick={handleClose}
					aria-label={t`Close`}
					data-flx="soundboard.soundboard-panel.close"
				>
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
							data-flx="soundboard.soundboard-panel.sound"
						>
							{sound.emoji_name ? (
								<span className={styles.soundEmoji}>{sound.emoji_name}</span>
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
