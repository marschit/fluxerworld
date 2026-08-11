// SPDX-License-Identifier: AGPL-3.0-or-later

import * as Modal from '@app/features/app/components/dialogs/Modal';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as SoundboardCommands from '@app/features/soundboard/commands/SoundboardCommands';
import styles from '@app/features/soundboard/components/modals/AddGuildSoundModal.module.css';
import {Button} from '@app/features/ui/button/Button';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {Input} from '@app/features/ui/components/form/FormInput';
import {fileToBase64} from '@app/features/user/utils/AvatarUtils';
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
	// biome-ignore lint/suspicious/noMisleadingCharacterClass: must mirror the server-side name validation regex, which allows the emoji variation selector
	const namePattern = /[^\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}️_ ]/gu;
	const name = fileName.split('.').shift()?.replace(namePattern, '') ?? '';
	return name.padEnd(2, '_').slice(0, 32);
}

function formatSoundFileSize(bytes: number): string {
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
			await SoundboardCommands.create(guildId, {
				name: trimmedName,
				sound: base64Sound,
				volume,
			});
			onSuccess();
			ModalCommands.pop();
		} catch (err: unknown) {
			logger.error('Failed to create sound:', err);
			setError(err instanceof Error ? err.message : t`Failed to create sound`);
			setIsSubmitting(false);
		}
	}, [guildId, name, volume, file, onSuccess, t]);

	return (
		<Modal.Root size="small" centered data-flx="soundboard.add-guild-sound-modal.modal-root">
			<Modal.Header title={t`Add Sound`} data-flx="soundboard.add-guild-sound-modal.modal-header" />
			<Modal.Content data-flx="soundboard.add-guild-sound-modal.modal-content">
				<div className={styles.formContainer} data-flx="soundboard.add-guild-sound-modal.form-container">
					<div className={styles.audioPreview}>
						<MusicNoteIcon weight="fill" className={styles.audioIcon} />
						<div className={styles.audioInfo}>
							<span className={styles.audioFileName}>{file.name}</span>
							<span className={styles.audioFileSize}>{formatSoundFileSize(file.size)}</span>
						</div>
						<button
							type="button"
							className={styles.playButton}
							onClick={handlePlayPreview}
							aria-label={playing ? t`Pause preview` : t`Play preview`}
							data-flx="soundboard.add-guild-sound-modal.play-preview"
						>
							{playing ? (
								<PauseIcon weight="fill" className={styles.playButtonIcon} />
							) : (
								<PlayIcon weight="fill" className={styles.playButtonIcon} />
							)}
						</button>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="soundboard-add-sound-name">{t`Name`}</label>
						<Input
							id="soundboard-add-sound-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={32}
							placeholder={t`Sound name`}
							error={error ?? undefined}
							disabled={isSubmitting}
							data-flx="soundboard.add-guild-sound-modal.name-input"
						/>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="soundboard-add-sound-volume">
							{t`Volume`} <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
						</label>
						<input
							id="soundboard-add-sound-volume"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							onChange={(e) => setVolume(Number(e.target.value))}
							className={styles.volumeSlider}
							disabled={isSubmitting}
							data-flx="soundboard.add-guild-sound-modal.volume-slider"
						/>
					</div>
				</div>
			</Modal.Content>
			<Modal.Footer data-flx="soundboard.add-guild-sound-modal.modal-footer">
				<Button
					variant="secondary"
					onClick={() => ModalCommands.pop()}
					disabled={isSubmitting}
					data-flx="soundboard.add-guild-sound-modal.cancel"
				>
					<Trans>Cancel</Trans>
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!name.trim() || isSubmitting}
					submitting={isSubmitting}
					data-flx="soundboard.add-guild-sound-modal.create"
				>
					<Trans>Create</Trans>
				</Button>
			</Modal.Footer>
		</Modal.Root>
	);
});
