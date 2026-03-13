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
import {Input} from '@app/components/form/Input';
import styles from '@app/components/modals/AddGuildSoundModal.module.css';
import * as Modal from '@app/components/modals/Modal';
import {Button} from '@app/components/uikit/button/Button';
import {Logger} from '@app/lib/Logger';
import {fileToBase64} from '@app/utils/AvatarUtils';
import {SOUNDBOARD_SOUND_MAX_SIZE} from '@fluxer/constants/src/LimitConstants';
import {Trans, useLingui} from '@lingui/react/macro';
import {MusicNoteIcon, PauseIcon, PlayIcon} from '@phosphor-icons/react';
import {observer} from 'mobx-react-lite';
import {useCallback, useEffect, useRef, useState} from 'react';

const logger = new Logger('AddGuildSoundModal');

interface AddGuildSoundModalProps {
	guildId: string;
	file: File;
	onSuccess: () => void;
}

function sanitizeSoundName(fileName: string): string {
	const name =
		fileName
			.split('.')
			.shift()
			?.replace(/[^\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\uFE0F_ ]/gu, '') ?? '';
	return name.padEnd(2, '_').slice(0, 32);
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	return `${Math.round(bytes / 1024)} KB`;
}

export const AddGuildSoundModal = observer(function AddGuildSoundModal({
	guildId,
	file,
	onSuccess,
}: AddGuildSoundModalProps) {
	const {t} = useLingui();
	const [name, setName] = useState(sanitizeSoundName(file.name));
	const [volume, setVolume] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [playing, setPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const previewUrlRef = useRef<string | null>(null);

	useEffect(() => {
		previewUrlRef.current = URL.createObjectURL(file);
		return () => {
			if (previewUrlRef.current) {
				URL.revokeObjectURL(previewUrlRef.current);
			}
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, [file]);

	const handlePlayPreview = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
			setPlaying(false);
			return;
		}

		if (!previewUrlRef.current) return;
		const audio = new Audio(previewUrlRef.current);
		audio.volume = volume;
		audioRef.current = audio;
		setPlaying(true);

		audio.addEventListener('ended', () => {
			setPlaying(false);
			audioRef.current = null;
		});

		void audio.play();
	}, [volume]);

	const handleSubmit = useCallback(async () => {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		if (file.size > SOUNDBOARD_SOUND_MAX_SIZE) {
			setError(t`File is too large. Maximum size is ${Math.round(SOUNDBOARD_SOUND_MAX_SIZE / 1024)} KB.`);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const base64Sound = await fileToBase64(file);
			await GuildSoundboardActionCreators.create(guildId, {
				name: trimmedName,
				sound: base64Sound,
				volume,
			});
			onSuccess();
			ModalActionCreators.pop();
		} catch (err: unknown) {
			logger.error('Failed to create sound:', err);
			setError(err instanceof Error ? err.message : t`Failed to create sound`);
			setIsSubmitting(false);
		}
	}, [guildId, name, volume, file, onSuccess, t]);

	return (
		<Modal.Root size="small" centered>
			<Modal.Header title={t`Add Sound`} />
			<Modal.Content>
				<div className={styles.formContainer}>
					<div className={styles.audioPreview}>
						<MusicNoteIcon weight="fill" className={styles.audioIcon} />
						<div className={styles.audioInfo}>
							<span className={styles.audioFileName}>{file.name}</span>
							<span className={styles.audioFileSize}>{formatFileSize(file.size)}</span>
						</div>
						<button type="button" className={styles.playButton} onClick={handlePlayPreview}>
							{playing ? (
								<PauseIcon weight="fill" className={styles.playButtonIcon} />
							) : (
								<PlayIcon weight="fill" className={styles.playButtonIcon} />
							)}
						</button>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label}>{t`Name`}</label>
						<Input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={32}
							placeholder={t`Sound name`}
							error={error ?? undefined}
							disabled={isSubmitting}
						/>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label}>
							{t`Volume`} <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
						</label>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							onChange={(e) => setVolume(Number(e.target.value))}
							className={styles.volumeSlider}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal.Content>
			<Modal.Footer>
				<Button variant="secondary" onClick={() => ModalActionCreators.pop()} disabled={isSubmitting}>
					<Trans>Cancel</Trans>
				</Button>
				<Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} submitting={isSubmitting}>
					<Trans>Create</Trans>
				</Button>
			</Modal.Footer>
		</Modal.Root>
	);
});
