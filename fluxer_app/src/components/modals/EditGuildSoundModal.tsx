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
			await GuildSoundboardActionCreators.update(guildId, sound.id, {
				name: trimmedName,
				volume,
			});
			onUpdate();
			ModalActionCreators.pop();
		} catch (err: unknown) {
			logger.error('Failed to update sound:', err);
			setError(err instanceof Error ? err.message : t`Failed to update sound`);
			setIsSubmitting(false);
		}
	}, [guildId, sound.id, name, volume, onUpdate, t]);

	return (
		<Modal.Root size="small" centered>
			<Modal.Header title={t`Edit Sound`} />
			<Modal.Content>
				<div className={styles.formContainer}>
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
					<Trans>Save</Trans>
				</Button>
			</Modal.Footer>
		</Modal.Root>
	);
});
