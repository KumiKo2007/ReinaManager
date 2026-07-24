import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import UploadIcon from "@mui/icons-material/Upload";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { open } from "@tauri-apps/plugin-dialog";
import { type SyntheticEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAllSettings, useUpdateSettings } from "@/hooks/queries/useSettings";
import { snackbar } from "@/providers/snackBar";
import { getAppDataDirPath } from "@/services/fs/pathCache";
import { fileService } from "@/services/invoke";
import type {
	ThemeAppearance,
	ThemeWallpaperFit,
	ThemeWallpaperPosition,
} from "@/types";
import { getUserErrorMessage } from "@/utils/errors";
import {
	DEFAULT_THEME_APPEARANCE,
	THEME_WALLPAPER_EXTENSIONS,
	buildThemeWallpaperPath,
	getThemeWallpaperUrl,
	isManagedThemeWallpaper,
	normalizeThemeAppearance,
} from "@/utils/themeAppearance";
import { SettingsGroup, SettingsItem } from "./SettingsLayout";

const fitOptions: ThemeWallpaperFit[] = ["cover", "contain", "fill", "repeat"];
const positionOptions: ThemeWallpaperPosition[] = [
	"center",
	"top",
	"bottom",
	"left",
	"right",
];

type TranslateFn = TFunction;

function getFitLabel(t: TranslateFn, fit: ThemeWallpaperFit) {
	switch (fit) {
		case "cover":
			return t("pages.Settings.appearance.fitCover", "填充");
		case "contain":
			return t("pages.Settings.appearance.fitContain", "适应");
		case "fill":
			return t("pages.Settings.appearance.fitFill", "拉伸");
		case "repeat":
			return t("pages.Settings.appearance.fitRepeat", "平铺");
		default:
			return fit;
	}
}

function getPositionLabel(t: TranslateFn, position: ThemeWallpaperPosition) {
	switch (position) {
		case "center":
			return t("pages.Settings.appearance.positionCenter", "居中");
		case "top":
			return t("pages.Settings.appearance.positionTop", "顶部");
		case "bottom":
			return t("pages.Settings.appearance.positionBottom", "底部");
		case "left":
			return t("pages.Settings.appearance.positionLeft", "左侧");
		case "right":
			return t("pages.Settings.appearance.positionRight", "右侧");
		default:
			return position;
	}
}

function formatPercent(value: number) {
	return value + "%";
}

