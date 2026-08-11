// SPDX-License-Identifier: AGPL-3.0-or-later

import {ConfirmModal} from '@app/features/app/components/dialogs/ConfirmModal';
import {mediaUrl} from '@app/features/messaging/utils/MessagingUrlUtils';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as SoundboardCommands from '@app/features/soundboard/commands/SoundboardCommands';
import {EditGuildSoundModal} from '@app/features/soundboard/components/modals/EditGuildSoundModal';
import styles from '@app/features/soundboard/components/SoundGridItem.module.css';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {modal} from '@app/features/ui/commands/ModalCommands';
import FocusRing from '@app/features/ui/focus_ring/FocusRing';
import {Tooltip} from '@app/features/ui/tooltip/Tooltip';
import * as AvatarUtils from '@app/features/user/utils/AvatarUtils';
import type {GuildSoundboardSoundWithUser} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {useLingui} from '@lingui/react/macro';
import {PauseIcon, PencilIcon, PlayIcon, XIcon} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import {observer} from 'mobx-react-lite';
import {useCallback, useRef, useState} from 'react';

const logger = new Logger('SoundGridItem');

interface SoundGridItemProps {
	guildId: string;
	sound: GuildSoundboardSoundWithUser;
	canModify: boolean;
	onUpdate: () => void;
}

export const SoundGridItem = observer(function SoundGridItem({
	guildId,
	sound,
	canModify,
	onUpdate,
}: SoundGridItemProps) {
	const {t} = useLingui();
	const [playing, setPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const handlePlay = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
			setPlaying(false);
			return;
		}

		const audio = new Audio(mediaUrl(`soundboard_sounds/${sound.id}`));
		audio.volume = sound.volume;
		audioRef.current = audio;
		setPlaying(true);

		audio.addEventListener('ended', () => {
			setPlaying(false);
			audioRef.current = null;
		});
		audio.addEventListener('error', () => {
			logger.error(`Failed to play sound ${sound.id}`);
			setPlaying(false);
			audioRef.current = null;
		});

		void audio.play();
	}, [sound.id, sound.volume]);

	const handleEdit = () => {
		ModalCommands.push(modal(() => <EditGuildSoundModal guildId={guildId} sound={sound} onUpdate={onUpdate} />));
	};

	const handleDelete = () => {
		ModalCommands.push(
			modal(() => (
				<ConfirmModal
					title={t`Delete Sound`}
					description={t`Are you sure you want to delete "${sound.name}"? This action cannot be undone.`}
					primaryText={t`Delete`}
					primaryVariant="danger"
					onPrimary={async () => {
						await SoundboardCommands.remove(guildId, sound.id);
						onUpdate();
					}}
				/>
			)),
		);
	};

	const avatarUrl = sound.user ? AvatarUtils.getUserAvatarURL(sound.user, false) : null;

	return (
		<div className={styles.container} data-flx="soundboard.sound-grid-item.container">
			<button
				type="button"
				className={clsx(styles.playButton, playing && styles.playButtonPlaying)}
				onClick={handlePlay}
				aria-label={playing ? t`Pause` : t`Play`}
				aria-pressed={playing}
				data-flx="soundboard.sound-grid-item.play"
			>
				{playing ? (
					<PauseIcon weight="fill" className={styles.playIcon} />
				) : (
					<PlayIcon weight="fill" className={styles.playIcon} />
				)}
			</button>

			<div className={styles.content}>
				<span className={styles.soundName}>
					{sound.emoji_name && <span className={styles.emojiText}>{sound.emoji_name} </span>}
					{sound.name}
				</span>
				<div className={styles.soundMeta}>
					{sound.user && avatarUrl && (
						<span className={styles.authorInfo}>
							<img src={avatarUrl} alt="" className={styles.authorAvatar} loading="lazy" />
							{sound.user.username}
						</span>
					)}
					<span className={styles.volumeText}>{Math.round(sound.volume * 100)}%</span>
				</div>
			</div>

			{canModify && (
				<div className={styles.actions}>
					<Tooltip text={t`Edit`}>
						<FocusRing offset={-2}>
							<button
								type="button"
								onClick={handleEdit}
								className={styles.actionButton}
								aria-label={t`Edit`}
								data-flx="soundboard.sound-grid-item.edit"
							>
								<PencilIcon className={styles.icon} weight="bold" />
							</button>
						</FocusRing>
					</Tooltip>

					<Tooltip text={t`Delete`}>
						<FocusRing offset={-2}>
							<button
								type="button"
								onClick={handleDelete}
								className={clsx(styles.actionButton, styles.deleteButton)}
								aria-label={t`Delete`}
								data-flx="soundboard.sound-grid-item.delete"
							>
								<XIcon className={styles.icon} weight="bold" />
							</button>
						</FocusRing>
					</Tooltip>
				</div>
			)}
		</div>
	);
});
