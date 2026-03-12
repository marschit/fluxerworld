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
import * as ModalActionCreators from '@app/actions/ModalActionCreators';
import {ConfirmModal} from '@app/components/modals/ConfirmModal';
import {EditGuildSoundModal} from '@app/components/modals/EditGuildSoundModal';
import styles from '@app/components/sounds/SoundGridItem.module.css';
import FocusRing from '@app/components/uikit/focus_ring/FocusRing';
import {Tooltip} from '@app/components/uikit/tooltip/Tooltip';
import {Logger} from '@app/lib/Logger';
import * as AvatarUtils from '@app/utils/AvatarUtils';
import {mediaUrl} from '@app/utils/UrlUtils';
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

export const SoundGridItem = observer(function SoundGridItem({guildId, sound, canModify, onUpdate}: SoundGridItemProps) {
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
		ModalActionCreators.push(
			ModalActionCreators.modal(() => <EditGuildSoundModal guildId={guildId} sound={sound} onUpdate={onUpdate} />),
		);
	};

	const handleDelete = () => {
		ModalActionCreators.push(
			ModalActionCreators.modal(() => (
				<ConfirmModal
					title={t`Delete Sound`}
					description={t`Are you sure you want to delete "${sound.name}"? This action cannot be undone.`}
					primaryText={t`Delete`}
					primaryVariant="danger-primary"
					onPrimary={async () => {
						await GuildSoundboardActionCreators.remove(guildId, sound.id);
						onUpdate();
					}}
				/>
			)),
		);
	};

	const avatarUrl = sound.user ? AvatarUtils.getUserAvatarURL(sound.user, false) : null;

	return (
		<div className={styles.container}>
			<button
				type="button"
				className={clsx(styles.playButton, playing && styles.playButtonPlaying)}
				onClick={handlePlay}
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
							<button type="button" onClick={handleEdit} className={styles.actionButton}>
								<PencilIcon className={styles.icon} weight="bold" />
							</button>
						</FocusRing>
					</Tooltip>

					<Tooltip text={t`Delete`}>
						<FocusRing offset={-2}>
							<button type="button" onClick={handleDelete} className={clsx(styles.actionButton, styles.deleteButton)}>
								<XIcon className={styles.icon} weight="bold" />
							</button>
						</FocusRing>
					</Tooltip>
				</div>
			)}
		</div>
	);
});