export const ThemeAppearanceSettings = () => {
	const { t } = useTranslation();
	const { data: settings } = useAllSettings();
	const updateSettingsMutation = useUpdateSettings();
	const [draft, setDraft] = useState<ThemeAppearance>(DEFAULT_THEME_APPEARANCE);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setDraft(normalizeThemeAppearance(settings?.theme_appearance));
	}, [settings?.theme_appearance]);

	const wallpaperUrl = useMemo(
		() => getThemeWallpaperUrl(draft.wallpaperPath),
		[draft.wallpaperPath],
	);

	const persistAppearance = async (
		nextAppearance: ThemeAppearance | null,
		successMessage?: string,
		rollbackAppearance?: ThemeAppearance,
	) => {
		try {
			setIsSaving(true);
			await updateSettingsMutation.mutateAsync({
				themeAppearance: nextAppearance,
			});
			setDraft(normalizeThemeAppearance(nextAppearance));
			if (successMessage) snackbar.success(successMessage);
			return true;
		} catch (error) {
			if (rollbackAppearance) {
				setDraft(rollbackAppearance);
			}
			snackbar.error(
				t("pages.Settings.appearance.saveFailed", "保存主题设置失败：{{error}}", {
					error: getUserErrorMessage(error, t),
				}),
			);
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	const updateDraftAndSave = async (nextAppearance: ThemeAppearance) => {
		const previousAppearance = draft;
		setDraft(nextAppearance);
		await persistAppearance(nextAppearance, undefined, previousAppearance);
	};

	const handleEnabledChange = async (enabled: boolean) => {
		const nextAppearance = { ...draft, enabled };
		await updateDraftAndSave(nextAppearance);
		if (enabled && !nextAppearance.wallpaperPath) {
			snackbar.info(
				t("pages.Settings.appearance.needWallpaper", "请先选择一张图片作为自定义主题背景。"),
			);
		}
	};

	const handleSelectWallpaper = async () => {
		try {
			const selectedPath = await open({
				title: t("pages.Settings.appearance.selectWallpaper", "选择主题背景"),
				multiple: false,
				directory: false,
				filters: [
					{
						name: t("pages.Settings.appearance.imageFiles", "图片文件"),
						extensions: THEME_WALLPAPER_EXTENSIONS,
					},
				],
			});

			if (!selectedPath || Array.isArray(selectedPath)) return;

			const appDataDir = getAppDataDirPath();
			const previousWallpaperPath = draft.wallpaperPath;
			const targetPath = buildThemeWallpaperPath(appDataDir, selectedPath);
			await fileService.copyFile(selectedPath, targetPath);

			const nextAppearance = {
				...draft,
				enabled: true,
				wallpaperPath: targetPath,
			};

			const saved = await persistAppearance(
				nextAppearance,
				t("pages.Settings.appearance.uploaded", "主题背景已应用。"),
			);

			if (!saved) {
				await fileService.deleteFile(targetPath).catch(console.warn);
				return;
			}

			if (
				previousWallpaperPath &&
				previousWallpaperPath !== targetPath &&
				isManagedThemeWallpaper(appDataDir, previousWallpaperPath)
			) {
				await fileService.deleteFile(previousWallpaperPath).catch(console.warn);
			}
		} catch (error) {
			snackbar.error(
				t("pages.Settings.appearance.uploadFailed", "导入主题背景失败：{{error}}", {
					error: getUserErrorMessage(error, t),
				}),
			);
		}
	};

	const handleRemoveWallpaper = async () => {
		const previousWallpaperPath = draft.wallpaperPath;
		const nextAppearance = {
			...draft,
			enabled: false,
			wallpaperPath: null,
		};
		const saved = await persistAppearance(
			nextAppearance,
			t("pages.Settings.appearance.removed", "主题背景已移除。"),
			draft,
		);

		if (!saved || !previousWallpaperPath) return;

		try {
			const appDataDir = getAppDataDirPath();
			if (isManagedThemeWallpaper(appDataDir, previousWallpaperPath)) {
				await fileService.deleteFile(previousWallpaperPath);
			}
		} catch (error) {
			console.warn("Failed to delete theme wallpaper:", error);
		}
	};

	const handleReset = async () => {
		const previousWallpaperPath = draft.wallpaperPath;
		const saved = await persistAppearance(
			null,
			t("pages.Settings.appearance.resetDone", "主题外观已重置。"),
			draft,
		);

		if (!saved || !previousWallpaperPath) return;

		try {
			const appDataDir = getAppDataDirPath();
			if (isManagedThemeWallpaper(appDataDir, previousWallpaperPath)) {
				await fileService.deleteFile(previousWallpaperPath);
			}
		} catch (error) {
			console.warn("Failed to delete theme wallpaper:", error);
		}
	};

	const handleFitChange = async (event: SelectChangeEvent<ThemeWallpaperFit>) => {
		await updateDraftAndSave({
			...draft,
			fit: event.target.value as ThemeWallpaperFit,
		});
	};

	const handlePositionChange = async (
		event: SelectChangeEvent<ThemeWallpaperPosition>,
	) => {
		await updateDraftAndSave({
			...draft,
			position: event.target.value as ThemeWallpaperPosition,
		});
	};

	const handleSliderDraft = (key: "overlayOpacity" | "surfaceOpacity" | "blurPx") => {
		return (_event: Event, value: number | number[]) => {
			setDraft((prev) => ({
				...prev,
				[key]: Array.isArray(value) ? value[0] : value,
			}));
		};
	};

	const handleSliderCommit = (key: "overlayOpacity" | "surfaceOpacity" | "blurPx") => {
		return async (_event: Event | SyntheticEvent, value: number | number[]) => {
			await updateDraftAndSave({
				...draft,
				[key]: Array.isArray(value) ? value[0] : value,
			});
		};
	};

	return (
		<SettingsGroup
			title={t("pages.Settings.appearance.title", "主题外观")}
			description={t(
				"pages.Settings.appearance.description",
				"上传你喜欢的图片作为应用背景，并通过遮罩、透明度和模糊度调节可读性。",
			)}
		>
			<SettingsItem
				title={t("pages.Settings.appearance.enable", "启用自定义主题")}
				description={t(
					"pages.Settings.appearance.enableDescription",
					"壁纸层会和现有的浅色、深色与跟随系统模式一起工作。",
				)}
			>
				<Switch
					checked={draft.enabled}
					disabled={isSaving}
					onChange={(event) => void handleEnabledChange(event.target.checked)}
					color="primary"
				/>
			</SettingsItem>

			<SettingsItem
				stacked
				title={t("pages.Settings.appearance.wallpaper", "主题壁纸")}
				description={t(
					"pages.Settings.appearance.wallpaperDescription",
					"图片会复制到应用数据目录，删除原文件不会影响主题。",
				)}
			>
				<Stack spacing={2}>
					<Box
						sx={{
							position: "relative",
							minHeight: 180,
							borderRadius: 2,
							overflow: "hidden",
							border: "1px solid var(--mui-palette-divider)",
							backgroundColor: "var(--mui-palette-background-default)",
							backgroundImage: wallpaperUrl ? "url(" + wallpaperUrl + ")" : "none",
							backgroundSize:
								draft.fit === "fill"
									? "100% 100%"
									: draft.fit === "repeat"
										? "auto"
										: draft.fit,
							backgroundRepeat: draft.fit === "repeat" ? "repeat" : "no-repeat",
							backgroundPosition: draft.position,
						}}
					>
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								backgroundColor: "rgba(15, 23, 42, " + draft.overlayOpacity / 100 + ")",
							}}
						/>
						<Stack
							alignItems="center"
							justifyContent="center"
							sx={{ position: "absolute", inset: 0, color: "common.white", p: 2 }}
						>
							<WallpaperIcon />
							<Typography variant="body2" className="mt-2 text-center">
								{wallpaperUrl
									? t("pages.Settings.appearance.preview", "主题预览")
									: t("pages.Settings.appearance.emptyPreview", "尚未选择壁纸")}
							</Typography>
						</Stack>
					</Box>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<Button
							variant="contained"
							startIcon={<UploadIcon />}
							disabled={isSaving}
							onClick={() => void handleSelectWallpaper()}
						>
							{t("pages.Settings.appearance.upload", "上传图片")}
						</Button>
						<Button
							variant="outlined"
							color="error"
							startIcon={<DeleteOutlineIcon />}
							disabled={isSaving || !draft.wallpaperPath}
							onClick={() => void handleRemoveWallpaper()}
						>
							{t("pages.Settings.appearance.remove", "移除壁纸")}
						</Button>
						<Button
							variant="text"
							startIcon={<RestartAltIcon />}
							disabled={isSaving}
							onClick={() => void handleReset()}
						>
							{t("pages.Settings.appearance.reset", "重置")}
						</Button>
					</Stack>
				</Stack>
			</SettingsItem>

			<SettingsItem title={t("pages.Settings.appearance.fit", "壁纸显示方式")}>
				<Stack direction="row" spacing={1} className="w-80 max-w-full">
					<Select
						size="small"
						value={draft.fit}
						onChange={handleFitChange}
						disabled={isSaving}
						className="flex-1"
					>
						{fitOptions.map((fit) => (
							<MenuItem key={fit} value={fit}>
								{getFitLabel(t, fit)}
							</MenuItem>
						))}
					</Select>
					<Select
						size="small"
						value={draft.position}
						onChange={handlePositionChange}
						disabled={isSaving}
						className="flex-1"
					>
						{positionOptions.map((position) => (
							<MenuItem key={position} value={position}>
								{getPositionLabel(t, position)}
							</MenuItem>
						))}
					</Select>
				</Stack>
			</SettingsItem>

			<SettingsItem
				title={t("pages.Settings.appearance.overlay", "壁纸遮罩")}
				description={t("pages.Settings.appearance.overlayDescription", "数值越高，图片越暗，文字越清晰。")}
			>
				<Slider
					value={draft.overlayOpacity}
					min={0}
					max={90}
					step={1}
					valueLabelDisplay="auto"
					valueLabelFormat={formatPercent}
					disabled={isSaving}
					onChange={handleSliderDraft("overlayOpacity")}
					onChangeCommitted={handleSliderCommit("overlayOpacity")}
					className="w-64 max-w-full"
				/>
			</SettingsItem>

			<SettingsItem
				title={t("pages.Settings.appearance.surfaceOpacity", "面板透明度")}
				description={t("pages.Settings.appearance.surfaceOpacityDescription", "数值越低，面板下方显示的壁纸越多。")}
			>
				<Slider
					value={draft.surfaceOpacity}
					min={55}
					max={100}
					step={1}
					valueLabelDisplay="auto"
					valueLabelFormat={formatPercent}
					disabled={isSaving}
					onChange={handleSliderDraft("surfaceOpacity")}
					onChangeCommitted={handleSliderCommit("surfaceOpacity")}
					className="w-64 max-w-full"
				/>
			</SettingsItem>

			<SettingsItem
				title={t("pages.Settings.appearance.blur", "壁纸模糊")}
				description={t("pages.Settings.appearance.blurDescription", "适当模糊可以减少细节过多带来的视觉干扰。")}
			>
				<Slider
					value={draft.blurPx}
					min={0}
					max={24}
					step={1}
					valueLabelDisplay="auto"
					disabled={isSaving}
					onChange={handleSliderDraft("blurPx")}
					onChangeCommitted={handleSliderCommit("blurPx")}
					className="w-64 max-w-full"
				/>
			</SettingsItem>
		</SettingsGroup>
	);
};
