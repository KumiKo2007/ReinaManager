/**
 * @file Settings page
 * @description Organizes all settings sections for the app.
 */

import { Breadcrumbs, Link, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { PageContainer } from "@toolpad/core/PageContainer";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { PathSettingsModal } from "@/components/PathSettingsModal";
import { useScrollRestore } from "@/hooks/common/useScrollRestore";
import { AboutSection } from "./AboutSettings";
import { ThemeAppearanceSettings } from "./AppearanceSettings";
import {
	BgmTokenSettings,
	CollectionSyncSettings,
	VndbTokenSettings,
} from "./AccountSettings";
import {
	DevSettings,
	MixedSearchSourceSettings,
	VndbDataSettings,
} from "./DataSourceSettings";
import {
	CardClickModeSettings,
	LanguageSelect,
	NsfwSettings,
	StartupPageSettings,
} from "./GeneralSettings";
import { DatabaseBackupSettings } from "./MaintenanceSettings";
import { SettingsDivider, SettingsGroup, SettingsItem } from "./SettingsLayout";
import {
	AutoStartSettings,
	CloseBtnSettings,
	LinuxLaunchCommandSettings,
	LogLevelSettings,
	ProxySettings,
	TimeTrackingModeSettings,
} from "./SystemSettings";

type SettingsSection = {
	id: string;
	label: string;
	description: string;
	content: React.ReactNode;
};

type SettingsPageHeaderProps = {
	title?: string;
	breadcrumbs?: { title: string; path: string }[];
};

const SettingsPageHeader: React.FC<SettingsPageHeaderProps> = ({
	title,
	breadcrumbs = [],
}) => (
	<Box>
		<Breadcrumbs aria-label="breadcrumb">
			{breadcrumbs.map((item) => (
				<Link
					key={`${item.path}-${item.title}`}
					component={RouterLink}
					to={item.path}
					underline="hover"
					color="inherit"
				>
					{item.title}
				</Link>
			))}
		</Breadcrumbs>
		<Typography variant="h4" component="h1" className="mt-1">
			{title}
		</Typography>
	</Box>
);

/**
 * Settings page
 */
export const Settings: React.FC = () => {
	const { t } = useTranslation();
	useScrollRestore("/settings");
	const [pathSettingsModalOpen, setPathSettingsModalOpen] = useState(false);
	const [activeSectionId, setActiveSectionId] = useState("account");
	const pageTitle = t("app.NAVIGATION.settings", "Settings");
	const breadcrumbs = useMemo(
		() => [
			{ title: t("app.NAVIGATION.home", "Home"), path: "/" },
			{ title: pageTitle, path: "/settings" },
		],
		[t, pageTitle],
	);

	const sections = useMemo<SettingsSection[]>(
		() => [
			{
				id: "account",
				label: t("pages.Settings.sections.account", "Account & Sync"),
				description: t(
					"pages.Settings.sections.accountDescription",
					"Manage data source tokens and sync behavior.",
				),
				content: (
					<>
						<BgmTokenSettings />
						<SettingsDivider />
						<VndbTokenSettings />
						<SettingsDivider />
						<CollectionSyncSettings />
					</>
				),
			},
			{
				id: "data-source",
				label: t("pages.Settings.sections.dataSource", "Data Sources"),
				description: t(
					"pages.Settings.sections.dataSourceDescription",
					"Configure search sources, VNDB data handling, and bulk maintenance.",
				),
				content: (
					<>
						<MixedSearchSourceSettings />
						<SettingsDivider />
						<VndbDataSettings />
						<SettingsDivider />
						<DevSettings />
					</>
				),
			},
			{
				id: "appearance",
				label: t("pages.Settings.sections.appearance", "主题外观"),
				description: t(
					"pages.Settings.sections.appearanceDescription",
					"自定义壁纸、遮罩和界面透明度。",
				),
				content: <ThemeAppearanceSettings />,
			},
			{
				id: "display",
				label: t("pages.Settings.sections.display", "Display & Interaction"),
				description: t(
					"pages.Settings.sections.displayDescription",
					"Adjust language, content filtering, and card interaction behavior.",
				),
				content: (
					<Box className="space-y-5">
						<LanguageSelect />
						<SettingsDivider />
						<StartupPageSettings />
						<SettingsDivider />
						<NsfwSettings />
						<SettingsDivider />
						<CardClickModeSettings />
					</Box>
				),
			},
			{
				id: "system",
				label: t("pages.Settings.sections.system", "System"),
				description: t(
					"pages.Settings.sections.systemDescription",
					"Manage startup, logs, close behavior, and playtime tracking.",
				),
				content: (
					<Box className="space-y-5">
						<AutoStartSettings />
						<SettingsDivider />
						<LogLevelSettings />
						<SettingsDivider />
						<ProxySettings />
						<SettingsDivider />
						<CloseBtnSettings />
						<SettingsDivider />
						<TimeTrackingModeSettings />
						{import.meta.env.TAURI_ENV_PLATFORM === "linux" && (
							<>
								<SettingsDivider />
								<LinuxLaunchCommandSettings />
							</>
						)}
					</Box>
				),
			},
			{
				id: "storage",
				label: t("pages.Settings.sections.storage", "Paths & Backup"),
				description: t(
					"pages.Settings.sections.storageDescription",
					"Configure local paths and run data backup or restore tools.",
				),
				content: (
					<>
						<SettingsGroup title={t("pages.Settings.pathSettings.title", "Path settings")}>
							<SettingsItem
								stacked
								title={t(
									"pages.Settings.pathSettings.openModal",
									"Open path settings",
								)}
								description={t(
									"pages.Settings.pathSettings.note",
									"Configure game save folders, database backups, LE, and Magpie paths.",
								)}
							>
								<Button
									variant="outlined"
									onClick={() => setPathSettingsModalOpen(true)}
									className="px-4 py-2"
								>
									{t("pages.Settings.pathSettings.openModal", "Open path settings")}
								</Button>
							</SettingsItem>
						</SettingsGroup>
						<SettingsDivider />
						<DatabaseBackupSettings />
					</>
				),
			},
			{
				id: "about",
				label: t("pages.Settings.sections.about", "About"),
				description: t(
					"pages.Settings.sections.aboutDescription",
					"View version info, update status, docs, and feedback links.",
				),
				content: <AboutSection />,
			},
		],
		[t],
	);

	useEffect(() => {
		const sectionElements = sections
			.map((section) => document.getElementById(section.id))
			.filter((element): element is HTMLElement => Boolean(element));

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntry = entries
					.filter((entry) => entry.isIntersecting)
					.toSorted((a, b) => b.intersectionRatio - a.intersectionRatio)
					.at(0);

				if (visibleEntry) {
					setActiveSectionId(visibleEntry.target.id);
				}
			},
			{
				root: document.querySelector("main"),
				rootMargin: "-16px 0px -70% 0px",
				threshold: [0.1, 0.3, 0.6],
			},
		);

		for (const element of sectionElements) {
			observer.observe(element);
		}

		return () => observer.disconnect();
	}, [sections]);

	const handleSectionClick = (sectionId: string) => {
		document.getElementById(sectionId)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	return (
		<PageContainer
			className="w-full max-w-full"
			title={pageTitle}
			breadcrumbs={breadcrumbs}
			slots={{ header: SettingsPageHeader }}
			sx={{ maxWidth: "100% !important" }}
		>
			<Box className="w-full">
				<Box className="grid w-full grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
					<nav
						className="sticky top-4 z-10 h-fit overflow-x-auto border-0 border-b border-solid border-[var(--mui-palette-divider)] py-3 lg:border-b-0 lg:border-r lg:py-4 lg:pr-4"
						style={{
							backgroundColor:
								"var(--reina-surface-bg, var(--mui-palette-background-default))",
						}}
						aria-label={t("pages.Settings.navigation", "Settings navigation")}
					>
						<Box className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-1">
							{sections.map((section) => {
								const isActive = section.id === activeSectionId;

								return (
									<button
										key={section.id}
										type="button"
										onClick={() => handleSectionClick(section.id)}
										className={`rounded-lg border-0 px-3 py-2 text-left text-sm transition-colors lg:w-full ${
											isActive
												? "bg-[var(--mui-palette-primary-main)] text-[var(--mui-palette-primary-contrastText)] font-semibold"
												: "bg-transparent text-[var(--mui-palette-text-primary)] hover:bg-[var(--mui-palette-action-hover)]"
										}`}
									>
										{section.label}
									</button>
								);
							})}
						</Box>
					</nav>

					<Box className="min-w-0 w-full space-y-8 pt-5 lg:pl-6">
						{sections.map((section) => (
							<section
								key={section.id}
								id={section.id}
								className="scroll-mt-24 lg:scroll-mt-8"
							>
								<Box className="mb-3">
									<Typography variant="h6" component="h2" className="font-semibold">
										{section.label}
									</Typography>
									<Typography variant="body2" color="text.secondary" className="mt-1">
										{section.description}
									</Typography>
								</Box>
								<Box
									className="w-full rounded-xl border border-solid border-[var(--mui-palette-divider)] px-5 py-5"
									sx={{
										backgroundColor:
											"var(--reina-surface-bg, var(--mui-palette-background-paper))",
									}}
								>
									{section.content}
								</Box>
							</section>
						))}
					</Box>
				</Box>
			</Box>

			<PathSettingsModal
				open={pathSettingsModalOpen}
				onClose={() => setPathSettingsModalOpen(false)}
				inSettingsPage={true}
			/>
		</PageContainer>
	);
};
