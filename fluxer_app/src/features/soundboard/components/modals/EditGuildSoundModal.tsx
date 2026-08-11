// SPDX-License-Identifier: AGPL-3.0-or-later

import * as Modal from '@app/features/app/components/dialogs/Modal';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as SoundboardCommands from '@app/features/soundboard/commands/SoundboardCommands';
import styles from '@app/features/soundboard/components/modals/AddGuildSoundModal.module.css';
import {Button} from '@app/features/ui/button/Button';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {Input} from '@app/features/ui/components/form/FormInput';
import type {GuildSoundboardSoundWithUser} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {Trans, useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';
import {useCallback, useState} from 'react';

const logger = new Logger('EditGuildSoundModal');

interface EditGuildSoundModalProps {
	guildId: string;
	sound: GuildSoundboardSoundWithUser;
	onUpdate: () => void;
}

export const EditGuildSoundModal = observer(function EditGuildSoundModal({
	guildId,
	sound,
	onUpdate,
}: EditGuildSoundModalProps) {
	const {t} = useLingui();
	const [name, setName] = useState(sound.name);
	const [volume, setVolume] = useState(sound.volume);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(async () => {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		setIsSubmitting(true);
		setError(null);

		try {
			await SoundboardCommands.update(guildId, sound.id, {
				name: trimmedName,
				volume,
			});
			onUpdate();
			ModalCommands.pop();
		} catch (err: unknown) {
			logger.error('Failed to update sound:', err);
			setError(err instanceof Error ? err.message : t`Failed to update sound`);
			setIsSubmitting(false);
		}
	}, [guildId, sound.id, name, volume, onUpdate, t]);

	return (
		<Modal.Root size="small" centered data-flx="soundboard.edit-guild-sound-modal.modal-root">
			<Modal.Header title={t`Edit Sound`} data-flx="soundboard.edit-guild-sound-modal.modal-header" />
			<Modal.Content data-flx="soundboard.edit-guild-sound-modal.modal-content">
				<div className={styles.formContainer} data-flx="soundboard.edit-guild-sound-modal.form-container">
					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="soundboard-edit-sound-name">{t`Name`}</label>
						<Input
							id="soundboard-edit-sound-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={32}
							placeholder={t`Sound name`}
							error={error ?? undefined}
							disabled={isSubmitting}
							data-flx="soundboard.edit-guild-sound-modal.name-input"
						/>
					</div>

					<div className={styles.fieldGroup}>
						<label className={styles.label} htmlFor="soundboard-edit-sound-volume">
							{t`Volume`} <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
						</label>
						<input
							id="soundboard-edit-sound-volume"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							onChange={(e) => setVolume(Number(e.target.value))}
							className={styles.volumeSlider}
							disabled={isSubmitting}
							data-flx="soundboard.edit-guild-sound-modal.volume-slider"
						/>
					</div>
				</div>
			</Modal.Content>
			<Modal.Footer data-flx="soundboard.edit-guild-sound-modal.modal-footer">
				<Button
					variant="secondary"
					onClick={() => ModalCommands.pop()}
					disabled={isSubmitting}
					data-flx="soundboard.edit-guild-sound-modal.cancel"
				>
					<Trans>Cancel</Trans>
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!name.trim() || isSubmitting}
					submitting={isSubmitting}
					data-flx="soundboard.edit-guild-sound-modal.save"
				>
					<Trans>Save</Trans>
				</Button>
			</Modal.Footer>
		</Modal.Root>
	);
});
