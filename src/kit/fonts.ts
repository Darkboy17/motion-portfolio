// Font loading. Every font is from Google Fonts under the SIL Open Font License
// (see ASSETS.md). Loading here blocks rendering until the faces are ready.
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const latin = { subsets: ["latin"] as "latin"[] };

loadManrope("normal", { weights: ["400", "500", "600", "700", "800"], ...latin });
loadFraunces("normal", { weights: ["300", "400", "600", "800"], ...latin });
loadFraunces("italic", { weights: ["300", "400", "600"], ...latin });
loadJetBrains("normal", { weights: ["400", "500", "700"], ...latin });
