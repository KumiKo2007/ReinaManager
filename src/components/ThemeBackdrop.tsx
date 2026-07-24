import Box from "@mui/material/Box";
import { useColorScheme } from "@mui/material/styles";
import { useEffect, useMemo } from "react";
import { useAllSettings } from "@/hooks/queries/useSettings";
import {
	getThemeWallpaperUrl,
	normalizeThemeAppearance,
} from "@/utils/themeAppearance";

const SURFACE_BACKGROUND_VAR = "--reina-surface-bg";

function getBackgroundSize(fit: string) {
	if (fit === "fill") return "100% 100%";
	if (fit === "repeat") return "auto";
	return fit;
}

function getOverlayColor(mode: "light" | "dark", opacity: number) {
	return mode === "dark"
		? "rgba(2, 6, 23, " + opacity + ")"
		: "rgba(248, 250, 252, " + opacity + ")";
}

function getSurfaceBackground(mode: "light" | "dark", opacity: number) {
	return mode === "dark"
		? "rgba(24, 30, 40, " + opacity + ")"
		: "rgba(255, 255, 255, " + opacity + ")";
}

export const ThemeBackdrop = () => {
	const { data: settings } = useAllSettings();
	const { mode, systemMode } = useColorScheme();
	const appearance = normalizeThemeAppearance(settings?.theme_appearance);
	const wallpaperUrl = useMemo(
		() =>
			appearance.enabled
				? getThemeWallpaperUrl(appearance.wallpaperPath)
				: null,
		[appearance.enabled, appearance.wallpaperPath],
	);
	const isActive = appearance.enabled && Boolean(wallpaperUrl);
	const resolvedMode: "light" | "dark" =
		mode === "dark" || mode === "light" ? mode : systemMode ?? "light";

	useEffect(() => {
		const root = document.documentElement;

		if (!isActive) {
			root.style.removeProperty(SURFACE_BACKGROUND_VAR);
			return;
		}

		root.style.setProperty(
			SURFACE_BACKGROUND_VAR,
			getSurfaceBackground(resolvedMode, appearance.surfaceOpacity / 100),
		);

		return () => {
			root.style.removeProperty(SURFACE_BACKGROUND_VAR);
		};
	}, [appearance.surfaceOpacity, isActive, resolvedMode]);

	if (!isActive || !wallpaperUrl) return null;

	const overlayOpacity = appearance.overlayOpacity / 100;
	const blurPx = appearance.blurPx;

	return (
		<Box
			aria-hidden="true"
			sx={{
				position: "fixed",
				inset: 0,
				zIndex: 0,
				overflow: "hidden",
				pointerEvents: "none",
			}}
		>
			<Box
				sx={{
					position: "absolute",
					inset: blurPx > 0 ? -32 : 0,
					backgroundImage: "url(" + wallpaperUrl + ")",
					backgroundPosition: appearance.position,
					backgroundRepeat: appearance.fit === "repeat" ? "repeat" : "no-repeat",
					backgroundSize: getBackgroundSize(appearance.fit),
					filter: blurPx > 0 ? "blur(" + blurPx + "px)" : "none",
					transform: blurPx > 0 ? "scale(1.04)" : "none",
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					backgroundColor: getOverlayColor(resolvedMode, overlayOpacity),
				}}
			/>
		</Box>
	);
};
