// SPDX-License-Identifier: AGPL-3.0-or-later

import {StatusSlate} from '@app/features/app/components/dialogs/shared/StatusSlate';
import styles from '@app/features/guild/components/modals/guild_tabs/GuildSoundboardTab.module.css';
import {UploadDropZone} from '@app/features/guild/components/UploadDropZone';
import {UploadSlotInfo} from '@app/features/guild/components/UploadSlotInfo';
import {openFilePicker} from '@app/features/messaging/utils/FilePickerUtils';
import Permission from '@app/features/permissions/state/Permission';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as SoundboardCommands from '@app/features/soundboard/commands/SoundboardCommands';
import {AddGuildSoundModal} from '@app/features/soundboard/components/modals/AddGuildSoundModal';
import {SoundGridItem} from '@app/features/soundboard/components/SoundGridItem';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {modal} from '@app/features/ui/commands/ModalCommands';
import {Input} from '@app/features/ui/components/form/FormInput';
import {Spinner} from '@app/features/ui/components/Spinner';
import Users from '@app/features/user/state/Users';
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

	const canCreateExpressions = Permission.can(Permissions.CREATE_EXPRESSIONS, {guildId});
	const canManageExpressions = Permission.can(Permissions.MANAGE_EXPRESSIONS, {guildId});
	const currentUserId = Users.currentUserId;

	const fetchSounds = useCallback(async () => {
		try {
			setFetchStatus('pending');
			const soundList = await SoundboardCommands.list(guildId);
			setSounds(Object.freeze(sortBySnowflakeDesc([...soundList])));
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
			ModalCommands.push(modal(() => <AddGuildSoundModal guildId={guildId} file={file} onSuccess={fetchSounds} />));
		}
	};

	const handleDrop = (files: Array<File>) => {
		const file = files[0];
		if (file) {
			ModalCommands.push(modal(() => <AddGuildSoundModal guildId={guildId} file={file} onSuccess={fetchSounds} />));
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
		<div className={styles.container} data-flx="guild.guild-soundboard-tab.container">
			<div className={styles.controls}>
				<Input
					type="text"
					placeholder={t`Search sounds...`}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					leftIcon={<MagnifyingGlassIcon size={16} weight="bold" />}
					className={styles.searchInput}
					data-flx="guild.guild-soundboard-tab.search-input"
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
						description={<Trans>Sounds must be no larger than 512 KB. Allowed file types: MP3, OGG, WAV.</Trans>}
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
