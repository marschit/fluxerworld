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
import {modal} from '@app/actions/ModalActionCreators';
import {Input} from '@app/components/form/Input';
import {UploadDropZone} from '@app/components/guild/UploadDropZone';
import {UploadSlotInfo} from '@app/components/guild/UploadSlotInfo';
import {AddGuildSoundModal} from '@app/components/modals/AddGuildSoundModal';
import styles from '@app/components/modals/guild_tabs/GuildSoundboardTab.module.css';
import {StatusSlate} from '@app/components/modals/shared/StatusSlate';
import {SoundGridItem} from '@app/components/sounds/SoundGridItem';
import {Spinner} from '@app/components/uikit/Spinner';
import {Logger} from '@app/lib/Logger';
import PermissionStore from '@app/stores/PermissionStore';
import UserStore from '@app/stores/UserStore';
import {openFilePicker} from '@app/utils/FilePickerUtils';
import {Permissions} from '@fluxer/constants/src/ChannelConstants';
import type {GuildSoundboardSoundWithUser} from '@fluxer/schema/src/domains/guild/GuildSoundboardSchemas';
import {sortBySnowflakeDesc} from '@fluxer/snowflake/src/SnowflakeUtils';
import {Trans, useLingui} from '@lingui/react/macro';
import {MagnifyingGlassIcon, WarningCircleIcon} from '@phosphor-icons/react';
import {matchSorter} from 'match-sorter';
import {observer} from 'mobx-react-lite';
import type React from 'react';
import {useCallback, useEffect, useMemo, useState} from 'react';

const logger = new Logger('GuildSoundboardTab');

const SOUND_ACCEPT = '.mp3,.ogg,.wav';

const GuildSoundboardTab: React.FC<{guildId: string}> = observer(function GuildSoundboardTab({guildId}) {
	const {t} = useLingui();
	const [sounds, setSounds] = useState<ReadonlyArray<GuildSoundboardSoundWithUser>>([]);
	const [fetchStatus, setFetchStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [searchQuery, setSearchQuery] = useState('');

	const canCreateExpressions = PermissionStore.can(Permissions.CREATE_EXPRESSIONS, {guildId});
	const canManageExpressions = PermissionStore.can(Permissions.MANAGE_EXPRESSIONS, {guildId});
	const currentUserId = UserStore.currentUserId;

	const fetchSounds = useCallback(async () => {
		try {
			setFetchStatus('pending');
			const soundList = await GuildSoundboardActionCreators.list(guildId);
			setSounds(Object.freeze(sortBySnowflakeDesc(soundList)));
			setFetchStatus('success');
		} catch (error) {
			logger.error('Failed to fetch sounds', error);
			setFetchStatus('error');
		}
	}, [guildId]);

	useEffect(() => {
		if (fetchStatus === 'idle') {
			void fetchSounds();
		}
	}, [fetchStatus, fetchSounds]);

	const handleAddSound = async () => {
		const [file] = await openFilePicker({accept: SOUND_ACCEPT});
		if (file) {
			ModalActionCreators.push(modal(() => <AddGuildSoundModal guildId={guildId} file={file} onSuccess={fetchSounds} />));
		}
	};

	const handleDrop = (files: Array<File>) => {
		const file = files[0];
		if (file) {
			ModalActionCreators.push(modal(() => <AddGuildSoundModal guildId={guildId} file={file} onSuccess={fetchSounds} />));
		}
	};

	const filteredSounds = useMemo(() => {
		if (!searchQuery) return sounds;
		return matchSorter([...sounds], searchQuery, {
			keys: [(sound) => sound.name],
		});
	}, [sounds, searchQuery]);

	const canModifySound = useCallback(
		(sound: GuildSoundboardSoundWithUser): boolean => {
			if (canManageExpressions) return true;
			if (canCreateExpressions && sound.user?.id === currentUserId) return true;
			return false;
		},
		[canManageExpressions, canCreateExpressions, currentUserId],
	);

	return (
		<div className={styles.container}>
			<div className={styles.controls}>
				<Input
					type="text"
					placeholder={t`Search sounds...`}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					leftIcon={<MagnifyingGlassIcon size={16} weight="bold" />}
					className={styles.searchInput}
				/>
			</div>

			{canCreateExpressions && (
				<>
					<UploadSlotInfo
						title={<Trans>Sounds</Trans>}
						currentCount={sounds.length}
						maxCount={Number.POSITIVE_INFINITY}
						uploadButtonText={<Trans>Upload Sound</Trans>}
						onUploadClick={handleAddSound}
						description={
							<Trans>
								Sounds must be no larger than 512 KB. Allowed file types: MP3, OGG, WAV.
							</Trans>
						}
					/>
					<UploadDropZone
						onDrop={handleDrop}
						description={<Trans>Drag and drop a sound file here</Trans>}
						acceptMultiple={false}
					/>
				</>
			)}

			{fetchStatus === 'pending' && (
				<div className={styles.spinnerContainer}>
					<Spinner />
				</div>
			)}

			{searchQuery && filteredSounds.length === 0 && (
				<StatusSlate
					Icon={MagnifyingGlassIcon}
					title={t`No Sounds Found`}
					description={t`No sounds found matching your search.`}
					fullHeight={true}
				/>
			)}

			{fetchStatus === 'success' && filteredSounds.length > 0 && (
				<div className={styles.soundGrid}>
					{filteredSounds.map((sound) => (
						<SoundGridItem
							key={sound.id}
							guildId={guildId}
							sound={sound}
							canModify={canModifySound(sound)}
							onUpdate={fetchSounds}
						/>
					))}
				</div>
			)}

			{fetchStatus === 'error' && (
				<StatusSlate
					Icon={WarningCircleIcon}
					title={t`Failed to Load Sounds`}
					description={t`There was an error loading the sounds. Please try again.`}
					actions={[
						{
							text: t`Retry`,
							onClick: fetchSounds,
							variant: 'primary',
						},
					]}
					fullHeight={true}
				/>
			)}
		</div>
	);
});

export default GuildSoundboardTab;
