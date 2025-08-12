/*
 * Roman Empire Manifest
 *
 * This manifest tells Legacy's mod loader which data files make up the mod. When you
 * include a mod in the main menu mod list, the game reads the manifest and pulls
 * in each dataset. The key on the left of the updates object is the human‑readable
 * name that will show up in the mod list, suffixed by a '^' to indicate it's
 * a user mod (the default dataset uses '*'). The value on the right is the
 * filename of the JavaScript file that defines that dataset.
 */

G.DeclareManifest({
    name: 'Roman Empire Manifest',
    updates: {
        // Declare our Roman Empire dataset. The caret indicates a user mod.
        'Roman Empire^': 'roman_empire.js',
    },
});
