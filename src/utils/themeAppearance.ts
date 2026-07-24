import { convertFileSrc } from "@tauri-apps/api/core";
import { extname, join } from "pathe";
import type {
	ThemeAppearance,
	ThemeWallpaperFit,
	ThemeWallpaperPosition,
} from "@/types";

const FIT_OPTIONS: ThemeWallpaperFit[] = ["cover", "contain", "fill", "repeat"];
const POSITION_OPTIONS: ThemeWallpaperPosition[] = [
	"center",
	"top",
	"bottom",
	"left",
	"right",
];

export const THEME_WALLPAPER_EXTENSIONS = [
	"png",
	"jpg",
	"jpeg",
	"webp",
	"gif",
	"bmp",
	"avif",
];

export const THEME_WALLPAPER_FOLDER = "themes/wallpapers";

export const DEFAULT_THEME_APPEARANCE: ThemeAppearance = {
	enabled: false,
	wallpaperPath: null,
	fit: "cover",
	position: "center",
	overlayOpacity: 58,
	surfaceOpacity: 90,
	blurPx: 0,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
	const numberValue = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(numberValue)) return fallback;
	return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function normalizeChoice<T extends string>(
	value: unknown,
	options: readonly T[],
	fallback: T,
): T {
	return options.includes(value as T) ? (value as T) : fallback;
}

export function normalizeThemeAppearance(
	appearance?: ThemeAppearance | null,
): ThemeAppearance {
	return {
		...DEFAULT_THEME_APPEARANCE,
		...appearance,
		wallpaperPath: appearance?.wallpaperPath ?? null,
		fit: normalizeChoice(
			appearance?.fit,
			FIT_OPTIONS,
			DEFAULT_THEME_APPEARANCE.fit,
		),
		position: normalizeChoice(
			appearance?.position,
			POSITION_OPTIONS,
			DEFAULT_THEME_APPEARANCE.position,
		),
		overlayOpacity: clampNumber(
			appearance?.overlayOpacity,
			0,
			100,
			DEFAULT_THEME_APPEARANCE.overlayOpacity,
		),
		surfaceOpacity: clampNumber(
			appearance?.surfaceOpacity,
			35,
			100,
			DEFAULT_THEME_APPEARANCE.surfaceOpacity,
		),
		blurPx: clampNumber(
			appearance?.blurPx,
			0,
			40,
			DEFAULT_THEME_APPEARANCE.blurPx,
		),
	};
}

export function getThemeWallpaperUrl(path?: string | null): string | null {
	if (!path) return null;

	try {
		return convertFileSrc(path);
	} catch (error) {
		console.error("Failed to convert theme wallpaper path:", error);
		return null;
	}
}

export function buildThemeWallpaperPath(appDataDir: string, sourcePath: string) {
	const ext = extname(sourcePath).toLowerCase() || ".png";
	return join(appDataDir, THEME_WALLPAPER_FOLDER, "wallpaper-" + Date.now() + ext);
}

export function isManagedThemeWallpaper(
	appDataDir: string,
	wallpaperPath?: string | null,
) {
	if (!wallpaperPath) return false;
	const managedFolder = join(appDataDir, THEME_WALLPAPER_FOLDER).replace(/\\/g, "/");
	const normalizedPath = wallpaperPath.replace(/\\/g, "/");
	return normalizedPath.startsWith(managedFolder + "/");
}
